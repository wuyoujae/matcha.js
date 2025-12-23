/**
 * @module layout
 * @description 布局模块，支持四种核心布局模式及局部对齐控制
 * @version 1.2.0
 */
class Layout {
  constructor(options = {}) {
    this.options = {
      // 默认布局
      defaultLayout: "center",
      // 列分隔符
      colSeparator: /^\s*\+\+\+\s*$/gm,
      // 行分隔符
      rowSeparator: /^\s*===\s*$/gm,
      // 默认间距
      gap: "40px",
      ...options,
    };

    // 布局类型定义
    this.layouts = {
      center: {
        name: "居中布局",
        description: "内容水平垂直居中，适合标题页",
        cssClass: "layout-center",
      },
      cols: {
        name: "横分布局",
        description: "将内容分成多列，使用 +++ 分隔",
        cssClass: "layout-cols",
      },
      rows: {
        name: "纵分布局",
        description: "将内容分成多行，使用 === 分隔",
        cssClass: "layout-rows",
      },
      grid: {
        name: "复合布局",
        description: "网格布局，支持行列组合",
        cssClass: "layout-grid",
      },
      doc: {
        name: "文档布局",
        description: "左对齐文档流，适合长文本",
        cssClass: "layout-doc",
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
    this._injectStyles();
  }

  /**
   * 注入布局样式
   * @private
   */
  _injectStyles() {
    this.styleElement = document.createElement("style");
    this.styleElement.id = "matcha-layout-styles";
    this.styleElement.textContent = `
/* ===== Matcha Layout System v2.1 ===== */

/* 1. 基础容器设置 */
.matcha-cols-container,
.matcha-rows-container,
.matcha-grid-container {
  display: grid;
  gap: var(--matcha-gap, ${this.options.gap});
  width: 100%;
  height: 100%;
  box-sizing: border-box; 
}

/* 2. 居中布局 (Center) */
.matcha-slide.layout-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* 3. 文档布局 (Doc) */
.matcha-slide.layout-doc {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  text-align: left;
  padding-top: 80px; 
}

/* 4. 横分布局 (Cols) */
.matcha-slide.layout-cols {
  display: flex;
  flex-direction: column;
  justify-content: center; 
}

.matcha-col {
  display: flex;
  flex-direction: column;
  justify-content: center; /* 默认垂直居中 */
  align-items: center;     /* 默认水平居中 */
  text-align: center;      /* 默认文字居中 */
  height: 100%;
  min-height: 0;
  position: relative;
  padding: 0 24px; 
  box-sizing: border-box;
}

/* 5. 纵分布局 (Rows) */
.matcha-slide.layout-rows {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.matcha-row {
  display: flex;
  flex-direction: column;
  justify-content: center; /* 默认垂直居中 */
  align-items: center;     /* 默认水平居中 */
  text-align: center;      /* 默认文字居中 */
  width: 100%;
  min-height: 0;
  padding: 24px 0;
  box-sizing: border-box;
}

/* 6. 复合网格 (Grid) */
.matcha-grid-cell {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center; /* Grid 默认水平居中 */
  text-align: center;  /* Grid 默认文字居中 */
  min-height: 0;
  box-sizing: border-box;
  padding: 20px; 
}

/* === 紧凑模式 === */
.matcha-slide.compact {
  --matcha-gap: 30px !important;
}
.matcha-slide.compact .matcha-col,
.matcha-slide.compact .matcha-row,
.matcha-slide.compact .matcha-grid-cell {
  justify-content: flex-start; 
  padding: 10px; 
}

/* === 全局对齐修饰符 (级联控制) === */
/* 垂直对齐 */
.matcha-slide.valign-top .matcha-col,
.matcha-slide.valign-top .matcha-row,
.matcha-slide.valign-top .matcha-grid-cell { justify-content: flex-start; }

.matcha-slide.valign-bottom .matcha-col,
.matcha-slide.valign-bottom .matcha-row,
.matcha-slide.valign-bottom .matcha-grid-cell { justify-content: flex-end; }

/* 水平对齐 */
.matcha-slide.halign-left .matcha-col,
.matcha-slide.halign-left .matcha-grid-cell { align-items: flex-start; text-align: left; }

.matcha-slide.halign-right .matcha-col,
.matcha-slide.halign-right .matcha-grid-cell { align-items: flex-end; text-align: right; }

.matcha-slide.halign-center .matcha-col,
.matcha-slide.halign-center .matcha-grid-cell { align-items: center; text-align: center; }


/* === 局部对齐覆盖 (Local Overrides) === */
/* 使用 !important 确保局部设置优先级高于全局设置 */

/* 局部水平对齐 */
.local-halign-left { align-items: flex-start !important; text-align: left !important; }
.local-halign-center { align-items: center !important; text-align: center !important; }
.local-halign-right { align-items: flex-end !important; text-align: right !important; }

/* 局部垂直对齐 */
.local-valign-top { justify-content: flex-start !important; }
.local-valign-center { justify-content: center !important; }
.local-valign-bottom { justify-content: flex-end !important; }
    `;
    document.head.appendChild(this.styleElement);
  }

  /**
   * 解析局部对齐指令
   * 语法: <!-- align: left|center|right --> 或 <!-- valign: top|center|bottom -->
   * @param {string} text - 内容块文本
   * @returns {Object} { text, halign, valign }
   * @private
   */
  _extractLocalAlign(text) {
    let halign = null;
    let valign = null;
    let cleanText = text;

    // 正则匹配 <!-- align: xxx --> 或 <!-- valign: xxx -->
    // 支持逗号分隔: <!-- align: left, valign: bottom -->
    const directiveRegex = /<!--\s*(align|valign):\s*([\w-, ]+?)\s*-->/gi;

    cleanText = cleanText.replace(directiveRegex, (match, type, value) => {
      // 解析 value 里的逗号
      // 如果写在一起 <!-- align: left, valign: bottom --> 这里的正则其实只能捕获第一个 key
      // 建议写法：分开写或者扩充正则。这里简单处理单独指令

      const val = value.trim();
      if (type === "align") halign = val;
      if (type === "valign") valign = val;
      return ""; // 移除指令
    });

    // 处理混合写法 <!-- align: left, valign: top --> 的更强壮逻辑
    // 为了简单，我们也可以支持单独的 match loop
    const complexRegex = /<!--\s*(.+?)\s*-->/g;
    cleanText = text.replace(complexRegex, (match, content) => {
      let isDirective = false;
      content.split(",").forEach((part) => {
        const [k, v] = part.split("=").map((s) => s.trim().toLowerCase());
        // 兼容 align=left 和 align: left 两种写法
        const [k2, v2] = part.split(":").map((s) => s.trim().toLowerCase());

        const key = k || k2;
        const val = v || v2;

        if (key === "align") {
          halign = val;
          isDirective = true;
        }
        if (key === "valign") {
          valign = val;
          isDirective = true;
        }
      });
      return isDirective ? "" : match;
    });

    return { text: cleanText, halign, valign };
  }

  /**
   * 解析全局布局指令 (保持不变)
   */
  parseLayoutDirective(block) {
    let cleanBlock = block;
    let layoutType = this.options.defaultLayout;
    let layoutParams = {};

    const layoutMatch = block.match(
      /<!--\s*layout:\s*([\w-]+)(?:\s*,\s*(.+?))?\s*-->/
    );

    if (layoutMatch) {
      layoutType = layoutMatch[1];
      cleanBlock = cleanBlock.replace(layoutMatch[0], "");
      if (layoutMatch[2]) {
        layoutMatch[2].split(",").forEach((param) => {
          const [key, value] = param.split("=").map((s) => s.trim());
          if (key) layoutParams[key] = value || true;
        });
      }
    }

    return { cleanBlock, layoutType, layoutParams };
  }

  buildLayout(block, layoutType, params, renderFn) {
    const slideDiv = document.createElement("div");
    const layoutConfig = this.layouts[layoutType] || this.layouts.center;
    slideDiv.className = `matcha-slide ${layoutConfig.cssClass}`;

    if (params.valign) slideDiv.classList.add(`valign-${params.valign}`);
    if (params.halign) slideDiv.classList.add(`halign-${params.halign}`);
    if (params.compact) slideDiv.classList.add("compact");

    switch (layoutType) {
      case "cols":
        this._buildColsLayout(slideDiv, block, params, renderFn);
        break;
      case "rows":
        this._buildRowsLayout(slideDiv, block, params, renderFn);
        break;
      case "grid":
        this._buildGridLayout(slideDiv, block, params, renderFn);
        break;
      default:
        slideDiv.innerHTML = renderFn(block);
    }

    return slideDiv;
  }

  _buildColsLayout(slideDiv, block, params, renderFn) {
    const cols = block.split(this.options.colSeparator);
    if (cols.length <= 1 && !params.force) {
      slideDiv.innerHTML = renderFn(block);
      return;
    }

    const container = document.createElement("div");
    container.className = "matcha-cols-container";

    if (params.ratio) {
      const ratios = params.ratio.split(":").map((r) => `${r}fr`);
      container.style.gridTemplateColumns = ratios.join(" ");
    } else {
      container.style.gridTemplateColumns = `repeat(${cols.length}, 1fr)`;
    }

    cols.forEach((colContent) => {
      const colDiv = document.createElement("div");
      colDiv.className = "matcha-col";

      // === 提取并应用局部对齐 ===
      const { text, halign, valign } = this._extractLocalAlign(colContent);
      if (halign) colDiv.classList.add(`local-halign-${halign}`);
      if (valign) colDiv.classList.add(`local-valign-${valign}`);

      colDiv.innerHTML = renderFn(text);
      container.appendChild(colDiv);
    });

    slideDiv.appendChild(container);
  }

  _buildRowsLayout(slideDiv, block, params, renderFn) {
    const rows = block.split(this.options.rowSeparator);
    if (rows.length <= 1 && !params.force) {
      slideDiv.innerHTML = renderFn(block);
      return;
    }

    const container = document.createElement("div");
    container.className = "matcha-rows-container";

    if (params.ratio) {
      const ratios = params.ratio.split(":").map((r) => `${r}fr`);
      container.style.gridTemplateRows = ratios.join(" ");
    } else {
      container.style.gridTemplateRows = `repeat(${rows.length}, 1fr)`;
    }

    rows.forEach((rowContent) => {
      const rowDiv = document.createElement("div");
      rowDiv.className = "matcha-row";

      // === 提取并应用局部对齐 ===
      const { text, halign, valign } = this._extractLocalAlign(rowContent);
      if (halign) rowDiv.classList.add(`local-halign-${halign}`);
      if (valign) rowDiv.classList.add(`local-valign-${valign}`);

      rowDiv.innerHTML = renderFn(text);
      container.appendChild(rowDiv);
    });

    slideDiv.appendChild(container);
  }

  _buildGridLayout(slideDiv, block, params, renderFn) {
    const rows = block.split(this.options.rowSeparator);
    const container = document.createElement("div");
    container.className = "matcha-grid-container";

    let maxCols = 1;
    const gridCells = [];

    rows.forEach((rowContent) => {
      const cols = rowContent.split(this.options.colSeparator);
      maxCols = Math.max(maxCols, cols.length);
      cols.forEach((cellContent) => {
        gridCells.push(cellContent);
      });
    });

    const numCols = params.cols ? parseInt(params.cols) : maxCols;
    const numRows = params.rows ? parseInt(params.rows) : rows.length;

    container.style.gridTemplateColumns = `repeat(${numCols}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${numRows}, 1fr)`;

    gridCells.forEach((cellContent) => {
      const cellDiv = document.createElement("div");
      cellDiv.className = "matcha-grid-cell";

      // === 提取并应用局部对齐 ===
      const { text, halign, valign } = this._extractLocalAlign(cellContent);
      if (halign) cellDiv.classList.add(`local-halign-${halign}`);
      if (valign) cellDiv.classList.add(`local-valign-${valign}`);

      cellDiv.innerHTML = renderFn(text);
      container.appendChild(cellDiv);
    });

    slideDiv.appendChild(container);
  }

  getLayouts() {
    return this.layouts;
  }
  registerLayout(name, config) {
    this.layouts[name] = config;
  }
  destroy() {
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }
  }
}

export default Layout;
window.MatchaLayout = Layout;
