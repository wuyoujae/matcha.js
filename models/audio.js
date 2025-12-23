/**
 * @module audio
 * @description 音频组件模块
 * @version 1.0.0
 */
class Audio {
  constructor(options = {}) {
    this.options = {
      defaultWidth: "100%",
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
    if (document.getElementById("matcha-audio-module")) return;

    this.styleElement = document.createElement("style");
    this.styleElement.id = "matcha-audio-module";
    this.styleElement.textContent = `
/* Matcha Audio Module */
.matcha-audio-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1em 0;
  width: 100%;
}

.matcha-audio {
  width: 100%;
  max-width: 600px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
    `;
    document.head.appendChild(this.styleElement);
  }

  parse(text) {
    const lines = text.split("\n");
    const result = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const audioMatch = line.match(/<!--\s*audio:\s*(.+?)\s*-->/);

      if (audioMatch) {
        const params = this._parseParams(audioMatch[1]);
        result.push(this._buildAudioTag(params));
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

  _buildAudioTag(params) {
    if (!params.src) return "<!-- Invalid Audio: Missing src -->";

    const width = params.width || this.options.defaultWidth;
    const controls = params.controls !== "false";
    const autoplay = params.autoplay === "true";
    const loop = params.loop === "true";
    const muted = params.muted === "true";

    let attrs = `src="${params.src}" class="matcha-audio"`;
    if (controls) attrs += " controls";
    if (autoplay) attrs += " autoplay";
    if (loop) attrs += " loop";
    if (muted) attrs += " muted";

    const style = `width: ${width};`;

    return `<div class="matcha-audio-container"><audio ${attrs} style="${style}"></audio></div>`;
  }

  destroy() {
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }
    this.styleElement = null;
    this.matcha = null;
  }
}

export default Audio;
window.MatchaAudio = Audio;

