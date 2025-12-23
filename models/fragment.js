/**
 * @module fragment
 * @description 分步展示模块 - 内容累加显示，支持高亮嵌套分步
 * @version 3.0.0
 *
 * @syntax
 * 使用 <!-- step --> 分隔内容，每点击一次显示下一段
 * 使用 <内容> 标记高亮，同一步中的高亮按顺序逐个展示
 *
 * 显示流程示例：
 *   第1步内容 → 第1步高亮1 → 第1步高亮2 → 第2步内容 → 第2步高亮1 → ...
 */
class Fragment {
  constructor(options = {}) {
    this.options = {
      defaultEffect: "fade",
      duration: 500,
      easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      // 高亮相关配置 - 使用 <内容> 语法
      // 使用负向前瞻排除闭合标签 (/) 和 HTML 注释 (!--)，但允许图片 (![)
      highlightPattern: /<(?!\/|!--)([^<>]+)>/g,
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
   * 解析高亮标记并转换为 span
   * @private
   */
  _parseHighlights(content) {
    let highlightIndex = 0;
    console.log('[Highlight] 输入内容:', content);
    const result = content.replace(this.options.highlightPattern, (match, text) => {
      console.log('[Highlight] 匹配到:', match, '-> 内容:', text);
      // 为了兼容 Markdown 语法嵌套（如 <# 抹茶> 需要先识别为标题，再高亮"抹茶"），
      // 如果高亮内容以 Markdown 前缀开头（#、>、列表符号等），则将前缀保留在外部，
      // 仅包裹实际内容，避免破坏后续 Markdown 解析。
      const mdPrefixMatch = text.match(
        /^(\s*(?:#{1,6}|>|\*|\+|-|\d+\.)\s+)([\s\S]+)$/
      );
      let wrapped;
      if (mdPrefixMatch) {
        const prefix = mdPrefixMatch[1];
        const body = mdPrefixMatch[2];
        wrapped = `${prefix}<span class="matcha-highlight" data-highlight-index="${highlightIndex}">${body}</span>`;
        console.log('[Highlight] Markdown前缀模式 - 前缀:', prefix, '正文:', body);
      } else {
        wrapped = `<span class="matcha-highlight" data-highlight-index="${highlightIndex}">${text}</span>`;
        console.log('[Highlight] 普通模式');
      }
      console.log('[Highlight] 输出:', wrapped);
      highlightIndex++;
      return wrapped;
    });
    console.log('[Highlight] 最终结果:', result);
    return result;
  }

  /**
   * 统计内容中的高亮数量
   * @private
   */
  _countHighlights(content) {
    const matches = content.match(this.options.highlightPattern);
    return matches ? matches.length : 0;
  }

  /**
   * 解析内容中的分步标记并构建 HTML
   */
  parseAndRender(content, slideIndex, renderFn) {
    const stepPattern =
      /<!--\s*step(?::\s*([\w-]+))?(?:\s*,\s*duration\s*=\s*(\d+))?\s*-->/g;

    const steps = [];
    let match;
    let lastIndex = 0;

    while ((match = stepPattern.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const beforeContent = content.slice(lastIndex, match.index);
        if (beforeContent.trim()) {
          steps.push({
            content: beforeContent,
            effect:
              steps.length === 0
                ? "none"
                : steps[steps.length - 1]?.nextEffect ||
                  this.options.defaultEffect,
            duration:
              steps.length === 0
                ? 0
                : steps[steps.length - 1]?.nextDuration ||
                  this.options.duration,
          });
        }
      }

      if (steps.length > 0) {
        steps[steps.length - 1].nextEffect =
          match[1] || this.options.defaultEffect;
        steps[steps.length - 1].nextDuration = match[2]
          ? parseInt(match[2])
          : this.options.duration;
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

    const validSteps = steps.filter((step) => step.content.trim());

    // 计算每一步的高亮数量
    const highlightsPerStep = validSteps.map((step) =>
      this._countHighlights(step.content)
    );

    // 计算总的微步骤数（每步内容显示 + 该步的所有高亮）
    let totalMicroSteps = 0;
    validSteps.forEach((step, index) => {
      totalMicroSteps += 1; // 步骤内容本身
      totalMicroSteps += highlightsPerStep[index]; // 该步的高亮数量
    });

    this.slideStates[slideIndex] = {
      currentStep: 1, // 当前显示的步骤块（1-based）
      currentHighlight: 0, // 当前步骤内的高亮索引（0表示无高亮激活，1表示第一个高亮）
      totalSteps: validSteps.length,
      highlightsPerStep: highlightsPerStep,
      totalMicroSteps: totalMicroSteps,
      currentMicroStep: 1, // 全局微步骤索引
    };

    let html = "";
    validSteps.forEach((step, index) => {
      const stepNum = index + 1;
      const isFirst = index === 0;
      const visibleClass = isFirst ? "step-visible" : "step-hidden";

      // 先处理高亮标记，再渲染 Markdown
      const contentWithHighlights = this._parseHighlights(step.content);
      console.log('[Fragment] 高亮处理后:', contentWithHighlights);
      const renderedContent = renderFn(contentWithHighlights);
      console.log('[Fragment] Markdown渲染后:', renderedContent);
      const duration = step.duration || this.options.duration;

      html += `<div class="matcha-step-block ${visibleClass}" data-step="${stepNum}" data-effect="${step.effect}" data-highlights="${highlightsPerStep[index]}" style="--step-duration: ${duration}ms;">${renderedContent}</div>`;
    });

    return html;
  }

  initSlide(slideElement, slideIndex) {
    const blocks = slideElement.querySelectorAll(".matcha-step-block");
    const state = this.slideStates[slideIndex] || {
      currentStep: 1,
      currentHighlight: 0,
      totalSteps: blocks.length,
      highlightsPerStep: [],
      totalMicroSteps: blocks.length,
      currentMicroStep: 1,
    };

    state.blocks = Array.from(blocks);
    state.totalSteps = blocks.length;
    state.slideElement = slideElement;

    // 重新计算 highlightsPerStep
    if (!state.highlightsPerStep || state.highlightsPerStep.length === 0) {
      state.highlightsPerStep = state.blocks.map((block) => {
        return block.querySelectorAll(".matcha-highlight").length;
      });
    }

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
    state.currentHighlight = 0;
    state.currentMicroStep = 1;

    // 清除高亮状态
    this._clearHighlightFocus(state.slideElement);

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
    state.currentHighlight = 0;
    state.currentMicroStep = state.totalMicroSteps;

    // 清除高亮状态
    this._clearHighlightFocus(state.slideElement);

    state.blocks.forEach((block) => {
      block.classList.remove("step-hidden", "step-entering");
      block.classList.add("step-visible");
    });
  }

  /**
   * 下一步 - 处理分步和高亮的嵌套逻辑
   */
  nextStep(slideIndex) {
    const state = this.slideStates[slideIndex];
    if (!state || !state.blocks) return false;

    const currentBlock = state.blocks[state.currentStep - 1];
    const highlightsInCurrentStep =
      state.highlightsPerStep[state.currentStep - 1] || 0;

    // 情况1：当前步骤还有未显示的高亮
    if (state.currentHighlight < highlightsInCurrentStep) {
      const isSwitching = state.currentHighlight > 0; // 如果已经是 > 0，说明正在从上一个高亮切过来
      state.currentHighlight++;
      state.currentMicroStep++;

      // 激活第 currentHighlight 个高亮（索引为 currentHighlight - 1）
      const highlights = currentBlock.querySelectorAll(".matcha-highlight");
      if (highlights[state.currentHighlight - 1]) {
        this._activateHighlight(
          state.slideElement,
          highlights[state.currentHighlight - 1],
          isSwitching
        );
      }

      return true;
    }

    // 情况2：当前步骤的高亮已全部显示，尝试进入下一步
    if (state.currentStep >= state.totalSteps) {
      // 已是最后一步且高亮已完成
      return false;
    }

    // 清除高亮状态，进入下一步
    this._clearHighlightFocus(state.slideElement);

    const nextBlock = state.blocks[state.currentStep];
    if (nextBlock) {
      nextBlock.classList.remove("step-hidden");
      nextBlock.classList.add("step-entering");

      requestAnimationFrame(() => {
        nextBlock.offsetHeight;
        requestAnimationFrame(() => {
          nextBlock.classList.remove("step-entering");
          nextBlock.classList.add("step-visible");
        });
      });

      state.currentStep++;
      state.currentHighlight = 0;
      state.currentMicroStep++;
    }

    return this.hasNextStep(slideIndex);
  }

  /**
   * 上一步 - 处理分步和高亮的嵌套逻辑
   */
  prevStep(slideIndex) {
    const state = this.slideStates[slideIndex];
    if (!state || !state.blocks) return false;

    // 情况1：当前步骤有激活的高亮，先取消高亮
    if (state.currentHighlight > 0) {
      state.currentHighlight--;
      state.currentMicroStep--;

      if (state.currentHighlight > 0) {
        // 还有高亮，激活前一个
        const currentBlock = state.blocks[state.currentStep - 1];
        const highlights = currentBlock.querySelectorAll(".matcha-highlight");
        this._activateHighlight(
          state.slideElement,
          highlights[state.currentHighlight - 1],
          true // isSwitching = true
        );
      } else {
        // 没有高亮了，清除聚焦模式
        this._clearHighlightFocus(state.slideElement);
      }

      return true;
    }

    // 情况2：当前步骤没有激活的高亮，回到上一步
    if (state.currentStep <= 1) {
      return false;
    }

    const currentBlock = state.blocks[state.currentStep - 1];
    if (currentBlock) {
      currentBlock.classList.remove("step-visible");
      currentBlock.classList.add("step-hidden");
      state.currentStep--;
      state.currentMicroStep--;

      // 检查上一步是否有高亮，如果有则激活最后一个
      const prevHighlights =
        state.highlightsPerStep[state.currentStep - 1] || 0;
      if (prevHighlights > 0) {
        state.currentHighlight = prevHighlights;
        const prevBlock = state.blocks[state.currentStep - 1];
        const highlights = prevBlock.querySelectorAll(".matcha-highlight");
        this._activateHighlight(
          state.slideElement,
          highlights[state.currentHighlight - 1]
        );
      }
    }

    return this.hasPrevStep(slideIndex);
  }

  /**
   * 激活高亮元素（使用遮罩层方式）
   * @private
   */
  _activateHighlight(slideElement, highlightElement, isSwitching = false) {
    // 开启聚焦模式（添加遮罩层）
    slideElement.classList.add("highlight-focus-mode");

    const oldHighlights = slideElement.querySelectorAll(".highlight-active");

    if (isSwitching) {
      // 如果是切换，先给旧的和新的都加上无过渡类，防止淡入淡出导致的闪烁
      oldHighlights.forEach((el) => el.classList.add("no-transition"));
      highlightElement.classList.add("no-transition");

      // 强制重排，确保 class 生效
      // eslint-disable-next-line no-unused-expressions
      highlightElement.offsetHeight;
    }

    // 清除之前的高亮
    oldHighlights.forEach((el) => {
      el.classList.remove("highlight-active");
    });

    // 激活当前高亮（浮在遮罩层之上）
    highlightElement.classList.add("highlight-active");

    if (isSwitching) {
      // 强制重排，确保 active 切换完成
      // eslint-disable-next-line no-unused-expressions
      highlightElement.offsetHeight;

      // 移除无过渡类
      requestAnimationFrame(() => {
        oldHighlights.forEach((el) => el.classList.remove("no-transition"));
        highlightElement.classList.remove("no-transition");
      });
    }
  }

  /**
   * 清除高亮聚焦状态
   * @private
   */
  _clearHighlightFocus(slideElement) {
    if (!slideElement) return;

    // 移除遮罩层
    slideElement.classList.remove("highlight-focus-mode");

    // 清除所有高亮标记
    slideElement.querySelectorAll(".highlight-active").forEach((el) => {
      el.classList.remove("highlight-active");
    });
  }

  hasSteps(slideIndex) {
    const state = this.slideStates[slideIndex];
    return state && state.totalMicroSteps > 1;
  }

  hasNextStep(slideIndex) {
    const state = this.slideStates[slideIndex];
    if (!state) return false;

    const highlightsInCurrentStep =
      state.highlightsPerStep[state.currentStep - 1] || 0;

    // 检查当前步骤是否还有未显示的高亮
    if (state.currentHighlight < highlightsInCurrentStep) {
      return true;
    }

    // 检查是否还有下一步
    return state.currentStep < state.totalSteps;
  }

  hasPrevStep(slideIndex) {
    const state = this.slideStates[slideIndex];
    if (!state) return false;

    // 有激活的高亮
    if (state.currentHighlight > 0) {
      return true;
    }

    // 不在第一步
    return state.currentStep > 1;
  }

  getStepState(slideIndex) {
    const state = this.slideStates[slideIndex];
    if (!state) return { current: 1, total: 1, highlight: 0 };
    return {
      current: state.currentStep,
      total: state.totalSteps,
      highlight: state.currentHighlight,
      microStep: state.currentMicroStep,
      totalMicroSteps: state.totalMicroSteps,
    };
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
