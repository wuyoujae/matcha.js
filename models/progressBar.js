/**
 * @module progressBar
 * @description 进度条模块，显示当前幻灯片进度，支持显隐控制和自定义颜色
 * @version 1.0.0
 */
class ProgressBar {
  constructor(options = {}) {
    this.options = {
      // 是否显示进度条
      visible: true,
      // 进度条颜色
      color: "#4a7c59",
      // 进度条高度
      height: "4px",
      // 进度条位置：top | bottom
      position: "bottom",
      // 过渡动画时长
      transition: "width 0.3s ease",
      // 进度条 z-index
      zIndex: 1000,
      ...options,
    };

    this.element = null;
    this.matcha = null;
  }

  /**
   * 初始化模块
   * @param {Matcha} matcha - Matcha 实例引用
   */
  init(matcha) {
    this.matcha = matcha;
    this._create();
    this._applyStyles();

    if (!this.options.visible) {
      this.hide();
    }
  }

  /**
   * 创建进度条 DOM 元素
   * @private
   */
  _create() {
    this.element = document.createElement("div");
    this.element.id = "matcha-progress";
    this.element.className = "matcha-progress-bar";
    document.body.appendChild(this.element);
  }

  /**
   * 应用样式
   * @private
   */
  _applyStyles() {
    const style = this.element.style;
    style.position = "fixed";
    style.left = "0";
    style[this.options.position] = "0";
    style.height = this.options.height;
    style.backgroundColor = this.options.color;
    style.transition = this.options.transition;
    style.zIndex = this.options.zIndex;
    style.width = "0%";
  }

  /**
   * 更新进度
   * @param {number} current - 当前幻灯片索引（从 0 开始）
   * @param {number} total - 幻灯片总数
   */
  update(current, total) {
    if (!this.element) return;
    const percentage = ((current + 1) / total) * 100;
    this.element.style.width = `${percentage}%`;
  }

  /**
   * 显示进度条
   */
  show() {
    if (this.element) {
      this.element.style.display = "block";
      this.options.visible = true;
    }
  }

  /**
   * 隐藏进度条
   */
  hide() {
    if (this.element) {
      this.element.style.display = "none";
      this.options.visible = false;
    }
  }

  /**
   * 切换显示状态
   */
  toggle() {
    if (this.options.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * 设置进度条颜色
   * @param {string} color - CSS 颜色值
   */
  setColor(color) {
    this.options.color = color;
    if (this.element) {
      this.element.style.backgroundColor = color;
    }
  }

  /**
   * 设置进度条高度
   * @param {string} height - CSS 高度值
   */
  setHeight(height) {
    this.options.height = height;
    if (this.element) {
      this.element.style.height = height;
    }
  }

  /**
   * 设置进度条位置
   * @param {string} position - 'top' 或 'bottom'
   */
  setPosition(position) {
    if (this.element) {
      // 清除原位置
      this.element.style.top = "";
      this.element.style.bottom = "";
      // 设置新位置
      this.element.style[position] = "0";
      this.options.position = position;
    }
  }

  /**
   * 销毁模块
   */
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.matcha = null;
  }
}

// 导出方式
export default ProgressBar;
window.MatchaProgressBar = ProgressBar;
