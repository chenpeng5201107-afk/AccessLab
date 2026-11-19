# AccessLab 开发证据索引（Day 8 整理）

> 用途：给参赛帖、答辩与后续复盘提供**可追溯**的证据清单。
> 规则：**只索引真实存在、且能打开核对的文件**；没有的一律标「待补充」，不伪造、不推测。
>
> ✅ **最重要的一条前提已解除（2026-11-19 11:14 首发、11:49 第二次发布）**：公网**已是最新构建**
> （现为 `index-aTyl07hG.js` 372750 B + `index-Co1Kujov.css` 28219 B，匿名 `curl` 与本地 `cmp` 逐字节一致；
> 上一版 `index-mFcMtZD3.js` / `index-CFHpowcy.css` 与更早的 `index-gw0uvRiw.js` 均已 `404`。
> ⚠️ **本索引里的资源哈希都是「时刻性」值**：引用前先核它标的时间，换版后必须重新 `curl` 一次。
> 本索引里 Day 7 / Day 8 的**读数**既来自本地构建、也已对公网重跑复现（见 §5.7 的 `*-live` 四份 JSON）；
> 但 `shots-post/` 的 14 张**截图仍是在本地构建上拍的**，参赛帖配图建议发布后对公网重拍一遍（§7.8）。
>
> **证据口径统一定义**（本索引与参赛帖共用）：
> 凡"键盘 / Tab / 焦点"类证据，均为**自动化脚本向真实浏览器（Edge 157 / Chrome 158）发送 Tab 键事件后读取的
> `activeElement`、焦点顺序与 `getComputedStyle` 结果**。它证明的是真实内核的键盘交互与渲染，不是 jsdom 模拟；
> 但它**不等于**真人手按实体键盘的操作，也**不等于**真机屏幕阅读器实测。
> 本索引里的截图绝大多数由 `capture-shots.mjs` 自动拍摄，**不得描述成人工手工操作截图**。

---

## 0. 图例

| 列 | 含义 |
| --- | --- |
| 已独立核实 | 本轮（或对应日）由脚本 / 命令真实执行并留下原始文件，不是引用文档结论 |
| 可否公开 | 是否适合直接放进参赛帖（路径、内容、隐私三项都过） |
| 需打码 | 发布前必须处理的信息 |

---

## 1. Day 8 本轮新增证据（本地最新构建）

目录：`.day8-evidence/`（**当前未跟踪，未入库**）

| # | 证据 | 位置 | 阶段 | 能证明什么 | 已独立核实 | 可否公开 | 需打码 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1.1 | 评委动线原始读数 | `.day8-evidence/judge-flow.json` | Day 8 收口 | 完整链路真实跑通：报告 `3/3、3/3、3/3、1 项、3 项`；`countsMatch=true`、已确认后不再出现"你还没有点"；Markdown 6197 字符与 textarea 逐字一致；落盘 `.md` 13577 B === textarea 编码字节；切路由仍 `3/3`、刷新回到 `0/3` 且导出按钮 `disabled` | ✅ 本轮脚本执行 | ✅ 可（建议只放关键片段） | 无 |
| 1.2 | 运行日志（含网络 / 控制台 / 计时） | `.day8-evidence/run-judge-flow.log` | Day 8 收口 | `NETWORK 93 requests, non2xx=0 console errors=0 warnings=0`、`PERF resourceCount 4`、`PART2 DONE, elapsed 6287 ms`、浏览器 UA `Edg/157.0.4341.60` | ✅ | ✅ 可 | 无 |
| 1.3 | 五个主操作的焦点落点 | `.day8-evidence/focus-handoff.json` + `run-focus-handoff.log` | Day 8 复核 Day 7 B1 | 生成建议 / 应用 / 撤销 / 修复标签 / 修复焦点指示之后 `activeElement` **均不是 `<body>`**，分别落在建议块、已应用块、撤销提示、标签修复提示、焦点修复提示；下一次 Tab 落在同区下一个控件；非法值 `#12zz` → `aria-invalid=true` + 描述文案 + 修复区暂停 + 生成按钮消失 | ✅ | ✅ 可（是很硬的证据） | 无 |
| 1.4 | 20 组视口 + Tab 地图 + 语义树 | `.day8-evidence/viewport.json` + `run-viewport.log` | Day 8 复核 Day 7 A1/A3/B2/D1 | 首页 320×568 主按钮 `ctaTop=499 / ctaInFold=true`（390=470、768=356、1440=408）；导航 `allNavH=[44,44,44,44,44]`；横向溢出 0（768/1440 的 `-15` 是滚动条）；小于 24px 的可点击目标 0 个；五路由 `h1=1`、标题无跳级、无名控件 0；skip link 首站 `solid 3px 2px` → Enter 后 `activeElement === main#main` | ✅ | ✅ 可 | 无 |
| 1.5 | **参赛帖配图 14 张** | `.day8-evidence/shots-post/01…14-*.png` | Day 8 | 见下方 §1.6 逐张说明；**同一次连续会话**内拍摄，全部为本地最新构建 | ✅ | ✅ 可（选 6–8 张） | 无 |
| 1.6 | 取证脚本 3 份 | `.day8-evidence/run-judge-flow.mjs`、`run-focus-handoff.mjs`、`run-viewport.mjs`、`capture-shots.mjs` | Day 8 | 证明上述结果**可复现**，不是口头声明；由 Day 7 脚本改路径 / 端口派生，未改判定逻辑 | ✅ | ⚠️ 建议只说"脚本可复现"，全文可放仓库 | 无 |

> 说明：本轮 `.day8-evidence/downloads/` 里的落盘样本被后续脚本清空（多个脚本共用该目录并会先 `rm`）。
> **落盘证据仍然成立**：`judge-flow.json` 记录了文件名 `AccessLab-成果报告-20261119094129.md`、`bytes=13577`、`textareaBytes=13577`、`identical=true`；
> 若要一张"看得见摸得着"的落盘样本文件，用 Day 7 的 `.day7-evidence/downloads-chrome/AccessLab-成果报告-20261118232920.md`（同为 13577 B）。

### 1.6 配图逐张说明（发帖时按编号取用）

| 文件 | 画面 | 建议用途 |
| --- | --- | --- |
| `01-home-1440.png` | 首页首屏：品牌主张 + 价值句 + 主按钮 + 右侧实时对比卡 | 帖子封面 / 第 2 部分开头 |
| `02-home-contrastcase-1440.png` | 首页三张实验卡片区 | 「三个实验」一览 |
| `03-home-320-fold.png` | **320px 手机首屏，主按钮在折线内** | Day 7 A1 修复的直接证据 |
| `04-contrast-before-1440.png` | 色彩实验检测结果 `4.48:1 未达 AA` | 问题呈现 |
| `05-contrast-suggestion-1440.png` | 建议块：`#777777 → #767676`、`4.48:1 → 4.54:1` | 算法真实计算 |
| `06-contrast-applied-1440.png` | 应用后预览 + `4.54:1 达到 AA` | 修复前后同页对比 |
| `07-form-before-1440.png` | 表单检测结果：姓名缺少关联、电子邮箱通过 | 检测不是一律报红 |
| `08-form-after-1440.png` | 修复后：`<span>姓名</span>` → `<label for="student-name">`，改动行高亮 +「与当前 DOM 一致」 | **真实 DOM 修复最硬的一张** |
| `09-keyboard-broken-focus-1440.png` | 缺陷态：脚本向真实浏览器发送 Tab 键事件后，焦点停在「查看详情」，**屏幕上没有焦点环**；类名 `broken · broken · broken`、`有：outline: none`、CSS 块原文 | 键盘实验前 |
| `10-keyboard-fixed-focus-1440.png` | 修复后：同一位置**出现 3px 靛蓝焦点环**；`fixed · fixed · fixed`、`没有：规则里带实心轮廓`、CSS `outline: 3px solid #4338ca; offset 3px` | 键盘实验后（与 09 同机位同会话） |
| `11-keyboard-confirmed-1440.png` | 点「我已完成观察」后的确认态（**由自动化脚本点击**，不是真人操作截图） | 确认态的界面表现 |
| `12-report-1440.png` | 报告首屏：声明 + `3/3、3/3、3/3、1 项、3 项` | 统一成果报告 |
| `13-report-manual-groups-1440.png` | 人工验证三组标题与条目 | Day 7 A2 三态 |
| `14-report-disclaimer-1440.png` | 「本报告仅针对 AccessLab 内置示例，不是网站 WCAG 合规认证。」 | 诚实边界 |

> **09 / 10 这一对是全套里最有说服力的一组**：同一会话、同一机位、同一帧尺寸，
> 差异只由页面自身的一条 CSS 规则产生。发帖时请**并排**放，并在图注里写明"同一次运行、未拼贴"。

---

## 2. Day 7 证据（本地最新构建；**当时**未提交 / 未发布）

目录：`.day7-evidence/`（**未跟踪**，21 项 + `shots/` 12 张 + 1 份落盘样本）

| # | 证据 | 位置 | 能证明什么 | 已独立核实 | 可否公开 | 需打码 |
| --- | --- | --- | --- | --- | --- | --- |
| 2.1 | `part1.json` + `verify.mjs` | `.day7-evidence/` | 20 组视口（5 路由 × 4 宽）、Tab 逐站 `outline` / `:focus-visible`、语义与可访问性树 | ✅ Day 7 执行；Day 8 已在新构建上复现 | ✅ | 无 |
| 2.2 | `part2.json` + `verify2.mjs` | 同上 | 完整评委动线、机械耗时 **5023 ms**、报告三态、复制 / 下载、会话性、Enter·Space 激活 | ✅ | ✅ | 无 |
| 2.3 | `part3.json` / `part4.json` | 同上 | 三实验逐项回归 + 报告清空；五个主操作的焦点落点（**B1 缺陷就是在这里被抓到的**） | ✅ | ✅ | 无 |
| 2.4 | `part5-edge.json` / `part5-chrome.json` | 同上 | **Edge 157 与 Chrome 158 各跑一遍**，读数逐项一致；`writeText` 载荷 6197 字符 === 页面 Markdown；落盘 13577 B | ✅ | ✅ | 无 |
| 2.5 | `part6-perf.json` / `dist-size.mjs` | 同上 | 产物 4 文件、JS 372750 B（gzip 110277 B）、CSS 29485 B（gzip 6256 B）**——体积是当时值，11:49 起 CSS 为 28219 B / gzip 6078 B，见 §5.9**；应用请求 4 个全 2xx、hash 切换 0 请求、`longtask=0` | ✅ | ⚠️ 只放结论数字，**不要放 loopback 毫秒** | 无 |
| 2.6 | `check-online.mjs` | 同上 | 线上只读核对：`lifecycle active` / `access_mode public`、**当时**线上仍是 `index-gw0uvRiw.js` + `index-DgYwPq9n.css` | ✅ Day 7；Day 8 与 11-19 收口轮各复核一次结论未变 ⇒ **11-19 11:14 发布后本条已过期**，最新公网状态见 §5.6 | ✅ | 无 |
| 2.7 | `shots/` 12 张 | `.day7-evidence/shots/` | 首页 320 折线内、键盘前后、报告、撤销、过期建议等 | ✅ | ✅ | 无 |
| 2.8 | `downloads-chrome/AccessLab-成果报告-20261118232920.md` | 同上 | **真实落盘的报告样本 13577 B**，可直接打开核对 | ✅ | ⚠️ 可，但内容含生成时间戳 | 无 |
| 2.9 | `diag-keyboard.mjs` / `probe-experience.mjs` / `probe-local.json` | 同上 | 一次性排查探针（B1 定位过程） | ✅ | ❌ 不建议公开，价值在结论不在原始输出 | 无 |

---

## 3. Day 6 证据（**已入库**，随 `82ecef4`）

目录：`.day6-evidence/`（43 个文件，已在 Git 历史里，可追溯到具体 commit）

| # | 证据 | 位置 | 能证明什么 | 已独立核实 | 可否公开 | 需打码 |
| --- | --- | --- | --- | --- | --- | --- |
| 3.1 | `report-live.json` / `report-live.md` / `run-live.log` | `.day6-evidence/` | **公网域名**上跑完整链路的原始记录：`Edg/157.0.4341.60`、15 步 / 机械耗时 7.1 秒、五条 hash 深链各自渲染正确 `h1` | ✅ | ✅ | 无 |
| 3.2 | `shots-live/` 12 张 | `.day6-evidence/shots-live/` | **公网页面**的真实截图（`c1-home-1440` … `c6-report-1440`、`d1..d5` 窄屏、`b1-keyboard-broken-focus-1440`） | ✅ | ✅ 可 | 无 |
| 3.3 | `shots/` 12 张 | `.day6-evidence/shots/` | 同日本地构建截图 | ✅ | ✅ 可 | 无 |
| 3.4 | `downloads/AccessLab-成果报告-20261118211631.md`、`downloads-live/AccessLab-成果报告-20261118212713.md` | `.day6-evidence/` | 本地与**公网**各一份真实落盘样本（均 12047 B） | ✅ | ⚠️ 可，含时间戳 | 无 |
| 3.5 | `collect.mjs` / `probe-*.mjs` / `run4-9.log` | `.day6-evidence/` | 取证脚本与多轮运行日志，证明结果可复现 | ✅ | ⚠️ 只说"可复现" | 无 |

> Day 6 的 `shots-live/` 曾是**唯一一批"公网真实页面"截图**，但拍的是 Day 6 版本。
> **11-19 11:14 已发布最新构建**，公网读数已由 `*-live` / `public-*` 四份 JSON 复现（见 §5.6 / §5.7）；
> **`shots-post/` 与 `shots-live/` 两批图都仍需按最新公网页面重拍一次**才能作为参赛帖配图（§7.8）。

---

## 4. 版本控制与构建证据

| # | 证据 | 位置 / 命令 | 能证明什么 | 已独立核实 | 可否公开 |
| --- | --- | --- | --- | --- | --- |
| 4.1 | Git 历史 | `git log`：`82ecef4` → `691a160` → `474a30b` → `11a43bd` → `7067ec4` → `737ceb7` → `943a3ac` | Day 1–6 的分段交付记录，历史未被改写；`691a160` 含 Day 4+5 功能，`82ecef4` 含 Day 6 功能与 `.day6-evidence/` | ✅ Day 8 重新读取 | ✅ 可（仓库地址见 `final-checklist.md`） |
| 4.2 | Day 7 / Day 8 改动**尚未提交** | `git status --short`：7 个源码文件 + `src/App.day7.test.tsx` + 3 份治理文档 + Sites 描述符 + `.day7-evidence/` | 本轮工作区真实状态 | ✅ Day 8 执行 | ⚠️ 提交后才有 commit 可引用 |
| 4.3 | 测试执行 | `npm test` → **18 文件 / 295 条全部通过**（Day 8 于 09:38 重新执行） | 质量门槛真实达标；旧测试零删改 | ✅ | ✅ 可（截图建议放终端输出） |
| 4.4 | 类型检查 | `npx tsc --noEmit` → 无输出、退出码 0 | 无类型错误 | ✅ | ✅ 可 |
| 4.5 | 生产构建 | `npm run build` → `index-mFcMtZD3.js` 372750 B / `index-CFHpowcy.css` 29485 B（Day 8 删除 `dist/` 后重建，当时**哈希与 Day 7 记录一致**） | 构建可复现、产物与源码一致 | ✅ | ⚠️ 这条「可复现」11:35 被发现已被取证文件污染（同一仓库重建成另一对哈希），11:49 修复后重新成立 ⇒ 以 §5.9 为准 |
| 4.6 | 五路由在产物中 | 在 `index-mFcMtZD3.js` 中检索 `#/`、`#/contrast`、`#/form-label`、`#/keyboard`、`#/report` 均命中 | 五个路由都进了最新构建 | ✅ | ✅ 可（11:49 的 `index-aTyl07hG.js` 与它**逐字节相同** ⇒ 结论对新产物同样成立） |

---

## 5. 部署证据（Qoder Sites）

| # | 证据 | 位置 / 来源 | 能证明什么 | 已独立核实 | 可否公开 |
| --- | --- | --- | --- | --- | --- |
| 5.1 | 站点状态 | `get_site`（`siteId 01a1e498-acba-79ec-8703-a119defbf0f6`） | `lifecycle: active`、`governance_status: normal`、`access_mode: public`、`auth_integration_status: not_required`、`hasPublishedContent: true`、`backend.status: disabled`（**无后端**） | ✅ Day 8 只读调用 | ✅ 可 |
| 5.2 | 项目与站点唯一性 | 同上：`projectId 01a1e498-acb7-796a-a96d-1c22a6cee214`、`host accessibility-lab-3g6uvbn5duq.qoder.zone` | 全程**同一个项目、同一个站点**，没有为参赛另建域名 | ✅ | ✅ 可 |
| 5.3 | 线上构建（**发布前快照，已作废**） | 匿名 `curl` 首页 + 资源探测 | 11-19 11:07 之前线上引用 `index-gw0uvRiw.js` + `index-DgYwPq9n.css`，Day 7 资源 `404` ⇒ 当时**未上线** | ✅ Day 8 / 收口轮各执行一次 | ⚠️ 仅作"我们如何发现线上落后"的过程证据，**不代表当前状态**（当前状态见 5.6） |
| 5.4 | 官方站点封面图 | `get_site` 返回的 `covers/01a1eed5-….png`（**带签名的临时 URL，约 1 小时过期**） | 平台侧生成的站点封面 | ✅ 本轮取得 URL | ⚠️ **必须先下载存档**，链接会失效；且它反映的是 Day 6 版本 |
| 5.5 | 历史发布记录 | `DEVLOG.md` Day 1 收尾 / Day 2 / Day 3 / Day 4+5 / Day 6 各节的 action 与 `published: true` 记录；`.day6-evidence/report-live.*` 为公网实测 | 每一版都走过 prepare → publish → 公网核对 | ✅ 文档 + 公网取证 | ✅ 可 |
| 5.6 | **最新构建已在公网**（11-19 11:14 首发，**11:49 被 §5.9 取代**） | 匿名 `curl` 首页 + `cmp` + `sha256sum`：线上引用 `index-mFcMtZD3.js`（372750 B）+ `index-CFHpowcy.css`（29485 B），与本地 `dist/assets/` **逐字节一致**；旧 `index-gw0uvRiw.js` 已 `404`。action `a8ffa344-a7c6-4982-a5d8-5d54524d4d68`、`published: true`、`committed: true` | 评委此刻打开网址看到的**就是** Day 7 修复后的那一版 | ✅ 本轮发布后实测 | ✅ 可 |
| 5.7 | **公网功能回归**（`LIVE_URL=` 指向线上域名） | `.day8-evidence/judge-flow-live.json` + `run-judge-flow-live.log`、`viewport-live.json` + `run-viewport-live.log`、`public-labels-focus.json`（新写的公网探针 `probe-public-labels-focus.mjs`） | 对公网重跑：三实验读数 `4.48 未达 AA → 4.54 达到 AA`、表单 `labels 0 → 1`、焦点 `none → solid 3px rgb(67,56,202) / offset 3px`、报告 `3/3、3/3、3/3、1 项、3 项` `countsMatch=true`、复制 6197 字符 === 页面、75 请求 non-2xx `0`、控制台 `0 error / 0 warning`、20 组视口 `small=0` / `navMin=44` | ✅ 本轮真实执行 | ⚠️ 只放结论数字；JSON 里有本机路径与 UA，公开前先看一遍 |

| 5.8 | **公网五条深链冷启动** | `probe-public-deeplinks.mjs` → `public-deeplinks.json` | 五个 hash 路由各用**全新 target** 直接加载 `<站点>/index.html#/xxx`：`location.hash` 与页面 `h1` 一一对应（首页 `让网页的障碍，看得见、改得掉。`）、`main` 各 1、skip link `href="#main"`（文案「跳转到主要内容」）在每一页都存在、`window.onerror` 捕获 **0 条** ⇒ 深链不依赖先访问首页 | ✅ 11-19 11:30 真实执行 | ✅ 可 |
| 5.9 | **构建隔离修复 + 第二次发布**（11:42–11:49） | ①逐字节比对：`.day8-evidence/rebuild-check/{live.js,live.css,new.js,new.css}`（线上两份下载件 vs 本地两份新产物）+ `removed-selectors.txt` / `removed-rules.txt`；②修复：`src/index.css` +7/−0 两条 `@source not`；③发布记录：DEVLOG Day 8「11:49」节（action `d0a23be7-…`、publishOperation `01a1f1ec-…`、`published: true` / `committed: true`） | 「仓库重建 = 线上产物」这条**曾经失效又被修好**的完整证据链：JS 逐字节相同、CSS 只差 1266 B 死代码（16 条选择器 + 13 个 `@property --tw-*`），线上现引用 `index-aTyl07hG.js` + `index-Co1Kujov.css`，上一版两个资源 `404` | ✅ 本轮真实执行 | ⚠️ 比对目录里是**公网下载的产物副本**，公开发帖只放结论数字，别把整个目录当作品素材 |
| 5.10 | **第二次发布后的公网复测**（11:50–11:51） | `.day8-evidence/{viewport-v2,judge-flow-v2,v2-public-labels-focus,v2-public-deeplinks}.json` + `shots-v2/`(3 张) + `downloads-v2/`(1 份 13577 B .md) + 日志 `rebuild-check/run-*-v2.log` | 与 11:14 基线逐项对比：`viewport-live.json` vs `viewport-v2.json` **递归 0 处差异**（两份日志 `cmp` 完全相同）；`judge-flow-live.json` vs `judge-flow-v2.json` 仅耗时与下载文件名时间戳 2 处；PERF 行直接记录新资源名 ⇒ 浏览器用的是新构建 | ✅ 本轮真实执行 | ⚠️ 同 §5.7：JSON 含本机路径与 UA |
| 5.11 | **公网导出的报告样本（部分进度）** | `.day8-evidence/downloads-os/AccessLab-成果报告-20261119111856.md`（13523 B / 6179 字符）+ 同目录 `README.md` | 11:18 那轮核验没设下载目录，Edge 按系统默认目录落盘 ⇒ 这份是唯一留存的 11:14 版公网导出样本；台账 `2 / 3`（只跑了色彩 + 表单），与完整样本逐行比只有 9 行不同（时间戳 + 计数 / 状态行），产品文案逐字一致。**顺带证明台账不会假装三个都做完** | ✅ 12:06 从系统「下载」复制回仓库（`cmp` 一致） | ⚠️ 发帖 / 答辩要用的完整样本请用 `downloads-v2/…115045.md`，别拿这份部分进度的当成果 |

> **公网取证的一条重要发现（必须写清，否则会被当成产品缺陷）**：
> 托管层会往 HTML 注入平台脚本与「Qoder Sites」水印，导致 ①匿名首页 57720 B ≠ 本地 678 B（**逐字节比对只适用 JS/CSS 两个资源**）；
> ②公网 Tab 序列比本地多出水印的可聚焦停靠点（**"公网 Tab 序列 = 本地"不成立**，产品自身的导航顺序仍一致）；
> ③水印层会拦截按坐标的鼠标点击（首轮公网探针因此出现 `labels:0` 的**假阴性**，改用真实键盘 Enter 激活后复现正常）。

---

## 6. 可以放进参赛帖的"过程证据"优先级

按可信度与观感排序，建议取前 6–8 张：

1. `09` + `10` 键盘焦点前后（同机位、同会话）——**最强**
2. `08` 表单修复前后 HTML 对比（真实 DOM）
3. `06` 色彩应用后 `4.54:1 达到 AA`（配 `04` 的 `4.48:1 未达 AA`）
4. `12` 报告首屏（四项计数 + 那句不做认证的声明）
5. `03` 320px 手机首屏（主按钮在折线内）
6. `01` 首页 1440（封面）
7. 终端截图：`npm test` 的 `18 passed / 295 passed`
8. 终端截图：`npm run build` 产物行 + 匿名 `curl` 线上资源名

---

## 7. 待补充证据（现在**没有**，不得声称）

| # | 缺什么 | 状态 | 补齐方式 |
| --- | --- | --- | --- |
| 7.1 | **Qoder 对话 / 任务截图** | ⛔ 待补充 | Git 提交、`DEVLOG.md` 与取证脚本能证明开发过程，但**不能冒充 Qoder 界面截图**。若赛事要求"多用截图凭证"，需从 Qoder 会话记录中另行导出（导出前人工过一遍，避免泄露本地绝对路径与账号信息） |
| 7.2 | **真机屏幕阅读器实测**（NVDA / VoiceOver / TalkBack） | ⛔ 未做 | 人工用读屏走一遍报告页三组人工验证、五个动作后的焦点交接、色彩页"生成建议"是否有播报；录屏或截图留证 |
| 7.3 | **OS 剪贴板人工粘贴核对** | ⛔ 未做 | 真机各点一次复制（鼠标 + 键盘）后粘贴到记事本核对内容；无头环境回读 6425 字符 ≠ 报告内容，属已知限制 |
| 7.4 | **Firefox / Safari / WebKit 实测** | ⛔ 未做 | 本机只有 Edge 157 / Chrome 158；在装有 Firefox 的机器上 `BROWSER_BIN=<路径> node .day8-evidence/run-focus-handoff.mjs` 重跑 |
| 7.5 | **无痕窗口人工目视** | ⛔ 未做 | 匿名 `curl` 与 headless 不等于评委设备上的无痕浏览器目视 |
| 7.6 | **真实手机网络下的公网访问速度** | ⛔ 未做 | 只有本机 loopback 计时，不代表公网；不要引用毫秒数 |
| 7.7 | **演示视频** | ⛔ 未录制 | 见 `demo-script.md` 与 `demo-checklist.md`；录完回填路径与时长 |
| 7.8 | **Day 7/8 版本的公网取证** | ⚠️ **读数已完成两轮（11:14 与 11:49 版）/ 截图仍待补** | 11-19 11:14 发布后已用 `LIVE_URL=` 对公网重跑 `run-judge-flow` / `run-viewport` 与新探针（见 §5.7，产物 `*-live.json`）；**发帖配图仍需**`LIVE_URL=https://accessibility-lab-3g6uvbn5duq.qoder.zone node .day8-evidence/capture-shots.mjs` 重拍一遍 |
| 7.9 | **真实用户测试 / 第三方无障碍审计** | ⛔ 没有 | 不计划做，也不在任何材料里声称 |
| 7.10 | **发布后的最新站点封面** | ⛔ 待补（发布已完成，随时可取） | 重新 `get_site` 取封面并**立即下载存档**（临时签名 URL 约 1 小时过期）；旧封面反映的是 Day 6 版本，不要再用 |

---

## 8. 公开前的隐私检查

已逐目录确认：`.day6-evidence/`、`.day7-evidence/`、`.day8-evidence/` 的 JSON / 日志 / 截图中

- **不含**密钥、Token、Cookie、Authorization 头；
- **不含**真实姓名、手机号、邮箱等个人输入（示例表单允许留空，且演示数据不写入任何存储）；
- **不含** Qoder 账号 ID 或天池账号信息；
- `projectId` / `siteId` / `deploymentId` / `actionId` 属于站点标识，公开无害，但**没必要放进参赛帖正文**；
- 需要留意的只有两处：
  1. 截图与日志里可能出现 `C:/Users/zxcvb/...` 形式的**本地绝对路径与用户名** → 发帖时不要贴原始终端全文，只贴结论行；
  2. 报告导出样本 `.md` 含**生成时间戳** → 无风险，但别让人误以为是"某位用户的记录"。
- `get_site` 返回的封面图 URL 含 **STS 临时签名参数** → **不要把这条 URL 直接贴进帖子**，先下载成 PNG 再上传本地文件。

---

## 9. 复现方式（供评委或后续自查）

```bash
# 环境（本机 node 不在 PATH）
export PATH="/d/Soft_Ware:$PATH"

# 质量门槛
npx tsc --noEmit
npm test
npm run build

# Day 8 取证（本地构建，会自动起一个只读静态服务）
node .day8-evidence/run-judge-flow.mjs      # → judge-flow.json + run-judge-flow.log
node .day8-evidence/run-focus-handoff.mjs   # → focus-handoff.json
node .day8-evidence/run-viewport.mjs        # → viewport.json
node .day8-evidence/capture-shots.mjs       # → shots-post/*.png + post-readings.json

# 对公网重跑（发布之后才应该做）
LIVE_URL=https://accessibility-lab-3g6uvbn5duq.qoder.zone node .day8-evidence/run-judge-flow.mjs
LIVE_URL=https://accessibility-lab-3g6uvbn5duq.qoder.zone node .day8-evidence/capture-shots.mjs
```
