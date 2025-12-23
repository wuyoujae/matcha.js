# 核心启动模块 (Matcha Core)

### 1. 模块简介
核心启动模块是整个 Matcha.js 幻灯片系统的“大脑”。它的主要作用是连接你的 Markdown 内容和浏览器页面。
该模块负责：
- **读取内容**：从页面中指定的脚本标签里提取 Markdown 文本。
- **渲染页面**：将文本解析并转换成漂亮的幻灯片。
- **控制交互**：绑定键盘（左右方向键、空格等）和鼠标事件，让你能够顺畅地翻页。
- **管理插件**：初始化所有子功能模块（如布局、样式、组件等）。

---

### 2. 模块使用 demo
要启动 Matcha.js，你只需要在 HTML 中准备一个容器和一个存放内容的 `<script>` 标签，然后运行几行简单的代码：

```html
<!-- 1. 准备幻灯片显示的容器 -->
<div id="matcha-stage"></div>

<!-- 2. 编写你的 Markdown 内容 -->
<script type="text/template" id="matcha-source">
# 我的第一份幻灯片
这是第一页内容

---

# 第二页
使用了分隔符进入下一页
</script>

<!-- 3. 初始化并运行 -->
<script type="module">
  import Matcha from './matcha.js';
  
  // 创建实例并启动
  const app = new Matcha({
    containerId: "matcha-stage",
    scriptId: "matcha-source"
  });
  
  app.start();
</script>
```

---

### 3. 模块的语法

#### 基本初始化语法
使用 `new Matcha(config)` 来创建一个幻灯片应用实例，并通过 `.start()` 方法开启渲染。

```javascript
const app = new Matcha({
  // 配置项...
});
app.start();
```

#### 配置属性介绍

| 属性名 | 说明 | 默认值 | 示例 |
| :--- | :--- | :--- | :--- |
| `containerId` | 用于显示幻灯片的 HTML 容器的 ID | `"matcha-stage"` | `"my-presentation"` |
| `scriptId` | 存放 Markdown 源码的 script 标签 ID | `"matcha-source"` | `"md-content"` |
| `progressBar` | 进度条模块的具体配置 | `{}` | 见进度条模块文档 |
| `style` | 全局样式与主题的配置 | `{}` | 见样式模块文档 |
| `layout` | 布局系统的默认配置 | `{}` | 见布局模块文档 |
| `transition` | 页面切换动画的配置 | `{}` | 见过渡模块文档 |

---

### 4. 介绍模块的其他配置

核心模块还提供了一些用于程序控制的方法（通常在高级定制时使用）：

- **`app.next()`**: 跳转到下一页（或下一个分步）。
- **`app.prev()`**: 回退到上一页（或上一个分步）。
- **`app.goto(index)`**: 直接跳转到指定的页面索引（从 0 开始）。
- **`app.destroy()`**: 销毁当前的幻灯片实例，释放内存并移除事件绑定。

**提示**：在初始化时，你可以将所有子模块的个性化配置直接写在核心配置对象中，Matcha 会自动将它们分发给对应的模块。

