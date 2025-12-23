/**
 * @module highlight
 * @description 高亮内容模块 - 聚焦展示内容，与分步系统深度集成
 * @version 1.0.0
 *
 * @syntax
 * 高亮语法（使用尖括号包围内容）:
 *   <需要高亮的内容>
 *
 * 示例:
 *   你好，这里是<Matcha>
 *   我叫<jae>，我是一名<全栈>独立<开发者>
 *
 * 同一步中的多个高亮会按顺序逐个展示，形成嵌套分步效果
 */
class Highlight {
  constructor(options = {}) {
    this.options = {
      // 非高亮区域的透明度
      dimOpacity: 0.2,
      // 高亮动画时长
      duration: 400,
      // 缓动函数
      easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      // 高亮标记正则 - 使用 <内容> 语法
      // 使用负向前瞻排除闭合标签 (/) 和 HTML 注释 (!--)，但允许图片 (![)
      pattern: /<(?!\/|!--)([^<>]+)>/g,
      ...options,
    };

    this.matcha = null;
    this.styleElement = null;
  }

  /**
   * 初始化模块
   * @param {Matcha} matcha - Matcha 实例引用
   */
  init(matcha) {
    this.matcha = matcha;
    this._injectStyles();
  }

  /**
   * 注入高亮样式
   * @private
   */
  _injectStyles() {
    // 强制更新样式：如果已存在，先移除
    const oldStyle = document.getElementById("matcha-highlight-module");
    if (oldStyle && oldStyle.parentNode) {
      oldStyle.parentNode.removeChild(oldStyle);
    }

    this.styleElement = document.createElement("style");
    this.styleElement.id = "matcha-highlight-module";
    this.styleElement.textContent = `
/* Matcha Highlight Module - 遮罩层高亮效果 */

/* 高亮容器包裹 */
.matcha-highlight {
  display: inline;
  position: relative;
  transition: box-shadow var(--highlight-duration, ${this.options.duration}ms) var(--highlight-easing, ${this.options.easing});
  box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0);
  border-radius: 4px;
}

/* 修复 h1 渐变文字效果导致 span 内文字不可见的问题 */
h1 .matcha-highlight,
h2 .matcha-highlight,
h3 .matcha-highlight,
h4 .matcha-highlight,
h5 .matcha-highlight,
h6 .matcha-highlight {
  /* 强制使用纯色，覆盖父级的渐变效果 */
  -webkit-text-fill-color: var(--slide-h1, #fff) !important;
  background: none !important;
}

/* 聚焦模式下的幻灯片 */
.matcha-slide.highlight-focus-mode {
  --mask-opacity: 0.8;
  --highlight-duration: ${this.options.duration}ms;
  --highlight-easing: ${this.options.easing};
}

/* 移除旧的遮罩层 */
.matcha-slide.highlight-focus-mode::after {
  display: none;
}

/* 高亮元素使用巨大的阴影作为反向遮罩 */
.matcha-slide.highlight-focus-mode .matcha-highlight.highlight-active {
  position: relative;
  z-index: 10;
  box-shadow: 0 0 0 100vmax rgba(0, 0, 0, var(--mask-opacity));
}
    `;
    document.head.appendChild(this.styleElement);
  }

  /**
   * 解析内容中的高亮标记
   * @param {string} content - 原始内容
   * @returns {string} 处理后的内容（高亮标记转换为 span）
   */
  parseHighlightMarkers(content) {
    let highlightIndex = 0;
    return content.replace(this.options.pattern, (match, text) => {
      const result = `<span class="matcha-highlight" data-highlight-index="${highlightIndex}">${text}</span>`;
      highlightIndex++;
      return result;
    });
  }

  /**
   * 获取指定步骤块中的高亮元素
   * @param {HTMLElement} stepBlock - 分步块元素
   * @returns {NodeList} 高亮元素列表
   */
  getHighlightsInStep(stepBlock) {
    return stepBlock.querySelectorAll(".matcha-highlight");
  }

  /**
   * 统计内容中的高亮数量
   * @param {string} content - 内容文本
   * @returns {number} 高亮数量
   */
  countHighlights(content) {
    const matches = content.match(this.options.pattern);
    return matches ? matches.length : 0;
  }

  /**
   * 激活指定的高亮元素
   * @param {HTMLElement} slideElement - 幻灯片元素
   * @param {HTMLElement} highlightElement - 要高亮的元素
   */
  activateHighlight(slideElement, highlightElement) {
    // 开启聚焦模式
    slideElement.classList.add("highlight-focus-mode");
    document.body.classList.add("matcha-highlight-active");

    // 清除之前的高亮
    slideElement.querySelectorAll(".highlight-active").forEach((el) => {
      el.classList.remove("highlight-active");
    });

    // 清除父级标记
    slideElement.querySelectorAll(".highlight-has-active").forEach((el) => {
      el.classList.remove("highlight-has-active");
    });

    // 激活当前高亮
    highlightElement.classList.add("highlight-active");

    // 标记所有祖先元素
    let parent = highlightElement.parentElement;
    while (parent && !parent.classList.contains("matcha-slide")) {
      parent.classList.add("highlight-has-active");
      parent = parent.parentElement;
    }
  }

  /**
   * 取消聚焦模式
   * @param {HTMLElement} slideElement - 幻灯片元素
   */
  deactivateFocus(slideElement) {
    slideElement.classList.remove("highlight-focus-mode");
    document.body.classList.remove("matcha-highlight-active");

    slideElement.querySelectorAll(".highlight-active").forEach((el) => {
      el.classList.remove("highlight-active");
    });

    slideElement.querySelectorAll(".highlight-has-active").forEach((el) => {
      el.classList.remove("highlight-has-active");
    });
  }

  /**
   * 设置透明度
   * @param {number} opacity - 非高亮区域的透明度 (0-1)
   */
  setDimOpacity(opacity) {
    this.options.dimOpacity = opacity;
    document.documentElement.style.setProperty("--dim-opacity", opacity);
  }

  /**
   * 销毁模块
   */
  destroy() {
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }
    this.styleElement = null;
    this.matcha = null;
  }
}

// 导出方式
export default Highlight;
window.MatchaHighlight = Highlight;
