# 在线工具板块设计规范 · Quiet Workbench

> 适用页面：`/tools/` 与 `/en/tools/` 下全部 20 个 HTML。
> 实现位置：`assets/css/tools-ui.css`（令牌与组件）、`assets/js/tools-ui.js`（交互运行时）、`assets/js/tools-index.js`（目录页控制器）、`assets/css/tools-layout.css`（目录页布局）。
> 技术约束：原生 HTML + CSS + ES2017 JavaScript，无构建步骤、无新增依赖、无 CDN；所有资源本地化。

---

## 1. 设计定位

「克制中性工作台」：低饱和中性灰阶铺底，单一冷蓝作为唯一强调色，靠 1px 描边、极浅分层表面、秩序化留白与精确对齐建立专业感。参考主流工具站的信息密度与层级（Linear、Vercel、Raycast、TinyPNG），但不使用大面积渐变、发光、霓虹或装饰性插画。

- **桌面优先**，向下响应式适配到 480px。
- **图标**：内联线性 SVG，统一 1.6–1.8 描边，替代 emoji 图标。
- **数字与代码**：等宽字族，便于对齐与扫读。
- **字体**：系统字族栈（PingFang SC / Noto Sans SC / system-ui），零外部字体请求。

## 2. 设计令牌

所有令牌以 `--tool-*` 命名，定义在 `body.tool-scope` 下；深色主题由 `html[data-theme="dark"] body.tool-scope` 覆盖，另有 `prefers-color-scheme` 兜底。作用域隔离确保首页、博客、项目、关于页不受影响。

### 色彩

| 语义 | 浅色 | 深色 | 用途 |
| --- | --- | --- | --- |
| 页面底 `--tool-bg` | `#F8FAFC` | `#0B1220` | 页面背景 |
| 主表面 `--tool-surface` | `#FFFFFF` | `#151C27` | 卡片、面板、导航、Toast |
| 次表面 `--tool-surface-2` | `#F1F4F8` | `#1B2431` | 分段控件底、投放区、标签 |
| 三级表面 `--tool-surface-3` | `#E9EEF5` | `#232E3D` | 进度槽、骨架屏 |
| 描边 `--tool-border` | `#E3E8EF` | `#26303F` | 1px 分隔线 |
| 强描边 `--tool-border-strong` | `#CBD5E1` | `#3A4759` | 输入控件、悬停态 |
| 主文本 `--tool-text` | `#101828` | `#E7ECF3` | 标题、正文强调 |
| 次文本 `--tool-text-2` | `#475467` | `#A8B3C4` | 描述、标签 |
| 弱文本 `--tool-text-3` | `#8A94A6` | `#7C8798` | 提示、计数、占位符 |
| 强调 `--tool-primary` | `#2563EB` | `#5B8DEF` | 唯一强调色：按钮、激活态、焦点 |
| 强调悬停 | `#1D4ED8` | `#7AA4F5` | — |
| 强调浅底 | `#EFF4FF` | `#16243D` | 徽标、Chip 激活、focus halo |
| 成功 | `#12B76A` | `#3CCB87` | 成功状态 |
| 错误 | `#F04438` | `#F97066` | 错误状态 |
| 警告 | `#F79009` | `#FDB643` | 警告状态 |

功能色均为低饱和版本，且**必须同时以图标与文案表达**，不依赖颜色单一通道。

### 字阶与排版

| 级别 | 字号 / 字重 / 行高 | 用途 |
| --- | --- | --- |
| Display | 32px / 650 / 1.3（Hero 最高 36px） | 页面主标题 |
| H2 | 20px / 650 / 1.3 | 区块标题 |
| H3 | 17px / 600 / 1.3 | 卡片组标题 |
| 卡片标题 | 14.5–15px / 640–650 | 工具名、面板名 |
| 正文 | 13–14px / 400 / 1.65 | 描述与说明 |
| 辅助 | 11.5–12.5px / 550 | 标签、计数、提示 |
| 等宽 | 12.5px / `--tool-monospace` | 代码、数字、时间戳 |

字距：标题 `-0.015em` ~ `-0.03em`，其余默认。

### 形状、间距、层次

- 圆角三级：`8px`（控件）/ `12px`（容器、投放区）/ `16px`（卡片、页面头）；Chip 用全圆角。
- 1px 描边为主；阴影仅两级：静态 `0 1px 2px`，悬停 `0 2px 6px + 0 14px 32px` 的极浅叠加。
- 8pt 栅格：4 / 8 / 12 / 16 / 20 / 24 / 32 / 40。内容区最大宽度 1200px，卡片内边距 20px，栅格间距 16px。
- 导航高度 64px（≤768px 为 58px），磨砂玻璃 + 细描边。

### 动效

- 过渡统一 `160–200ms cubic-bezier(.2,.7,.3,1)`，仅对颜色、描边、阴影、透明度、位移生效；覆盖 `themes.css` 的全局 `*` 过渡。
- 卡片悬停上浮 `2px` + 描边加深 + 顶部渐变线；主按钮按下 `scale(.985)`；面板切换淡入上移 `4px`；Toast 右侧滑入。
- 全部动效在 `prefers-reduced-motion: reduce` 下关闭。

## 3. 页面模板（5 类，覆盖 20 页）

| 模板 | 页面 | 结构顺序 |
| --- | --- | --- |
| A 工具目录 | `index.html` ×2 | 导航 → Hero（标题、价值说明、可信徽标、全局搜索）→ 分类 Chip（带计数）+ 结果条 → 工具卡片网格 → 空状态 → 即将推出 → 建议新工具 → 页脚 |
| B 综合工具箱 | `dev/image/audio-toolbox.html` ×6 | 导航 → 面包屑 + 页面头 → 主分段切换 → 二级 Chip 导航 → 工具面板（输入/输出、参数、主次按钮）→ 投放区 → 结果与状态区 → 页脚 |
| C 上传处理单页 | `photosign` / `gemini-watermark-remover` / `nano-banana` ×6 | 导航 → 面包屑 + 页面头 → 左投放与预览 / 右参数面板 → 操作条 → 结果对比与下载 → 页脚 |
| D 计时与时钟 | `pomodoro` / `world-clock` ×4 | 导航 → 面包屑 + 页面头 → 大号等宽数字与状态标签 → 分段模式切换与控制区 → 列表/统计与空状态 → 完成弹层 → 页脚 |
| E 编辑器 | `markdown-editor.html` ×2 | 导航 → 面包屑 + 页面头（文档状态）→ 格式工具条与视图切换 → 编辑/预览双栏 → 底部状态栏 → 页脚 |

导航与页脚为全站共享区块，位置感跨页面稳定。NanoBanana 保留其 Vue3 + Tailwind 内核与 `#app` 显隐机制，仅在外层套框架与反馈层，不标注「纯前端处理」。

### 工具目录的排序规则

- **默认顺序（开发调试优先）**：开发工具箱 → Markdown 编辑器 → 图片工具箱 → 世界时钟 → 番茄钟 → 音频工具箱 → Gemini 水印抹除 → NanoBanana → PhotoSign。该顺序即 `#tools-grid` 内 9 张卡片的 DOM 顺序，是唯一真源，中英两版必须完全一致；无脚本时同样生效。
- **个人化微调**：`tools-index.js` 读取 `localStorage['tools:usage:v1']` 中按工具标识累加的点击计数，采用阻尼规则 `effectiveIndex = defaultIndex - min(count, 8)`；同分时按计数降序、再按默认位置稳定兜底。每次点击最多前移一位，新顺序在下次进入目录页时生效（本次访问不重排，避免页面跳动），初始化时一次性重排 DOM，不参与搜索 / 筛选路径。
- **跨语言共享**：工具标识由卡片 `href` 的文件名派生（`/tools/dev-toolbox.html` 与 `/en/tools/dev-toolbox.html` 同为 `dev-toolbox`），因此中英两版共用同一份计数。
- **恢复默认**：仅在存在使用记录时，结果条右侧出现低调纯文字按钮「恢复默认顺序 / Reset order」；点击清除计数、DOM 复位并给出短暂 Toast。界面不出现「常用」徽标、分组或排序切换控件，卡片外观不变。
- **降级**：无 `localStorage`、私有模式、数据损坏或无记录时一律回落到默认顺序；未知标识被忽略，读写均有 try/catch 保护，仅存本地、不上传。

## 4. 组件清单

| 组件 | 类名 / 契约 | 说明 |
| --- | --- | --- |
| 按钮 | `.btn` / `.tool-btn` + `--primary` / `--secondary` / `--ghost` / `--danger` / `--sm` | 主次层级明确，禁用态说明原因 |
| 分类 Chip | `.tool-filter-chip[aria-pressed]` | 带计数，横滚，键盘可达 |
| 分段切换 | `.tool-segmented` / `.tab-btn[aria-selected]` | `role="tablist"` / `role="tab"`，方向键、Home/End |
| 二级导航 | `.sub-nav-item[aria-current]` | 横滚 Chip，激活底部指示 |
| 投放区 | `.file-upload` / `.tool-dropzone` | 拖放 + 点击 + 键盘 Enter/Space，格式与体积校验、文件列表与移除 |
| 状态容器 | `[data-state="idle\|loading\|empty\|error\|success"]` | 图标 + 标题 + 详情 + 可操作按钮（重试 / 复制详情） |
| 进度 | `.tool-progress` + `aria-valuenow` | 带百分比与取消 |
| 骨架 | `.tool-skeleton` | 加载占位，reduced-motion 下静止 |
| 通知 | `.tool-toast-stack` / `.tool-toast[data-kind]` | 队列上限 4，`aria-live="polite"`，错误 `role="alert"` |
| 模态 | `.tool-modal-backdrop` / `.tool-modal` | 焦点陷阱、ESC 关闭、关闭后焦点归还 |
| 面包屑 | `.tool-breadcrumb` + `.tool-trust` | 统一页面起始位置与可信标记 |
| 结果区 | `.tool-state` / `.tool-result` | 成功结果含预览、复制、下载入口 |

## 5. 状态矩阵

| 用户动作 | 反馈 | 无障碍 |
| --- | --- | --- |
| 打开工具页 | 面包屑、页面头、当前栏目高亮 | `aria-current="page"` |
| 搜索 / 筛选 | 结果计数、卡片显隐、无结果空状态与建议词 | `aria-live="polite"` 播报结果数 |
| 选择文件 | 文件列表（名/大小）、移除按钮、格式错误提示 | 投放区 `role="button"`，Enter/Space |
| 校验失败 | 内联错误状态（原因 + 可操作建议），必要时 Toast | `role="alert"` |
| 处理中 | 进度条 + 百分比 + 取消，按钮禁用 | `aria-valuenow` 更新 |
| 处理成功 | 成功状态 + 结果预览 + 下载/复制 | `aria-live="polite"` |
| 处理失败 | 错误状态 + 原因 + 重试 + 复制详情，**不使用 `alert()`** | `role="alert"` |
| 复制 | Toast 成功提示 | `aria-live="polite"` |
| 计时完成 | 居中模态 + 提示音（若原有） | 焦点陷阱、ESC、焦点归还 |

## 6. 无障碍与可用性规则

- 所有交互元素 `:focus-visible` 为 `2px` 主色 + `2px` 偏移，禁止移除轮廓。
- Tab 组件完整 ARIA：`role="tablist"` / `role="tab"` / `role="tabpanel"`、`aria-selected` / `aria-controls` / `aria-labelledby`、`tabindex` 漫游、方向键与 Home/End。
- 状态变化通过 `aria-live` 播报；错误使用 `role="alert"`。
- ≤768px 触控目标 ≥44px；横滚区域可键盘滚动。
- 反馈文案一律使用 `textContent` 渲染，禁止把文件名、用户输入拼进 `innerHTML`。
- 断点统一：`1024px`（双栏转单栏、卡片 3→2 列）、`768px`（导航折叠、Chip 横滚、按钮换行）、`480px`（单列、字号下调）。

## 7. 中英消息字典

交互文案集中在 `assets/js/tools-ui.js` 的 `MESSAGES.zh / MESSAGES.en`，按 `document.documentElement.lang` 或 `window.I18n.getCurrentLanguage()` 选择。HTML 静态文案仍逐页翻译。

| Key | 中文 | English |
| --- | --- | --- |
| `backToTools` | 返回工具库 | Back to tools |
| `localOnly` | 本地处理 · 数据不上传 | Runs locally · Files stay on your device |
| `searchPlaceholder` | 搜索工具、功能或关键词… | Search tools, features or keywords… |
| `resultCount` | 共 {n} 个工具 | {n} tools |
| `noResult` | 没有找到匹配的工具 | No matching tools |
| `noResultHint` | 试试更短的关键词，或清除筛选条件 | Try a shorter keyword or clear the filters |
| `clearFilter` | 清除筛选 | Clear filters |
| `dropTitle` | 拖放文件到此处，或点击选择 | Drop files here or click to browse |
| `dropHint` | 支持 {types}，单个文件不超过 {size} | {types} up to {size} per file |
| `invalidType` | 文件类型不支持 | Unsupported file type |
| `invalidSize` | 文件体积超出限制 | File is too large |
| `loading` | 正在处理… | Processing… |
| `empty` | 暂无内容 | Nothing here yet |
| `error` | 操作失败 | Something went wrong |
| `errorHint` | 可重试，或复制详情便于排查 | Retry, or copy details for troubleshooting |
| `success` | 处理完成 | Done |
| `retry` | 重试 | Retry |
| `copyDetails` | 复制详情 | Copy details |
| `copied` | 已复制到剪贴板 | Copied to clipboard |
| `copyFailed` | 复制失败，请手动选择文本 | Copy failed, please select the text manually |
| `remove` | 移除 | Remove |
| `cancel` | 取消 | Cancel |
| `close` | 关闭 | Close |
| `shortcutHint` | 按 / 快速搜索 | Press / to search |

目录页控制器 `assets/js/tools-index.js` 另有一份小字典，包含 `resetOrder`（恢复默认顺序 / Reset order）与 `orderRestored`（已恢复默认顺序 / Default order restored）。

## 8. 接入指南：新增工具页

1. 复制同类模板页面（A–E 之一），保留 `<head>` 中的 canonical / hreflang / SEO meta 与公共 CSS、JS 引用。
2. `<body>` 加 `class="tool-scope"`；在公共样式之后引入 `assets/css/tools-ui.css`；在 `theme-switcher.js → i18n.js → main.js` 之后引入 `assets/js/tools-ui.js`（目录页另加 `tools-index.js`）。
3. 运行时自动完成：面包屑与页面头注入、当前栏目 `aria-current`、Tab / 二级导航 ARIA 与键盘支持、投放区语义与拖拽增强、`window.alert` 兜底转 Toast。
4. 业务脚本只处理算法；错误与成功反馈调用 `ToolUI.notify.*` / `ToolUI.setState(...)`，禁止 `alert()`。
5. 目录页新增 `.tool-card`，保留 `data-categories`、`data-keywords`，并补充 `data-icon`（SVG 名）；同时在**中英两版**按默认顺序插入该卡片，两版顺序必须一致。工具标识取自 `href` 文件名，重命名文件会重置该工具的使用计数。
6. 同步创建 `/en/tools/` 对应页面（结构、class、data 属性、脚本引用完全一致，仅文案为英文）。
7. 更新 `tools/index.html`、`en/tools/index.html`、`search-index.json`、`sitemap.xml`。
8. 在 `/workspace` 下运行 `python3 scripts/check_site.py`，并人工走查浅深主题、中英双语、键盘操作与 1024 / 768 / 480 断点。

排序契约、阻尼规则与恢复入口见「3. 页面模板 → 工具目录的排序规则」。

## 9. 开发工具箱工具卡片（dev-toolbox 特例）

`tools/dev-toolbox.html` 与 `en/tools/dev-toolbox.html` 是 4 个主 Tab + 16 个工具的复合页，样式与业务脚本内联，属于模板 A–E 之外的特例。两页 `<body>` 额外带 `dev-toolbox-scope`，并在 `tools-ui.js` 之后加载 `assets/js/dev-toolbox-ui.js`（`window.ToolBox`）。卡片级样式集中在 `tools-ui.css` 第 11 节，选择器统一为 `body.tool-scope.dev-toolbox-scope ...`，避免波及其他 tools 页面。

### 卡片契约

每张 `.tool-item[id]` 用 `data-*` 声明能力，`ToolBox.enhance()` 在 `DOMContentLoaded` 时按声明注入 UI：

| 属性 | 作用 |
| --- | --- |
| `data-hint` | 标题下的一行说明，中英各一份 |
| `data-example` | 注入「填入示例」按钮，填入卡片内第一个可编辑输入框 |
| `data-copy-source` | 注入「复制结果」按钮，取该 id 的 `value` 或去掉按钮后的 `textContent` |

运行时自动完成：`<label>` 与控件的 `for` / `id` 关联、结果容器挂 `.tool-result-panel`、每张卡片末尾插入 `.tool-inline-state`（`role="status"` / `aria-live="polite"`，仅有消息时占位）、为缺少清空入口的卡片注入通用「清空」、原生清空按钮点击后同步收起状态条。

### 反馈与状态

错误不再用 `innerHTML` 注入红字，也不再使用 `ToolUI.alert`：

- `ToolBox.report(target, kind, message)`：`kind` 为 `error | success | empty`；`target` 可为结果元素或工具 id，会清空旧结果并在卡片内就地显示状态。
- `ToolBox.clear(target)`：清空 `.error` 占位并收起状态条。
- `ToolBox.alert(message)`：从 `document.activeElement` 反查卡片，错误就地显示；找不到卡片时退化为 `ToolUI.notify.error`。
- `ToolBox.copyResult(button)`：复用 `ToolUI.copy` 完成剪贴板写入与成功反馈。
- 成功信息（如 JSONPath 的「匹配到 N 项」）使用 `success`，不再写进红色 `.error`。

工具内不再出现原生 `prompt()`；正则替换改为卡片内的 `#regex-replacement` 输入框。

### 导航与布局

- 滚动偏移由 `ToolBox.stickyOffset()` 按 `.navbar` + `.sub-nav` 实际高度计算，取代写死的 `140`。
- URL 中带 `?tool=` 或 hash 时优先定位工具，不再被 `localStorage` 中的上次 Tab 覆盖。
- `.sub-nav` 改为单行横向滚动并与 navbar 高度对齐；768–1024 保留 `.two-columns` 双列。
- 文本对比与时间差值不再共用 `diff-result`，后者改用 `time-diff-result`。

### 维护注意

两页结构、class、id、data 属性与脚本函数必须逐行对应；修改任一工具 UI 时中英两版同步，并运行 `python3 scripts/check_site.py`。两页含混合 CRLF/LF 行尾，批量改动需逐行保留原 EOL，避免产生全文件 diff。

## 10. 不改动清单

`assets/css/{themes,main,components,utilities}.css` 的全局规则、`assets/js/{main,i18n,theme-switcher,search}.js`、`assets/vendor/`、`.codebuddy/`（项目数据，保留但不参与站点校验）。`scripts/check_site.py` 仅在文件收集层排除 `assets/vendor/` 与 `.codebuddy/` 这两个非发布目录，校验规则本身不变。新样式全部限域在 `body.tool-scope` 内，保证对非 tools 页面零影响。
