/* matcha.js - V8 Component System & Per-slide Config */
import MarkdowmParse from "./models/markdowmParse.js";
import ProgressBar from "./models/progressBar.js";
import Style from "./models/style.js";
import Layout from "./models/layout.js";
import Transition from "./models/transition.js";
import Fragment from "./models/fragment.js";
import Highlight from "./models/highlight.js";
import Card from "./models/card.js";
import Video from "./models/video.js";
import Audio from "./models/audio.js";
import Image from "./models/image.js";
import Iframe from "./models/iframe.js";
import MathSupport from "./models/math.js";
import Component from "./models/component.js";
import Code from "./models/code.js";

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
      highlight: config.highlight || {},
      card: config.card || {},
      video: config.video || {},
      audio: config.audio || {},
      image: config.image || {},
      iframe: config.iframe || {},
      math: config.math || {},
      component: config.component || {},
      code: config.code || {},
    };
    this.slidesElements = [];
    this.slideComponentUsages = []; // 每个幻灯片的组件使用信息
    this.globalComponentUsages = []; // 全局组件使用信息（应用到所有页面）
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
    this.modules.highlight = new Highlight(this.config.highlight);
    this.modules.card = new Card(this.config.card);
    this.modules.video = new Video(this.config.video);
    this.modules.audio = new Audio(this.config.audio);
    this.modules.image = new Image(this.config.image);
    this.modules.iframe = new Iframe(this.config.iframe);
    this.modules.math = new MathSupport(this.config.math);
    this.modules.component = new Component(this.config.component);
    this.modules.code = new Code(this.config.code);
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
    this.modules.highlight.init(this);
    this.modules.card.init(this);
    this.modules.video.init(this);
    this.modules.audio.init(this);
    this.modules.image.init(this);
    this.modules.iframe.init(this);
    this.modules.math.init(this);
    this.modules.component.init(this);
    this.modules.code.init(this);

    const rawMarkdown = scriptTag.textContent;
    this.parseAndBuild(rawMarkdown);
    this.bindEvents();
    this.goto(0);

    return this;
  }

  parseAndBuild(markdown) {
    const stage = document.getElementById(this.config.containerId);
    stage.innerHTML = "";
    // 关键：重建时必须清空旧的 slide 引用，否则二次渲染后 goto() 可能激活到已脱离 DOM 的旧节点，
    // 导致新 slide 没有 active（默认 opacity=0），最终整屏空白。
    this.slidesElements = [];
    this.slideComponentUsages = [];

    // 0. 解析 ---global 分隔符，将全局定义区和幻灯片内容区分开
    let globalSection = "";
    let slidesSection = markdown;
    
    const globalMatch = markdown.match(/^([\s\S]*?)---global\s*$/m);
    if (globalMatch) {
      globalSection = globalMatch[1];
      slidesSection = markdown.slice(globalMatch[0].length);
    }

    // 0.1. 组件系统：从全局区域提取所有组件定义
    let processedGlobal = this.modules.component.extractDefinitions(globalSection);

    // 0.2. 样式系统：从全局区域提取全局样式定义
    processedGlobal = this.modules.style.extractGlobalStyles(processedGlobal);

    // 0.3. 从全局区域提取组件使用（这些组件会应用到所有页面）
    const { componentUsages: globalComponentUsages } =
      this.modules.component.processSlide(processedGlobal, 0, 0);
    this.globalComponentUsages = globalComponentUsages;

    // 0.4. 也从幻灯片区域提取（向后兼容）
    let processedMarkdown = this.modules.component.extractDefinitions(slidesSection);
    processedMarkdown = this.modules.style.extractGlobalStyles(processedMarkdown);

    const slideBlocks = processedMarkdown.split(/^\s*---\s*$/gm);
    const totalSlides = slideBlocks.filter((b) => b.trim()).length;
    let slideIndex = 0;

    slideBlocks.forEach((block) => {
      if (!block.trim()) return;

      // 0.5. 组件系统：处理当前幻灯片中的组件使用，提取组件信息
      const { cleanContent, componentUsages } =
        this.modules.component.processSlide(block, slideIndex, totalSlides);

      // 存储该幻灯片的组件使用信息
      this.slideComponentUsages.push(componentUsages);

      // 1. 解析过渡指令
      const { cleanBlock: afterTransition, transitionConfig } =
        this.modules.transition.parseTransitionDirective(cleanContent);

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
          // 0. Math Preprocess: 提取公式防止被 Markdown 破坏
          const mathCleaned = this.modules.math.preprocess(text);

          // 使用 fragment 模块解析并渲染（在 Markdown 渲染之前处理 step 标记）
          return this.modules.fragment.parseAndRender(
            mathCleaned,
            currentSlideIndex,
            (content) => {
              // 先处理卡片，再处理视频/音频/Iframe，最后处理 Markdown
              const cardContent = this.modules.card.parse(content);
              const videoContent = this.modules.video.parse(cardContent);
              const audioContent = this.modules.audio.parse(videoContent);
              const imageContent = this.modules.image.parse(audioContent);
              const iframeContent = this.modules.iframe.parse(imageContent);
              const codeContent = this.modules.code.parse(iframeContent);
              const html = this.modules.markdowmParse.parse(codeContent);
              // Math Postprocess: 还原并渲染公式
              return this.modules.math.postprocess(html);
            }
          );
        }
      );

      // 5. 应用每页独立的主题
      this.modules.style.applySlideTheme(slideDiv, themeName, styles);

      // 6. 应用每页独立的过渡配置
      this.modules.transition.applySlideTransition(slideDiv, transitionConfig);

      // 7. 初始化该页的分步状态
      this.modules.fragment.initSlide(slideDiv, slideIndex);

      // 8. 增强代码块显示
      this.modules.code.enhance(slideDiv);

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

    // 渲染当前幻灯片的组件（固定位置）
    // 合并全局组件和当前页面组件
    const globalUsages = (this.globalComponentUsages || []).map(u => ({
      ...u,
      slideIndex: index,
      totalSlides: this.slidesElements.length
    }));
    const slideUsages = this.slideComponentUsages[index] || [];
    const allUsages = [...globalUsages, ...slideUsages];
    
    this.modules.component.renderComponents(
      index,
      this.slidesElements.length,
      allUsages
    );

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
