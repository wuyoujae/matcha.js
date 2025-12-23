/**
 * @module code
 * @description 代码展示模块 - 增强代码块的视觉效果和交互能力
 * @version 1.0.0
 *
 * @syntax
 * 代码块指令（放在代码块之前）:
 *   <!-- code: lang=javascript, lineNumbers=true, highlight=2,5-7, title=示例 -->
 *
 * 参数:
 *   lang: 语言名称（用于显示标签，不影响高亮）
 *   lineNumbers: 是否显示行号 (true/false)
 *   highlight: 高亮指定行，支持单行和范围 (如 "2,5-7,10")
 *   title: 代码块标题（如文件名）
 *   copy: 是否显示复制按钮 (true/false，默认 true)
 *   maxHeight: 最大高度，超出后滚动 (如 "300px")
 */
class Code {
  constructor(options = {}) {
    this.options = {
      // 默认显示行号
      defaultLineNumbers: false,
      // 默认显示复制按钮
      defaultCopy: true,
      // 高亮行的背景色
      highlightColor: "rgba(255, 255, 255, 0.08)",
      // 语言标签颜色映射
      langColors: {
        javascript: "#f7df1e",
        js: "#f7df1e",
        typescript: "#3178c6",
        ts: "#3178c6",
        python: "#3776ab",
        py: "#3776ab",
        html: "#e34f26",
        css: "#1572b6",
        json: "#292929",
        bash: "#4eaa25",
        shell: "#4eaa25",
        markdown: "#083fa1",
        md: "#083fa1",
        java: "#007396",
        c: "#a8b9cc",
        cpp: "#00599c",
        go: "#00add8",
        rust: "#dea584",
        sql: "#e38c00",
        php: "#777bb4",
        ruby: "#cc342d",
        swift: "#fa7343",
        kotlin: "#7f52ff",
        vue: "#42b883",
        react: "#61dafb",
        jsx: "#61dafb",
        tsx: "#3178c6",
      },
      ...options,
    };

    this.matcha = null;
    this.styleElement = null;
    this.codeBlockConfigs = []; // 存储每个代码块的配置
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
   * 注入代码块样式
   * @private
   */
  _injectStyles() {
    if (document.getElementById("matcha-code-module")) return;

    this.styleElement = document.createElement("style");
    this.styleElement.id = "matcha-code-module";
    this.styleElement.textContent = `
/* Matcha Code Module - 增强代码块样式 */

.matcha-code-wrapper {
  position: relative;
  margin: 1vmin 0;
  border-radius: 12px;
  overflow: hidden;
  background: #0d0d0d;
  border: 1px solid var(--border-weak, rgba(255,255,255,0.1));
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  /* 自适应容器尺寸 */
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  /* 允许在 flex/grid 布局中收缩 */
  min-width: 0;
  min-height: 0;
  /* 在 flex 容器中自动填充剩余空间 */
  flex: 1 1 auto;
  /* 设置显示方式为 flex 以便内部元素也能自适应 */
  display: flex;
  flex-direction: column;
  /* 默认最大高度 */
  max-height: 100%;
}

/* 代码块头部（标题栏） */
.matcha-code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  min-height: 16px;
  /* 不收缩 */
  flex-shrink: 0;
}

/* macOS 红绿灯按钮 */
.matcha-code-dots {
  display: flex;
  gap: 8px;
}

.matcha-code-dots span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.matcha-code-dots span:nth-child(1) { background: #ff5f56; }
.matcha-code-dots span:nth-child(2) { background: #ffbd2e; }
.matcha-code-dots span:nth-child(3) { background: #27c93f; }

/* 标题和语言标签 */
.matcha-code-title {
  font-family: var(--font-mono, monospace);
  font-size: 0.85em;
  color: rgba(255, 255, 255, 0.5);
  flex: 1;
  text-align: center;
  margin: 0 16px;
}

.matcha-code-lang {
  font-family: var(--font-mono, monospace);
  font-size: 0.75em;
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 复制按钮 */
.matcha-code-copy {
  position: absolute;
  top: 52px;
  right: 12px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75em;
  font-family: var(--font-mono, monospace);
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
  opacity: 0;
}

.matcha-code-wrapper:hover .matcha-code-copy {
  opacity: 1;
}

.matcha-code-copy:hover {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
}

.matcha-code-copy.copied {
  background: rgba(0, 230, 118, 0.2);
  border-color: rgba(0, 230, 118, 0.3);
  color: #00e676;
}

/* 代码内容区域 */
.matcha-code-content {
  position: relative;
  /* 自适应剩余空间 */
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  /* 双向滚动 */
  overflow: auto;
}

.matcha-code-wrapper pre {
  margin: 0 !important;
  padding: 20px !important;
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  overflow: visible !important;
  /* 确保代码不换行，超出时可滚动 */
  white-space: pre !important;
}

.matcha-code-wrapper pre::before {
  display: none !important;
}

.matcha-code-wrapper code {
  display: block;
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  font-size: var(--code-size, clamp(14px, 2.2vmin, 30px));
  line-height: 1.6;
  color: #e6edf3;
  tab-size: 2;
  /* 保留空格和缩进 */
  white-space: pre !important;
  /* 文本左对齐 */
  text-align: left;
}

/* 带行号的代码 */
.matcha-code-wrapper.with-line-numbers pre {
  padding-left: 60px !important;
}

.matcha-code-lines {
  position: absolute;
  top: 20px;
  left: 0;
  width: 45px;
  padding-right: 12px;
  text-align: right;
  font-family: var(--font-mono, monospace);
  font-size: var(--code-size, clamp(14px, 2.2vmin, 30px));
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.25);
  user-select: none;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  pointer-events: none;
}

.matcha-code-lines span {
  display: block;
}

/* 高亮行 */
.matcha-code-highlight-line {
  display: block;
  background: ${this.options.highlightColor};
  margin: 0 -20px;
  padding: 0 20px;
  border-left: 3px solid var(--accent-color, #00e676);
}

/* 带行号时高亮行的额外调整 */
.matcha-code-wrapper.with-line-numbers .matcha-code-highlight-line {
  margin-left: -60px;
  padding-left: 60px;
}

/* 自定义最大高度 */
.matcha-code-wrapper.has-custom-height .matcha-code-content {
  max-height: var(--code-max-height);
  flex: 0 1 auto;
}

/* 无高度限制（不受容器约束） */
.matcha-code-wrapper.no-height-limit {
  max-height: none;
}
.matcha-code-wrapper.no-height-limit .matcha-code-content {
  flex: 0 0 auto;
}

/* 滚动条样式 */
.matcha-code-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.matcha-code-content::-webkit-scrollbar-track {
  background: transparent;
}

.matcha-code-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}

.matcha-code-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* 语法高亮配色（基础） */
.matcha-code-wrapper .token-keyword { color: #ff7b72; }
.matcha-code-wrapper .token-string { color: #a5d6ff; }
.matcha-code-wrapper .token-number { color: #79c0ff; }
.matcha-code-wrapper .token-comment { color: #8b949e; font-style: italic; }
.matcha-code-wrapper .token-function { color: #d2a8ff; }
.matcha-code-wrapper .token-class { color: #ffa657; }
.matcha-code-wrapper .token-operator { color: #ff7b72; }
.matcha-code-wrapper .token-punctuation { color: #c9d1d9; }
    `;
    document.head.appendChild(this.styleElement);
  }

  /**
   * 解析文本中的代码指令
   * @param {string} text - 原始文本
   * @returns {string} 处理后的文本
   */
  parse(text) {
    this._codeBlockConfigMap = {}; // 代码块索引 -> 配置 的映射

    // 1. 分析文本，建立配置和代码块的对应关系
    // 找出所有代码块的位置
    const codeBlockPattern = /```\w*/g;
    const codeBlockPositions = [];
    let match;
    while ((match = codeBlockPattern.exec(text)) !== null) {
      codeBlockPositions.push(match.index);
    }

    // 找出所有配置指令，并确定它们对应的代码块
    const configPattern = /<!--\s*code:\s*(.+?)\s*-->/g;
    let codeBlockIndex = 0;
    let processedText = text.replace(configPattern, (match, params, offset) => {
      const config = this._parseParams(params);

      // 找到这个配置之后最近的代码块
      while (
        codeBlockIndex < codeBlockPositions.length &&
        codeBlockPositions[codeBlockIndex] < offset
      ) {
        codeBlockIndex++;
      }

      // 将配置绑定到下一个代码块（实际索引需要除以2，因为每个代码块有开始和结束标记）
      const actualCodeBlockIndex = Math.floor(codeBlockIndex / 2);
      this._codeBlockConfigMap[actualCodeBlockIndex] = config;

      // 移除配置指令
      return "";
    });

    // 2. 处理代码块缩进：去除公共前导空格
    processedText = this._normalizeCodeBlockIndent(processedText);

    return processedText;
  }

  /**
   * 规范化代码块缩进：去除由 HTML 格式化产生的公共前导空格
   * @private
   */
  _normalizeCodeBlockIndent(text) {
    // 匹配代码块 ```lang ... ```
    const codeBlockPattern = /(```\w*\n)([\s\S]*?)(```)/g;

    return text.replace(codeBlockPattern, (match, opening, code, closing) => {
      // 将代码按行分割
      const lines = code.split("\n");

      // 过滤掉空行后，找出最小的公共缩进
      const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
      if (nonEmptyLines.length === 0) return match;

      // 计算最小缩进（只计算空格，不计算 tab）
      const minIndent = nonEmptyLines.reduce((min, line) => {
        const leadingSpaces = line.match(/^(\s*)/)[1].length;
        return Math.min(min, leadingSpaces);
      }, Infinity);

      // 如果没有公共缩进，直接返回
      if (minIndent === 0 || minIndent === Infinity) return match;

      // 移除每行的公共缩进
      const normalizedLines = lines.map((line) => {
        // 空行保持空
        if (line.trim().length === 0) return "";
        // 移除公共缩进
        return line.slice(minIndent);
      });

      // 移除开头和结尾的空行
      while (normalizedLines.length > 0 && normalizedLines[0].trim() === "") {
        normalizedLines.shift();
      }
      while (
        normalizedLines.length > 0 &&
        normalizedLines[normalizedLines.length - 1].trim() === ""
      ) {
        normalizedLines.pop();
      }

      return opening + normalizedLines.join("\n") + "\n" + closing;
    });
  }

  /**
   * 后处理：增强已渲染的代码块
   * 应在 DOM 构建后调用
   * @param {HTMLElement} container - 包含代码块的容器
   */
  enhance(container) {
    const codeBlocks = container.querySelectorAll("pre > code");

    // 获取配置映射
    const configMap = this._codeBlockConfigMap || {};
    this._codeBlockConfigMap = {}; // 清空映射

    let actualIndex = 0; // 实际处理的代码块计数

    codeBlocks.forEach((codeElement) => {
      const preElement = codeElement.parentElement;

      // 检查是否已经被增强过
      if (preElement.closest(".matcha-code-wrapper")) return;

      // 获取该代码块的配置
      let config = configMap[actualIndex] || {};
      actualIndex++;

      // 检测语言
      const langClass = codeElement.className.match(/language-(\w+)/);
      const lang = config.lang || (langClass ? langClass[1] : "");

      // 创建包装器
      const wrapper = document.createElement("div");
      wrapper.className = "matcha-code-wrapper";

      // 是否显示行号
      const showLineNumbers =
        config.lineNumbers === "true" ||
        config.lineNumbers === true ||
        (config.lineNumbers === undefined && this.options.defaultLineNumbers);

      if (showLineNumbers) {
        wrapper.classList.add("with-line-numbers");
      }

      // 构建头部
      const header = this._buildHeader(lang, config.title);
      wrapper.appendChild(header);

      // 构建复制按钮
      const showCopy =
        config.copy !== "false" &&
        config.copy !== false &&
        this.options.defaultCopy;

      if (showCopy) {
        const copyBtn = this._buildCopyButton(codeElement);
        wrapper.appendChild(copyBtn);
      }

      // 构建内容区域
      const content = document.createElement("div");
      content.className = "matcha-code-content";

      // 处理高度配置（应用到 wrapper）
      if (config.maxHeight) {
        if (config.maxHeight === "none" || config.maxHeight === "auto") {
          wrapper.classList.add("no-height-limit");
        } else {
          wrapper.classList.add("has-custom-height");
          wrapper.style.setProperty("--code-max-height", config.maxHeight);
        }
      }

      // 处理高亮行
      if (config.highlight) {
        this._applyHighlightLines(codeElement, config.highlight);
      }

      // 添加行号
      if (showLineNumbers) {
        const lines = codeElement.textContent.split("\n");
        const lineNumbers = document.createElement("div");
        lineNumbers.className = "matcha-code-lines";
        lineNumbers.innerHTML = lines
          .map((_, i) => `<span>${i + 1}</span>`)
          .join("");
        content.appendChild(lineNumbers);
      }

      // 移动 pre 到 content
      preElement.parentNode.insertBefore(wrapper, preElement);
      content.appendChild(preElement);
      wrapper.appendChild(content);
    });
  }

  /**
   * 构建代码块头部
   * @private
   */
  _buildHeader(lang, title) {
    const header = document.createElement("div");
    header.className = "matcha-code-header";

    // macOS 红绿灯
    const dots = document.createElement("div");
    dots.className = "matcha-code-dots";
    dots.innerHTML = "<span></span><span></span><span></span>";
    header.appendChild(dots);

    // 标题
    if (title) {
      const titleEl = document.createElement("span");
      titleEl.className = "matcha-code-title";
      titleEl.textContent = title;
      header.appendChild(titleEl);
    }

    // 语言标签
    if (lang) {
      const langEl = document.createElement("span");
      langEl.className = "matcha-code-lang";
      langEl.textContent = lang;
      const color = this.options.langColors[lang.toLowerCase()];
      if (color) {
        langEl.style.background = color;
        langEl.style.color = this._getContrastColor(color);
      }
      header.appendChild(langEl);
    }

    return header;
  }

  /**
   * 构建复制按钮
   * @private
   */
  _buildCopyButton(codeElement) {
    const btn = document.createElement("button");
    btn.className = "matcha-code-copy";
    btn.textContent = "Copy";
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(codeElement.textContent);
        btn.textContent = "Copied!";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = "Copy";
          btn.classList.remove("copied");
        }, 2000);
      } catch (err) {
        btn.textContent = "Failed";
        setTimeout(() => {
          btn.textContent = "Copy";
        }, 2000);
      }
    });
    return btn;
  }

  /**
   * 应用高亮行
   * @private
   */
  _applyHighlightLines(codeElement, highlightStr) {
    const highlightLines = this._parseHighlightLines(highlightStr);
    const lines = codeElement.innerHTML.split("\n");

    codeElement.innerHTML = lines
      .map((line, index) => {
        const lineNum = index + 1;
        if (highlightLines.includes(lineNum)) {
          return `<span class="matcha-code-highlight-line">${line}</span>`;
        }
        return line;
      })
      .join("\n");
  }

  /**
   * 解析高亮行字符串
   * @private
   */
  _parseHighlightLines(str) {
    const lines = [];
    if (!str) return lines;

    str.split(",").forEach((part) => {
      part = part.trim();
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        for (let i = start; i <= end; i++) {
          lines.push(i);
        }
      } else {
        lines.push(Number(part));
      }
    });

    return lines;
  }

  /**
   * 解析参数字符串
   * @private
   */
  _parseParams(paramStr) {
    const params = {};
    if (!paramStr) return params;

    const regex = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^,\s]+))/g;
    let match;

    while ((match = regex.exec(paramStr)) !== null) {
      const key = match[1];
      const value = match[2] ?? match[3] ?? match[4];
      params[key] = value;
    }

    return params;
  }

  /**
   * 根据背景色计算对比色
   * @private
   */
  _getContrastColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#ffffff";
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
    this.codeBlockConfigs = [];
  }
}

export default Code;
window.MatchaCode = Code;
