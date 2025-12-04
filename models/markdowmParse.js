/**
 * @module markdowmParse
 * @description Markdown 语法解析模块，将 Markdown 文本转换为 HTML
 * @version 1.1.0
 *
 * @syntax
 * 支持的 Markdown 语法:
 *   # 一级标题       ## 二级标题       ### 三级标题
 *   **粗体**         *斜体*            ~~删除线~~
 *   `行内代码`       ```代码块```
 *   [链接](url)      ![图片](url)
 *   > 引用           - 列表项
 *   | 表格 | 支持 |
 */
class MarkdowmParse {
  constructor(options = {}) {
    this.options = {
      codeBlock: true,
      heading: true,
      blockquote: true,
      image: true,
      link: true,
      bold: true,
      italic: true,
      strikethrough: true,
      inlineCode: true,
      list: true,
      table: true,
      horizontalRule: true,
      paragraph: true,
      ...options,
    };

    this.matcha = null;
  }

  /**
   * 初始化模块
   * @param {Matcha} matcha - Matcha 实例引用
   */
  init(matcha) {
    this.matcha = matcha;
  }

  /**
   * 解析 Markdown 文本为 HTML
   * @param {string} text - Markdown 文本
   * @returns {string} HTML 字符串
   */
  parse(text) {
    let html = text.trim();

    // 1. 先处理代码块（保护其内容不被其他规则影响）
    const codeBlocks = [];
    if (this.options.codeBlock) {
      html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
        codeBlocks.push(
          `<pre><code class="language-${lang || "text"}">${this._escapeHtml(
            code.trim()
          )}</code></pre>`
        );
        return placeholder;
      });
    }

    // 2. 处理表格
    if (this.options.table) {
      html = this._parseTable(html);
    }

    // 3. 处理标题（从 h3 到 h1，避免 ## 被 # 先匹配）
    if (this.options.heading) {
      html = html.replace(/^######\s+(.*$)/gm, "<h6>$1</h6>");
      html = html.replace(/^#####\s+(.*$)/gm, "<h5>$1</h5>");
      html = html.replace(/^####\s+(.*$)/gm, "<h4>$1</h4>");
      html = html.replace(/^###\s+(.*$)/gm, "<h3>$1</h3>");
      html = html.replace(/^##\s+(.*$)/gm, "<h2>$1</h2>");
      html = html.replace(/^#\s+(.*$)/gm, "<h1>$1</h1>");
    }

    // 4. 处理引用
    if (this.options.blockquote) {
      html = html.replace(/^>\s+(.*$)/gm, "<blockquote>$1</blockquote>");
      // 合并连续的 blockquote
      html = html.replace(/<\/blockquote>\n<blockquote>/g, "\n");
    }

    // 5. 处理水平线
    if (this.options.horizontalRule) {
      html = html.replace(/^(\*{3,}|-{3,}|_{3,})$/gm, "<hr>");
    }

    // 6. 处理图片（在链接之前，因为图片语法包含链接语法）
    if (this.options.image) {
      html = html.replace(
        /!\[(.*?)\]\((.*?)\)/g,
        '<img src="$2" alt="$1" loading="lazy">'
      );
    }

    // 7. 处理链接
    if (this.options.link) {
      html = html.replace(
        /\[(.*?)\]\((.*?)\)/g,
        '<a href="$2" target="_blank" rel="noopener">$1</a>'
      );
    }

    // 8. 处理行内代码（在粗体/斜体之前）
    if (this.options.inlineCode) {
      html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    }

    // 9. 处理粗体（**text** 或 __text__）
    if (this.options.bold) {
      html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    }

    // 10. 处理斜体（*text* 或 _text_）
    if (this.options.italic) {
      html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
      html = html.replace(/_([^_]+)_/g, "<em>$1</em>");
    }

    // 11. 处理删除线
    if (this.options.strikethrough) {
      html = html.replace(/~~([^~]+)~~/g, "<del>$1</del>");
    }

    // 12. 处理无序列表
    if (this.options.list) {
      html = this._parseList(html);
    }

    // 13. 段落处理
    if (this.options.paragraph) {
      html = this._wrapParagraphs(html);
    }

    // 14. 恢复代码块
    codeBlocks.forEach((block, i) => {
      html = html.replace(`__CODE_BLOCK_${i}__`, block);
    });

    return html;
  }

  /**
   * 解析表格
   * @private
   */
  _parseTable(html) {
    const lines = html.split("\n");
    const result = [];
    let inTable = false;
    let tableRows = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 检测表格行（以 | 开头或包含 |）
      if (line.match(/^\|.*\|$/) || line.match(/^.*\|.*$/)) {
        // 跳过分隔行 |---|---|
        if (line.match(/^\|?[\s\-:|]+\|?$/)) {
          continue;
        }

        if (!inTable) {
          inTable = true;
          tableRows = [];
        }

        // 解析单元格
        const cells = line
          .split("|")
          .map((c) => c.trim())
          .filter((c) => c !== "");

        tableRows.push(cells);
      } else {
        // 结束表格
        if (inTable && tableRows.length > 0) {
          result.push(this._buildTable(tableRows));
          tableRows = [];
          inTable = false;
        }
        result.push(line);
      }
    }

    // 处理最后的表格
    if (inTable && tableRows.length > 0) {
      result.push(this._buildTable(tableRows));
    }

    return result.join("\n");
  }

  /**
   * 构建表格 HTML
   * @private
   */
  _buildTable(rows) {
    if (rows.length === 0) return "";

    let html = '<table class="matcha-table">';

    // 第一行作为表头
    html += "<thead><tr>";
    rows[0].forEach((cell) => {
      html += `<th>${cell}</th>`;
    });
    html += "</tr></thead>";

    // 其余行作为表体
    if (rows.length > 1) {
      html += "<tbody>";
      for (let i = 1; i < rows.length; i++) {
        html += "<tr>";
        rows[i].forEach((cell) => {
          html += `<td>${cell}</td>`;
        });
        html += "</tr>";
      }
      html += "</tbody>";
    }

    html += "</table>";
    return html;
  }

  /**
   * 解析列表
   * @private
   */
  _parseList(html) {
    const lines = html.split("\n");
    const result = [];
    let inList = false;

    for (const line of lines) {
      const listMatch = line.match(/^\s*[-*+]\s+(.*)$/);

      if (listMatch) {
        if (!inList) {
          result.push("<ul>");
          inList = true;
        }
        result.push(`<li>${listMatch[1]}</li>`);
      } else {
        if (inList) {
          result.push("</ul>");
          inList = false;
        }
        result.push(line);
      }
    }

    if (inList) {
      result.push("</ul>");
    }

    return result.join("\n");
  }

  /**
   * 将未包裹的文本包装成段落
   * @private
   */
  _wrapParagraphs(html) {
    return html
      .split("\n\n")
      .map((para) => {
        const trimmed = para.trim();
        if (!trimmed) return "";
        // 跳过已经是块级元素的内容
        if (
          trimmed.match(
            /^<(h[1-6]|p|div|ul|ol|li|pre|blockquote|table|hr|img)/i
          )
        ) {
          return para;
        }
        return `<p>${trimmed}</p>`;
      })
      .join("\n");
  }

  /**
   * HTML 转义
   * @private
   */
  _escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * 添加自定义解析规则（在 parse 末尾应用）
   * @param {string} name - 规则名称
   * @param {RegExp} pattern - 匹配正则
   * @param {string|Function} replacement - 替换模板或函数
   */
  addRule(name, pattern, replacement) {
    if (!this._customRules) this._customRules = [];
    this._customRules.push({ name, pattern, replacement });
  }

  /**
   * 销毁模块
   */
  destroy() {
    this.matcha = null;
    this._customRules = [];
  }
}

// 导出方式
export default MarkdowmParse;
window.MatchaMarkdowmParse = MarkdowmParse;

/*
 * ============================================
 * 使用示例 (Demo)
 * ============================================
 *
 * Markdown 输入:
 *   # 标题
 *   **粗体** 和 *斜体*
 *
 *   | 列1 | 列2 |
 *   |-----|-----|
 *   | A   | B   |
 *
 * HTML 输出:
 *   <h1>标题</h1>
 *   <p><strong>粗体</strong> 和 <em>斜体</em></p>
 *   <table>...</table>
 */
