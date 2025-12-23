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

    // KaTeX 就绪控制：用于异步加载后自动重渲染
    this._readyResolver = null;
    this.ready = window.katex
      ? Promise.resolve()
      : new Promise((resolve) => {
          this._readyResolver = resolve;
        });
    this._rerenderScheduled = false;
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
    // 已就绪：直接 resolve
    if (window.katex) {
      if (this._readyResolver) this._readyResolver();
      this._readyResolver = null;
      return;
    }

    // 已存在脚本：挂载 load 监听即可（避免重复插入）
    const existing = document.getElementById("matcha-katex-js");
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.katex && this._readyResolver) this._readyResolver();
        this._readyResolver = null;
        this._onKatexReady();
      });
      return;
    }

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
    script.onload = () => {
      if (this._readyResolver) this._readyResolver();
      this._readyResolver = null;
      this._onKatexReady();
    };
    script.onerror = () => {
      console.error("Matcha: KaTeX load failed.");
    };
    document.head.appendChild(script);
  }

  /**
   * KaTeX 就绪后自动重渲染一次（避免用户刷新）
   * @private
   */
  _onKatexReady() {
    if (!this.matcha) return;
    if (this._rerenderScheduled) return;
    this._rerenderScheduled = true;

    requestAnimationFrame(() => {
      try {
        const sourceScript = document.getElementById(this.matcha.config.scriptId);
        if (!sourceScript) return;
        const raw = sourceScript.textContent;
        const currentIndex = this.matcha.currentSlideIndex || 0;

        // 重新构建并回到当前页
        this.matcha.parseAndBuild(raw);
        this.matcha.goto(
          Math.min(currentIndex, this.matcha.slidesElements.length - 1),
          "forward"
        );
      } finally {
        this._rerenderScheduled = false;
      }
    });
  }

  /**
   * 预处理：提取数学公式并替换为占位符
   * 防止 Markdown 解析器破坏 LaTeX 语法
   */
  preprocess(text) {
    this.mathBlocks = [];
    if (!text) return "";

    // 0. 保护代码块：先将代码块替换为临时占位符，防止代码块中的 $ 被误判为公式
    const tempCodeBlocks = [];
    let processed = text.replace(/```[\s\S]*?```|`[^`]+`/g, (match) => {
      const id = tempCodeBlocks.length;
      tempCodeBlocks.push(match);
      return `%%%MATCHA-TEMP-CODE-${id}%%%`;
    });

    // 1. 处理块级公式 $$...$$
    // 使用 [\s\S] 匹配换行
    processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, tex) => {
      const id = this.mathBlocks.length;
      this.mathBlocks.push({
        type: "display",
        tex: tex.trim(),
      });
      return `%%%MATCHA-MATH-BLOCK-${id}%%%`;
    });

    // 2. 处理行内公式 $...$
    // 避免匹配到 $...$ 中的 $，且不跨行（通常行内公式不跨行）
    processed = processed.replace(/\$([^$\n]+?)\$/g, (match, tex) => {
      const id = this.mathBlocks.length;
      this.mathBlocks.push({
        type: "inline",
        tex: tex.trim(),
      });
      return `%%%MATCHA-MATH-INLINE-${id}%%%`;
    });

    // 3. 还原代码块
    processed = processed.replace(
      /%%%MATCHA-TEMP-CODE-(\d+)%%%/g,
      (match, id) => {
        return tempCodeBlocks[parseInt(id)];
      }
    );

    return processed;
  }

  /**
   * 后处理：将占位符替换为渲染后的 HTML
   */
  postprocess(html) {
    if (!window.katex) {
      // 触发加载，并在 ready 后尝试自动重渲染
      this._checkAndLoadKatex();
      if (this.ready && typeof this.ready.then === "function") {
        this.ready.then(() => this._onKatexReady());
      }
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
