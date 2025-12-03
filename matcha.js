/* matcha.js - V6 Per-slide Config & Fragment Support */
import MarkdowmParse from "./models/markdowmParse.js";
import ProgressBar from "./models/progressBar.js";
import Style from "./models/style.js";
import Layout from "./models/layout.js";
import Transition from "./models/transition.js";
import Fragment from "./models/fragment.js";

class Matcha {
  constructor(config = {}) {
    this.config = {
      containerId: config.containerId || "matcha-stage",
      scriptId: config.scriptId || "matcha-source",
      progressBar: config.progressBar || {},
      markdowmParse: config.markdowmParse || {},
      style: config.style || {},
      layout: config.layout || {},
      transition: config.transition || {},
      fragment: config.fragment || {},
    };
    this.slidesElements = [];
    this.currentSlideIndex = 0;
    this.modules = {};
    this._initModules();
  }

  _initModules() {
    this.modules.markdowmParse = new MarkdowmParse(this.config.markdowmParse);
    this.modules.markdowmParse.init(this);

    this.modules.progressBar = new ProgressBar(this.config.progressBar);
    this.modules.style = new Style(this.config.style);
    this.modules.layout = new Layout(this.config.layout);
    this.modules.transition = new Transition(this.config.transition);
    this.modules.fragment = new Fragment(this.config.fragment);
  }

  use(module, options = {}) {
    if (typeof module === "function") {
      const instance = new module(options);
      instance.init(this);
      this.modules[instance.constructor.name] = instance;
    } else if (typeof module === "object" && module.init) {
      module.init(this);
      this.modules[module.constructor.name] = module;
    }
    return this;
  }

  start() {
    const scriptTag = document.getElementById(this.config.scriptId);
    if (!scriptTag) return this;

    this.modules.progressBar.init(this);
    this.modules.style.init(this);
    this.modules.layout.init(this);
    this.modules.transition.init(this);
    this.modules.fragment.init(this);

    const rawMarkdown = scriptTag.textContent;
    this.parseAndBuild(rawMarkdown);
    this.bindEvents();
    this.goto(0);

    return this;
  }

  parseAndBuild(markdown) {
    const stage = document.getElementById(this.config.containerId);
    stage.innerHTML = "";

    const slideBlocks = markdown.split(/^\s*---\s*$/gm);
    let slideIndex = 0;

    slideBlocks.forEach((block) => {
      if (!block.trim()) return;

      // 1. 解析过渡指令
      const { cleanBlock: afterTransition, transitionConfig } =
        this.modules.transition.parseTransitionDirective(block);

      // 2. 解析样式/主题指令
      const {
        cleanBlock: afterStyle,
        themeName,
        styles,
      } = this.modules.style.parseStyleDirective(afterTransition);

      // 3. 解析布局指令
      const { cleanBlock, layoutType, layoutParams } =
        this.modules.layout.parseLayoutDirective(afterStyle);

      // 4. 构建 DOM，使用 fragment 模块解析分步
      const currentSlideIndex = slideIndex;
      const slideDiv = this.modules.layout.buildLayout(
        cleanBlock,
        layoutType,
        layoutParams,
        (text) => {
          // 使用 fragment 模块解析并渲染（在 Markdown 渲染之前处理 step 标记）
          return this.modules.fragment.parseAndRender(
            text,
            currentSlideIndex,
            (content) => this.modules.markdowmParse.parse(content)
          );
        }
      );

      // 5. 应用每页独立的主题
      this.modules.style.applySlideTheme(slideDiv, themeName, styles);

      // 6. 应用每页独立的过渡配置
      this.modules.transition.applySlideTransition(slideDiv, transitionConfig);

      // 7. 初始化该页的分步状态
      this.modules.fragment.initSlide(slideDiv, slideIndex);

      stage.appendChild(slideDiv);
      this.slidesElements.push(slideDiv);
      slideIndex++;
    });
  }

  renderMarkdown(text) {
    return this.modules.markdowmParse.parse(text);
  }

  goto(index, direction = "forward") {
    if (index < 0 || index >= this.slidesElements.length) return;

    this.currentSlideIndex = index;

    this.slidesElements.forEach((el, i) => {
      if (i === index) {
        this.modules.transition.updateSlideState(el, "active");
        el.classList.add("active");
        el.classList.remove("past");
      } else if (i < index) {
        this.modules.transition.updateSlideState(el, "leave");
        el.classList.add("past");
        el.classList.remove("active");
      } else {
        this.modules.transition.updateSlideState(el, "enter");
        el.classList.remove("active", "past");
      }
    });

    if (direction === "forward") {
      this.modules.fragment.resetSlide(index);
    } else {
      this.modules.fragment.showAllSteps(index);
    }

    this.modules.progressBar.update(index, this.slidesElements.length);
  }

  next() {
    const currentIndex = this.currentSlideIndex;

    if (this.modules.fragment.hasNextStep(currentIndex)) {
      this.modules.fragment.nextStep(currentIndex);
      return;
    }

    if (currentIndex < this.slidesElements.length - 1) {
      this.goto(currentIndex + 1, "forward");
    }
  }

  prev() {
    const currentIndex = this.currentSlideIndex;

    if (this.modules.fragment.hasPrevStep(currentIndex)) {
      this.modules.fragment.prevStep(currentIndex);
      return;
    }

    if (currentIndex > 0) {
      this.goto(currentIndex - 1, "backward");
    }
  }

  bindEvents() {
    document.addEventListener("keydown", (e) => {
      if (["ArrowRight", "ArrowDown", " ", "Enter"].includes(e.key)) {
        e.preventDefault();
        this.next();
      }
      if (["ArrowLeft", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        this.prev();
      }
      if (e.key === "Home") {
        e.preventDefault();
        this.goto(0, "forward");
      }
      if (e.key === "End") {
        e.preventDefault();
        this.goto(this.slidesElements.length - 1, "forward");
      }
    });

    document.addEventListener("click", (e) => {
      if (e.target.closest("a, button, input, textarea")) return;
      this.next();
    });

    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.prev();
    });
  }

  destroy() {
    Object.values(this.modules).forEach((module) => {
      if (module.destroy) module.destroy();
    });
    this.modules = {};
    this.slidesElements = [];
  }
}

export default Matcha;
window.Matcha = Matcha;
