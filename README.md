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

GitHub Actions 每周一同步已核实的赛事及规程，并发布到 GitHub Pages。也可在 Actions 中手动运行发布流程。下载文件与网页一同托管，访客访问赛事、收藏和下载时无需连接原站。

`sync.config.json` 指定公开目录的数据来源。数据同步失败或规程文件校验失败时，保留上一版已发布内容。赛期和参赛要求以主办方最新公告为准。

```sh
npm run sync
npm test
npm run typecheck
npm run build
```
