/**
 * @module transition
 * @description 过渡动画模块，支持每页独立的过渡效果
 * @version 2.0.0
 *
 * @syntax
 * 每页过渡效果:
 *   <!-- transition: fade -->
 *   <!-- transition: slide -->
 *   <!-- transition: zoom, duration=800 -->
 *
 * 效果列表: fade, slide, slideUp, zoom, zoomIn, flip, flipY, cube, none
 */
class Transition {
  constructor(options = {}) {
    this.options = {
      defaultType: options.type || "fade",
      defaultDuration: options.duration || 600,
      defaultEasing: options.easing || "cubic-bezier(0.16, 1, 0.3, 1)",
      ...options,
    };

    // 预设过渡效果
    this.transitions = {
      fade: {
        enter: { opacity: "0", transform: "none" },
        active: { opacity: "1", transform: "none" },
        leave: { opacity: "0", transform: "none" },
      },
      slide: {
        enter: { opacity: "0", transform: "translateX(100%)" },
        active: { opacity: "1", transform: "translateX(0)" },
        leave: { opacity: "0", transform: "translateX(-100%)" },
      },
      slideUp: {
        enter: { opacity: "0", transform: "translateY(100%)" },
        active: { opacity: "1", transform: "translateY(0)" },
        leave: { opacity: "0", transform: "translateY(-100%)" },
      },
      zoom: {
        enter: { opacity: "0", transform: "scale(0.8)" },
        active: { opacity: "1", transform: "scale(1)" },
        leave: { opacity: "0", transform: "scale(1.2)" },
      },
      zoomIn: {
        enter: { opacity: "0", transform: "scale(1.2)" },
        active: { opacity: "1", transform: "scale(1)" },
        leave: { opacity: "0", transform: "scale(0.8)" },
      },
      flip: {
        enter: { opacity: "0", transform: "rotateY(-90deg)" },
        active: { opacity: "1", transform: "rotateY(0)" },
        leave: { opacity: "0", transform: "rotateY(90deg)" },
      },
      flipY: {
        enter: { opacity: "0", transform: "rotateX(90deg)" },
        active: { opacity: "1", transform: "rotateX(0)" },
        leave: { opacity: "0", transform: "rotateX(-90deg)" },
      },
      cube: {
        enter: { opacity: "0", transform: "translateZ(-500px) rotateY(90deg)" },
        active: { opacity: "1", transform: "translateZ(0) rotateY(0)" },
        leave: { opacity: "0", transform: "translateZ(-500px) rotateY(-90deg)" },
      },
      none: {
        enter: { opacity: "0", transform: "none" },
        active: { opacity: "1", transform: "none" },
        leave: { opacity: "0", transform: "none" },
      },
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
    this._injectBaseStyles();
  }

  /**
   * 注入基础样式
   * @private
   */
  _injectBaseStyles() {
    this.styleElement = document.createElement("style");
    this.styleElement.id = "matcha-transition-module";
    this.styleElement.textContent = `
/* Matcha Transition Module - Per-slide transitions */
#matcha-stage {
  perspective: 1000px;
  transform-style: preserve-3d;
}

.matcha-slide {
  transform-style: preserve-3d;
  backface-visibility: hidden;
  will-change: transform, opacity;
}
    `;
    document.head.appendChild(this.styleElement);
  }

  /**
   * 解析过渡指令（不再全局修改，而是返回配置）
   * @param {string} block - 幻灯片内容块
   * @returns {Object} { cleanBlock, transitionConfig }
   */
  parseTransitionDirective(block) {
    let cleanBlock = block;
    let transitionConfig = null;

    const match = block.match(
      /<!--\s*transition:\s*([\w-]+)(?:\s*,\s*(.+?))?\s*-->/
    );

    if (match) {
      transitionConfig = {
        type: match[1],
        duration: this.options.defaultDuration,
        easing: this.options.defaultEasing,
      };

      cleanBlock = cleanBlock.replace(match[0], "");

      // 解析参数
      if (match[2]) {
        match[2].split(",").forEach((param) => {
          const [key, value] = param.split("=").map((s) => s.trim());
          if (key === "duration") {
            transitionConfig.duration = parseInt(value) || transitionConfig.duration;
          } else if (key === "easing") {
            transitionConfig.easing = value;
          }
        });
      }
    }

    return { cleanBlock, transitionConfig };
  }

  /**
   * 应用过渡配置到幻灯片元素
   * @param {HTMLElement} slideElement - 幻灯片 DOM 元素
   * @param {Object} config - { type, duration, easing }
   */
  applySlideTransition(slideElement, config) {
    if (!config) {
      // 使用默认配置
      config = {
        type: this.options.defaultType,
        duration: this.options.defaultDuration,
        easing: this.options.defaultEasing,
      };
    }

    // 存储配置到 dataset
    slideElement.dataset.transition = config.type;
    slideElement.dataset.transitionDuration = config.duration;
    slideElement.dataset.transitionEasing = config.easing;

    // 设置过渡时间
    slideElement.style.transition = `all ${config.duration}ms ${config.easing}`;
  }

  /**
   * 更新幻灯片状态（在 goto 时调用）
   * @param {HTMLElement} slideElement - 幻灯片 DOM 元素
   * @param {string} state - 'enter' | 'active' | 'leave'
   */
  updateSlideState(slideElement, state) {
    const type = slideElement.dataset.transition || this.options.defaultType;
    const trans = this.transitions[type] || this.transitions.fade;
    const config = trans[state] || trans.active;

    // 应用状态样式
    slideElement.style.opacity = config.opacity;
    slideElement.style.transform = config.transform;
    slideElement.style.pointerEvents = state === "active" ? "auto" : "none";
    slideElement.style.zIndex = state === "active" ? "10" : "1";
  }

  /**
   * 注册自定义过渡效果
   */
  registerTransition(name, config) {
    this.transitions[name] = {
      enter: config.enter || { opacity: "0", transform: "none" },
      active: config.active || { opacity: "1", transform: "none" },
      leave: config.leave || { opacity: "0", transform: "none" },
    };
  }

  /**
   * 获取所有可用过渡效果名称
   */
  getTransitionNames() {
    return Object.keys(this.transitions);
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
export default Transition;
window.MatchaTransition = Transition;
