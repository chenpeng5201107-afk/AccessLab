# AccessLab 项目状态

> **当前版本 · 2026-11-21**：作品参加 Hack4Good · 技术向善赛道，方向为网页无障碍教育与辅助技术普及。七个 hash 路由包含三个无障碍实验及校园案例。首页主入口为「开始校园初诊」。案例及本轮界面调整由 Codex 完成，本版待发布至 Qoder Sites。以下保留上一公开版本记录。


> 最后更新：2026-11-19 11:55（**Day 8 最终复验 + 参赛交付材料 + 两次公开发布 + 一处构建隔离修复**：
> A2 复跑质量闸门——`npx tsc --noEmit` 干净、`npm test` **18 文件 / 295 条全绿**、`npm run build` 通过，
> 且 `rm -rf dist` 重建后哈希与 Day 7 **逐字符一致**（当时为 `index-mFcMtZD3.js` 372750 B / `index-CFHpowcy.css` 29485 B）⇒ 可复现构建；
> **11:35 之后这条被推翻又修好了**：重建产物漂移到 `index-B61kabqi.js` / `index-ea8UcgoS.css`，根因是取证 JSON 被 Tailwind 内容扫描
> 当成类名候选；11:49 以 `src/index.css` **+7 行 `@source not`** 修复后重新发布，线上与本地再次逐字节一致（见 §2.15）。
> Day 7 的四项修复经 grep + 运行时双重确认仍在（320 主按钮 `ctaTop 499 / inFold true`、报告三组 `1 项 / 1 项 / 3 项` 且 `countsMatch=true`、
> 20 组视口导航高度集合 `{44}`、六个主操作后焦点**无一退回 `<body>`**），因此复验那一步**一处业务代码都没改**
> （全天唯一的产品文件改动是 11:49 的 `src/index.css` +7 行构建排除，只改构建期的扫描范围，不改任何生效样式）。
> A4/B 组真实浏览器复验（headless Edge 157 + CDP）：评委动线机械耗时本地预览 `6287ms`、公网 `5383ms`（11:14 版）/ `5267ms`（11:49 版）、报告 `3/3、3/3、3/3、1 项、3 项`、
> 复制 6197 字符 === 页面 Markdown、落盘 `.md` 13577 B 逐字节一致、刷新回 `0 / 3` 且导出禁用、93 请求 non-2xx `0`、控制台错误 `0`。
> B4 参赛材料已产出：`submission/` 六份（README / 论坛帖 / 视频分镜 / 录制清单 / 证据索引 / 最终清单；**11-19 收口轮增至七份**，见 §2.13）+ `.day8-evidence/shots-post/` 14 张同源截图。
> **仍未验证**：真机屏幕阅读器、非 Chromium 内核、系统级减弱动效、OS 剪贴板人工回读、无痕目视、真实移动网络、Lighthouse、用户调研。
> **⚠️ 唯一 P0**：~~线上仍是 Day 6 构建~~ ⇒ **已于 2026-11-19 11:14 经用户授权发布解决，11:49 因构建隔离发布第二版**，公网现为 `index-aTyl07hG.js` + `index-Co1Kujov.css`，与本地逐字节一致（见 §2.14 / §2.15）。
> 该轮**未执行**任何 Git 写操作与发布，HEAD 仍是 `82ecef4`；发布授权随后于 11:14 给出，之后因构建隔离又于 11:49 发布一次（见下），**Git 授权未给出——按「git 我提交」全部由你本人执行**。）
>
> **11-19 11:14 追加（用户授权「site 更新一下，git 我提交」）**：站点已公开发布（新 action `a8ffa344-…`、同一 `siteId`、未建新站），
> 并在**公网**上重跑真实浏览器回归：三实验 + 报告 `3/3`、复制 6197 字符 === 页面、落盘 13577 B 逐字节一致、
> 20 组视口无溢出且主按钮四档在折线内、控制台 0 错误、75 请求 non-2xx `0`、表单 `labels 0 → 1`、焦点环 `solid 3px rgb(67, 56, 202) / offset 3px`。
> **Git 一律未动**，留给用户提交。详见 §2.14 与 DEVLOG 末条。
>
> **11-19 收口轮追加（零源码改动，只改材料口径）**：①重跑闸门并再次通过（tsc 干净 / 295 全绿 / 构建 481ms / 产物哈希**连续第三轮**逐字符一致）；
> ②独立复算对比度 4.4781 / 4.5422，证实帖子的两个 headline 数字来自公式而非写死；③修正三处站不住的表述
> （**"共 8 天"→ 4 个自然日 / 8 个开发阶段**、**"真实物理 Tab"→ 自动化脚本向真实浏览器发送 Tab 键事件**、未经确认的第一人称经历 → 客观观察或加"请本人确认"标记）；
> ④新增 `submission/forum-post-final.md`（正文实测 2834 汉字、含附录 3200 汉字的**正式提交优先版**，长版 `forum-post.md` 完整保留）；
> ⑤Git 与发布方案定稿到 `submission/final-checklist.md` 的 I-1 / I-2。**该轮只做了本地整理，未提交、未发布**；发布在 11:14 单独获授权后完成（§2.14），Git 仍留给用户。详见 DEVLOG 末两条与 §2.13。

## 1. 当前阶段

**本地 = 线上 = 同一份构建**（`index-aTyl07hG.js` 372750 B / `index-Co1Kujov.css` 28219 B，11:49 发布后**逐字节一致**；站点 `public` 免登录，无后端）。
源码仍是 Day 7 的验收版本：tsc 干净、295 条测试全绿、构建可复现（连续四轮哈希不变）。**旧的 Day 6 资源 `index-gw0uvRiw.js` 现已 `404`，版本整体切换完成。**
唯一还没做的是 **Git**：工作区改动（Day 7 源码 +207/−45、三份治理文档、描述符、四个未跟踪目录）**由用户本人提交**。

Day 8 **不加功能、不改代码、不做视觉重设计、不扩范围**，只做三件事：
①在 Day 7 源码上重跑质量闸门并证明构建可复现；②用真实浏览器重跑评委动线 / 焦点交接 / 20 组视口矩阵，把截图与读数落盘成可引用的参赛证据；③产出 `submission/` 参赛材料包并把 Day 8 数字写回三份治理文档。

**五个路由全部可用；Day 7 的四项修复在源码与运行时两侧都被重新确认存在，因此本轮按「当前代码正常就不要重复修改」的要求零改动。**

Day 8 范围严格限定在复验与材料：
**未**新增实验 / 依赖 / 路由 / 状态管理、**未**改检测算法与阈值、**未**改事件处理与台账语义、
**未**为教学方便改动键盘实验的缺陷态、**未**新增动画 / 图片 / 统计、**未**给全站出合规评分或认证结论、
**未**为材料好看而调整产品代码。Day 1–7 的页面、算法与 295 条测试**零回归、零删改、零新增**。

上一轮（Day 7）范围回顾：
把首页唯一主操作提到首屏（A1）、把报告「人工验证」拆成三种状态并让统计数字与列出的条目同源（A2）、
把顶部导航可点区补到 44px（A3），以及在真实键盘取证中发现并修掉「按钮被结果块顶掉后焦点退回 `<body>`」这一处实际缺陷（B1）
（净增 `src/App.day7.test.tsx` 21 条 → 295 条）。

再上一轮（Day 6）范围回顾：
**未**新增功能、**未**改算法与台账语义，只改首屏表达、动线、一致性与报告口径（净增 `src/App.day6.test.tsx` 20 条 → 274 条），
并已发布上线（action `b7ea5f56-2e7b-4735-b1f1-ef6c050e09bc`）、源码入库（`82ecef4`，已推送 `origin/main`）。


## 2. 完成情况

### 2.1 Day 2 结项（阶段 A）

| 项 | 状态 | 证据 |
| --- | --- | --- |
| Day 2 功能完整性复核 | ✅ | 对比度检测 / 自动配色 / 一键应用 / 撤销 / 前后对比 / CSS 生成与复制 / 非法输入清过期建议 / 键盘导航与 hash 路由，**未重新开发** |
| `npm test`（结项时） | ✅ 60/60 | 4 个算法与状态机文件 + 路由 + 组件接线层，无失败无跳过 |
| `npm run build`（结项时） | ✅ | 产物与 DEVLOG 记录同名 `index-Biknu-lx.js` → 源码与已验收构建一致 |
| `.gitignore` 复核 | ✅ | `node_modules` / `dist` / `*.local` / `.env*`（放行 `.env.example`）/ `coverage` / `.vite` / `*.tsbuildinfo` / 调试日志 / `.DS_Store` 全忽略；仓库自初始提交即**不跟踪构建产物**（`git ls-files dist` 为空），维持原约定 |
| Day 2 提交 | ✅ `943a3ac` | `feat: complete accessibility contrast lab day2`（21 files，+2029/−87），**经用户确认后创建**；未推送远程、未改写历史 |
| Qoder Sites 发布 | ✅ 已发布 | `prepare_site`→`get_publish_status`→`publish_site`；`published: true`；`index.html` 与本地逐字节 `identical`，入口为最新 `index-Biknu-lx.js` |
| 公网权限 | ✅ **public，实测无登录** | 无痕访问站点 → 200、`finalUrl` 未跳转、正文含标语、无登录/口令元素；线上色彩流程实测 `4.48 → 4.54 → 撤销 4.48` |

### 2.2 Day 3 新增（阶段 B）

| 模块 | 状态 | 备注 |
| --- | --- | --- |
| `src/lib/formLabelDemoFields.ts` | ✅ 新建 | `id` 单一来源 + 修复前后代码对比数据源（DOM 与展示代码同源，不会各说各话） |
| `src/lib/formLabelAudit.ts` | ✅ 新建 | **只读真实 DOM** 的标签关联检测器：`input.labels` / `label.htmlFor` / `label.control` / 包裹式 label / 可访问名称来源链 |
| `src/pages/FormLabelLabPage.tsx` | ✅ 新建 | 五段结构：问题引入 → 真实表单 → 检测结果 → 修复与重新验证 → 代码对比；沿用白/浅灰/靛蓝卡片体系与 `min-h-11` 控件规范 |
| 缺陷演示范围 | ✅ | 缺陷只出现在明确标注的虚线实验区内；页面导航与操作控件全部保持可访问；placeholder 不被当作「正确关联的可见标签」 |
| 两类结论分开 | ✅ | 「缺少关联的可见标签」与「完全没有可访问名称」分两枚徽标显示，避免混为一谈 |
| 真实修复而非改文字 | ✅ | 点修复 → DOM 真的变成 `LABEL`（`labels 0→1`、`htmlFor === id`、`label.click()` 后 `activeElement === INPUT#student-name`）→ 检测在新 DOM 上重跑 `2 项 → 0 项`；「重置实验」可回到缺陷态；输入内容不丢失 |
| 检查范围声明 | ✅ | 第 3 块写明只覆盖 1.3.1 / 3.3.2 的标签关联，**全部通过 ≠ 整页或整站符合 WCAG 2.2**，并展开列出 6 类未检查项 |
| HTML 代码对比 | ✅ | 真实 `id` / `for`、逐行 diff 高亮、与当前状态互斥标注、复制（不支持 / 成功 / 失败三态如实提示）、无代码编辑器依赖 |
| 安全 | ✅ | 纯文本 `<span>` 渲染，无 `dangerouslySetInnerHTML`，不执行任意 HTML/JS；演示表单 `preventDefault`，不发请求、不保存输入 |
| 首页第二张卡片 | ✅ 已开放 | 「表单标签无障碍实验」改为真实入口 `#/form-label`；第三张「键盘焦点实验」仍为「即将开放」，**无假按钮** |
| hash 路由扩展 | ✅ 最小侵入 | 仅追加 `'#/form-label'` 映射与 `Route` 联合类型，`routeFromHash` / `nextRoute` 逻辑未动 |
| 检测器测试 | ✅ 13 条 | `src/lib/formLabelAudit.test.ts`：真实 DOM 真值表 + 「同一节点 `label`↔`span` 互换结论翻转」的节点级回归 |
| 页面测试 | ✅ 16 条 | `src/pages/FormLabelLabPage.test.tsx`：覆盖用户第 7 节 12 项；jsdom 未实现「点 label 聚焦控件」，故只断言 `label.control === input`，真实焦点交给浏览器验证 |
| 路由测试 | ✅ 9 条 | 由 8 增至 9，**只加断言未删旧断言**（表单页锚点不重置本页、未知 hash 不跳首页） |
| **单元测试总计** | ✅ **90/90** | 7 个测试文件；Day 2 的 60 条零回归 |
| 生产构建 | ✅ 通过 | `tsc -b` + 2097 modules → `index.html 0.61 kB` + **`index-AFw0dV32.js` 282.01 kB**(gzip 86.55) + **`index-KGhPc1c7.css` 25.70 kB**(gzip 5.78) |
| 真实浏览器验证（本地 `dist` 预览） | ✅ 通过 | 见 `DEVLOG.md` Day 3 §5：缺陷态/修复态节点与标签数、检测 2→0、`label.click()` 聚焦、无障碍树名称 `"请输入姓名"` → `"姓名"`、重置回缺陷态、首页与路由、Day 2 全流程回归、控制台无 error/warn |
| 屏幕阅读器实际朗读 | ⛔ 未验证 | 本环境无真机读屏；页面**未模拟**语音输出，无障碍树名称只是浏览器计算值，不代替 NVDA/VoiceOver 实测 |
| 键盘焦点实验 / 实验结果报告 | ⛔ 未开发 | 不在 Day 3 范围 |

### 2.3 Day 3 复核轮（本轮，零源码改动）

| 项 | 状态 | 实测证据 |
| --- | --- | --- |
| `npm test` | ✅ **90/90** | 7 文件、18.24s；Day 1/2/3 全通过，无失败无跳过 |
| `npm run build` | ✅ 通过 | 产物仍为 `index-AFw0dV32.js` 282.01 kB + `index-KGhPc1c7.css` 25.70 kB，与上轮同名 → `dist/` 即 HEAD 源码产物 |
| `git status` | ✅ 干净 | 仅 `.qoder.site` 的 `publication` 块未入库（工具状态，按约定不提交）；`src/` 无改动 |
| 线上版本核对（curl，无 Cookie） | ✅ 已确认 | 线上引用 `index-Biknu-lx.js`（258270 B，无 `student-name` / 无 `#/form-label`），`GET /assets/index-AFw0dV32.js` → **404** ⇒ Day 3 未上线 |
| 真实浏览器复核（`preview` 4173） | ✅ 通过 | 缺陷态 `SPAN`+`labels 0`+2 项问题 → 修复态 `LABEL`/`htmlFor`/`labels 1`/`label.control === input`/0 项问题；`label.click()` 后 `activeElement === INPUT#student-name`；a11y 树名称 `请输入姓名` → `姓名`；重置回缺陷态；输入内容不丢；`aria-live` 区 1 个；复制无手势时如实报失败；控制台无消息 |
| Day 2 回归 | ✅ 通过 | `4.48 → 建议 4.54 → 应用 → 撤销 → 4.48`；首页卡片 01/02 真实入口、卡片 03 无链接；`#/form-label` 深链刷新正确 |
| **320 / 390 横向溢出** | ✅ **本轮实测通过**（原「不可测」） | 同源 iframe 强制窄视口：`clientWidth` 305 / 375，`scrollWidth === clientWidth` ⇒ 三页均无横向溢出 |
| **44px 触控目标** | ✅ 结构实测 | 唯一低于 44px 的可交互元素是 sr-only skip link（未聚焦时 32×16 且被裁剪，非指点目标）；其余全部 ≥ 44px |
| **真实浏览器 Tab 键事件序列**（自动化发送，非真人手按） | ✅ 本轮可用（原「不可测」） | `press_key Tab` 已能驱动焦点遍历，实测前 5 站顺序正确、`outline: solid 3px indigo / offset 2px`；全页无正值 `tabindex` ⇒ 顺序即 DOM 顺序 |
| 视觉截图 | ⛔ 仍不可用 | `NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`（`visible=false`），本轮未取到截图 |
| `back / forward` 浏览器历史 | ⚠️ 本轮证据被污染 | 我为测窄屏临时插入的 iframe 进入了联合会话历史；后/退一致性以 9 条路由单测 + 深链刷新实测为准 |

> 记录订正：上一轮 DEVLOG 的「线上 `index.html` 与本地逐字节 identical」不够准确 —— 实为「本地 613 B 产物 + 平台注入的 `data-qoder-watermark` 脚本 ≈ 57.6 kB」，逐字节一致的是 `<head>`（含两个资源引用）与 `<div id="root">`。

### 2.4 Day 3 公网发布（本轮，经用户授权）

| 项 | 状态 | 证据 |
| --- | --- | --- |
| 发布前提交 | ✅ `11a43bd` | `docs: record day3 re-verification evidence before publication`（2 files，+92/−8），仅治理文档；`.qoder.site` 仍不入库；未推送远程 |
| `prepare_site` | ✅ `descriptorStatus: written` | 新 action `15adaa32-567d-4110-aa49-4f921fd56773`、`webDirectory: dist`、`spa: true`、同 `projectId`；首返 `pending` → 就绪后同 action 同输入重试恢复描述符，未重复上传 |
| `publish_site` | ✅ **`published: true`** | `publishOperationId 01a1e8ad-a1b2-…`、`operation.state: succeeded`、`committed: true`、`readiness: publication_completed` |
| 访问权限 | ✅ `access_mode: public` | `auth_integration_status: not_required`；匿名 curl 200 且响应头无 `Set-Cookie` / `Location` / `WWW-Authenticate` |
| 线上 = 本地 | ✅ 逐字节 | 线上 `index-AFw0dV32.js` 282019 B 与本地 `dist/` 同名文件 `cmp` 一致；`index.html` 已无 Day 2 的 `Biknu` 引用 |
| 公网功能实测 | ✅ 通过 | 真实浏览器：表单实验 `SPAN`/`labels 0`/2 项 → `LABEL`/`htmlFor`/`labels 1`/0 项，`label.click()` 聚焦输入框；色彩实验 `4.48 → 4.54 → 撤销 4.48`；控制台无消息 |
| 产物卫生 | ✅ 通过 | `dist/` 无 `.map`、无 `VITE_*`、无 `.env`、无数据文件 |
| 回退手段 | ⚠️ 已订正认知 | 历史 Day 2 action **不能**重新变当前版本；回退须 `git checkout 943a3ac` → `npm run build` → 新 action 发布 |
| 无痕浏览器人工确认 | ⛔ 待人工 | 本轮是无 Cookie 的 curl + 真实 Chromium，不等于评委设备上的无痕浏览器目视 |

### 2.5 Day 4 键盘焦点实验（本轮，开发 + 取证完成，待提交与发布）

| 模块 | 状态 | 证据 |
| --- | --- | --- |
| `src/lib/keyboardFocusDemo.ts` | ✅ 新建 | 单一来源：按钮配置、`broken/repaired` 样式状态、缺陷态与修复态 `:focus-visible` 规则文本、注入样式表、演示工作流 reducer、观察阶段状态机、结语文案 |
| `src/lib/keyboardFocusAudit.ts` | ✅ 新建 | 只读真实 DOM：类名 / `tabindex` / 原生可聚焦 + 从注入样式表抓规则文本，产出 `focus-indicator-suppressed`、`visible-outline-rule-missing` 两类问题码；文件头写明「不能证明屏幕上真的看得见」 |
| `src/pages/KeyboardFocusLabPage.tsx` | ✅ 新建 | 六段结构（原理 → 别用鼠标 → 规则现状与修复 → 前后对比与 3:1 实测 → 五步人工验证 → CSS 对比与复制）+ 检查范围声明 |
| 三个示例按钮真实可操作 | ✅ 浏览器实测 | Enter 展开详情（`aria-expanded false→true`、`hidden` 消失）、Space 保存（`0/3 → 1/3` 且列表出现条目）、Enter 撤回（`1/3 → 0/3`）；空列表撤回与全部保存完都有如实文案 |
| 缺陷真实存在 | ✅ 浏览器实测 | 修复前 Tab 聚焦时 `outline-style: none`（`:focus-visible` 已匹配），截图 `shot-01-broken-keyboard-focus.png` 看不出焦点在哪个按钮 |
| 一键修复真的换样式 | ✅ 浏览器实测 | 用键盘激活「修复焦点指示」→ 类名 `--broken → --fixed`，同一按钮聚焦时 `outline: solid 3px rgb(67, 56, 202)` + `offset: 3px`，截图 `shot-03 / shot-09` |
| hover 不冒充焦点 | ✅ 浏览器实测 | 未聚焦 + `:hover` 命中时 `outline` 仍是 `none`（只有边框 `#cbd5e1 → #94a3b8`），截图 `shot-06-hover-only.png` |
| 环不被遮挡 | ✅ 浏览器实测 | 四向 `elementFromPoint` 命中父容器而非其它按钮；相邻按钮间距 16px > 环外扩 6px；环完整落在卡片内边距 16px 之内；祖先无 `overflow` 裁剪 |
| 无焦点陷阱 | ✅ 浏览器实测 | `kf-step-back` 后继续 Tab：重新检测 → 修复 → 重置 → 复制 → `<summary>` → 回到文档，焦点离开实验区 |
| 四档视口 | ✅ 浏览器实测 | 320 / 390 / 768 / 1440 `scrollWidth === clientWidth`（无横向溢出）；1440 两栏、768 及以下单栏；示例按钮恒 `94×44` |
| `prefers-reduced-motion` | ✅ 浏览器实测 | `reduce` 下 `transition: 1e-05s`、`animation: none`，焦点环仍是实心 3px ⇒ 不靠动效 |
| 焦点样式边界（红线） | ✅ | 全局 `:focus-visible` 仍在 `@layer base`；注入表只命中 `.kf-demo-btn*`，无裸 `:focus-visible` / `button` / `a` 选择器；`header nav a` 键盘聚焦仍是 `solid 3px` indigo；卸载后 `<style data-keyboard-focus-demo>` 不残留 |
| 观察状态四档分开 | ✅ | 尚未体验 → 待人工检查（有键盘到达次数）→ 已应用焦点修复 → 用户已确认观察结果；「我已完成观察」在修复前 `disabled`（实测 `disabled: true` + `cursor: not-allowed`），修复与重置都会清掉旧确认与旧次数 |
| 结语逐字正确 | ✅ 浏览器实测 | 确认后播报「你已经体验了焦点指示修复。本次实验只验证了指定组件的焦点显示与基本操作，不能代表整个网站已经符合全部无障碍规范。」 |
| CSS 对比与复制 | ✅ | 展示的 CSS 与注入生效的样式表同源；真实浏览器里 `clipboard-write` 权限 `denied` → 键盘与鼠标两种激活方式都如实显示「复制失败，请手动选中…」；把 `writeText` 换成记录入参的桩后，交出去的字符串与代码块**逐行一致** |
| 安全 | ✅ | 纯文本渲染，无 `dangerouslySetInnerHTML`、不执行外部脚本、无代码编辑器依赖；演示数据不提交、不发请求、不写存储 |
| 路由与入口 | ✅ | `#/keyboard` 深链、刷新保持、前进 / 后退（干净标签页真实历史实测）、skip link 不破坏路由；首页第三张卡片改为真实入口并删掉「还在开发」旧文案；导航新增第四项 |
| **单元测试总计** | ✅ **180/180**（12 文件） | Day 4 新增 89 条（`keyboardFocusDemo` 26 / `keyboardFocusAudit` 11 / `KeyboardFocusLabPage` 34 / `HomePage` 8 / `App` 10），`useHashRoute` 由 9 增至 10；**旧 90 条一条未删未放宽**。此为 Day 4 首轮数字，收尾轮后 199/199、Day 5 后 **254/254**，见 §2.6 / §2.7 |
| 生产构建 | ✅ 通过 | `tsc -b` + 2100 modules → `index.html 0.61 kB` + **`index-BfWfinPC.js` 317.53 kB**(gzip 95.84) + **`index-CLPKB9bc.css` 26.23 kB**(gzip 5.84) |
| Day 1 / 2 / 3 回归 | ✅ 浏览器实测 | 色彩实验 `4.48 → #cccccc 1.61 → #111111 18.88 达到 AA → 非法输入沿用上次有效并提示 → 重置 4.48`；表单实验 `SPAN/labels 0 → LABEL/htmlFor/labels 1/label.control===input → 重置回 SPAN`；控制台除 `/favicon.ico` 404（应用本来没有 favicon）外无异常 |
| 真机读屏 / 无痕目视 / 真实剪贴板成功分支 / OS 级减弱动效 | ⛔ 待人工 | 见 DEVLOG Day 4 §6；内置浏览器本轮无可视表面，截图取证改用 headless Chromium + CDP |

### 2.6 Day 4 收尾轮：键盘到达次数与人工确认语义（本轮）

| 项 | 状态 | 实测证据 |
| --- | --- | --- |
| 修复前 / 修复后分开计数 | ✅ | `keyboardFocusDemo.ts` 拆出 `beforeSightings` / `afterSightings` 两条独立计数，页面徽标分别显示「修复前 N 次 / 修复后 M 次」 |
| 只有真实键盘到达才计数 | ✅ 浏览器实测 | 计数挂在真实 `focus` / `blur` 上并要求 `:focus-visible` 键盘模态；鼠标点击聚焦、Enter/Space 激活都不增加次数 |
| 「我已完成观察」启用门控 | ✅ 浏览器实测 | 需同时满足「修复前有键盘记录 + `:focus-visible` 修复已应用 + 修复后有键盘记录」；`3 次 / 0 次` 时实测 `disabled: true`，补齐后轮才可点 |
| 应用修复 / 重置的转移语义 | ✅ | 应用修复**保留前轮、清零后轮**；重置清掉两轮 + 本人确认 + 修复状态，回到缺陷态 |
| 确认后的语义边界 | ✅ | 只登记「已完成人工观察」，结语与页面文案不出现「符合 WCAG」「已通过认证」 |
| 测试 | ✅ **199/199** | `keyboardFocusDemo` 26→38、`KeyboardFocusLabPage` 34→41；旧 180 条未删未放宽 |

### 2.7 Day 5 统一成果报告（本轮，开发 + 取证完成，待提交与发布）

| 模块 | 状态 | 证据 |
| --- | --- | --- |
| `src/lib/experimentLedger.ts` | ✅ 新建 | 台账**纯逻辑层**：`deriveContrastRecord` / `deriveFormRecord` / `deriveKeyboardRecord` / `snapshotFromAudit` / reducer（JSON 去重 bail-out）。每条结论都由实验页已有检测或算法结果推导，报告页没有第二套检测器 |
| `src/context/ExperimentLedgerContext.tsx` | ✅ 新建 | React Context + `useReducer`，挂在 `App` 根 ⇒ 切路由不丢；**不写存储、不发请求**，刷新即清空 |
| `src/lib/reportModel.ts` | ✅ 新建 | 页面与 Markdown 的**同一份数据源**：总览计数、四档状态、每实验证据与限制、`NON_CERTIFICATION_STATEMENT`、`buildReportMarkdown()` |
| `src/pages/ReportPage.tsx` | ✅ 新建 | 总览（**不给总分 / 百分比 / 整体合规**）+ 三张实验卡（状态 / 问题 / 修复 / 证据 / WCAG 依据 / 未检查范围 / 回实验页入口）+ 需人工验证条目 + 会话性与台账语义说明 + 复制 / 下载 / 清空 |
| 跨路由真实汇总 | ✅ 浏览器实测 | 首页 → 色彩（建议 + 应用）→ 表单（修复）→ 键盘（Tab 三轮 + 修复 + Tab 三轮 + 确认）→ 报告 `3 / 3`、`3 / 3`、`3 / 3`、`3 项`；色彩 `#767676 / #ffffff` `4.48:1 → 4.54:1`、表单 `2 项 → 没有发现问题`、键盘 `3 次 / 3 次` 且「是：由你点击「我已完成观察」记录，不是程序自动判定」 |
| 未运行 ≠ 0 项 | ✅ | 只跑表单时 `1 / 3` + 「尚未记录的实验：色彩对比度实验、键盘焦点实验」；空台账 `0 / 3` + 6 处「未记录」文案 |
| 失效语义同步 | ✅ 集成测试 + 浏览器 | 撤销 → 「已检测当前配色，尚未生成修复建议」且不再出现 `4.54`；表单重置 → 「已检测，尚未修复」；键盘重置 → 「尚未记录到键盘体验」；只生成建议 → 绝不写成「已应用」 |
| 页面 / Markdown / 剪贴板 / 下载同源 | ✅ 三层证明 | 单测（Blob 文本 === textarea）+ 集成（`writeText` 入参 === textarea）+ 真实浏览器（交给 `writeText` 的字符串逐字相同、下载 `AccessLab-成果报告-20261118114209.md` 5165 B `matchesTextarea: true`） |
| 剪贴板诚实性 | ✅ | headless 下 `clipboard.readText()` 被浏览器策略拒绝（`NotAllowedError`），**不谎称读回剪贴板**；改用「写入入参 + 落盘文件」两侧比对取证 |
| 清空需明确确认 | ✅ 浏览器实测 | 第一下进入确认态（记录仍在、复制仍可用）→ 取消保留 `3 / 3` → 确认 `0 / 3` + 播报；触发按钮变禁用态后焦点交给状态提示本身，不掉回 `<body>` |
| 无后端 / 无存储 | ✅ | `Page.reload` 后 `0 / 3`，`localStorage` / `sessionStorage` 键数 `0`，无 Cookie；请求只有 `/`、两个 `assets`、`/favicon.svg` |
| 安全 | ✅ | 纯文本渲染，无 `dangerouslySetInnerHTML`、不执行任意 HTML/JS、不保存示例表单输入、下载在浏览器本地拼装 |
| 报告页自身可访问 | ✅ | 标题层级 `[1,2,3,2,3,4,4,3,4,4,3,4,4,2,3,2]`（一个 `h1`、无跳级）；唯一 `role="status"` + `aria-live="polite"` + `aria-atomic="true"`；控件全有可读名称；状态带图标 + 文字不只靠颜色 |
| 移动端代码块 | ✅ 浏览器实测 | 320 / 390 / 768 / 1440 `pageOverflow: false`；长代码由 `<pre>` 自身 `overflow-x: auto` + `min-w-0 max-w-full` 承担（320 下 `scrollWidth 659 > clientWidth 246`） |
| 路由与入口 | ✅ | `#/report` 深链 / 刷新 / 前进后退；导航第五项「成果报告」实测全部 `height ≥ 44px`（宽 48–104px）、键盘聚焦 `solid 3px` 环可见；首页保持「三张实验卡 + 一句轻量入口」，报告不是第四个实验 |
| **本轮集成测试抓到的真实缺陷** | ✅ 已修 | 重新进入 `#/keyboard` 时异步检测让 effect 跑第二遍，把保留的记录覆盖成「尚未记录」；改为 `report === null` 时**不消费**首挂载跳过标记 |
| 遗留 #10 `#main` 焦点可见性 | ✅ 关闭 | 去掉 `<main>` 的 `outline-none`；真实按键：首个 Tab 站点是「跳转到主要内容」（环可见）→ Enter 后 `activeElement === <main id="main">` 且 `getComputedStyle` 读到 `solid 3px … offset 2px`，截图 `shot-00-skip-link-and-main-focus.png` |
| 遗留 #11 favicon 404 | ✅ 关闭 | 新增 `public/favicon.svg` + `index.html` `<link rel="icon">`；`/favicon.svg` → `200`，不再请求 `/favicon.ico`，整轮 `console-messages: []` |
| **单元测试总计** | ✅ **254/254**（16 文件） | Day 5 净增 55 条（`experimentLedger` 16 / `reportModel` 11 / `ReportPage` 17 / `App.report` 11，后者是**整棵 `App` 的跨路由真实流程**）；旧 199 条一条未删未放宽 |
| 生产构建 | ✅ 通过 | `tsc -b` + 2104 modules → `index.html 0.67 kB` + **`index-C9lhVihd.js` 359.92 kB**(gzip 108.20) + **`index-9irSWUca.css` 27.62 kB**(gzip 6.09) |
| Day 1 / 2 / 3 / 4 回归 | ✅ 浏览器实测 | 色彩 `4.48 → #cccccc 1.61 → #111111 18.88 达到 AA → 非法输入沿用上次有效 → 重置 4.48`；表单 `SPAN/labels 0 → LABEL/htmlFor/labels 1/label.control===input → 重置`；键盘 `3 次 / 3 次` + 确认播报逐字正确 |
| 真机读屏 / 无痕目视 / 真实剪贴板成功分支 / OS 级减弱动效 | ⛔ 待人工 | 同 §2.5 末行；报告页另需人工确认「读屏念出的报告结构顺序」 |

### 2.8 Day 4 + Day 5 公网发布与公网实测（本轮，经用户两级授权）

| 项 | 状态 | 证据 |
| --- | --- | --- |
| Day 4 + Day 5 提交 | ✅ `691a160` | `feat: add keyboard focus lab and unified report`（31 files，+5994/−42）；**不含** `.qoder.site` 描述符与 `.qoder.zip`；未推送远程、未改写历史 |
| `prepare_site` | ✅ `descriptorStatus: written` | 新 action `3217dd18-1ce3-4eda-bf53-71bc2de71b25`、`webDirectory: dist`、`spa: true`、同 `projectId`；首返 `pending` → 就绪后同 action 同输入重试恢复描述符，未重复上传 |
| `publish_site` | ✅ **`published: true`** | `publishOperationId 01a1ed0c-65ec-…`、`operation.state: succeeded`、`committed: true`、`readiness: publication_completed` |
| 访问权限 | ✅ `access_mode: public` | 匿名 curl 200；响应头无 `Set-Cookie` / `Location` / `WWW-Authenticate`（仅 OSS 自身头） |
| 线上 = 本地 | ✅ 逐字节 | `index-C9lhVihd.js` 359923 B、`index-9irSWUca.css` 27627 B、`favicon.svg` 232 B 三个资源 `cmp` 全部 identical；Day 3 的 `index-AFw0dV32.js` 现 **404** |
| 公网功能实测 | ✅ 通过 | 真实浏览器：色彩 `4.48 → 应用 4.54 达到 AA`；表单 `SPAN/labels 0 → LABEL/labels 1/label.control===input`；键盘真实 Tab 轨迹 8 站 → 三个示例按钮、修复前 `3 次 / 0 次` + `outline: none` + 确认按钮 `disabled`，修复后读到 `solid 3px rgb(67, 56, 202) offset=3px`、后轮 `5 次`、确认后结语逐字命中；报告 `3/3`、`3/3`、`3/3`、`3 项` |
| 公网导出实测 | ✅ 通过 | `writeText` 入参与 textarea 逐字相同；真实落盘 `.md` **10893 B === 编码后 textarea 字节数**，解码比对 `identical: true`；状态区如实写「没有上传到任何服务器」 |
| 公网 390 视口 | ✅ 通过 | `scrollWidth === clientWidth === 390`、`pageOverflow: false`；长代码块内部滚动（`659 > 316`） |
| 公网 skip link / `#main` | ✅ 通过 | `Page.reload(ignoreCache)` 后首个 Tab 站 = `A[href="#main"]`「跳转到主要内容」`solid 3px` + `:focus-visible`；Enter 后 `MAIN#main`（`tabindex="-1"`）环 `solid 3px … offset=2px`；台账回到 `0 / 3` |
| 公网会话性 | ✅ 通过 | 硬刷新后 `0 / 3`、9 处「未记录」、复制禁用、`localStorage` / `sessionStorage` 键数 `0` |
| 控制台 | ✅ 干净 | 两轮公网实测 `console: []`（含异常监听）；`/favicon.svg` 200 |
| 取证脚本缺陷订正 | ✅ 已重跑 | ① 比对漏 `return` 导致首轮「下载 ≠ textarea」假阴性；② `Page.navigate` 到同一 URL 是文档内跳转、不重载，焦点起点残留在 `<summary>` 上导致 skip link 首站误判 —— 均为脚本问题，修正后结论如上 |
| 无痕浏览器 / 真机读屏人工确认 | ⛔ 待人工 | 本轮是匿名 curl + headless Chromium，不等于评委设备上的无痕浏览器目视与读屏实测 |

### 2.9 Day 6 产品体验与视觉精修（本地开发 + 本地取证；随后已发布上线，源码已入库，见 2.10）

| 模块 | 状态 | 证据 |
| --- | --- | --- |
| 首页首屏（A1） | ✅ | 标语保留 + 「给谁用 / 解决什么 / 怎么体验」三组 `<dl>`；唯一实心主按钮「开始第一个实验」→ `#/contrast`，其余出口降为下划线文字链接；无夸大表述 |
| 首页对比案例（A2） | ✅ | 「修复后」由写死 `#595959` 改为调用实验页同一套 `suggestTextColor('#777777','#ffffff')` → `#767676`；两栏各自「比值 + 图标 + 达到 / 未达 AA」，卡片下写明 SC 1.4.3 普通文本 ≥ 4.5:1；真实浏览器 320 宽下 `comparisonCards: 8`、`overflow: 0` |
| 三张实验卡一致（A3） | ✅ | `ExperimentCard` 统一 `p-5` / `rounded-xl` / hover 边框 / `transition-colors`；主链接加 `sr-only`「 · 标题」区分三条同名链接；摘要改为用户语言；无进度 / 徽章 / 奖励 |
| 实验间「下一步」（B1） | ✅ 新建 `NextStepCard` | 色彩 →「下一步：让输入框拥有正确的标签」→`#/form-label`；表单 →「下一步：体验键盘焦点」→`#/keyboard`；键盘页唯一一条「查看统一成果报告」→`#/report`（页面内已无第二个报告出口，源码只 1 处 `linkLabel`） |
| 动线不新增机制（B2） | ✅ | 纯 `<a href="#/…">`：不自动跳转、不设门槛、不写台账、不改路由表；真实浏览器连点三步 hash 与 `h1` 依次为 `#/contrast / #/form-label / #/keyboard` |
| 首屏三段结构（B3） | ✅ | 三页首屏统一「你会遇到什么 / 你要做什么 / 修好能看到什么」；WCAG 依据与检查范围 / 未检查项未删除，收进说明区与 `<details>` |
| 反馈位置（C1） | ✅ | `notice` 改为 `{ area, text }`：修复 / 重置 / 重检播报在操作区旁、复制播报紧贴代码块；无固定底部 toast；**事件处理与台账逻辑未改**（旧 254 条 + 新 20 条共同守住）；单测断言提示节点不在 `position: fixed` 容器内 |
| 状态说法统一（C2） | ✅ | 检测未完成 / 发现问题 / 达到当前检查目标 / 已应用修复 / 等待人工验证；「已应用修复」处处带范围限定；状态图标 + 文字不只靠颜色 |
| 代码块（C3） | ✅ | `<pre>` 统一 `min-w-0 overflow-x-auto`；真实浏览器四档视口 **0 个**代码块撑破页面；展示代码仍与真实 DOM / 注入样式表同源，未引入编辑器 |
| 报告口径改名（D1） | ✅ | 页面统计标签、每实验阶段名、Markdown 汇总、帮助文字共用「已进行修复后复核（含人工键盘体验）」，解释文本单一来源 `REVERIFIED_HELP`；页面已无「已重新验证」这一统计说法；**`reVerified` 判定规则未改** |
| 未检查项阈值（D2） | ✅ | `UNCHECKED_SCOPE` 写明 1.4.3 普通 4.5:1 / 大文本 3:1、1.4.6 AAA 7:1 / 大文本 4.5:1、1.4.11 非文本 ≥ 3:1，并新增「色彩实验只判内置一对普通文本 AA」的边界说明 |
| 报告可读性（D3） | ✅ 浏览器实测 | 首屏 lead「这次会话登记了 3 / 3 个实验的成果，其中 3 个真正改动了页面，1 个已由你本人确认」+ 四项计数 `3/3、3/3、3/3、3 项`；三张卡结构一致；仍需人工验证单独成组；空台账 `0 / 3` 有引导；两句诚实声明逐字保留 |
| 跨路由台账 | ✅ 浏览器实测 | 首页 → 色彩（建议 + 应用）→ 表单（修复）→ 键盘（Tab 三轮 + 修复 + Tab 三轮 + 确认）→ 报告 `3 / 3`；切走再切回仍 `3 / 3`，同页刷新 `0 / 3` 且复制 / 下载禁用 |
| 真实修复痕迹 | ✅ 浏览器实测 | 表单「是否真的改过 DOM = 是：姓名那行已从普通文本换成带 `for` 的 `label`，随后重新读取真实 DOM」、修复后问题「没有发现问题」；键盘缺陷态真实 Tab 聚焦 `outline: none 3px`、修复态 `solid 3px` + `:focus-visible` 为 `true` |
| 导出同源 | ✅ 浏览器实测 | 页面 / 复制 / 下载三份 Markdown 5651 字符；真实落盘 `AccessLab-成果报告-20261118211631.md` **12047 B === textarea 编码后 12047 B** |
| 四档视口与键盘（E） | ✅ 浏览器实测 | 320 / 390 `overflowPx: 0`，768 / 1440 `-15px`（滚动条）；导航未压正文；320 / 390 可交互元素 `≥ 44px`，768 / 1440 仅 5 个顶部导航链接 36px；连续 Tab 前五站焦点环 `solid 3px offset 2px`；Shift+Tab 7 站回到 skip link，Enter 后 `activeElement === main#main` |
| 减弱动效 | ✅ CDP 仿真 | `reduce` → `scroll-behavior: auto`、`transition: 1e-05s`；`no-preference` → `smooth` / `0.15s`；状态不靠动画承载 |
| **单元测试总计** | ✅ **274/274**（17 文件，7.52s） | 本轮净增 `src/App.day6.test.tsx` 20 条（覆盖用户列的 11 项行为）；旧 254 条**一条未删未放宽** |
| 生产构建 | ✅ 通过 | `tsc -b` + 2105 modules → `index.html 0.67 kB` + **`index-gw0uvRiw.js` 368.99 kB**(gzip 110.43) + **`index-DgYwPq9n.css` 27.97 kB**(gzip 6.15)；相对 Day 5 +9.07 kB JS / +0.35 kB CSS，来源为 NextStepCard 与新增文案 / 结构，**依赖零变化** |
| 控制台 | ✅ 干净 | 整轮真实浏览器取证 `error / warning: 无`（含异常监听） |
| 截图 | ✅ 12 张（临时目录，不入库） | 修改前后对照：`b1-keyboard-broken-focus-1440.png` ↔ `c5-keyboard-fixed-1440.png`；另有首页 / 色彩 / 表单 / 报告 1440 与 `d1-home-320 / d2-contrast-320 / d3-form-390 / d4-keyboard-390 / d5-report-390` |
| 真机读屏 / 无痕目视 / 真实剪贴板成功分支 / OS 级减弱动效 | ⛔ 待人工 | 同 §2.5 末行；本轮同样未能覆盖 |

### 2.10 Day 6 公网发布与公网实测（用户授权「更新 site」后执行）

| 项 | 状态 | 证据 |
| --- | --- | --- |
| 发布动作 | ✅ 同一站点、未建新站 | `get_context` 复用 `projectId 01a1e498-acb7-…` / `siteId 01a1e498-acba-…`；`prepare_site` 新 action **`b7ea5f56-2e7b-4735-b1f1-ef6c050e09bc`**（`webDirectory: dist`、`spa: true`）→ 首返 `pending` → `get_publish_status` 就绪（`canPublish: true`、`blockers: []`）→ 同 action 同输入重试拿到 `descriptorStatus: written` → `publish_site` → `published: true`、`operation.state: succeeded`、`committed: true`、`readiness: publication_completed` |
| 访问权限 | ✅ 仍是 `public` | `get_publish_status.site.access_mode: public`、`auth_integration_status: not_required`；匿名 curl `200`，响应头无 `Set-Cookie` / `Location` / `WWW-Authenticate`（**未把私有站点改成公开**） |
| 线上 = 本地 | ✅ 逐字节 | 线上 `index.html` 引用 `index-gw0uvRiw.js` + `index-DgYwPq9n.css`；两者下载后与 `dist/assets/` `cmp` **identical**（368996 B / 27977 B）；Day 5 的 `index-C9lhVihd.js` 现 **404** |
| 公网真实浏览器重跑 | ✅ 通过 | 同一套脚本 `LIVE_URL=` 指向公网域名：`Edg/157.0.4341.60`，**15 步 / 机械耗时 7.1 秒**；五条 hash 深链各自独立渲染正确 `h1`；首页主按钮 → `#/contrast` →「下一步」→ `#/form-label` →「下一步」→ `#/keyboard` → 报告 |
| 公网功能读数 | ✅ 通过 | 报告首屏 lead「这次会话登记了 3 / 3 个实验的成果，其中 3 个真正改动了页面，1 个已由你本人确认」；四项 `3/3、3/3、3/3、3 项`；色彩 `4.48:1 → 4.54:1`；表单「修复后 没有发现问题」+「是否真的改过 DOM = 是」；键盘 `3 次 / 3 次` 且「是：由你点击「我已完成观察」记录」 |
| 公网导出 | ✅ 通过 | Markdown 5651 字符；真实落盘 `AccessLab-成果报告-20261118212713.md` **12047 B === textarea 编码后 12047 B**（脚本读到的是浏览器尚未改名的 `.crdownload` 中间态，落定后为同名 `.md`）；复制提示与下载提示文案如实 |
| 公网会话性 | ✅ 通过 | 切走再切回仍 `3 / 3`；同页 `Page.reload` → `0 / 3` 且复制 / 下载按钮回到禁用 `[true,true,true]` |
| 公网四档视口 | ✅ 通过 | 320 / 390 `overflowPx: 0`，768 / 1440 `-15px`（滚动条）；导航未压正文；代码块 **0 个**撑破页面；320 可交互元素全 ≥ 44px，1440 仅 5 个导航链接 36px（遗留 #16） |
| 公网键盘缺陷态与焦点环 | ✅ 通过 | 缺陷类名 `kf-demo-btn--broken` 真实 Tab 聚焦 `outline: none 3px`；修复后 `solid 3px` + `:focus-visible` 为 `true`；注入表只命中 `.kf-demo-btn*`；外壳 skip link / logo / 四条导航 `solid 3px offset 2px`；Shift+Tab 7 站回到 skip link，Enter 后 `activeElement === main#main` |
| 公网减弱动效 / 控制台 | ✅ 通过 | `reduce` → `scroll-behavior: auto`、`transition: 1e-05s`；整轮 `error / warning: 无` |
| 公网截图 | ✅ 12 张 | `.day6-evidence/shots-live/`（`b1-keyboard-broken-focus-1440` ↔ `c5-keyboard-fixed-1440` 为线上修改前后对照，另有 `d1..d5` 窄屏）；`report-live.md` / `report-live.json` / `run-live.log` 同目录，均**不入库** |
| 源码与历史的对应 | ✅ 已闭合 | 公网取证跑完后，你以 **`82ecef4 11-18阶段性提交`**（56 files，+6743/−165，作者 cpp1107，21:27:51）把 Day 6 源码 / `NextStepCard.tsx` / `App.day6.test.tsx` / 三份治理文档入库，`git status -- src` 干净 ⇒ **线上产物与 HEAD 源码一一对应**；同一提交也把 `.day6-evidence/`（41 个取证文件，含两张 `.md` 落盘样本）与 Sites 描述符 `.qoder.site` 一起纳入版本库——与原先「取证产物不入库」的约定不同，是否继续跟踪由你决定 |
| 无痕浏览器 / 真机读屏人工确认 | ⛔ 待人工 | 本轮是匿名 curl + headless Edge，不等于评委设备上的无痕浏览器目视与读屏实测 |

### 2.11 Day 7 综合质量与无障碍专项验收（本地开发 + 取证完成；未提交、未发布）

| 项 | 状态 | 证据 |
| --- | --- | --- |
| A1 首页 320px 主操作偏低 | ✅ 已闭合 | `src/pages/HomePage.tsx` 把唯一主按钮提到核心价值句之后；320×568 顶边 **499px**（< 568 折线内）、390 为 470px、768 为 356px、1440 为 408px；品牌句「让网页的障碍，看得见、改得掉。」、三张实验卡、「给谁用 / 解决什么 / 怎么体验」与 Hack4Good 说明一条未删；`href="#/contrast"` 的主按钮全页唯一 |
| A2 报告人工验证三态 | ✅ 已闭合 | `reportModel.ts` 拆出 `pendingManual` / `confirmedManual` / `extraVerification` + `manualVerificationGroups()`；真实点完三实验并确认后读数 `1 项 / 1 项 / 3 项`，「你还没有点『我已完成观察』」不再出现、改为「实验内已确认：键盘焦点实验」；未确认时同一处变回 `2 项 / 0 项 / 3 项`；撤销键盘实验后确认项归零、待完成提示如实回来；额外验证一栏没有任何「已完成」状态可挂 |
| A2 数字与条目同源 | ✅ 已闭合 | 页面 `<h4>（N 项）</h4>` 与同组 `<ul><li>` 数量逐组相等（20 组视口 + jsdom 双向断言）；Markdown 里同一批标题与条目逐字出现；三处都来自同一份数组，不是手抄期望值 |
| A3 导航 44px | ✅ 已闭合 | `AppHeader.tsx` 去掉宽屏那条 `sm:min-h-9`（它把导航从 44px 压回 36px），五条链接全断点统一 `min-h-11` + logo 链接补 `min-h-11`，并微收容器 `gap` / `padding` 让页头不变高（宽屏实测仍 65px）；320 / 390 / 768 / 1440 × 5 路由共 **20 组实测 `[44,44,44,44,44]`**；文案、顺序、图标、`aria-current` 未变。措辞口径：44px 是项目自设目标（对应 SC 2.5.5 AAA 建议），SC 2.5.8 的规范最低值是 24px，**不声称小于 44px 必然违规** |
| B1 焦点交接（本轮新发现的真缺陷） | ✅ 已修复 | 修复前真实按键下五个动作（生成建议 / 应用修复 / 撤销 / 修复标签关联 / 修复焦点指示）之后 `activeElement` 都是 `<body>`；改为结果块 `tabindex="-1"` + `focus()` 后，焦点分别落在「建议 · 尚未应用」块、「修复已应用」块、「已撤销本次修复…」、「标签关联已修复…」、「已应用焦点修复」，下一次 Tab 落在同区下一个可用控件；结果块不进 Tab 顺序、不新增播报区、位置仍在原 section 内 |
| B1 其它键盘项 | ✅ 通过 | skip link 首站 `solid 3px offset 2px` → Enter 后 `activeElement === <main id="main">`；缺陷态示例按钮真实 Tab 后仍 `outline: none`（教学缺陷未被破坏）；`Enter` / `Space` 都能激活示例按钮且不使键盘到达计数膨胀；Shift+Tab 反向可达；「重置实验」清零计数且不误触发焦点交接 |
| B2 语义与可访问性树 | ✅ 静态证据到手 / ⛔ 读屏未验证 | 五路由 `h1` 各 1、标题层级无跳级、`nav[aria-label="主导航"]`、`aria-current="page"` 唯一、无名可交互控件 0；`Accessibility.getFullAXTree`：**`banner` / `navigation` / `main` / `contentinfo` 各 1 个** ⇒ 实验页内层 `<header>`（DOM 计数 2）不会被暴露成第二个 banner 地标。**没有真机读屏，不得声称 NVDA / VoiceOver 通过** |
| B3 WCAG 边界 | ✅ 未越界 | 全站无总分、无「合规认证」说法；报告页仍逐字写着「本报告仅针对 AccessLab 内置示例，不是网站 WCAG 合规认证。」；44px / AA 4.5:1 / 非文本 3:1 的规范归属在文档与页面里写清 |
| C 三实验 + 报告回归 | ✅ 通过 | `4.48 → 4.54 → 撤销回 #777777 / 4.48`；非法 `#12zz` → `aria-invalid` + 描述文案 + 修复区暂停 + 生成按钮消失、旧建议不复活；表单 `input.labels` 0 → 1、点 label 聚焦输入框、复检「没有发现问题」；键盘鼠标不计入次数、两轮各 `3 次`、确认按钮门控生效；切走再切回 `3 / 3`、**重进键盘实验不覆盖其它两项**、刷新 `0 / 3` 且导出禁用；清空 / 取消 / 确认三条路径焦点与播报正常 |
| D1 四档视口 × 五条路由 | ✅ 20 组通过 | 横向溢出 320 / 390 = `0`、768 / 1440 = `-15px`（滚动条）；**小于 24px 的可点击目标 0 个**；`h1` 均在页头之下；代码块未撑破页面 |
| D2 浏览器兼容 | ✅ Edge 157 + Chrome 158 / ⛔ 其它未验证 | 两台 Chromium 内核各跑一遍完整链路，读数逐项一致：`:focus-visible`（Tab 有环 `solid 3px rgb(67,56,202)` / 鼠标无环）、`writeText` 载荷 6197 字符 === 页面 Markdown、落盘 `.md` 13577 B === UTF-8 字节数、深链与 `back/forward`、320 无溢出、控制台 0 错误。**Firefox / Safari / WebKit / 真机移动浏览器：未验证** |
| D3 构建 / 体积 / 请求 / 控制台 | ✅ 通过（无 Lighthouse） | 4 个文件、`JS 372750 B / gzip 110277 B`、`CSS 29485 B / gzip 6256 B`、`index.html 678 B`、`favicon 232 B`；整页首载**属于本应用的请求 4 个全 2xx**、hash 切换 **0 请求**、`console error / warning / exception = 0`、`longtask = 0`；loopback 计时 DCL 114–118ms（**本机数字，不代表公网，也不出 Lighthouse 分数**）。另：本机浏览器注入的本地安全组件请求（`/<guid>/main.js`、`/to/wsm.*`）已从应用口径中剔除并单独记录 |
| 线上 vs 本地 | ⚠️ 线上落后一个构建 | 只读核对 `get_site`：`lifecycle: active`、`access_mode: public`，匿名 GET 仍引用 `index-gw0uvRiw.js`(368996 B) + `index-DgYwPq9n.css`(27977 B)，两者 `200` + `content-encoding: gzip`；本地新构建是 `index-mFcMtZD3.js` / `index-CFHpowcy.css` ⇒ **Day 7 未上线**（构建通过 ≠ 公网发布成功）。**11-19 11:14 已发布并逐字节核验，线上 = 本地同一构建，见 §2.14** |
| 测试与构建 | ✅ 295/295 | `npx tsc --noEmit` 干净；`npm test` **18 文件 / 295 条全绿**（Day 6 的 17/274 零删改，净增 `src/App.day7.test.tsx` 21 条）；`npm run build` 通过 |
| Git 与发布 | ⛔ 等你确认 | 本轮**未执行**任何 `git add` / `commit` / `push` / 发布动作；Day 6 遗留的未提交文档改动完整保留（见 §3「仓库状态」） |

### 2.12 Day 8 最终复验 + 参赛交付材料（零源码改动；已提交方案与发布方案，等你授权）

| 项 | 状态 | 证据 |
| --- | --- | --- |
| A1 工作空间核查 | ✅ 无意外改动 | HEAD 仍是 `82ecef4`（与 `origin/main` 一致、无未推送提交）；工作区改动 = Day 7 的 7 个源码文件（**+207/−45**）+ `src/App.day7.test.tsx`（未跟踪，479 行 / 21 条）+ 三份治理文档 + Sites 描述符；`package.json` / `package-lock.json` **未被改动**，无新增依赖 |
| A1 质量闸门复跑 | ✅ 通过 | `npx tsc --noEmit` 干净；`npm test` **18 文件 / 295 条全绿**；`npm run build` 通过；压缩产物里 `#/`、`#/contrast`、`#/form-label`、`#/keyboard`、`#/report` **五条路由全在** |
| A1 可复现构建 | ✅ 哈希一致 | 先 `rm -rf dist` 再重建 → `index-mFcMtZD3.js` **372750 B** / `index-CFHpowcy.css` **29485 B**，与 Day 7 记录**逐字符相同**（gzip 110277 B / 6256 B；`index.html` 678 B、favicon 232 B） |
| A2 Day 7 修复存在性 | ✅ 四项均在 / **未重复修改** | grep：`reportModel.ts:134-138/458-482/506-521` 三态分组、`AppHeader.tsx:23/45/46` 全 `min-h-11` 无 `sm:min-h-9`、`HomePage.tsx:135/148` 品牌句 + 主按钮、五处 `tabIndex={-1}` + `focus()`（`ContrastLabPage.tsx:545/577/606`、`FormLabelLabPage.tsx:442`、`KeyboardFocusLabPage.tsx:534`、`ReportPage.tsx:457`） |
| A3 Git 提交方案 | 📋 已备好，**未执行** | 见 §5.3 第 1 条：两次提交（功能 + 文档）+ 三项待你决定的入库范围（描述符 / `.day7-evidence/` / `.day8-evidence/`+`submission/`）+ 是否推送 |
| A4 Sites 发布方案 | 📋 已备好，**未执行**（只读核查过） | 只读 `get_site`：`siteId 01a1e498-…`、`lifecycle: active`、`access_mode: public`、`auth_integration_status: not_required`；**未新建站点**、未改访问范围 |
| B1 评委动线复跑 | ✅ 无回归 | Edge 157 + CDP 真实按键：`4.48 未达 AA → 4.54 达到 AA`、表单 `labels 0 → 1` 且复检「没有发现问题」（电子邮箱全程通过）、键盘两轮各命中 3 个示例按钮 `before=3 / after=3`、报告 `3/3、3/3、3/3、1 项、3 项`、`countsMatch=true`；机械耗时 **6287ms**（Day 7 同链路 5023ms，属量测抖动）——**脚本操作时间，不是评委体验时长** |
| B1 缺陷态未被破坏 | ✅ 确认 | 键盘实验三个示例按钮真实 Tab 后实测 `outline: none 3px`（`:focus-visible` 命中但无环），修复后才变 `solid 3px rgb(67, 56, 202) offset 3px` |
| B2 焦点交接复跑 | ✅ 六动作全通过 | 生成建议 → `div`「建议 · 尚未应用」→ 下次 Tab「应用该修复」；应用 → `div`「修复已应用」→「撤销本次修复」；撤销 → `p`「已撤销本次修复，文字颜色恢复为 #777777。」→「进入表单标签实验」；修复标签关联 → `p`「标签关联已修复…」→「重置实验」；**重置实验 → 焦点留在自身（不误交接）**；修复焦点指示 → `p`「已应用焦点修复…」→「重置实验」。`isBody` 全 `false` |
| B2 非法输入 / 过期建议 | ✅ 行为正确 | `#12zz` → `aria-invalid=true` + 两条描述文案 + 修复区「存在无效颜色，修复功能已暂停」+ **生成按钮消失**；改 `#7b7b7b` 后实时对比度变 `2.29:1` 但**复制按钮 present=false**（旧建议不自动复活） |
| B3 会话性 | ✅ 与设计一致 | 切路由 `3 / 3`、重进键盘实验不覆盖他项（`3 次` 保留）、**刷新回 `0 / 3` 且三个导出按钮全禁用**；不写 `localStorage` / 后端 |
| B4 20 组视口矩阵 | ✅ 全通过 | 5 路由 × 320 / 390 / 768 / 1440：横向溢出集合 `{0, -15}`（320/390 = `0`，负数是桌面滚动条宽度）、越界元素 **0**、小于 24px 可点击目标 **0**、代码块撑破 **0**、`h1` 全在页头之下；首页主按钮 `ctaTop` 320=499 / 390=470 / 768=356 / 1440=408，**四档 `inFold` 全 true**；导航高度集合 **`{44}`** |
| B 语义（DOM 计数） | ✅ 通过 / ⚠️ 口径说明 | 五路由 `h1` 各 1、标题**无跳级**、`nav[aria-label="主导航"]`、`aria-current="page"` 唯一、无名称可交互控件 **0**。本轮只重跑 DOM 计数（实验页内层 `<header>` 使 DOM `header=2`），**`banner=1` 那条是 Day 7 的可访问性树结论，本轮未重跑 AX 树** |
| B 控制台 / 网络 | ✅ 干净 | 三趟运行 `console error = 0`、`warning = 0`；整场动线 93 个请求（含本机浏览器注入的本地安全组件）**non-2xx = 0**；属于本应用的资源 4 个、loopback DCL 90ms（本机数字，不代表公网，**不出 Lighthouse 分数**） |
| B 导出 | ✅ 同源 / ⛔ OS 回读未验证 | 复制载荷 **6197 字符 === 页面 textarea** 逐字一致（鼠标与键盘 Enter 两条路径分别通过）；`.md` 真实落盘 13577 B === UTF-8 字节数 `identical=true`；OS 剪贴板 `readText()` 回读 6425 字符 ≠ 6197 ⇒ **人工粘贴回读仍标未验证** |
| 参赛材料 | ✅ 已产出 | `submission/` 当时 **6 份**（README / forum-post / demo-script / demo-checklist / evidence-index / final-checklist，约 105 KB）；长版帖含官方要求的五部分、**8 处配图标记引用 10 张真实存在的 PNG**、4 处身份占位符（另 2 处过程凭证需自行截取）。**11-19 收口轮增至 7 份**（新增正式提交优先用的精简版 `forum-post-final.md`，全套约 112 KB / 1475 行），见 §2.13 |
| 取证截图 | ✅ 14 张同源 | `.day8-evidence/shots-post/`（13 张 1440×900 + 1 张 320×567 手机首屏），由 `capture-shots.mjs` 在同一条连续会话里拍摄，数值与 JSON 读数同一趟运行。**已剔除一张会误导的取景**：键盘两张最初定位到页面下方静态示意图卡片，改为把真正聚焦的元素居中后重拍 |
| ⚠️ 线上 vs 本地 | ⛔ **P0：公网仍是 Day 6** | Day 8 再次匿名 `curl`：线上 `index.html` 引用 `index-gw0uvRiw.js` + `index-DgYwPq9n.css`，本地 Day 7 的 `index-mFcMtZD3.js` / `index-CFHpowcy.css` 在线上是 **`404`** ⇒ **评委现在看到的仍是修之前的四个问题**；本轮的截图来自**本地构建**，不可当成公网效果。**发帖与录视频都必须排在发布之后**。**11-19 收口轮第三次复确认，状态未变** ⇒ **11-19 11:14 本条作废：已发布，公网回归逐跑通过，见 §2.14** |
| Git 与发布 | ⛔ 等你逐项授权 | Day 8 **同样未执行** `git add` / `commit` / `push` / 发布；`.day8-evidence/`（30 个文件 2.4 MB）与 `submission/`（现 7 个文件约 120 KB）当前**未跟踪** |

### 2.13 2026-11-19 收口轮｜参赛材料事实口径修正 + 精简版参赛帖（零源码改动）

> 本轮**不增加实验、不重构、不重做设计**，只做四件事：重跑闸门留档、修正材料里站不住的表述、
> 产出正式提交用的精简帖、把 Git 与发布方案定稿到"批准即可执行"的程度。逐条记录见 `DEVLOG.md` 末条。

| 项 | 状态 | 证据 / 说明 |
| --- | --- | --- |
| 质量闸门复跑 | ✅ 通过 | `npx tsc --noEmit` 无输出（10:36）；`npm test` **18 文件 / 295 条全绿**、14.53s、0 失败 0 跳过（10:36）；`npm run build` 2105 modules / 481ms（10:37） |
| 可复现构建（第三轮 + 改后复跑） | ✅ 哈希一致 | `index-mFcMtZD3.js` **372750 B** / `index-CFHpowcy.css` **29485 B** / `index.html` 678 B / favicon 232 B，与 Day 7、Day 8 上午**逐字符相同**；本轮文档与材料改完后 **11:06** 再跑一遍（tsc 0 / 295 全绿 / build 403ms）**哈希仍不变 ⇒ 连续四轮**，实证本轮改动确实只在文档 |
| 关键数值独立复算 | ✅ 数字属实 | 另写脚本按 WCAG 2.2 相对亮度公式重算：`#777777`/`#FFFFFF` = **4.4781**（< 4.5 ⇒ 未达 AA）、`#767676`/`#FFFFFF` = **4.5422**（≥ 4.5 ⇒ 达到 AA）、黑白 **21.00** ⇒ 帖子引用的三个比值与判定都不是写死的 |
| A1 时间口径修正 | ✅ 已改 | 「2026-11-16 → 11-19 共 8 天」**不成立**（本文档与 DEVLOG 的章节日期即证据：Day 1–3 在 11-16/17，Day 4–7 在 11-18，Day 8 在 11-19）⇒ 统一为**「4 个自然日、8 个开发阶段」**；已同步 `forum-post.md`、`forum-post-final.md`、`README.md`、`final-checklist.md` |
| A2 键盘证据口径修正 | ✅ 已改 | 「真实物理 Tab」→「**自动化脚本向真实浏览器发送 Tab 键事件**，验证焦点变化、键盘顺序与修复前后的计算样式」；同步 `forum-post.md`（图注 + 第五部分）、`evidence-index.md`（§1.6 三张图 + 顶部新增「证据口径统一定义」）、`demo-script.md`（新增「口径区分」）、`final-checklist.md`（E 组 + 走查项"搜『真实物理』应为 0"）、本文件（§2 表头 + 遗留 #4）、`DEVLOG.md`（两处历史记录就地更正并保留当日实况）。**未贬低既有证据**：真实内核 + CDP 的键盘取证仍成立，只是不再说成实体键盘或读屏实测 |
| A3 第一人称经历 | ✅ 已改 | 删除/改写无法证实的个体历史（"我以前基本没想过""我读过 WCAG""我试过几种学习方式""`SC 1.4.3` 我背下来了"）→ 客观项目观察；需要第一人称处一律加**【请本人按真实经历确认或改写后再发布】**（`final-checklist.md` D5）；三段"使用者的感受"前加**「这是从缺陷推出的后果，不是用户访谈或真实用户测试的结论」**。**未新增**任何调研、访谈、用户反馈或影响数字 |
| A4 无障碍声明自检 | ✅ 已限定 | 两处加限定：产品"可只用键盘走通/焦点环始终可见"→ 明确为真实浏览器键盘事件 + DOM 与 AX 树核对；"遵守 `prefers-reduced-motion`"→ 明确为 CDP 媒体仿真下不播动效，**系统级开关的实际观感未人工复核**。核对无误保持原文的：报告非认证声明（`src/lib/reportModel.ts:26`）、色彩只判 SC 1.4.3、SC 2.5.8(24px) 与 SC 2.5.5(44px/AAA) 的口径区分、未检查项逐条列出 |
| 新产物 `submission/forum-post-final.md` | ✅ 已产出 | 实测 **五部分正文 2834 汉字**、含「附：数据与边界」**3200 汉字**、整份 **3538 汉字 / 181 行**（建议区间 1800–2500，超出部分是必须保留的证据与边界声明，按"真实证据需要可适度增加、不机械截断"处理；初稿曾达 3996 汉字）。`【Hack4Good】` 标题 + 帖首公网链接与账号占位 + 官方要求的五部分 + 数据与边界 + 帖尾链接；**6 处配图标记引用的 8 张 PNG 逐个 `test -f` 验证过真实存在**（`.day8-evidence/shots-post/` 的 01 / 03 / 04 / 06 / 08 / 09 / 10 / 12）；Qoder 会话截图与终端截图**标「待补充」不用别的图冒充**；正文不含"最新版已上线/视频已录好/认证已通过"。长版 `forum-post.md`（**6338 汉字 / 361 行**，8 处配图标记引用 10 张 PNG）**完整保留** |
| Git 与发布方案 | 📋 定稿，**未执行** | 四组提交分组与逐组文件清单见 `submission/final-checklist.md` **I-1**，发布链路与回退见 **I-2**。本轮只读核对（`git status` / `git diff --stat` / 匿名 `curl` / 只读 `get_site`），**未执行** `git add` / `commit` / `push` / `reset` / `rebase`，**未调用** `prepare_site` / `publish_site` |
| 源码 | ✅ 零改动 | `src/`、测试、`package.json` / `package-lock.json`、`.gitignore` **一字未动**（闸门全绿 ⇒ 按"测试与构建正常时禁止无意义修改核心源码"执行） |
| 敏感信息 | ✅ 未发现凭据 | 对 69 个未跟踪文件扫描 `access_key` / `secret_key` / `bearer` / `authorization` / `x-oss-security-token` / `password` / `private key` / `-----BEGIN` ⇒ **0 命中**。仅剩两处本地绝对路径（`.day7-evidence/verify6.mjs:9`、`part6-perf.json:2`，Windows 用户名），与已入库的 6 个 `.day6-evidence/` 文件同一口径，**入库前可选择先把脚本改成可移植路径** |

### 2.14 2026-11-19 11:14 · 公开发布 + 公网回归取证（用户授权「site 更新一下，git 我提交」）

**已发布**：新 action `a8ffa344-a7c6-4982-a5d8-5d54524d4d68`、同一 `projectId 01a1e498-acb7-796a-a96d-1c22a6cee214` / `siteId 01a1e498-acba-79ec-8703-a119defbf0f6`、**未建新站、未改访问范围**；
`prepare_site(pending) → get_publish_status(ready / canPublish / 无 blocker) → 同 action 重试(written) → publish_site → published: true`、`operation.state: succeeded`、`committed: true`。

| 公网核验项 | 结果 |
| --- | --- |
| 版本切换 | 线上 `index.html` 引用 `index-mFcMtZD3.js` + `index-CFHpowcy.css`；**旧 `index-gw0uvRiw.js` 已 `404`**；`last-modified` = 发布时刻、`cache-control: no-cache`。**本行已被 §2.15 的第二次发布取代**（这两个资源现已 `404`） |
| 逐字节 | 两个资源线上 `200`（372750 B / 29485 B）与本地 `cmp` **完全一致**，SHA-256 两组分别相同 |
| 静态与深链 | `/`、`/index.html`、`/#/report`、`/?day7=deep#/keyboard` 全 `200`；`favicon.svg` `200 / 232 B` |
| **五条路由冷启动深链**（11:30 新探针 `probe-public-deeplinks.mjs`） | 每个路由用**全新 target** 直接加载 `<站点>/index.html#/xxx`：`location.hash` 与 `h1` 一一对应（`让网页的障碍，看得见、改得掉。` / 色彩对比度实验 / 表单标签实验 / 键盘焦点实验 / 统一成果报告）、`main` 各 1、skip link `href="#main"`「跳转到主要内容」五页全在、`window.onerror` **0 条** ⇒ 深链不依赖先访问首页 |
| 三实验（真实浏览器 + CDP，指向公网） | 色彩 live region `4.48:1 未达 AA → 4.54:1 达到 AA` 且提示含 `#767676`；键盘两轮各命中 3 站 `before=3 / after=3`；报告 `3/3、3/3、3/3、1 项、3 项`、`countsMatch=true` |
| 表单真实 DOM（新探针） | 修复前 `input.labels = 0` → 修复后 **`1`**，DOM 为 `<label for="student-name">姓名</label>`，**已输入内容未清空** |
| 焦点环（新探针） | 缺陷态公网实测 `outline-style: none`；修复后 **`solid 3px rgb(67, 56, 202)` / `offset 3px`**，且修复后首个 Tab 停靠点是结果块 ⇒ B1 焦点交接在公网生效 |
| 导出 | 复制 6197 字符 === 页面 textarea（鼠标与键盘两条路径）；`.md` 落盘 **13577 B === 字节数**、`identical=true` |
| 会话性 | 切路由 `3/3`、重进键盘不覆盖、**刷新回 `0/3` 且导出禁用** |
| 20 组视口 | 溢出 `{0, -15}`、小于 24px 目标 **0**、导航 **44**、首页主按钮四档 `ctaFold=true`（320 = 499） |
| 控制台 / 网络 | 75 请求 **non-2xx = 0**、**error / warning / exception 全 0** |
| 前后退 | `#/contrast → #/report → 后退 → 前进` 路由与页名均命中 |

**公网上的新发现（如实记录）**：托管层会注入一个带可聚焦链接与「隐藏水印」按钮的水印浮层，
①它曾盖住按钮坐标导致鼠标点击命中水印（改用 `focus()` + 真实 Enter 才通过）；
②公网 Tab 序列因此多出 `qoder-sites-badge` 停靠点 ⇒ **"公网 Tab 序列 = 本地 Tab 序列"不成立**，涉及 Tab 停靠点数量的表述要限定为产品自身 DOM。
另：CDP 没有 `Input.enable` 方法（探针首跑因此报错）。

**公网上仍未验证**（不声称）：真机读屏、Firefox / Safari、真机手机与公网性能分数、系统级减弱动效观感、OS 剪贴板人工粘贴回读（公网复测仍是写入一致、回读 6425 字符不一致）、无痕目视。

**Git 一律未动**（你说「git 我提交」）：未 `add` / `commit` / `push`；描述符已由工具改写为新 action（**+12/−12**）但**仍在工作区**，等你随 I-1 的 ④ 组提交。
工作区实测：`11` 个已跟踪文件被改（源码 **+207/−45** 未变、治理文档 **+800/−51**、描述符 +12/−12），`80` 个未跟踪文件（`src/App.day7.test.tsx` + `.day7-evidence/` 31 + `.day8-evidence/` **41** + `submission/` 7）。
产物：`.day8-evidence/` 新增 `judge-flow-live.json`、`viewport-live.json`、`public-labels-focus.json`、`public-deeplinks.json`、`run-*-live.log` 两份、`probe-public-labels-focus.mjs`、`probe-public-deeplinks.mjs`，**未覆盖任何本地既有证据文件**。

### 2.15 2026-11-19 11:49 · 重建哈希漂移的根因、`src/index.css` 构建隔离修复、第二次发布与公网复测（**本轮唯一的产品文件改动**）

**发现**：§2.14 之后核对 `dist/`，从当前仓库重建得到 `index-B61kabqi.js`(372750 B) / `index-ea8UcgoS.css`(30444 B)，
与刚发布的 `index-mFcMtZD3.js` / `index-CFHpowcy.css`(29485 B) **不是同一份** ⇒「仓库重建 = 线上产物」当场失效。

**根因（逐字节比对定位，不是猜）**：JS 两份 `cmp` **零差异**；差异全在 CSS，逐条规则做集合差只多三条工具类
`.shadow` / `.transform` / `.transition` —— 它们**不是页面用到的样式**，而是 Tailwind v4 默认扫描整个仓库时，
把 `.day7-evidence/` 快照与 `.day8-evidence/public-labels-focus.json`（平台水印注入脚本的 class 字符串）里的文字当成了类名候选。
`vite.config.ts` 未设 `content` / `sources`，所以扫描范围 = 全仓库。项目此前已为 `.md`、`*.{test,spec}.{ts,tsx}`、
`src/lib/keyboardFocusDemo.ts` 做过同样隔离，这次是同一类泄漏的第三种形态。

**修复（经用户选择「保留修复并重新发布」）**：`src/index.css` **+7 / −0**

```css
@source not "../.day*-evidence/**";
@source not "../**/*.{json,jsonl,log}";
```

| 项 | 11:14 线上 | 11:49 线上 | 差异 |
| --- | --- | --- | --- |
| JS | 372750 B `index-mFcMtZD3.js` | **372750 B** `index-aTyl07hG.js` | **逐字节相同** |
| CSS | 29485 B / gzip 6256 B | **28219 B** / gzip 6078 B | **−1266 B / −178 B，全是死代码** |
| `index.html` / favicon | 678 / 232 B | 678 / 232 B | 相同 |

死代码清单：16 条选择器 / 2632 B —— `.visible`、`.ring,.ring-1`、`.blur` 与 13 个
`@property --tw-blur / --brightness / --contrast / --grayscale / --hue-rotate / --invert / --opacity /
--saturate / --sepia / --drop-shadow{,-color,-alpha,-size}`；新增 1 条 `.ring-1`（同声明重分组）。
核对手段两条：① `src/` 下**不存在任何 `.json` / `.log` / `.md`** ⇒ 被排除的候选只可能来自取证与文档；
②「新产物 ∩ 线上旧产物」的交集**没有任何一条规则被移除**。逐条差异与两份 CSS 原文留档
`.day8-evidence/rebuild-check/`（`live.css` / `new.css` / `removed-rules.txt` / `removed-selectors.txt`）。

**本地行为回归（同一份 `dist/`，`vite preview` @127.0.1:4181）**：`tsc` 0、`npm test` 18/295 全绿、
评委动线读数逐项相同（4.48→4.54 / `labels 0→1` / `outline none→solid 3px` / 三组 1·1·3 / 下载 13577 B）、
20 组视口 20/20 通过 ⇒ `viewport-clean.json`、`judge-flow-clean.json`、`rebuild-check/run-*-clean.log`。

**第二次发布**：`prepare_site` action `d0a23be7-ad65-4e46-b6a7-67db593506c8` → `written` →
`publish_site` → `published: true` / publishOperation `01a1f1ec-f388-7629-b711-ee3ea249174e` /
`state: succeeded` / `committed: true`（同一 `projectId` / `siteId`，未新建站点）。
核验：线上引用两个新哈希、`cmp` 零差异（CSS `Content-Length: 28219`、`last-modified` 11:49:28、`no-cache`）、
**上一版 `index-mFcMtZD3.js` 与 `index-CFHpowcy.css` 均 `404`**；发布前两次干净重建哈希一致 ⇒ 可复现。

**公网复测（11:50–11:51，headless Edge 157）与 11:14 基线逐项对比**

| 复测 | v2 结果 | 与基线的差异 |
| --- | --- | --- |
| 20 组视口 | 20/20 通过、溢出 0、焦点环可见、skip link 首站、`h1=1`、地标齐全、`Enter`/`Space` 都触发 | **JSON 递归对比 0 处差异；两份日志 `cmp` 完全相同** |
| 评委动线 | 三实验读数、报告三组 1/1/3、复制 6197、下载 13577 B、焦点交接四项 `true`、控制台 0 | 仅 5383→5267 ms、下载文件名时间戳、两处点击坐标 ±4 px |
| 网络 | 74 请求 / `non2xx=0` / 控制台 0；PERF 记录 `index-Co1Kujov.css` + `index-aTyl07hG.js` | 上一版 75 请求（少一次，`non2xx` 仍 0）；资源名与计时变化 |
| 表单 + 键盘真实按键 | `labels=0→1` + `for="student-name"` + 值仍是「张三」；缺陷态 `none 3px`、修复后 `solid 3px rgb(67,56,202)` `offset 3px` | 逐项一致；水印仍加两个 `qoder-sites-badge` Tab 停靠点 |
| 五条深链冷启动 | 五路由全部 `ok=true`（hash 保持 / `main=1` `footer=1` `nav=1` / skip link `href="#main"` 在 / JS 错误 0） | 与 11:29 逐项一致 |

产物：`viewport-v2.json`、`judge-flow-v2.json`、`v2-public-labels-focus.json`、`v2-public-deeplinks.json`、
`shots-v2/`（3 张）、`downloads-v2/`（1 份 .md）、日志 `rebuild-check/run-*-v2.log`。
**两处如实说明**：① 这四条命令第一次跑在了 `.day8-evidence/rebuild-check/` 里，而脚本用 `process.cwd()` 推导输出目录，
证据先落进一个嵌套目录——读数仍有效（`LIVE_URL` 模式下浏览器加载的就是公网），已移入 `.day8-evidence/` 且**不覆盖任何已有文件**；
② `.day8-evidence/public-labels-focus.json` 在 11:19 重跑时被同名覆盖过，§2.14 记的 10:21:50 快照
**只存在于 DEVLOG 的文字记录里**，当前公网的同名取证结果另存为 `v2-public-labels-focus.json`。后续探针一律带版本后缀。

**结论**：「从仓库 HEAD 重新构建 = 线上产物」**重新成立**，且产物比修复前少 1266 B 死代码。
教训：**构建产物必须只由源代码决定**——否则每多存一份取证，可复现性承诺就悄悄失效一次，而没有任何测试会报错。

## 3. 链接与命令

- 站点地址：https://accessibility-lab-3g6uvbn5duq.qoder.zone （**公开可访问，且线上已是最新构建** `index-aTyl07hG.js` + `index-Co1Kujov.css`：11-19 11:49 第二次发布，匿名 `curl` + `cmp` 与本地逐字节一致，公网 CDP 复测与 11:14 基线除计时外零差异，见 §2.15。action `d0a23be7-ad65-4e46-b6a7-67db593506c8`、publishOperation `01a1f1ec-f388-7629-b711-ee3ea249174e`，同一 `projectId` / `siteId`，**未建新站、未改访问范围**；11:14 那次 action 为 `a8ffa344-a7c6-4982-a5d8-5d54524d4d68`）
- 本地开发：`npm run dev` ｜ 预览产物：`npm run preview` ｜ 测试：`npm test` ｜ 构建：`npm run build` → `dist/`
- 真实浏览器取证脚本：Day 4 / Day 5 跑在系统临时目录（当时用完即弃）；Day 6 放进仓库内的 **`.day6-evidence/`**（43 个文件，已随 `82ecef4` 入库）；Day 7 放进 **`.day7-evidence/`**（**当前未跟踪**，是否入库等你决定）。
  `.day7-evidence/` 内容（31 个文件）：`verify.mjs`（D1 20 组视口 + B1 Tab 地图 + B2 语义）、`verify2.mjs`（评委动线 / 播报抖动 / 导出 / 会话性 / Enter·Space 激活）、`verify3.mjs`（三实验逐项回归 + 报告清空）、`verify4.mjs`（五个主操作的焦点落点 + 非法输入 + 过期建议）、`verify5.mjs`（**Edge 与 Chrome 各跑一遍**：可访问性树 + `:focus-visible` + 剪贴板 + 落盘 + 深链 / 前进后退 + 320 目标尺寸）、`verify6.mjs`（两台浏览器的请求与计时）、`dist-size.mjs`（产物体积）、`check-online.mjs`（线上只读核对）、`diag-keyboard.mjs` 与 `probe-experience.mjs`（两条排查用一次性探针）；
  结果 `part1.json`…`part6-perf.json` 共 8 份（`part5` 分 `part5-edge` / `part5-chrome`，另有 `probe-local.json`）、`shots/` 12 张 PNG、`downloads-chrome/AccessLab-成果报告-20261118232920.md`（真实落盘样本 13577 B；`downloads/` 已被后续运行清空）。
  驱动方式：Microsoft Edge 157 / Google Chrome 158 headless + 原生 CDP（`Input.dispatchKeyEvent` 真实按键、`Input.dispatchMouseEvent` 命中校验后点击、`getComputedStyle` 真实级联、`Accessibility.getFullAXTree`、`Emulation` 切视口、`Page.setDownloadBehavior` 真实落盘、`Network.*` 数请求）。
  复用方式：`node .day7-evidence/verify5.mjs`（默认 Chrome，`BROWSER_BIN=<msedge 路径> OUT_NAME=part5-edge.json DEBUG_PORT=9342` 可换浏览器）；本机 `node` 不在 PATH，需先 `export PATH="/d/Soft_Ware:$PATH"`。
  Day 8 的证据放在 **`.day8-evidence/`**（**当前未跟踪**，30 个文件约 2.4 MB）：`run-viewport.mjs` / `run-judge-flow.mjs` / `run-focus-handoff.mjs` 三条脚本由 Day 7 的 `verify.mjs` / `verify2.mjs` / `verify4.mjs` **最小改动派生**（只换输出目录、调试端口、临时目录前缀与文件名，逐行 diff 已核对）；`capture-shots.mjs` 是新写的截图器，在同一条连续会话里按评委动线顺序截图。
  结果 `viewport.json`（20 组视口 + Tab 地图 + 语义计数）、`judge-flow.json`（动线 / 播报 / 导出 / 会话性 / 控制台 / 网络 / 前后退）、`focus-handoff.json`（六个主操作的焦点落点 + 非法输入 + 过期建议）、`post-readings.json`（发帖用读数快照）、`run-*.log` 3 份、`shots/` 5 张、`shots-post/` **14 张**（13 张 1440×900 + 1 张 320×567）。
  ⚠️ 一处已知损失：`run-judge-flow.mjs` 与 `run-viewport.mjs` 共用 `downloads/` 目录且各自先 `rmSync`，最后跑的视口脚本清掉了本轮落盘的 `AccessLab-成果报告-20261119094129.md`；`judge-flow.json` 里已记录文件名、13577 B 与 `identical=true`，Day 7 的同尺寸样本 `downloads-chrome/AccessLab-成果报告-20261118232920.md` 仍在。
- 参赛材料：`submission/`（**当前未跟踪**，**7 份**全中文）——`README.md`（材料总览）、**`forum-post-final.md`（正式提交优先用的精简版，正文 2834 汉字 / 含附录 3200）**、`forum-post.md`（详细技术版，6338 汉字，保留作答辩与复盘材料）、`demo-script.md`（60–90 秒分镜，**尚未据此录制**）、`demo-checklist.md`（录前 A–H 检查表，A1 是阻塞项）、`evidence-index.md`（证据索引 + §7 待补充清单）、`final-checklist.md`（资格 / 占位符 / 未验证项 / 发帖前走查 / 授权汇总 + **I-1 提交分组 / I-2 发布方案**）。两份帖子是**同一份事实的两种篇幅**，不是两个版本的事实。
- 仓库状态：HEAD = **`82ecef4 11-18阶段性提交`**（你本人于 21:27:51 提交，56 files，+6743/−165；`refs/heads/main` 与本地 HEAD 一致，无未推送提交）；其下依次是 `691a160`（Day 4 收尾 + Day 5）、`474a30b` / `11a43bd` / `7067ec4`（Day 3 治理与发布记录）、`737ceb7`（Day 3 功能）、`943a3ac`（Day 2 稳定版）。历史未被改写，Day 7 / Day 8 两轮都只读取状态，**未执行任何 Git 写操作**。
  工作区当前状态（`git status --short`）：**已跟踪的修改** = `.AccessLab 无障碍实验室.qoder.site`、`DEVLOG.md`、`PRD.md`、`PROJECT_STATUS.md`（Day 6 发布记录遗留 + Day 7 段落 + **本轮 Day 8 / 11:14 发布 / 11:49 第二次发布段落**）+ **Day 7 的 7 个源码文件**（`src/components/AppHeader.tsx` +3/−3、`src/lib/reportModel.ts` +107/−17、`src/pages/ReportPage.tsx` +28/−6、`src/pages/ContrastLabPage.tsx` +24/−2、`src/pages/HomePage.tsx` +15/−15、`src/pages/FormLabelLabPage.tsx` +15/−1、`src/pages/KeyboardFocusLabPage.tsx` +15/−1，合计 **+207/−45**，全天一字未改）+ **`src/index.css` +7/−0**（11:49 构建隔离）⇒ 产品源码共 **8 个文件 +214/−45**；**未跟踪** = `src/App.day7.test.tsx`（479 行 / 21 条）、`.day7-evidence/`、`.day8-evidence/`、`submission/`。
  Day 6 / Day 7 的文档改动**未被覆盖或丢弃**：本轮是在它们之后追加 Day 8 段落。`dist/` 在 `.gitignore` 里（产物从不入库，任何时候 `npm run build` 可从对应 commit 重现，Day 8 的哈希一致性就是这条的实证）。
  建议提交方案（**等你逐项确认，我不会自行执行**；完整逐组文件清单见 `submission/final-checklist.md` **I-1**）：
  ① `fix: close day7 accessibility and focus-handoff gaps` —— Day 7 的 7 个源码文件（**+207/−45**，全天复测数字未变）+ 新增 `src/App.day7.test.tsx`（未跟踪，479 行 / 21 条）。**若要严格分组，11:49 的 `src/index.css` +7/−0 可单拆一次 `build: exclude evidence files from tailwind content scan`**；
  ② `docs: finalize accesslab verification and submission materials` —— `PRD.md` / `DEVLOG.md` / `PROJECT_STATUS.md`（11:55 实测 **+1002/−51**）+ `submission/`（7 份 140 KB，含新增 `forum-post-final.md`）；
  ③（建议一并，或单独一次 `test: archive day7 and day8 browser verification evidence`）—— `.day7-evidence/` **31** 文件 1.5 MB + `.day8-evidence/` **73** 文件 4.8 MB（含 `-live` / `-clean` / `-v2` 三组取证、`rebuild-check/` 逐字节比对目录与 `downloads-os/` 找回样本），与已入库的 `.day6-evidence/` 口径一致；
  ④ `chore: record day8 site publication descriptor` —— `.AccessLab 无障碍实验室.qoder.site`：**前置条件已满足**（11:14 与 11:49 两次发布都完成，工具已把它改写成第二次 action `d0a23be7-…`），`+12/−12`、不含密钥，**现在提就是最终态**。
  `DEVLOG.md` 里 Day 6 §6 / Day 7 / Day 8 / 收口轮四段是文件末尾的**同一条连续新增 hunk**，硬拆成多次提交需手写补丁逐 hunk 暂存（可行但脆弱），故三份治理文档合并在 ② 这一组。
  **建议排除**：`dist/`（已在 `.gitignore`，产物不入库）、`node_modules/`、`coverage/`、`*.tsbuildinfo`；本轮无需改动 `.gitignore`。
  回退路径：**`git checkout 82ecef4` → `npm run build` → `prepare_site` 新 action → `publish_site`** 才能把 Day 6 重新变回当前版本；重复 `publish_site` 旧 action（`3217dd18-…` / `b7ea5f56-…`）不能让历史版本重新上线。
- **术语口径（11-19 收口轮统一）**：本文件与 DEVLOG 里凡「真实按键 / 真实浏览器 Tab」均指
  **自动化脚本经 CDP `Input.dispatchKeyEvent` 向真实浏览器内核（Edge 157 / Chrome 158）发送按键事件后读取的 `activeElement`、焦点顺序与 `getComputedStyle`**。
  它能证明真实内核的焦点变化与计算样式，**不能**证明真人手按实体键盘的观感，也**不等于**读屏实测。
  历史记录中的「真实物理 Tab」已就地更正为该准确术语并保留当日实况；`demo-script.md` 里"录制必须用真实物理键盘"是**对尚未录制的视频**的要求，不是对既有证据的声称。
- 环境提醒：`node` 不在系统 PATH，会话内需 `export PATH="/d/Soft_Ware:$PATH"`（node v25.2.1 / npm 11.6.2，测试与构建实测正常）。可用浏览器：Edge `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`（157.0.4341.60）、Chrome `C:/Program Files/Google/Chrome/Application/chrome.exe`（158.0.8127.37）；**本机没有 Firefox / Safari**，所以非 Chromium 内核本轮无法验证。


## 4. 遗留问题

| # | 问题 | 影响 | 建议处理 |
| --- | --- | --- | --- |
| 1 | ~~Day 3 改动未提交~~ ✅ 已提交 `737ceb7`（经用户确认，不含 `.qoder.site` 描述符） | — | 如需推送远程由人工决定 |
| 2 | ~~Day 3 未发布~~ ✅ **已发布**（新 action `15adaa32-…`，`published: true`，线上 JS 与本地 `cmp` 逐字节一致） | — | 无痕浏览器 / 评委设备目视仍由人工确认；回退请用「`git checkout 943a3ac` 或 `737ceb7` → `npm run build` → 新 action 发布」，不要指望重复 `publish_site` 旧 action 能让旧版本重新上线 |
| 3 | ~~320 / 390 横向溢出与 44px 触控目标在本环境不可测~~ ✅ 已实测通过（Day 3 复核轮 + Day 4 四档视口 + Day 5 报告页四档） | — | Day 5 重测 320 / 390 / 768 / 1440：`pageOverflow: false`，长代码块由 `<pre>` 内部滚动承担；导航与控件实测 `height ≥ 44px` |
| 4 | ~~真实浏览器 Tab 键事件序列未取到证据~~ ✅ **Day 4 已完整取证**（术语已修正：原写作「真实物理 Tab」，实为自动化脚本向真实浏览器发送键盘事件） | — | 按键事件走完 skip link → logo → 5 条导航 → 示例按钮 → 实验控件 → 离开实验区；每站同时读 `getComputedStyle` 与 `:focus-visible` 匹配 |
| 5 | ~~Day 4（含收尾轮）+ Day 5 改动尚未提交、尚未发布~~ ✅ **已提交 `691a160` 并发布**（action `3217dd18-…`，`published: true`，线上三个资源与本地 `cmp` identical，公网功能实测通过） | — | 公网实测结论见 §2.8 与 DEVLOG「Day 4 + Day 5 公网发布与公网实测」；回退用「`git checkout 474a30b` → `npm run build` → 新 action 发布」 |
| 6 | 真机读屏（NVDA / VoiceOver / TalkBack）仍未验证；**OS 剪贴板回读**在本环境不可靠 | Day 7 已把「交给 `clipboard.writeText` 的字符串与页面 Markdown 逐字一致」在 Edge 157 + Chrome 158 上各证明一次（鼠标点击与键盘 Enter 两条路径都是 6197 字符），无头环境 `readText()` 回读到 6425 字符 ≠ 报告内容 ⇒ **「粘贴出来是什么」标未验证**；读屏同理 | 人工在真机各点一次复制（键盘 + 鼠标）并粘贴核对；用读屏走一遍报告页三组人工验证的朗读顺序与五个动作后的焦点交接 |
| 7 | OS 级 `prefers-reduced-motion` 未验证（本轮用 CDP 媒体仿真） | 系统设置下的观感仍属推断 | 在系统「减少动效」开关下复核焦点环与示例区 |
| 8 | Qoder 内置浏览器无可视表面（`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`） | 无法在应用内面板出图取证 | 需要应用内截图时，先由用户打开 In-app Browser 面板；本轮改用 headless Edge + CDP |
| 9 | 焦点环对比度按「浅色实心按钮 + 单色环」计算（7.90 / 7.55 / 7.07 ≥ 3:1） | 深色填充按钮上同色环会失效，页面已把这条坑写进 §4 | 如需演示深色底，另加一条「环 + 内环」双描边示例，并同步实测数值 |
| 10 | ~~外壳 `<main>` 自身聚焦时没有可见环~~ ✅ **Day 5 关闭**：去掉 `outline-none`，真实按键实测 `activeElement === <main id="main">` 且 `outline: solid 3px … offset 2px`，skip link 落点行为不变 | — | 报告页 / 三个实验页均已回归过 Tab 首站与落点 |
| 11 | ~~应用没有 favicon，`/favicon.ico` 404~~ ✅ **Day 5 关闭**：新增 `public/favicon.svg` + `index.html` `<link rel="icon">`，实测 `/favicon.svg` `200`、控制台 `[]` | — | 发布后确认线上标签页图标正常 |
| 12 | 检测器可见性判定不读盒模型尺寸（Day 3 遗留） | CSS 位移 / 透明度隐藏的标签检不出来 | 已作为已知限制写在页面向评委说明 |
| 13 | 播报区数量：色彩页 3 个、表单页 2 个、键盘页 2 个 `role="status"`，报告页仍唯一 1 个。**Day 7 补一条实测**：色彩页「生成修复建议」这一步不写入任何 live region（前后 live 文本都是「当前对比度 4.48:1 未达 AA」），键盘用户靠 B1 的焦点交接自己读到结果块，**读屏是否播报未被证明** | 严格「全站单区」口径可能被判多区；好处是提示出现在用户正在看的位置，且各区只播自己的内容、互不覆盖 | 属 C1 的有意取舍（事件处理与台账未改）；「生成建议」要不要加 `aria-live` 是产品决策（会与既有读数区双播报），等真机读屏结果再定，本轮不动 |
| 14 | `node` 不在 PATH、node v25.2.1 超出 vitest 引擎声明 | 新会话直接 `npm` 会 `node: not found` | 会话内 `export PATH="/d/Soft_Ware:$PATH"` |
| 15 | 台账是「会话级」：刷新即清空，且实验页路由切换后回到自身初始状态 | 评委若刷新报告页会看到 `0 / 3`，可能误读成「实验没做」 | Day 6 已把空状态改成「先去哪个实验」的引导；如需跨刷新保留，须另行确认是否引入 `sessionStorage`（本轮按约束不引入任何存储） |
| 16 | ~~768 / 1440 宽下顶部 5 个导航链接实测高 **36px**~~ ✅ **Day 7 关闭（A3）**：去掉 `sm:min-h-9`、全断点统一 `min-h-11`，320 / 390 / 768 / 1440 × 5 路由共 20 组实测全部 44px，文案与视觉层级未变 | — | 口径提醒：44px 是项目自设目标（SC 2.5.5 为 AAA 建议），SC 2.5.8 的规范最低值是 24px，**不得声称小于 44px 必然违反 WCAG** |
| 17 | 「已进行修复后复核」这一列在三个实验里的判定不同构（色彩不要求「清零」，表单要求复检 `issueCount === 0`，键盘要求修复后有 Tab 到达） | 同一句统计说法覆盖面不等宽；规则沿用 Day 5 未改 | 按 D1 要求单独上报；若要同构化需用户先确认，并同步调整 Day 5 的 `experimentLedger` / `reportModel` 测试 |
| 18 | 未提交改动分四批：Day 6 的发布与公网实测记录（`DEVLOG.md` §6、`PROJECT_STATUS.md` §2.10、Sites 描述符）、Day 7 的全部代码 / 测试 / 文档段落、Day 8 的复验与参赛材料段落，**与 11-19 收口轮的口径修正 + 精简版参赛帖**都还没进 Git；`.day7-evidence/`、`.day8-evidence/`、`submission/`（7 份）全部未跟踪 | 只翻 `82ecef4` 的人看不到 Day 6 公网取证、Day 7 的四项修复、Day 8 的复验与参赛材料，也看不到修正后的事实口径 | 分组已定稿为**四组**（见 `submission/final-checklist.md` **I-1** 与 §5.3 第 1 条）：① `fix:` Day 7 的 7 个 `src` 文件 + `src/App.day7.test.tsx`；② `docs:` 三份治理文档 + `submission/`；③ 建议一并提交两个未跟踪取证目录（沿用已入库 `.day6-evidence/` 口径）；④ 描述符留到发布之后单独提。`DEVLOG.md` 四段是文件末尾同一条连续 hunk，硬拆需逐 hunk 暂存（可行但脆弱），故治理文档合一组。**Day 7 / Day 8 / 收口轮三轮均未执行任何 Git 写操作** |
| 19 | ~~**线上落后一个构建**~~ **已于 11-19 11:14 关闭，11:49 又发第二版**：公网现引用 `index-aTyl07hG.js` + `index-Co1Kujov.css`，与本地逐字节一致，Day 7 的 A1 / A2 / A3 / B1 已上线 | 评委打开线上地址看到的**已是**修复后的四件事（320 主按钮在首屏、报告人工验证分三组、导航 44px、动作后焦点不落回 body），公网逐项回归见 §2.14 | 剩余动作只有：**配图建议对公网重拍一遍**（现有截图来自本地构建，数值一致），以及**在 `82ecef4` 之上提交 Day 7/8 改动**让线上内容可追溯（你说自己提交，我未动 Git）|
| 20 | 非 Chromium 内核完全没跑过：本机只有 Edge 157 与 Chrome 158，**没有 Firefox / Safari**，也没有真机移动浏览器 | Firefox 的 `:focus-visible` 与滚动条、Safari 的 `outline` 默认样式与下载行为都属推断 | Day 8 如需，请在装有 Firefox / Safari 的机器上 `BROWSER_BIN=<路径> node .day7-evidence/verify5.mjs` 重跑；在那之前文档与页面都不得写「跨浏览器已验证」 |
| 21 | 本机浏览器会注入与站点无关的本地安全组件请求（`/<guid>/main.js`、`/init`、`/to/wsm.sessionActivated`、`/to/wsm.onHashChange`，Edge 与 Chrome 同样出现） | 若不排除，会把「应用每次切路由发一个请求」误报成产品缺陷；本次已按路径白名单剔除 | 换机器重跑时先看一眼 `part6-perf.json` 的 `injectedSample`，确认剔除口径仍成立 |
| 22 | 取证目录与描述符的入库口径待你定：`.day6-evidence/`（43 个文件）已随 `82ecef4` 进历史，`.day7-evidence/`（脚本 + 6 份 JSON + 12 张截图 + 1 份落盘 `.md`，约 1.5 MB）目前**未跟踪**；`.AccessLab 无障碍实验室.qoder.site` 已被跟踪且每次发布都会变 | 入库 → 参赛材料可追溯到具体 commit；不入库 → 仓库更干净但证据只存在于本机 | 沿用 Day 6 口径就一并提交（都不含密钥、Cookie 或表单输入数据）；如需从历史里剔除 `.day6-evidence/`，需要你另行授权 |


> 注意：不要在同一天同时推进多个实验模块；保留已通过验收的模块，避免无关重构。

## 5. 参赛前风险清单与下一阶段任务建议

### 5.1 风险清单（11-19 11:50 公网复测后的真实状态，不含推测）

**P0：无。** 原先唯一一条「公网仍是 Day 6，Day 7 的四个修复没上线」**已于 2026-11-19 11:14 关闭**：
经你授权发布后（11:14 与 11:49 两次），匿名 `curl` 确认线上引用已换成 `index-aTyl07hG.js` + `index-Co1Kujov.css`，两个资源与本地 `dist/` **逐字节一致**，
且评委动线、三实验、报告三态、焦点交接、20 组视口、五条深链已**对公网重跑通过**（见 §2.14），
11:49 因构建隔离再发一次后**又全部复测一遍，除计时外零差异**（见 §2.15）。
> 留存两条口径：① 匿名首页返回 57720 B 而本地 `index.html` 只有 678 B，差值是托管层注入的平台脚本（含水印与埋点），**不是产品回归**；
> 逐字节比对只适用 JS / CSS 两个资源文件。② **资源哈希是时刻性的**：材料里出现过的 `index-gw0uvRiw` → `index-mFcMtZD3` → 现在的 `index-aTyl07hG` 都是同一位置的历史值，引用旧哈希前先看它标的时间。发布前的记录见 §2.11 / §2.12。

产品自身侧从来没有 P0：五条路由可用、三实验 + 报告功能完整、295 条测试与构建全绿且哈希可复现、Chromium 内核端到端通过、站点 `active` + `public` 免登录。

**P1（参赛前应当处理）**

| 风险 | 现状 | 处理 |
| --- | --- | --- |
| Day 6 遗留 + Day 7 + Day 8 + 11:49 构建隔离改动**全部仍未提交** | `HEAD` 仍是 `82ecef4`：**12 个已跟踪文件未提交**（4 份文档 + Sites 描述符 + 8 个产品源码文件，含 `src/index.css` +7 行）；未跟踪 **112** 个文件（`-uall`） | 按 §3 的方案由你本人执行（遗留 #18、`final-checklist.md` I-1） |
| 真机读屏零覆盖 | 只有 DOM 语义 + 可访问性树证据（AX 树是 Day 7 跑的，Day 8 未重跑） | 人工读屏一轮，结论写回文档；对外表述只能说「静态语义已核」 |
| 「复制成功」只证明了写入载荷 | `writeText` 收到的字符串 === 页面 Markdown（6197 字符）；OS 回读拿到 6425 字符的别的内容 | 真机粘贴核对一次即可关闭 |
| 材料里的身份字段还是占位符 | `forum-post.md` 有 4 处 `【请填写…】`（Qoder 账号、学校/专业/年级、天池用户名） | 发帖前由你本人填写，不代填 |
| 比赛截止日期未与官方公告核对 | 材料按「11-30 18:00」排期，来源是公开检索快照，官方页需登录 | 以官方公告为准核对一次，见 `final-checklist.md` A8 |

**P2（可解释、建议留作后续）**

- 色彩页「生成修复建议」不写入任何 live region（遗留 #13）：焦点交接已补，播报层未证明。
- 非 Chromium 内核未验证（遗留 #20）；系统级 `prefers-reduced-motion` 仅用 CDP 媒体仿真验证过。
- 台账是会话级，刷新即 `0 / 3`（遗留 #15，Day 7 / Day 8 两次复测确认仍是设计取舍）。
- 「已进行修复后复核」在三实验里判定不同构（遗留 #17，按约束未改规则）。
- 键盘实验缺陷态 `outline: none` 是教学内容，若被自动化审查工具当缺陷扫出，需要现场解释（页面 §4 已写明）。
- 本机浏览器注入的安全组件请求会污染「请求数」口径（遗留 #21），换机器复测时注意；Day 8 同一次运行里出现过 `main.js?attr=…` 这类注入条目，已按口径剔除。
- Day 8 落盘的 `.md` 样本被后续脚本清空（共用 `downloads/` 目录），仅存 JSON 记录与 Day 7 同尺寸样本；如需留样本，单独重跑 `run-judge-flow.mjs`。

### 5.2 Day 8 任务建议（本轮执行结果）

1. ~~**Git**~~ → **方案已备好、未执行**（见 §5.3 第 1 条），Day 7 的四项修复经复核仍在，无需返工。
2. ~~**发布**~~ → **方案已备好、未执行**（见 §5.3 第 2 条）；只读核对完成。
3. ~~**参赛材料**~~ → ✅ 已完成：`submission/` 六份 + `.day8-evidence/shots-post/` 14 张同源截图 + 4 份 JSON + 3 份日志；`evidence-index.md` §7 逐条列明仍然没有的证据。**11-19 收口轮**：材料增至七份（新增精简版参赛帖），并修正三处事实口径，见 §2.13。
4. ~~**回归复验**~~ → ✅ 已完成：tsc / 295 条测试 / 构建 / 可复现哈希 / 评委动线 / 焦点交接 / 20 组视口 / 控制台与网络，全部通过且无回归。
5. **人工项**（本轮环境做不了，仍待你做）：真机读屏、无痕目视、真实剪贴板粘贴、其它内核浏览器——见 §5.3 第 3 条。
6. 遗留 #17（复核判定同构化）与「跨刷新保留台账」都要先与你确认才动，属规则 / 语义变更，**Day 8 未动**。

### 5.3 待你授权后的剩余动作（Day 8 之后）

1. **Git**（你已明确「git 我提交」⇒ **全部由你本人执行，我未跑任何写操作**）：**11-19 收口轮已把分组细化为四组**，逐组文件清单与两个知情细节见 `submission/final-checklist.md` **I-1**：
   ① `fix: close day7 accessibility and focus-handoff gaps`（7 个源码文件 **+207/−45** + `src/App.day7.test.tsx`；11:49 的 `src/index.css` +7 可单拆一次 `build:`）→
   ② `docs: finalize accesslab verification and submission materials`（三份治理文档 11:55 实测 **+1002/−51** + `submission/` 7 份 140 KB）→
   ③ 建议一并（或单独一次 `test:`）提交 `.day7-evidence/`（**31** 文件 1.5 MB）与 `.day8-evidence/`（**73** 文件 4.8 MB），沿用已入库 `.day6-evidence/` 的口径 →
   ④ `.AccessLab 无障碍实验室.qoder.site` 描述符（**两次发布均已完成，这条现在可以提了**：工具已把它改写成第二次 action `d0a23be7-…`（第一次 `a8ffa344-…`），+12/−12，单独一次 `chore` 最干净）→
   ⑤ 是否推送 `origin/main`（当前 **0 ahead / 0 behind**；提交后再推会把约 **6.3 MB** 取证文件发到远程）。
   授权前如需，可先把 `.day7-evidence/verify6.mjs:9` 与 `part6-perf.json:2` 的本地绝对路径改成可移植写法。
2. ~~**发布**（单独授权）~~ ✅ **已执行**：11-19 11:14 经你「site 更新一下」授权，按 **I-2** 链路发布完成。
   线上引用已变成 `index-aTyl07hG.js` + `index-Co1Kujov.css`、两个资源与本地**逐字节一致**、上一版资源 `404`，
   `.day8-evidence/run-*.mjs` 的 `TARGET` 已指向公网域名重跑一遍并留证（`*-live.json`），判定见 §2.14。
   **公网截图建议仍重拍一遍**（`shots-post/` 的 14 张来自本地构建，数值与线上同源但取景不是公网页面）。**「构建通过」不等于「公网已换成这一版」——本轮是先发布、后核验，不是反过来。**
3. **人工项收口**：真机读屏（报告三组人工验证的朗读顺序、六个动作后的焦点交接、色彩页生成建议是否有播报）、
   无痕浏览器目视、真实剪贴板粘贴核对、（如条件允许）Firefox / Safari 重跑取证脚本。
4. **录视频与发帖**：~~排在第 2 条（发布）之后~~ **发布已完成，两项现已解锁**，随时可做。发帖优先用 `submission/forum-post-final.md`（精简版），
   把 **4 处身份占位符**换成真实信息、**6 处插图标记**换成对公网重拍的真图（现有 8 张是本地构建取景，**发布后重拍**），**两处「待补充」截图不得用别的图冒充**；
   发帖前按 `final-checklist.md` H 组走查一遍（搜「请填写」应为 0、搜「真实物理」应为 0、不得出现"8 天"）。
5. **证据盘点（截至 11-19 收口轮）**：
   - 已有可引用：`.day6-evidence/`（43 文件，已入库）、`.day7-evidence/`（31 文件，未跟踪）、`.day8-evidence/`（30 文件 / 14 张发帖截图，未跟踪）、`submission/`（**7 份**材料，未跟踪）、线上站点公开地址；
   - 演示口径：完整评委动线的机械耗时 **6287ms**（Day 8 本地预览 `judge-flow.json`，Edge 157；Day 7 同链路 5023ms；**公网两轮分别 5383 / 5267ms**，见 §2.14 / §2.15）——由**自动化脚本向真实浏览器发送键盘与鼠标事件**跑完，是脚本操作时间，**不含人阅读时间**，不要写成「3 分钟达标」，也不要说成真人操作耗时；
   - 仍然没有：读屏录屏、真实用户测试、第三方无障碍审计、宣传视频、Logo 设计稿、Lighthouse 分数、Qoder 会话导出截图。
6. 遗留 #17（复核判定同构化）与「跨刷新保留台账」都要先与你确认才动，属规则 / 语义变更。
7. 历史已完成项：~~Day 7 的 A1 / A2 / A3 与 B1 焦点交接~~（见 §2.11，Day 8 已复验无回归）、
   ~~Day 8 质量闸门复跑与可复现构建~~（见 §2.12；11-19 收口轮第三次复跑，哈希仍一致）、~~参赛材料包~~（`submission/` **七份**，见 §2.13）、
   ~~四档视口 × 五条路由矩阵~~（20 组通过，Day 7 / Day 8 各一次）、
   ~~第二台 Chromium 浏览器端到端~~（Edge 157 + Chrome 158）、~~导航 44px~~（遗留 #16 关闭）。


