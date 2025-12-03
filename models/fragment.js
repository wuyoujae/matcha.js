/**
 * @module fragment
 * @description 分步展示模块，像 PowerPoint 一样逐步显示内容
 * @version 1.0.0
 *
 * @syntax
 * 基础分步:
 *   <!-- step -->
 *   这段内容点击后显示
 *
 *   <!-- step -->
 *   再点击显示这段
 *
 * 带效果的分步:
 *   <!-- step: fade -->          淡入
 *   <!-- step: slide-up -->      从下滑入
 *   <!-- step: slide-down -->    从上滑入
 *   <!-- step: slide-left -->    从右滑入
 *   <!-- step: slide-right -->   从左滑入
 *   <!-- step: zoom -->          缩放出现
 *   <!-- step: bounce -->        弹跳出现
 *
 * 带顺序的分步:
 *   <!-- step: fade, order=2 -->   第二步显示
 *   <!-- step: fade, order=1 -->   第一步显示
 *
 * 带延迟的分步（与上一步同时，但有延迟）:
 *   <!-- step: fade, with-previous, delay=200 -->
 *
 * 列表自动分步:
 *   <!-- step-list -->
 *   - 第一项（点击显示）
 *   - 第二项（再点击显示）
 *   - 第三项
 *   <!-- /step-list -->
 *
 * 同时显示多个（组）:
 *   <!-- step-group -->
 *   内容A
 *   内容B（与A同时显示）
 *   <!-- /step-group -->
 */
class Fragment {
  constructor(options = {}) {
    this.options = {
      // 默认动画效果
      defaultEffect: "fade",
      // 默认动画时长
      duration: 400,
      // 默认缓动
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      ...options,
    };

    // 分步动画效果
    this.effects = {
      fade: {
        hidden: { opacity: "0", transform: "none" },
        visible: { opacity: "1", transform: "none" },
      },
      "slide-up": {
        hidden: { opacity: "0", transform: "translateY(30px)" },
        visible: { opacity: "1", transform: "translateY(0)" },
      },
      "slide-down": {
        hidden: { opacity: "0", transform: "translateY(-30px)" },
        visible: { opacity: "1", transform: "translateY(0)" },
      },
      "slide-left": {
        hidden: { opacity: "0", transform: "translateX(30px)" },
        visible: { opacity: "1", transform: "translateX(0)" },
      },
      "slide-right": {
        hidden: { opacity: "0", transform: "translateX(-30px)" },
        visible: { opacity: "1", transform: "translateX(0)" },
      },
      zoom: {
        hidden: { opacity: "0", transform: "scale(0.8)" },
        visible: { opacity: "1", transform: "scale(1)" },
      },
      "zoom-in": {
        hidden: { opacity: "0", transform: "scale(1.2)" },
        visible: { opacity: "1", transform: "scale(1)" },
      },
      bounce: {
        hidden: { opacity: "0", transform: "scale(0.5)" },
        visible: { opacity: "1", transform: "scale(1)" },
        easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
      flip: {
        hidden: { opacity: "0", transform: "rotateX(-90deg)" },
        visible: { opacity: "1", transform: "rotateX(0)" },
      },
      none: {
        hidden: { opacity: "0", transform: "none" },
        visible: { opacity: "1", transform: "none" },
      },
    };

    this.matcha = null;
    this.styleElement = null;

    // 每页的分步状态: { slideIndex: { currentStep: 0, totalSteps: 3 } }
    this.slideStates = {};
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
   * 注入样式
   * @private
   */
  _injectStyles() {
    this.styleElement = document.createElement("style");
    this.styleElement.id = "matcha-fragment-module";
    this.styleElement.textContent = `
/* Matcha Fragment Module - Step-by-step reveal */
.matcha-step {
  transition: opacity ${this.options.duration}ms ${this.options.easing},
              transform ${this.options.duration}ms ${this.options.easing};
}

.matcha-step.step-hidden {
  opacity: 0;
  pointer-events: none;
}

.matcha-step.step-visible {
  opacity: 1;
  pointer-events: auto;
}

/* 效果预设 */
.matcha-step[data-effect="slide-up"].step-hidden { transform: translateY(30px); }
.matcha-step[data-effect="slide-down"].step-hidden { transform: translateY(-30px); }
.matcha-step[data-effect="slide-left"].step-hidden { transform: translateX(30px); }
.matcha-step[data-effect="slide-right"].step-hidden { transform: translateX(-30px); }
.matcha-step[data-effect="zoom"].step-hidden { transform: scale(0.8); }
.matcha-step[data-effect="zoom-in"].step-hidden { transform: scale(1.2); }
.matcha-step[data-effect="bounce"].step-hidden { transform: scale(0.5); }
.matcha-step[data-effect="flip"].step-hidden { transform: rotateX(-90deg); }

.matcha-step.step-visible { transform: none; }

/* 分步指示器 */
.matcha-step-indicator {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: var(--glass-bg);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  color: var(--matcha-fg);
  opacity: 0.7;
  z-index: 100;
  backdrop-filter: blur(10px);
}
    `;
    document.head.appendChild(this.styleElement);
  }

  /**
   * 解析 Markdown 中的分步标记
   * @param {string} html - 渲染后的 HTML
   * @param {number} slideIndex - 幻灯片索引
   * @returns {string} 处理后的 HTML
   */
  parseFragments(html, slideIndex) {
    let result = html;
    let stepOrder = 0;

    // 解析 <!-- step-list --> ... <!-- /step-list -->
    result = result.replace(
      /<!--\s*step-list(?::\s*([\w-]+))?\s*-->([\s\S]*?)<!--\s*\/step-list\s*-->/g,
      (match, effect, content) => {
        const listEffect = effect || this.options.defaultEffect;
        // 给列表中的每个 li 添加 step
        return content.replace(/<li>/g, () => {
          stepOrder++;
          return `<li class="matcha-step step-hidden" data-step="${stepOrder}" data-effect="${listEffect}">`;
        });
      }
    );

    // 解析 <!-- step-group --> ... <!-- /step-group -->
    result = result.replace(
      /<!--\s*step-group(?::\s*([\w-]+))?\s*-->([\s\S]*?)<!--\s*\/step-group\s*-->/g,
      (match, effect, content) => {
        stepOrder++;
        const groupEffect = effect || this.options.defaultEffect;
        return `<div class="matcha-step step-hidden" data-step="${stepOrder}" data-effect="${groupEffect}">${content}</div>`;
      }
    );

    // 解析单个 <!-- step --> 或 <!-- step: effect, params -->
    result = result.replace(
      /<!--\s*step(?::\s*([\w-]+))?(?:\s*,\s*(.+?))?\s*-->/g,
      (match, effect, params) => {
        const stepEffect = effect || this.options.defaultEffect;
        let order = ++stepOrder;
        let delay = 0;
        let withPrevious = false;

        // 解析参数
        if (params) {
          params.split(",").forEach((param) => {
            const [key, value] = param.split("=").map((s) => s.trim());
            if (key === "order" && value) {
              order = parseInt(value);
              stepOrder = Math.max(stepOrder, order);
            } else if (key === "delay" && value) {
              delay = parseInt(value);
            } else if (key === "with-previous" || param.trim() === "with-previous") {
              withPrevious = true;
              order = stepOrder; // 与上一步同序号
            }
          });
        }

        return `</div><div class="matcha-step step-hidden" data-step="${order}" data-effect="${stepEffect}" data-delay="${delay}" ${withPrevious ? 'data-with-previous="true"' : ""}>`;
      }
    );

    // 清理多余的空 div
    result = result.replace(/<div class="matcha-step[^>]*><\/div>/g, "");
    result = result.replace(/^<\/div>/, ""); // 移除开头的 </div>

    // 如果内容没有被包裹，确保最后一个 step 被关闭
    if (result.includes("matcha-step") && !result.trim().endsWith("</div>")) {
      result += "</div>";
    }

    // 存储该页的分步状态
    this.slideStates[slideIndex] = {
      currentStep: 0,
      totalSteps: stepOrder,
    };

    return result;
  }

  /**
   * 初始化幻灯片的分步状态
   * @param {HTMLElement} slideElement - 幻灯片元素
   * @param {number} slideIndex - 幻灯片索引
   */
  initSlideFragments(slideElement, slideIndex) {
    const steps = slideElement.querySelectorAll(".matcha-step");
    const totalSteps = steps.length;

    this.slideStates[slideIndex] = {
      currentStep: 0,
      totalSteps: totalSteps,
      steps: Array.from(steps),
    };

    // 初始隐藏所有分步
    steps.forEach((step) => {
      step.classList.add("step-hidden");
      step.classList.remove("step-visible");
    });
  }

  /**
   * 重置幻灯片的分步状态
   * @param {number} slideIndex - 幻灯片索引
   */
  resetSlide(slideIndex) {
    const state = this.slideStates[slideIndex];
    if (!state || !state.steps) return;

    state.currentStep = 0;
    state.steps.forEach((step) => {
      step.classList.add("step-hidden");
      step.classList.remove("step-visible");
    });
  }

  /**
   * 显示所有分步（用于往回切换时）
   * @param {number} slideIndex - 幻灯片索引
   */
  showAllSteps(slideIndex) {
    const state = this.slideStates[slideIndex];
    if (!state || !state.steps) return;

    state.currentStep = state.totalSteps;
    state.steps.forEach((step) => {
      step.classList.remove("step-hidden");
      step.classList.add("step-visible");
    });
  }

  /**
   * 显示下一个分步
   * @param {number} slideIndex - 幻灯片索引
   * @returns {boolean} 是否还有更多分步
   */
  nextStep(slideIndex) {
    const state = this.slideStates[slideIndex];
    if (!state || !state.steps) return false;

    if (state.currentStep >= state.totalSteps) {
      return false; // 没有更多分步
    }

    state.currentStep++;

    // 显示当前序号的所有步骤（支持同序号多个元素）
    state.steps.forEach((step) => {
      const stepOrder = parseInt(step.dataset.step);
      const delay = parseInt(step.dataset.delay) || 0;

      if (stepOrder === state.currentStep) {
        setTimeout(() => {
          step.classList.remove("step-hidden");
          step.classList.add("step-visible");
        }, delay);
      }
    });

    return state.currentStep < state.totalSteps;
  }

  /**
   * 返回上一个分步
   * @param {number} slideIndex - 幻灯片索引
   * @returns {boolean} 是否还有更多分步可以回退
   */
  prevStep(slideIndex) {
    const state = this.slideStates[slideIndex];
    if (!state || !state.steps || state.currentStep <= 0) return false;

    // 隐藏当前序号的所有步骤
    state.steps.forEach((step) => {
      const stepOrder = parseInt(step.dataset.step);
      if (stepOrder === state.currentStep) {
        step.classList.add("step-hidden");
        step.classList.remove("step-visible");
      }
    });

    state.currentStep--;
    return true;
  }

  /**
   * 检查是否有分步
   * @param {number} slideIndex - 幻灯片索引
   * @returns {boolean}
   */
  hasSteps(slideIndex) {
    const state = this.slideStates[slideIndex];
    return state && state.totalSteps > 0;
  }

  /**
   * 检查是否还有下一个分步
   * @param {number} slideIndex - 幻灯片索引
   * @returns {boolean}
   */
  hasNextStep(slideIndex) {
    const state = this.slideStates[slideIndex];
    return state && state.currentStep < state.totalSteps;
  }

  /**
   * 检查是否可以回退分步
   * @param {number} slideIndex - 幻灯片索引
   * @returns {boolean}
   */
  hasPrevStep(slideIndex) {
    const state = this.slideStates[slideIndex];
    return state && state.currentStep > 0;
  }

  /**
   * 获取当前分步状态
   * @param {number} slideIndex - 幻灯片索引
   * @returns {Object} { current, total }
   */
  getStepState(slideIndex) {
    const state = this.slideStates[slideIndex];
    if (!state) return { current: 0, total: 0 };
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

// 导出方式
export default Fragment;
window.MatchaFragment = Fragment;

/*
 * ============================================
 * 使用示例 (Demo)
 * ============================================
 *
 * Markdown 语法：
 *
 * ---
 * <!-- layout: center -->
 *
 * # 分步展示演示
 *
 * <!-- step -->
 * 第一步：点击后显示
 *
 * <!-- step: slide-up -->
 * 第二步：从下滑入
 *
 * <!-- step: zoom, delay=200 -->
 * 第三步：缩放出现（延迟200ms）
 *
 * ---
 *
 * <!-- step-list: slide-up -->
 * - 列表项1
 * - 列表项2
 * - 列表项3
 * <!-- /step-list -->
 *
 * ---
 *
 * <!-- step-group -->
 * 这两段会同时出现
 *
 * 因为它们在同一个 group 里
 * <!-- /step-group -->
 */

