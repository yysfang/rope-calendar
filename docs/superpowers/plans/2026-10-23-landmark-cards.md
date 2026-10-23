# 城市地标赛事卡片实施计划

> **For agentic workers:** 使用 superpowers:executing-plans 在当前会话完成；用户已经选定第 2 张效果图并授权更新 GitHub 站。

**Goal:** 每场赛事采用贯穿卡片的举办地全景照片，白色信息区保持名称、时间、地点和操作清楚可读。

**Architecture:** 图片与赛事目录分开维护。来源与许可保存在图片清单，本地压缩 WebP 随 GitHub Pages 发布，按地点匹配复用；线上/地点未公布不虚构城市。现有筛选、收藏、规程、日历保持原行为。

**Tech Stack:** React 19、TypeScript、Vite、WebP、Node test runner。

**Spec:** 用户选择的第二张全景顶带效果图，`exec-f67a89ae-cb2d-4574-829e-9c2a11d8bfa4.png`。

## Global Constraints
- 只维护 GitHub 仓库和 Pages；不访问或更新原 Sites 项目。
- 文字均在纯白区域；移动端先时间后地点；不显示体育/教育体系、内部键、技术标识。
- 使用可授权转载的真实地标照片；署名集中在图片来源对话框。
- 不修改赛事事实、reviewedAt 或既有规程。

## Review Focus
- 县市名称相似：只匹配确切的举办城市，避免错图。
- 线上和地点待定：使用明确的跳绳主题图或已知省域景观，不暗示具体城市。
- 图片失败：文字和操作仍可用，图片容器不破坏布局。
- 新赛事：优先城市/省域映射，未知地点安全回退。
- 国内访问：图片本地托管，懒加载、小屏资源尺寸适配，无第三方图片请求。

### Task 1: 地点图片与来源
- [x] 添加图片匹配、线上/待定、完整许可和静态文件覆盖测试，先运行确认缺少实现。
- [x] 收集真实照片与许可，生成本地 WebP 和 `src/data/landmarks.json`。
- [x] 实现 `eventCover(event)`；测试所有赛事都有安全匹配，明确城市优先于省份。

### Task 2: 卡片与署名
- [x] `src/components/event-cover.tsx` 渲染独立全景顶带，`calendar-app.tsx` 使用独立白色信息网格。
- [x] `globals.css` 实现桌面约 8:1 全景、小屏约 3.6:1 全景，移动端信息顺序不变。
- [x] 页脚添加精简的图片来源入口，原生 dialog 支持键盘关闭。

### Task 3: 验证与发布
- [x] `npm test`、`npm run typecheck`、`npm run build` 全部通过。
- [x] 浏览器实际查看桌面/手机、国际/全国/省级、线上与取消记录、筛选/收藏/下载，检查 console。
- [x] 同选定图一起比较，保存 `design-qa.md`，修复 P0/P1/P2 后通过。
- [ ] 提交 main，核实 Pages 部署及正式站图片；保留简短维护说明。
