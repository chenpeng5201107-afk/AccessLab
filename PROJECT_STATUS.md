# AccessLab 项目状态

> 最后更新：2026-11-18（**Day 6 产品体验与视觉精修本地完成，尚未提交、尚未发布**：`npm test` **274/274（17 文件）**、`npm run build` 通过（`index-gw0uvRiw.js` 368.99 kB / `index-DgYwPq9n.css` 27.97 kB），
> headless Edge 157 + CDP 真实复核拿到干净的 `3 / 3` 证据（16 步机械耗时 7.9 秒、下载 `.md` 与 textarea 逐字节相同、四档视口零横向溢出、控制台无 error/warning）。
> **线上仍是 Day 4 + Day 5 构建 `index-C9lhVihd.js`**（公网 `public`，此前已逐字节核对）；Day 6 改动发布前需单独取得用户确认。）

## 1. 当前阶段

**本地 = Day 6 体验精修（未提交）；线上 = Day 4 + Day 5 构建（`public` 免登录）。**
Day 6 不改功能，只改「让人 10 秒看懂、3 分钟走完」：首页首屏换成可扫读的价值表达与唯一主行动、
三个实验页尾尾相接的「下一步」把动线连成一条、四个页面的状态说法与反馈位置统一、报告页统计口径改名为「已进行修复后复核（含人工键盘体验）」并补齐 WCAG 具体阈值。

**线上（尚未含 Day 6 改动）四个实验路由与报告页全部可用：Day 4 的「键盘焦点实验」（`#/keyboard`）带「修复前 / 修复后各自的真实键盘到达次数」门控；Day 5 的「统一成果报告」（`#/report`）把三个实验的会话结论跨路由汇总在同一页，复制 / 下载 / 清空三条出口的内容与页面逐字同源，不给总分也不给合规认证。**

Day 6 范围严格限定在体验与视觉精修：
**未**新增实验 / 依赖 / 路由 / 状态管理、**未**改检测算法与阈值、**未**改事件处理与台账写入的条件与时序、
**未**为统一焦点样式而修掉键盘实验的缺陷态、**未**新增动画 / 图片 / 统计。
Day 1–5 的页面、算法与旧 254 条测试**零回归、零删改**（本轮净增 `src/App.day6.test.tsx` 20 条 → 274 条）。

上一轮（Day 4 收尾 + Day 5）范围回顾：
**未**引入后端 / 数据库 / 登录 / 外部 AI API、**未新增任何依赖**（React 19 + TS + Vite + Tailwind + Vitest 原样）、
**未**重构路由系统（只在既有 hash 表上追加 `#/report`）、**未**做无关视觉重构、**未**移除全站焦点样式。
Day 1 / Day 2 / Day 3 / Day 4 的页面、算法与旧 199 条测试**零回归、零删改**。
顺带关闭两项遗留：`#main` 的焦点可见性（#10）与 `/favicon.ico` 404（#11）。

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
| **真实物理 Tab 序列** | ✅ 本轮可用（原「不可测」） | `press_key Tab` 已能驱动焦点遍历，实测前 5 站顺序正确、`outline: solid 3px indigo / offset 2px`；全页无正值 `tabindex` ⇒ 顺序即 DOM 顺序 |
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

### 2.9 Day 6 产品体验与视觉精修（本轮，本地完成，尚未提交 / 尚未发布）

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

## 3. 链接与命令

- 站点地址：https://accessibility-lab-3g6uvbn5duq.qoder.zone （**公开可访问，线上仍是 Day 4 + Day 5 构建 `index-C9lhVihd.js`，与本地当时产物逐字节一致**；action `3217dd18-1ce3-4eda-bf53-71bc2de71b25`。**Day 6 的体验精修尚未发布，发布需单独取得用户确认，且不创建新站点。**）
- 本地开发：`npm run dev` ｜ 预览产物：`npm run preview` ｜ 测试：`npm test` ｜ 构建：`npm run build` → `dist/`
- 真实浏览器取证脚本（未入库，属临时产物）：`%LOCALAPPDATA%\Temp\accesslab-day4\`（Day 4）与 `%LOCALAPPDATA%\Temp\accesslab-day5-verify\`（Day 4 收尾轮 + Day 5）；Day 6 改放在仓库内的未跟踪目录 **`.day6-evidence/`**（同样不入库，提交时请显式跳过 `git add`），
  内含 `collect.mjs` / `probe-round*.mjs`、`run*.log`、`report.md` / `report.json`、`shots/*.png`（12 张）、`downloads/*.md`。
  驱动方式：Microsoft Edge headless + 原生 CDP（`Input.dispatchKeyEvent` 真实按键、`getComputedStyle` 真实级联、`Emulation` 切视口与媒体特性、`Page.reload` 测刷新、`Page.setDownloadBehavior` 真实落盘）。**这些都不入库。**
- 仓库状态：HEAD = **`691a160` `feat: add keyboard focus lab and unified report`**（Day 4 收尾轮 + Day 5 全部改动，31 files）；历史中 `474a30b` / `11a43bd`（Day 3 治理）、`737ceb7`（Day 3 功能）、`943a3ac`（Day 2 稳定版）均在，**未推送远程、未改写历史**。
  工作区当前有**两类**未提交改动：① Day 4 + Day 5 的治理文档记录（`DEVLOG.md` / `PROJECT_STATUS.md` 的既有部分，非本轮所写）；② **Day 6 体验精修**——
  已改 `src/pages/{HomePage,ContrastLabPage,FormLabelLabPage,KeyboardFocusLabPage,ReportPage}.tsx`、`src/lib/reportModel.ts`、`src/components/ExperimentCard.tsx`，
  新增未跟踪的 `src/components/NextStepCard.tsx`（35 行）与 `src/App.day6.test.tsx`（481 行 / 20 条）。源码侧 `git diff --stat -- src` 为 **7 files，+366/−136**，本轮再向三份治理文档追加 Day 6 内容。
  另有约定**不入库**的 Sites 产物：`.AccessLab 无障碍实验室.qoder.site` 的 `publication` 块（工具写入的云端 ID + base64 冻结 `index.html`）与未跟踪的 `.AccessLab 无障碍实验室.qoder.zip`。
  **Day 6 源码、测试与文档改动都要等用户确认后才建提交**；建议切成 `feat: polish day6 experience and navigation`（源码 + 新测试）与 `docs: record day6 experience polish`（三份治理文档），或按用户偏好合并为一条。
  回退路径：`git checkout 474a30b`（Day 3 源码）→ `npm run build` → **新 action** 发布；重复 `publish_site` 旧 action 不能让旧版本重新上线。
- 环境提醒：`node` 不在系统 PATH，会话内需 `export PATH="/d/Soft_Ware:$PATH"`（node v25.2.1 / npm 11.6.2，测试与构建实测正常）。

## 4. 遗留问题

| # | 问题 | 影响 | 建议处理 |
| --- | --- | --- | --- |
| 1 | ~~Day 3 改动未提交~~ ✅ 已提交 `737ceb7`（经用户确认，不含 `.qoder.site` 描述符） | — | 如需推送远程由人工决定 |
| 2 | ~~Day 3 未发布~~ ✅ **已发布**（新 action `15adaa32-…`，`published: true`，线上 JS 与本地 `cmp` 逐字节一致） | — | 无痕浏览器 / 评委设备目视仍由人工确认；回退请用「`git checkout 943a3ac` 或 `737ceb7` → `npm run build` → 新 action 发布」，不要指望重复 `publish_site` 旧 action 能让旧版本重新上线 |
| 3 | ~~320 / 390 横向溢出与 44px 触控目标在本环境不可测~~ ✅ 已实测通过（Day 3 复核轮 + Day 4 四档视口 + Day 5 报告页四档） | — | Day 5 重测 320 / 390 / 768 / 1440：`pageOverflow: false`，长代码块由 `<pre>` 内部滚动承担；导航与控件实测 `height ≥ 44px` |
| 4 | ~~真实物理 Tab 焦点序列未取到证据~~ ✅ **Day 4 已完整取证** | — | 真实按键走完 skip link → logo → 5 条导航 → 示例按钮 → 实验控件 → 离开实验区；每站同时读 `getComputedStyle` 与 `:focus-visible` 匹配 |
| 5 | ~~Day 4（含收尾轮）+ Day 5 改动尚未提交、尚未发布~~ ✅ **已提交 `691a160` 并发布**（action `3217dd18-…`，`published: true`，线上三个资源与本地 `cmp` identical，公网功能实测通过） | — | 公网实测结论见 §2.8 与 DEVLOG「Day 4 + Day 5 公网发布与公网实测」；回退用「`git checkout 474a30b` → `npm run build` → 新 action 发布」 |
| 6 | 真机读屏（NVDA / VoiceOver / TalkBack）未验证；**真实剪贴板成功分支**在本环境权限 `denied` | 「实际朗读」「复制成功」文案未被真眼真耳确认；本轮只证明了失败提示诚实 + 交给 API 的字符串正确（`readText` 回读被策略拒绝，已如实记录） | 人工在真实浏览器里各点一次复制按钮（键盘与鼠标），并用读屏走一遍示例按钮与报告页结构 |
| 7 | OS 级 `prefers-reduced-motion` 未验证（本轮用 CDP 媒体仿真） | 系统设置下的观感仍属推断 | 在系统「减少动效」开关下复核焦点环与示例区 |
| 8 | Qoder 内置浏览器无可视表面（`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`） | 无法在应用内面板出图取证 | 需要应用内截图时，先由用户打开 In-app Browser 面板；本轮改用 headless Edge + CDP |
| 9 | 焦点环对比度按「浅色实心按钮 + 单色环」计算（7.90 / 7.55 / 7.07 ≥ 3:1） | 深色填充按钮上同色环会失效，页面已把这条坑写进 §4 | 如需演示深色底，另加一条「环 + 内环」双描边示例，并同步实测数值 |
| 10 | ~~外壳 `<main>` 自身聚焦时没有可见环~~ ✅ **Day 5 关闭**：去掉 `outline-none`，真实按键实测 `activeElement === <main id="main">` 且 `outline: solid 3px … offset 2px`，skip link 落点行为不变 | — | 报告页 / 三个实验页均已回归过 Tab 首站与落点 |
| 11 | ~~应用没有 favicon，`/favicon.ico` 404~~ ✅ **Day 5 关闭**：新增 `public/favicon.svg` + `index.html` `<link rel="icon">`，实测 `/favicon.svg` `200`、控制台 `[]` | — | 发布后确认线上标签页图标正常 |
| 12 | 检测器可见性判定不读盒模型尺寸（Day 3 遗留） | CSS 位移 / 透明度隐藏的标签检不出来 | 已作为已知限制写在页面向评委说明 |
| 13 | 播报区数量：Day 6 把反馈移到触发动作旁边后，色彩页 3 个、表单页 2 个、键盘页 2 个 `role="status"`，报告页仍唯一 1 个 | 严格「全站单区」口径可能被判多区；好处是提示出现在用户正在看的位置，且各区只播自己的内容、互不覆盖 | 属 C1 的有意取舍（事件处理与台账未改）；若评委更看重「单区」，可回退为「一个页面一个播报区 + 文案带范围前缀」 |
| 14 | `node` 不在 PATH、node v25.2.1 超出 vitest 引擎声明 | 新会话直接 `npm` 会 `node: not found` | 会话内 `export PATH="/d/Soft_Ware:$PATH"` |
| 15 | 台账是「会话级」：刷新即清空，且实验页路由切换后回到自身初始状态 | 评委若刷新报告页会看到 `0 / 3`，可能误读成「实验没做」 | Day 6 已把空状态改成「先去哪个实验」的引导；如需跨刷新保留，须另行确认是否引入 `sessionStorage`（本轮按约束不引入任何存储） |
| 16 | 768 / 1440 宽下顶部 5 个导航链接实测高 **36px**（320 / 390 换行后 ≥ 44px） | 满足 SC 2.5.8 的 24px 最低要求，但未达 44px 触控建议值 | Day 7 只加内边距把可点区补到 44px，不改视觉与文案 |
| 17 | 「已进行修复后复核」这一列在三个实验里的判定不同构（色彩不要求「清零」，表单要求复检 `issueCount === 0`，键盘要求修复后有 Tab 到达） | 同一句统计说法覆盖面不等宽；规则沿用 Day 5 未改 | 按 D1 要求单独上报；若要同构化需用户先确认，并同步调整 Day 5 的 `experimentLedger` / `reportModel` 测试 |
| 18 | Day 6 的源码、新测试与三份治理文档改动**尚未提交**，也**尚未发布**（线上仍为 `index-C9lhVihd.js`） | 公网看到的还是 Day 5 版本，缺少「下一步」与新口径 | 等用户确认后建提交（建议 `feat: polish day6 experience and navigation` + `docs: record day6 experience polish`），发布需在现有站点上单独授权并重跑公网实测 |

> 注意：不要在同一天同时推进多个实验模块；保留已通过验收的模块，避免无关重构。

## 5. 下一阶段（Day 7）任务建议

1. **先取授权**：Day 6 源码 / 新测试 / 三份治理文档均未提交——需用户确认后建 `feat: polish day6 experience and navigation`（源码 + `App.day6.test.tsx` + `NextStepCard.tsx`）与 `docs: record day6 experience polish`（文档）；
   发布仍走**同一个现有站点**（不建新站），发布前单独请求授权，发布后重跑公网实测（三条「下一步」链 + 报告导出 + 390 视口 + skip link），并把线上资源哈希与本地 `cmp` 结果写回本文档。
2. 把人工项收一轮：真机读屏（含报告页结构顺序与 Day 6 新提示位置）、无痕浏览器目视、真实剪贴板「复制成功」分支、系统级减弱动效，结论写回本文档。
3. 遗留 #16：把 768 / 1440 宽下顶部导航的可点区补到 44px（只加内边距，不改视觉层级与文案），补完重跑四档视口取证。
4. 遗留 #17：与用户确认是否把「修复后复核」在三个实验里的判定同构化——这会改动 Day 5 已验收的 `reVerified` 期望值，属规则变更，不能顺手改。
5. 视需要补大文本 AA 3:1（仍属 1.4.3，勿与 1.4.6 AAA 混称），并把焦点指示 3:1（1.4.11）从「实测表格」升级为可交互判定。
6. 视需要评估「跨刷新保留台账」是否值得引入 `sessionStorage`（会改变现在的诚实语义，需先与用户确认）。
7. 参赛材料：Day 6 的 12 张截图与 `report.md` / `report.json` 在 `.day6-evidence/`，挑可公开的部分整理成图文；**不要**把取证脚本、`run*.log`、`downloads/` 入库。
8. 可选：报告页增加「按实验分节」的锚点导航（当前靠标题顺序），以及把 Markdown 里的生成时间改成用户可读的本地时区说明。
9. 历史已完成项：~~公网发布后在真实站点上重跑四个路由 + 报告导出链路~~（Day 4 + Day 5，见 §2.8）；~~Day 6 体验精修~~（见 §2.9，待提交与发布）。

