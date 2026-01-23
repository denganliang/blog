# 网站部署指南

## 当前进度

✅ **已完成：**

1. **基础架构**
   - ✅ 目录结构创建
   - ✅ CSS主题系统（themes.css, main.css, components.css, utilities.css）
   - ✅ JavaScript核心功能（theme-switcher.js, i18n.js, main.js, search.js）

2. **页面开发**
   - ✅ 首页（中英文双语）
   - ✅ 关于页面（中文版）
   - ✅ 项目展示页面（中文版）
   - ✅ 工具导航页（中文版）
   - ✅ 博客列表页（中文版）

3. **工具迁移**
   - ✅ 番茄钟（pomodoro.html）
   - ✅ 决策记录器（decision-logger.html）
   - ✅ 世界时钟（world-clock.html）
   - ✅ YAML编辑器（yaml-editor/）

4. **SEO和配置**
   - ✅ sitemap.xml
   - ✅ robots.txt
   - ✅ search-index.json
   - ✅ CNAME文件
   - ✅ .nojekyll文件

## 待完成任务

⏳ **需要完成：**

1. **英文版页面**
   - ⏳ 关于页面（/en/about/）
   - ⏳ 项目展示（/en/projects/）
   - ⏳ 工具导航（/en/tools/）
   - ⏳ 博客列表（/en/blog/）

2. **示例内容**
   - ⏳ 创建1-2篇示例博客文章（中英文）
   - ⏳ 添加真实的个人信息（关于页面）
   - ⏳ 添加真实的项目数据

3. **优化和测试**
   - ⏳ 测试所有链接
   - ⏳ 测试主题切换功能
   - ⏳ 测试语言切换功能
   - ⏳ 测试搜索功能
   - ⏳ 响应式测试（移动端）
   - ⏳ 浏览器兼容性测试

4. **资源文件**
   - ⏳ 添加favicon图标
   - ⏳ 添加项目截图/封面图
   - ⏳ 优化现有工具页面的样式统一

## 快速部署步骤

### 方案1：直接使用当前代码（推荐）

```bash
# 1. 检查文件
ls -la

# 2. 测试本地运行
python -m http.server 8000

# 3. 访问 http://localhost:8000 测试

# 4. 如果一切正常，提交到GitHub
git add .
git commit -m "网站重构完成 - 初始版本"
git push origin master
```

### 方案2：逐步迁移

**阶段1：并行运行**
- 保留 `docs/` 目录作为旧版本
- 新版本放在根目录
- 修改GitHub Pages设置指向根目录

**阶段2：完全切换**
- 确认新版本运行正常
- 删除 `docs/` 目录
- 更新所有链接指向

## 下一步建议

### 立即可做：

1. **测试当前功能**
   ```bash
   # 启动本地服务器
   python -m http.server 8000

   # 测试以下功能：
   # - 首页加载
   # - 主题切换（点击右上角图标）
   # - 语言切换（点击右上角按钮）
   # - 导航链接
   # - 工具页面访问
   ```

2. **自定义内容**
   - 修改首页的个人介绍
   - 更新关于页面的个人信息
   - 添加真实的社交媒体链接
   - 替换示例项目为真实项目

3. **补充英文版**
   - 复制中文页面
   - 翻译内容为英文
   - 调整URL路径到 `/en/` 目录

### 后续优化：

1. **性能优化**
   - 压缩CSS/JS文件
   - 添加图片
   - 实现懒加载

2. **功能增强**
   - 添加评论系统（如Giscus）
   - 添加访问统计（如Google Analytics）
   - 添加RSS订阅

3. **内容丰富**
   - 撰写更多博客文章
   - 添加更多工具
   - 展示更多项目

## 常见问题

### Q: 如何修改主题颜色？
A: 编辑 `assets/css/themes.css`，修改 `--accent-color` 等CSS变量。

### Q: 如何添加新页面？
A:
1. 创建HTML文件（参考现有页面结构）
2. 添加导航链接
3. 更新sitemap.xml
4. 更新search-index.json（如果需要搜索）

### Q: 搜索功能不工作？
A: 确保：
1. `search-index.json` 文件存在且格式正确
2. 页面中引入了 `search.js`
3. HTML中有 `.search-input` 和 `.search-results` 元素

### Q: 主题切换不生效？
A: 确保：
1. 页面引入了 `themes.css` 和 `theme-switcher.js`
2. HTML根元素可以设置 `data-theme` 属性
3. 浏览器支持localStorage

## 目录映射

旧版本（docs/）→ 新版本（根目录）：

```
docs/index.html          → index.html
docs/pomodoro.html       → tools/pomodoro.html
docs/dec.html            → tools/decision-logger.html
docs/world-clock.html    → tools/world-clock.html
docs/YamlKeyEditor/      → tools/yaml-editor/
```

## 部署检查清单

- [ ] 所有CSS文件正确链接
- [ ] 所有JS文件正确链接
- [ ] 图标和图片路径正确
- [ ] CNAME文件存在（如使用自定义域名）
- [ ] .nojekyll文件存在
- [ ] sitemap.xml正确
- [ ] robots.txt正确
- [ ] 所有内部链接使用绝对路径（/开头）
- [ ] 测试主题切换功能
- [ ] 测试语言切换功能
- [ ] 测试移动端显示
- [ ] 测试所有工具功能

## 支持

如有问题，请检查：
1. 浏览器控制台是否有错误
2. 网络请求是否成功
3. 文件路径是否正确

---

**准备部署？** 按照上面的步骤操作，或者直接运行：

```bash
python -m http.server 8000
```

然后访问 http://localhost:8000 查看效果！
