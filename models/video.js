/**
 * @module video
 * @description 视频组件模块
 * @version 1.0.0
 */
class Video {
  constructor(options = {}) {
    this.options = {
      defaultWidth: "100%",
      defaultHeight: "auto",
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
    // Only inject if not already present (though separate modules usually manage their own)
    if (document.getElementById("matcha-video-module")) return;

    this.styleElement = document.createElement("style");
    this.styleElement.id = "matcha-video-module";
    this.styleElement.textContent = `
/* Matcha Video Module */
.matcha-video-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1em 0;
  width: 100%;
}

.matcha-video {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
    `;
    document.head.appendChild(this.styleElement);
  }

  parse(text) {
    const lines = text.split("\n");
    const result = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const videoMatch = line.match(/<!--\s*video:\s*(.+?)\s*-->/);

      if (videoMatch) {
        const params = this._parseParams(videoMatch[1]);
        result.push(this._buildVideoTag(params));
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

  _buildVideoTag(params) {
    if (!params.src) return "<!-- Invalid Video: Missing src -->";

    const width = params.width || this.options.defaultWidth;
    const height = params.height || this.options.defaultHeight;
    const controls = params.controls !== "false";
    const autoplay = params.autoplay === "true";
    const loop = params.loop === "true";
    const muted = params.muted === "true";

    let attrs = `src="${params.src}" class="matcha-video"`;
    if (controls) attrs += " controls";
    if (autoplay) attrs += " autoplay";
    if (loop) attrs += " loop";
    if (muted) attrs += " muted";

    const style = `width: ${width}; height: ${height};`;

    return `<div class="matcha-video-container"><video ${attrs} style="${style}"></video></div>`;
  }

  destroy() {
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }
    this.styleElement = null;
    this.matcha = null;
  }
}

export default Video;
window.MatchaVideo = Video;
