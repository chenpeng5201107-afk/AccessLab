# AccessLab 参赛资格与提交前最终检查表

> 本清单的部署记录对应 11 月 19 日版本。按参赛者提供的提交清单，当前作品帖标题须注明所属赛道。新版 Hack4Good 草稿、公开地址占位及开发来源见[当前作品帖](hack4good-entry.md)。

> 状态口径只有三种：**已完成**（有可核对的证据）、**待你授权**（我不会自行执行）、**待你本人操作**（身份 / 认证类，我无法代做）。
> 任何一项没有真实完成，就不许勾。
>
> **本轮（11-19 收口 + 发布）复核时间戳**：`npx tsc --noEmit` / `npm test` / `npm run build` 于 **2026-11-19 10:36–10:38** 重新执行，
> 文档与材料改完后又于 **11:06** 复跑一遍（结果同为绿灯、产物哈希不变，见 F12）；
> 公网资源版本于 **2026-11-19 10:35** 匿名 `curl` 复核（当时仍是旧构建，见 A1）；
> **11:14 经用户「site 更新一下」授权完成公开发布**，随后对公网重跑取证（A1/A2/A3/A6 与 F13，`.day8-evidence/*-live.json`）；
> **11:35 核对产物时发现「仓库重建 = 线上产物」已被取证文件破坏**，经用户选择「保留修复并重新发布」，
> 11:42–11:45 以 `src/index.css` +7 行构建隔离修好并复跑闸门与本地回归，**11:49 第二次发布**，11:50–11:51 对公网再跑四条复测（F14/F15，`.day8-evidence/*-v2.json`）。
> **Git 按用户「git 我提交」由用户本人执行，我未跑任何 `add` / `commit` / `push`。**

---

## A. 阻断项：不做就不能提交

| # | 事项 | 当前真实状态 | 归属 |
| --- | --- | --- | --- |
| A1 | **公网发布 Day 7/8 版本** | ✅ **已完成**（11-19 11:14 经你「site 更新一下」授权执行）。同一 `projectId 01a1e498-acb7-…` / `siteId`、新 action `a8ffa344-a7c6-…`，**未建新站、未改访问范围**；`published: true`、`operation.state: succeeded`、`committed: true` | 已执行 |
| A2 | 发布后核对线上引用已变成最新哈希 | ✅ **已完成（两轮）**：11:14 那轮核对为 `index-mFcMtZD3.js` + `index-CFHpowcy.css`；**11:49 第二次发布后现引用 `index-aTyl07hG.js`(372750 B) + `index-Co1Kujov.css`(28219 B)**，两资源与本地 `dist/assets/` **`cmp` 逐字节一致**（`Content-Length: 28219`、`last-modified: 11:49:28`、`no-cache`）；上一版 `index-mFcMtZD3.js` / `index-CFHpowcy.css` 与更早的 `index-gw0uvRiw.js` 均 **404** | 已核 |
| A3 | 发布后**对公网重跑一遍取证**（`LIVE_URL=…`），确认评委打开网址看到的就是图文里那一版 | ✅ **已完成**：`.day8-evidence/judge-flow-live.json`、`viewport-live.json`、`public-labels-focus.json` 三份公网产物 + HTTP 层深链 `200` 核对（`/#/report`、`/?day7=deep#/keyboard`）。三实验读数、报告三态、焦点交接、20 组视口全部与本地一致（详见 §F13 与 `PROJECT_STATUS.md` §2.14）。⚠️ **一条口径更正**：托管层注入的水印给公网页面增加了可聚焦停靠点，所以**"公网 Tab 序列 = 本地"不成立**；产品自身的导航顺序一致 | 已核 |
| A4 | Day 7 + Day 8 + 两次发布轮改动入库（否则参赛帖引用的测试 / 截图无法追溯到 commit） | ⚠️ **未入库，且由你本人执行**。`git diff --numstat`：**12 个已跟踪文件被改**（8 个产品源码文件 **+214/−45**（含 `src/index.css` +7/−0 构建隔离）与 3 份治理文档 **+1002/−51** + Sites 描述符 **+12/−12**）；未跟踪 **112** 个文件（`src/App.day7.test.tsx` + `.day7-evidence/` **31**/1.5 MB + `.day8-evidence/` **71**/4.8 MB + `submission/` **7**），`HEAD` 仍 `82ecef4`；分组方案见 I-1 | **待你本人操作**（11-19 期间 `main` 上短暂出现过一次提交又被退回） |
| A5 | 作品链接可匿名访问、无需登录、无需 API Key | ✅ **已完成**（发布前后两次 `get_site` 均为 `lifecycle: active`、`access_mode: public`、`auth_integration_status: not_required`、`backend.status: disabled`；发布后新增 `hasPublishedContent: true`；匿名 GET 首页 200） | 已核 |
| A6 | 五个路由在公网均可深链访问 | ✅ **已完成**：本轮新增 `probe-public-deeplinks.mjs`，`#/`、`#/contrast`、`#/form-label`、`#/keyboard`、`#/report` **各自全新标签页冷启动**，`location.hash` 与页面 `h1` 对应、`main` 各 1 个、skip link `href="#main"` 存在、`window.onerror` 捕获 **0 条**（`.day8-evidence/public-deeplinks.json`） | 已核 |
| A7 | 参赛帖正文五部分齐全 | ✅ **精简版 `forum-post-final.md` 已生成**（正式提交优先用）；详细版 `forum-post.md` 保留。两份都含官方要求的五部分 | 已核 |
| A8 | 帖子标题注明赛道 | 已按参赛者提供的提交清单使用 `【Hack4Good】` 前缀 | 已核 |
| A9 | 参赛材料的**事实口径准确性** | ✅ 本轮已修正三处：①开发周期改为「2026-11-16 → 11-19，4 个自然日、8 个开发阶段」（原写"共 8 天"不成立）；②「真实物理 Tab」全量改为「自动化脚本向真实浏览器发送 Tab 键事件」；③未经确认的第一人称经历改写为客观表述或加「请本人确认」标记 | 已核 |
| A10 | **不得出现越界合规宣称** | ✅ 复查通过：全文无"100% 合规""已通过 WCAG 认证""读屏实测""跨浏览器已验证"；44px 已按 SC 2.5.5(AAA) / SC 2.5.8(24px) 口径区分 | 已核 |

---

## B. 参赛资格（全部属于你本人操作，我无法代做）

| # | 事项 | 状态 | 说明 |
| --- | --- | --- | --- |
| B1 | 在天池大赛官网完成**报名与组队** | ⬜ **待你本人操作** | 官方：报名与组队 10 月 29 日 — **11 月 30 日 18:00 截止** |
| B2 | 选择 **Hack4Good 技术向善**赛道 | ⬜ 待你本人操作 | 官方赛道定义：体现社会责任场景的各种应用（无障碍、教育与乡村、环保、医疗健康、老年人数字鸿沟、防灾应急）——本项目属"无障碍" |
| B3 | 完成**天池平台实名认证** | ⬜ 待你本人操作 | 官方要求：**初赛截止前**完成，否则取消获奖资格 |
| B4 | 完成**阿里云大学生认证** | ⬜ 待你本人操作 | 同上；学生认证后可在 `university.aliyun.com/action/qoder` 领取 Qoder CN 一个月权益 |
| B5 | 确认参赛身份为**在校大学生**（本科 / 硕博，含港澳台，不限专业） | ⬜ 待你本人确认 | 资格前提 |
| B6 | 团队规模符合 **1–3 人** | ✅ 本项目为**单人参赛**（1 人） | 材料已按单人撰写 |
| B7 | 在天池**赛题页论坛**完成作品帖发布（不是别的平台） | ⬜ **待你授权 / 待你操作** | 官方：发布作品 10 月 29 日 — 11 月 30 日 18:00 截止 |
| B8 | 作品为**原创**，未抄袭或搬运 | ⬜ 待你本人确认 | 官方硬性要求 |
| B9 | 开发与部署均由 **Qoder** 完成，并在帖中说明使用过程 | ✅ 已满足；第五部分已按实际过程撰写 | 已核 |
| B10 | 作品在活动规定时间内创作并发布 | ✅ 开发时间 2026-11-16 → 11-19（4 个自然日、8 个开发阶段），在活动期内 | 已核 |
| B11 | 内容符合活动主题、社区内容规范与法律法规 | ⬜ 待你本人确认 | 本项目不含用户生成内容、不采集数据 |
| B12 | （可选）小红书 / 抖音 / 视频号分享链接 | ⬜ 可选 | 官方要求分享标题需带「2026 Qoder 高校创造力大赛」 |

---

## C. 作品介绍五部分（官方要求的结构）

| 官方要求 | 精简版 `forum-post-final.md` | 详细版 `forum-post.md` | 状态 |
| --- | --- | --- | --- |
| **自我介绍** | 第一部分 | 第一部分 | ✅ 已写；身份信息留占位符，动机段落已加「请本人确认」标记 |
| **你的作品是什么**（一句话说清谁在什么场景下用） | 第二部分，开头即一句话定义 + 四模块表 | 第二部分 | ✅ 已写 |
| **为什么做**（问题或想法的来源） | 第三部分（四点 + 边界） | 第三部分 | ✅ 已写；**未引用任何编造的调研数据** |
| **怎么用**（5 步以内，评委照着能自己打开用起来） | 第四部分，正好 5 步 | 第四部分 | ✅ 已写 |
| **用 Qoder 做出来的过程**（哪几步交给它、你改了什么，尽量多截图凭证） | 第五部分（7 项分工表 + 我把关的三处） | 第五部分（10 小节） | ⚠️ 正文已写；**Qoder 会话截图尚无文件**，标记为「待补充」，未用浏览器截图冒充 |
| 作品链接（Qoder Sites 公开访问，评委点开就能用） | 帖首 + 帖尾 | 帖首 + 帖尾 | ✅ **内容与图文已一致**：线上即最新构建（A1/A2），公网逐项回归通过（A3/A6） |
| 篇幅 | **正文 2834 汉字 / 含附录 3200 / 整份 3538（181 行）**（建议 1800–2500，因保留证据与边界说明超出约 330 字） | 6338 汉字 / 361 行 | 论坛首发用精简版；两份都是 `node` 逐字符实测，不是估算 |

---

## D. 提交前必须填写的占位符（集中清单）

两份帖子与相关材料中出现的全部 `【请填写…】` 与「请本人确认」标记，逐项替换后本表才算清空：

| # | 占位符 / 待确认项 | 出现位置 | 用途 |
| --- | --- | --- | --- |
| D1 | `【请填写真实姓名 / 昵称】` | `final-checklist.md`、发帖时的论坛署名 | 论坛账号署名 |
| D2 | `【请填写学校、专业、年级】` | `forum-post-final.md`、`forum-post.md` 第一部分 | 自我介绍；官方要求说明参赛身份 |
| D3 | `【请填写真实 Qoder 账号】` | 两份帖子 **帖首 + 帖尾各一处** | **官方要求的必填项** |
| D4 | `【请填写天池用户名】` | 两份帖子第一部分 | 与报名账号对应 |
| D5 | **作品动机段落「请本人按真实经历确认或改写」** | 两份帖子第一、三部分 | 原稿含未经确认的第一人称经历，已改写为客观表述；**只有本人能确认哪句是真的** |
| D6 | 团队信息（若最终不是单人） | `README.md`、两份帖子 | 若 2–3 人组队，需改写"单人参赛"表述并补充成员 |
| D7 | 各 `【插图：…】` 位置对应的图片 | 两份帖子第二、四、五部分 | 精简版引用 8 张真实存在的 PNG（`.day8-evidence/shots-post/`），**发布后需换成公网截图**（V4 给出命令，公网数值已核验一致） |
| D8 | **Qoder 会话 / 任务截图**（标「待补充」） | 两份帖子第五部分 | 目前**没有该文件**；不得用浏览器截图代替，需从 Qoder 会话记录导出 |
| D9 | **终端结论行截图**（标「待补充」） | 两份帖子第五部分 | `npm test` / `npm run build` 结论行，只截结论不截全日志 |
| D10 | GitHub 仓库地址（若愿意公开） | 帖尾可选 | 远程为 `github.com/chenpeng5201107-afk/AccessLab`，**是否公开由你决定** |

> ⚠️ **禁止**：编造学校 / 姓名 / 学号 / 个人经历 / Qoder 账号 / 测试成绩 / 部署记录。
> 材料里凡是我没有证据的地方都写成了占位符或"待补充"，请**如实填写**，不要为了好看补内容。

---

## E. 人工验证事项（未做就不得声称做过）

| # | 事项 | 状态 | 影响 |
| --- | --- | --- | --- |
| E1 | 真机 **NVDA / VoiceOver / TalkBack** 走一遍 | ⛔ **未做** | 帖子与页面都只说"静态语义与可访问性树已核对"，**不声称读屏通过** |
| E2 | 报告页三组人工验证的**朗读顺序** | ⛔ 未做 | 同上 |
| E3 | 五个主操作后**焦点交接**在读屏下是否被感知 | ⛔ 未做（DOM 层已实测焦点不再回到 `<body>`） | 同上 |
| E4 | 色彩页「生成修复建议」**是否有播报** | ⛔ 未做（实测该步不写入任何 live region） | 已知取舍，见 `PROJECT_STATUS.md` 遗留 #13 |
| E5 | **OS 剪贴板人工粘贴**核对（鼠标 + 键盘各一次） | ⛔ 未做。**公网重测同样**：`writeText` 收到的载荷 6197 字符 === 页面 Markdown，但无头环境 `readText()` 回读 6425 字符 ≠ 报告内容（已证明的是**写入载荷**，不是系统剪贴板内容） | 帖子表述为"写入内容与页面逐字同源，粘贴结果待人工核对" |
| E6 | **无痕浏览器**目视（评委设备） | ⛔ 未做 | 匿名 `curl` / headless 不等于人工目视 |
| E7 | **Firefox / Safari / WebKit** 实测 | ⛔ 未做（本机只有 Edge 157 / Chrome 158） | 不声称"跨浏览器已验证" |
| E8 | **真机移动浏览器**访问 | ⛔ 未做 | 320 / 390 视口是 CDP 仿真，不是真机 |
| E9 | 系统级 **`prefers-reduced-motion`** 开关下的观感 | ⛔ 未做（只用 CDP 媒体仿真验证过） | — |
| E10 | **真实手机网络**下的公网加载速度 | ⛔ 未做 | 不引用任何毫秒数或 Lighthouse 分数 |
| E11 | 演示视频录制 | ⛔ 未做 | 见 `demo-script.md` / `demo-checklist.md` |

> 以上 11 项**全部保持"未验证"标注**。这是本作品的诚实性要求，不是缺陷清单——
> 一个教别人别夸大无障碍结论的产品，自己最不能先夸大。
>
> **术语口径（本轮统一）**：已归档的键盘 / 焦点证据 = **自动化脚本向真实浏览器（Edge 157 / Chrome 158）发送 Tab 键事件后读取的
> `activeElement`、焦点顺序与 `getComputedStyle` 结果**。它能证明真实内核的键盘交互与渲染，
> 但**不是**真人手按实体键盘的操作，也**不是**读屏实测；`shots-post/` 的截图由脚本自动拍摄，**不得写成人工手工操作截图**。
> 原稿中"真实物理 Tab"的说法已在两份帖子、`evidence-index.md`、`PROJECT_STATUS.md`、`DEVLOG.md` 中一并更正。

---

## F. 质量门槛（本轮已重新执行，非引用旧记录）

| # | 项 | 结果 | 时间 |
| --- | --- | --- | --- |
| F1 | `npx tsc --noEmit` | ✅ 无输出，退出码 0 | **2026-11-19 10:36（本轮重跑）** |
| F2 | `npm test` | ✅ **18 文件 / 295 条全部通过**，0 失败 0 跳过（旧测试零删改），14.53s | **2026-11-19 10:36（本轮重跑）** |
| F3 | `npm run build` | ✅ 通过，2105 modules，481ms；产物 `index-mFcMtZD3.js` **372750 B** / `index-CFHpowcy.css` **29485 B** / `index.html` 678 B / `favicon.svg` 232 B | **2026-11-19 10:37（本轮重跑）** |
| F4 | 构建**可复现** | ✅ 本轮重建后哈希与 Day 7 / Day 8 记录逐字符一致（**含 11:06 的文档改后复跑，已连续四轮一致**） | 本轮 |
| F5 | 五路由进入最新产物 | ✅ `#/`、`#/contrast`、`#/form-label`、`#/keyboard`、`#/report` 在 JS 中均命中 | — |
| F6 | 无异常新增依赖 | ✅ 运行时依赖仍为 3 个（react / react-dom / lucide-react），`package.json` 未变 | — |
| F7 | Day 7 四项修复仍在 | ✅ A1 首页 320 主按钮 `ctaTop=499 / inFold=true`；A2 报告三态 `1 项 / 1 项 / 3 项` 且 `countsMatch=true`；A3 导航 `[44,44,44,44,44]`；B1 五个动作焦点均不落回 `<body>` | 2026-11-19 09:40–09:42（Day 8 取证，本轮源码一字未改） |
| F8 | 完整评委动线回归 | ✅ 三实验 + 报告读数 `3/3、3/3、3/3、1 项、3 项`；复制 6197 字符 === 页面；落盘 13577 B === textarea；切路由 `3/3`、刷新 `0/3` 且导出禁用；控制台 0 error / 0 warning | 同上 |
| F9 | 响应式 20 组 | ✅ 5 路由 × 320/390/768/1440：横向溢出 0（768/1440 的 `-15` 为滚动条）、无小于 24px 的可点击目标 | 同上 |
| F10 | 本轮源码改动 | ✅ **零改动**：本轮只动文档与参赛材料，`src/` 与 `package.json` 未被触碰（`git status` 中 7 个 `src` 文件的改动仍是 Day 7 留下的） | 2026-11-19 10:40 |
| F11 | 关键数值独立复算 | ✅ 用 WCAG 2.2 相对亮度公式独立重算：`#777777`/`#FFFFFF` = **4.4781 → 4.48 未达 AA**；`#767676`/`#FFFFFF` = **4.5422 → 4.54 达到 AA**；`#000`/`#fff` = 21.00 | 2026-11-19 10:34 |
| F12 | 文档改完后**再跑一遍**闸门 | ✅ `tsc` 退出码 0；`npm test` **18 / 295 全绿**（15.38s）；`npm run build` 2105 modules / **403ms**，产物哈希仍为 `index-mFcMtZD3.js` / `index-CFHpowcy.css` ⇒ 当时判断「本轮改动只在文档与材料，源码零影响」。**这条判断本身没错，但同一时刻线上产物已被取证文件污染（见 F14），11:35 才发现**；11:42 修复后重跑：`tsc` 0、18/295 全绿、CSS 变为 28219 B | **2026-11-19 11:06**（结论已被 F14 补充） |
| F13 | **发布后对公网重跑**（不是本地！） | ✅ 公网 = 本地同一构建；逐项复现：色彩 `4.48 未达 AA → 4.54 达到 AA`（建议色 `#767676`）、表单 `labels 0 → 1` 且真实 `<label for="student-name">`、键盘缺陷态 `outline: none` → 修复后 `solid 3px rgb(67, 56, 202) / offset 3px`、报告 `3/3、3/3、3/3、1 项、3 项` `countsMatch=true`、切路由 `3/3` / 刷新 `0/3` 且导出禁用、复制 6197 字符 === 页面、落盘 13577 B、75 请求 non-2xx `0`、控制台 `0 error / 0 warning`、20 组视口 `small=0` / `navMin=44`、五条深链冷启动全通过 | **2026-11-19 11:14–11:30**，产物 `.day8-evidence/{judge-flow-live,viewport-live,public-labels-focus,public-deeplinks}.json` |
| F14 | **构建隔离修复 + 第二次发布**（11:35 发现 ⇒ 11:49 上线） | ✅ 「从仓库重建 = 线上产物」在 11:14 发布后**当场不成立**：重建漂移到 `index-B61kabqi.js` / `index-ea8UcgoS.css`。逐字节比对定位根因：JS 完全相同，CSS 多出 `.shadow` / `.transform` / `.transition` 三条**死工具类**，来源是 Tailwind v4 默认全仓库扫描把 `.day7-evidence/` 与 `.day8-evidence/public-labels-focus.json`（平台水印 class 字符串）里的文字当成类名候选。修法：`src/index.css` **+7/−0** 两条 `@source not`（`.day*-evidence/**`、`*.{json,jsonl,log}`），与仓库既有 `.md` / 测试文件排除同一口径。产物影响：JS **逐字节不变**，CSS 29485 → **28219 B**（−1266 B，全部为死代码：16 条选择器 + 13 个 `@property --tw-*`，已逐条核对且 `src/` 内无 `.json/.log/.md`，「新 ∩ 旧」规则集合无删除）。发布前两次干净重建哈希一致；发布后线上 `cmp` 零差异、旧资源 `404` | ✅ 已完成 |
| F15 | **第二次发布后的公网复测**（与 11:14 基线逐项对比） | ✅ 四条复测退出码全 0，读数与基线**一致到可对比的程度**：20 组视口 `viewport-live.json` 与 `viewport-v2.json` **递归对比 0 处差异**（两份日志 `cmp` 完全相同）；评委动线 `judge-flow-live.json` vs `judge-flow-v2.json` **仅 2 处差异**＝机械耗时 5383→5267 ms、下载文件名时间戳（日志里另有两处点击坐标 ±4 px 与 75→74 请求，均非结论变化）；表单/键盘真实按键逐项相同（`labels 0→1`、`for="student-name"`、值仍是「张三」、`outline none 3px → solid 3px rgb(67,56,202)` `offset 3px`、水印仍加两个 `qoder-sites-badge` Tab 停靠点）；五条深链冷启动全 `ok=true`。**PERF 行直接记录 `index-Co1Kujov.css` + `index-aTyl07hG.js` ⇒ 浏览器确实用的是新资源** | ✅ **2026-11-19 11:50–11:51**，产物 `.day8-evidence/{judge-flow,viewport}-v2.json`、`v2-public-{labels-focus,deeplinks}.json`、`shots-v2/`、`downloads-v2/`、日志 `rebuild-check/run-*-v2.log` |
| F16 | 取证文件名**不得同名覆盖**（本轮踩到） | ⚠️ 事实修正：`.day8-evidence/public-labels-focus.json` 在 11:19 重跑时被同名覆盖，§2.14 / F13 引用的 10:21:50 那份快照**只存在于 DEVLOG 的文字记录里**（未跟踪文件，git 里也取不回来）。当前公网构建的同名取证结果另存 `v2-public-labels-focus.json`。后续探针一律带版本后缀（本轮已照此产出 `-v2`） | 已知问题，已按新口径执行 |

---

## F2. 视频与配图实际状态（不得把"脚本完成"当成"视频完成"）

| # | 事项 | 真实状态 |
| --- | --- | --- |
| V1 | 视频脚本 `demo-script.md` | ✅ **脚本已成文**（6 段分镜 + 时间预算 + 解说词全文 + 红线表）——**这只是脚本** |
| V2 | 录制检查表 `demo-checklist.md` | ✅ 已成文（A–H 节，A1 为阻断项） |
| V3 | **演示视频实际录制** | ⛔ **未录制，一个视频文件都没有**。不得在任何材料里写"视频已完成" |
| V4 | 参赛配图 | ⚠️ 14 张 PNG 真实存在于 `.day8-evidence/shots-post/`，**拍的是本地构建**。**发布已完成 ⇒ 现在可以对公网重拍**：`LIVE_URL=https://accessibility-lab-3g6uvbn5duq.qoder.zone node .day8-evidence/capture-shots.mjs`（数值已证实公网与本地一致，重拍是为了让取景真是公网页面） |
| V5 | Qoder 会话截图 | ⛔ **无文件**。两份帖子里都标成「待补充，不得用浏览器截图冒充」 |
| V6 | 终端结论行截图 | ⛔ **无文件**（本轮有真实输出，但未截成图片资产） |

---

## G. 时间计划（按今天 = 2026-11-19 校准）

| 日期 | 事项 |
| --- | --- |
| **11-19（今天）** | ✅ 工程复验（tsc / 295 条测试 / 构建，四轮哈希一致）、✅ 参赛帖精简版 `forum-post-final.md`、✅ 三处事实口径修正、✅ Git 与发布方案定稿、✅ **经授权完成 Sites 公开发布 + 公网回归取证**（A1/A2/A3/A6/F13）。**剩下的只有你本人的操作** |
| **11-20** | 你本人：Git 分组提交（I-1）→ 是否 `git push`；（可选但建议）对公网重拍 14 张配图（V4） |
| **11-21 ~ 11-23** | 你本人：确认 B1–B5 报名 / 实名认证 / 大学生认证；替换全部占位符；导出 Qoder 会话截图；录演示视频（**公网已是最新版，随时可录**） |
| **11-24 ~ 11-26** | 做 E 组人工验证项（能做几项做几项，做不了就保持"未验证"标注）；通读帖子查夸大表述 |
| **11-27 ~ 11-28** | 缓冲（不要留到最后一天的理由：认证、发布、上传任何一环出问题都没有回旋余地） |
| **11-29 前** | **正式发帖提交**（项目内部建议日期） |
| **11-30 18:00** | 官方截止（**待以官方公告核对**时区与条件） |

---

## H. 提交前 10 分钟最后过一遍

- [ ] 用的是**精简版 `forum-post-final.md`**（详细版只作答辩备份，不要两份都发）
- [ ] 帖子标题已定，含 `【Hack4Good】`
- [ ] **作品链接可匿名点开**，且**已是最新构建**（A1/A2/A3/A6 已于 11-19 11:14–11:30 脚本核验；**你再用无痕窗口目视一次**即可勾）
- [ ] 五部分齐全，顺序与官方要求一致
- [ ] **真实 Qoder 账号已填**（帖首 + 帖尾两处，D3）
- [ ] 学校 / 专业 / 姓名 / 天池用户名等占位符**全部替换**（D1、D2、D4）
- [ ] D5 的「请本人按真实经历确认」段落已确认、改写或删除
- [ ] 全文搜一遍 `【请填写`，结果为 0
- [ ] 全文搜一遍 `mFcMtZD3` / `CFHpowcy` / `gw0uvRiw` / `29485`：**只允许出现在带时间戳的历史行里**；任何「当前 / 预期线上产物」必须是 `index-aTyl07hG.js` + `index-Co1Kujov.css`（28219 B）
- [ ] 两份帖子与 `evidence-index.md` 里搜"真实物理"结果为 0（**唯一合法保留处**：`demo-script.md` 对**尚未录制**的视频提的操作要求「必须用真实物理键盘」，那是对未来的要求、不是对已有证据的描述）
- [ ] 配图已上传，且**图片版本与线上版本一致**（发布后重拍，V4）
- [ ] 标「待补充」的 Qoder 截图与终端截图已补上，或已删掉该标记所在段落
- [ ] 全文没有"100% 合规""已通过 WCAG 认证""支持读屏""跨浏览器已验证"等越界表述
- [ ] 没有把脚本机械耗时（6.3 秒）写成"评委 3 分钟体验时长"
- [ ] 没有把开发周期写成"8 天"（正解：4 个自然日、8 个开发阶段）
- [ ] 没有贴本地绝对路径、STS 签名 URL、完整终端日志
- [ ] 天池报名 / 实名认证 / 大学生认证三项**确实已完成**
- [ ] （若组队）成员信息与实际一致

---

## I. 待你授权 / 待你操作一览（我这边全部停在这里）

| 类别 | 事项 | 我不会自行执行 |
| --- | --- | --- |
| Git | `git add` + `git commit`（**四组**方案见下方 I-1）——**你已说「git 我提交」⇒ 全部由你本人执行，我未跑任何 Git 写操作** | ✅ |
| Git | 是否连带 `.day7-evidence/`、`.day8-evidence/`、`submission/`、`.qoder.site` 描述符（见 I-1 的第 ③④ 组；④ 组的前置"等发布"已满足） | ✅ |
| Git | `git push` 到 `origin/main`（本轮核查时 `main` 与 `origin/main` **0 ahead / 0 behind**，推送会把 Day 7/8 内容与约 **4.4 MB** 取证文件发到 `github.com/chenpeng5201107-afk/AccessLab`） | ✅ |
| 部署 | ~~Qoder Sites 公开发布~~ ✅ **已按你授权于 11-19 11:14 执行完毕**（I-2 有实际执行记录） | 已执行 |
| 论坛 | 在天池赛题页论坛发帖 / 修改已发布作品 | ✅ |
| 身份 | 实名认证、大学生认证、账号信息填写 | ✅（也无法代做） |
| 人工 | 读屏 / 无痕 / 剪贴板 / 真机手机 / Firefox-Safari / 视频录制 / 配图重拍 | ✅ |

### I-1 建议的 Git 提交分组（**已定稿；你已表明由你本人提交，我未执行任何 `add`/`commit`/`push`**）

| 组 | 建议 commit message | 文件 | diff |
| --- | --- | --- | --- |
| ① | `fix: close day7 accessibility and focus-handoff gaps`（+ 11:49 的构建隔离） | `src/components/AppHeader.tsx`、`src/lib/reportModel.ts`、`src/pages/{ContrastLabPage,FormLabelLabPage,HomePage,KeyboardFocusLabPage,ReportPage}.tsx`、**`src/index.css`**、新增 `src/App.day7.test.tsx`(479 行 / 21 条) | 7 个业务源码文件 **+207/−45**（11-19 全天复测数字未变 ⇒ Day 7 那批源码一字未改）；**`src/index.css` +7/−0** 是 11:49 新加的构建隔离，不是样式改动 ⇒ 共 **8 改 1 新**。若要严格分组，可把 `src/index.css` 单拆一次 `build: exclude evidence files from tailwind content scan` |
| ② | `docs: finalize accesslab verification and submission materials` | `PRD.md`、`DEVLOG.md`、`PROJECT_STATUS.md`、`submission/`(7 份，含新增 `forum-post-final.md`) | 三份治理文档相对 `82ecef4` 现为 **+1002/−51**（`git diff --numstat` 11:55 实测：DEVLOG +509/−3、PRD +165/−1、PROJECT_STATUS +328/−47）：Day 6 发布记录 + Day 7/8 段落 + 收口轮 + **11:14 发布与公网回归 + 11:49 构建隔离与第二次发布**；`submission/` 是**新增目录** |
| ③（建议一并） | 同上 ②，或单独 `test: archive day7 and day8 browser verification evidence` | `.day7-evidence/`(**31** 文件 **1.5 MB**)、`.day8-evidence/`(**73** 文件 **4.8 MB**：公网取证 `-live` 组、本地 `-clean` 组、`-v2` 组，加 `rebuild-check/` 的线上 vs 新产物逐字节比对目录与 6 份日志、`downloads-os/` 找回的公网导出样本) | 与已入库的 `.day6-evidence/`(43 文件 2.36 MB) 口径一致；已扫描**无密钥 / Token / Cookie / 表单输入**；⚠️ 取证文件名**带版本后缀、不要同名覆盖**（11:19 那次同名重跑把 10:21:50 的快照覆盖掉了，见 F15） |
| ④ | `chore: record day8 site publication descriptor` | `.AccessLab 无障碍实验室.qoder.site` | **+12/−12**：已被**两次发布**的工具改写，现记录第二次 action `d0a23be7-ad65-4e46-b6a7-67db593506c8`（第一次是 `a8ffa344-…`）。**前置条件已满足，现在提就是最终态** |

**建议排除**：`dist/`（已在 `.gitignore`，产物不入库）、`node_modules/`、`coverage/`、`*.tsbuildinfo`——本轮无需改动 `.gitignore`。

**两个需要你知情的细节**：
1. `.day7-evidence/verify6.mjs:9` 硬编码了 `C:/Users/zxcvb/...`，`part6-perf.json` 的 `servedFrom` 同样含本地用户名。
   已入库的 `.day6-evidence/run4.log`、`run5.log` 等 6 个文件**早就有同类路径**，所以这不是新增泄露面；
   但**若仓库要设为公开**，建议先把脚本改成 `process.cwd()` 派生路径再提交（我可以做，等你点头）。
2. 全部改动文件都是 **LF → CRLF** 警告（Windows 换行），不影响内容；仓库未配 `.gitattributes`，如要保持 LF 可另开一次治理提交。

### I-2 发布方案与**实际执行记录**（原为「等你单独授权」⇒ 11-19 **11:14 首次发布**、**11:49 因构建隔离再发一次**，两次都已执行完毕）

```
prepare_site  actionId=a8ffa344-a7c6-4982-a5d8-5d54524d4d68   ← 第一次（11:14，产物 mFcMtZD3 / CFHpowcy）
prepare_site  actionId=d0a23be7-ad65-4e46-b6a7-67db593506c8   ← 第二次（11:49，产物 aTyl07hG / Co1Kujov，当前线上）
              publishOperationId=01a1f1ec-f388-7629-b711-ee3ea249174e
              projectRoot=C:\Users\zxcvb\OneDrive\Desktop\AccessLab
              webDirectory=dist   spa=false   projectId=01a1e498-acb7-796a-a96d-1c22a6cee214
              slug=accessibility-lab   displayName=AccessLab 无障碍实验室
   ↓ descriptorStatus=pending 时先 get_publish_status 确认 preparation.state=ready / canPublish=true / blockers=[]
   ↓ 再用同一 actionId、完全相同输入重试 prepare_site → descriptorStatus=written
publish_site  → get_publish_status 确认 published:true / operation.state=succeeded / committed:true
   ↓
公网核验：匿名 curl 首页引用应为 index-aTyl07hG.js + index-Co1Kujov.css；两资源 200 且与本地逐字节 cmp；
         五个 hash 深链、控制台、三个实验主流程、报告导出、移动端布局逐项复跑
   ↓
失败回退：git checkout 82ecef4 → npm run build → 以新 actionId 重新发布（重复 publish 旧 action 无效）
```

**实际执行结果（未触发回退）**：
`prepare_site` 首次返回 `descriptorStatus: pending` → `get_publish_status` 显示 `preparation.state: ready` / `canPublish: true` / `blockers: []`
→ 同 action 重试 `prepare_site` 得 `written` → `publish_site` → `get_publish_status` 确认
**`published: true`、`operation.state: succeeded`、`committed: true`、`deploymentId 01a1f1cc-3820-7162-9d17-e6a903d065a5`、`artifactSha256 93b7a2b9…`**。
核验：线上引用已换成新哈希、两资源 `cmp` 与 `sha256sum` 与本地一致、旧资源 `404`、`last-modified` = 发布时刻；
公网回归逐项见 F13。**站点仍是同一个 `projectId` / `siteId`，未新建站点、未改访问范围。**

> **逐字节比对的口径**（11-19 实测）：匿名 `curl` 首页返回 **200 / 57720 B**，而本地 `dist/index.html` 只有 **678 B**——
> 差值是 Sites 托管在 HTML 里注入的平台脚本（含 4 处 `qoder` 字样），**不是产品回归**。
> 所以 `cmp` 只用来比 **JS / CSS 两个资源文件**（`index-aTyl07hG.js` 372750 B、`index-Co1Kujov.css` 28219 B），
> `index.html` 只核**引用到的文件名**是否正确。发布前后各截一次，避免误判。

---

## J. 11:35–12:15 追加轮（构建隔离修复 + 第二次发布 + 公网复测 + 证据找回）

| 项 | 结果 |
| --- | --- |
| J1 发现可复现性被打破 | ✅ 已定位：从仓库重建 = `index-B61kabqi.js` / `index-ea8UcgoS.css` ≠ 线上 `mFcMtZD3` / `CFHpowcy`；逐字节比对确认 **JS 零差异、CSS 多三条死工具类**，来源是 Tailwind 全仓库扫描吃到 `.day7-evidence/` 与 `.day8-evidence/public-labels-focus.json` 里的类名字符串 |
| J2 修复 | ✅ `src/index.css` **+7/−0** 两条 `@source not`（`.day*-evidence/**`、`*.{json,jsonl,log}`），沿用仓库既有排除口径；**不改任何生效样式** |
| J3 产物影响核对 | ✅ 逐条规则集合差：移除 16 条选择器 / 2632 B 死代码 + 13 个 `@property --tw-*` 消失，新增 1 条 `.ring-1` 重分组；`src/` 下无 `.json/.log/.md` ⇒ 被排除候选不可能来自源码；「新 ∩ 旧」无规则被删。留档 `.day8-evidence/rebuild-check/` |
| J4 修复后闸门 + 本地回归 | ✅ `tsc` 0、`npm test` **18 / 295 全绿**、`npm run build` 428ms；评委动线与 20 组视口读数逐项一致（`judge-flow-clean.json` / `viewport-clean.json`）；两次干净重建哈希一致 |
| J5 第二次发布 | ✅ 11:49 上线（action `d0a23be7-…`、publishOperation `01a1f1ec-…`、`published: true` / `committed: true`，同一站点未新建）；线上 = 本地逐字节一致，上一版两资源 `404` |
| J6 公网复测 | ✅ 11:50–11:51 四条（20 组视口 / 评委动线 / 表单+键盘真实按键 / 五条深链）全 `EXIT=0`，与 11:14 基线**除计时外零差异**（见 F15） |
| J7 材料回写 | ✅ 全部「当前 / 预期线上哈希与 CSS 体积」改为 `index-aTyl07hG.js` + `index-Co1Kujov.css` / 28219 B（gzip 6078 B）；历史值保留并标明时刻；PRD 新增技术约束第 6 条 + 验收第 12 条 + §4.12，PROJECT_STATUS 新增 §2.15，DEVLOG 新增 11:49 节 |
| J8 证据管理两处问题（如实记录，不掩盖） | ⚠️ ①四条复测第一次跑在了子目录里，输出落进嵌套的 `.day8-evidence/`，已移入正确位置且**未覆盖任何已有文件**；②`public-labels-focus.json` 曾在 11:19 被**同名覆盖**，10:21:50 那份快照只存在于 DEVLOG 文字中；③12:06 从系统「下载」找回 11:18 那份公网导出样本（`downloads-os/`，`2 / 3` 部分进度），已登记为 §5.11。**后续探针一律带版本后缀，取证脚本必须显式设置输出与下载目录** |
