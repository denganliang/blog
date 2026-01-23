# 邓安良的个人网站

现代化的个人网站，包含工具、博客、项目展示等内容。

## 🌟 特性

- ✅ **纯静态HTML** - 无框架依赖，性能极致
- ✅ **双语支持** - 完整的中英文双语系统
- ✅ **深浅主题** - 自动适配系统主题，支持手动切换
- ✅ **搜索功能** - 全站内容搜索，支持模糊匹配
- ✅ **SEO优化** - 完整的meta标签、sitemap、结构化数据
- ✅ **响应式设计** - 完美适配桌面、平板、手机
- ✅ **高性能** - Lighthouse性能得分95+
- ✅ **无需构建** - 直接部署，无需编译

## 📁 项目结构

```
blog/
├── index.html              # 中文首页
├── en/
│   └── index.html          # 英文首页
├── about/                  # 关于页面
├── projects/               # 项目展示
├── blog/                   # 博客文章
├── tools/                  # 在线工具
│   ├── pomodoro.html       # 番茄钟
│   ├── decision-logger.html # 决策记录器
│   ├── world-clock.html    # 世界时钟
│   └── yaml-editor/        # YAML编辑器
├── assets/
│   ├── css/
│   │   ├── themes.css      # 主题变量
│   │   ├── main.css        # 全局样式
│   │   ├── components.css  # 组件样式
│   │   └── utilities.css   # 工具类样式
│   ├── js/
│   │   ├── theme-switcher.js # 主题切换
│   │   ├── i18n.js         # 多语言支持
│   │   ├── main.js         # 全局功能
│   │   └── search.js       # 搜索功能
│   └── images/             # 图片资源
├── search-index.json       # 搜索索引
├── sitemap.xml             # 站点地图
└── robots.txt              # 爬虫配置
```

## 🚀 快速开始

### 本地预览

1. 克隆仓库：
```bash
git clone https://github.com/denganliang/denganliang.com.git
cd blog
```

2. 启动本地服务器：
```bash
# 使用Python
python -m http.server 8000

# 或使用Node.js
npx http-server -p 8000
```

3. 访问 `http://localhost:8000`

### 部署到GitHub Pages

1. 推送代码到GitHub仓库
2. 在仓库设置中启用GitHub Pages
3. 选择 `master` 分支和 `/` 根目录
4. 配置自定义域名（可选）

## 📝 添加内容

### 添加新博客文章

1. 在 `blog/` 目录下创建新文件夹（使用文章slug作为名称）
2. 创建 `index.html` 文件（中文版）
3. 创建 `en/index.html` 文件（英文版）
4. 更新 `search-index.json` 添加文章索引

### 添加新工具

1. 在 `tools/` 目录下创建新的HTML文件
2. 更新 `tools/index.html` 添加工具卡片
3. 更新 `sitemap.xml` 添加新URL

### 添加新项目

1. 更新 `projects/index.html` 添加项目卡片
2. 更新对应的英文版本

## 🎨 自定义

### 修改主题颜色

编辑 `assets/css/themes.css`，修改CSS变量：

```css
:root {
  --accent-color: #0066cc;  /* 主题色 */
  --bg-primary: #ffffff;    /* 背景色 */
  --text-primary: #1a1a1a;  /* 文字颜色 */
}
```

### 修改导航栏

编辑每个页面的导航部分，统一修改菜单项。

### 添加社交媒体链接

在页脚的 `.footer-social` 部分添加新的社交媒体图标。

## 🔧 功能说明

### 主题切换

- 自动检测系统主题偏好
- 记住用户选择
- 平滑过渡动画

### 语言切换

- 基于URL路径的语言切换（`/` 为中文，`/en/` 为英文）
- 记住用户语言偏好
- 自动跳转到用户首选语言

### 搜索功能

- 前端实现，无需后端
- 支持标题、内容、标签搜索
- 实时搜索建议
- 键盘导航支持

## 📊 性能优化

- 纯静态HTML，无运行时开销
- CSS/JS按需加载
- 图片懒加载
- 代码压缩
- 浏览器缓存优化

## 🌐 SEO优化

- 语义化HTML5标签
- 完整的meta标签
- Open Graph标签（社交分享）
- 结构化数据（JSON-LD）
- 站点地图（sitemap.xml）
- robots.txt配置
- 双语标注（hreflang）

## 📱 响应式设计

- 移动优先设计
- 断点：320px, 480px, 768px, 1024px, 1200px
- 触摸友好的交互
- 自适应字体大小

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 📧 联系方式

- 网站：https://denganliang.com
- GitHub：[@denganliang](https://github.com/denganliang)
- Twitter：[@denganliang](https://twitter.com/denganliang)

---

⭐ 如果这个项目对你有帮助，欢迎Star！
