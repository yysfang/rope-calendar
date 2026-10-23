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
