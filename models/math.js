/**
 * @module math
 * @description 数学公式支持模块 (基于 KaTeX)
 * @version 1.0.1
 *
 * @syntax
 * 行内公式: $E=mc^2$
 * 块级公式:
 *   $$
 *   \int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
 *   $$
 */
class MathSupport {
  constructor(options = {}) {
    this.options = {
      katexCss: "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css",
      katexJs: "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js",
      ...options,
    };
    this.matcha = null;
    this.mathBlocks = [];
  }

  init(matcha) {
    this.matcha = matcha;
    this._checkAndLoadKatex();
  }

  /**
   * 检查并加载 KaTeX 资源
   * 注意：动态加载可能是异步的，建议在 HTML 中直接引入
   */
  _checkAndLoadKatex() {
    if (!window.katex && !document.getElementById("matcha-katex-js")) {
      console.warn("Matcha: KaTeX not found. Loading from CDN...");

      // Load CSS
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = this.options.katexCss;
      document.head.appendChild(link);

      // Load JS
      const script = document.createElement("script");
      script.id = "matcha-katex-js";
      script.src = this.options.katexJs;
      // script.async = false; // Try to force sync but it blocks
      script.onload = () => {
        console.log(
          "Matcha: KaTeX loaded. Please refresh if math is not rendered."
        );
        // Optional: re-render if we could
      };
      document.head.appendChild(script);
    }
  }

  /**
   * 预处理：提取数学公式并替换为占位符
   * 防止 Markdown 解析器破坏 LaTeX 语法
   */
  preprocess(text) {
    this.mathBlocks = [];
    if (!text) return "";

    // 使用不易与 Markdown 冲突的占位符
    // 格式：%%%MATCHA-MATH-BLOCK-{id}%%%
    // 避免使用下划线 _，因为 Markdown 会解析为斜体

    // 1. 处理块级公式 $$...$$
    // 使用 [\s\S] 匹配换行
    let processed = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, tex) => {
      const id = this.mathBlocks.length;
      this.mathBlocks.push({
        type: "display",
        tex: tex.trim(),
      });
      return `%%%MATCHA-MATH-BLOCK-${id}%%%`;
    });

    // 2. 处理行内公式 $...$
    // 避免匹配到 $...$ 中的 $，且不跨行（通常行内公式不跨行）
    // 或者是简单的非贪婪匹配
    processed = processed.replace(/\$([^$\n]+?)\$/g, (match, tex) => {
      const id = this.mathBlocks.length;
      this.mathBlocks.push({
        type: "inline",
        tex: tex.trim(),
      });
      return `%%%MATCHA-MATH-INLINE-${id}%%%`;
    });

    return processed;
  }

  /**
   * 后处理：将占位符替换为渲染后的 HTML
   */
  postprocess(html) {
    if (!window.katex) {
      if (this.mathBlocks.length > 0) {
        console.warn("Matcha: KaTeX not ready to render math.");
      }
      // 如果 KaTeX 没加载好，还原回源码或者保持占位符？
      // 还原回源码比较好，至少能看到 LaTeX
      return this._restoreRaw(html);
    }

    return html.replace(
      /%%%MATCHA-MATH-(BLOCK|INLINE)-(\d+)%%%/g,
      (match, type, id) => {
        const block = this.mathBlocks[parseInt(id)];
        if (!block) return match;

        try {
          return window.katex.renderToString(block.tex, {
            displayMode: block.type === "display",
            throwOnError: false, // 容错
            output: "html", // 生成 HTML (无 MathML，兼容性好)
          });
        } catch (e) {
          console.error("KaTeX Render Error:", e);
          return `<span style="color:red">Error: ${block.tex}</span>`;
        }
      }
    );
  }

  _restoreRaw(html) {
    return html.replace(
      /%%%MATCHA-MATH-(BLOCK|INLINE)-(\d+)%%%/g,
      (match, type, id) => {
        const block = this.mathBlocks[parseInt(id)];
        if (!block) return match;
        return type === "BLOCK" ? `$$${block.tex}$$` : `$${block.tex}$`;
      }
    );
  }

  destroy() {
    this.matcha = null;
    this.mathBlocks = [];
  }
}

export default MathSupport;
window.MatchaMath = MathSupport;
