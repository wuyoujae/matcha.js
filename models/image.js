/**
 * @module image
 * @description 图片组件模块，支持自定义尺寸、对齐、圆角和阴影
 * @version 1.0.0
 *
 * @syntax
 * 图片指令:
 *   <!-- image: src=url.jpg, width=300px, align=center -->
 *
 * 参数:
 *   src: 图片地址 (必填)
 *   width: 宽度 (默认 auto)
 *   height: 高度 (默认 auto)
 *   align: 对齐 (left, center, right) 默认 center
 *   shadow: 阴影 (none, sm, md, lg) 默认 none
 *   round: 圆角 (none, sm, md, lg, full) 默认 md
 *   opacity: 透明度 (0-1)
 *   fit: 填充模式 (cover, contain, fill)
 *   class: 自定义类名
 */
class Image {
  constructor(options = {}) {
    this.options = {
      defaultAlign: "center",
      defaultRound: "8px",
      defaultShadow: "none", // sm, md, lg
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
    if (document.getElementById("matcha-image-module")) return;

    this.styleElement = document.createElement("style");
    this.styleElement.id = "matcha-image-module";
    this.styleElement.textContent = `
/* Matcha Image Module */
.matcha-image-container {
  display: flex;
  margin: 1em 0;
  width: 100%;
  position: relative;
}

.matcha-image-container.align-left { justify-content: flex-start; }
.matcha-image-container.align-center { justify-content: center; }
.matcha-image-container.align-right { justify-content: flex-end; }

.matcha-image {
  max-width: 100%;
  height: auto;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* 阴影预设 */
.matcha-image.shadow-sm { box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
.matcha-image.shadow-md { box-shadow: 0 5px 15px rgba(0,0,0,0.15); }
.matcha-image.shadow-lg { box-shadow: 0 15px 35px rgba(0,0,0,0.25); }

/* 默认 Markdown 图片样式增强 */
.matcha-slide img:not(.matcha-image):not(.matcha-video) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}
    `;
    document.head.appendChild(this.styleElement);
  }

  parse(text) {
    const lines = text.split("\n");
    const result = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // 匹配 <!-- image: ... -->
      const imageMatch = line.match(/<!--\s*image:\s*(.+?)\s*-->/);

      if (imageMatch) {
        const params = this._parseParams(imageMatch[1]);
        result.push(this._buildImageTag(params));
      } else {
        result.push(line);
      }
    }

    return result.join("\n");
  }

  _parseParams(paramStr) {
    const params = {};
    if (!paramStr) return params;

    // 使用正则表达式支持带引号的参数值，防止 URL 中的逗号干扰解析
    const regex = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^,\s]+))/g;
    let match;

    while ((match = regex.exec(paramStr)) !== null) {
      const key = match[1];
      const value = match[2] ?? match[3] ?? match[4];
      params[key] = value;
    }

    return params;
  }

  _buildImageTag(params) {
    if (!params.src) return "<!-- Invalid Image: Missing src -->";

    const resolvedSrc = this._resolveSrc(params.src);
    // 动态资源：GIF 或 WebP（可能是动图），默认不启用 lazy，避免播放受阻
    const isAnimated =
      /\.gif(\?.*)?$/i.test(resolvedSrc) || /\.webp(\?.*)?$/i.test(resolvedSrc);

    // 将 URL 中的下划线转义为 HTML 实体，防止被 Markdown 解析器误识别为斜体
    const safeSrc = resolvedSrc.replace(/_/g, "&#95;");

    const align = params.align || this.options.defaultAlign;
    const containerClass = `matcha-image-container align-${align}`;

    const classes = ["matcha-image"];
    if (params.shadow && params.shadow !== "none") {
      classes.push(`shadow-${params.shadow}`);
    }
    if (params.class) {
      classes.push(params.class);
    }

    const styles = [];

    // 处理 size 参数 (1-10)，转换为百分比宽度
    if (params.size) {
      const sizeVal = parseInt(params.size);
      if (!isNaN(sizeVal) && sizeVal >= 1 && sizeVal <= 10) {
        params.width = `${sizeVal * 10}%`;
      }
    }

    if (params.width) styles.push(`width: ${params.width}`);
    if (params.height) styles.push(`height: ${params.height}`);
    if (params.round) {
      const roundMap = {
        sm: "4px",
        md: "8px",
        lg: "16px",
        full: "50%",
      };
      styles.push(`border-radius: ${roundMap[params.round] || params.round}`);
    } else {
      // 默认圆角
      styles.push(`border-radius: ${this.options.defaultRound}`);
    }

    if (params.opacity) styles.push(`opacity: ${params.opacity}`);
    if (params.fit) styles.push(`object-fit: ${params.fit}`);

    // 备注：某些环境（尤其是弱网/性能或开启"减少动态效果"）下，GIF / WebP 动图 + lazy-load 可能表现异常；
    // 这里对动图默认关闭 loading=lazy，提升兼容性。
    const loadingAttr = isAnimated ? "" : 'loading="lazy"';

    return `
<div class="${containerClass}">
  <img src="${safeSrc}" ${loadingAttr} class="${classes.join(
      " "
    )}" style="${styles.join("; ")}" alt="image" />
</div>`;
  }

  _resolveSrc(src) {
    if (!src) return src;
    let s = String(src).trim();
    // 去掉可能的引号
    s = s.replace(/^["']|["']$/g, "");

    // data/blob 直接返回
    if (/^(data:|blob:)/i.test(s)) return s;

    // 解析相对路径为绝对路径，保证在子目录/不同 baseURI 下也能正确加载
    try {
      return new URL(s, document.baseURI).href;
    } catch {
      return s;
    }
  }

  destroy() {
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }
    this.styleElement = null;
    this.matcha = null;
  }
}

export default Image;
window.MatchaImage = Image;
