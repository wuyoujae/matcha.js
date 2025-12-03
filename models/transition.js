/**
 * @module transition
 * @description 过渡动画模块，控制幻灯片切换效果
 * @version 1.0.0
 *
 * @syntax
 * 全局过渡效果（在第一页设置）:
 *   <!-- transition: fade -->
 *   <!-- transition: slide -->
 *   <!-- transition: zoom -->
 *   <!-- transition: flip -->
 *   <!-- transition: cube -->
 *
 * 单页过渡效果:
 *   <!-- transition: fade, duration=800 -->
 *
 * 过渡参数:
 *   duration   - 动画时长 (ms)
 *   easing     - 缓动函数
 */
class Transition {
  constructor(options = {}) {
    this.options = {
      // 默认过渡效果
      type: "fade",
      // 动画时长 (ms)
      duration: 600,
      // 缓动函数
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      ...options,
    };

    // 预设过渡效果
    this.transitions = {
      // 淡入淡出
      fade: {
        enter: { opacity: 0 },
        enterActive: { opacity: 1 },
        leave: { opacity: 0 },
      },

      // 滑动
      slide: {
        enter: { transform: "translateX(100%)", opacity: 0 },
        enterActive: { transform: "translateX(0)", opacity: 1 },
        leave: { transform: "translateX(-100%)", opacity: 0 },
      },

      // 向上滑动
      slideUp: {
        enter: { transform: "translateY(100%)", opacity: 0 },
        enterActive: { transform: "translateY(0)", opacity: 1 },
        leave: { transform: "translateY(-100%)", opacity: 0 },
      },

      // 缩放
      zoom: {
        enter: { transform: "scale(0.8)", opacity: 0 },
        enterActive: { transform: "scale(1)", opacity: 1 },
        leave: { transform: "scale(1.2)", opacity: 0 },
      },

      // 缩小进入
      zoomIn: {
        enter: { transform: "scale(1.2)", opacity: 0 },
        enterActive: { transform: "scale(1)", opacity: 1 },
        leave: { transform: "scale(0.8)", opacity: 0 },
      },

      // 翻转
      flip: {
        enter: { transform: "rotateY(-90deg)", opacity: 0 },
        enterActive: { transform: "rotateY(0)", opacity: 1 },
        leave: { transform: "rotateY(90deg)", opacity: 0 },
      },

      // 垂直翻转
      flipY: {
        enter: { transform: "rotateX(90deg)", opacity: 0 },
        enterActive: { transform: "rotateX(0)", opacity: 1 },
        leave: { transform: "rotateX(-90deg)", opacity: 0 },
      },

      // 立方体
      cube: {
        enter: {
          transform: "translateZ(-500px) rotateY(90deg)",
          opacity: 0,
        },
        enterActive: { transform: "translateZ(0) rotateY(0)", opacity: 1 },
        leave: {
          transform: "translateZ(-500px) rotateY(-90deg)",
          opacity: 0,
        },
      },

      // 无过渡
      none: {
        enter: {},
        enterActive: {},
        leave: {},
      },
    };

    this.matcha = null;
    this.styleElement = null;
    this.currentType = this.options.type;
  }

  /**
   * 初始化模块
   * @param {Matcha} matcha - Matcha 实例引用
   */
  init(matcha) {
    this.matcha = matcha;
    this._injectStyles();
    this.setTransition(this.options.type);
  }

  /**
   * 注入基础样式
   * @private
   */
  _injectStyles() {
    this.styleElement = document.createElement("style");
    this.styleElement.id = "matcha-transition-styles";
    document.head.appendChild(this.styleElement);
    this._updateStyles();
  }

  /**
   * 更新过渡样式
   * @private
   */
  _updateStyles() {
    const trans = this.transitions[this.currentType] || this.transitions.fade;
    const duration = this.options.duration;
    const easing = this.options.easing;

    // 生成 CSS
    const enterStyles = this._toCSS(trans.enter);
    const enterActiveStyles = this._toCSS(trans.enterActive);
    const leaveStyles = this._toCSS(trans.leave);

    this.styleElement.textContent = `
/* Matcha Transition: ${this.currentType} */
.matcha-slide {
  transition: all ${duration}ms ${easing};
}

/* 进入前状态 */
.matcha-slide:not(.active):not(.past) {
  ${enterStyles}
  pointer-events: none;
}

/* 激活状态 */
.matcha-slide.active {
  ${enterActiveStyles}
  pointer-events: auto;
  z-index: 10;
}

/* 离开状态 */
.matcha-slide.past {
  ${leaveStyles}
  pointer-events: none;
}

/* 3D 效果需要的透视 */
#matcha-stage {
  perspective: 1000px;
  transform-style: preserve-3d;
}

.matcha-slide {
  transform-style: preserve-3d;
  backface-visibility: hidden;
}
    `;
  }

  /**
   * 将样式对象转换为 CSS 字符串
   * @private
   */
  _toCSS(styleObj) {
    if (!styleObj || Object.keys(styleObj).length === 0) {
      return "";
    }
    return Object.entries(styleObj)
      .map(([key, value]) => {
        // 转换 camelCase 到 kebab-case
        const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
        return `${cssKey}: ${value};`;
      })
      .join("\n  ");
  }

  /**
   * 设置过渡效果
   * @param {string} type - 过渡类型
   * @param {Object} options - 可选参数 { duration, easing }
   */
  setTransition(type, options = {}) {
    if (!this.transitions[type]) {
      console.warn(`[Matcha Transition] 未知的过渡效果: ${type}`);
      return;
    }

    this.currentType = type;

    if (options.duration) {
      this.options.duration = options.duration;
    }
    if (options.easing) {
      this.options.easing = options.easing;
    }

    this._updateStyles();
  }

  /**
   * 设置动画时长
   * @param {number} duration - 时长 (ms)
   */
  setDuration(duration) {
    this.options.duration = duration;
    this._updateStyles();
  }

  /**
   * 设置缓动函数
   * @param {string} easing - CSS easing 函数
   */
  setEasing(easing) {
    this.options.easing = easing;
    this._updateStyles();
  }

  /**
   * 注册自定义过渡效果
   * @param {string} name - 效果名称
   * @param {Object} config - { enter, enterActive, leave }
   */
  registerTransition(name, config) {
    this.transitions[name] = {
      enter: config.enter || {},
      enterActive: config.enterActive || {},
      leave: config.leave || {},
    };
  }

  /**
   * 获取所有可用过渡效果
   * @returns {string[]} 效果名称数组
   */
  getTransitionNames() {
    return Object.keys(this.transitions);
  }

  /**
   * 获取当前过渡效果
   * @returns {string} 当前效果名称
   */
  getCurrentTransition() {
    return this.currentType;
  }

  /**
   * 解析过渡指令
   * @param {string} block - 幻灯片内容块
   * @returns {Object} { cleanBlock, transitionType, transitionParams }
   */
  parseTransitionDirective(block) {
    let cleanBlock = block;
    let transitionType = null;
    let transitionParams = {};

    // 解析 <!-- transition: xxx, duration=800 -->
    const match = block.match(
      /<!--\s*transition:\s*([\w-]+)(?:\s*,\s*(.+?))?\s*-->/
    );

    if (match) {
      transitionType = match[1];
      cleanBlock = cleanBlock.replace(match[0], "");

      // 解析参数
      if (match[2]) {
        match[2].split(",").forEach((param) => {
          const [key, value] = param.split("=").map((s) => s.trim());
          if (key && value) {
            transitionParams[key] = isNaN(value) ? value : parseInt(value);
          }
        });
      }

      // 应用过渡效果
      this.setTransition(transitionType, transitionParams);
    }

    return { cleanBlock, transitionType, transitionParams };
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

/*
 * ============================================
 * 使用示例 (Demo)
 * ============================================
 *
 * // 1. 初始化时配置
 * new Matcha({
 *   transition: {
 *     type: "slide",
 *     duration: 800
 *   }
 * }).start();
 *
 * // 2. 运行时切换
 * matcha.modules.transition.setTransition("zoom");
 * matcha.modules.transition.setDuration(1000);
 *
 * // 3. 自定义过渡效果
 * matcha.modules.transition.registerTransition("myEffect", {
 *   enter: { transform: "rotate(-10deg) scale(0.9)", opacity: 0 },
 *   enterActive: { transform: "rotate(0) scale(1)", opacity: 1 },
 *   leave: { transform: "rotate(10deg) scale(0.9)", opacity: 0 }
 * });
 *
 * // 4. Markdown 中使用
 * // <!-- transition: flip -->
 * // <!-- transition: zoom, duration=1000 -->
 *
 * // 可用效果: fade, slide, slideUp, zoom, zoomIn, flip, flipY, cube, none
 */

