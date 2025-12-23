/**
 * @module style
 * @description 主题样式模块 (Presentation Grade v3.0)
 * @description 适配演讲场景的大字号、高留白、强对比风格
 */

// 字体定义
const MODERN_SANS =
  '"Inter", "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const MODERN_MONO = '"JetBrains Mono", "Fira Code", Consolas, monospace';

// --- 尺寸映射表 (Presentation Scale) ---
// 注意：这里的数值比网页开发大得多，是为了适应投影/大屏
const SIZE_SCALES = {
  // 安全区 (Slide Padding)
  padding: {
    1: "0",
    2: "40px 60px",
    3: "60px 80px",
    4: "0 60px",
    5: "0 80px", // 默认标准：左右留白 80px
    6: "0 100px", // 宽敞
    7: "0 120px",
    8: "0 150px",
    9: "0 200px",
    10: "0 300px", // 极简海报风
  },
  // 布局间距 (Grid Gap)
  gap: {
    1: "0",
    2: "20px",
    3: "40px",
    4: "60px",
    5: "80px", // 默认标准：间距 80px
    6: "100px",
    7: "120px",
    8: "150px", // 巨大的鸿沟，用于强区分
    9: "200px",
    10: "250px",
  },
};

class Style {
  constructor(options = {}) {
    this.options = {
      defaultTheme: options.theme || "matcha",
      ...options,
    };

    this.globalStyles = {};

    // --- 预设主题库 ---
    this.themes = {
      // 1. Matcha (默认): 极客绿 + 深黑背景
      matcha: {
        bg: "transparent", // 背景交由 CSS body 处理
        fg: "#ffffff",
        h1: "#ffffff",
        h2: "#00e676", // Matcha Green
        note: "#888888",
        card: "rgba(255, 255, 255, 0.03)",
        accent: "#00e676",
        secondary: "#2979ff",
        glassBg: "rgba(255, 255, 255, 0.03)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        font: MODERN_SANS,
        padding: 5,
        gap: 5,
      },

      // 2. Mono (Tesla): 高对比黑白 + 红色强调
      mono: {
        bg: "transparent",
        fg: "#eeeeee",
        h1: "#ffffff",
        h2: "#E31937", // Tesla Red
        note: "#666666",
        card: "rgba(255, 255, 255, 0.04)",
        accent: "#E31937",
        secondary: "#E31937",
        glassBg: "rgba(20, 20, 20, 0.6)",
        borderColor: "rgba(255, 255, 255, 0.15)",
        font: MODERN_SANS,
        padding: 6,
        gap: 6,
      },

      // 3. Ocean (Linear/Google): 深蓝/紫调 + 科技蓝
      ocean: {
        bg: "transparent",
        fg: "#dbeafe",
        h1: "#ffffff",
        h2: "#3b82f6", // Bright Blue
        note: "#64748b",
        card: "rgba(30, 41, 59, 0.3)", // 偏蓝玻璃
        accent: "#3b82f6",
        secondary: "#8b5cf6", // Purple
        glassBg: "rgba(30, 41, 59, 0.3)",
        borderColor: "rgba(59, 130, 246, 0.2)",
        font: MODERN_SANS,
        padding: 5,
        gap: 5,
      },

      // 4. Sunset: 暖色调
      sunset: {
        bg: "transparent",
        fg: "#fff1f2",
        h1: "#ffffff",
        h2: "#f43f5e", // Rose
        note: "#fda4af",
        card: "rgba(88, 28, 135, 0.2)",
        accent: "#f43f5e",
        secondary: "#fbbf24", // Amber
        glassBg: "rgba(255, 255, 255, 0.05)",
        borderColor: "rgba(244, 63, 94, 0.2)",
        font: MODERN_SANS,
        padding: 5,
        gap: 5,
      },

      // 5. Light: 亮色模式 (Notion 风格)
      light: {
        bg: "#ffffff",
        fg: "#111827",
        h1: "#000000",
        h2: "#059669",
        note: "#6b7280",
        card: "#f3f4f6", // 实心灰卡片
        accent: "#059669",
        secondary: "#ec4899",
        glassBg: "rgba(0,0,0,0.03)",
        borderColor: "rgba(0,0,0,0.06)",
        font: MODERN_SANS,
        padding: 5,
        gap: 5,
      },
    };

    this.matcha = null;
    this.styleElement = null;
  }

  init(matcha) {
    this.matcha = matcha;
    this._injectBaseVariables();
  }

  /**
   * 注入基础 CSS 变量映射
   */
  _injectBaseVariables() {
    this.styleElement = document.createElement("style");
    this.styleElement.id = "matcha-style-module";
    this.styleElement.textContent = `
      :root {
        --matcha-bg: transparent;
        --matcha-fg: #ffffff;
      }
      .matcha-slide {
        --slide-bg: var(--matcha-bg);
        --slide-fg: var(--matcha-fg);
        --slide-h1: var(--matcha-h1);
        --slide-h2: var(--matcha-h2);
        --slide-note: var(--matcha-note);
        --slide-card-bg: var(--matcha-card);
        --slide-accent: var(--matcha-accent);
        --slide-secondary: var(--matcha-secondary);
        --slide-glass-bg: var(--glass-bg);
        --slide-border-color: var(--border-color);
      }
    `;
    document.head.appendChild(this.styleElement);
    this._setGlobalTheme(this.options.defaultTheme);
  }

  /**
   * 尺寸解析器
   */
  _resolveSize(value, type) {
    const scale = SIZE_SCALES[type];
    if (!scale) return value;
    const level = parseInt(value, 10);
    if (!isNaN(level)) {
      const clamped = Math.max(1, Math.min(10, level));
      return scale[clamped];
    }
    return value;
  }

  /**
   * 设置全局主题
   */
  _setGlobalTheme(themeName) {
    const theme = this.themes[themeName];
    if (!theme) return;

    const root = document.documentElement;
    const setProp = (k, v) => root.style.setProperty(k, v);

    setProp("--matcha-bg", theme.bg);
    setProp("--matcha-fg", theme.fg);
    setProp("--matcha-h1", theme.h1);
    setProp("--matcha-h2", theme.h2);
    setProp("--matcha-note", theme.note);
    setProp("--matcha-card", theme.card);
    setProp("--matcha-accent", theme.accent);
    setProp("--matcha-secondary", theme.secondary);
    setProp("--glass-bg", theme.glassBg);
    setProp("--border-color", theme.borderColor);
    setProp("--font-main", theme.font);

    if (theme.padding) {
      setProp("--slide-padding", this._resolveSize(theme.padding, "padding"));
    }
    if (theme.gap) {
      setProp("--matcha-gap", this._resolveSize(theme.gap, "gap"));
    }
  }

  /**
   * 提取全局样式定义 <!-- global-style: ... -->
   */
  extractGlobalStyles(markdown) {
    const regex = /<!--\s*global-style:\s*(.+?)\s*-->/g;
    return markdown.replace(regex, (match, content) => {
      this._parseAndMergeStyles(content, this.globalStyles);
      return "";
    });
  }

  /**
   * 解析单页样式 <!-- style: ... --> 或 <!-- theme: ... -->
   */
  parseStyleDirective(block) {
    let cleanBlock = block;
    let themeName = null;
    const styles = {};

    const themeMatch = block.match(/<!--\s*theme:\s*([\w-]+)\s*-->/);
    if (themeMatch) {
      themeName = themeMatch[1];
      cleanBlock = cleanBlock.replace(themeMatch[0], "");
    }

    const styleMatch = block.match(/<!--\s*style:\s*(.+?)\s*-->/);
    if (styleMatch) {
      this._parseAndMergeStyles(styleMatch[1], styles);
      cleanBlock = cleanBlock.replace(styleMatch[0], "");
    }

    return { cleanBlock, themeName, styles };
  }

  _parseAndMergeStyles(styleStr, targetObj) {
    styleStr.split(",").forEach((pair) => {
      const [key, value] = pair.split("=").map((s) => s.trim());
      if (key && value) {
        if (key === "text") targetObj["fg"] = value;
        else targetObj[key] = value;
      }
    });
  }

  /**
   * 应用样式到 Slide DOM
   */
  applySlideTheme(slideElement, themeName, localStyles = {}) {
    const currentThemeName = themeName || this.options.defaultTheme;
    let themeConfig = this.themes[currentThemeName] || this.themes["matcha"];

    slideElement.dataset.theme = currentThemeName;

    const finalStyles = {
      ...themeConfig,
      ...this.globalStyles,
      ...localStyles,
    };

    const setVar = (name, value) => {
      if (value) slideElement.style.setProperty(name, value);
    };

    setVar("--slide-bg", finalStyles.bg);
    setVar("--slide-fg", finalStyles.fg);
    setVar("--slide-h1", finalStyles.h1);
    setVar("--slide-h2", finalStyles.h2);
    setVar("--slide-note", finalStyles.note);
    setVar("--slide-card-bg", finalStyles.card);
    setVar("--slide-accent", finalStyles.accent);
    setVar("--slide-secondary", finalStyles.secondary);
    setVar("--slide-glass-bg", finalStyles.glassBg);
    setVar("--slide-border-color", finalStyles.borderColor);

    if (finalStyles.padding) {
      setVar(
        "--slide-padding",
        this._resolveSize(finalStyles.padding, "padding")
      );
    }
    if (finalStyles.gap) {
      setVar("--matcha-gap", this._resolveSize(finalStyles.gap, "gap"));
    }
    if (finalStyles.font) {
      slideElement.style.fontFamily = finalStyles.font;
    }
  }

  destroy() {
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }
    this.styleElement = null;
    this.matcha = null;
  }
}

export default Style;
window.MatchaStyle = Style;
