# Matcha.js 语法表

> 🍵 系统内置模块的 Markdown 扩展语法速查表

---

## 目录

- [核心语法](#核心语法)
- [组件系统 (component)](#组件系统-component) ✨ **V8 新增**
- [布局模块 (layout)](#布局模块-layout)
- [样式模块 (style)](#样式模块-style)
- [过渡动画 (transition)](#过渡动画-transition)
- [分步展示 (fragment)](#分步展示-fragment)
- [高亮聚焦 (highlight)](#高亮聚焦-highlight)
- [卡片容器 (card)](#卡片容器-card)
- [媒体支持 (media)](#媒体支持-media)
- [数学公式 (math)](#数学公式-math)
- [Markdown 解析 (markdowmParse)](#markdown-解析-markdowmparse)
- [进度条 (progressBar)](#进度条-progressbar)

---

## 核心语法

### 幻灯片分隔

使用 `---` 分隔不同的幻灯片：

```markdown
# 第一页

内容

---

# 第二页

更多内容
```

### 指令格式

所有模块指令使用 HTML 注释格式：

```markdown
<!-- 指令名: 值 -->
<!-- 指令名: 值1, 参数1=值, 参数2=值 -->
```

---

## 组件系统 (component)

> 文件：`models/component.js` ✨ **V8 新增**

组件系统让你可以**定义固定位置的可复用组件**，不随页面滚动，支持参数传递和条件渲染。

### 核心特性

- 🔒 **固定位置**：组件不随页面滚动，固定在屏幕边缘
- 📍 **9 个位置**：支持左上、正上、右上、左、中、右、左下、正下、右下
- 🔄 **自动更新**：内置变量在每页自动更新
- 📦 **无需分隔**：组件定义区与第一页内容无需 `---` 分隔

### 定义组件

在 Markdown 开头使用 `<!-- define: 组件名, position=位置 -->` 定义组件：

```markdown
<!-- define: page-number, position=bottom-right -->

📄 **{{$slideNumber}}** / {{$totalSlides}}

<!-- enddefine -->
```

### 位置参数

| 位置   | 参数值         | 说明   |
| ------ | -------------- | ------ |
| 左上角 | `top-left`     | ↖      |
| 正上方 | `top`          | ↑      |
| 右上角 | `top-right`    | ↗      |
| 正左边 | `left`         | ←      |
| 中间   | `center`       | ●      |
| 正右边 | `right`        | →      |
| 左下角 | `bottom-left`  | ↙      |
| 正下方 | `bottom`       | ↓      |
| 右下角 | `bottom-right` | ↘ 默认 |

### 使用组件

使用 `<!-- @组件名: 参数=值 -->` 调用组件：

```markdown
<!-- @page-number -->
<!-- @chapter-nav: chapter=2 -->
```

### 覆盖位置

使用时可以覆盖定义时的位置：

```markdown
<!-- @page-number: position=top-right -->
```

### 内置变量

| 变量               | 说明               |
| ------------------ | ------------------ |
| `{{$slideNumber}}` | 当前页码 (1-based) |
| `{{$totalSlides}}` | 总页数             |
| `{{$slideIndex}}`  | 当前索引 (0-based) |

```markdown
<!-- define: page-number, position=bottom-right -->

📄 **{{$slideNumber}}** / {{$totalSlides}}

<!-- enddefine -->
```

### 条件渲染

#### if 条件

```markdown
{{#if showTitle}}

## 这是标题

{{/if}}

{{#if premium}}
高级功能
{{#else}}
基础功能
{{/if}}
```

#### 相等判断 (eq/neq)

```markdown
{{#eq chapter 1}}👉 当前章节{{/eq}}
{{#neq chapter 1}}其他章节{{/neq}}
```

#### 数值比较 (gt/lt)

```markdown
{{#gt score 60}}及格{{/gt}}
{{#lt score 60}}不及格{{/lt}}
```

### 循环渲染

使用 `{{#repeat count}}...{{/repeat}}` 循环，循环内可用 `{{$i}}` (1-based) 和 `{{$i0}}` (0-based)：

```markdown
<!-- define: progress-dots -->

{{#repeat total}}{{#eq $i current}}●{{/eq}}{{#neq $i current}}○{{/neq}} {{/repeat}}

<!-- enddefine -->

<!-- @progress-dots: current=3, total=5 -->
```

输出：`○ ○ ● ○ ○`

### 实用组件示例

#### 章节导航（左侧固定）

```markdown
<!-- define: chapter-nav, position=left -->

{{#eq chapter 1}}**👉 介绍**{{/eq}}{{#neq chapter 1}}介绍{{/neq}}
{{#eq chapter 2}}**👉 语法**{{/eq}}{{#neq chapter 2}}语法{{/neq}}
{{#eq chapter 3}}**👉 进阶**{{/eq}}{{#neq chapter 3}}进阶{{/neq}}

<!-- enddefine -->

<!-- @chapter-nav: chapter=2 -->
```

#### 进度条（底部固定）

```markdown
<!-- define: progress-bar, position=bottom -->

{{#repeat total}}{{#eq $i current}}●{{/eq}}{{#neq $i current}}○{{/neq}} {{/repeat}}

<!-- enddefine -->

<!-- @progress-bar: current=3, total=10 -->
```

#### 顶部标题

```markdown
<!-- define: top-title, position=top -->

🍵 **Matcha V8** - {{subtitle}}

<!-- enddefine -->

<!-- @top-title: subtitle=组件化系统 -->
```

#### 作者信息（左下角）

```markdown
<!-- define: author-badge, position=bottom-left -->

👤 {{name}} · {{role}}

<!-- enddefine -->

<!-- @author-badge: name=Jae, role=全栈开发者 -->
```

### JavaScript 控制

```javascript
// 通过 JS 注册组件（第三个参数是位置）
matcha.modules.component.register("badge", "🏷️ **{{text}}**", "top-right");

// 设置全局变量
matcha.modules.component.setGlobalVars({
  author: "Jae",
  year: "2024",
});

// 检查组件是否存在
matcha.modules.component.hasComponent("badge");

// 获取所有已注册组件
matcha.modules.component.getComponents();
```

### 注意事项

1. **固定定位**：组件是 `position: fixed`，不随页面滚动
2. **组件定义位置**：放在 Markdown 开头，无需 `---` 分隔
3. **参数名规则**：使用字母、数字、下划线和短横线
4. **位置覆盖**：使用时可以用 `position=xxx` 覆盖定义时的位置
5. **多组件支持**：一个页面可以同时使用多个组件

---

## 布局模块 (layout)

> 文件：`models/layout.js`

### 布局类型

| 布局     | 语法                      | 说明                         |
| -------- | ------------------------- | ---------------------------- |
| 居中布局 | `<!-- layout: center -->` | 内容水平垂直居中，适合标题页 |
| 横分布局 | `<!-- layout: cols -->`   | 多列布局，使用 `+++` 分隔    |
| 纵分布局 | `<!-- layout: rows -->`   | 多行布局，使用 `===` 分隔    |
| 复合布局 | `<!-- layout: grid -->`   | 网格布局，行列组合           |
| 文档布局 | `<!-- layout: doc -->`    | 左对齐文档流，适合长文本     |

### 横分布局（多列）

使用 `+++` 分隔列：

```markdown
<!-- layout: cols -->

## 左侧内容

这是左边的文字

+++

## 右侧内容

这是右边的文字
```

#### 列宽比例

```markdown
<!-- layout: cols, ratio=1:2 -->

窄列
+++
宽列（2 倍宽）
```

```markdown
<!-- layout: cols, ratio=1:2:1 -->

左窄 +++ 中宽 +++ 右窄
```

### 纵分布局（多行）

使用 `===` 分隔行：

```markdown
<!-- layout: rows -->

## 顶部区域

===

## 底部区域
```

#### 行高比例

```markdown
<!-- layout: rows, ratio=1:3 -->

# 标题区（窄）

内容区（3 倍高）
```

### 复合网格布局

组合使用 `+++` 和 `===`：

```markdown
<!-- layout: grid, cols=2, rows=2 -->

格子 1
+++
格子 2
===
格子 3
+++
格子 4
```

### 对齐参数

| 参数     | 可选值                    | 说明     |
| -------- | ------------------------- | -------- |
| `valign` | `top`, `center`, `bottom` | 垂直对齐 |
| `halign` | `left`, `center`, `right` | 水平对齐 |

```markdown
<!-- layout: center, valign=top -->

# 顶部居中的标题
```

---

## 样式模块 (style)

> 文件：`models/style.js`

### 预设主题

```markdown
<!-- theme: matcha -->
<!-- theme: sakura -->
<!-- theme: ocean -->
<!-- theme: sunset -->
<!-- theme: mono -->
<!-- theme: light -->
```

| 主题     | 说明               |
| -------- | ------------------ |
| `matcha` | 默认抹茶绿暗色主题 |
| `sakura` | 樱花粉暗色主题     |
| `ocean`  | 海洋蓝暗色主题     |
| `sunset` | 日落橙暖色主题     |
| `mono`   | 黑白极简亮色主题   |
| `light`  | 浅色主题           |

### 单页样式覆盖

```markdown
<!-- style: bg=#1a1a1a, accent=#ff6b6b -->

# 这一页使用自定义背景和强调色
```

#### 可用样式参数

| 参数     | 说明        | 示例                                |
| -------- | ----------- | ----------------------------------- |
| `bg`     | 背景色/渐变 | `#1a1a1a` 或 `linear-gradient(...)` |
| `fg`     | 前景文字色  | `#ffffff`                           |
| `accent` | 强调色      | `#00ff88`                           |

### 渐变背景

```markdown
<!-- style: bg=linear-gradient(135deg, #667eea 0%, #764ba2 100%) -->

# 渐变背景页
```

---

## 过渡动画 (transition)

> 文件：`models/transition.js`

### 过渡效果类型

| 效果    | 语法                           | 说明             |
| ------- | ------------------------------ | ---------------- |
| fade    | `<!-- transition: fade -->`    | 淡入淡出（默认） |
| slide   | `<!-- transition: slide -->`   | 水平滑动         |
| slideUp | `<!-- transition: slideUp -->` | 垂直滑动         |
| zoom    | `<!-- transition: zoom -->`    | 缩放             |
| zoomIn  | `<!-- transition: zoomIn -->`  | 放大进入         |
| flip    | `<!-- transition: flip -->`    | 水平翻转         |
| flipY   | `<!-- transition: flipY -->`   | 垂直翻转         |
| cube    | `<!-- transition: cube -->`    | 立方体旋转       |
| none    | `<!-- transition: none -->`    | 无过渡           |

### 基础用法

```markdown
<!-- transition: slide -->

# 这一页使用滑动效果
```

### 带参数的过渡

```markdown
<!-- transition: zoom, duration=800 -->

# 800ms 的缩放过渡
```

#### 可用参数

| 参数       | 说明         | 默认值                          |
| ---------- | ------------ | ------------------------------- |
| `duration` | 动画时长(ms) | `600`                           |
| `easing`   | 缓动函数     | `cubic-bezier(0.16, 1, 0.3, 1)` |

### JavaScript 控制

```javascript
// 切换过渡效果
matcha.modules.transition.setTransition("flip");

// 设置动画时长
matcha.modules.transition.setDuration(1000);

// 自定义过渡效果
matcha.modules.transition.registerTransition("myEffect", {
  enter: { transform: "rotate(-10deg) scale(0.9)", opacity: 0 },
  enterActive: { transform: "rotate(0) scale(1)", opacity: 1 },
  leave: { transform: "rotate(10deg) scale(0.9)", opacity: 0 },
});
```

---

## 分步展示 (fragment)

> 文件：`models/fragment.js`

像 PowerPoint 一样**逐步累加显示**内容。使用 `<!-- step -->` 作为分隔符。

### 核心概念

分步是**内容累加**显示，不是替换：

```
进入页面 → 显示第一段内容
点击     → 第一段 + 第二段
再点击   → 第一段 + 第二段 + 第三段
```

### 基础语法

使用 `<!-- step -->` 分隔内容：

```markdown
# 你好

这是第一步，进入页面就能看到

<!-- step -->

这是第二步，点击后出现

<!-- step -->

这是第三步，继续点击后出现
```

**显示效果**：

- 第 1 步: "你好 这是第一步..."
- 第 2 步: "你好 这是第一步..." + "这是第二步..."（累加）
- 第 3 步: 继续累加第三段

### 高亮嵌套分步

使用 `<内容>` 标记高亮内容，同一步中的多个高亮会按顺序逐个展示：

```markdown
你好，这里是<Matcha>

<!-- step -->

我叫<jae>，我是一名<全栈>独立<开发者>
```

**显示流程**：

```
1. "你好，这里是 Matcha"（普通显示）
2. "你好，这里是 Matcha"（Matcha 高亮，其他内容变暗）
3. "你好，这里是 Matcha，我叫 jae，..."（第二步内容显示）
4. "..."（jae 高亮）
5. "..."（全栈 高亮）
6. "..."（开发者 高亮）
7. 下一页
```

> 💡 **高亮原理**：降低整个画面透明度，高亮内容保持原透明度，通过衬托产生聚焦效果。

> 💡 **高亮完成后**：直接进入下一步/下一页，不需要恢复到非高亮状态。

### 带过渡效果

| 效果        | 语法                         | 说明         |
| ----------- | ---------------------------- | ------------ |
| fade        | `<!-- step: fade -->`        | 淡入（默认） |
| slide-up    | `<!-- step: slide-up -->`    | 从下滑入     |
| slide-down  | `<!-- step: slide-down -->`  | 从上滑入     |
| slide-left  | `<!-- step: slide-left -->`  | 从右滑入     |
| slide-right | `<!-- step: slide-right -->` | 从左滑入     |
| zoom        | `<!-- step: zoom -->`        | 缩放出现     |
| zoom-in     | `<!-- step: zoom-in -->`     | 放大进入     |
| bounce      | `<!-- step: bounce -->`      | 弹跳出现     |

```markdown
# 标题

第一步内容

<!-- step: fade -->

淡入显示的第二步

<!-- step: slide-up -->

从下滑入的第三步

<!-- step: bounce -->

弹跳出现的第四步！
```

### 自定义动画时长

```markdown
<!-- step: slide-up, duration=800 -->

这段内容用 800ms 的动画时长
```

### 交互方式

| 操作     | 触发方式                |
| -------- | ----------------------- |
| 下一步   | 点击、→、↓、空格、Enter |
| 上一步   | 右键点击、←、↑          |
| 第一页   | Home 键                 |
| 最后一页 | End 键                  |

> 💡 **往回切换页面时**，会自动显示该页的所有内容（不用重新点击）

### JavaScript 控制

```javascript
// 下一步 / 上一步
matcha.next();
matcha.prev();

// 检查是否有分步
matcha.modules.fragment.hasSteps(slideIndex);

// 检查是否有下一步
matcha.modules.fragment.hasNextStep(slideIndex);

// 获取分步状态
matcha.modules.fragment.getStepState(slideIndex);
// { current: 2, total: 4 }
```

---

## 高亮聚焦 (highlight)

> 文件：`models/highlight.js`

高亮模块与分步系统深度集成，实现**嵌套分步**效果。同一步中的多个高亮会按顺序逐个展示。

### 基础语法

使用尖括号 `<内容>` 包围需要高亮的内容：

```markdown
你好，这里是<Matcha>
```

### 多高亮嵌套

同一步中的多个高亮会形成嵌套分步：

```markdown
我叫<jae>，我是一名<全栈>独立<开发者>
```

**显示流程**：

| 步骤 | 显示内容                         | 高亮元素 |
| ---- | -------------------------------- | -------- |
| 1    | 我叫 jae，我是一名全栈独立开发者 | 无       |
| 2    | (整体变暗)                       | jae      |
| 3    | (整体变暗)                       | 全栈     |
| 4    | (整体变暗)                       | 开发者   |
| 5    | 下一步/下一页                    | -        |

### 高亮效果原理

高亮通过**透明度衬托**实现：

1. 开启聚焦模式时，整个幻灯片内容透明度降低
2. 被高亮的元素保持原透明度
3. 形成视觉聚焦效果，无需添加边框或背景色

### 与分步结合

```markdown
# 标题

这是第一步，包含<高亮内容>

<!-- step -->

第二步有多个高亮：<重点 1>和<重点 2>
```

**完整显示流程**：

```
1. 标题 + 第一步内容
2. (高亮内容 高亮)
3. 标题 + 第一步 + 第二步内容
4. (重点 1 高亮)
5. (重点 2 高亮)
6. 下一页
```

### JavaScript 配置

```javascript
new Matcha({
  highlight: {
    dimOpacity: 0.2, // 非高亮区域透明度 (0-1)
    duration: 400, // 动画时长(ms)
  },
});
```

### 运行时控制

```javascript
// 设置透明度
matcha.modules.highlight.setDimOpacity(0.15);

// 获取分步状态（包含高亮信息）
matcha.modules.fragment.getStepState(slideIndex);
// { current: 2, total: 3, highlight: 1, microStep: 4, totalMicroSteps: 8 }
```

---

## 卡片容器 (card)

> 文件：`models/card.js`

使用卡片容器包裹内容，支持自定义背景、边框和阴影，让页面布局更丰富。

### 基础语法

使用 `<!-- card -->` 开始，`<!-- endcard -->` 结束（可选）：

```markdown
<!-- card -->

### 卡片标题

这里是卡片内容，可以使用 **Markdown**

<!-- endcard -->
```

如果省略 `<!-- endcard -->`，卡片会自动包裹直到下一个分隔符（如 `---` 或 `+++`）或文件结束。

### 自定义样式

```markdown
<!-- card: bg=#fff, shadow=lg, radius=20px -->
```

### 可用参数

| 参数      | 说明        | 示例                                                |
| --------- | ----------- | --------------------------------------------------- |
| `bg`      | 背景色/图片 | `#fff`, `linear-gradient(...)`, `url(...)`, `glass` |
| `color`   | 文字颜色    | `#333`, `black`                                     |
| `border`  | 边框        | `1px solid red`                                     |
| `radius`  | 圆角        | `16px` (默认)                                       |
| `shadow`  | 阴影        | `sm`, `md`, `lg`, `none`                            |
| `padding` | 内边距      | `30px` (默认)                                       |
| `width`   | 宽度        | `500px`, `80%`                                      |
| `align`   | 文本对齐    | `left`, `center`, `right`                           |

### 玻璃拟态 (Glassmorphism)

使用 `bg=glass` 快速开启磨砂玻璃效果：

```markdown
<!-- card: bg=glass -->

# Glass Card
```

### 完整示例

```markdown
<!-- layout: cols -->

<!-- card: bg=#fff, color=#333, shadow=lg -->

### 白底卡片

内容...

+++

<!-- card: bg=glass, border=1px solid rgba(255,255,255,0.2) -->

### 玻璃卡片

内容...
```

---

## 媒体支持 (video, audio & iframe)

> 文件：`models/video.js`, `models/audio.js`, `models/iframe.js`

支持嵌入视频、音频和 Iframe 网页。

### 视频 (Video)

> 文件：`models/video.js`

使用 `<!-- video -->` 指令嵌入视频：

```markdown
<!-- video: src=video.mp4, width=800px, controls=true -->
```

#### 可用参数

| 参数       | 说明                    | 默认值  |
| ---------- | ----------------------- | ------- |
| `src`      | 视频地址 (必填)         | -       |
| `width`    | 宽度                    | `100%`  |
| `height`   | 高度                    | `auto`  |
| `autoplay` | 自动播放 (true/false)   | `false` |
| `loop`     | 循环播放 (true/false)   | `false` |
| `muted`    | 静音 (true/false)       | `false` |
| `controls` | 显示控制器 (true/false) | `true`  |

### 音频 (Audio)

> 文件：`models/audio.js`

使用 `<!-- audio -->` 指令嵌入音频：

```markdown
<!-- audio: src=music.mp3, controls=true -->
```

#### 可用参数

| 参数       | 说明                    | 默认值  |
| ---------- | ----------------------- | ------- |
| `src`      | 音频地址 (必填)         | -       |
| `width`    | 宽度                    | `100%`  |
| `autoplay` | 自动播放 (true/false)   | `false` |
| `loop`     | 循环播放 (true/false)   | `false` |
| `muted`    | 静音 (true/false)       | `false` |
| `controls` | 显示控制器 (true/false) | `true`  |

### Iframe

> 文件：`models/iframe.js`

使用 `<!-- iframe -->` 指令嵌入网页或在线工具：

```markdown
<!-- iframe: src=https://example.com, height=500px -->
```

#### 可用参数

| 参数        | 说明                 | 默认值  |
| ----------- | -------------------- | ------- |
| `src`       | 网页地址 (必填)      | -       |
| `width`     | 宽度                 | `100%`  |
| `height`    | 高度                 | `400px` |
| `scrolling` | 滚动条 (yes/no/auto) | `no`    |
| `border`    | 边框                 | `0`     |

---

## 数学公式 (math)

> 文件：`models/math.js`

使用 **KaTeX** 渲染数学公式。

### 基础语法

#### 行内公式

使用 `$` 包裹：

```markdown
质能方程 $E=mc^2$ 很著名。
```

#### 块级公式

使用 `$$` 包裹：

```markdown
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

### 注意事项

- 公式中的特殊字符（如 `_`, `*`）会被自动保护，不会被 Markdown 解析器误处理。
- 需要确保页面加载了 KaTeX 的 CSS 和 JS 文件（Matcha 会尝试自动加载，但推荐手动引入）。

---

## Markdown 解析 (markdowmParse)

> 文件：`models/markdowmParse.js`

### 支持的 Markdown 语法

| 语法     | Markdown       | 输出           |
| -------- | -------------- | -------------- |
| 一级标题 | `# 标题`       | `<h1>`         |
| 二级标题 | `## 标题`      | `<h2>`         |
| 三级标题 | `### 标题`     | `<h3>`         |
| 粗体     | `**文字**`     | `<strong>`     |
| 斜体     | `*文字*`       | `<em>`         |
| 删除线   | `~~文字~~`     | `<del>`        |
| 行内代码 | `` `code` ``   | `<code>`       |
| 代码块   | ` ```js ``` `  | `<pre><code>`  |
| 链接     | `[文字](url)`  | `<a>`          |
| 图片     | `![alt](url)`  | `<img>`        |
| 引用     | `> 引用文字`   | `<blockquote>` |
| 列表     | `- 列表项`     | `<ul><li>`     |
| 表格     | `\| A \| B \|` | `<table>`      |
| 水平线   | `---` 或 `***` | `<hr>`         |

### 代码块

````markdown
```javascript
function hello() {
  console.log("Matcha!");
}
```
````

### 表格

```markdown
| 列 1 | 列 2 | 列 3 |
| ---- | ---- | ---- |
| A    | B    | C    |
| D    | E    | F    |
```

渲染效果：

| 列 1 | 列 2 | 列 3 |
| ---- | ---- | ---- |
| A    | B    | C    |
| D    | E    | F    |

### 文字样式

```markdown
**粗体文字**
_斜体文字_
~~删除线~~
`行内代码`
```

---

## 进度条 (progressBar)

> 文件：`models/progressBar.js`

### 配置选项

通过 JavaScript 配置：

```javascript
new Matcha({
  progressBar: {
    visible: true, // 是否显示
    color: "#00c853", // 颜色
    height: "4px", // 高度
    position: "bottom", // 位置: top | bottom
  },
});
```

### 运行时控制

```javascript
// 显示/隐藏
matcha.modules.progressBar.show();
matcha.modules.progressBar.hide();
matcha.modules.progressBar.toggle();

// 自定义颜色
matcha.modules.progressBar.setColor("#ff6b6b");

// 切换位置
matcha.modules.progressBar.setPosition("top");
```

---

## 语法优先级

当多个指令出现时，按以下顺序解析：

1. `<!-- transition: xxx -->` - **每页独立**的过渡动画
2. `<!-- theme: xxx -->` - **每页独立**的主题
3. `<!-- style: xxx -->` - **每页独立**的样式覆盖
4. `<!-- layout: xxx -->` - 页面布局
5. `<!-- step -->` - 分步展示标记
6. Markdown 内容

> 💡 **V6 新特性**：主题和过渡动画现在是**每页独立**的，不会影响其他页面！

---

## 扩展语法（规划中）

以下语法将在未来版本中支持：

| 语法                             | 说明       | 状态   |
| -------------------------------- | ---------- | ------ |
| `<!-- define: xxx -->`           | 组件定义   | ✅ V8  |
| `<!-- @xxx: params -->`          | 组件使用   | ✅ V8  |
| `<!-- notes: xxx -->`            | 演讲者备注 | 规划中 |
| `<!-- background-video: url -->` | 视频背景   | 规划中 |
| `<!-- timer: 5min -->`           | 演示计时器 | 规划中 |

---

## 完整示例

```markdown
<!-- theme: ocean -->

---

<!-- layout: center -->

# 🍵 Matcha 演示

使用 Ocean 主题

---

<!-- layout: cols, ratio=1:2 -->

## 左侧标题

简短说明

+++

## 右侧详情

- 更多内容
- 列表展示

---

<!-- layout: rows -->
<!-- style: bg=linear-gradient(135deg, #1a1a2e, #16213e) -->

## 顶部

===

## 底部

使用渐变背景

---

<!-- layout: grid, cols=2, rows=2 -->

📊 数据
+++
📈 分析
===
📉 趋势
+++
📋 总结

---

<!-- layout: center -->

# 谢谢

Matcha Framework
```

---

<p align="center">
  <strong>🍵 Matcha.js - 轻量优雅的演示框架</strong>
</p>
