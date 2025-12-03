/**
 * @module style
 * @description 主题样式模块，支持每页独立的主题和样式
 * @version 2.0.0
 *
 * @syntax
 * 每页主题设置:
 *   <!-- theme: ocean -->      // 这一页使用 ocean 主题
 *   <!-- theme: sakura -->     // 这一页使用 sakura 主题
 *
 * 单页样式覆盖:
 *   <!-- style: bg=#1a1a1a, accent=#00ff88 -->
 *
 * 预设主题:
 *   matcha, sakura, ocean, sunset, mono, light
 */
class Style {
  constructor(options = {}) {
    this.options = {
      // 默认主题
      defaultTheme: options.theme || "matcha",
      ...options,
    };

    // 预设主题配置
    this.themes = {
      matcha: {
        bg: "#121212",
        fg: "#e0e0e0",
        accent: "#00c853",
        secondary: "#ff4081",
        glassBg: "rgba(255, 255, 255, 0.05)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      sakura: {
        bg: "#1a1520",
        fg: "#f5e6e8",
        accent: "#ff6b9d",
        secondary: "#c44569",
        glassBg: "rgba(255, 182, 193, 0.08)",
        borderColor: "rgba(255, 182, 193, 0.15)",
        font: '"Noto Serif SC", Georgia, serif',
      },
      ocean: {
        bg: "#0a192f",
        fg: "#ccd6f6",
        accent: "#64ffda",
        secondary: "#57cbff",
        glassBg: "rgba(100, 255, 218, 0.05)",
        borderColor: "rgba(100, 255, 218, 0.1)",
        font: '"JetBrains Mono", monospace',
      },
      sunset: {
        bg: "#1a1423",
        fg: "#ffecd2",
        accent: "#fcb69f",
        secondary: "#ff6b6b",
        glassBg: "rgba(252, 182, 159, 0.08)",
        borderColor: "rgba(252, 182, 159, 0.12)",
        font: '"Poppins", sans-serif',
      },
      mono: {
        bg: "#ffffff",
        fg: "#1a1a1a",
        accent: "#000000",
        secondary: "#666666",
        glassBg: "rgba(0, 0, 0, 0.03)",
        borderColor: "rgba(0, 0, 0, 0.1)",
        font: '"Inter", system-ui, sans-serif',
      },
      light: {
        bg: "#fafafa",
        fg: "#2d2d2d",
        accent: "#00c853",
        secondary: "#ff4081",
        glassBg: "rgba(0, 0, 0, 0.03)",
        borderColor: "rgba(0, 0, 0, 0.08)",
        font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
    this.styleElement.id = "matcha-style-module";
    this.styleElement.textContent = `
/* Matcha Style Module - Per-slide theming */
.matcha-slide {
  /* 每个 slide 可以有自己的 CSS 变量 */
  background: var(--slide-bg, var(--matcha-bg));
  color: var(--slide-fg, var(--matcha-fg));
}

.matcha-slide h2 {
  color: var(--slide-accent, var(--matcha-accent));
  border-left-color: var(--slide-accent, var(--matcha-accent));
}

.matcha-slide strong {
  color: var(--slide-accent, var(--matcha-accent));
}

.matcha-slide blockquote {
  background: var(--slide-glass-bg, var(--glass-bg));
  border-left-color: var(--slide-secondary, var(--matcha-secondary));
}

.matcha-slide .matcha-table th {
  color: var(--slide-accent, var(--matcha-accent));
}

.matcha-slide ul li::before {
  color: var(--slide-accent, var(--matcha-accent));
}
    `;
    document.head.appendChild(this.styleElement);

    // 设置默认主题到 :root
    this._setGlobalTheme(this.options.defaultTheme);
  }

  /**
   * 设置全局默认主题
   * @private
   */
  _setGlobalTheme(themeName) {
    const theme = this.themes[themeName];
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty("--matcha-bg", theme.bg);
    root.style.setProperty("--matcha-fg", theme.fg);
    root.style.setProperty("--matcha-accent", theme.accent);
    root.style.setProperty("--matcha-secondary", theme.secondary);
    root.style.setProperty("--glass-bg", theme.glassBg);
    root.style.setProperty("--border-color", theme.borderColor);
    root.style.setProperty("--font-main", theme.font);
  }

  /**
   * 解析幻灯片中的样式指令（不再全局修改，而是返回配置）
   * @param {string} block - 幻灯片内容块
   * @returns {Object} { cleanBlock, themeName, styles }
   */
  parseStyleDirective(block) {
    let cleanBlock = block;
    let themeName = null;
    const styles = {};

    // 解析 <!-- theme: xxx -->
    const themeMatch = block.match(/<!--\s*theme:\s*([\w-]+)\s*-->/);
    if (themeMatch) {
      themeName = themeMatch[1];
      cleanBlock = cleanBlock.replace(themeMatch[0], "");
    }

    // 解析 <!-- style: bg=#xxx, accent=#xxx -->
    const styleMatch = block.match(/<!--\s*style:\s*(.+?)\s*-->/);
    if (styleMatch) {
      const styleStr = styleMatch[1];
      styleStr.split(",").forEach((pair) => {
        const [key, value] = pair.split("=").map((s) => s.trim());
        if (key && value) {
          styles[key] = value;
        }
      });
      cleanBlock = cleanBlock.replace(styleMatch[0], "");
    }

    return { cleanBlock, themeName, styles };
  }

  /**
   * 应用主题和样式到单个幻灯片（每页独立）
   * @param {HTMLElement} slideElement - 幻灯片 DOM 元素
   * @param {string} themeName - 主题名称
   * @param {Object} styles - 自定义样式对象
   */
  applySlideTheme(slideElement, themeName, styles = {}) {
    // 存储配置到 dataset
    if (themeName) {
      slideElement.dataset.theme = themeName;
    }

    // 应用主题的 CSS 变量到该 slide 元素
    if (themeName && this.themes[themeName]) {
      const theme = this.themes[themeName];
      slideElement.style.setProperty("--slide-bg", theme.bg);
      slideElement.style.setProperty("--slide-fg", theme.fg);
      slideElement.style.setProperty("--slide-accent", theme.accent);
      slideElement.style.setProperty("--slide-secondary", theme.secondary);
      slideElement.style.setProperty("--slide-glass-bg", theme.glassBg);
      slideElement.style.setProperty("--slide-border-color", theme.borderColor);
      slideElement.style.fontFamily = theme.font;
    }

    // 应用自定义样式（覆盖主题）
    if (styles.bg) {
      slideElement.style.setProperty("--slide-bg", styles.bg);
      slideElement.style.background = styles.bg;
    }
    if (styles.fg) {
      slideElement.style.setProperty("--slide-fg", styles.fg);
      slideElement.style.color = styles.fg;
    }
    if (styles.accent) {
      slideElement.style.setProperty("--slide-accent", styles.accent);
    }
    if (styles.secondary) {
      slideElement.style.setProperty("--slide-secondary", styles.secondary);
    }
  }

  /**
   * 注册自定义主题
   * @param {string} name - 主题名称
   * @param {Object} config - 主题配置
   */
  registerTheme(name, config) {
    this.themes[name] = {
      ...this.themes.matcha,
      ...config,
    };
  }

  /**
   * 获取所有可用主题名称
   * @returns {string[]}
   */
  getThemeNames() {
    return Object.keys(this.themes);
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
export default Style;
window.MatchaStyle = Style;
