/* matcha.js - V5 Full Modular Architecture */
import MarkdowmParse from "./models/markdowmParse.js";
import ProgressBar from "./models/progressBar.js";
import Style from "./models/style.js";
import Layout from "./models/layout.js";
import Transition from "./models/transition.js";

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

    // 进度条（延迟到 start 时初始化 DOM）
    this.modules.progressBar = new ProgressBar(this.config.progressBar);

    // 样式模块
    this.modules.style = new Style(this.config.style);

    // 布局模块
    this.modules.layout = new Layout(this.config.layout);

    // 过渡动画模块
    this.modules.transition = new Transition(this.config.transition);
  }

  /**
   * 使用插件/模块
   * @param {Object|Function} module - 模块类或实例
   * @param {Object} options - 模块配置
   * @returns {Matcha} 返回 this 支持链式调用
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
   * @returns {Matcha} 返回 this 支持链式调用
   */
  start() {
    const scriptTag = document.getElementById(this.config.scriptId);
    if (!scriptTag) return this;

    // 初始化需要 DOM 的模块
    this.modules.progressBar.init(this);
    this.modules.style.init(this);
    this.modules.layout.init(this);
    this.modules.transition.init(this);

    const rawMarkdown = scriptTag.textContent;
    this.parseAndBuild(rawMarkdown);
    this.bindEvents();
    this.goto(0);

    return this;
  }

  /**
   * 解析并构建幻灯片
   * @param {string} markdown - Markdown 内容
   */
  parseAndBuild(markdown) {
    const stage = document.getElementById(this.config.containerId);
    stage.innerHTML = "";

    // 1. 切分幻灯片 (---)
    const slideBlocks = markdown.split(/^\s*---\s*$/gm);

    slideBlocks.forEach((block) => {
      if (!block.trim()) return;

      // 2. 解析过渡指令
      const { cleanBlock: afterTransition } =
        this.modules.transition.parseTransitionDirective(block);

      // 3. 解析样式指令
      const { cleanBlock: afterStyle, styles } =
        this.modules.style.parseStyleDirective(afterTransition);

      // 4. 解析布局指令
      const { cleanBlock, layoutType, layoutParams } =
        this.modules.layout.parseLayoutDirective(afterStyle);

      // 5. 使用布局模块构建 DOM
      const slideDiv = this.modules.layout.buildLayout(
        cleanBlock,
        layoutType,
        layoutParams,
        (text) => this.renderMarkdown(text)
      );

      // 6. 应用单页样式
      if (Object.keys(styles).length > 0) {
        this.modules.style.applySlideStyle(slideDiv, styles);
      }

      stage.appendChild(slideDiv);
      this.slidesElements.push(slideDiv);
    });
  }

  /**
   * 渲染 Markdown 为 HTML
   * @param {string} text - Markdown 文本
   * @returns {string} HTML 字符串
   */
  renderMarkdown(text) {
    return this.modules.markdowmParse.parse(text);
  }

  /**
   * 跳转到指定幻灯片
   * @param {number} index - 幻灯片索引
   */
  goto(index) {
    if (index < 0 || index >= this.slidesElements.length) return;
    this.currentSlideIndex = index;

    this.slidesElements.forEach((el, i) => {
      el.classList.remove("active", "past");
      if (i === index) el.classList.add("active");
      else if (i < index) el.classList.add("past");
    });

    // 更新进度条
    this.modules.progressBar.update(index, this.slidesElements.length);
  }

  /**
   * 下一张幻灯片
   */
  next() {
    this.goto(this.currentSlideIndex + 1);
  }

  /**
   * 上一张幻灯片
   */
  prev() {
    this.goto(this.currentSlideIndex - 1);
  }

  /**
   * 绑定键盘事件
   */
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
    });

    // 点击切换
    document.addEventListener("click", (e) => {
      // 排除链接点击
      if (e.target.tagName === "A") return;
      this.next();
    });
  }

  /**
   * 销毁 Matcha 实例
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
