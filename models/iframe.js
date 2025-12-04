/**
 * @module iframe
 * @description Iframe 组件模块
 * @version 1.0.0
 */
class Iframe {
  constructor(options = {}) {
    this.options = {
      defaultWidth: "100%",
      defaultHeight: "400px",
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
    if (document.getElementById("matcha-iframe-module")) return;

    this.styleElement = document.createElement("style");
    this.styleElement.id = "matcha-iframe-module";
    this.styleElement.textContent = `
/* Matcha Iframe Module */
.matcha-iframe-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1em 0;
  width: 100%;
}

.matcha-iframe {
  border: none;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
    `;
    document.head.appendChild(this.styleElement);
  }

  parse(text) {
    const lines = text.split("\n");
    const result = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const iframeMatch = line.match(/<!--\s*iframe:\s*(.+?)\s*-->/);

      if (iframeMatch) {
        const params = this._parseParams(iframeMatch[1]);
        result.push(this._buildIframeTag(params));
      } else {
        result.push(line);
      }
    }

    return result.join("\n");
  }

  _parseParams(paramStr) {
    const params = {};
    if (!paramStr) return params;

    paramStr.split(",").forEach((pair) => {
      const parts = pair.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join("=").trim();
        params[key] = value;
      }
    });
    return params;
  }

  _buildIframeTag(params) {
    if (!params.src) return "<!-- Invalid Iframe: Missing src -->";

    const width = params.width || this.options.defaultWidth;
    const height = params.height || this.options.defaultHeight;
    const scrolling = params.scrolling || "no";
    const border = params.border || "0";

    let attrs = `src="${params.src}" class="matcha-iframe"`;
    attrs += ` scrolling="${scrolling}"`;
    attrs += ` frameborder="${border}"`;

    if (params.allow) attrs += ` allow="${params.allow}"`;
    else
      attrs += ` allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"`;

    attrs += " allowfullscreen";

    const style = `width: ${width}; height: ${height};`;

    return `<div class="matcha-iframe-container"><iframe ${attrs} style="${style}"></iframe></div>`;
  }

  destroy() {
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }
    this.styleElement = null;
    this.matcha = null;
  }
}

export default Iframe;
window.MatchaIframe = Iframe;
