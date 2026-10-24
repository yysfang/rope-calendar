# 月份导航首页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按用户选定的第三张效果图，将宣传首屏改为紧凑的月份导航与赛事检索。

**Architecture:** 复用现有 React 应用和地标资产，新增独立月份导航组件与局部样式；在现有筛选函数中加入月份交集判断。初始显示完整待赛列表，当前月下方标明今天；点击月份后筛选对应月份，所有月份弹窗支持跨年选择与恢复完整列表。

**Tech Stack:** 现有 React 19、TypeScript、Vite、Lucide 和 Node 原生测试，不新增依赖。

**Spec:** 用户确认的第三张生成图 `outputs/hero-directions/season-timeline.png`，显示顺序见同目录 `selection.json`。

## Global Constraints

- 只维护 GitHub 站；不调用、读取、同步或部署原 Sites。
- 国际、全国、各省浏览优先级不变；省级赛事没有图片。
- 时间先于地点；无体育/教育体系筛选、内部标识或核查过程文案。
- 不修改赛事事实、附件和 reviewedAt；原有已授权发布流程继续使用。
- 现有真实地标图片、标准图标和品牌标记直接复用；本次无需生成新资产。

## Review Focus

- 跨月、跨年赛事在赛期触及的每个月可查，未公布日期不能编造月份。
- 月份、年份、级别、地区、时间范围和搜索组合后保持一致。
- 月份弹窗可用键盘关闭；手机端不溢出，时间与地点仍清楚。
- 列表与月历切换时月份一致，过去月份能找到历史赛事。
- 清除月份后赛期待定记录恢复，不丢失现有收藏和下载入口。

### Task 1: 月份筛选

- [x] 在 `src/lib/catalog.test.mjs` 添加跨月跨年、组合筛选、赛期待定恢复测试，先观察失败。
- [x] 在 `src/lib/catalog.ts` 添加可选月份筛选，按赛期与月份交集判断。
- [x] 运行现有测试并确认通过。

### Task 2: 月份首屏与交互

- [x] 创建 `src/components/season-navigation.tsx`，含四个月入口与全部月份原生弹窗。
- [x] 修改 `src/calendar-app.tsx` 与 `src/main.tsx`，移除宣传首屏，将月份、月份筛选和月历状态联动。
- [x] 创建 `src/season-layout.css`，按照选定图重排搜索、级别与时间筛选，保留明确的信息列。
- [x] 浏览器检查跨年月份、清除筛选、空状态、资料、收藏和手机布局。

### Task 3: 视觉验收与发布

- [x] 运行测试、类型检查和构建；将效果图与同尺寸实际页面放在一起比较。
- [x] 修复 P0/P1/P2，更新根目录 `design-qa.md` 为 passed，保存维护记录与当前规范。
- [x] 提交 main，核实 Pages 发布和匿名页面呈现，交付线上预览。

## Decisions and Review

- Ruling: 选定月份时展示全部时间范围内与该月相交的记录，而不是自动切到“历史赛事” — 过去月份也可能含仍在进行的跨月赛事 — 手动时间范围筛选仍可继续缩小结果。
- Ruling: 清除月份恢复对应页面的默认范围；赛事页为即将举行，规程/收藏为全部记录 — 避免清除过去月份后赛期待定记录或历史收藏仍被隐性排除。
- 独立只读代码审查发现月份复位、跨月进行中、导航/月历复位、年份清除四条状态问题，均修复；浏览器复现后重新核对通过。另修复有收藏但被筛选排除时误显示“尚无收藏”的空状态。
- 25 项测试、类型检查、构建通过；赛事源仍为 73 条，没有改动 reviewedAt 或附件。
