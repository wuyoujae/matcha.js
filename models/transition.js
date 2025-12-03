/**
 * @module transition
 * @description 过渡动画模块，支持每页独立的过渡效果
 * @version 2.1.0 - 优化动画流畅度
 */
class Transition {
  constructor(options = {}) {
    this.options = {
      defaultType: options.type || "fade",
      // 增加默认时长，更流畅
      defaultDuration: options.duration || 700,
      // 使用更平滑的缓动
      defaultEasing: options.easing || "cubic-bezier(0.4, 0, 0.2, 1)",
      ...options,
    };

    // 预设过渡效果 - 优化动画参数
    this.transitions = {
      fade: {
        enter: { opacity: "0", transform: "translateY(10px)" },
        active: { opacity: "1", transform: "translateY(0)" },
        leave: { opacity: "0", transform: "translateY(-10px)" },
      },
      slide: {
        enter: { opacity: "0", transform: "translateX(80px)" },
        active: { opacity: "1", transform: "translateX(0)" },
        leave: { opacity: "0", transform: "translateX(-80px)" },
      },
      slideUp: {
        enter: { opacity: "0", transform: "translateY(60px)" },
        active: { opacity: "1", transform: "translateY(0)" },
        leave: { opacity: "0", transform: "translateY(-60px)" },
      },
      zoom: {
        enter: { opacity: "0", transform: "scale(0.9)" },
        active: { opacity: "1", transform: "scale(1)" },
        leave: { opacity: "0", transform: "scale(1.05)" },
      },
      zoomIn: {
        enter: { opacity: "0", transform: "scale(1.1)" },
        active: { opacity: "1", transform: "scale(1)" },
        leave: { opacity: "0", transform: "scale(0.95)" },
      },
      flip: {
        enter: { opacity: "0", transform: "perspective(1200px) rotateY(-60deg)" },
        active: { opacity: "1", transform: "perspective(1200px) rotateY(0)" },
        leave: { opacity: "0", transform: "perspective(1200px) rotateY(60deg)" },
      },
      flipY: {
        enter: { opacity: "0", transform: "perspective(1200px) rotateX(60deg)" },
        active: { opacity: "1", transform: "perspective(1200px) rotateX(0)" },
        leave: { opacity: "0", transform: "perspective(1200px) rotateX(-60deg)" },
      },
      cube: {
        enter: { opacity: "0", transform: "perspective(1200px) translateZ(-300px) rotateY(60deg)" },
        active: { opacity: "1", transform: "perspective(1200px) translateZ(0) rotateY(0)" },
        leave: { opacity: "0", transform: "perspective(1200px) translateZ(-300px) rotateY(-60deg)" },
      },
      none: {
        enter: { opacity: "1", transform: "none" },
        active: { opacity: "1", transform: "none" },
        leave: { opacity: "0", transform: "none" },
      },
    };

    this.matcha = null;
    this.styleElement = null;
  }

  init(matcha) {
    this.matcha = matcha;
    this._injectBaseStyles();
  }

  _injectBaseStyles() {
    this.styleElement = document.createElement("style");
    this.styleElement.id = "matcha-transition-module";
    this.styleElement.textContent = `
/* Matcha Transition Module - 流畅的页面切换 */
#matcha-stage {
  perspective: 1200px;
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

  applySlideTransition(slideElement, config) {
    if (!config) {
      config = {
        type: this.options.defaultType,
        duration: this.options.defaultDuration,
        easing: this.options.defaultEasing,
      };
    }

    slideElement.dataset.transition = config.type;
    slideElement.dataset.transitionDuration = config.duration;
    slideElement.dataset.transitionEasing = config.easing;

    // 使用更平滑的过渡
    slideElement.style.transition = `
      opacity ${config.duration}ms ${config.easing},
      transform ${config.duration}ms ${config.easing},
      filter ${config.duration}ms ${config.easing}
    `;
  }

  updateSlideState(slideElement, state) {
    const type = slideElement.dataset.transition || this.options.defaultType;
    const trans = this.transitions[type] || this.transitions.fade;
    const config = trans[state] || trans.active;

    slideElement.style.opacity = config.opacity;
    slideElement.style.transform = config.transform;
    slideElement.style.pointerEvents = state === "active" ? "auto" : "none";
    slideElement.style.zIndex = state === "active" ? "10" : "1";
  }

  registerTransition(name, config) {
    this.transitions[name] = {
      enter: config.enter || { opacity: "0", transform: "none" },
      active: config.active || { opacity: "1", transform: "none" },
      leave: config.leave || { opacity: "0", transform: "none" },
    };
  }

  getTransitionNames() {
    return Object.keys(this.transitions);
  }

  destroy() {
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }
    this.styleElement = null;
    this.matcha = null;
  }
}

export default Transition;
window.MatchaTransition = Transition;
