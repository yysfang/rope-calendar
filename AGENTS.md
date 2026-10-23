# 绳历维护

- 只维护本 GitHub 仓库与 https://yysfang.github.io/rope-calendar/。原 ChatGPT Sites 站已停更，不读取或写入其 API，不同步原站、不部署原站、不创建第二个每周任务。
- 先阅读根目录 `maintenance.json`。唯一赛事源是 `src/data/seed.json`，以最新 main 的全部记录为基础增量合并。规程放在 `public/regulations/`，保留官方原始 URL。`public/catalog.json` 是构建产物，不手工编辑或提交。
- 取消通知优先于旧计划；罗城站已取消。段位挑战赛各站与总决赛、世锦赛同期挪威公开赛和 ISF 分别核对。未公布字段不编造，暂定日期与赛会窗口按规范标明。
- 用户界面按国际、全国、各省排列。赛事名称、时间、地点各自清楚；桌面端按名称、时间、地点、操作分列，手机端先显示时间，再显示地点。体育/教育仅用于采集，不能展示或用于筛选。UUID、哈希、内部键和研究过程不能混入用户可见内容。
- 只有实质内容变化才更新公开目录和 reviewedAt、触发发布；无变化在 `maintenance-audits/` 记录真实核查情况。不要把“未找到”写成“无赛事”。
- 修改后运行 `npm test`、`npm run typecheck`、`npm run build`，实际查看桌面和手机呈现、资料下载与筛选后再提交 main 并核实 Pages 发布。维护记录不能放入 public/。
- 地标图片独立维护于 `src/data/landmarks.json` 与 `public/landmarks/`；记录真实照片作者、原图与许可，AI 氛围图须在图片来源明确标记。新地点没有可核实图片时使用跳绳主题图，不能假定省会或冒用其他城市；配图标题说明照片实际地点，不能误写为赛事举办区县。图片本地托管、懒加载，保留手机尺寸。纯视觉修改不更新时间核查字段。
