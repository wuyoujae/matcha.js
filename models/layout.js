/**
 * @module layout
 * @description 布局模块，支持四种核心布局模式，超越 reveal.js 的单一居中布局
 * @version 1.0.0
 *
 * @syntax
 * 布局声明（在每页开头）:
 *   <!-- layout: center -->     居中布局（默认）
 *   <!-- layout: cols -->       横分布局（多列）
 *   <!-- layout: rows -->       纵分布局（多行）
 *   <!-- layout: grid -->       复合布局（网格）
 *
 * 横分布局 - 使用 +++ 分隔列:
 *   <!-- layout: cols -->
 *   左侧内容
 *   +++
 *   右侧内容
 *
 * 纵分布局 - 使用 === 分隔行:
 *   <!-- layout: rows -->
 *   顶部内容
 *   ===
 *   底部内容
 *
 * 复合布局 - 组合使用:
 *   <!-- layout: grid, cols=2, rows=2 -->
 *   格子1 +++ 格子2
 *   ===
 *   格子3 +++ 格子4
 *
 * 布局参数:
 *   <!-- layout: cols, ratio=1:2 -->      列宽比例
 *   <!-- layout: rows, ratio=1:3 -->      行高比例
 *   <!-- layout: center, valign=top -->   垂直对齐
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
/* ===== Matcha Layout System ===== */

/* 居中布局 */
.matcha-slide.layout-center {
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* 文档布局 */
.matcha-slide.layout-doc {
  align-items: flex-start;
  justify-content: flex-start;
  text-align: left;
}

/* 横分布局容器 */
.matcha-slide.layout-cols {
  align-items: stretch;
  justify-content: center;
}

.matcha-cols-container {
  display: grid;
  gap: var(--matcha-gap, ${this.options.gap});
  width: 100%;
  height: 100%;
  align-items: center;
}

.matcha-col {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  overflow: hidden;
}

/* 纵分布局容器 */
.matcha-slide.layout-rows {
  align-items: center;
  justify-content: stretch;
}

.matcha-rows-container {
  display: grid;
  gap: var(--matcha-gap, ${this.options.gap});
  width: 100%;
  height: 100%;
  align-items: center;
}

.matcha-row {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  overflow: hidden;
}

/* 复合网格布局 */
.matcha-slide.layout-grid {
  align-items: stretch;
  justify-content: stretch;
}

.matcha-grid-container {
  display: grid;
  gap: var(--matcha-gap, ${this.options.gap});
  width: 100%;
  height: 100%;
}

.matcha-grid-cell {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  padding: 20px;
}

/* 对齐修饰符 */
.matcha-slide.valign-top { justify-content: flex-start; }
.matcha-slide.valign-bottom { justify-content: flex-end; }
.matcha-slide.halign-left { align-items: flex-start; text-align: left; }
.matcha-slide.halign-right { align-items: flex-end; text-align: right; }
    `;
    document.head.appendChild(this.styleElement);
  }

  /**
   * 解析布局指令
   * @param {string} block - 幻灯片内容块
   * @returns {Object} { cleanBlock, layoutType, layoutParams }
   */
  parseLayoutDirective(block) {
    let cleanBlock = block;
    let layoutType = this.options.defaultLayout;
    let layoutParams = {};

    // 解析 <!-- layout: xxx, param1=value1 -->
    const layoutMatch = block.match(
      /<!--\s*layout:\s*([\w-]+)(?:\s*,\s*(.+?))?\s*-->/
    );

    if (layoutMatch) {
      layoutType = layoutMatch[1];
      cleanBlock = cleanBlock.replace(layoutMatch[0], "");

      // 解析参数
      if (layoutMatch[2]) {
        layoutMatch[2].split(",").forEach((param) => {
          const [key, value] = param.split("=").map((s) => s.trim());
          if (key && value) {
            layoutParams[key] = value;
          }
        });
      }
    }

    return { cleanBlock, layoutType, layoutParams };
  }

  /**
   * 构建布局 DOM
   * @param {string} block - 幻灯片内容
   * @param {string} layoutType - 布局类型
   * @param {Object} params - 布局参数
   * @param {Function} renderFn - Markdown 渲染函数
   * @returns {HTMLElement} 幻灯片 DOM 元素
   */
  buildLayout(block, layoutType, params, renderFn) {
    const slideDiv = document.createElement("div");
    const layoutConfig = this.layouts[layoutType] || this.layouts.center;
    slideDiv.className = `matcha-slide ${layoutConfig.cssClass}`;

    // 应用对齐参数
    if (params.valign) {
      slideDiv.classList.add(`valign-${params.valign}`);
    }
    if (params.halign) {
      slideDiv.classList.add(`halign-${params.halign}`);
    }

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
        // center, doc 等简单布局
        slideDiv.innerHTML = renderFn(block);
    }

    return slideDiv;
  }

  /**
   * 构建横分布局（多列）
   * @private
   */
  _buildColsLayout(slideDiv, block, params, renderFn) {
    const cols = block.split(this.options.colSeparator);

    if (cols.length <= 1) {
      slideDiv.innerHTML = renderFn(block);
      return;
    }

    const container = document.createElement("div");
    container.className = "matcha-cols-container";

    // 设置列宽比例
    if (params.ratio) {
      const ratios = params.ratio.split(":").map((r) => `${r}fr`);
      container.style.gridTemplateColumns = ratios.join(" ");
    } else {
      container.style.gridTemplateColumns = `repeat(${cols.length}, 1fr)`;
    }

    cols.forEach((colContent) => {
      const colDiv = document.createElement("div");
      colDiv.className = "matcha-col";
      colDiv.innerHTML = renderFn(colContent);
      container.appendChild(colDiv);
    });

    slideDiv.appendChild(container);
  }

  /**
   * 构建纵分布局（多行）
   * @private
   */
  _buildRowsLayout(slideDiv, block, params, renderFn) {
    const rows = block.split(this.options.rowSeparator);

    if (rows.length <= 1) {
      slideDiv.innerHTML = renderFn(block);
      return;
    }

    const container = document.createElement("div");
    container.className = "matcha-rows-container";

    // 设置行高比例
    if (params.ratio) {
      const ratios = params.ratio.split(":").map((r) => `${r}fr`);
      container.style.gridTemplateRows = ratios.join(" ");
    } else {
      container.style.gridTemplateRows = `repeat(${rows.length}, 1fr)`;
    }

    rows.forEach((rowContent) => {
      const rowDiv = document.createElement("div");
      rowDiv.className = "matcha-row";
      rowDiv.innerHTML = renderFn(rowContent);
      container.appendChild(rowDiv);
    });

    slideDiv.appendChild(container);
  }

  /**
   * 构建复合网格布局
   * @private
   */
  _buildGridLayout(slideDiv, block, params, renderFn) {
    // 先按行分割，再按列分割
    const rows = block.split(this.options.rowSeparator);
    const container = document.createElement("div");
    container.className = "matcha-grid-container";

    // 确定网格尺寸
    let maxCols = 1;
    const gridCells = [];

    rows.forEach((rowContent) => {
      const cols = rowContent.split(this.options.colSeparator);
      maxCols = Math.max(maxCols, cols.length);
      cols.forEach((cellContent) => {
        gridCells.push(cellContent);
      });
    });

    // 设置网格模板
    const numCols = params.cols ? parseInt(params.cols) : maxCols;
    const numRows = params.rows ? parseInt(params.rows) : rows.length;

    container.style.gridTemplateColumns = `repeat(${numCols}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${numRows}, 1fr)`;

    // 创建单元格
    gridCells.forEach((cellContent) => {
      const cellDiv = document.createElement("div");
      cellDiv.className = "matcha-grid-cell";
      cellDiv.innerHTML = renderFn(cellContent);
      container.appendChild(cellDiv);
    });

    slideDiv.appendChild(container);
  }

  /**
   * 获取所有可用布局
   * @returns {Object} 布局配置对象
   */
  getLayouts() {
    return this.layouts;
  }

  /**
   * 注册自定义布局
   * @param {string} name - 布局名称
   * @param {Object} config - 布局配置
   */
  registerLayout(name, config) {
    this.layouts[name] = config;
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
export default Layout;
window.MatchaLayout = Layout;

/*
 * ============================================
 * 使用示例 (Demo)
 * ============================================
 *
 * Markdown 语法示例：
 *
 * ---
 * <!-- layout: center -->
 * # 居中标题
 * 这是居中布局
 *
 * ---
 * <!-- layout: cols, ratio=1:2 -->
 * ## 左侧窄列
 * 内容
 * +++
 * ## 右侧宽列
 * 更多内容
 *
 * ---
 * <!-- layout: rows -->
 * ## 顶部区域
 * ===
 * ## 底部区域
 *
 * ---
 * <!-- layout: grid, cols=2, rows=2 -->
 * 格子1
 * +++
 * 格子2
 * ===
 * 格子3
 * +++
 * 格子4
 */
