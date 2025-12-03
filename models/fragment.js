/**
 * @module fragment
 * @description 分步展示模块 - 内容累加显示，像 PowerPoint 一样
 * @version 2.2.0
 *
 * @syntax
 * 使用 <!-- step --> 分隔内容，每点击一次显示下一段
 */
class Fragment {
  constructor(options = {}) {
    this.options = {
      defaultEffect: "fade",
      // 增加默认动画时长，让动画更流畅
      duration: 500,
      // 使用更平滑的缓动函数
      easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      ...options,
    };

    this.matcha = null;
    this.styleElement = null;
    this.slideStates = {};
  }

  init(matcha) {
    this.matcha = matcha;
    this._injectStyles();
  }

  _injectStyles() {
    this.styleElement = document.createElement("style");
    this.styleElement.id = "matcha-fragment-module";
    this.styleElement.textContent = `
/* Matcha Fragment Module - 流畅的分步动画 */
.matcha-step-block {
  /* 更长的动画时间，更平滑的缓动 */
  transition: 
    opacity var(--step-duration, ${this.options.duration}ms) var(--step-easing, ${this.options.easing}),
    transform var(--step-duration, ${this.options.duration}ms) var(--step-easing, ${this.options.easing}),
    filter var(--step-duration, ${this.options.duration}ms) var(--step-easing, ${this.options.easing});
  will-change: opacity, transform;
}

/* 隐藏状态 */
.matcha-step-block.step-hidden {
  opacity: 0;
  pointer-events: none;
  max-height: 0;
  overflow: hidden;
  margin: 0;
  padding: 0;
  visibility: hidden;
}

/* 显示状态 */
.matcha-step-block.step-visible {
  opacity: 1;
  pointer-events: auto;
  max-height: 9999px;
  visibility: visible;
  transform: none !important;
  filter: none;
}

/* 进入动画初始状态 */
.matcha-step-block.step-entering {
  opacity: 0;
  max-height: 9999px;
  visibility: visible;
}

/* 各种效果的初始状态 */
.matcha-step-block.step-entering[data-effect="fade"] {
  transform: none;
  filter: blur(4px);
}

.matcha-step-block.step-entering[data-effect="slide-up"] {
  transform: translateY(40px);
}

.matcha-step-block.step-entering[data-effect="slide-down"] {
  transform: translateY(-40px);
}

.matcha-step-block.step-entering[data-effect="slide-left"] {
  transform: translateX(60px);
}

.matcha-step-block.step-entering[data-effect="slide-right"] {
  transform: translateX(-60px);
}

.matcha-step-block.step-entering[data-effect="zoom"] {
  transform: scale(0.85);
  filter: blur(2px);
}

.matcha-step-block.step-entering[data-effect="zoom-in"] {
  transform: scale(1.15);
  filter: blur(2px);
}

.matcha-step-block.step-entering[data-effect="bounce"] {
  transform: scale(0.7) translateY(20px);
}

.matcha-step-block.step-entering[data-effect="flip"] {
  transform: perspective(600px) rotateX(-30deg);
  transform-origin: top center;
}

/* bounce 效果使用特殊的缓动 */
.matcha-step-block[data-effect="bounce"] {
  transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* flip 效果 */
.matcha-step-block[data-effect="flip"] {
  transform-style: preserve-3d;
  backface-visibility: hidden;
}
    `;
    document.head.appendChild(this.styleElement);
  }

  /**
   * 解析内容中的分步标记并构建 HTML
   */
  parseAndRender(content, slideIndex, renderFn) {
    const stepPattern = /<!--\s*step(?::\s*([\w-]+))?(?:\s*,\s*duration\s*=\s*(\d+))?\s*-->/g;
    
    const steps = [];
    let match;
    let lastIndex = 0;
    
    while ((match = stepPattern.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const beforeContent = content.slice(lastIndex, match.index);
        if (beforeContent.trim()) {
          steps.push({
            content: beforeContent,
            effect: steps.length === 0 ? "none" : (steps[steps.length - 1]?.nextEffect || this.options.defaultEffect),
            duration: steps.length === 0 ? 0 : (steps[steps.length - 1]?.nextDuration || this.options.duration),
          });
        }
      }
      
      if (steps.length > 0) {
        steps[steps.length - 1].nextEffect = match[1] || this.options.defaultEffect;
        steps[steps.length - 1].nextDuration = match[2] ? parseInt(match[2]) : this.options.duration;
      } else {
        steps.push({
          content: "",
          effect: "none",
          duration: 0,
          nextEffect: match[1] || this.options.defaultEffect,
          nextDuration: match[2] ? parseInt(match[2]) : this.options.duration,
        });
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < content.length) {
      const remainingContent = content.slice(lastIndex);
      if (remainingContent.trim()) {
        const lastStep = steps[steps.length - 1];
        steps.push({
          content: remainingContent,
          effect: lastStep?.nextEffect || this.options.defaultEffect,
          duration: lastStep?.nextDuration || this.options.duration,
        });
      }
    }
    
    if (steps.length === 0) {
      steps.push({
        content: content,
        effect: "none",
        duration: 0,
      });
    }
    
    const validSteps = steps.filter(step => step.content.trim());
    
    this.slideStates[slideIndex] = {
      currentStep: 1,
      totalSteps: validSteps.length,
    };
    
    let html = "";
    validSteps.forEach((step, index) => {
      const stepNum = index + 1;
      const isFirst = index === 0;
      const visibleClass = isFirst ? "step-visible" : "step-hidden";
      const renderedContent = renderFn(step.content);
      const duration = step.duration || this.options.duration;
      
      html += `<div class="matcha-step-block ${visibleClass}" data-step="${stepNum}" data-effect="${step.effect}" style="--step-duration: ${duration}ms;">${renderedContent}</div>`;
    });
    
    return html;
  }

  initSlide(slideElement, slideIndex) {
    const blocks = slideElement.querySelectorAll(".matcha-step-block");
    const state = this.slideStates[slideIndex] || { currentStep: 1, totalSteps: blocks.length };

    state.blocks = Array.from(blocks);
    state.totalSteps = blocks.length;
    this.slideStates[slideIndex] = state;

    blocks.forEach((block, i) => {
      if (i === 0) {
        block.classList.add("step-visible");
        block.classList.remove("step-hidden", "step-entering");
      } else {
        block.classList.add("step-hidden");
        block.classList.remove("step-visible", "step-entering");
      }
    });
  }

  resetSlide(slideIndex) {
    const state = this.slideStates[slideIndex];
    if (!state || !state.blocks) return;

    state.currentStep = 1;

    state.blocks.forEach((block, i) => {
      block.classList.remove("step-entering");
      if (i === 0) {
        block.classList.add("step-visible");
        block.classList.remove("step-hidden");
      } else {
        block.classList.add("step-hidden");
        block.classList.remove("step-visible");
      }
    });
  }

  showAllSteps(slideIndex) {
    const state = this.slideStates[slideIndex];
    if (!state || !state.blocks) return;

    state.currentStep = state.totalSteps;

    state.blocks.forEach((block) => {
      block.classList.remove("step-hidden", "step-entering");
      block.classList.add("step-visible");
    });
  }

  nextStep(slideIndex) {
    const state = this.slideStates[slideIndex];
    if (!state || !state.blocks) return false;

    if (state.currentStep >= state.totalSteps) {
      return false;
    }

    const nextBlock = state.blocks[state.currentStep];
    if (nextBlock) {
      // 先移除 hidden，添加 entering（设置初始动画状态）
      nextBlock.classList.remove("step-hidden");
      nextBlock.classList.add("step-entering");

      // 用 requestAnimationFrame 确保浏览器渲染了初始状态
      // 然后触发过渡动画
      requestAnimationFrame(() => {
        // 强制重排
        nextBlock.offsetHeight;
        requestAnimationFrame(() => {
          nextBlock.classList.remove("step-entering");
          nextBlock.classList.add("step-visible");
        });
      });

      state.currentStep++;
    }

    return state.currentStep < state.totalSteps;
  }

  prevStep(slideIndex) {
    const state = this.slideStates[slideIndex];
    if (!state || !state.blocks) return false;

    if (state.currentStep <= 1) {
      return false;
    }

    const currentBlock = state.blocks[state.currentStep - 1];
    if (currentBlock) {
      currentBlock.classList.remove("step-visible");
      currentBlock.classList.add("step-hidden");
      state.currentStep--;
    }

    return state.currentStep > 1;
  }

  hasSteps(slideIndex) {
    const state = this.slideStates[slideIndex];
    return state && state.totalSteps > 1;
  }

  hasNextStep(slideIndex) {
    const state = this.slideStates[slideIndex];
    return state && state.currentStep < state.totalSteps;
  }

  hasPrevStep(slideIndex) {
    const state = this.slideStates[slideIndex];
    return state && state.currentStep > 1;
  }

  getStepState(slideIndex) {
    const state = this.slideStates[slideIndex];
    if (!state) return { current: 1, total: 1 };
    return { current: state.currentStep, total: state.totalSteps };
  }

  destroy() {
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }
    this.styleElement = null;
    this.matcha = null;
    this.slideStates = {};
  }
}

export default Fragment;
window.MatchaFragment = Fragment;
