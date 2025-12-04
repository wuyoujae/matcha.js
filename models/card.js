/**
 * @module card
 * @description 卡片组件模块 - 支持自定义背景、边框、阴影的容器
 * @version 1.0.0
 *
 * @syntax
 * 开始卡片:
 *   <!-- card: bg=#fff, shadow=lg -->
 *
 * 结束卡片 (可选，默认到下一个分隔符或文件结束):
 *   <!-- endcard -->
 *
 * 参数:
 *   bg: 背景色/渐变/图片 (支持 glass, linear-gradient 等)
 *   color: 文字颜色
 *   border: 边框 (如 "1px solid #red")
 *   radius: 圆角 (默认 12px)
 *   shadow: 阴影 (sm, md, lg, none)
 *   padding: 内边距 (默认 20px)
 *   width: 宽度 (默认 auto)
 *   align: 对齐方式 (left, center, right)
 */
class Card {
  constructor(options = {}) {
    this.options = {
      defaultPadding: "30px",
      defaultRadius: "16px",
      defaultShadow: "0 10px 30px rgba(0,0,0,0.2)",
      defaultBg: "rgba(255, 255, 255, 0.05)", // 默认半透明
      ...options,
    };

    this.matcha = null;
    this.styleElement = null;
  }

  init(matcha) {
    this.matcha = matcha;
    this._injectStyles();
  }

  _injectStyles() {
    this.styleElement = document.createElement("style");
    this.styleElement.id = "matcha-card-module";
    this.styleElement.textContent = `
/* Matcha Card Module */
.matcha-card {
  display: block;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  margin: 1em 0;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.matcha-card.shadow-sm { box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
.matcha-card.shadow-md { box-shadow: 0 5px 15px rgba(0,0,0,0.15); }
.matcha-card.shadow-lg { box-shadow: 0 15px 40px rgba(0,0,0,0.3); }
.matcha-card.shadow-none { box-shadow: none; }

.matcha-card.glass {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 卡片内的图片自适应 */
.matcha-card img {
  max-width: 100%;
  border-radius: 8px;
}
    `;
    document.head.appendChild(this.styleElement);
  }

  /**
   * 解析文本中的卡片指令并包裹内容
   * @param {string} text - Markdown 文本
   * @returns {string} 包含 HTML 卡片结构的文本
   */
  parse(text) {
    const lines = text.split("\n");
    const result = [];
    let inCard = false;
    let currentCardParams = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const cardStartMatch = line.match(/<!--\s*card(?::\s*(.+?))?\s*-->/);
      const cardEndMatch = line.match(/<!--\s*endcard\s*-->/);

      if (cardStartMatch) {
        // 如果已经在卡片中，先结束上一个
        if (inCard) {
          result.push("</div>");
        }

        inCard = true;
        currentCardParams = this._parseParams(cardStartMatch[1] || "");
        
        // 构建卡片开始标签
        const style = this._buildCardStyle(currentCardParams);
        const className = this._buildCardClass(currentCardParams);
        result.push(`<div class="${className}" style="${style}">`);
        
      } else if (cardEndMatch) {
        if (inCard) {
          result.push("</div>");
          inCard = false;
        }
      } else {
        result.push(line);
      }
    }

    // 如果结束时还在卡片中，自动闭合
    if (inCard) {
      result.push("</div>");
    }

    return result.join("\n");
  }

  _parseParams(paramStr) {
    const params = {};
    if (!paramStr) return params;

    paramStr.split(",").forEach((pair) => {
      const [key, value] = pair.split("=").map((s) => s.trim());
      if (key && value) {
        params[key] = value;
      }
    });
    return params;
  }

  _buildCardClass(params) {
    const classes = ["matcha-card"];
    
    // 预设阴影
    if (params.shadow) {
      classes.push(`shadow-${params.shadow}`);
    } else {
      // 默认无特定 class，使用 style 中的默认值
    }

    // 玻璃拟态
    if (params.bg === "glass") {
      classes.push("glass");
    }

    return classes.join(" ");
  }

  _buildCardStyle(params) {
    const styles = [];

    // 背景
    if (params.bg && params.bg !== "glass") {
      styles.push(`background: ${params.bg}`);
    } else if (!params.bg && !params.glass) {
        // 默认背景
        styles.push(`background: ${this.options.defaultBg}`);
    }

    // 文字颜色
    if (params.color) {
        styles.push(`color: ${params.color}`);
    }

    // 边框
    if (params.border) {
      styles.push(`border: ${params.border}`);
    }

    // 圆角
    styles.push(`border-radius: ${params.radius || this.options.defaultRadius}`);

    // 内边距
    styles.push(`padding: ${params.padding || this.options.defaultPadding}`);

    // 宽度
    if (params.width) {
      styles.push(`width: ${params.width}`);
      styles.push(`max-width: 100%`);
    }

    // 对齐
    if (params.align) {
      styles.push(`text-align: ${params.align}`);
    }

    // 自定义阴影
    if (!params.shadow && !params.glass) {
        // 如果没有指定 shadow class 也没有 glass，应用默认阴影
        // 但如果在 CSS 里处理比较好。这里先简单处理
        // styles.push(`box-shadow: ${this.options.defaultShadow}`);
    }

    return styles.join("; ");
  }

  destroy() {
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }
    this.styleElement = null;
    this.matcha = null;
  }
}

export default Card;
window.MatchaCard = Card;

