# Matcha.js 开发规范

> 🍵 一个轻量、模块化的演示框架

---

## 目录

- [模块规范](#模块规范)
- [代码风格](#代码风格)
- [命名规范](#命名规范)
- [文件结构](#文件结构)
- [Git 提交规范](#git-提交规范)
- [版本管理](#版本管理)
- [贡献指南](#贡献指南)

---

## 模块规范

### 基本原则

所有模块的输入输出都必须按照下面的规范，以便于 `matcha.js` 直接引用。

### 模块格式

每个模块必须导出一个**类**或**工厂函数**，遵循以下结构：

```javascript
/**
 * @module ModuleName
 * @description 模块功能描述
 * @version 1.0.0
 * @author 作者名
 */
class ModuleName {
  /**
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      // 默认配置
      ...options,
    };
  }

  /**
   * 初始化模块
   * @param {Matcha} matcha - Matcha 实例引用
   * @returns {void}
   */
  init(matcha) {
    this.matcha = matcha;
  }

  /**
   * 销毁模块，清理事件监听等
   * @returns {void}
   */
  destroy() {
    // 清理逻辑
  }
}

// 导出方式（二选一）
export default ModuleName; // ES Module
window.MatchaModuleName = ModuleName; // 全局挂载（兼容无构建工具场景）
```

### 模块生命周期

| 阶段 | 方法                   | 说明                            |
| ---- | ---------------------- | ------------------------------- |
| 创建 | `constructor(options)` | 接收配置，初始化内部状态        |
| 挂载 | `init(matcha)`         | 获取 Matcha 实例，bindEvents 等 |
| 运行 | 自定义方法             | 模块核心功能                    |
| 销毁 | `destroy()`            | 解绑事件，释放资源              |

### 模块分类

| 类型     | 目录       | 说明         | 示例                                    |
| -------- | ---------- | ------------ | --------------------------------------- |
| 核心模块 | `models/`  | 框架基础功能 | `markdowmParse.js`, `progressBar.js`    |
| 插件模块 | `plugins/` | 可选增强功能 | `code-highlight.js`, `speaker-notes.js` |
| 主题模块 | `themes/`  | 样式主题     | `dark.css`, `minimal.css`               |

### 模块文件夹结构

复杂模块可以组织为文件夹形式，包含 demo 和文档：

```
models/
├── markdowmParse.js          # 简单模块：单文件
├── progressBar.js
├── style.js
├── layout.js
│
├── myComplexModule/          # 复杂模块：文件夹形式
│   ├── index.js              # 模块入口（必须）
│   ├── demo.html             # 使用演示（推荐）
│   ├── README.md             # 模块文档（推荐）
│   └── helpers/              # 辅助文件（可选）
│       └── utils.js
```

### 模块语法规范

每个模块如果提供 Markdown 扩展语法，**必须**在文件头部注释中声明：

```javascript
/**
 * @module layout
 * @description 布局模块
 * @version 1.0.0
 *
 * @syntax
 * 布局声明:
 *   <!-- layout: center -->     居中布局
 *   <!-- layout: cols -->       横分布局
 *   <!-- layout: rows -->       纵分布局
 *   <!-- layout: grid -->       复合布局
 *
 * 分隔符:
 *   +++    列分隔符
 *   ===    行分隔符
 */
```

所有模块语法汇总在 [`grammar.md`](./grammar.md) 中维护。

---

## 代码风格

### JavaScript

- **ES6+** 语法优先
- **2 空格**缩进
- **分号**结尾
- **驼峰命名**变量和函数
- **PascalCase** 命名类

```javascript
// ✅ 正确
class SlideParser {
  constructor(options = {}) {
    this.slideCount = 0;
  }

  parseContent(markdown) {
    const slides = markdown.split("---");
    return slides.map((s) => s.trim());
  }
}

// ❌ 错误
class slide_parser {
  constructor(options = {}) {
    this.slide_count = 0;
  }
}
```

### CSS

- **BEM 命名**或 `matcha-` 前缀
- **CSS 变量**定义主题色
- 避免 `!important`

```css
/* ✅ 正确 */
.matcha-slide {
  --matcha-primary: #4a7c59;
  background: var(--matcha-bg, #fff);
}

.matcha-slide__title {
  font-size: 2rem;
}

.matcha-slide--active {
  opacity: 1;
}
```

---

## 命名规范

### 文件命名

| 类型            | 规则             | 示例                                    |
| --------------- | ---------------- | --------------------------------------- |
| models 核心模块 | **小驼峰**       | `markdowmParse.js`, `progressBar.js`    |
| plugins 插件    | 小写，短横线分隔 | `code-highlight.js`, `speaker-notes.js` |
| 类文件          | PascalCase       | `SlideParser.js`                        |
| 配置文件        | 小写             | `config.js`, `constants.js`             |
| 样式文件        | 小写，短横线分隔 | `matcha-theme.css`                      |

> ⚠️ **重要**：`models/` 目录下的核心模块文件**必须使用小驼峰命名**（camelCase），这是为了保持与导入时类名的一致性。

### 变量命名

| 类型     | 规则              | 示例                                 |
| -------- | ----------------- | ------------------------------------ |
| 常量     | 全大写下划线      | `MAX_SLIDES`, `DEFAULT_DURATION`     |
| 私有属性 | 下划线前缀        | `_internalState`, `_cache`           |
| DOM 元素 | `el` 或 `$` 前缀  | `elSlide`, `$container`              |
| 布尔值   | `is/has/can` 前缀 | `isActive`, `hasNext`, `canNavigate` |
| 事件处理 | `on/handle` 前缀  | `onKeyDown`, `handleClick`           |

### 事件命名

自定义事件使用 `matcha:` 命名空间：

```javascript
// 触发事件
this.matcha.emit("matcha:slidechange", { index: 1 });
this.matcha.emit("matcha:ready");

// 监听事件
matcha.on("matcha:slidechange", (data) => {});
```

---

## 文件结构

```
matcha/
├── matcha.js           # 核心入口文件
├── matcha.css          # 基础样式
├── index.html          # 演示/测试页面
├── grammar.md          # 📖 系统语法表（所有模块语法汇总）
│
├── models/             # 核心模块（小驼峰命名）
│   ├── markdowmParse.js  # Markdown 解析器
│   ├── progressBar.js    # 进度条模块
│   ├── style.js          # 主题样式模块
│   ├── layout.js         # 布局系统模块
│   │
│   └── complexModule/    # 复杂模块示例（文件夹形式）
│       ├── index.js      # 入口文件
│       ├── demo.html     # 使用演示
│       └── README.md     # 模块文档
│
├── plugins/            # 插件（可选功能）
│   ├── highlight/      # 代码高亮
│   ├── notes/          # 演讲者备注
│   └── export/         # 导出 PDF
│
├── themes/             # 主题样式
│   ├── default.css
│   ├── dark.css
│   └── minimal.css
│
├── docs/               # 文档
│   ├── getting-started.md
│   ├── api.md
│   └── plugins.md
│
└── tests/              # 测试文件
    └── *.test.js
```

---

## Git 提交规范

### Commit Message 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| 类型       | 说明                         |
| ---------- | ---------------------------- |
| `feat`     | 新功能                       |
| `fix`      | Bug 修复                     |
| `docs`     | 文档更新                     |
| `style`    | 代码格式（不影响功能）       |
| `refactor` | 重构（不是新功能也不是修复） |
| `perf`     | 性能优化                     |
| `test`     | 添加测试                     |
| `chore`    | 构建/工具变动                |

### 示例

```bash
feat(mdparse): 添加表格解析支持

- 支持基础表格语法
- 支持对齐方式
- 添加单元测试

Closes #123
```

---

## 版本管理

遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)：

```
MAJOR.MINOR.PATCH
主版本.次版本.修订号
```

| 版本变化 | 场景                |
| -------- | ------------------- |
| `MAJOR`  | 不兼容的 API 变更   |
| `MINOR`  | 向下兼容的新功能    |
| `PATCH`  | 向下兼容的 Bug 修复 |

### 版本标签

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
```

---

## 贡献指南

### 如何贡献

1. **Fork** 本仓库
2. 创建功能分支：`git checkout -b feat/amazing-feature`
3. 提交更改：`git commit -m 'feat: add amazing feature'`
4. 推送分支：`git push origin feat/amazing-feature`
5. 提交 **Pull Request**

### 分支命名

| 分支类型 | 格式          | 示例                   |
| -------- | ------------- | ---------------------- |
| 功能分支 | `feat/<name>` | `feat/table-support`   |
| 修复分支 | `fix/<name>`  | `fix/slide-transition` |
| 文档分支 | `docs/<name>` | `docs/api-reference`   |

### 开发新模块清单

- [ ] 在 `models/` 或 `plugins/` 创建模块文件
- [ ] 遵循[模块规范](#模块规范)编写代码
- [ ] 添加 JSDoc 注释
- [ ] 编写单元测试
- [ ] 更新 `docs/` 文档
- [ ] 提交 PR 并附上功能说明

### Issue 模板

提交 Issue 时请包含：

```markdown
### 问题描述

简述问题或功能需求

### 复现步骤（Bug）

1. 步骤一
2. 步骤二

### 期望行为

描述你期望的结果

### 环境信息

- 浏览器：Chrome 120
- Matcha 版本：v1.0.0
```

---

## API 设计原则

### 简洁优先

```javascript
// ✅ 简洁的 API
matcha.goto(3);
matcha.next();
matcha.on("change", fn);

// ❌ 过于冗长
matcha.navigateToSlide(3);
matcha.navigateToNextSlide();
matcha.addEventListener("slideChange", fn);
```

### 链式调用

```javascript
// 支持链式调用
matcha.use(highlightPlugin).use(notesPlugin).start();
```

### 配置对象

```javascript
// 使用配置对象而非多参数
new Matcha({
  containerId: "slides",
  transition: "fade",
  duration: 300,
});
```

---

## 浏览器兼容性

| 浏览器  | 最低版本 |
| ------- | -------- |
| Chrome  | 80+      |
| Firefox | 75+      |
| Safari  | 13+      |
| Edge    | 80+      |

> 💡 不支持 IE，拥抱现代浏览器特性

---

## 许可证

MIT License - 自由使用、修改和分发

---

<p align="center">
  <strong>🍵 Matcha.js - 轻量优雅的演示框架</strong>
</p>
