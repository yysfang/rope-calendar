# 访问统计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按用户最终选择提供百度免费版的浏览量、访客和回访反馈。

**Architecture:** 以独立适配器限制采集范围，只在主视图变化时记录固定页面地址；复用百度免费后台，页脚提供说明与关闭开关。

**Tech Stack:** React、TypeScript、现有 Node 测试与百度统计异步 JS API，不增加 npm 依赖。

**Spec:** docs/superpowers/specs/2026-10-24-visitor-analytics-design.md

## Global Constraints

- 只维护 GitHub，赛事数据与 reviewedAt 不修改。
- 统计仅所有者登录可看，不建立公开报告或前台计数器。
- 只记录固定页面地址；搜索、收藏清单、内部 ID 和凭据不发送，不采集赛事或资料点击。
- 浏览器统计拒绝设置、测试环境、失败的统计脚本不能影响原功能。

## Review Focus

- 页面重绘及重复初始化不得重复计数；切换后返回仍应记录真实页面访问。
- 未配置代码、错误域名/路径、DNT/GPC、排除设置不应加载第三方脚本。
- 三个资料入口不采集点击，默认下载仍正常。
- 所有上报仅含固定页面地址，不能顺手展开赛事对象或当前查询。
- 统计服务不可达、存储被禁用时赛事浏览和资料功能仍可用。

### Task 1: 统计适配器

**Files:** src/lib/analytics.ts、src/lib/analytics.test.mjs、src/lib/browser-analytics.ts、src/data/analytics.json。

**Interfaces:** createAnalytics(config,runtime) 返回 page(view)、isExcluded()、setExcluded(value)；runtime 提供明确的脚本与命令发送边界。

- [x] 先写行为测试，观察缺失实现失败。
- [x] 实现正式地址和采集偏好判定、异步初始化、页面去重、固定页面地址及错误隔离。
- [x] 测试页面往返、排除/恢复、隐私与失败边界，确认全套通过。

### Task 2: 应用接入和说明

**Files:** src/calendar-app.tsx、src/components/event-dialog.tsx、src/components/analytics-info.tsx、README.md、AGENTS.md。

- [x] 仅在主视图变化时记录页面浏览，移除赛事和下载点击记录，不采集筛选输入或收藏清单。
- [x] 增加页脚说明、关闭设置；文案只解释访问统计和用户的控制。
- [x] 运行测试、类型检查与构建；浏览器核对三类入口、排除开关、下载和手机呈现。

### Task 3: 验收和发布

- [x] 独立代码审查并处理实质问题。
- [ ] 提交 main，核对 Pages 工作流、正式脚本与真实收集请求。
- [ ] 在用户的百度后台核对站点与权限，交付报告入口和统计起点，明确报表处理延迟；保存实际截图与维护记录。
