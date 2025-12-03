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
      // 模块配置
      progressBar: config.progressBar || {},
      markdowmParse: config.markdowmParse || {},
      style: config.style || {},
      layout: config.layout || {},
      transition: config.transition || {},
      fragment: config.fragment || {},
    };
    this.slidesElements = [];
    this.currentSlideIndex = 0;

    // 初始化模块
    this.modules = {};
    this._initModules();
  }

  /**
   * 初始化内置模块
   * @private
   */
  _initModules() {
    // Markdown 解析器
    this.modules.markdowmParse = new MarkdowmParse(this.config.markdowmParse);
    this.modules.markdowmParse.init(this);

    // 进度条
    this.modules.progressBar = new ProgressBar(this.config.progressBar);

    // 样式模块（每页独立）
    this.modules.style = new Style(this.config.style);

    // 布局模块
    this.modules.layout = new Layout(this.config.layout);

    // 过渡动画模块（每页独立）
    this.modules.transition = new Transition(this.config.transition);

    // 分步展示模块
    this.modules.fragment = new Fragment(this.config.fragment);
  }

  /**
   * 使用插件/模块
   */
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

  /**
   * 启动 Matcha
   */
  start() {
    const scriptTag = document.getElementById(this.config.scriptId);
    if (!scriptTag) return this;

    // 初始化需要 DOM 的模块
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

  /**
   * 解析并构建幻灯片
   */
  parseAndBuild(markdown) {
    const stage = document.getElementById(this.config.containerId);
    stage.innerHTML = "";

    // 切分幻灯片
    const slideBlocks = markdown.split(/^\s*---\s*$/gm);
    let slideIndex = 0;

    slideBlocks.forEach((block) => {
      if (!block.trim()) return;

      // 1. 解析过渡指令（每页独立）
      const { cleanBlock: afterTransition, transitionConfig } =
        this.modules.transition.parseTransitionDirective(block);

      // 2. 解析样式/主题指令（每页独立）
      const {
        cleanBlock: afterStyle,
        themeName,
        styles,
      } = this.modules.style.parseStyleDirective(afterTransition);

      // 3. 解析布局指令
      const { cleanBlock, layoutType, layoutParams } =
        this.modules.layout.parseLayoutDirective(afterStyle);

      // 4. 构建 DOM
      const slideDiv = this.modules.layout.buildLayout(
        cleanBlock,
        layoutType,
        layoutParams,
        (text) => this.renderMarkdown(text)
      );

      // 5. 应用每页独立的主题
      this.modules.style.applySlideTheme(slideDiv, themeName, styles);

      // 6. 应用每页独立的过渡配置
      this.modules.transition.applySlideTransition(slideDiv, transitionConfig);

      // 7. 初始化该页的分步状态
      this.modules.fragment.initSlideFragments(slideDiv, slideIndex);

      stage.appendChild(slideDiv);
      this.slidesElements.push(slideDiv);
      slideIndex++;
    });
  }

  /**
   * 渲染 Markdown 为 HTML
   */
  renderMarkdown(text) {
    return this.modules.markdowmParse.parse(text);
  }

  /**
   * 跳转到指定幻灯片
   */
  goto(index, direction = "forward") {
    if (index < 0 || index >= this.slidesElements.length) return;

    const prevIndex = this.currentSlideIndex;
    this.currentSlideIndex = index;

    // 更新所有幻灯片状态
    this.slidesElements.forEach((el, i) => {
      if (i === index) {
        // 当前页
        this.modules.transition.updateSlideState(el, "active");
        el.classList.add("active");
        el.classList.remove("past");
      } else if (i < index) {
        // 过去的页
        this.modules.transition.updateSlideState(el, "leave");
        el.classList.add("past");
        el.classList.remove("active");
      } else {
        // 未来的页
        this.modules.transition.updateSlideState(el, "enter");
        el.classList.remove("active", "past");
      }
    });

    // 分步状态处理
    if (direction === "forward") {
      // 往前走：重置新页面的分步
      this.modules.fragment.resetSlide(index);
    } else {
      // 往回走：显示所有分步
      this.modules.fragment.showAllSteps(index);
    }

    // 更新进度条
    this.modules.progressBar.update(index, this.slidesElements.length);
  }

  /**
   * 下一步（先处理分步，再切换页面）
   */
  next() {
    const currentIndex = this.currentSlideIndex;

    // 检查是否有分步需要显示
    if (this.modules.fragment.hasNextStep(currentIndex)) {
      this.modules.fragment.nextStep(currentIndex);
      return;
    }

    // 没有更多分步，切换到下一页
    if (currentIndex < this.slidesElements.length - 1) {
      this.goto(currentIndex + 1, "forward");
    }
  }

  /**
   * 上一步（先回退分步，再切换页面）
   */
  prev() {
    const currentIndex = this.currentSlideIndex;

    // 检查是否有分步可以回退
    if (this.modules.fragment.hasPrevStep(currentIndex)) {
      this.modules.fragment.prevStep(currentIndex);
      return;
    }

    // 没有更多分步可回退，切换到上一页
    if (currentIndex > 0) {
      this.goto(currentIndex - 1, "backward");
    }
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 键盘事件
    document.addEventListener("keydown", (e) => {
      // 右/下/空格/Enter = 下一步
      if (["ArrowRight", "ArrowDown", " ", "Enter"].includes(e.key)) {
        e.preventDefault();
        this.next();
      }
      // 左/上 = 上一步
      if (["ArrowLeft", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        this.prev();
      }
      // Home = 第一页
      if (e.key === "Home") {
        e.preventDefault();
        this.goto(0, "forward");
      }
      // End = 最后一页
      if (e.key === "End") {
        e.preventDefault();
        this.goto(this.slidesElements.length - 1, "forward");
      }
    });

    // 点击事件 = 下一步
    document.addEventListener("click", (e) => {
      // 排除链接和按钮点击
      if (e.target.closest("a, button, input, textarea")) return;
      this.next();
    });

    // 右键 = 上一步
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.prev();
    });
  }

  /**
   * 销毁
   */
  destroy() {
    Object.values(this.modules).forEach((module) => {
      if (module.destroy) module.destroy();
    });
    this.modules = {};
    this.slidesElements = [];
  }
}

// 导出
export default Matcha;
window.Matcha = Matcha;
