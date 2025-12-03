/**
 * @module fragment
 * @description 分步展示模块 - 内容累加显示，像 PowerPoint 一样
 * @version 2.0.0
 *
 * @syntax
 * 使用 <!-- step --> 分隔内容，每点击一次显示下一段：
 *
 *   # 标题
 *   你好
 *
 *   <!-- step -->
 *
 *   欢迎来到 Matcha!
 *
 *   <!-- step -->
 *
 *   你可以通过 Markdown 快速制作 PPT。
 *
 * 显示顺序：
 *   第1步: "你好"
 *   第2步: "你好" + "欢迎来到 Matcha!"
 *   第3步: "你好" + "欢迎来到 Matcha!" + "你可以通过..."
 *
 * 带过渡效果：
 *   <!-- step: fade -->
 *   <!-- step: slide-up -->
 *   <!-- step: zoom -->
 *
 * 带参数：
 *   <!-- step: slide-up, duration=500 -->
 */
class Fragment {
  constructor(options = {}) {
    this.options = {
      // 默认过渡效果
      defaultEffect: "fade",
      // 默认动画时长
      duration: 400,
      // 默认缓动
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      ...options,
    };

    // 过渡效果定义
    this.effects = {
      none: {
        from: {},
        to: {},
      },
      fade: {
        from: { opacity: "0" },
        to: { opacity: "1" },
      },
      "slide-up": {
        from: { opacity: "0", transform: "translateY(30px)" },
        to: { opacity: "1", transform: "translateY(0)" },
      },
      "slide-down": {
        from: { opacity: "0", transform: "translateY(-30px)" },
        to: { opacity: "1", transform: "translateY(0)" },
      },
      "slide-left": {
        from: { opacity: "0", transform: "translateX(50px)" },
        to: { opacity: "1", transform: "translateX(0)" },
      },
      "slide-right": {
        from: { opacity: "0", transform: "translateX(-50px)" },
        to: { opacity: "1", transform: "translateX(0)" },
      },
      zoom: {
        from: { opacity: "0", transform: "scale(0.8)" },
        to: { opacity: "1", transform: "scale(1)" },
      },
      "zoom-in": {
        from: { opacity: "0", transform: "scale(1.2)" },
        to: { opacity: "1", transform: "scale(1)" },
      },
      bounce: {
        from: { opacity: "0", transform: "scale(0.5)" },
        to: { opacity: "1", transform: "scale(1)" },
        easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
    };

    this.matcha = null;
    this.styleElement = null;

    // 每页的分步状态
    this.slideStates = {};
  }

  /**
   * 初始化模块
   */
  init(matcha) {
    this.matcha = matcha;
    this._injectStyles();
  }

  /**
   * 注入样式
   * @private
   */
  _injectStyles() {
    this.styleElement = document.createElement("style");
    this.styleElement.id = "matcha-fragment-module";
    this.styleElement.textContent = `
/* Matcha Fragment Module - 分步内容累加显示 */

/* 步骤块 */
.matcha-step-block {
  transition: opacity var(--step-duration, ${this.options.duration}ms) var(--step-easing, ${this.options.easing}),
              transform var(--step-duration, ${this.options.duration}ms) var(--step-easing, ${this.options.easing});
}

/* 隐藏状态 */
.matcha-step-block.step-hidden {
  opacity: 0;
  pointer-events: none;
  position: absolute;
  visibility: hidden;
}

/* 显示状态 */
.matcha-step-block.step-visible {
  opacity: 1;
  pointer-events: auto;
  position: relative;
  visibility: visible;
}

/* 过渡效果的初始状态 */
.matcha-step-block.step-entering {
  opacity: 0;
}

.matcha-step-block.step-entering[data-effect="slide-up"] {
  transform: translateY(30px);
}

.matcha-step-block.step-entering[data-effect="slide-down"] {
  transform: translateY(-30px);
}

.matcha-step-block.step-entering[data-effect="slide-left"] {
  transform: translateX(50px);
}

.matcha-step-block.step-entering[data-effect="slide-right"] {
  transform: translateX(-50px);
}

.matcha-step-block.step-entering[data-effect="zoom"],
.matcha-step-block.step-entering[data-effect="bounce"] {
  transform: scale(0.8);
}

.matcha-step-block.step-entering[data-effect="zoom-in"] {
  transform: scale(1.2);
}

/* 显示后恢复正常 */
.matcha-step-block.step-visible {
  transform: none;
}
    `;
    document.head.appendChild(this.styleElement);
  }

  /**
   * 处理 Markdown 文本，将 step 分隔符转换为特殊标记
   * 在 renderMarkdown 之前调用
   * @param {string} markdown - 原始 Markdown
   * @returns {string} 处理后的 Markdown
   */
  preprocessMarkdown(markdown) {
    // 将 <!-- step --> 或 <!-- step: effect --> 转换为特殊标记
    // 这个标记会在 HTML 渲染后被处理
    let stepIndex = 0;
    return markdown.replace(
      /<!--\s*step(?::\s*([\w-]+))?(?:\s*,\s*(.+?))?\s*-->/g,
      (match, effect, params) => {
        stepIndex++;
        const effectName = effect || this.options.defaultEffect;
        let duration = this.options.duration;

        // 解析参数
        if (params) {
          const durationMatch = params.match(/duration\s*=\s*(\d+)/);
          if (durationMatch) {
            duration = parseInt(durationMatch[1]);
          }
        }

        // 返回特殊标记，HTML 渲染后会保留
        return `__MATCHA_STEP_${stepIndex}_${effectName}_${duration}__`;
      }
    );
  }

  /**
   * 处理渲染后的 HTML，将特殊标记转换为 step 块
   * @param {string} html - 渲染后的 HTML
   * @param {number} slideIndex - 幻灯片索引
   * @returns {string} 处理后的 HTML
   */
  processHTML(html, slideIndex) {
    // 查找所有 step 标记
    const stepMarkers = html.match(/__MATCHA_STEP_(\d+)_([\w-]+)_(\d+)__/g);

    if (!stepMarkers || stepMarkers.length === 0) {
      // 没有分步，整个内容作为第一步
      this.slideStates[slideIndex] = {
        currentStep: 1,
        totalSteps: 1,
      };
      return `<div class="matcha-step-block step-visible" data-step="1">${html}</div>`;
    }

    // 按 step 标记分割内容
    const parts = html.split(/__MATCHA_STEP_\d+_[\w-]+_\d+__/);
    let result = "";

    // 第一部分（step 1）- 初始显示
    if (parts[0].trim()) {
      result += `<div class="matcha-step-block step-visible" data-step="1" data-effect="none">${parts[0]}</div>`;
    }

    // 后续部分（step 2, 3, ...）- 初始隐藏
    stepMarkers.forEach((marker, index) => {
      const match = marker.match(/__MATCHA_STEP_(\d+)_([\w-]+)_(\d+)__/);
      const stepNum = index + 2; // step 2 开始
      const effect = match[2];
      const duration = match[3];
      const content = parts[index + 1] || "";

      if (content.trim()) {
        result += `<div class="matcha-step-block step-hidden" data-step="${stepNum}" data-effect="${effect}" data-duration="${duration}">${content}</div>`;
      }
    });

    // 记录该页的分步状态
    const totalSteps = stepMarkers.length + 1;
    this.slideStates[slideIndex] = {
      currentStep: 1,
      totalSteps: totalSteps,
    };

    return result;
  }

  /**
   * 初始化幻灯片的分步（在构建 DOM 后调用）
   */
  initSlide(slideElement, slideIndex) {
    const blocks = slideElement.querySelectorAll(".matcha-step-block");
    const state = this.slideStates[slideIndex] || { currentStep: 1, totalSteps: blocks.length };

    state.blocks = Array.from(blocks);
    state.totalSteps = blocks.length;
    this.slideStates[slideIndex] = state;

    // 设置初始状态：只显示第一步
    blocks.forEach((block, i) => {
      if (i === 0) {
        block.classList.add("step-visible");
        block.classList.remove("step-hidden");
      } else {
        block.classList.add("step-hidden");
        block.classList.remove("step-visible");
      }
    });
  }

  /**
   * 重置幻灯片到第一步
   */
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

  /**
   * 显示所有步骤（用于往回切换时）
   */
  showAllSteps(slideIndex) {
    const state = this.slideStates[slideIndex];
    if (!state || !state.blocks) return;

    state.currentStep = state.totalSteps;

    state.blocks.forEach((block) => {
      block.classList.remove("step-hidden", "step-entering");
      block.classList.add("step-visible");
    });
  }

  /**
   * 显示下一步
   * @returns {boolean} 是否还有更多步骤
   */
  nextStep(slideIndex) {
    const state = this.slideStates[slideIndex];
    if (!state || !state.blocks) return false;

    // 已经显示所有步骤
    if (state.currentStep >= state.totalSteps) {
      return false;
    }

    // 显示下一个 block
    const nextBlock = state.blocks[state.currentStep];
    if (nextBlock) {
      // 先添加 entering 类（设置初始状态）
      nextBlock.classList.remove("step-hidden");
      nextBlock.classList.add("step-entering");

      // 强制重排后添加 visible 类（触发动画）
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nextBlock.classList.remove("step-entering");
          nextBlock.classList.add("step-visible");
        });
      });

      state.currentStep++;
    }

    return state.currentStep < state.totalSteps;
  }

  /**
   * 回退到上一步
   * @returns {boolean} 是否还可以继续回退
   */
  prevStep(slideIndex) {
    const state = this.slideStates[slideIndex];
    if (!state || !state.blocks) return false;

    // 已经是第一步
    if (state.currentStep <= 1) {
      return false;
    }

    // 隐藏当前步骤的 block
    const currentBlock = state.blocks[state.currentStep - 1];
    if (currentBlock) {
      currentBlock.classList.remove("step-visible");
      currentBlock.classList.add("step-hidden");
      state.currentStep--;
    }

    return state.currentStep > 1;
  }

  /**
   * 检查是否有分步
   */
  hasSteps(slideIndex) {
    const state = this.slideStates[slideIndex];
    return state && state.totalSteps > 1;
  }

  /**
   * 检查是否有下一步
   */
  hasNextStep(slideIndex) {
    const state = this.slideStates[slideIndex];
    return state && state.currentStep < state.totalSteps;
  }

  /**
   * 检查是否可以回退
   */
  hasPrevStep(slideIndex) {
    const state = this.slideStates[slideIndex];
    return state && state.currentStep > 1;
  }

  /**
   * 获取步骤状态
   */
  getStepState(slideIndex) {
    const state = this.slideStates[slideIndex];
    if (!state) return { current: 1, total: 1 };
    return { current: state.currentStep, total: state.totalSteps };
  }

  /**
   * 注册自定义效果
   */
  registerEffect(name, config) {
    this.effects[name] = config;
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
    this.slideStates = {};
  }
}

// 导出
export default Fragment;
window.MatchaFragment = Fragment;

/*
 * ============================================
 * 使用示例
 * ============================================
 *
 * ---
 * <!-- layout: center -->
 *
 * # 你好
 *
 * <!-- step: fade -->
 *
 * 欢迎来到 Matcha!
 *
 * <!-- step: slide-up -->
 *
 * 你可以通过 Markdown 快速制作 PPT。
 *
 * ---
 *
 * 显示效果：
 * 第1步: "你好"
 * 第2步: "你好" + "欢迎来到 Matcha!"（淡入）
 * 第3步: "你好" + "欢迎来到 Matcha!" + "你可以通过..."（从下滑入）
 */
