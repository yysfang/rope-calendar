# 绳历 · 跳绳赛事日历

为教练员和运动员整理国际、全国和各省跳绳赛事，提供赛期、地点、报名信息和规程下载。

**网站：[yysfang.github.io/rope-calendar](https://yysfang.github.io/rope-calendar/)**

## 本地运行

需要 Node.js 24。

```sh
npm ci
npm run dev
```

## 更新与发布

每周一 09:00（北京时间）由唯一的赛事核查任务直接维护本仓库，按 `maintenance.json` 核对官方公告与规程。原 ChatGPT Sites 站已停止维护，本仓库不再从原站同步。

`src/data/seed.json` 是赛事目录的唯一编辑源，规程保存在 `public/regulations/`。构建时从本地目录生成 `public/catalog.json`，已有附件不产生网络请求；新附件只从记录中的原始官方 URL 下载并校验。校验失败时不会发布不完整目录，线上保留上一次成功版本。

有实际内容变化的提交触发 GitHub Pages 发布，也可手动运行 Actions。没有变化时只在 `maintenance-audits/` 记录实际核查范围，不重复构建网页。研究记录和维护规范不打包进网站。

```sh
npm test
npm run typecheck
npm run build
```

## 举办地配图

国际、全国赛事采用全景顶带与白色信息区，省级赛事使用紧凑的纯文字卡片；“我的备赛”沿用相同规则。图片来自有明确转载许可的 Wikimedia Commons 照片，署名和许可集中在页脚“图片来源”；少数 AI 氛围图在同一入口明确标记，不作为场馆实拍。已知城市按 `src/data/landmarks.json` 的精确地点匹配，线上、未公布和新地点安全使用跳绳主题图，不能用省会图片暗示举办城市。

`public/landmarks/` 保存桌面 1600×240 和手机 800×228 的本地 WebP；展示时不请求外部图片服务。新增真实照片须记录作者、原图页、许可链接，并查看裁切后是否仍能识别主体。保留精简的页面，只在图片来源中说明署名与裁切。

有特色的场馆可优先于普通城市配图，通过图片条目的 `venues` 仅匹配对应场馆赛事，例如飞马水城。选图先检查光线、主体与实际横幅构图，不能只因地点正确就使用观感差的图片。
