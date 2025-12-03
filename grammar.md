# Matcha.js 语法表

> 🍵 系统内置模块的 Markdown 扩展语法速查表

---

## 目录

- [核心语法](#核心语法)
- [布局模块 (layout)](#布局模块-layout)
- [样式模块 (style)](#样式模块-style)
- [过渡动画 (transition)](#过渡动画-transition)
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

1. `<!-- theme: xxx -->` - 全局主题（影响后续所有页面）
2. `<!-- layout: xxx -->` - 页面布局
3. `<!-- style: xxx -->` - 页面样式覆盖
4. Markdown 内容

---

## 扩展语法（规划中）

以下语法将在未来版本中支持：

| 语法                             | 说明       |
| -------------------------------- | ---------- |
| `<!-- fragment -->`              | 分步显示   |
| `<!-- notes: xxx -->`            | 演讲者备注 |
| `<!-- transition: fade -->`      | 过渡动画   |
| `<!-- background-video: url -->` | 视频背景   |

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
