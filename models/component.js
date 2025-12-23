/**
 * @module component
 * @description 组件化模块 - 定义可复用的固定位置组件，支持参数传递和模板渲染
 * @version 2.0.0
 * @author jae
 *
 * @syntax
 * 组件定义（在第一个 --- 之前，无需额外分隔）:
 *   <!-- define: componentName, position=bottom-right -->
 *   组件内容，使用 {{param}} 作为参数占位符
 *   <!-- enddefine -->
 *
 * 组件使用:
 *   <!-- @componentName: param1=value1, param2=value2 -->
 *   <!-- @componentName: param1=value1, position=top-left -->  (可覆盖位置)
 *
 * 位置参数 (position):
 *   top-left     左上角
 *   top          正上方
 *   top-right    右上角
 *   left         正左边
 *   center       中间
 *   right        正右边
 *   bottom-left  左下角
 *   bottom       正下方
 *   bottom-right 右下角
 *
 * 内置变量:
 *   {{$slideNumber}}  - 当前页码 (1-based)
 *   {{$totalSlides}}  - 总页数
 *   {{$slideIndex}}   - 当前索引 (0-based)
 *
 * 条件渲染:
 *   {{#if condition}}内容{{/if}}
 *   {{#if condition}}内容{{#else}}其他内容{{/if}}
 *   {{#eq param value}}相等时显示{{/eq}}
 *   {{#neq param value}}不相等时显示{{/neq}}
 *
 * 循环渲染:
 *   {{#repeat count}}重复内容 {{$i}}{{/repeat}}
 */
class Component {
  constructor(options = {}) {
    this.options = {
      // 定义组件的正则（支持 position 参数）
      definePattern:
        /<!--\s*define:\s*([\w-]+)(?:\s*,\s*(.+?))?\s*-->([\s\S]*?)<!--\s*enddefine\s*-->/g,
      // 使用组件的正则
      usePattern: /<!--\s*@([\w-]+)(?::\s*(.+?))?\s*-->/g,
      // 变量替换的正则
      varPattern: /\{\{(\$?[\w-]+)\}\}/g,
      // 默认位置
      defaultPosition: "bottom-right",
      ...options,
    };

    // 位置映射到 CSS
    this.positionStyles = {
      "top-left": { top: "20px", left: "20px" },
      top: { top: "20px", left: "50%", transform: "translateX(-50%)" },
      "top-right": { top: "20px", right: "20px" },
      left: { top: "50%", left: "20px", transform: "translateY(-50%)" },
      center: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
      right: { top: "50%", right: "20px", transform: "translateY(-50%)" },
      "bottom-left": { bottom: "40px", left: "20px" },
      bottom: { bottom: "40px", left: "50%", transform: "translateX(-50%)" },
      "bottom-right": { bottom: "40px", right: "20px" },
    };

    this.matcha = null;
    this.components = {}; // 存储定义的组件
    this.globalVars = {}; // 全局变量
    this.activeInstances = []; // 当前活跃的组件实例 DOM 元素
    this.componentContainer = null; // 组件容器
    this.styleElement = null;
  }

  /**
   * 初始化模块
   * @param {Matcha} matcha - Matcha 实例引用
   */
  init(matcha) {
    this.matcha = matcha;
    this._injectStyles();
    this._createContainer();
  }

  /**
   * 注入组件样式
   * @private
   */
  _injectStyles() {
    this.styleElement = document.createElement("style");
    this.styleElement.id = "matcha-component-module";
    this.styleElement.textContent = `
/* Matcha Component Module - Fixed Position Components */
:root {
  --comp-pad-top: 0px;
  --comp-pad-bottom: 0px;
  --comp-pad-left: 0px;
  --comp-pad-right: 0px;
}

.matcha-slide {
  padding-top: calc(20px + var(--comp-pad-top)) !important;
  padding-bottom: calc(20px + var(--comp-pad-bottom)) !important;
  padding-left: calc(20px + var(--comp-pad-left)) !important;
  padding-right: calc(20px + var(--comp-pad-right)) !important;
}

.matcha-component-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

.matcha-component {
  position: fixed;
  pointer-events: auto;
  z-index: 1001;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

/* 高亮模式下降低透明度 */
body.matcha-highlight-active .matcha-component {
  opacity: var(--dim-opacity, 0.2);
  pointer-events: none;
}

.matcha-component.hidden {
  opacity: 0;
  pointer-events: none;
}

/* 组件内部样式重置 */
.matcha-component > * {
  margin: 0;
}

/* 自动排版容器：让组件内部多元素垂直排列、左对齐并留间距 */
.matcha-component-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;   /* 垂直居中对齐所有元素 */
  text-align: center;    /* 文本与图片居中排布 */
  word-break: break-word;
}

.matcha-component-content img {
  max-width: 100%;
  height: auto;
  display: block;
}
    `;
    document.head.appendChild(this.styleElement);
  }

  /**
   * 创建组件容器
   * @private
   */
  _createContainer() {
    this.componentContainer = document.createElement("div");
    this.componentContainer.className = "matcha-component-container";
    this.componentContainer.id = "matcha-components";
    document.body.appendChild(this.componentContainer);
  }

  /**
   * 从完整 Markdown 中提取组件定义
   * 应在 parseAndBuild 之前调用
   * @param {string} markdown - 完整的 Markdown 内容
   * @returns {string} 移除组件定义后的 Markdown
   */
  extractDefinitions(markdown) {
    let cleanMarkdown = markdown;

    // 重置正则索引
    this.options.definePattern.lastIndex = 0;

    // 提取所有组件定义
    let match;
    while ((match = this.options.definePattern.exec(markdown)) !== null) {
      const componentName = match[1].trim();
      const paramsStr = match[2] || "";
      const componentTemplate = match[3].trim();

      // 解析定义时的参数（如 position）
      const defineParams = this._parseParams(paramsStr);

      this.components[componentName] = {
        name: componentName,
        template: componentTemplate,
        position: defineParams.position || this.options.defaultPosition,
        usageCount: 0,
      };

      console.log(
        `[Component] 已注册组件: ${componentName} (位置: ${this.components[componentName].position})`
      );
    }

    // 从 Markdown 中移除组件定义
    cleanMarkdown = markdown.replace(this.options.definePattern, "");

    return cleanMarkdown;
  }

  /**
   * 处理单个幻灯片中的组件使用，返回使用信息而不是替换内容
   * @param {string} content - 幻灯片内容
   * @param {number} slideIndex - 当前幻灯片索引
   * @param {number} totalSlides - 总幻灯片数
   * @returns {Object} { cleanContent, componentUsages }
   */
  processSlide(content, slideIndex, totalSlides) {
    const componentUsages = [];

    // 重置正则索引
    this.options.usePattern.lastIndex = 0;

    // 查找所有组件使用
    const cleanContent = content.replace(
      this.options.usePattern,
      (fullMatch, componentName, paramsStr) => {
        const component = this.components[componentName];

        if (!component) {
          console.warn(`[Component] 未找到组件: ${componentName}`);
          return ""; // 移除未找到的组件标记
        }

        // 解析参数
        const params = this._parseParams(paramsStr || "");

        // 记录使用信息
        componentUsages.push({
          name: componentName,
          params,
          position: params.position || component.position,
          slideIndex,
          totalSlides,
        });

        return ""; // 从内容中移除组件标记
      }
    );

    return { cleanContent, componentUsages };
  }

  /**
   * 渲染并显示当前幻灯片的组件
   * @param {number} slideIndex - 当前幻灯片索引
   * @param {number} totalSlides - 总幻灯片数
   * @param {Array} usages - 组件使用信息数组
   */
  renderComponents(slideIndex, totalSlides, usages) {
    // 清除之前的组件实例
    this.clearComponents();

    // 设置内置变量
    const builtinVars = {
      $slideIndex: slideIndex,
      $slideNumber: slideIndex + 1,
      $totalSlides: totalSlides,
    };

    // 渲染每个组件
    usages.forEach((usage, index) => {
      const component = this.components[usage.name];
      if (!component) return;

      // 合并变量
      const allVars = { ...builtinVars, ...this.globalVars, ...usage.params };

      // 渲染模板
      const renderedContent = this._renderTemplate(component.template, allVars);

      // 创建组件 DOM
      const componentEl = document.createElement("div");
      componentEl.className = "matcha-component";
      componentEl.dataset.component = usage.name;
      componentEl.dataset.position = usage.position;

      // 应用位置样式
      const posStyles = this.positionStyles[usage.position] || this.positionStyles["bottom-right"];
      Object.assign(componentEl.style, posStyles);

      // 渲染 Markdown 内容
      if (this.matcha && this.matcha.modules.markdowmParse) {
        // 先处理卡片/媒体/代码等模块，再交给 Markdown 解析
        let processedContent = renderedContent;
        if (this.matcha.modules.card) {
          processedContent = this.matcha.modules.card.parse(processedContent);
        }
        if (this.matcha.modules.video) {
          processedContent = this.matcha.modules.video.parse(processedContent);
        }
        if (this.matcha.modules.audio) {
          processedContent = this.matcha.modules.audio.parse(processedContent);
        }
        if (this.matcha.modules.image) {
          processedContent = this.matcha.modules.image.parse(processedContent);
        }
        if (this.matcha.modules.iframe) {
          processedContent = this.matcha.modules.iframe.parse(processedContent);
        }
        if (this.matcha.modules.code) {
          processedContent = this.matcha.modules.code.parse(processedContent);
        }
        const parsed = this.matcha.modules.markdowmParse.parse(processedContent);
        componentEl.innerHTML = `<div class="matcha-component-content">${parsed}</div>`;
      } else {
        componentEl.innerHTML = `<div class="matcha-component-content">${renderedContent}</div>`;
      }

      this.componentContainer.appendChild(componentEl);
      this.activeInstances.push(componentEl);

      component.usageCount++;
    });

    // 渲染后计算并设置避让 Padding
    this._updateAvoidancePadding();
  }

  /**
   * 计算组件尺寸并设置 Slide Padding
   * @private
   */
  _updateAvoidancePadding() {
    let top = 0,
      bottom = 0,
      left = 0,
      right = 0;

    this.activeInstances.forEach((el) => {
      const pos = el.dataset.position || "bottom-right";
      const rect = el.getBoundingClientRect();

      // 简单的避让逻辑：取最大值
      if (pos.startsWith("top")) {
        top = Math.max(top, rect.height + 20); // 20px 额外间距
      }
      if (pos.startsWith("bottom")) {
        bottom = Math.max(bottom, rect.height + 20);
      }
      if (pos.startsWith("left") || pos === "left") {
        left = Math.max(left, rect.width + 20);
      }
      if (pos.startsWith("right") || pos === "right") {
        right = Math.max(right, rect.width + 20);
      }
    });

    const root = document.documentElement;
    root.style.setProperty("--comp-pad-top", `${top}px`);
    root.style.setProperty("--comp-pad-bottom", `${bottom}px`);
    root.style.setProperty("--comp-pad-left", `${left}px`);
    root.style.setProperty("--comp-pad-right", `${right}px`);
  }

  /**
   * 清除所有活跃的组件实例
   */
  clearComponents() {
    this.activeInstances.forEach((el) => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    this.activeInstances = [];
  }

  /**
   * 解析参数字符串
   * @private
   */
  _parseParams(paramStr) {
    const params = {};
    if (!paramStr) return params;

    // 支持复杂值，包含逗号的字符串
    const regex = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^,\s]+))/g;
    let match;

    while ((match = regex.exec(paramStr)) !== null) {
      const key = match[1];
      const value = match[2] ?? match[3] ?? match[4];
      params[key] = value;
    }

    return params;
  }

  /**
   * 渲染模板，替换变量和处理条件
   * @private
   */
  _renderTemplate(template, vars) {
    let result = template;

    // 1. 处理 {{#repeat count}}...{{/repeat}} 循环
    result = this._processRepeat(result, vars);

    // 2. 处理 {{#eq param value}}...{{/eq}} 相等判断
    result = this._processEq(result, vars);

    // 3. 处理 {{#neq param value}}...{{/neq}} 不相等判断
    result = this._processNeq(result, vars);

    // 4. 处理 {{#if condition}}...{{#else}}...{{/if}} 条件
    result = this._processIf(result, vars);

    // 5. 处理 {{#gt param value}}...{{/gt}} 大于判断
    result = this._processGt(result, vars);

    // 6. 处理 {{#lt param value}}...{{/lt}} 小于判断
    result = this._processLt(result, vars);

    // 7. 最后替换普通变量 {{varName}}
    result = result.replace(this.options.varPattern, (match, varName) => {
      if (Object.prototype.hasOwnProperty.call(vars, varName)) {
        return vars[varName];
      }
      // 保留未定义的变量占位符，便于调试
      return match;
    });

    return result;
  }

  /**
   * 处理循环 {{#repeat count}}...{{/repeat}}
   * @private
   */
  _processRepeat(template, vars) {
    const repeatPattern =
      /\{\{#repeat\s+(\d+|[\w$]+)\}\}([\s\S]*?)\{\{\/repeat\}\}/g;

    return template.replace(repeatPattern, (match, countExpr, content) => {
      // 解析循环次数
      let count = parseInt(countExpr);
      if (isNaN(count) && Object.prototype.hasOwnProperty.call(vars, countExpr)) {
        count = parseInt(vars[countExpr]);
      }
      if (isNaN(count) || count <= 0) return "";

      let result = "";
      for (let i = 0; i < count; i++) {
        // 添加循环变量 $i (1-based) 和 $i0 (0-based)
        const loopVars = { ...vars, $i: i + 1, $i0: i };
        result += this._renderTemplate(content, loopVars);
      }
      return result;
    });
  }

  /**
   * 处理相等判断 {{#eq param value}}...{{/eq}}
   * @private
   */
  _processEq(template, vars) {
    const eqPattern =
      /\{\{#eq\s+([\w$]+)\s+(.+?)\}\}([\s\S]*?)\{\{\/eq\}\}/g;

    return template.replace(eqPattern, (match, varName, value, content) => {
      const actualValue = Object.prototype.hasOwnProperty.call(vars, varName)
        ? String(vars[varName])
        : "";
      const compareValue = value.trim().replace(/^["']|["']$/g, "");

      if (actualValue === compareValue) {
        return this._renderTemplate(content, vars);
      }
      return "";
    });
  }

  /**
   * 处理不等判断 {{#neq param value}}...{{/neq}}
   * @private
   */
  _processNeq(template, vars) {
    const neqPattern =
      /\{\{#neq\s+([\w$]+)\s+(.+?)\}\}([\s\S]*?)\{\{\/neq\}\}/g;

    return template.replace(neqPattern, (match, varName, value, content) => {
      const actualValue = Object.prototype.hasOwnProperty.call(vars, varName)
        ? String(vars[varName])
        : "";
      const compareValue = value.trim().replace(/^["']|["']$/g, "");

      if (actualValue !== compareValue) {
        return this._renderTemplate(content, vars);
      }
      return "";
    });
  }

  /**
   * 处理条件 {{#if condition}}...{{#else}}...{{/if}}
   * @private
   */
  _processIf(template, vars) {
    const ifPattern =
      /\{\{#if\s+([\w$]+)\}\}([\s\S]*?)(?:\{\{#else\}\}([\s\S]*?))?\{\{\/if\}\}/g;

    return template.replace(
      ifPattern,
      (match, conditionVar, trueContent, falseContent = "") => {
        let condition = false;

        if (Object.prototype.hasOwnProperty.call(vars, conditionVar)) {
          const value = vars[conditionVar];
          condition =
            Boolean(value) &&
            value !== "0" &&
            value !== "false" &&
            value !== "";
        }

        if (condition) {
          return this._renderTemplate(trueContent, vars);
        } else {
          return this._renderTemplate(falseContent, vars);
        }
      }
    );
  }

  /**
   * 处理大于判断 {{#gt param value}}...{{/gt}}
   * @private
   */
  _processGt(template, vars) {
    const gtPattern =
      /\{\{#gt\s+([\w$]+)\s+(\d+)\}\}([\s\S]*?)\{\{\/gt\}\}/g;

    return template.replace(gtPattern, (match, varName, value, content) => {
      const actualValue = Object.prototype.hasOwnProperty.call(vars, varName)
        ? Number(vars[varName])
        : 0;
      const compareValue = Number(value);

      if (actualValue > compareValue) {
        return this._renderTemplate(content, vars);
      }
      return "";
    });
  }

  /**
   * 处理小于判断 {{#lt param value}}...{{/lt}}
   * @private
   */
  _processLt(template, vars) {
    const ltPattern =
      /\{\{#lt\s+([\w$]+)\s+(\d+)\}\}([\s\S]*?)\{\{\/lt\}\}/g;

    return template.replace(ltPattern, (match, varName, value, content) => {
      const actualValue = Object.prototype.hasOwnProperty.call(vars, varName)
        ? Number(vars[varName])
        : 0;
      const compareValue = Number(value);

      if (actualValue < compareValue) {
        return this._renderTemplate(content, vars);
      }
      return "";
    });
  }

  /**
   * 注册全局变量
   * @param {string} name - 变量名
   * @param {any} value - 变量值
   */
  setGlobalVar(name, value) {
    this.globalVars[name] = value;
  }

  /**
   * 批量注册全局变量
   * @param {Object} vars - 变量对象
   */
  setGlobalVars(vars) {
    Object.assign(this.globalVars, vars);
  }

  /**
   * 手动注册组件（通过 JS API）
   * @param {string} name - 组件名
   * @param {string} template - 组件模板
   * @param {string} position - 位置
   */
  register(name, template, position = "bottom-right") {
    this.components[name] = {
      name,
      template,
      position,
      usageCount: 0,
    };
  }

  /**
   * 获取所有已注册的组件
   * @returns {Object}
   */
  getComponents() {
    return { ...this.components };
  }

  /**
   * 检查组件是否存在
   * @param {string} name - 组件名
   * @returns {boolean}
   */
  hasComponent(name) {
    return Object.prototype.hasOwnProperty.call(this.components, name);
  }

  /**
   * 销毁模块
   */
  destroy() {
    this.clearComponents();

    if (this.componentContainer && this.componentContainer.parentNode) {
      this.componentContainer.parentNode.removeChild(this.componentContainer);
    }

    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }

    this.matcha = null;
    this.components = {};
    this.globalVars = {};
    this.componentContainer = null;
    this.styleElement = null;
  }
}

export default Component;
window.MatchaComponent = Component;
