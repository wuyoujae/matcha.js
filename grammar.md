# Matcha.js 语法表

> 🍵 系统内置模块的 Markdown 扩展语法速查表

---

## 目录

- [核心语法](#核心语法)
- [布局模块 (layout)](#布局模块-layout)
- [样式模块 (style)](#样式模块-style)
- [过渡动画 (transition)](#过渡动画-transition)
- [分步展示 (fragment)](#分步展示-fragment)
- [高亮聚焦 (highlight)](#高亮聚焦-highlight)
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

使用 `==内容==` 标记高亮内容，同一步中的多个高亮会按顺序逐个展示：

```markdown
你好，这里是==Matcha==

<!-- step -->

我叫==jae==，我是一名==全栈==独立==开发者==
```

**显示流程**：

```
1. "你好，这里是Matcha"（普通显示）
2. "你好，这里是Matcha"（Matcha 高亮，其他内容变暗）
3. "你好，这里是Matcha，我叫jae，..."（第二步内容显示）
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

使用双等号 `==内容==` 包围需要高亮的内容：

```markdown
你好，这里是==Matcha==
```

### 多高亮嵌套

同一步中的多个高亮会形成嵌套分步：

```markdown
我叫==jae==，我是一名==全栈==独立==开发者==
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

这是第一步，包含==高亮内容==

<!-- step -->

第二步有多个高亮：==重点 1==和==重点 2==
```

**完整显示流程**：

```
1. 标题 + 第一步内容
2. (高亮内容 高亮)
3. 标题 + 第一步 + 第二步内容
4. (重点1 高亮)
5. (重点2 高亮)
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
