/**
 * @module style
 * @description 主题样式模块，支持自定义颜色、字体和视觉效果
 * @version 1.0.0
 *
 * @syntax
 * 全局主题设置（在第一张幻灯片前）:
 *   <!-- theme: dark -->
 *   <!-- theme: light -->
 *   <!-- theme: custom -->
 *
 * 单页样式覆盖:
 *   <!-- style: bg=#1a1a1a, accent=#00ff88 -->
 *   <!-- style: bg=linear-gradient(135deg, #667eea 0%, #764ba2 100%) -->
 *
 * 预设主题:
 *   <!-- theme: matcha -->    // 默认抹茶绿
 *   <!-- theme: sakura -->    // 樱花粉
 *   <!-- theme: ocean -->     // 海洋蓝
 *   <!-- theme: sunset -->    // 日落橙
 *   <!-- theme: mono -->      // 黑白极简
 */
class Style {
  constructor(options = {}) {
    this.options = {
      // 默认主题
      theme: "matcha",
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
    this._createStyleElement();
    this.setTheme(this.options.theme);
  }

  /**
   * 创建样式元素
   * @private
   */
  _createStyleElement() {
    this.styleElement = document.createElement("style");
    this.styleElement.id = "matcha-theme-vars";
    document.head.appendChild(this.styleElement);
  }

  /**
   * 设置主题
   * @param {string} themeName - 主题名称
   */
  setTheme(themeName) {
    const theme = this.themes[themeName];
    if (!theme) {
      console.warn(`[Matcha Style] 未找到主题: ${themeName}`);
      return;
    }
    this._applyTheme(theme);
    this.options.theme = themeName;
  }

  /**
   * 应用主题变量
   * @private
   * @param {Object} theme - 主题配置对象
   */
  _applyTheme(theme) {
    const css = `
:root {
  --matcha-bg: ${theme.bg};
  --matcha-fg: ${theme.fg};
  --matcha-accent: ${theme.accent};
  --matcha-secondary: ${theme.secondary};
  --glass-bg: ${theme.glassBg};
  --border-color: ${theme.borderColor};
  --font-main: ${theme.font};
}
body, html {
  background: var(--matcha-bg);
  color: var(--matcha-fg);
  font-family: var(--font-main);
}
    `;
    this.styleElement.textContent = css;
  }

  /**
   * 自定义单个 CSS 变量
   * @param {string} name - 变量名（不含 --matcha- 前缀）
   * @param {string} value - 变量值
   */
  setVar(name, value) {
    document.documentElement.style.setProperty(`--matcha-${name}`, value);
  }

  /**
   * 批量设置 CSS 变量
   * @param {Object} vars - 变量对象 { name: value }
   */
  setVars(vars) {
    Object.entries(vars).forEach(([name, value]) => {
      this.setVar(name, value);
    });
  }

  /**
   * 注册自定义主题
   * @param {string} name - 主题名称
   * @param {Object} config - 主题配置
   */
  registerTheme(name, config) {
    this.themes[name] = {
      ...this.themes.matcha, // 继承默认主题作为 fallback
      ...config,
    };
  }

  /**
   * 获取当前主题配置
   * @returns {Object} 当前主题配置
   */
  getTheme() {
    return this.themes[this.options.theme];
  }

  /**
   * 获取所有可用主题名称
   * @returns {string[]} 主题名称数组
   */
  getThemeNames() {
    return Object.keys(this.themes);
  }

  /**
   * 解析幻灯片中的样式指令
   * @param {string} block - 幻灯片内容块
   * @returns {Object} { cleanBlock, styles }
   */
  parseStyleDirective(block) {
    let cleanBlock = block;
    const styles = {};

    // 解析 <!-- theme: xxx -->
    const themeMatch = block.match(/<!--\s*theme:\s*([\w-]+)\s*-->/);
    if (themeMatch) {
      this.setTheme(themeMatch[1]);
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

    return { cleanBlock, styles };
  }

  /**
   * 应用单页样式
   * @param {HTMLElement} slideElement - 幻灯片 DOM 元素
   * @param {Object} styles - 样式对象
   */
  applySlideStyle(slideElement, styles) {
    if (styles.bg) {
      slideElement.style.background = styles.bg;
    }
    if (styles.fg) {
      slideElement.style.color = styles.fg;
    }
    if (styles.accent) {
      slideElement.style.setProperty("--matcha-accent", styles.accent);
    }
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

/*
 * ============================================
 * 使用示例 (Demo)
 * ============================================
 *
 * // 1. 基础使用 - 设置预设主题
 * const matcha = new Matcha({
 *   style: { theme: "ocean" }
 * });
 *
 * // 2. 运行时切换主题
 * matcha.modules.style.setTheme("sakura");
 *
 * // 3. 自定义单个变量
 * matcha.modules.style.setVar("accent", "#ff6b6b");
 *
 * // 4. 注册自定义主题
 * matcha.modules.style.registerTheme("myTheme", {
 *   bg: "#1a1a2e",
 *   fg: "#eaeaea",
 *   accent: "#e94560",
 *   secondary: "#0f3460"
 * });
 *
 * // 5. Markdown 中使用
 * // <!-- theme: ocean -->
 * // # 标题
 * //
 * // <!-- style: bg=#2d1b4e, accent=#ff6b9d -->
 * // ## 这一页使用自定义背景
 */
