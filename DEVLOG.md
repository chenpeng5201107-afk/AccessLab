# AccessLab 开发日志

## 2026-11-16 · Day 1：工程初始化与首个可运行功能

### 1. 当天开发内容

从零初始化 AccessLab 前端工程，并交付首页与「色彩对比度实验」两个页面。

开工前状态：仓库只有一个 2 行的 `README.md` 与 `.vscode/settings.json`，无 `package.json`。
所有新增文件均为新写，未覆盖既有重要文件，Git 历史（`2481736 first commit`）完整保留。

- 技术选型落地：Vite 8 + React 19 + TypeScript 5.9 + Tailwind CSS 4 + Vitest 5。
- 路由方案：**自建 hash 路由**（`src/hooks/useHashRoute.ts`，约 30 行），
  不引入 react-router。理由是两个页面不值得一个依赖，且 hash 路由在静态托管下
  刷新 `#/contrast` 不需要服务端 SPA rewrite，部署更稳。
- 按 PRD 交付首页（页面 A）与色彩对比度实验（页面 B）。
- 对比度计算完全走 WCAG 2.2 相对亮度算法，无任何写死的检测结果。
- 完成 Qoder Sites 首次构建与发布。

主动范围控制：未实现表单标签实验、键盘焦点实验、结果报告；
未添加「智能修复建议」「复制配色」等未要求的功能，避免消耗与scope creep。

### 2. Qoder 协助完成的任务

- 环境勘察：发现 `node` 不在 PATH 上，定位到可用运行时
  `D:/Soft_Ware/node.exe`（v25.2.1）与 npm 11.6.2，registry 为 npmmirror。
- 手写脚手架配置（`package.json` / `vite.config.ts` / 三份 tsconfig / `index.html`），
  规避 `npm create vite` 在非空目录下的交互式提示与覆盖风险。
- 编写 WCAG 2.2 对比度算法与其单元测试，并实际执行测试。
- 用 browser-use 在真实浏览器中驱动页面做验收（详见第 4 节）。
- 校验 lucide-react 实际导出的图标名（`Contrast` / `TextCursorInput` / `Keyboard` /
  `CircleCheckBig` / `CircleAlert` / `RotateCcw` / `Accessibility` 等），避免构建期才发现的命名错误。
- 通过 Qoder Sites 官方 MCP 工具链完成 prepare → publish 全流程。

### 3. 关键代码文件

| 文件 | 作用 |
| --- | --- |
| `src/lib/contrast.ts` | WCAG 2.2 核心算法：hex 解析、sRGB 线性化、相对亮度、对比度、AA 判定 |
| `src/lib/contrast.test.ts` | 算法单元测试，14 条用例 |
| `src/hooks/useHashRoute.ts` | 极简 hash 路由与路由常量 |
| `src/pages/ContrastLabPage.tsx` | 色彩对比度实验页：取色、预览、实时结果、重置、检测范围说明 |
| `src/components/ColorControl.tsx` | 取色器 + 十六进制输入框，含非法输入的可访问性反馈 |
| `src/pages/HomePage.tsx` | 首页主视觉与三个实验方向 |
| `src/components/ExperimentCard.tsx` | 实验卡片：可体验 / 即将开放两种形态 |
| `src/components/AppHeader.tsx` | 顶部导航，含 `aria-current="page"` |
| `src/App.tsx` | 布局、skip link、路由切换后的焦点管理与标题更新 |
| `src/index.css` | Tailwind 4 入口、中文字体栈、`:focus-visible` 描边、reduced-motion |

### 4. 已执行的测试与结果

#### 4.1 单元测试（真实执行）

```
npx vitest run
→ Test Files 1 passed (1) | Tests 14 passed (14) | Duration 360ms
```

覆盖：黑白 21:1、同色 1:1、前后景色顺序无关、纯红/白 ≈ 4:1、
默认配色 `#777777`/`#ffffff` ≈ 4.48:1、3 位缩写展开、
非法 hex 返回 null、AA 边界（4.5 通过 / 4.49 不通过）、格式化输出。

#### 4.2 生产构建（真实执行）

```
npm run build   # tsc -b && vite build
→ ✓ 2092 modules transformed, built in 422ms
  dist/index.html            0.61 kB │ gzip  0.45 kB
  dist/assets/index-*.css   21.46 kB │ gzip  5.08 kB
  dist/assets/index-*.js   240.22 kB │ gzip 76.04 kB
```

TypeScript 严格模式类型检查与构建均通过。

#### 4.3 浏览器验收（真实执行，dev `localhost:5173` 与 prod preview `localhost:4174` 各一轮）

| # | PRD 验收项 | 结果 |
| --- | --- | --- |
| 1 | `#000000` vs `#FFFFFF` = 21:1 | ✅ 显示 `21.00:1`，文案「达到普通文本 AA」 |
| 2 | 相同颜色 = 1:1 | ✅ `#000000` on `#000000` → `1.00:1`，未达 AA |
| 3 | 改前景色后预览与结果同步 | ✅ 预览 `rgb(119,119,119)` → `rgb(0,0,0)`，结果 4.48 → 21.00 |
| 4 | 改背景色后预览与结果同步 | ✅ 预览背景 → `rgb(0,0,0)`，结果同步为 1.00:1 |
| 5 | 重置按钮正常 | ✅ 取色器/文本框/预览/结果/提示语全部恢复默认 4.48:1 |
| 6 | 首页按钮进入实验 | ✅ `#/contrast`，`<h1>` 与标题随之切换 |
| 7 | 生产构建成功 | ✅ 见 4.2，并由 preview 服务器真实加载哈希后的 JS 资源 |

附加验证：

- 默认配色实测 **4.48:1，未达 AA**，教学意图成立。
- 手工按 WCAG 公式独立复算 `#2b4a8b`/白 = 8.56、`#22bb44`/白 = 2.54，
  与页面显示 8.55:1 / 2.54:1 一致，证明是真实计算而非硬编码。
- 十六进制输入：非法 `#12` → `aria-invalid="true"` + `aria-describedby` 指向错误文案，
  且**不污染**已有状态（结果仍为 4.48:1）；合法 `#2b4a8b` → 取色器同步；
  3 位缩写 `2b4`（无 `#`）→ 正确展开为 `#22bb44`。
- 无障碍自检：landmark（banner/navigation/main/contentinfo）齐备；skip link 激活后焦点落到 `#main`；
  Tab 序列 10 个可聚焦元素顺序合理；标题层级 H1→H2→H3 连续；`lang="zh-CN"`；1 个 live region。
- 「即将开放」两张卡片实测 `interactiveCount = 0`，确认**无假按钮**。
- 直接访问 `#/contrast` 可渲染实验页（hash 路由对静态托管有效）。
- 控制台无 error / warning（仅 Vite 连接与 React DevTools 提示）。

#### 4.4 验证方法的局限（如实说明）

Qoder 内置浏览器视口不可用（`viewport=0x0`、`visibilityState=hidden`），
**原生指针点击与截图被拒绝**。因此交互改由 DOM 事件驱动
（原生 value setter + `input`/`change` 事件 + `element.click()`），
并用 `getComputedStyle` 校验颜色是否真的应用到预览元素上。

结论：行为层与样式计算层已真实验证；**页面视觉外观未经截图/肉眼确认**。

时间线说明：prod preview（4174）那一轮跑在**修复前**的产物上，
其覆盖的对比度计算 / 预览同步 / 重置逻辑与修复无关，结论仍成立；
第 6 节两项修复是在 dev 服务器上验证通过的，随后重新构建并二次发布（见第 5 节）。

另外，线上地址因站点为 private 而返回 Qoder 登录页，
**部署后的应用渲染未能在本会话内直接验证**（见第 5 节）。

### 5. 部署状态

| 项目 | 值 |
| --- | --- |
| 构建命令 | `npm run build`（= `tsc -b && vite build`） |
| 构建产物目录 | `dist/`（`index.html` + `assets/*`） |
| 部署方式 | Qoder Sites 官方 MCP：`prepare_site` → `get_publish_status` → `publish_site` |
| prepare 关键入参 | `webDirectory: "dist"`、`spa: false`、`slug: "accessibility-lab"`、`displayName: "AccessLab 无障碍实验室"` |
| Site 地址 | https://accessibility-lab-3g6uvbn5duq.qoder.zone |
| 发布结果 | ✅ `published: true`，Operation `succeeded` 且 `committed: true` |
| 当前访问级别 | `public`（初始为 private，后经用户授权切换，见第 8 节） |

发布共执行两次，同一 Project / Site，未创建重复站点：

1. 首个 action `b14f486c…`：首次创建 Project/Site 并发布成功。
2. 但随后为修复第 6 节的两项无障碍问题修改了源码，线上产物已过期，
   因此 `npm run build` 重新构建（JS 哈希 `index-CkcvWwoW.js` → `index-CRbJDy1g.js`），
   并用新 action `1abb0737…` 复用 `projectId` 重新发布。当前线上版本为后者。

上传前已检查产物：`dist/` 仅 3 个文件，无 source map、无 `.env`、无凭据。

公开访问设置方法：`update_access_policy`，参数 `mode: "public"` + `confirmPublic: true`
（`selected` 模式可指定至多 50 位用户）。新建站点默认 private，切换受众属于独立授权动作，
不由「部署」这一请求自动推导——本次已在获得用户明确授权后执行，见第 8 节。

### 6. 本次会话中发现并修复的问题

1. **`tsconfig.node.json` 误写入多余标签** —— 检查后确认文件实际内容正确，为虚惊。
2. **实验卡片标题被朗读成「01色彩对比度实验」** —— 装饰性序号混入了无障碍名称。
   修复：序号 `<span>` 加 `aria-hidden="true"`，朗读恢复为纯标题。
3. **React StrictMode 下首屏即抢焦点** —— 开发模式双次执行 effect 导致初次加载就 `focus()` 到 `<main>`。
   修复：改用 `lastRouteRef` 与当前路由比较，只有真正发生路由变更才移动焦点。
   （两项修复均在浏览器中复验通过。）

### 7. 未解决的问题

- 内置浏览器视口不可用，缺少视觉截图与肉眼回归（行为与样式计算层已验证）。
- `node` 不在系统 PATH（实际安装在 `D:/Soft_Ware`），新会话需手动前置该目录，否则 npm 报 `node: not found`。
- 尚未配置 CI，构建与测试依赖本地手动执行。

> 原列表中的「站点为 private、线上渲染未验证」两项已在第 8 节解决。

### 8. Day 1 收尾后补充（同日）

#### 8.1 开放公开访问

经用户明确授权后执行 `update_access_policy`（`mode: public` + `confirmPublic: true`，
使用一次新鲜读取的 `accessRef` 与固定 `requestId`），返回
`{"mode":"public","auth_integration_status":"not_required"}`。
`get_publish_status` 中站点的 `access_mode` 同步变为 `public`。

#### 8.2 线上匿名复验（真实执行）

匿名访问 https://accessibility-lab-3g6uvbn5duq.qoder.zone 已不再出现登录页，实测：

- 首页渲染正常：`h1=AccessLab`、3 张卡片、`开始体验 → #/contrast`；
- 实验页全链路：初始 `4.48:1 未达` → 前景 `#000000` 得 `21.00:1 达到` →
  背景同为 `#000000` 得 `1.00:1` → 重置恢复 `4.48:1`，预览 `getComputedStyle` 全程同步；
- 控制台零消息（无 error / warning）；
- 无障碍自检：landmark 各 1 个、标题层级 H1→H2→H3、`lang=zh-CN`、
  导航 `aria-current="page"` 正确、卡片可交互元素数 `[1,0,0]`（无假按钮）。

#### 8.3 线上验证发现并修复的真实缺陷：skip link 与 hash 路由冲突

**现象**：在实验页激活「跳转到主要内容」，URL 由 `#/contrast` 变为 `#main`，
路由把未知 hash 回退成 `home`，**用户被踢回首页**。
对一个无障碍产品而言，这正是 AccessLab 要教的典型缺陷。

**根因**：skip link 用 `href="#main"`，与自建 hash 路由抢占同一个 `location.hash`。

**修复**：保留 `href` 以维持链接语义与无 JS 回退，在 `onClick` 中
`preventDefault()` 并以 `getElementById('main').focus()` 手动移动焦点（`src/App.tsx`）。

**验证**：重新构建（`index-BBSMVCdQ.js`）→ 单元测试 14/14 →
以第三个 action `38f9fe06…` 复用同一 `projectId` 重新发布（`published: true`、`committed: true`）→
线上实测激活 skip link 后 hash 仍为 `#/contrast`、`h1` 仍为「色彩对比度实验」、焦点落到 `main`。

**排障记录**：首次复验时页面加载到缓存的旧 `index.html`（仍引用 `index-CRbJDy1g.js`），
误判为「未修复」；加缓存绕过参数重新导航后才读到新产物。
结论：`dist/assets/*` 有内容哈希、可长期缓存，但 **`index.html` 需要较短缓存 TTL**，
否则每次重新发布后用户仍会拿到旧入口。这是 Day 2 需要留意的部署细节。

#### 8.4 发布次数汇总

同一 Project `01a1e498…` / Site `01a1e498…f0f6`，未创建重复站点，共 3 次发布：

| action | 内容 | 原因 |
| --- | --- | --- |
| `b14f486c…` | 首版 | 首次创建并发布 |
| `1abb0737…` | 修复卡片序号朗读 + StrictMode 首屏抢焦点 | 源码在发布后才修改，需重发 |
| `38f9fe06…` | 修复 skip link 踢回首页 | 线上验证发现真实缺陷 |

---

## 2026-11-16 · Day 1 审查修复轮（同日，来自外部代码审查）

范围严格控制：只改审查指出的 4 项，未新增功能、未调整页面视觉设计、未重构无关模块。

### 1. 任务一 · P1 跳转导航（`src/App.tsx`、`src/hooks/useHashRoute.ts`）

**根因重新定位**：`href="#main"` 覆盖 `location.hash` 只是触发点，真正的脆弱点在
`useHashRoute` —— `readRoute()` 把所有未知 hash 一律回退成 `home`，
所以任何页内锚点都能把用户踢回首页。

上一轮 `de27a29` 已给 skip link 加了 `preventDefault()` + 手动聚焦，
但那只是**挡住了这一个入口**，路由层仍然一碰未知 hash 就复位。本轮做结构性修复：

- 新增纯函数 `routeFromHash(hash): Route | null`——只有注册过的 hash 才是业务路由；
- 新增 `nextRoute(current, hash)`——非路由 hash **保持当前页面**；
- `useHashRoute` 的 `hashchange` 回调改用函数式更新 `setRoute(cur => nextRoute(cur, hash))`；
- 冷启动仍按 `routeFromHash(...) ?? 'home'` 解析。

`preventDefault` 守卫保留（避免 URL 被无意义地改写、不产生多余历史记录），
两者叠加后：即使将来有人再写一个裸的 `href="#anchor"`，也不会丢页面。

**副作用一并消除**：首页「查看实验方向」的 `href="#experiments"` 属于同一类隐患，
修复后它只滚动、不再影响路由（已浏览器实测）。

标题更新与路由焦点管理逻辑未改动，回归确认仍正常。

**回归测试**：新增 `src/hooks/useHashRoute.test.ts`（8 条），核心断言
`nextRoute('contrast-lab', '#main') === 'contrast-lab'`，
并覆盖首页场景、`#experiments`、未知 hash、以及正常路由切换仍生效。
说明：该测试针对纯路由函数，运行于 node 环境，未引入 jsdom / testing-library；
真实 DOM 交互另由浏览器验证（见第 5 节）。

### 2. 任务二 · WCAG 线性化常量（`src/lib/contrast.ts`）

`0.03928` → **`0.04045`**（WCAG 2.2 现行定义，与 sRGB 标准一致；`0.03928` 是 2.0/2.1 正文写法），
同步改写函数注释，并修正 `PRD.md` 中原先「与 axe-core / WebAIM 实现一致」的不当表述。
对比度公式其余部分一字未动。

**数值影响已核实为 0**：两个阈值映射到 8 位通道分别是
`0.03928×255≈10.02` 与 `0.04045×255≈10.31`，其间不含任何整数——
通道 10（0.03922）两侧都走 `/12.92`，通道 11（0.04314）两侧都走幂函数分支。
因此所有可选颜色的亮度与对比度结果完全不变，既有测试基线无需重算。

为免常量再次退化，新增一条分支测试：`relativeLuminance({10,10,10})` 必须等于 `10/255/12.92`，
且通道 11 的亮度严格大于通道 10。

### 3. 任务三 · 规范说明准确性（`src/pages/ContrastLabPage.tsx`）

原句「大文本的 3:1 门槛（1.4.6 / 1.4.3 大文本情形）」把 AA 与 AAA 混为一谈，已改为逐条准确表述：

- **1.4.3 Contrast (Minimum)，AA**：普通文本 4.5:1（**本产品唯一实际检测项**）、大文本 3:1（不检测）；
- **1.4.6 Contrast (Enhanced)，AAA**：普通文本 7:1、大文本 4.5:1（不检测）；
- **1.4.11 Non-text Contrast，AA**：图形与界面组件 3:1（不检测）。

未新增 AAA 或大文本检测功能，检测逻辑与阈值不变，只改文案；
「本项通过不代表组件或整站符合 WCAG 2.2」的边界声明保留。

### 4. 任务四 · Qoder Sites 状态（实测，非推断）

- `get_site_access(siteId)` → `policy.mode = "public"`、`auth_integration_status = "not_required"`；
- 匿名抓取线上地址 → 无登录墙，`h1 = AccessLab` 正常渲染，**双重确认公开访问有效**。
- **线上当前产物为 `index-BBSMVCdQ.js`**，本轮修复后的产物是 `index-DZkMykvn.js`，
  两者不一致 → **本轮修复尚未上线，需要重新部署**（等待验收后再执行）。

### 5. 测试实际执行结果

```
npm test        → Test Files 2 passed (2) | Tests 23 passed (23)
                   src/lib/contrast.test.ts        15 passed
                   src/hooks/useHashRoute.test.ts   8 passed
npm run build   → ✓ 2092 modules transformed, built in 1.83s
                   dist/index.html 0.61 kB / CSS 21.46 kB / JS 240.73 kB (gzip 76.16)
```

浏览器交互测试（production build 经 `vite preview :4180`，加载 `index-DZkMykvn.js`）：

| 场景 | 结果 |
| --- | --- |
| 实验页激活 skip link | ✅ hash 保持 `#/contrast`、`h1` 仍为「色彩对比度实验」、焦点落到 `main`、标题不变 |
| **强制** `location.hash = '#main'`（绕过点击守卫，直击路由层） | ✅ 业务路由仍停在实验页，标题未复位 |
| 首页 `#experiments` 区块锚点 | ✅ 仅滚动，路由与标题不受影响 |
| 首页 skip link | ✅ 焦点到 `main`，页面未变 |
| 首页 → 实验页 → 首页 正常切换 | ✅ `h1`/`title`/焦点均正确 |
| 核心对比度回归 | ✅ 初始 `4.48:1 未达` → 前景 `#000000` `21.00:1 达到` → 同色 `1.00:1` → 重置回 `4.48:1`，预览 `getComputedStyle` 全程同步 |
| 「即将开放」卡片 | ✅ 可交互元素数 `[1,0,0]`，仍无假按钮 |
| 控制台 | ✅ 零消息 |

### 6. 本轮遗留

- **需要重新部署 Qoder Sites**（当前线上为修复前产物），等待验收结论后执行。
- `index.html` 缓存策略仍需确认（见第 8.3 节排障记录）。
- 页面视觉外观依旧缺少截图 / 肉眼确认（内置浏览器视口不可用）。


---

## 2026-11-16 · UI/UX 定向优化轮（同日）

范围：首页第一印象、实验页移动端可用性、文案可读性。未改动 `src/lib/contrast.ts` 的计算逻辑，未新增依赖，未开发另外两个实验。

### 1. 任务一 · 首页（`src/pages/HomePage.tsx`）

- 主标题改为「让网页的障碍，看得见、改得掉。」，品牌名降级为上方的 `AccessLab · 无障碍实验室` 徽章，层级变为「徽章 → 主张 → 一句说明 → 主行动」。
- 删掉原来堆术语的长介绍段，正文压成一句人话；大赛与赛道信息移到主视觉下方的小字。
- 主按钮改名「开始第一个实验」，高度 52px（`min-h-12` + `px-7`），是页面上唯一的实心大按钮。
- 新增「同一句话，只是换个颜色」修复前 / 修复后示例（桌面端与 hero 并排，移动端排在按钮之后）：
  数值全部由 `contrastRatioFromHex()` / `formatContrastRatio()` 在渲染时算出，没有写死结论。
  实测输出：正文小字 4.48:1（未达）→ 7.00:1（达标）；主按钮白字 4.47:1（未达）→ 7.90:1（达标）。
- 实验区文案改为「三个实验方向」，仍只有一张可点卡片，另外两张保持「即将开放」且没有假按钮。

### 2. 任务二 · 实验页移动端（`src/pages/ContrastLabPage.tsx`、`src/components/ColorControl.tsx`）

- 在「1. 调整颜色」卡片底部新增紧凑读数条：`当前对比度 · 4.48:1 · 未达 AA`，
  窄屏（< lg）使用 `sticky bottom-3` 吸底，改完颜色不必再往下滚找结果；lg 以上恢复 `static` 原位显示。
- **实时播报区全页唯一**：`role="status" aria-live="polite" aria-atomic="true"` 只挂在这条读数上；
  下方「3. 检测结果」的 4xl 大数字与判定徽标改为纯静态展示（实测 `[aria-live],[role=status]` 数量 = 1，不会重复朗读）。
- 触摸目标统一到 ≥44px：十六进制输入框 `min-h-11`、重置按钮 `min-h-11`、`返回首页` 链接 `min-h-11`、
  `<summary>` 通过 `px-2 py-3` 达到 44px、导航链接移动端 `min-h-11`（sm 以上回到 36px 以免头部变臃肿）。
  实测：320 / 390 视口下，除 sticky 头部外没有任何交互控件高度 < 44px。
- 取色器保持原生 `<input type="color">`（44×44）+ 文本框双通道，键盘可完整操作。

### 3. 任务三 · 文案（同上两个页面）

- 「右侧预览」→「预览区域」，不再假设大屏布局（实测页面文本已不含「右侧」）。
- 新增人话解释（放在「3. 检测结果」标题下，避免把控件挤出首屏）：
  对比度衡量文字与背景的反差程度，范围 1:1 到 21:1，反差太小时低视力与老年用户在强光或旧屏幕上看不清。
- 「本实验检查什么、不检查什么」改为**一句摘要 + 可折叠详情**：
  摘要只说检查 1.4.3 普通文本 4.5:1（AA），并用加粗单句点明
  「这一项通过，只代表这一对颜色合格，不代表这个组件或整个网站已经符合 WCAG 2.2」；
  未覆盖项（大文本 3:1、1.4.6 AAA、1.4.11、语义/键盘/朗读顺序）收进原生 `<details>`，规范归属保持上一轮修正后的准确写法，没有新增 AAA 或大文本检测功能。
- 预览卡片换成明确标注的虚构校园场景：卡片内第一行就是「虚构示例 · 校园场景」，
  标题「图书馆模拟逾期提醒」，正文写明文字是编出来试色的样例，编号 `FICTION-DEMO-0000（虚构，无对应真实记录）`；
  卡片上方另有一句非彩色说明「卡片里的通知是一段虚构的演示文案，不会真的产生提醒或费用」。

### 4. 视口实测方法与结果

受限条件：内嵌 Browser 面板 `visibilityState=hidden`，截图与指针点击仍返回
`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`（可见性由用户控制，无法自行打开）。
本轮改用**同源 iframe 充当独立视口**做真实布局测量——iframe 内媒体查询按自身宽度生效，
因此能在同一页面里精确复现 320 / 390 / 768 / 1440 四档，被测对象是 `vite preview` 提供的生产产物。

| 视口 | 首页横向溢出 | 实验页横向溢出 | 实验页读数条与首个取色器同屏 | <44px 控件（头部除外） | 实时区数量 |
| --- | --- | --- | --- | --- | --- |
| 320×653 | 无（305/305） | 无（305/305） | 是（sticky） | 0 | 1 |
| 390×844 | 无（375/375） | 无（375/375） | 是（sticky） | 0 | 1 |
| 768×1024 | 无（753/753） | 无（753/753） | 是（sticky） | 0（导航 36px，属 sm 以上） | 1 |
| 1440×900 | 无（1425/1425） | 无（1425/1425） | 是（static） | 0（导航 36px） | 1 |

- 溢出检测方式：`documentElement.scrollWidth > clientWidth`，并统计所有越界元素，四档结果均为 0 个。
- 首页首屏：主按钮底边 584px(320) / 555px(390)，在 653 / 844 高度内完整可见；示例卡片标题位于 757 / 712px，
  即按钮之后、实验列表之前，移动端阅读顺序成立且首屏未被介绍文字占满。
- 焦点可见性：`src/index.css` 里有全局 `:focus-visible { outline: 3px solid var(--color-indigo-700); outline-offset: 2px }`，
  对链接 / 按钮 / 取色器 / 文本框 / `summary` 逐个 `focus()` 后读取计算样式为 `solid 3px`，且 `matches(':focus-visible')` 为 true。
  （在 inactive 文档里 `:focus-visible` 不匹配属浏览器规范行为，非缺陷。）
- 路由与跳转回归：在实验页把 hash 改成 `#main`、`#experiments`，页面仍停留在实验页（`h1` 保持「色彩对比度实验」），
  改回 `#/` 正常回首页——上一轮的 P1 修复未被本轮改动破坏。
- 功能回归：文本框输入 `#000000` → 读数条与大数字同为 21.00:1 且判定「达到 AA」；
  输入 `#777777` → 4.48:1「未达 AA」；点重置 → 回到 4.48:1；
  输入非法 `#zz` → `aria-invalid="true"` 并显示错误提示，读数条保持上一个有效值且实时区仍为 1 个；
  `<details>` 折叠 62px → 展开 181px，含 4 条未覆盖项。

### 5. 本轮测试与构建

- `npm test`：**23/23 通过**（15 条对比度算法 + 8 条路由），本轮未修改任何测试断言。
- `npm run build`：通过，产物随每次改动重新生成；最终一轮为
  `dist/assets/index-D3taezmb.css`（22.77 kB / gzip 5.32 kB）+ `dist/assets/index-BMoiVV75.js`（244.96 kB / gzip 77.29 kB）。
  上述四档视口全部针对该产物（`vite preview`，端口 4176）测量，不是 dev server。

### 6. 本轮遗留

1. **视觉观感仍未肉眼确认**：截图能力受内嵌 Browser 面板可见性限制（见上），配色、留白、断点观感需要人工查看。
2. 首页 320px 下示例卡片标题在 757px（首屏之下），需要一次短滚动才能看到修复前后对比；已排在阅读顺序第二位，但可再压缩 hero 高度。
3. 移动端 sm 以上导航链接为 36px 高（本轮特意只放宽窄屏），若按 44px 严格标准仍偏小。
4. `prefers-reduced-motion` 只覆盖动画/过渡时长，本轮新增的吸底读数条本身无动画，未做额外处理。

## 2026-11-16 · 窄屏遮挡与非法输入提示修复轮（同日，来自第二轮外部审查）

范围：只处理复审提出的 3 项（1 个 P1 + 2 个 P2）。未新增依赖、未重构、未开发新功能；
`src/lib/contrast.ts`、`src/hooks/useHashRoute.ts` 与两份测试文件本轮一字未动。

### 1. 任务一 · P1 取消吸底读数条（`src/pages/ContrastLabPage.tsx`）

问题根因：读数条用 `sticky bottom-3` 停在视口底部，但它仍占据控件卡片内的原始布局空间，
320×653 下这段原始空间恰好落在文字/背景颜色控件之上——**视觉上吸底、命中区也压住输入框**。

改法（只做定位方式的减法，不加任何浮层）：

- 删掉 `sticky bottom-3` 与 `lg:static lg:bottom-auto lg:shadow-none`，
  整条改为**正常文档流**，`mt-5` 紧跟在「重置为默认颜色」按钮与状态说明行之后；
- `shadow-sm` 一并去掉，桌面端原本就是 `lg:shadow-none`，视觉上零变化；
- 新增 `flex-wrap`，为第 2 项的提示行留出换行位置（提示占满整行 `w-full`）；
- 计算路径完全未动：`ratio` / `passes` 仍在渲染期由 `contrastRatioFromHex()` 实时算出，
  `role="status" aria-live="polite" aria-atomic="true"` 仍是全页唯一的实时播报区。

**实测（`vite preview` 生产产物，同源 iframe 独立视口法；先置 `scroll-behavior:auto`，
否则隐藏面板里平滑滚动不推进，`scrollTo` 会停在 0）**

| 视口 | 读数条 position | 文档坐标 | 与控件矩形相交（7 档滚动位 × 5 控件） | 控件中心命中自身 | 实时区数量 | 横向溢出 |
| --- | --- | --- | --- | --- | --- | --- |
| 320×653 | `static` | 顶 996 / 底 1048（重置按钮底 952） | 0 个 | 是（hex1/hex2/取色器×2/重置） | 1 | 无（305/305） |
| 390×844 | `static` | 顶 858 / 底 910（重置按钮底 814） | 0 个 | 是（同上 5 个） | 1 | 无（375/375） |
| 768×1024 | `static` | 单列 705px，读数条在卡片正常流内 | 0 个（滚动 0/200/400/600/800） | 是（避开头部 130px 带） | 1 | 无（753/753） |
| 1440×900 | `static`，`margin-top:20px`，无 box-shadow | 与说明行间距 20px | 0 个（文档高 1176，滚动 0 与极限 276 两档） | 是 | 1 | 无（1425/1425） |

- 滚动位取 0 / 250 / 500 / 750 / 1000 / 1300 / 1600，每档对 2 个十六进制框、2 个取色器、重置按钮
  逐一做矩形相交与 `elementFromPoint(中心)`，两档窄屏均未出现任何遮挡或命中偏移；
  读数条增高到 96px（非法输入提示行出现时）相交仍为 0。
- 焦点验证：对命中元素调用 `focus()` 后 `document.activeElement` 即该控件本身（5/5 通过）。
- 桌面端布局保持：grid 仍为 `352px + 600px` 双列，读数条与上一版 `lg:static lg:mt-5 lg:shadow-none`
  的计算值逐条相同（position / margin-top / box-shadow 三项实测一致）。

### 2. 任务二 · P2 非法颜色输入不再误导（`src/components/ColorControl.tsx` + 父组件）

问题：文本框非法时不提交颜色，于是预览与检测继续用上一次有效配色，
却仍可能显示绿色「达到 AA」，用户会以为这个结论属于他刚打进去的那串字符。

最小改动方案（颜色计算架构未动）：

- `ColorControl` 新增可选 prop `onValidityChange?: (isValid: boolean) => void`，
  由一个依赖 `[invalid, onValidityChange]` 的 effect 上报，非法状态只在组件内部判定一次；
- `ContrastLabPage` 用 `textValid` / `backgroundValid` 两个 state（直接传入 useState setter，引用稳定）
  合成 `hasInvalidInput`，在两处显示审查要求的原话
  **「当前颜色输入无效，检测结果仍基于上一次有效配色。」**：
  读数条内（`w-full`，随唯一实时区一起播报）与「3. 检测结果」静态段落（`bg-red-50` 提示块）；
- 沿用既有语义：非法时不提交颜色，`ratio` / `passes` 仍由上一次有效配色算出。
  预览本来用的就是同一组 state，所以读数条、大数字、预览三者始终互相一致，
  本轮补的是「这组结论不属于你刚输入的字符串」这一句缺失的说明。
- 字段级既有提示（`aria-invalid="true"` + `请输入有效的十六进制颜色，例如 #1a4d8f`，
  经 `aria-describedby` 关联）保留，未重复改写。

**实测（320×653 与 390×844 两档均跑通）**

| 操作 | 读数条 | 提示节点数 | `aria-invalid` | 实时区 |
| --- | --- | --- | --- | --- |
| 初始 | 4.48:1 未达 AA | 0 | null | 1 |
| 输入 `#000000` | 21.00:1 达到 AA | 0 | null | 1 |
| 紧接输入 `#12g` | 仍 21.00:1 达到 AA + 原话提示 | 2（读数条 + 检测结果） | true | 1 |
| 改回 `#777777` | 4.48:1 未达 AA | 0 | null | 1 |
| 点重置 | 4.48:1 未达 AA | 0 | null | 1 |

补充验证的边界：先 `#000000` 再打 `#zz` 后点重置 → 配色真的变了，文本框同步回 `#777777`、提示消失；
若默认配色下直接打 `#zz` 再点重置 → 配色没变化、组件不重渲染，文本框仍显示 `#zz` 且提示保留，
显示自洽（见本轮遗留第 4 条）。

### 3. 任务三 · P2 首页措辞（`src/pages/HomePage.tsx`）

- 卡片 02「表单标签无障碍实验」摘要：
  「看看少了个标签的输入框，会让谁**完全无法**提交表单。」
  → 「看看少了标签的输入框，会让屏幕阅读器用户难以确认该填什么，容易填错或漏填。」
  表述从绝对结论改为「难以确认 + 容易填错/漏填」，与实际后果（WCAG 3.3.2 / 1.3.1 层面的困难）一致。
- 其余首页文案未动；`grep` 确认 src 与文档中已无「完全无法提交」这一绝对表述。

### 4. 本轮测试与构建

- `npm test`：**23/23 通过**（15 条对比度算法 + 8 条路由），未修改任何断言。
- `npm run build`：`tsc -b` 严格模式通过；
  `dist/assets/index-DQIQZvX1.js` 245.41 kB（gzip 77.44 kB）
  + `dist/assets/index-CMRNbZHZ.css` 22.68 kB（gzip 5.31 kB）；
  CSS 比上一版小 0.09 kB（去掉 sticky/断点变体类）。
- 上述视口与交互实测全部针对该产物（`vite preview`，端口 4177），不是 dev server。
- 路由回归：在实验页把 hash 依次改成 `#main`、`#experiments`、`#bogus`，`h1` 仍为「色彩对比度实验」；
  `#/` 回首页、`#/contrast` 回实验页均正常——上一轮修复未被破坏。

### 5. 本轮遗留

1. **真实指针点击仍无法验证**：内嵌 Browser 面板 `visibilityState=hidden`，
   `click` 直接返回 `NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`（viewport=0x0）。
   本轮证据链是 `elementFromPoint(控件中心)` + `focus()`——命中测试与真实指针落点同属一套几何判定，
   但没有走 CDP 输入事件，需人工在可见面板里点一次确认。
2. **窄屏改色后需短滚动才看到读数**：去掉吸底后读数条位于文档 996px（320×653 视口 653px），
   即「不必滚动找结果」这个便利被换成了「不遮挡输入框」。审查要求优先取消 sticky，本轮照做；
   若要两者兼得，需要换思路（例如把读数并进控件区更靠上的位置），而不是重新引入固定浮层。
3. **顶部 sticky 头部（实测高 125px）会遮住从其下方穿过的控件**：滚动到某些偏移时，
   控件中心落在 0–125px 带内会命中头部链接。这是 `AppHeader` 既有行为，与本轮改动无关，
   也不在审查项内，故未触碰。
4. **重置不会清掉已存在的非法草稿**（仅当配色本来就等于默认值、state 无变化时）：
   文本框仍显示非法串、提示仍保留。显示内容自洽，但「重置」的直觉含义未 100% 兑现；
   要彻底解决需让 `ColorControl` 暴露草稿复位，属于额外改动，本轮未做。
5. 非法输入的提示目前按「任一字段非法」聚合展示，不指明是文字色还是背景色；
   字段级红字提示可补足这一点，本轮未再加第二个说明层。

## 2026-11-17 · Day 1 收尾：重置边界修复与正式上线

工作从 11-16 深夜延续到 11-17。范围：修掉上一轮自己记下的遗留 #11（重置不清非法草稿），
跑完整轮验收测试，并把最新构建正式部署到 Qoder Sites。未新增依赖、未开发 Day 2 功能。

### 1. 任务一 · 重置按钮边界问题（`src/components/ColorControl.tsx`、`src/pages/ContrastLabPage.tsx`）

**根因**：`ColorControl` 的草稿同步 effect 只以 `[value]` 为依赖。
当颜色本来就等于默认值时，点「重置」不改变 `value`，effect 不触发，
输入框里的非法草稿（如 `#zz`）与 `aria-invalid`、字段级红字、聚合提示全部保留——
显示虽然自洽，但「重置」的语义没有兑现。

**最小状态同步修复**（不动 WCAG 算法、不重构组件、不引入 ref）：

- `ColorControl` 新增可选 prop `resetSignal?: number`，草稿同步 effect 依赖改为 `[value, resetSignal]`；
- `ContrastLabPage` 增加 `const [resetSignal, setResetSignal] = useState(0)`，
  `handleReset()` 在写回两个默认色之后 `setResetSignal((s) => s + 1)`，
  并把 `resetSignal` 同时传给两个 `ColorControl`；
- 非法状态与提示不需要单独清理：草稿被强制同步成合法的受控值后，
  `invalid` 由 true 变 false，上一轮的 `onValidityChange` 上报链自动把
  `textValid` / `backgroundValid` 复位，聚合提示与字段级红字一起消失。

对比度计算路径、颜色提交规则、读数条布局均未改动。

### 2. 任务二 · 本轮测试

- `npm test`：**23/23 通过**（15 条对比度算法 + 8 条 hash 路由），断言与测试文件未改。
- `npm run build`：`tsc -b` 严格模式通过；
  `dist/index.html` 0.61 kB + `dist/assets/index-BW9yt6RB.js` 245.49 kB（gzip 77.46 kB）
  + `dist/assets/index-BXG-jS32.css` 22.96 kB（gzip 5.35 kB）。

**补测（针对 `vite preview` 生产产物，同源 iframe 独立视口 320×653 / 390×844）**

| # | 场景 | 结果 |
| --- | --- | --- |
| 1 | 默认配色 → 输入 `#zz` → 点重置 | 重置后文本框回到 `#777777`、`aria-invalid` 移除、字段级红字 0、聚合提示 0、读数条 4.48:1 未达 AA、预览 `rgb(119,119,119)` / `rgb(255,255,255)`、说明行回到「当前已是默认配色。」**（本轮修复点，上一轮此处会残留非法草稿）** |
| 2 | 改成 `#000000` → 两个框分别输入 `#zz` / `nope` → 点重置 | 非法态：2 个 `aria-invalid`、2 条字段提示、2 处聚合提示、读数条仍 21.00:1 达到 AA + 原话说明；重置后两个框同时回到默认，所有提示清零，读数条 4.48:1 |
| 3 | 输入合法自定义色 `#1a4d8f` / `#f5f0e6` → 点重置 | 自定义态 7.39:1 达到 AA → 重置回 4.48:1 未达 AA，值与配色说明均复位 |
| 4 | 320 / 390 窄屏命中与遮挡 | 读数条 `position: static`（文档顶 996 / 858），7 档滚动位 × 5 个控件矩形相交 **0 次**；控件中心 `elementFromPoint` 命中控件本身并 `focus()` 后 `activeElement` 正确（320 通过 14 次、390 通过 16 次）；5 个控件高度全部 44px；`[aria-live],[role=status]` = 1；无横向溢出 |
| 5 | hash 路由与键盘跳转 | 实验页把 hash 改成 `#main` / `#experiments` → `h1` 仍是「色彩对比度实验」；skip link 激活后 `activeElement` = `#main` 且 hash 不被改写；首页 `#experiments` 锚点滚到 1452px（区块文档顶 1532 − `scroll-mt-20` 80px，命中预期）；首页 CTA 进实验页后焦点交给 `#main`、滚动归 0；DOM 焦点顺序为 skip link → 头部 → 返回首页 → 取色器/文本框×2 → 重置 → `summary`；`:focus-visible` 3px indigo-700 规则未动 |

键盘证据的边界：内嵌 Browser 面板 `visibilityState=hidden`，`press_key("Tab")` 返回成功但焦点不移动
（`document.activeElement` 仍为 `BODY`），真实指针 `click` 继续返回 `NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`。
因此「点得中 / 键盘跳得动」的证据是几何命中 + 与 Enter 激活同一条代码路径的 `focus()` / `click()` 验证，
需人工在可见面板或真机上补一次。

### 3. 任务三 · 正式上线（Qoder Sites）

沿用原项目与原站点，未新建站点：`prepare_site`（新 actionId `f2cc4676-8af1-48a7-a4e7-f4fb0f373939`，
`projectId 01a1e498-…`，`webDirectory: dist`，`spa: false`，因为路由是 hash 方案，不依赖服务端 rewrite）
→ 状态 `artifactReady/dependenciesReady/canPublish: true`、`blockers: []`
→ `descriptorStatus` 首次 `pending`，就绪后以**同一 action + 完全相同输入**重试 `prepare_site`，
得到 `descriptorStatus: written`（未重新打包上传）
→ `publish_site` → `published: true`、Operation `committed: true`、`readiness: publication_completed`。

线上核对（匿名访问，无需登录）：

- 入口 HTML 引用的资源已更新为最新构建：`assets/index-BW9yt6RB.js` + `assets/index-BXG-jS32.css`
  （此前线上是 `index-BBSMVCdQ.js`）；`index.html` / JS / CSS 三者 HTTP 均为 200。
- **字节级一致**：本地与线上 JS 的 sha256 前缀同为 `a273089544d6ab03`，CSS 同为 `7fe52598076813ec`。
- 访问级别：`get_site_access` 返回 `policy.mode = public`、`auth_integration_status = not_required`、
  `targets: []`；站点 `lifecycle: active`、`governance_status: normal`。
- 线上浏览器冒烟（直接跑 `https://accessibility-lab-3g6uvbn5duq.qoder.zone/#/contrast`）：
  读数条 `static`、默认→`#zz`→重置的三态与本地一致（提示 2 处出现、重置后清零、值回 `#777777`）、
  `#main` 不踢回首页、首页卡片摘要已是新措辞、实时播报区数量 1。
- 地址：https://accessibility-lab-3g6uvbn5duq.qoder.zone

### 4. 构建期新发现

`npm run build` 的 CSS 从 22.68 kB 涨到 22.96 kB，而 `src/` 本轮没有新增任何 class。
原因核实：Tailwind v4 的自动内容扫描会把项目内文件一并读入，
`DEVLOG.md` 里作为文字提到的 `bottom-3`、`lg:shadow-none` 等类名确实进了产物 CSS
（`grep bottom-3 dist/assets/index-BXG-jS32.css` 命中，而源码已不再使用该工具类）。
影响仅体积与「文档措辞会改动 CSS 哈希」，无功能风险。本轮**未**为此改配置（属于无关改动且会让已验收产物再变），
后续可用一行 `@source not` 排除 `*.md` 或显式声明 sources。

### 5. 本轮遗留

1. 真实指针点击与真键盘事件仍受面板可见性限制，需人工补一次肉眼 + 手感确认（320 / 390 各一遍）。
2. 文档文字会影响 CSS 产物，建议后续用 `@source not "../**/*.md";` 之类的显式声明隔离（本轮不动）。
3. 上一轮记的「聚合提示不区分是哪个字段非法」保持原状，由字段级红字补足。
4. Day 1 的另外两个实验（表单标签、键盘焦点）与实验结果报告仍未开发，按计划留给 Day 2。

---

## 2026-11-17 · Day 2：智能配色修复、修复前后对比与 CSS 代码导出

范围：只给「色彩对比度实验」新增**确定性修复算法 + 应用/撤销 + 前后对比 + CSS 复制**。
未开发表单标签/键盘焦点实验、未做完整结果报告、未接数据库/AI、未改技术栈、未重构无关模块。
`src/lib/contrast.ts` 的 WCAG 算法**一字未动**，修复全部复用它做真实计算。
新增文件均为新写，Git 历史保留，未覆盖 Day 1 功能。

### 0. 开工前检查（含 Day 1 遗留复核）

- 基线：`npm test` **23/23** 通过，`npm run build` 通过，工作树干净（HEAD `34b77ec`）。
- Day 1 遗留三项复核：
  1. **默认配色 + 非法草稿 + 重置**：`resetSignal` 机制（`ColorControl.tsx:34`、`ContrastLabPage.tsx`）确实有效，
     浏览器实测重置后文本框回 `#777777`、`aria-invalid` 清除、聚合/字段提示清零——**问题已修复，本轮补了回归测试**（见 §4 #10）。
  2. **Hash 路由 / 跳转主内容**：实验页 `location.hash='#main'` 后 `h1` 仍为「色彩对比度实验」，未踢回首页——正常。
  3. **320px 遮挡**：读数条 `static`，同源 iframe 320×653 实测无横向溢出、0 个控件 <44px——正常。
  三项均无需重开修复。

### 1. 任务一 · 修复算法（`src/lib/colorRepair.ts`，纯函数）

`suggestTextColor(text, bg, minRatio=4.5)` 输出 `{ ok, originalTextColor, suggestedTextColor, beforeRatio, afterRatio, needsRepair, reason }`。

算法与约束对应关系：

- **只用 `contrast.ts` 真实计算**，无任何写死结果；最终用生成的十六进制重新算 `contrastRatio` 复核。
- 输入任一侧非法 → `ok:false, reason:'invalid-color'`，不伪造结论（约束 9）。
- 当前 `beforeRatio >= minRatio`（未取整真实值判定）→ `needsRepair:false`、建议色 = 原色，**不改**（约束 8）。
- 需修复时：把文字色沿 RGB 三通道同方向分别朝**纯黑**与**纯白**线性逼近；每个方向用**整数步二分搜索**
  （`STEPS=256`）找「首次满足 `minRatio`」的取整配色。取整可能让边界差一点，向端点方向最多补几步，仍不达标则放弃该方向（约束 4、6）。
- 两方向候选按 **RGB 欧氏距离**取更小者（约束 5）。距离随逼近比例单调，故二分得到的最小 `k` 即该方向最小改动。
- 两方向都不可达 → `ok:false, reason:'unreachable'`。注：因 `ratio(black,bg)` 与 `ratio(white,bg)` 之积恒为 21，
  二者必有 ≥ √21≈4.58 > 4.5，故 4.5 目标恒有解；`unreachable` 仅为更高门槛兜底。
- 单调性依据：文字色朝单端移动时三通道同向 → 亮度单调 → 对固定背景的对比度呈「先降后升」的 V 形，
  起点在降段且 `< minRatio`，达标集合恰为 `[k*, STEPS]` 后缀，二分 lower_bound 成立。
- 注释与 UI 文案均**明确声明这不是全局最优、不保证人眼感知差异最小**，只是尽量减小 RGB 改动的实用建议。

CSS 生成：`cssBlock / buildRepairCss / buildAfterCss` 全部按入参动态拼接（`applied` 决定后段标题「建议修复后」或「已应用修复」），不含硬编码颜色。

### 2. 任务二 · 工作流状态机（`src/lib/repairWorkflow.ts`，纯 reducer）

把「生成 / 应用 / 撤销 / 改色失效」抽成与 React 解耦的 `repairReducer(state, event)`，便于在 node 环境做交互逻辑测试：

- `color-changed`（含重置）→ 回到 `idle`，清空建议与快照，杜绝过期结论被复用。
- `generate` → 调 `suggestTextColor`；仅当 `ok && needsRepair` 进 `suggested`，否则 `idle` 但保留 suggestion 供文案判断。
- `apply` → 仅 `suggested` 可执行，快照记 `{ beforeTextColor, afterTextColor, beforeRatio, afterRatio }`；背景不进快照（组件持有且修复不改背景）。
- `undo` → 仅 `applied` 可执行，回到 `idle`。
- 非预期时序（idle 下 apply/undo、过期后 apply）一律空操作。

### 3. 任务三 · 页面集成（`src/pages/ContrastLabPage.tsx`）

保留原「1 调整 / 2 预览 / 3 检测」三块不动，下方**增量新增**三块：

- **4 智能修复建议**：按钮「生成修复建议」→ 展示建议色 + 预期对比度 + 「仅改文字色、背景不变」说明 + 「应用该修复」；
  应用后按钮组变为「撤销本次修复」，快照区显示前后真实对比度。已 AA 时显示「当前配色已达到普通文本 AA，无需修复。」；
  存在非法草稿时显示「修复功能已暂停，请先修正颜色」并禁用生成/应用。
- **5 修复前后对比**：`sm:grid-cols-2`（移动端单列），两侧同背景、同示例句，只有文字色不同；各自显示文字色、背景色、
  实时 `contrastRatioFromHex` 算出的对比度与 AA 徽标（图标 + 文字 + 数字，不单靠红绿）。未应用标「建议 · 尚未应用」，应用后标「已应用」。
- **6 对比 CSS 代码**：`<pre><code>{动态文本}</code></pre>`（无 `dangerouslySetInnerHTML`、无编辑器依赖），按钮「复制修复后的 CSS」。
  复制只在点击时调 `navigator.clipboard.writeText`，**不支持或失败时如实提示、绝不谎报成功**；改色即时清除旧代码。

无障碍/交互：所有按钮为原生 `<button>` 有准确中文名；应用是「写回受控 state」→ 取色器/文本框/预览/检测同源一致，检测随之重算；
手动改色与程序化应用分走不同 dispatch，避免应用本身触发失效。

### 4. 测试与构建（真实执行）

`npm test`：**44/44 通过**（Day 1 的 23 + 新增 21）。新增两份纯函数测试，沿用项目既定「纯逻辑走 node，DOM 行为走浏览器」策略，**未引入 jsdom / testing-library 等新依赖**。

- `src/lib/colorRepair.test.ts`（13 条）：
  #1 `#777777/#ffffff`→真实 ≥4.5；#6 精确 `#767676`；#3 白字白底；#4 黑底 `#333333`→`#767676`(4.62)；
  #2 `#000000/#ffffff` 不改；非法输入 `ok:false/invalid`；7:1 高门槛；背景不变仍达标；#11 CSS 含真实色值与「修复前/建议修复后」；复制段与单块格式。
- `src/lib/repairWorkflow.test.ts`（8 条）：
  #7 generate→apply 快照 `after==建议色 / before==#777776→#777777`；#8 undo→idle；#9 改色后 apply 为空操作；
  已应用后改色清空；#10 重置清空；已 AA/非法 generate 不进 suggested 且 apply 无效；idle 下 apply/undo 空操作。

`npm run build`：`tsc -b` 严格模式通过；
`dist/index.html 0.61 kB` + `dist/assets/index-Do3tLYqi.js 258.12 kB`(gzip 80.55) + `dist/assets/index-Egjj7OAv.css 25.04 kB`(gzip 5.71)。

**浏览器交互测试**（`vite preview :4188` 生产产物，DOM 事件驱动，与 Day 1 同法）：

| 场景 | 结果 |
| --- | --- |
| 默认失败配色点「生成修复建议」 | ✅ 出现应用按钮 + 第 5、6 区块；CSS 实为 `#777777→#767676`；此时未应用、无撤销按钮 |
| 点「应用该修复」 | ✅ 文本框 `#767676`、取色器 `#767676`、预览 `rgb(118,118,118)` 三者一致；对比徽标「修复前 4.48 未达 / 已应用 4.54 达到」；反馈「…对比度提升至 4.54:1。背景颜色未改变。」 |
| 点「撤销本次修复」 | ✅ 文本框回 `#777777`、预览 `rgb(119,119,119)`、第 5 区块消失、提示「已撤销…恢复为 #777777」 |
| 生成后再手动改背景 | ✅ 应用按钮与对比区消失、快照清空（旧建议不被误用） |
| 当前为达标配色 | ✅ 无生成按钮，显示「当前配色已达到普通文本 AA，无需修复。」 |
| 文本框输入非法 `#zz` | ✅ `aria-invalid=true`、生成按钮消失、显示「修复功能已暂停…」 |
| 非法草稿后点重置（#10 回归） | ✅ 文本框回 `#777777`、`aria-invalid` 清除、暂停提示清零、实时区数量回到 1 |
| 点「复制修复后的 CSS」 | ✅ 无真实用户手势下 clipboard 被拒 → 提示「复制失败，请手动选中…」**未谎报成功**（证明失败分支真实生效；成功分支需人工在可见面板验一次） |
| Hash 路由回归 | ✅ `#main` 不踢回首页；`#/contrast` 正常 |
| 320×653 iframe | ✅ 无横向溢出(305/305)、0 个控件 <44px、空闲时实时区数量 1 |

### 5. Qoder 协助过程要点

- 复用 `contrast.ts` 公开函数完成算法，避免任何「假装算过」。
- 用 `node -e` 预校验 lucide-react 实际导出（`WandSparkles/Check/CircleCheckBig/Undo2/Copy/CircleAlert` 等），杜绝构建期才发现的图标名错误。
- 用 browser-use 在真实浏览器 DOM 层驱动整套「生成→应用→撤销→改色→非法→重置→复制」链路取证。
- 全程未创建并行 Agent、未扩范围。

### 6. 本轮遗留 / 需人工确认

1. **复制成功分支未在自动化里跑通**：headless 无用户手势，`clipboard.writeText` 被拒，仅验证了「失败不谎报」。需人工点一次确认成功提示「已复制修复后的 CSS 代码。」。
2. 肉眼观感 / 真实指针点击 / 真键盘 Tab 仍受内嵌面板 `visibilityState=hidden` 限制（沿 Day 1 结论），本轮证据为 DOM 事件 + `getComputedStyle` + 同源 iframe 几何。
3. 实时播报区由 Day 1 的「全页唯一」变为「常态唯一 + 瞬时反馈」：空闲 `[role=status]`=1；仅在应用/撤销/复制/暂停等动作后追加 1 条 `role="status"` 反馈（内容为操作结果，非重复播报对比度）。若审查要求绝对单区，可把操作反馈并入读数条同一区域。
4. 三处新逻辑（算法/状态机/页面）为纯增量；首页、路由、Day 1 控件均未改。
5. 文档文字仍可能进 CSS 产物（Day 1 遗留 #12 未处理，本轮未动构建配置）。
6. Day 1 遗留的「Git 未提交」依旧存在，需人工决定提交与推送。

### 7. 部署（Qoder Sites 官方工作流，实测）

复用同一 Project / Site（未新建站点），内容已变 → 新 action `b7848dd7-7779-4248-9ec4-79200118f974`：

- `prepare_site`（`projectRoot`=工作区、`webDirectory: "dist"`、`spa: false`、`projectId 01a1e498-…`）
  → 首次 `descriptorStatus: pending`；`get_publish_status` 显示 `artifactReady/dependenciesReady/canPublish: true`、`blockers: []`
  → 以**同一 action + 完全相同输入**重试 `prepare_site` 得 `descriptorStatus: written`（未重新打包上传）。
- `publish_site` → `get_publish_status`：**`published: true`**、operation `01a1e536-…` `state: succeeded`、`committed: true`、`readiness: publication_completed`。
- `show_publish_confirmation`（Desktop 交付卡片）已执行。
- 访问级别：`site.access_mode = public`、`auth_integration_status = not_required`，沿用 Day 1 已开放的公开访问。
- 线上核对（匿名 + 缓存绕过参数）：入口 `index.html` 引用 `assets/index-Do3tLYqi.js` + `assets/index-Egjj7OAv.css`（Day 2 构建，替换 Day 1 的 `index-BW9yt6RB.js`），
  两资源 HTTP 200；**sha256 与本地 `dist/` 逐字节一致**（JS `ff7960d293f1692b…`、CSS `89c1d0214df07e45…`）。
- 线上浏览器冒烟（生产 URL）：实验页 6 个 h2 标题齐备 →「生成修复建议」出 CSS `#777777→#767676` 与应用按钮
  →「应用」后文本框/取色器均 `#767676`、预览 `rgb(118,118,118)`、应用按钮消失、撤销出现 →「撤销」回 `#777777` 且对比区消失。
- 地址：https://accessibility-lab-3g6uvbn5duq.qoder.zone
- 附带回归观察：把缓存参数误写进 hash（`#/contrast?cb=…`）时路由判为未知 hash、保持当前页不报错，符合 Day 1 韧性设计；正确写法 `?cb=…#/contrast`。

---

## 2026-11-17 · Day 2 收尾轮：组件接线层测试、CSS 泄漏修复与重新发布

范围：仍只做色彩对比度实验的修复功能。**未**新增运行时依赖、**未**开发其他实验模块、**未**改技术栈、
`contrast.ts` 与修复算法本体一字未动。本轮补的是「测试可信度」与「构建产物纯净度」两处欠账。

### 0. 开工前复核（不采信文档结论，全部重跑）

先按任务书要求独立复现 Day 1 三个遗留项与 Day 2 全链路，而不是照抄 `PROJECT_STATUS.md`：

| 复核项 | 方式 | 结果 |
| --- | --- | --- |
| Day 1 遗留 #1：默认配色 + 非法草稿 + 重置 | 浏览器实测 + 新增自动化测试 | ✅ 已修复（`resetSignal` 生效），但**当时无任何自动化覆盖** |
| Day 1 遗留 #2：Hash 路由 / `#main` | 实测 | ✅ 正常 |
| Day 1 遗留 #3：320px 遮挡 | 同源 iframe 320×653 | ✅ 无溢出（305/305）、0 个控件 <44px、唯一 sticky 是站点头部而非结果浮层 |
| Day 2 生成→应用→撤销→改色失效→复制 | 浏览器实测 | ✅ 全部通过；应用后输入框/取色器/预览 `rgb(118,118,118)`/读数 4.54:1 四处一致 |
| 基线 | `npm test` / `npm run build` | ✅ 44/44、构建通过 |

结论：功能本身确实做完了，但任务书第七节的 #7/#8/#9/#10 属于**交互测试**，此前只有 reducer 层断言 +
一次性浏览器取证，**组件真实接线没有任何可重复的自动化回归**。这是本轮要补的实质缺口。

### 1. 新增 `src/pages/ContrastLabPage.test.tsx`（11 条，DOM 接线层）

按用户决策引入 **仅测试用** 的 `jsdom`（devDependency），生产依赖与产物不受影响；
不装 testing-library，用 `react-dom/client` + React 19 的 `act` 直接驱动，把新增依赖压到一个包。

- `// @vitest-environment jsdom` 文件级声明，全局 `environment: 'node'` 保持不变，Day 1 的纯函数测试不受影响。
- 受控输入必须走原生 value setter 再派发 `input`，否则 React 的 change tracking 不认这次赋值（`typeInto`）。
- 定位一律走语义：`label[htmlFor]` → 输入框、`aria-label` → 取色器、`h2` 文本 → 区块、`h4` → 对比栏，
  不依赖 Tailwind class 名，样式改动不会连带测试失效。
- 覆盖：#7 应用后四处同步 + 背景未被改动、#7 对比栏真实数值 ≥4.5 且前 <4.5、#8 撤销恢复并清除对比/CSS 区、
  #9 手动改色后旧建议与快照失效、#9 已应用后改色同样丢弃、#10 非法草稿重置全恢复、
  #10 补充「颜色值本身没变但草稿非法」这条最易漏的路径、#11 CSS 含真实色值且改色即清除、
  已达标显示「无需修复」、jsdom 无 `navigator.clipboard` 时如实提示不支持、各步按钮可访问名称齐全。

### 2. 变异测试（证明这些测试不是摆设）

逐条把实现改坏，确认对应测试真的会红，改回后再全量跑：

| 注入的缺陷 | 应被抓到 | 实测 |
| --- | --- | --- |
| `ColorControl.tsx:34` 依赖数组去掉 `resetSignal`（即复现 Day 1 遗留 #1） | #10 两条 | ✅ 2 红 |
| `handleTextColorChange` 不再 dispatch `color-changed` | #9 补充、#11 | ✅ 2 红 |
| `handleApply` 忘记 `setTextColor` | #7、#8 | ✅ 2 红 |

三处变异均被相关用例捕获，且**只**使对应用例变红。改动已全部回滚并核对与备份逐字节一致。

### 3. `colorRepair.test.ts` 补 3 条（13→16），覆盖此前无测试的输出分支

- `unreachable` 分支此前从未被执行。用 `#7c7c7c` 背景 + `minRatio=7` 触发：测试内先自证
  纯黑 5.00:1、纯白 4.20:1 都够不到 7:1，才断言算法如实返回 `ok:false / unreachable / 建议色为 null`，
  不伪造方案。并补一条同配色在 4.5 目标下仍有解，说明「只有 4.5:1 有恒有解的保证」。
- 补「非法输入优先于不可达」的 reason 优先级断言。

### 4. 构建产物泄漏修复（原 Day 1 遗留 #5，本轮处理）

加完测试文件后重跑构建，发现 CSS 从 25.04 kB 涨到 25.32 kB、JS 文件名哈希跟着变。
逐选择器比对线上 CSS 后定位：Tailwind v4 的自动内容扫描会把**文档和测试里的普通单词**当 class 候选——
本次是测试里的变量名 `container` 凭空生成了 `.container` 工具类。

修复：`src/index.css` 加两行 `@source not "../**/*.md"` 与 `@source not "../**/*.{test,spec}.{ts,tsx}"`。

收益核对（脚本比对选择器集合，非目测）：
- 修复后 CSS 24.54 kB，共移除 7 个选择器：`.static`、`.bottom-3`、`.outline`、`.lg:static`、`.lg:bottom-auto`、`.lg:mt-5`、`.lg:shadow-none`。
- 逐个回查生产源码：这些 token 在 `src/**` 中**均无使用**（`src/App.tsx:43` 用的是 `outline-none`，仍保留），
  它们只存在于 `DEVLOG.md` 里对 Day 1「已取消的 sticky 结果条」的文字描述中——即纯死代码。
- 新增选择器 0 个。所以这是严格瘦身，不改变任何界面表现。
- 附带确认：JS 内容 sha256 与上一版**完全相同**（`ff7960d2…`），只是 Vite 把 JS 文件名哈希与 CSS 文件名绑定，
  所以名字随 CSS 变了。产物差异只有 CSS。

### 5. 测试与构建（真实执行）

- `npm test`：**58/58 通过**（Day 1 的 23 + Day 2 首轮 21 + 本轮 14 = 算法 16 + 工作流 8 + 对比度 15 + 路由 8 + 组件 11）。
- `npm run build`：`tsc -b` 严格模式通过；
  `dist/index.html 0.61 kB` + `dist/assets/index-Cli8dxGx.js 258.12 kB`(gzip 80.55) + `dist/assets/index-CQTV__qT.css 24.54 kB`(gzip 5.63)。
- 上传前检查 `dist/`：仅 3 个文件，无 sourcemap、无 `.env`、无 localhost 引用。

### 6. 浏览器验证（新生产产物 + 线上）

- `vite preview :4189` 跑新构建全链路：4.48 未达 → 生成（标「建议 · 尚未应用」）→ 应用后
  文本框/取色器 `#767676`、预览 `rgb(118,118,118)`、读数 4.54:1 达到 AA、CSS 标题转「已应用修复」→
  撤销回 `#777777` 且对比/CSS 区消失 → 非法草稿 `aria-invalid=true` + 「修复功能已暂停」→ 重置全恢复。
- 320×653 同源 iframe（新 CSS）：无横向溢出、0 控件 <44px。
- 线上 `https://…qoder.zone` 复跑同一链路，样式表确为 `index-CQTV__qT.css`。
- **未能自动执行**：截图仍受内嵌面板 `visibilityState=hidden` 限制
  （`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`），肉眼观感与真实指针/真键盘手感仍需人工确认。

### 7. 部署（Qoder Sites 官方工作流）

内容变更 → 同 Project 新 action `ce55226c-8b9c-4138-a273-982448a01964`：
`prepare_site`（`descriptorStatus: pending`）→ `get_publish_status`（`artifactReady/dependenciesReady/canPublish: true`、`blockers: []`）
→ 同 action 同输入重试 `prepare_site` 得 `written` → `publish_site` → `published: true`、
operation `01a1e728-d9c4-7461-835b-dbac4f94d1ca` `state: succeeded`、`committed: true` → `show_publish_confirmation` 已执行。

线上核对：入口引用 `index-Cli8dxGx.js` + `index-CQTV__qT.css`；
**两资源 sha256 与本地 `dist/` 逐字节一致**（JS `ff7960d293f1692b…`、CSS `0bf2a7d3e8c333a7…`）。
访问级别仍为 `access_mode: public` / `auth_integration_status: not_required`，本轮未改动访问范围。

### 8. 本轮遗留 / 需人工确认

1. 复制**成功**分支仍无法自动化（剪贴板权限在无手势环境下被拒）；本轮新增的 jsdom 用例只覆盖「不支持时不谎报」。
   线上失败分支已实测如实提示「复制失败」。成功提示仍建议人工点一次。
2. 截图/肉眼观感/真键盘 Tab 受 `visibilityState=hidden` 限制，同上。
3. `role=status` 播报区在动作后为 2 个（读数条 + 瞬时反馈）。经用户确认**保持现状**，理由：两者内容不同、不构成重复播报。
4. **Day 1 + Day 2 全部改动仍未提交 Git**（HEAD 仍 `34b77ec`）。本轮新增 `jsdom` 也改了 `package.json`/`package-lock.json`。
   提交与推送需人工决定，未擅自执行。

## 2026-11-17 · Day 2 最终回归缺陷修复轮（非法输入下的状态一致性）

外部审查发现一个未被测试捕获的状态一致性 bug：**非法草稿只翻动了有效性标志，没有通知修复工作流清理旧建议 / 快照**。

### 1. 缺陷复现（先补能失败的测试）

根因定位在 `ColorControl.tsx:71-76`：文本框输入非法草稿时 `normalizeHex` 返回 `null`，`onChange` **不被调用**，
父组件的 `handleTextColorChange/…`（内部 `dispatchRepair({type:'color-changed'})`）因此不触发；
而 `onValidityChange` 当时只是 `setTextValid` / `setBackgroundValid`，仅更新有效性、不触碰修复状态机。
结果 `repair.phase` 仍停在 `suggested` / `applied`，页面上「4. 智能修复建议 / 5. 修复前后对比 / 6. 对比 CSS」
连同「应用该修复 / 撤销本次修复 / 复制修复后的 CSS」在已经提示「修复功能已暂停」时**继续残留**。

- 场景 A：默认配色生成建议 → 文字色输入 `zz` → 旧建议 / 对比 / CSS / 复制应消失，恢复合法后不得自动复活。
- 场景 B：生成并应用 → 背景色输入 `ggg` → 旧快照 / 撤销 / 对比 / CSS / 复制应消失，恢复合法后仍需重新生成。

在 `src/pages/ContrastLabPage.test.tsx` 新增两条真实渲染用例（复用现有 `typeInto` 原生 setter + `act`）。
**先跑这两条确认失败**：均卡在非法期间的 `not.toContain('建议文字颜色')` / `not.toContain('修复已应用')`——即残留产物，精准命中缺陷。

### 2. 最小范围修复（`ContrastLabPage.tsx`，未动算法与布局）

1. `onValidityChange` 从裸 setter 换成 `useCallback(…, [])` 的稳定回调 `handleTextValidity` / `handleBackgroundValidity`：
   一旦收到非法，除 `setXxxValid(false)` 外**追加 `dispatchRepair({type:'color-changed'})`**，立即把状态机打回 `idle`、清空建议与快照。
   - 依赖 #7「Effect 依赖 / 回调稳定」：`dispatchRepair` 与两个 state setter 均稳定，`useCallback([])` 保持引用恒定，
     使 `ColorControl.tsx:41-43` 的 `[invalid, onValidityChange]` effect 只在**非法翻转时**触发一次，不产生无限渲染；
   - 满足 #4「恢复合法不自动复活」：非法时已清态，恢复合法只走 `onChange → color-changed`（幂等回 `idle`），旧建议不会回来，须手动重新生成。
2. 渲染处再加一层显式守卫（#2「隐藏对应操作」）：
   `showRepairOutput` 追加 `!hasInvalidInput`（同时挡住 5 对比、6 CSS 与其中复制按钮），
   建议块与已应用块条件各追加 `&& !hasInvalidInput`（挡住「应用该修复」「撤销本次修复」）。
3. `handleCopy` 入口改为 `if (hasInvalidInput || !afterColor) return`（#3 复制函数在非法态也自我保护）。
4. 保持不动：`STALE_RESULT_NOTICE`「检测仍基于上一次有效配色」提示（#5）、应用 / 撤销 / 重置既有行为（#6）、
   `contrast.ts` 与 `colorRepair.ts` 算法本体（#8）。

### 3. 测试与构建（真实执行，node v25.2.1 + `export PATH=/d/Soft_Ware`）

- `npm test`：**60/60 通过**（原 58 + 本轮 2；**未删除、未放宽任何旧断言**）。
  新用例非法期与恢复期都断言；先失败→修复后通过，非以改测试掩盖问题。
- `npm run build`：`tsc -b` 严格模式通过；
  `dist/index.html 0.61 kB` + `dist/assets/index-Biknu-lx.js 258.27 kB`(gzip 80.60) + `dist/assets/index-CQTV__qT.css 24.54 kB`(gzip 5.63)。
  CSS 与上轮同哈希（无样式改动），仅 JS 随逻辑变更。

### 4. 回归验证

- **jsdom（5 文件 60 条）**覆盖全部逻辑流：生成→非法→恢复→重新生成、应用→非法→恢复→重新生成、生成→应用→撤销、默认→非法→重置。
- **真实浏览器（`vite dev :5175`，CDP 驱动 DOM）**复跑同一场景，实测布尔结果与预期一致：
  - 场景 A：生成后 `{suggest,apply,copy,compare,css}=true` → 输入 `zz` 后全 `false` 且「修复功能已暂停 / 当前颜色输入无效」=true → 恢复 `#777777` 后旧建议 `false`、`生成修复建议`=true。
  - 场景 B：应用后 `{applied,undo,copy,compare,css}=true` → 背景 `ggg` 后全 `false` → 恢复 `#777777` 后快照 `false`、`生成修复建议`=true。
  - 撤销：undo 后文字 / 取色器回 `#777777`、`撤销本次修复` 消失、`生成修复建议` 回来。
  - 重置：默认配色下留非法草稿 → 点重置后输入框 `#777777`、`aria-invalid` 清除、错误与暂停文案消失。
  - hash 路由：`#/contrast` 正常渲染实验页，首页 / 实验页导航与「返回首页」链接齐全。
- **横向溢出 / 控件遮挡 320·390**：本会话内嵌浏览器无可见视口（`viewport=0x0`、`visibilityState=hidden`，报 `NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`），
  无法做真实像素测量。结构上本轮**只新增隐藏条件、不新增任何元素或宽度**（非法态只让既有区块少渲染），
  布局/CSS 与上一轮已通过 320 实测的版本一致，溢出风险为零；仍需人工在 320/390 目视确认（承接上轮遗留 #3）。

### 5. 发布状态（未擅自重新发布）

- 线上仍为**上一轮构建** `ce55226c-…`（入口 `index-Cli8dxGx.js`），**不含本轮修复**；本轮 `dist/` 新产物为 `index-Biknu-lx.js`。
- 访问级别 `public` 未变。用户指令为「完成后停止、等待最终验收」，且发布属对外共享动作，故**本轮未触发 `publish_site`**；
  建议验收通过后按官方工作流把含修复的新 `dist/` 重新上线。

### 6. 本轮遗留 / 需人工确认

1. 含修复的新构建尚未发布线上（等验收），当前线上仍是修复前版本。
2. 320/390 真实像素溢出仍需人工目视（本会话无可见视口）。
3. 复制成功分支、截图观感同前轮，仍受无手势 / 隐藏视口限制。
4. **Day 1 + Day 2 + 本轮改动全部仍未提交 Git**（HEAD 仍 `34b77ec`），提交与推送需人工决定。

---

## 2026-11-17 · Day 3｜Day 2 正式结项 + 表单标签无障碍实验

### 1. 阶段 A：Day 2 正式结项

先读 `PRD.md` / `DEVLOG.md` / `PROJECT_STATUS.md` / `package.json` 与既有测试，确认 Day 2 功能已完整（对比度检测、自动配色、一键应用、撤销、前后对比、CSS 生成与复制、非法输入清除过期建议、键盘导航与 hash 路由），**未重新开发已完成功能**。

- `npm test`（node v25.2.1，`export PATH="/d/Soft_Ware:$PATH"`）：**60/60 通过**，4 个算法/工作流文件 + 路由 + 组件接线层，无失败无跳过。
- `npm run build`：`tsc -b` 严格模式通过，产物 `index.html 0.61 kB` + `index-Biknu-lx.js 258.27 kB`(gzip 80.60) + `index-CQTV__qT.css 24.54 kB`(gzip 5.63) —— 与 DEVLOG 上轮记录逐字节同名，说明源码与已验收构建一致。
- `git status`：待提交 = Day 1/2 全部源码、测试、三份治理文档、`package-lock.json`。`.gitignore` 复核：`node_modules`、`dist`、`*.local`、`.env*`（仅放行 `.env.example`）、`coverage`、`.vite`、`*.tsbuildinfo`、调试日志、`.DS_Store` 均已忽略；仓库从初始提交起就未跟踪构建产物（`git ls-files dist` 为空），**无需为「是否跟踪 dist」改变既有约定**。
- 提交前按用户要求暂停并展示清单 → 获确认后创建 **`943a3ac` `feat: complete accessibility contrast lab day2`**（21 files，+2029/−87）。**未推送远程，未改写任何既有历史**。

Qoder Sites 发布（官方 `prepare_site` → `get_publish_status` → `publish_site` 链路）：

- 复用既有 Project/Site（`01a1e498-…`），新 `actionId 0bf1a61d-…`，`webDirectory: dist`，`spa: true`。
- 首次准备返回 `descriptorStatus: pending`，按恢复规则以**同一 action、完全相同输入**重试 `prepare_site`，从冻结 ZIP 恢复描述符 → `written`，未重复上传、未新建站点。
- 发布成功：`readiness: publication_completed` / `published: true` / `artifactReady` / `dependenciesReady`。
- **线上 = 本地**：把线上 `index.html` 与本地 `dist/index.html` 逐字节比较为 `identical`，入口确认为最新 `index-Biknu-lx.js`（未强行指定旧文件名）。
- 公网权限实测：无痕上下文访问 `https://accessibility-lab-3g6uvbn5duq.qoder.zone/` → HTTP 200、`finalUrl` 未跳转、正文含「让每个人都能更轻松地使用互联网。」、`hasLoginGate: false`（无登录/口令元素）。线上色彩流程实测 `4.48 → 生成建议 → 应用 4.54 → 撤销回到 4.48`，与本地构建行为一致。

### 2. 阶段 B：Day 3 表单标签实验（新增文件）

| 文件 | 作用 |
| --- | --- |
| `src/lib/formLabelDemoFields.ts` | **新建**：字段 `id`（`student-name` / `student-email`）的单一来源 + 修复前后代码对比的数据源，保证「上方 DOM 的真实 id」与「第 5 块展示的代码」不会各说各话 |
| `src/lib/formLabelAudit.ts` | **新建**：只读真实 DOM 的标签关联检测器（不读 React 状态） |
| `src/pages/FormLabelLabPage.tsx` | **新建**：五段结构实验页（问题引入 / 真实表单 / 检测结果 / 修复与重验 / 代码对比） |
| `src/lib/formLabelAudit.test.ts` | **新建**：13 条检测器测试 |
| `src/pages/FormLabelLabPage.test.tsx` | **新建**：16 条组件 + 真实 DOM 测试 |

路由与入口按「最小侵入」扩展，**未重构路由系统**：`useHashRoute.ts` 的 `Route` 联合类型加 `'form-label-lab'`、`ROUTE_HASH` 加 `'#/form-label'`、`HASH_TO_ROUTE` 加一条映射（`routeFromHash` / `nextRoute` 逻辑一字未动）；`App.tsx` 加页面标题 + 三元渲染分支；`AppHeader.tsx` 的 `NAV_ITEMS` 加一项；`HomePage.tsx` 第二张卡片由 `comingSoon` 改为 `available`（真实入口），第三张「键盘焦点实验」保持仅卡片、无假按钮。

### 3. 检测器的两个关键区分

1. **「缺少关联的可见标签」≠「完全没有可访问名称」**：前者看 `input.labels` 是否含可见文本（含包裹式祖先 label），后者按可访问名称计算顺序 label → aria-labelledby → aria-label → title → placeholder 逐级判断。结果页把两个结论拆成两枚独立徽标分别显示——姓名输入框在缺陷态是「缺少关联」但仍能从 placeholder 拿到名字，因此两条不会互相冒充。
2. **只检查、不冒充全量合规**：只作用于示例表单内的文本录入控件（`button` / `checkbox` / `radio` 排除在第 1 块已声明）。第 3 块内「本实验检查什么、不检查什么」明确写出：全部通过只代表这几个控件有正确关联的可见标签，**不代表整个表单或整站符合 WCAG 2.2**，并展开列出未检查项（3.3.1 / 3.3.3 / 1.3.5 / 2.5.3 / 4.1.2 完整名称计算 / 键盘可达 / 真机朗读）。可见性判定只认 `hidden`、`aria-hidden`、行内 `display:none`、`sr-only` 约定，**不读盒模型尺寸**（jsdom `getBoundingClientRect` 恒为 0，若据此判可见会让检测器在测试环境全红而真实浏览器全绿），该边界已写进页面说明。

修复按钮真正改变渲染状态（`<span>姓名</span>` → `<label htmlFor="student-name">姓名</label>`），检测在 `useEffect` 里对新生 DOM 重跑；`input` 始终是同一位置的同一元素，**已输入内容不被清掉**；「重置实验」可回到缺陷态。第 5 块代码由 `demoFormMarkup()` 用同一份字段配置生成（含真实 `id` / `for`），逐行比较 `before !== after` 得到高亮行，纯文本 `<span>` 渲染、无 `dangerouslySetInnerHTML`、不执行任何用户提供的 HTML/JS。

### 4. 测试（真实执行，未删除也未放宽任何旧断言）

`npm test` → **90/90 通过**（7 文件）：`colorRepair` 16 + `contrast` 15 + `repairWorkflow` 8 + `useHashRoute` 9 + **`formLabelAudit` 13** + `ContrastLabPage` 13 + **`FormLabelLabPage` 16**。Day 2 的 60 条在新增 Day 3 代码后**零回归**。

- 检测器 13 条：用 `innerHTML` 现搭真实 DOM 验证真值表（显式 label / 包裹式 label / 空 label / 悬空 `for` / placeholder-only / `aria-label` 兜底 / `sr-only` / `display:none` / 无 id / null 作用域），并含「把同一个节点从 `label` 换成 `span`，结论立刻翻转」的节点级回归——证明结论来自 DOM，不是标志位。
- 页面 16 条覆盖用户第 7 节的 12 项：初始缺陷态、检测结果与 DOM 一致、点修复后真实关联建立、`label.control === input`（点击标签的激活目标）、重跑后问题数由 2 归 0、已输入内容保留、重置回缺陷态、代码对比含真实 `id`/`for`、复制三态提示、无 `dangerouslySetInnerHTML`、演示表单不提交、仅一个 `aria-live` 播报区。
- `useHashRoute` 由 8 → 9 条：新增 `#/form-label` 解析、表单页锚点不重置本页、未知 hash 不跳首页（**只加断言，旧断言原样保留**）。

**jsdom 能力边界的实测取证**：先用一段 node 探针确认 jsdom 实现了 `input.labels` 与 `label.control`，但**不实现「点击 label 让控件获得焦点」**。因此页面测试只断言到 `label.control === input` 这一层，真实焦点转交给浏览器验证——不用 jsdom 的有限模拟冒充完整的辅助技术测试。同理，本页**不模拟、不伪造屏幕阅读器的语音输出**：页面文字只描述「读屏会拿到哪个名称来源」，实际朗读仍要求真机验证。

开发中的真实失败与修正（不是掩盖）：① `tsc -b` 报 7 处 `TS2531/TS18047 Object is possibly 'null'`（TS 的 lib 里 `input.labels` 可空）→ 抽 `labelsOf()` helper 统一兜底；② 1 条组件测试 `expected +0 to be 1` —— 初始无提示时播报区尚未渲染，属**测试期望写错**，按「改测试断言、不改页面行为」修正为「初始 0 个 / 点重新检测后 `aria-live` 与 `role=status` 各 1 个」；③ 检测器首版 `controlId` 兜底表达式无意义、`referencedText` 双重非空断言 → 重写该文件。

### 5. 真实浏览器取证（`npm run preview` → http://localhost:4176，即新 `dist/` 产物）

`npm run build`：`tsc -b` 通过，2097 modules，`index.html 0.61 kB` + **`index-AFw0dV32.js` 282.01 kB**(gzip 86.55) + **`index-KGhPc1c7.css` 25.70 kB**(gzip 5.78)。产物名随 Day 3 代码变化，**未沿用它无法对应的旧文件名**。

在真实 Chromium（CDP 驱动 DOM）上实测，全部为读取到的真实值：

1. 缺陷态：姓名行第一个子节点 `tagName === "SPAN"`、`input.labels.length === 0`；检测结果条显示「检查 2 个文本录入控件，发现 **2** 项标签关联问题」。
2. 点「修复标签关联」后：同一位置 `tagName === "LABEL"`、`htmlFor === "student-name"`、`input.labels.length === 1`、`label.control === input`；检测条变为「发现 **0** 项」。
3. **点击标签真的聚焦输入框**：`label.click()` 之后 `document.activeElement === INPUT#student-name`。
4. 无障碍树名称差异（浏览器计算出的 accessible name，不是我们的猜测）：缺陷态该控件为 `textbox "请输入姓名"`（来自 placeholder），修复后为 `textbox "姓名"`（来自关联 label）——这就是「看起来有名字」与「辅助技术知道名字」的差别。
5. 「重置实验」回到 `SPAN` + 2 项问题；输入框在修复/重置过程中保持可编辑（快照 `editable="plaintext" settable focusable`）。
6. 导航：首页三张卡片渲染正常、第二张为真实入口 `#/form-label`、第三张仍只展示；`#/form-label` 直接刷新、后退回首页、前进入表单页均正确；skip link 指向 `#main` 且不踢回首页。
7. Day 2 回归：色彩实验 `4.48 → 生成建议 → 应用 4.54 → 撤销回 4.48` 全流程无异常。
8. 控制台：整轮操作后 **无 error / 无 warning**。
9. 复制按钮在真实浏览器无用户手势的环境下如实返回「复制失败，请手动选中右侧「修复后」代码复制。」——没有假装成功。

### 6. 本环境无法验证、需人工确认的项

内嵌浏览器**没有附加可见视口**（`window.innerWidth === 0`、`visibilityState === "hidden"`、所有 `clientWidth === 0`，`user.click` 报 `NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`），因此：

1. **320 / 390 横向溢出与 44px 触控目标**：溢出扫描产出 106 条假阳性（连 `html`/`body` 都被判溢出），数据不可用。结构上本页沿用 Day 2 已实测通过的同套栅格（`grid lg:grid-cols-[…]`、`min-w-0` + `overflow-x-auto`、全部控件 `min-h-11`、无 fixed/sticky 浮层），但**仍需人工窄屏目视**。
2. **真实浏览器 Tab 键事件序列**（当日记作「真实物理 Tab」，11-19 收口轮统一为准确术语）：安装 `focusin` 录制器后连按 Tab，录制结果 `tabsRecorded: 0`、`activeElement` 停留在 `main` —— 页面未 attached，按键不驱动焦点遍历。同一问题两次尝试均失败，按约定停止重试并上报。可给的替代证据只有结构性的：本页可聚焦元素全部来自自然 DOM 顺序、无正值 `tabindex`、全局 `:focus-visible` 为 3px indigo 描边。
3. **真机读屏**（NVDA / VoiceOver / TalkBack）实际朗读差异、焦点是否落在输入框、错误提示能否被听到。
4. **真实指针点击 label** 与**复制成功分支**（需真实用户手势）。
5. 视觉截图观感：本会话无法截图。

### 7. Day 3 结项状态

- Day 3 改动已按用户确认创建独立提交 **`737ceb7` `feat: add form label accessibility lab day3`**（13 files，+1496/−59）；`943a3ac`（Day 2 稳定版）保持为其父提交，构成回退点。**未推送远程，未改写历史**。
- 按用户决定**未发布 Day 3**：线上仍为 Day 2 构建 `index-Biknu-lx.js`，表单实验只在本地新产物预览（`npm run preview`）可玩。
  人工验收窄屏 / 键盘 / 读屏通过后，再走官方工作流发布 `dist/`（入口 `index-AFw0dV32.js`）。
- 有意未纳入提交：`.AccessLab 无障碍实验室.qoder.site` 的 `publication` 块（Sites 工具写入的云端 Project/Site/Deployment/Release ID + base64 冻结 `index.html`）。
  本仓库自初始提交起不跟踪构建产物（`dist/` 已忽略、`git ls-files dist` 为空），该字段属于构建快照与工具私有状态，经用户确认保持未提交。

## 2026-11-17 · Day 3 复核轮：窄屏 / 键盘真实取证与发布前核对

本轮**没有新增功能、没有改动任何源码**，只做两件事：把上一轮记为「本环境不可测」的窄屏与键盘取证补成真实数据，以及在发布 Day 3 之前重新确认线上 / 本地产物的差异。全部结论来自真实执行，未采信文档旧值。

### 1. 开工前状态核对（重跑，不采信 PROJECT_STATUS 的旧记录）

- `git log`：`943a3ac`（Day 2 结项）→ `737ceb7`（Day 3 表单实验）→ `7067ec4`（Day 3 治理文档回填）均已在库，HEAD = `7067ec4`，未推送远程。
- `git status`：工作区唯一改动仍是 `.AccessLab 无障碍实验室.qoder.site` 的 `publication` 块（+32/−1），按既有约定保持不入库；`src/` 无任何未提交改动，因此**本轮构建对应 HEAD 源码**。
- `npm test`（node v25.2.1，`export PATH="/d/Soft_Ware:$PATH"`）：**90/90 通过**，7 个文件，18.24s
  （`contrast` 15 / `colorRepair` 16 / `repairWorkflow` 8 / `useHashRoute` 9 / `formLabelAudit` 13 / `ContrastLabPage` 13 / `FormLabelLabPage` 16）。
- `npm run build`：`tsc -b` + 2097 modules → `index.html 0.61 kB` + `index-AFw0dV32.js 282.01 kB` + `index-KGhPc1c7.css 25.70 kB`，产物名与上轮记录同名（282019 / 25707 字节），**源码与已验收构建一致**。

### 2. 线上与本地差异核对（curl，无 Cookie、无登录）

| 检查 | 结果 |
| --- | --- |
| `GET /` | HTTP 200，57655 B |
| 线上 `index.html` 资源引用 | `index-Biknu-lx.js` + `index-CQTV__qT.css`（Day 2 产物） |
| 线上 JS 体积 | 258270 B（= Day 2 的 258.27 kB），内含「对比度」，**不含** `student-name`，**不含** `#/form-label` |
| 本地 `dist/index.html` 引用 | `index-AFw0dV32.js` + `index-KGhPc1c7.css`，其中 `student-name` 与 `#/form-label` 均命中 |
| `GET /assets/index-AFw0dV32.js`（线上） | **404** —— Day 3 确实尚未发布 |

订正一条旧记录：上一轮 DEVLOG 写「线上 `index.html` 与本地逐字节 `identical`」并不准确。
实测是「本地 613 B 产物 + 平台注入的 `data-qoder-watermark` 脚本 ≈ 57.6 kB」，
逐字节一致的部分是 `<head>`（含两个资源引用）与 `<body>` 里的 `<div id="root">`；水印脚本是平台行为，不是本项目的构建差异。

### 3. 真实浏览器复核（`npm run preview --port 4173 --strictPort`，Chromium）

只读取真实值，不写结论：

| 步骤 | 浏览器里读到的 |
| --- | --- |
| 缺陷态 | 姓名行子节点 `["SPAN","INPUT"]`、`input.labels.length === 0`、结果条「检查 2 个文本录入控件，发现 **2** 项」 |
| 点「修复标签关联」 | 同一位置 `LABEL`、`htmlFor === "student-name"`、`labels.length === 1`、`label.control === input`、结果条「发现 **0** 项」，修复按钮被「标签关联已修复」状态取代 |
| 点 label | `label.click()` 后 `document.activeElement === INPUT#student-name`（`reachedInput: true`） |
| 无障碍树名称 | 缺陷态 `textbox "请输入姓名"`（placeholder）→ 修复态 `textbox "姓名"`（关联 label）；两次都由 `take_snapshot` 读自浏览器 a11y 树，不是页面文案 |
| 输入保持 | 已输入的「张三（测试用，非真实信息）」在修复与重置两次 DOM 变更后都仍在，`editable="plaintext" settable focusable` |
| 重置 | `LABEL → SPAN`、`labels 1 → 0`、结果条回到「发现 2 项」 |
| 复制 | `navigator.clipboard` 存在但无用户手势 → 如实显示「复制失败，请手动选中右侧「修复后」代码复制。」，未谎报成功 |
| 播报区 | 全页 `[aria-live]` 计数 = **1** |
| Day 2 回归 | 色彩实验 `4.48 → 生成修复建议（出现 4.54）→ 应用该修复 → 撤销本次修复 → 4.48`，按钮文案随状态机切换正确 |
| 首页与导航 | 卡片 01 / 02 分别指向 `#/contrast` / `#/form-label`（均「可体验 · 进入实验」），卡片 03「键盘焦点实验」`href === null` 且显示「即将开放」；导航三条链接齐全 |
| 深链刷新 | `#/form-label` 重新加载后 `title` / `h1` 均为表单标签实验 |
| 控制台 | 整轮操作后 `list_console_messages` **无任何条目**（无 error / warn） |

### 4. 本轮新关闭的遗留项

上一轮 §6 里被环境阻断的两项，本轮视口已 attached（`innerWidth === 633`，`visibilityState === "hidden"`），实测拿到数据：

1. **320 / 390 横向溢出**（遗留 #3）：用同源 iframe 强制窄视口，对 `#/form-label`、`#/contrast`、`#/` 做真实布局测量。
   `documentElement.clientWidth` 分别为 305（320 扣滚动条）与 375，`scrollWidth` **恒等于** `clientWidth`，
   即**无横向溢出**；`code` 块的 `overflow-x-auto` 生效。全页唯一被标记「超出视口」的是 sr-only skip link（`left: -1`，来自 `-1px` 负 margin，不构成滚动）。
2. **44px 触控目标**（同上）：三页里唯一低于 44px 的可交互元素是 sr-only「跳转到主要内容」（未聚焦时 32×16 且被裁剪，本就不是指点目标；聚焦后恢复为正常按钮）。其余 10–13 个 `a / button / input` 全部 ≥ 44px。
3. **真实浏览器 Tab 键事件序列**（遗留 #4；当日记作「真实物理 Tab 序列」）：本轮 `press_key Tab` **能够驱动焦点遍历**（上轮 `tabsRecorded: 0` 的阻断已解除）。
   实测前 5 站：skip link → 站点 logo → 首页 → 色彩对比度实验 → 表单标签实验；每个焦点元素计算样式为 `outline: solid 3px indigo / offset 2px`，焦点可见性成立。
   结构性补强：全页 `positiveTabindex` 为空 → 焦点顺序即 DOM 顺序；`domOrderTabbables` 依次为 skip link、logo、三条导航、返回首页、`#student-name`、`#student-email`、提交、重新检测、`<summary>`、修复、重置、复制。
   诚实说明两点局限：只逐步走到第 5 站（未逐个按完 14 站）；本轮 `back / forward` 证据被我自己创建的窄屏 iframe 污染了联合会话历史，故后/退一致性仍以 9 条路由单测 + 上面的深链刷新实测为准。

仍未解决：**视觉截图**依旧失败（`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`，`visible=false`），真机读屏、真实指针点击 label、复制成功分支依旧需要人工。

### 5. 本轮结论与状态

- 源码零改动，`npm test` 90/90、`npm run build` 通过、Day 1 / Day 2 零回归，`dist/` = HEAD 源码的构建产物，具备发布条件。
- 按用户要求：**发布前需授权**。回退手段保留：`943a3ac` 可重建 Day 2 同哈希产物（线上 `index-Biknu-lx.js` 即该版本），旧 action `0bf1a61d…` 的历史发布仍在平台。

### 6. Day 3 正式发布（用户授权后，官方工作流实测）

治理文档更新先落地为 **`11a43bd` `docs: record day3 re-verification evidence before publication`**（2 files，+92/−8；`.qoder.site` 仍未入库；**未推送远程**）。

发布链路（Desktop，`filePreview: true`）：

1. `get_context` → 确认目录绑定 `projectId 01a1e498-acb7-…` / `siteId 01a1e498-acba-…`，旧 action 仍是 Day 2 的 `0bf1a61d…`；内容已变 → **新 action**。
2. `prepare_site`（新 `actionId 15adaa32-567d-4110-aa49-4f921fd56773`、`webDirectory: dist`、`spa: true`、同 `projectId`）→ 首次返回 `descriptorStatus: pending`；
   按恢复规则读 `get_publish_status` 确认 `preparation.state: ready` / `canPublish: true` / `blockers: []`，再以**同一 action、完全相同输入**重试 → `descriptorStatus: written`（未重复上传、未新建站点）。
3. `publish_site` 一次 → `publishOperationId 01a1e8ad-a1b2-…`；`get_publish_status` → **`published: true`**、`operation.state: succeeded`、`committed: true`、`readiness: publication_completed`、`access_mode: public`、`auth_integration_status: not_required`。

发布前产物卫生检查：`dist/` 只有 `index.html` + 2 个 asset，**无 `.map`、无 `VITE_*` 残留**、无 `.env`、无数据文件。

公网实测（curl 无 Cookie + 真实浏览器）：

| 检查 | 结果 |
| --- | --- |
| `GET /` | 200，`index.html` 现引用 `index-AFw0dV32.js` + `index-KGhPc1c7.css`，已无 `Biknu` 字样 |
| Day 3 JS | 200 / 282019 B，含 `student-name` 与 `#/form-label`，且 `cmp` 与本地 `dist/assets/index-AFw0dV32.js` **逐字节一致** |
| Day 2 JS `index-Biknu-lx.js` | **404** —— 线上内容已整体替换，旧资源不再可直连 |
| 免登录 | 响应头无 `Set-Cookie` / `Location` / `WWW-Authenticate`，匿名 200 |
| 线上表单实验 | 缺陷态 `SPAN` / `labels 0` / 「发现 2 项」→ 点修复 `LABEL` / `htmlFor="student-name"` / `labels 1` / `label.control === input` / 「发现 **0** 项」；`label.click()` 后 `activeElement === INPUT#student-name` |
| 线上色彩实验 | `4.48 → 生成修复建议 → 应用该修复（4.54）→ 撤销本次修复 → 4.48` |
| 线上导航 | 卡片链接 `#/` `#/contrast` `#/form-label` 齐备 |
| 控制台 | 公网整轮操作后 `list_console_messages` 无条目 |

**回退手段订正（重要）**：历史 action（`0bf1a61d…`，Day 2）在平台上是 `publication_completed` + `published: false`，按平台规则**重复 `publish_site` 只会返回它的既有结果，不能重新变为当前版本**。
所以回退的正确路径是「用旧源码重建 + 发布新 action」：`git checkout 943a3ac` → `npm run build`（应重新产出 `index-Biknu-lx.js`）→ 以新 `actionId` 走 `prepare_site` → `publish_site`。
Git 历史未改写、未推送远程，`11a43bd` 与 `737ceb7` 均可回退。

**仍未由工具证明的**：无痕浏览器人工目视（本轮是无 Cookie 的 curl + 真实 Chromium，非评委设备）、真机读屏实际朗读、真实指针点击 label 与复制成功分支、320/390 真机观感。

---

## 2026-11-17 · Day 4｜Day 3 结项复核 + 键盘焦点无障碍实验

第三个核心实验：`#/keyboard`「不使用鼠标，你还能找到自己正在操作的位置吗？」。覆盖 WCAG 2.2 SC 2.1.1 Keyboard、SC 2.4.7 Focus Visible，并按需提到 SC 2.4.11 Focus Not Obscured (Minimum)。定位仍是**交互体验与人工验证教学**，不是自动认证工具。

### 1. 阶段 A：Day 3 结项复核（全部重跑，不采信旧记录）

| 检查 | 实测 |
| --- | --- |
| `npm test` | **90/90**（7 文件），无失败无跳过 |
| `npm run build` | 通过，产物仍是 `index-AFw0dV32.js` 282.01 kB + `index-KGhPc1c7.css` 25.70 kB ⇒ `dist/` 就是 HEAD 源码的产物 |
| `git status` / `git log` | 工作区只有 `.qoder.site` 描述符改动（约定不入库）；`943a3ac`（Day 2）、`737ceb7`（Day 3 功能）、`11a43bd`、`474a30b`（Day 3 治理文档）均存在，历史未改写、未推送 |
| `.gitignore` | `node_modules` / `dist` / `.env*` / `coverage` / `.vite` / `*.tsbuildinfo` / 日志 / `.DS_Store` 全忽略；`git ls-files dist` 为空 |
| 线上核对（curl，无 Cookie） | `index.html` 引用 `index-AFw0dV32.js` + `index-KGhPc1c7.css`；该 JS `200 / 282019 B`；响应头**无** `Set-Cookie` / `Location` / `WWW-Authenticate` ⇒ 匿名可直接访问 |

结论：Day 3 已达标上线，**无技术阻断**，阶段 B 直接开工。仍欠的只有人工项（无痕目视、真机读屏），与 Day 3 记录一致。

### 2. 阶段 B：新增与接线

| 文件 | 作用 |
| --- | --- |
| `src/lib/keyboardFocusDemo.ts` | **单一来源**：按钮配置、`broken / repaired` 两种样式状态、缺陷态与修复态的 `:focus-visible` 规则文本、整张注入样式表、演示借阅工作流 reducer、观察阶段状态机、结语文案 |
| `src/lib/keyboardFocusAudit.ts` | **只读真实 DOM** 的检测器：按钮类名 / `tabindex` / 是否原生可聚焦，以及从本页注入样式表里抓 `.kf-demo-btn--*:focus-visible { … }` 判定 `outline: none` 与「实心轮廓缺失」两类问题 |
| `src/pages/KeyboardFocusLabPage.tsx` | 六段结构：①为什么是硬要求 ②请先别用鼠标（真实可交互示例）③焦点规则现状与修复 ④修复前后对比 + 实时 3:1 计算 ⑤五步人工验证 ⑥CSS 对比与复制，末尾「检查什么 / 不检查什么」声明 |
| `src/hooks/useHashRoute.ts` | 只追加 `'#/keyboard'` 到 `Route` / `ROUTE_HASH` / `HASH_TO_ROUTE`，`routeFromHash` / `nextRoute` 逻辑未动 |
| `src/App.tsx`、`src/components/AppHeader.tsx`、`src/pages/HomePage.tsx` | 页面标题、导航第四项、首页第三张卡片改为真实入口并删掉「最后一个还在开发」旧文案 |
| `src/index.css` | 追加 `@source not "./lib/keyboardFocusDemo.ts";` —— CSS 字符串里的 `outline` / `outline-none` 会被 Tailwind 扫成真实工具类，白白增大产物并让哈希漂移 |

### 3. 焦点样式的边界（用户红线，逐条钉住）

- 站点全局 `:focus-visible { outline: 3px solid indigo-700; outline-offset: 2px }` **保留在 `@layer base`，一个字没删**。
- 缺陷样式只来自页面内注入的 `<style data-keyboard-focus-demo="true">`，且**不带 layer**：类级选择器 `.kf-demo-btn--broken:focus-visible`（特异度 0,2,0）压过 base 层，只影响实验区三个按钮。
- 注入表里不存在裸 `:focus-visible`、裸 `button`、裸 `a` 选择器，也不命中 `header/nav/main/footer` —— 由 `App.test.tsx` 断言，并在真实浏览器里对表文本重跑同一组正则。
- 离开键盘实验后 `style[data-keyboard-focus-demo]` 随组件卸载消失，不残留。

### 4. 测试与构建（真实执行）

`npm test` **180/180（12 文件）**，Day 1 / 2 / 3 的 90 条**一条没删、没放宽**：

| 文件 | 条数 | 归属 |
| --- | --- | --- |
| `src/lib/contrast.test.ts` | 15 | Day 1 |
| `src/lib/colorRepair.test.ts` | 16 | Day 2 |
| `src/lib/repairWorkflow.test.ts` | 8 | Day 2 |
| `src/pages/ContrastLabPage.test.tsx` | 13 | Day 2 |
| `src/lib/formLabelAudit.test.ts` | 13 | Day 3 |
| `src/pages/FormLabelLabPage.test.tsx` | 16 | Day 3 |
| `src/hooks/useHashRoute.test.ts` | 10 | 由 9 增至 10（只加 `#/keyboard` 断言） |
| `src/lib/keyboardFocusDemo.test.ts` | 26 | **Day 4 新增** |
| `src/lib/keyboardFocusAudit.test.ts` | 11 | **Day 4 新增** |
| `src/pages/KeyboardFocusLabPage.test.tsx` | 34 | **Day 4 新增** |
| `src/pages/HomePage.test.tsx` | 8 | **Day 4 新增**（首页三卡片齐、旧「还在开发」文案已删） |
| `src/App.test.tsx` | 10 | **Day 4 新增**（深链、前进后退、skip link 不破坏路由、样式边界、卸载不留残余） |

`npm run build`：`tsc -b` 通过 + 2100 modules → `index.html 0.61 kB`、**`index-BfWfinPC.js` 317.53 kB**(gzip 95.84)、**`index-CLPKB9bc.css` 26.23 kB**(gzip 5.84)。

一处 React 19 的真实约束：`App.test.tsx` 想模拟「直接打开深链」时复用已卸载的 root 重渲染，报 `Cannot update an unmounted root`；改为 `unmount → 设 hash → createRoot` 重建子树，这才是深链挂载的正确等价物。

### 5. 真实浏览器取证（headless Chromium + CDP）

**方法说明**：Qoder 内置浏览器本轮没有可视表面（`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`，`viewport=0x0`、`visibilityState=hidden`），拿不到真实布局与真实按键。于是改用本机 **Microsoft Edge（Chromium）headless + 原生 CDP** 驱动：`Input.dispatchKeyEvent` 发的是可信按键（`:focus-visible` 键盘模态、Enter/Space 激活、Tab 遍历都按真实规则走），`getComputedStyle` 读的是真实级联结果，`Emulation.setDeviceMetricsOverride` / `setEmulatedMedia` 切视口与媒体特性。脚本与 JSON 记录在 `%LOCALAPPDATA%\Temp\accesslab-day4\`（取证产物，未入库），目标 `http://localhost:4174`（Day 4 新 `dist/`）。

| 检查项 | 实测结果 |
| --- | --- |
| 真实 Tab 序列（修复前） | skip link → 站点 logo → 首页 → 色彩对比度实验 → 表单标签实验 → 键盘焦点实验 → 返回首页 → **`kf-view-details` → `kf-save-selection` → `kf-step-back`**（第 8/9/10 站逐个进入，无跳跃） |
| 修复前聚焦态计算样式 | `outline-style: none`（`:focus-visible` 已匹配、宽度仍是 3px 但样式为 none）⇒ 屏幕上没有环；同期平台控件是 `solid 3px` indigo |
| Enter 操作示例按钮 | `aria-expanded false → true`、`#kf-details` 的 `hidden` 消失、播报「已展开详情：《WCAG 实战》 · 主馆 3 楼 无障碍书架。」 |
| Space 操作示例按钮 | 已保存列表 `0 / 3 → 1 / 3`，列表真的出现条目，播报「已保存 1 / 3 条…」 |
| Enter 撤回 | `1 / 3 → 0 / 3`，播报「已撤回最近一次保存：《WCAG 实战》，现在剩 0 条。」；空列表时如实说「没有可撤销的保存记录」 |
| 键盘激活「修复焦点指示」 | 焦点用 Tab 走到该按钮后按 Enter：三个按钮类名 `--broken → --fixed`，状态徽标「已应用焦点修复」，播报换规则文本 |
| 修复后聚焦态计算样式 | `outline: solid 3px rgb(67, 56, 202)`、`outline-offset: 3px`、`:focus-visible` 匹配 —— 与页面上展示的那条 CSS 完全对应 |
| hover 不伪装成焦点 | 未聚焦 + `:hover` 命中时 `outline` 仍是 `none`（只有边框 `#cbd5e1 → #94a3b8`），键盘聚焦才出现环；两张截图对照 `shot-06-hover-only.png` / `shot-09` |
| 环是否被遮挡 | 三个按钮上下左右四个方向 `elementFromPoint` 命中的都是父容器（`div.bg-white` / `div.flex-wrap`），**没有命中另一个按钮**；相邻按钮最小间距 16px > 环外扩 6px；环完整落在白色卡片内（卡片内边距 16px ≥ 6px）；祖先链无 `overflow` 裁剪 |
| 无焦点陷阱 | `kf-step-back` 之后继续 Tab：重新读取真实 DOM → 修复焦点指示 → 重置实验 → 复制修复后的 CSS → `<summary>` → 回到文档，焦点确实离开实验区 |
| 四档视口 | 320 / 390 / 768 / 1440 均 `scrollWidth === clientWidth`（无横向溢出）；1440 两栏（示例区 384px + 右栏 568px），768 及以下单栏；示例按钮恒 `94×44`（≥44px） |
| `prefers-reduced-motion` | `reduce` 时示例按钮 `transition: 1e-05s`、`animation: none`，而焦点环仍是 `solid 3px rgb(67,56,202)` ⇒ 可见性不依赖动效 |
| 平台自身焦点未被削弱 | `header nav a` 键盘聚焦 `outline: solid 3px` indigo / `offset: 2px`，与 Day 1–3 一致 |
| 前进 / 后退（干净标签页真实历史） | `#/` → 点首页卡片 → `#/keyboard`（示例按钮在） → `history.back()` → `#/`（示例按钮不在） → `history.forward()` → `#/keyboard` |
| 深链刷新保持 | `#/contrast`、`#/form-label`、`#/keyboard` 三条 `Page.reload` 后 `hash / h1 / document.title` 全部不变 |
| Day 2 回归 | 默认 `#777777/#ffffff = 4.48:1`（未达 AA）→ `#cccccc` 1.61:1 → `#111111` 18.88:1（达到 AA）→ 非法 `#12x` 保留上次有效结论并提示「检测结果仍基于上一次有效配色」→ 重置回 4.48:1 |
| Day 3 回归 | 缺陷态 `SPAN` / `labels 0` → 修复 `LABEL` / `htmlFor="student-name"` / `labels 1` / `label.control === input` → 重置回 `SPAN` / `labels 0` |
| 控制台 | 整轮只有 1 条 404：`/favicon.ico`（应用本来就没有 favicon，Day 2/3 同样如此）；无 JS 异常、无 warning |
| 剪贴板 | 本 headless 环境 `clipboard-write` 权限是 `denied`：键盘激活与鼠标点击**都**如实显示「复制失败，请手动选中右侧「修复后」CSS 复制。」；把 `writeText` 换成记录入参的桩后，交出去的字符串与页面代码块**逐行一致**（成功文案随之出现）。⇒ 页面接线已证，真实剪贴板成功分支仍待人工 |

**一个必须写下来的取证教训**：第一版脚本给 Enter 额外补了一个独立 `char` 事件，同一次按键被合成两次 keypress，「查看详情」被开了又关（播报显示「已收起详情」）。这是**脚本的缺陷，不是页面的缺陷**；改成 `keyDown(text:'\r') + keyUp` 后单次激活，上表所有交互数字都是重跑后的结果。同理，`Page.captureScreenshot` 的 `clip` 是文档坐标而不是视口坐标，第一版按视口坐标截到了页头，修正后才有 `shot-01 / shot-03` 这种「缺陷态无环 / 修复态有环」的对照图。

### 6. 本环境无法验证、需人工确认

1. 真机读屏（NVDA / VoiceOver / TalkBack）对示例按钮的实际朗读，以及焦点移动时的播报体验。
2. 评委设备上的无痕浏览器目视；Qoder 内置浏览器可视面板截图（本轮 `visible=false`，需要用户打开 In-app Browser 面板）。
3. 真实剪贴板成功分支（本轮权限 `denied`，只证明了失败提示诚实 + 交给 API 的字符串正确）。
4. OS 级 `prefers-reduced-motion`（本轮用 CDP 媒体仿真，不是系统设置）。
5. 「环在你眼里够不够明显」这一条本来就只有人能回答，页面已按此措辞写明。

### 7. Day 4 结论与状态

- 键盘焦点实验开发、测试、真实浏览器取证完成；Day 1 / 2 / 3 零回归。
- 站点线上仍是 Day 3 构建 `index-AFw0dV32.js`，**Day 4 未经确认不覆盖线上**。
- 回退路径不变：`git checkout 943a3ac|737ceb7` → `npm run build` → 新 action 发布（历史 action 不能重新变当前版本）。

## 2026-11-18 · Day 4 人工确认修复收尾轮（键盘到达次数）

Day 4 结项后复核「我已完成观察」的语义，发现它把「焦点曾经到过按钮」和「用户真的用键盘走过一遍」混为一谈。本轮只做这一件事，范围严格限定在键盘实验。

| 改动 | 实测 |
| --- | --- |
| `src/lib/keyboardFocusDemo.ts` | 观察次数拆成 `beforeSightings` / `afterSightings` 两条独立计数；新增只认键盘的判定与「应用修复保留前轮、后轮清零」的转移 |
| `src/pages/KeyboardFocusLabPage.tsx` | 计数挂在真实 `focus` / `blur` 上，并要求键盘模态（`:focus-visible` 匹配）才算一次；鼠标点击聚焦、Enter/Space 激活都不计数 |
| 「我已完成观察」启用条件 | 修复前有键盘记录 **且** `:focus-visible` 修复已应用 **且** 修复后有键盘记录，三条同时成立才可点；缺任何一条按钮保持禁用并说明缺哪一条 |
| 「重置实验」 | 清掉两轮次数 + 本人确认 + 修复状态，回到缺陷态 |
| 确认后的语义 | 只登记「已完成人工观察」，结语文案不出现「符合 WCAG」「已通过认证」 |
| 测试 | `keyboardFocusDemo.test.ts` 26 → **38**、`KeyboardFocusLabPage.test.tsx` 34 → **41**，`npm test` **199/199**；旧 180 条未删未放宽 |

真实浏览器复核（headless Edge + CDP，`Input.dispatchKeyEvent` 可信按键）：鼠标聚焦次数不涨、Tab 到达才涨；修复前 `3 次 / 0 次` 时按钮 `disabled: true`，应用修复后仍是 `3 次 / 0 次`（后轮清零），再 Tab 一轮变 `3 次 / 3 次` 才可点；点击后播报与结语逐字为「你已经体验了焦点指示修复。本次实验只验证了指定组件的焦点显示与基本操作，不能代表整个网站已经符合全部无障碍规范。」

## 2026-11-18 · Day 5｜统一成果报告 `#/report`

把「首页 → 色彩实验 → 表单标签实验 → 键盘焦点实验 → 成果报告 → 导出修复成果」这条链闭合。报告页**不重新判断颜色、标签或焦点**，只登记三个实验页已经跑出来的真实结论，并按「检测 / 修复 / 复验 / 人工确认」四档分开写。

### 1. 新增与接线

| 文件 | 作用 |
| --- | --- |
| `src/lib/experimentLedger.ts` | 台账的**纯逻辑层**：`emptyLedger`、`deriveContrastRecord` / `deriveFormRecord` / `deriveKeyboardRecord`、`snapshotFromAudit`、`reduce`（含 JSON 去重 bail-out）。每一条结论都由实验页已有的检测/算法结果推导，报告页拿不到「凭空数字」 |
| `src/context/ExperimentLedgerContext.tsx` | React Context + `useReducer`，挂在 `App` 根上 ⇒ 切路由不丢记录；**不写 localStorage、不发请求**，刷新即清空 |
| `src/lib/reportModel.ts` | 页面与 Markdown 的**同一份数据源**：概览计数、四档状态、每实验的证据与限制、`NON_CERTIFICATION_STATEMENT`、`buildReportMarkdown()` |
| `src/pages/ReportPage.tsx` | 总览 + 三张实验卡（状态 / 问题 / 修复 / 证据 / WCAG 依据 / 未检查范围 / 回实验页入口）+ 需要人工验证的条目 + 说明 + 复制 / 下载 / 清空 |
| `src/lib/reportModel.test.ts` 11、`src/lib/experimentLedger.test.ts` 16、`src/pages/ReportPage.test.tsx` 17、`src/App.report.test.tsx` 11 | 单元 + **整棵 `App` 的跨路由真实集成**：在同一个根里走完三个实验再看报告 |
| `src/hooks/useHashRoute.ts`、`src/App.tsx`、`src/components/AppHeader.tsx`、`src/pages/HomePage.tsx` | 追加 `'#/report'` 映射、导航第五项「成果报告」、首页第四张卡片与轻量入口；`Route` / `routeFromHash` / `nextRoute` 逻辑未动 |
| 三个实验页 | 各加一段「把本次结果镜像进台账」的 effect；`report === null`（异步检测未回来）时**不消费**首挂载跳过标记 |
| `index.html` + `public/favicon.svg` | 补上 favicon，顺带关掉遗留 #11（`/favicon.ico` 404） |
| `#main` | 去掉 `outline-none`，让全局 `:focus-visible` 生效 ⇒ 关闭遗留 #10（skip link 落点自身无可见焦点） |

### 2. 测试与构建（真实执行）

`npm test` **254/254（16 文件）**，Day 1–4 的 199 条**一条没删、没放宽**（Day 5 净增 55 条，全部来自 4 个新文件）：

| 文件 | 条数 | | 文件 | 条数 |
| --- | --- | --- | --- | --- |
| `lib/contrast.test.ts` | 15 | | `lib/keyboardFocusDemo.test.ts` | 38 |
| `lib/colorRepair.test.ts` | 16 | | `lib/keyboardFocusAudit.test.ts` | 11 |
| `lib/repairWorkflow.test.ts` | 8 | | `pages/KeyboardFocusLabPage.test.tsx` | 41 |
| `pages/ContrastLabPage.test.tsx` | 13 | | `pages/HomePage.test.tsx` | 8 |
| `lib/formLabelAudit.test.ts` | 13 | | `App.test.tsx` | 10 |
| `pages/FormLabelLabPage.test.tsx` | 16 | | `lib/experimentLedger.test.ts` | **16（Day 5）** |
| `hooks/useHashRoute.test.ts` | 10 | | `lib/reportModel.test.ts` | **11（Day 5）** |
| `pages/ReportPage.test.tsx` | **17（Day 5）** | | `App.report.test.tsx` | **11（Day 5）** |

`npm run build`：`tsc -b` 通过 + 2104 modules → `index.html 0.67 kB`、**`index-C9lhVihd.js` 359.92 kB**(gzip 108.20)、**`index-9irSWUca.css` 27.62 kB**(gzip 6.09)。

集成测试抓到的一处真实缺陷：重新进入 `#/keyboard` 时，异步 DOM 检测让 effect 跑第二遍，把上一轮保留的记录覆盖成「尚未记录」。修法是让首挂载跳过标记只在 `report !== null` 时才消费 —— 语义上「还没检测」不该被当成「用户重新检测了一遍」。

### 3. 真实浏览器取证（headless Chromium + CDP）

方法同 Day 4（`Input.dispatchKeyEvent` 可信按键、`getComputedStyle` 真实级联、`Emulation` 切视口、`Page.reload` 测刷新）。脚本与 JSON 在 `%LOCALAPPDATA%\Temp\accesslab-day5-verify\`（取证产物，不入库），目标 `http://localhost:4173`（含 Day 5 改动与 favicon 的 `dist/`）。

| 检查项 | 实测结果 |
| --- | --- |
| 跨路由真实聚合 | 首页 → 色彩（生成建议 + 应用）→ 表单（修复标签）→ 键盘（Tab 三轮 + 修复 + Tab 三轮 + 我已完成观察）→ 报告：`已记录 3 / 3`、`已实际执行修复 3 / 3`、`已重新验证 3 / 3`、`仍需人工验证 3 项` |
| 数字与实验页一致 | 色彩 `#767676 / #ffffff`、修复前 `4.48:1` 未达 AA、修复后 `4.54:1` 达到 AA，预览色 `rgb(119,119,119) → rgb(118,118,118)`；表单 `2 项：缺少程序化关联的可见标签、只有 placeholder 在承担标签职责 → 没有发现问题`，控件数 `2 个`；键盘 `3 次 / 3 次` 且「是：由你点击「我已完成观察」记录，不是程序自动判定」 |
| 未运行 ≠ 0 项 | 只跑表单时报告写 `1 / 3`，色彩与键盘均为「尚未记录的实验：色彩对比度实验、键盘焦点实验」 |
| 撤销 / 重置失效 | 撤销色彩修复 → 报告回到「已检测当前配色，尚未生成修复建议」且不再出现 `4.54`；表单重置 → 「已检测，尚未修复」；键盘重置 → 「尚未记录到键盘体验」 |
| 刷新清空 | `Page.reload` 后 `0 / 3`、6 处「未记录」文案、复制按钮禁用、`localStorage` / `sessionStorage` 键数 `0`、无 Cookie |
| 页面 / Markdown / 剪贴板 / 下载同源 | 交给 `clipboard.writeText` 的字符串与 `#report-markdown-source` **逐字相同**；下载得到 `AccessLab-成果报告-20261118114209.md`（5165 字节，`matchesTextarea: true`）；`readText` 回读被浏览器策略拒绝（`NotAllowedError`），故以「写入入参 + 落盘文件」两侧比对取证，不谎称读回了剪贴板 |
| 清空需明确确认 | 第一下进入确认态（记录仍在、复制仍可用）；取消后 `3 / 3` 不变；确认后 `0 / 3` + 播报「已清空本次会话登记的实验记录…」，触发按钮变禁用态，焦点交给状态提示本身而非掉回 `<body>` |
| 320 / 390 / 768 / 1440 | 四档 `pageOverflow: false`；320 与 390 的溢出全部由 `<pre>` 内部横向滚动承担（`scrollWidth 659 > clientWidth 246`，`overflow-x: auto`） |
| skip link 与 `#main` | 首个 Tab 站点是「跳转到主要内容」（`solid 3px` 环可见）；Enter 后 `document.activeElement === <main id="main">`，`getComputedStyle` 读到 `solid 3px … offset 2px`，截图 `shot-00-skip-link-and-main-focus.png` |
| 导航 | `['首页','色彩对比度实验','表单标签实验','键盘焦点实验','成果报告']`，全部 `height ≥ 44`、宽度 48–104px，键盘聚焦 `solid 3px` 环可见 |
| 标题层级 | 报告页 `[1,2,3,2,3,4,4,3,4,4,3,4,4,2,3,2]`：一个 `h1`、无跳级；`role="status"` 区唯一且 `aria-live="polite"` / `aria-atomic="true"` |
| 控制台与网络 | 整轮 `console-messages: []`；请求只有 `/`、`/assets/index-C9lhVihd.js`、`/assets/index-9irSWUca.css`、`/favicon.svg`（`200`）⇒ 遗留 #11 的 `/favicon.ico` 404 消失 |

### 4. 本环境无法验证、需人工确认

1. 真机读屏对报告页结构与播报顺序的实际体验（无障碍树与 `role=status` 只是结构证据）。
2. 评委设备上的无痕浏览器目视，以及 Qoder 内置浏览器可视面板截图（本轮仍 `visible=false`）。
3. 真实剪贴板「复制成功」分支（headless 下 `clipboard-read` 被策略拒绝，成功文案只在单测里以桩验证过）。
4. OS 级 `prefers-reduced-motion`（本轮用 CDP 媒体仿真）。

### 5. Day 5 结论与状态

- 键盘焦点实验与统一成果报告开发、测试、真实浏览器取证完成；Day 1 / 2 / 3 / 4 零回归。
- 提交 `691a160 feat: add keyboard focus lab and unified report`（31 files，+5994/−42；不含 `.qoder.site` 描述符与 `.qoder.zip`），未推送远程。
- 发布经用户单独授权后完成，见下一节。

## 2026-11-18 · Day 4 + Day 5 公网发布与公网实测

### 1. 发布动作（同一 projectId / siteId，新 action）

| 项 | 结果 |
| --- | --- |
| 发布前复核 | HEAD `691a160` 与工作区 `src/` 无差异；`dist/` 四文件（`index-C9lhVihd.js` 359923 B、`index-9irSWUca.css` 27627 B、`favicon.svg` 232 B、`index.html`），无 `.map`、无 `VITE_*`、无数据文件 |
| 线上发布前状态 | 仍是 Day 3：`index-AFw0dV32.js` 200 / 282019 B，Day 4/5 的 `index-C9lhVihd.js` 404 |
| `prepare_site` | action **`3217dd18-1ce3-4eda-bf53-71bc2de71b25`**、`webDirectory: dist`、`spa: true`、同 `projectId 01a1e498-acb7-…`；首返 `descriptorStatus: pending` → `artifactReady/dependenciesReady/canPublish` 齐了以后**同 action 同输入重试**恢复描述符 `written`，未重复上传 |
| `publish_site` | `publishOperationId 01a1ed0c-65ec-…`、`operation.state: succeeded`、`committed: true`、`readiness: publication_completed`、`published: true` |
| 访问权限 | `access_mode: public`、`auth_integration_status: not_required`；匿名 curl 200 且响应头无 `Set-Cookie` / `Location` / `WWW-Authenticate` |
| 线上 = 本地 | 三个资源逐个 `cmp` **identical**（JS 359923 B / CSS 27627 B / favicon 232 B）；Day 3 的 `index-AFw0dV32.js` 现返回 404 ⇒ 已被新版本覆盖 |

### 2. 公网真实浏览器实测（headless Edge + CDP，目标线上域名）

| 检查项 | 实测结果 |
| --- | --- |
| 外壳 | 入口脚本 `…/assets/index-C9lhVihd.js`；导航 `['首页','色彩对比度实验','表单标签实验','键盘焦点实验','成果报告']`；三页 `document.title` 与 `h1` 正确；`/favicon.svg` 200 |
| 色彩实验 | 生成建议 + 应用后状态区「当前对比度4.54:1达到 AA」，正文 `当前对比度4.54:1` |
| 表单实验 | 修复前 `SPAN` / `labels 0` / 无 `label[for]` → 修复后 `LABEL` / `labels 1` / `label.control === input` |
| 键盘实验（真实按键） | Tab 轨迹 8 个链接站 → `kf-view-details* → kf-save-selection* → kf-step-back*`，修复前徽标 `3 次 / 0 次`、聚焦态 `outline: none 3px …`、「我已完成观察」`disabled: true`；点修复后 Shift+Tab 退回示例组（`kf-view-details` 处读到 `solid 3px rgb(67, 56, 202) offset=3px`）再 Tab，后轮累计 `5 次` ⇒ 按钮解锁，点击后结语逐字命中 |
| 报告页 | `3 / 3`、`3 / 3`、`3 / 3`、`3 项`；`修复前 3 次 / 修复后 5 次`、确认栏「是：由你点击「我已完成观察」记录，不是程序自动判定」；色彩 `4.48:1 → 4.54:1`；表单 `2 项… → 没有发现问题`；标题层级 `[1,2,3,2,3,4,4,3,4,4,3,4,4,2,3,2]`；`aria-live=polite/aria-atomic=true`；认证声明徽条出现；无总分/百分比表述 |
| 复制 | 桩住 `writeText` 后：状态「已复制完整 Markdown 报告…」，交出去的字符串长度与 textarea **完全一致且逐字相同** |
| 下载 | 真实落盘 `AccessLab-成果报告-20261118131122.md`：**10893 B === `TextEncoder` 编码 textarea 的 10893 B**，解码后 `identical: true`（5165 字符），状态区如实写「文件只在你的浏览器里拼装，没有上传到任何服务器」 |
| 390 视口 | `scrollWidth === clientWidth === 390`、`pageOverflow: false`、无越界元素；长代码块 `overflow-x: auto`（`scrollWidth 659 > clientWidth 316`） |
| skip link（硬刷新后） | `Page.reload(ignoreCache)` 后首个 Tab 站 = `A[href="#main"]`「跳转到主要内容」，`solid 3px` 环 + `:focus-visible`；Enter 后 `activeElement === MAIN#main`（`tabindex="-1"`）且环 `solid 3px … offset=2px`；台账 `0 / 3` |
| 会话性 | 硬刷新后 `0 / 3`、9 处「未记录」、复制按钮禁用、`localStorage` / `sessionStorage` 键数 `0` |
| 控制台 | 两轮公网实测 `console-messages: []`（含 `Runtime.exceptionThrown` 监听） |
| 截图 | `shot-public-home-1440.png`、`shot-public-report-empty-1440.png`、`shot-public-keyboard-1440.png`（临时目录，不入库） |

**两条取证教训（都是脚本的问题，不是页面的问题，已重跑修正）**：
① 第一版公网脚本把「下载文件 vs textarea」比成了 `false` —— 原因是我的 `evalJs` 包装器需要显式 `return`，漏写导致拿回 `undefined`；补上 `return` 后同一比对为 `identical: true`、字节数 10893 对 10893。
② 第一版脚本测 skip link 时用 `Page.navigate` 跳到**同一个 URL**，Chromium 把这当成文档内片段跳转（不重载），顺序焦点起点仍停在页面中下部的 `<summary>`，于是「第一个 Tab 站」读到 SUMMARY；改成 `Page.reload(ignoreCache: true)` 后首站恢复为 skip link。同理，键盘轮次第一轮只到 `2 次` 是因为我把起点 `focus()` 在 `<main>` 上、前三次 Tab 花在了 main 之内的链接上，改为「从文档开头连续 Tab 直到三个示例按钮都到达」才拿到真实的 `3 次`。

## 2026-11-18 · Day 6｜产品体验与视觉精修（不新增功能）

宣传语沿用「让网页的障碍，看得见、改得掉。」。本轮目标只有一个：让评委在约 10 秒看懂产品价值，
并在约 3 分钟里顺完「首页 → 色彩 → 表单 → 键盘 → 报告」这条已经存在的动线。

### 0. 本轮边界（先说清没动什么）

- **未**新增实验模块、**未**改任何检测算法与阈值、**未**改事件处理与台账写入的**条件和时序**（只改提示的渲染位置与文案）。
- **未**新增依赖（`package.json` 无改动）、**未**改路由表结构（`ROUTE_HASH` 五条原样，「下一步」只是普通 `<a href="#/…">`）、**未**改状态管理方案。
- **未**引入动画 / 图标 / 图表库、**未**新增图片、**未**接统计；视觉改动全部用既有 Tailwind 令牌与已有组件。
- **未**为了统一焦点样式而修掉键盘实验的教学缺陷态：`.kf-demo-btn--broken:focus-visible { outline: none }` 原样保留，注入表仍只命中 `.kf-demo-btn*`。
- 上一轮**未提交**的 `DEVLOG.md` / `PROJECT_STATUS.md` 改动（Day 4 + Day 5 发布与公网实测记录）一字未改，本节内容全部追加在其后。
- 「三分钟」是目标动线，页面**没有**新增计时器、完成度或任何「三分钟达标」暗示。

### 1. 改动清单（按任务）

**A 首页价值表达**（`src/pages/HomePage.tsx`、`src/components/ExperimentCard.tsx`）

| 改动 | 说明 |
| --- | --- |
| 首屏可扫读 | 标语保留；新增「给谁用 / 解决什么 / 怎么体验」三组 `<dl>` 要点，一屏内读完，不需要滚动 |
| 唯一主行动 | 只剩一个实心主按钮「开始第一个实验」（→ `#/contrast`）；其余出口降为下划线文字链接，视觉层级拉开，不再有第二个同等强度的按钮 |
| 对比案例真实化 | 「修复后」不再写死 `#595959`，改为直接调用实验页同一套 `suggestTextColor('#777777', '#ffffff')` → `#767676`；首页显示的 `4.48:1 → 4.54:1` 与进实验页算出来的**必然一致** |
| 判定不只靠颜色 | 修复前 / 修复后两栏各自带「比值 + 图标 + 达到 AA / 未达 AA」，并在卡片下写明依据：WCAG 2.2 SC 1.4.3 普通文本 AA ≥ 4.5:1；第二案例说明改成「另一种做法：文字不动，背景加深」 |
| 三张卡一致 | 统一 `p-5`、`rounded-xl` 主链接、hover 边框、`transition-colors`、同一标题层级与摘要长度；主链接补 `sr-only` 的「 · 标题」，读屏逐条念时能分清进的是哪个实验 |
| 摘要说人话 | 例：表单卡从「看看少了标签关联的输入框，会让屏幕阅读器用户难以确认该填什么…」改为「输入框旁边那行字，读屏软件可能根本读不到。补上真正的关联试试。」 |
| 没有做 | 无进度百分比 / 完成徽章 / 奖励 / 插画；无「100% 合规」类表述 |

**B 三分钟动线**（新建 `src/components/NextStepCard.tsx` + 三个实验页各一处 + 三页首屏）

- 色彩页尾：「下一步：让输入框拥有正确的标签」→「进入表单标签实验」（`#/form-label`）。
- 表单页尾：「下一步：体验键盘焦点」→「进入键盘焦点实验」（`#/keyboard`）。
- 键盘页尾：沿用**唯一**一条「查看统一成果报告」（`#/report`），改用同一个区块呈现，页面上不再有第二个报告出口。
- 该区块只是一个链接：不自动跳转、不设进入门槛、不判断上一个实验做到哪一步、不写台账，评委随时可以停下或跳走。
- 三个实验页首屏统一改为「**你会遇到什么 → 你要做什么 → 修好能看到什么**」三小段（`<ol>` 列表项，非新增步骤组件）；
  WCAG 依据、检查范围与未检查项**一条没删**，从首屏正文收进同页的说明区 / `<details>`，需要时展开。

**C 一致性与反馈位置**（四个页面）

- 统一：标题层级、区块间距、卡片圆角、控件 `min-w-0 rounded-* … p-5`、按钮 `min-h-11`、结果区结构、代码块容器。
- 反馈跟着动作走：`notice` 从「一个全局字符串」改为「`{ area, text }`」，
  修复 / 重置 / 重新检测的结果播报在操作所在区块旁边（色彩页第 4 节、表单页第 4 节、键盘页第 3 节），
  复制成败播报紧贴代码块（色彩页第 6 节、表单页第 5 节、键盘页第 6 节）；**没有**固定在页面底部的 toast，`onClick` 与 reducer 写入逻辑未动。
  代价与如实记录：色彩页现有 3 个 `role="status"`（读数 / 修复 / 复制）、表单页与键盘页各 2 个、报告页仍是唯一 1 个（见遗留 #13）。
- 状态说法收敛为五档：检测未完成 / 发现问题 / 达到当前检查目标 / 已应用修复 / 等待人工验证；
  「已应用修复」处处带范围限定（如表单页 chips「已修复并通过重新检测（仅指示例控件的标签关联）」），不等于「全部通过」；状态一律图标 + 文字，不只靠颜色。
- 代码块：`<pre>` 统一 `min-w-0 overflow-x-auto`，320 / 390 下由代码块自己滚动；展示内容仍与真实注入样式表 / 真实 DOM 同源，未引入代码编辑器。

**D 报告口径与可读性**（`src/lib/reportModel.ts`、`src/pages/ReportPage.tsx`）

- 统计标签从「已重新验证（复算或重检 DOM）」改为「**已进行修复后复核（含人工键盘体验）的实验数**」；
  Markdown 汇总行同步为「已进行修复后复核（含人工键盘体验）：N 个实验」；口径解释新增单一来源 `REVERIFIED_HELP`，页面与 Markdown 共用同一段话。
- `reVerified` 的判定规则**一字未改**（色彩 = 应用过修复且当前仍算得出比值；表单 = 应用过修复且复检问题清零；键盘 = 应用过修复且修复后有 Tab 到达记录），Day 5 相关测试原样通过。
- 未检查项补齐具体阈值：SC 1.4.3 普通文本 AA 4.5:1 / 大文本 AA 3:1、SC 1.4.6 AAA 7:1 / 大文本 4.5:1、SC 1.4.11 非文本 ≥ 3:1，
  并新增一条边界说明：色彩实验**只判定内置示例的一对普通文本 AA**。
- 首屏 lead 改为「这次会话登记了 N / 3 个实验的成果，其中 X 个真正改动了页面，Y 个已由你本人确认」；
  三张实验卡结构对齐（状态 / 问题 / 修复 / 证据 / 依据 / 未检查范围 / 回实验页）；「仍需人工验证」单独成组；
  空台账给出去哪个实验的引导；复制 / 下载入口靠近结果。
- 逐字保留：「刷新页面或关闭标签页就会清空」与「本报告仅针对 AccessLab 内置示例，不是网站 WCAG 合规认证。」

### 2. 测试与构建（真实执行）

| 项 | 结果 |
| --- | --- |
| `npm test` | ✅ **274 passed / 17 files**（7.52s，无失败无跳过）；Day 5 的 254 条**一条未删、未放宽** |
| 本轮新增 | ✅ `src/App.day6.test.tsx` **20 条**（整棵 `App` 层面），覆盖用户列的 11 项：首页单主 CTA 与三条卡片路由、色彩 / 表单下一步链、键盘页唯一报告入口、切路由不清台账、复核统计口径在页面与 Markdown 一致且旧说法消失、未检查项 WCAG 阈值、旧三套检测无回归、复制 / 下载不变质、空台账与待人工验证状态 |
| `npm run build` | ✅ `tsc -b` 干净 + 2105 modules → `index.html 0.67 kB`、**`index-gw0uvRiw.js` 368.99 kB**(gzip 110.43)、**`index-DgYwPq9n.css` 27.97 kB**(gzip 6.15) |
| 体积变化 | JS +9.07 kB（gzip 108.20 → 110.43）、CSS +0.35 kB（gzip 6.09 → 6.15）相对 Day 5 的 `359.92 kB / 27.62 kB`；增量来自 NextStepCard 组件与三页首屏说明文本、`reportModel` 的口径 / 未检查项文案、报告页信息层级结构；**依赖零变化**（modules 2104 → 2105 就是新增的 `NextStepCard.tsx`） |

### 3. 真实浏览器取证（headless Edge + 原生 CDP，本地 `dist`，脚本在临时目录 `.day6-evidence/`，不入库）

- 浏览器：`Edg/157.0.4341.60`；被取证产物：`index-gw0uvRiw.js` + `index-DgYwPq9n.css`（与刚跑完的构建同名）。
- **评委流程 16 步机械耗时 7.9 秒**（脚本连点，不含阅读与思考；远低于三分钟目标，主要时间实际花在键盘实验的两轮 Tab 观察上）。
- 单页可独立进入：五条 hash 深链直达分别渲染首页标语与四个页面自己的 `h1`，动线不依赖前一步。
- 动线：首页主按钮 → `#/contrast`「色彩对比度实验」→「下一步」→ `#/form-label`「表单标签实验」→「下一步」→ `#/keyboard`「键盘焦点实验」→「查看统一成果报告」→ `#/report`，全程无自动跳转。
- 报告读数（真实跑完三个实验）：`已记录 / 总实验数 3 / 3`、`已实际执行修复的实验数 3 / 3`、
  `已进行修复后复核（含人工键盘体验）的实验数 3 / 3`、`仍需人工验证的条目 3 项`；
  色彩 `#777777 4.48:1 未达 AA → #767676 4.54:1 达到 AA`；表单 `2 项 → 没有发现问题` 且「是否真的改过 DOM = 是：姓名那行已从普通文本换成带 for 的 label，随后重新读取真实 DOM」；
  键盘 `修复前 3 次 / 修复后 3 次`，确认项「是：由你点击「我已完成观察」记录，不是程序自动判定」，教学阶段停在「用户已确认观察结果」。
- 导出同源：页面 textarea 与 Markdown 均 5651 字符；真实落盘 `AccessLab-成果报告-20261118211631.md` **12047 B === `TextEncoder` 编码 textarea 的 12047 B**（逐字节相同）。
- 会话性：切走再切回仍 `3 / 3`；同页刷新 → `0 / 3` 且复制 / 下载按钮回到禁用（`[true,true,true]`），与页面说法一致。
- 四档视口：320 / 390 五页 `overflowPx = 0`、无越界元素；768 / 1440 为 `-15px`（滚动条宽度，非溢出）；导航在任何宽度都未压住正文；
  所有 `<pre>` 只在自己的框里横向滚动，**0 个**撑破页面。
- 触控目标：320 / 390 下可交互元素全部 `≥ 44px`；768 / 1440 唯一低于 44px 的是 5 个顶部导航链接（**高 36px**，满足 SC 2.5.8 的 24px 最低标准，未达 44px 建议值）→ 记入遗留。
- 真实键盘：连续 Tab 前 5 站 = skip link → logo → 首页 → 色彩 → 表单，每站 `outline: solid 3px … offset=2px`；
  在 `#/keyboard` 里按 7 次 Shift+Tab 回到「跳转到主要内容」，Enter 后 `activeElement === main#main` 且仍在键盘实验页。
- 缺陷态与修复态（真实按键，非 jsdom）：缺陷类名 `kf-demo-btn kf-demo-btn--broken`，
  Tab 聚焦「查看详情 / 保存选择」时计算样式 `outline: none 3px`、`box-shadow: none`；
  应用修复后聚焦「返回上一步」= `outline: solid 3px` 且 `:focus-visible` 匹配为 `true`；
  注入样式表规则只命中 `.kf-demo-btn--broken:focus-visible` / `.kf-demo-btn--fixed:focus-visible` / `.kf-demo-btn:focus-visible`。
- 减弱动效（CDP 媒体仿真）：`reduce` → `scroll-behavior: auto`、链接 `transition: 1e-05s`；`no-preference` → `smooth` / `0.15s`。
- 控制台：整轮 **无 error / 无 warning**（含 `Runtime.exceptionThrown` 监听）。
- 截图 12 张（临时目录，不入库）：`b1-keyboard-broken-focus-1440.png`（缺陷态看不出焦点）↔ `c5-keyboard-fixed-1440.png`（修复态 3px 环）为本轮修改前后对照；
  另有 `c1-home / c3-contrast-applied / c4-form-fixed / c6-report / a1-home-tabfocus` 与窄屏 `d1-home-320 / d2-contrast-320 / d3-form-390 / d4-keyboard-390 / d5-report-390`。
- 观察到的疑惑点 / 多余步骤（如实，不改检测结果）：① 768 / 1440 顶部导航 36px 高；
  ② 键盘实验需要两轮 Tab 才解锁「我已完成观察」，实测禁用态时页面在按钮旁给出「还需要…」说明，但评委可能先点后读；
  ③ 报告页阶段名与统计标签同屏多次出现「修复后复核」，读起来略重复（保留同一口径优先于去重）。
- **取证脚本层面的教训**（都是脚本问题，页面本身一次就够）：长页面里「量坐标 → 派发点击」之间异步结果区会把版面顶开一次，
  导致 `修复标签关联 / 修复焦点指示 / 我已完成观察` 各需要第二次点击才落地；给每个关键动作加「用页面自己的真实痕迹校验 + 重新定位再点」的 `stepChecked()` 后才拿到干净的 `3 / 3`。
  另一处：校验「修复标签关联」是否生效不能只看 `label[for]` 是否存在（邮箱标签本来就有 `for`），必须钉在 `#student-name` 的 `labels` 上。

### 4. 本环境仍然无法验证、需人工确认

真机读屏（NVDA / VoiceOver / TalkBack）朗读顺序、真实剪贴板「复制成功」分支（headless 权限 `denied`，只能证明交给 `writeText` 的字符串）、
系统级「减少动效」设置下的观感（本轮用 CDP 媒体仿真）、评委设备无痕浏览器目视，以及 Qoder 内置浏览器可视表面截图。

### 5. Day 6 结论与 Day 7 待办

- 结论：五项任务（A 首页 / B 动线 / C 一致性 / D 报告 / E 复核）本地完成，274 条测试与生产构建通过，真实浏览器复核拿到干净的 `3 / 3` 证据，Day 1–5 零回归。
- 单独上报（按 D1 要求，未改规则）：「修复后复核」这一列在三个实验里的判定并不同构——
  色彩不要求「问题清零」（对比度没有清零概念），表单要求复检 `issueCount === 0`，键盘要求修复后真有 Tab 到达记录。
  口径改名后这句话覆盖面变宽了但规则没变，若要同构化需另开一轮并同步调整 Day 5 测试。
- Day 7 建议：① 顶部导航在 768 / 1440 下把可点区补到 44px（只加内边距，不改视觉）；
  ② 人工收一轮真机读屏 + 无痕目视 + 真实复制成功分支；③ 评估大文本 AA 3:1 是否升级为可交互判定（仍属 1.4.3）；
  ④ 视需要把「修复后复核」的三实验判定同构化（要用户先确认）；⑤ 参赛材料图文整理（不要用取证脚本目录里的 `profile/`、`downloads/`）。
- Git：本节写就时改动**尚未提交**（当时在等你确认）。**§6 已更新事实**：你随后以 **`82ecef4 11-18阶段性提交`** 把 Day 6 源码、`NextStepCard.tsx`、`App.day6.test.tsx`、三份治理文档、`.day6-evidence/` 与 Sites 描述符一并入库并推送了 origin/main——「描述符与取证目录不入库」的旧口径从那次提交起不再成立。

### 6. Day 6 公网发布与公网实测（用户授权「更新 site」）

发布走的是**同一个现有站点**（未建新站、未改访问范围）：`get_context` 复用 `projectId 01a1e498-acb7-…` / `siteId 01a1e498-acba-…`
→ `prepare_site` 新 action **`b7ea5f56-2e7b-4735-b1f1-ef6c050e09bc`**（`webDirectory: dist`、`spa: true`，首返 `descriptorStatus: pending`）
→ `get_publish_status` 就绪（`preparation.state: ready`、`canPublish: true`、`blockers: []`、`access_mode: public`）
→ 同 action 同输入重试 `prepare_site` 拿回 `descriptorStatus: written`（未重复上传）
→ `publish_site` → `published: true`、`operation.state: succeeded`、`committed: true`、`readiness: publication_completed`。

| 公网核对 | 实测 |
| --- | --- |
| 线上引用 | `index.html` 指向 `index-gw0uvRiw.js` + `index-DgYwPq9n.css`；两者 curl 下载后与本地 `dist/assets/` **`cmp` identical**（368996 B / 27977 B）；Day 5 的 `index-C9lhVihd.js` → **404** |
| 免登录 | 匿名请求 `200`，响应头无 `Set-Cookie` / `Location` / `WWW-Authenticate`；`site.access_mode` 仍是 `public`（未把私有站点改成公开） |
| 同一套脚本换目标 | 给 `collect.mjs` 加 `LIVE_URL` 开关（公网产物写 `report-live.md` / `report-live.json` / `shots-live/` / `downloads-live/`），本地与公网共用同一套判定，不为线上另写脚本 |
| 评委流程 | `Edg/157.0.4341.60`，**15 步 / 机械耗时 7.1 秒**；五条深链各自独立渲染正确 `h1`；首页主按钮 → 色彩 →「下一步」→ 表单 →「下一步」→ 键盘 → 报告，无自动跳转 |
| 读数 | lead「这次会话登记了 3 / 3 个实验的成果，其中 3 个真正改动了页面，1 个已由你本人确认」；四项 `3/3、3/3、3/3、3 项`；色彩 `4.48 → 4.54`；表单「没有发现问题」+「是否真的改过 DOM = 是」；键盘 `3 次 / 3 次` 且确认项写明「由你点击…不是程序自动判定」 |
| 导出 | Markdown 5651 字符；真实落盘 `AccessLab-成果报告-20261118212713.md` **12047 B === textarea 编码后 12047 B**（脚本读目录时看到的是浏览器尚未改名的 `.crdownload` 中间态，落定后为同名 `.md`，字节数不变） |
| 会话性 | 切走再切回 `3 / 3`；同页刷新 `0 / 3` 且复制 / 下载禁用 `[true,true,true]` |
| 视口与键盘 | 320 / 390 `overflowPx: 0`、768 / 1440 `-15px`（滚动条）；代码块 0 个撑破页面；缺陷态真实 Tab `outline: none 3px`、修复态 `solid 3px` + `:focus-visible` 为 `true`；外壳 skip link / logo / 四条导航 `solid 3px offset 2px`；Shift+Tab 7 站回到 skip link，Enter 后 `activeElement === main#main` |
| 减弱动效 / 控制台 | `reduce` → `auto` / `1e-05s`；整轮 `error / warning: 无` |
| 截图 | `shots-live/` 12 张，其中 `b1-keyboard-broken-focus-1440.png` ↔ `c5-keyboard-fixed-1440.png` 是**线上**的修改前后对照 |

**这一节的结论已在当天闭合**：Day 6 是先发布、后提交（你当时只授权了「更新 site」），所以公网跑取证的那一刻线上没有对应 commit。发布与取证完成后，你以 **`82ecef4 11-18阶段性提交`**（56 files，+6743/−165，21:27:51）把 Day 6 全部源码与测试入库，`git ls-remote --heads origin` 显示 **`refs/heads/main` 与本地 HEAD 同为 `82ecef4`** ⇒ 线上 `index-gw0uvRiw.js` 现在能追溯到一个确定的 commit，`git checkout 82ecef4 → npm run build → 新 action 发布` 这条回退路径成立。
仍然没有对应的 commit 的是**本节发布记录本身**（§6 与 `PROJECT_STATUS.md` §2.10、PRD 的 Day 6 段）——它们是 `82ecef4` 之后的未提交改动，等你确认后补一次 `docs: record day6 publication and live evidence` 即可；本轮我没有执行任何 `git add` / `commit` / `push`。

## 2026-11-18 · Day 7｜综合质量与无障碍专项验收（不新增功能）

### 0. 本轮边界（先说清没动什么）

- **未**新增实验 / 页面 / 路由 / 依赖 / 状态管理，**未**做视觉重设计，**未**扩范围；
  改动集中在你点名的 A1 / A2 / A3 三项，外加取证中发现并修掉的**一处真实键盘缺陷**（B1 焦点交接）。
- **未**改任何检测算法、阈值、对比度计算、台账写入的判定条件与时序，**未**改 hash 路由表。
- 键盘实验的教学缺陷态 `.kf-demo-btn--broken:focus-visible { outline: none }` **原样保留**，
  没有为了「减少 `role=status` 数量」或视觉统一去动它。
- 旧测试**一条未删、未跳过、未放宽**：Day 6 的 17 文件 / 274 条全部保留，本轮净增 1 文件 / 21 条 → **18 文件 / 295 条**。
- 本轮**未执行**任何 `git add` / `commit` / `push`，也**未发布**：线上仍是 Day 6 的 `index-gw0uvRiw.js`。
  Day 6 留下的未提交文档改动（`DEVLOG.md` §6、`PROJECT_STATUS.md` §2.10、PRD Day 6 段、Sites 描述符）**完整保留**。

### 1. 改动清单（按任务）

| 任务 | 文件 | 改了什么 | 实测结果 |
| --- | --- | --- | --- |
| A1 首页主操作偏低 | `src/pages/HomePage.tsx`（+15/−15） | 把唯一一个主按钮「开始第一个实验」从三组要点之后提到**核心价值句之后**，压缩首屏留白；品牌句、三张实验卡、「给谁用 / 解决什么 / 怎么体验」一条不删 | 320×568 按钮顶边 **499px（折线内）**、390×844 为 470px、768 为 356px、1440×900 为 408px；`href="#/contrast"` 全页唯一 |
| A2 报告人工验证三态 | `src/lib/reportModel.ts`（+107/−17）+ `src/pages/ReportPage.tsx`（+28/−6） | 拆成 `pendingManual`（仍待你本人完成）/ `confirmedManual`（已由你确认）/ `extraVerification`（建议额外进行的辅助技术与真实场景验证）三份数组，新增 `manualVerificationGroups()`；页面小标题「（N 项）」、`<li>` 列表与 Markdown **同一份数组**；统计区补两行「实验内仍待你本人完成的观察」「建议额外进行的辅助技术验证」 | 真实点完三实验 + 确认后：`1 项 / 1 项 / 3 项`，「你还没有点『我已完成观察』」不再出现，改出现「实验内已确认：键盘焦点实验」；未确认时同一位置变回 `2 项 / 0 项 / 3 项`；色彩那条永远留在「仍待完成」并写明「实验页没有记录这一步的按钮」 |
| A3 导航可点区 | `src/components/AppHeader.tsx`（+3/−3） | 去掉宽屏那条 `sm:min-h-9`（它把导航从 44px 压回 36px），五条链接在**所有断点**统一 `min-h-11`；给 logo 链接也补 `min-h-11`；同时把导航容器 `gap-3→gap-2`、`py-3→py-2.5`、`px-3→px-2.5`，让页头不因补高度而变高（宽屏实测仍 65px）。文案 / 顺序 / 图标 / 视觉层级不动 | 320 / 390 / 768 / 1440 × 5 路由共 20 组实测导航高度全部 `[44,44,44,44,44]`；`aria-current="page"` 仍唯一 |
| B1 焦点交接（本轮发现的真缺陷） | `ContrastLabPage.tsx`（+24/−2）/ `FormLabelLabPage.tsx`（+15/−1）/ `KeyboardFocusLabPage.tsx`（+15/−1） | 五个动作（生成建议 / 应用修复 / 撤销 / 修复标签关联 / 修复焦点指示）会用结果块**顶掉原按钮**，按钮消失后浏览器把焦点退回 `<body>`，键盘用户既看不见焦点也读不到结果。改为 `tabIndex={-1}` + `focus()` 主动把焦点交给新出现的那一块（沿用报告页既有的 `statusRef` 约定），重置动作不触发交接 | 修复前实测 `afterTag: "body"`；修复后色彩三步分别落在「建议 · 尚未应用」块 / 「修复已应用」块 / 「已撤销本次修复…」，表单落在「标签关联已修复…」，键盘落在「已应用焦点修复」，下一次 Tab 落在同区下一个可用控件 |
| 测试 | `src/App.day7.test.tsx`（新增 21 条） | A2 三态 6 + A2 数字同源 5 + A1 主操作 2 + A3 导航 2 + B1 焦点交接 4 + 旧功能回归 2；三条实验靠真实点击在完整 App（外壳 + hash 路由 + 会话台账）里跑完，报告读数与页面同一条数据链 | 21/21 通过；jsdom 只用于状态与结构，**焦点体验一律由真实浏览器取证**（见 §3） |

### 2. 测试与构建（真实执行）

| 项 | 结果 |
| --- | --- |
| `npx tsc --noEmit` | 干净，无类型错误 |
| `npm test` | **18 文件 / 295 条全部通过**，0 失败 0 跳过（Day 6 为 17 / 274，本轮 +1 文件 +21 条，旧测试零删改）；本轮末尾两次全量运行分别用时 13.29s / 12.80s |
| `npm run build` | 通过（`tsc -b && vite build`，2105 modules），两次分别 349ms / 396ms，产物哈希一致 |
| 产物 | `dist/index.html` 678 B、`assets/index-mFcMtZD3.js` **372750 B / gzip 110277 B**、`assets/index-CFHpowcy.css` **29485 B / gzip 6256 B**、`favicon.svg` 232 B；合计 4 个文件 403145 B（gzip 117213 B）。与 Day 6 线上（JS 368996 B / CSS 27977 B）相比 JS **+3754 B**、CSS **+1508 B**，来自报告三态文案与焦点交接逻辑，无新增依赖 |
| 资源哈希变化 | Day 6 线上 `index-gw0uvRiw.js` + `index-DgYwPq9n.css` → 本轮 `index-mFcMtZD3.js` + `index-CFHpowcy.css` ⇒ **Day 7 的修改尚未上线** |

### 3. 真实浏览器取证（headless Edge / Chrome + 原生 CDP，本地 `dist`，脚本与产物在 `.day7-evidence/`）

驱动方式同 Day 6：`Input.dispatchKeyEvent` 真实按键、`Input.dispatchMouseEvent` 命中校验后点击、
`getComputedStyle` 读真实级联、`Emulation.setDeviceMetricsOverride` 切视口、`Accessibility.getFullAXTree` 读可访问性树、
`Page.setDownloadBehavior` 真实落盘、`Network.*` 数请求。脚本 `verify.mjs` / `verify2–4.mjs`（Edge）、`verify5.mjs`（Edge + Chrome）、`verify6.mjs`（两台浏览器性能），结果 `part1–part6*.json`、截图 `shots/` 12 张。

| 检查 | 结果 |
| --- | --- |
| D1 视口矩阵 **20 组**（4 视口 × 5 路由，最终构建上重跑） | 横向溢出 320 / 390 = `0`、768 / 1440 = `-15px`（滚动条，非溢出）；**小于 24px 的可点击目标 0 个**；导航 20/20 组 44px；`header` 高 165（窄屏两行）/ 65（宽屏一行）；`h1` 始终在页头之下 |
| B1 键盘真实动线 | skip link 首站 `outline: solid 3px offset 2px` → Enter 后 `activeElement === <main id="main">`；三实验全部用 Tab + Enter 走完；色彩页 8 次 Tab 到「生成修复建议」，Enter 激活后焦点在建议块；Shift+Tab 反向可达；缺陷态示例按钮真实 Tab 后 `outline: none`（教学缺陷未被破坏） |
| B1 Enter / Space 激活 | 「查看详情」`Enter` 与 `Space` 都能展开详情（`live` 出现「已展开详情…」），键盘到达计数**不因激活而膨胀**（`0 → 1 → 1`），激活后焦点仍在原按钮 |
| `:focus-visible` 真实判定 | 修复态示例按钮：Tab 抵达 → `matches(':focus-visible') = true`、`outline: solid 3px rgb(67, 56, 202)`；同一颗按钮鼠标点击 → `false` / `outline: none`。**Edge 157 与 Chrome 158 结果一致** |
| 语义（B2） | 五路由 `h1` 各 1 个、标题层级无跳级、`nav[aria-label="主导航"]`、`aria-current="page"` 唯一、无名可交互控件 0；可访问性树 `banner / navigation / main / contentinfo` **各 1 个** ⇒ 实验页内层的 `<header>`（DOM 计数 2）**不会被暴露成第二个 banner 地标**，先前按标签计数产生的疑问已排除 |
| C 色彩回归 | `4.48:1 未达 AA` → 建议 `4.54:1` → 应用后 `4.54` → 撤销恢复 `#777777 / 4.48`；非法 `#12zz` 时 `aria-invalid=true`、`aria-describedby` 同时挂出提示与错误、修复区显示「存在无效颜色，修复功能已暂停」且**生成按钮消失**；恢复合法后旧建议不复活 |
| C 表单回归 | 修复前 `student-name` 的 `input.labels = 0`、修复后 `= 1`（真实 DOM），点 `<label>` 能把焦点送进对应输入框；复检结论「没有发现问题」 |
| C 键盘回归 | 鼠标点击示例按钮**不计入**键盘到达次数；真实 Tab 两轮各 `3 次`；「我已完成观察」在计数不足时 `disabled`，走完后才可点；「重置实验」把计数清零且不误触发焦点交接 |
| C 台账与会话性 | 切走再切回报告仍 `3 / 3`；**重进键盘实验不会覆盖其它两项记录**；同页刷新 `0 / 3` 且三个导出按钮禁用 `[true,true,true]` |
| 报告导出 | Markdown 6197 字符；鼠标点复制与键盘 Enter 激活同一颗按钮都调用 `clipboard.writeText`，钩子取到的字符串与页面 textarea `===` 相同（`same: true`），状态区都出现「已复制完整 Markdown 报告…」；真实落盘 `AccessLab-成果报告-20261118232920.md` **13577 B === textarea UTF-8 字节数**（Edge 与 Chrome 各一次，结果相同） |
| 清空与取消 | 「清空本次实验记录」→ 二次确认区出现「确认清空记录 / 取消，保留记录」且焦点落在按钮上（`isBody: false`）；取消后读数 `1 / 3` 不变；确认后统计归零、三组人工验证条目一起消失 |
| 深链 / 前进后退 | `?d7=deep#/form-label` 直接加载 → `h1` 为「表单标签实验」、`document.title` 同步；`#/contrast ↔ #/report` 的 `history.back/forward` 均正确恢复页面 |
| D3 请求与性能（两台浏览器一致） | 整页首次加载**属于本应用的请求只有 4 个**：`/index.html`(200/917 B)、`/assets/index-CFHpowcy.css`(200/29785 B)、`/assets/index-mFcMtZD3.js`(200/373050 B)、`/favicon.svg`(200/532 B)，**非 2xx = 0**；hash 路由切换 **0 个应用请求**；`console error / warning / exception = 0`；本机 loopback 计时 DCL 114–118ms、load 115–118ms、TTFB 12–15ms（**这是本机静态服务的数字，不代表公网加载时间**）；`longtask` 0 条 |
| 线上只读核对 | `get_site.siteId 01a1e498-acba-…` → `lifecycle: active`、`access_mode: public`；匿名 GET 首页 `200` 且仍引用 Day 6 资源，两个资源 `200` + `content-encoding: gzip`、`cache-control: no-cache`；不存在的资源路径 `404`（0 B，**没有 SPA 回退**，与 hash 路由方案一致） |
| 环境噪音（与应用无关，记录口径） | 本机 Edge / Chrome 都额外注入了 `/​<guid>/main.js`、`/init`、`/to/wsm.sessionActivated`、`/to/wsm.onHashChange` 一类**本地安全组件**请求（两台浏览器同样出现）。这些不属于 AccessLab，已从「应用请求数」里剔除，否则会误报成「应用每次切路由发一个请求」 |
| 评委动线机械耗时 | 首页 → 色彩（生成 + 应用）→ 表单（修复）→ 键盘（两轮 Tab + 修复 + 确认）→ 报告，全程真实按键与点击 **5023ms**（脚本机械耗时，不含人阅读时间） |

### 4. 本环境仍然无法验证、需人工确认

| 项 | 为什么不能算通过 | 建议怎么补 |
| --- | --- | --- |
| 真机屏幕阅读器（NVDA / VoiceOver / TalkBack） | 本机没有可读屏环境。本轮给的是 DOM 语义、CSS 级联与**浏览器可访问性树**证据，**不是**真实朗读证据 | Day 8 用真机读屏走一遍：报告页三组人工验证的朗读顺序、五个动作后的焦点交接是否被播报、色彩页「生成修复建议」的读数变化 |
| 「生成修复建议」的播报层 | 实测这一步**不写入任何 live region**（前后 live 文本都是「当前对比度 4.48:1 未达 AA」），焦点交接只是将读数交给键盘用户自己读。修与不修都需产品决策（新增 `aria-live` 会与既有读数区双播报） | 列为 P2 观察项，等真机读屏结果再决定 |
| OS 剪贴板回读 | `writeText` 交给 API 的字符串已证明与页面逐字一致，但无头环境 `readText()` 回读到 6425 字符 ≠ 报告的 6197 字符（拿到的是系统里已有的内容），**这一项标未验证** | 真机鼠标 + 键盘各复制一次，粘贴到记事本核对 |
| 非 Chromium 内核 | 只跑了 Edge 157 与 Chrome 158。Firefox / Safari / WebKit、真机移动浏览器、系统级 `prefers-reduced-motion` 全部**未验证** | Day 8 如需，请在装有 Firefox / Safari 的机器上重跑 `verify5.mjs`（脚本只需换浏览器可执行文件路径） |
| Lighthouse / 真实网络性能 | 本轮没跑 Lighthouse，也**不报任何分数**；只有本机 loopback 计时与产物体积 | 如需 Lighthouse，请在目标网络环境下人工跑，并把报告作为独立附件 |
| 无痕浏览器目视 | 匿名 curl 与 headless 新配置文件不等于评委在无痕窗口里的目视结果 | 人工在无痕窗口开线上地址确认（当前线上仍是 Day 6，Day 7 未发布） |

### 5. Day 7 结论与 Day 8 待办

**Day 7 的四项改动都已闭合，295 条测试与构建全绿，Edge + Chrome 两台浏览器端到端取证通过；除此之外没有任何新的功能、依赖或视觉改动。**
当前状态是「本地已验收、Git 未提交、公网未发布」——这三件事都需要你逐项确认，本轮我只做到读取与本地取证。

Day 8 建议顺序：

1. **Git**：等你确认后分两次提交——① `fix: close day7 accessibility and focus-handoff gaps`（Day 7 的 7 个源码文件 + `src/App.day7.test.tsx`）② `docs: record day6 publication and day7 verification`（Day 6 遗留 + 本轮的文档段落；`DEVLOG.md` 里这两段是同一条连续 hunk，硬拆要手写补丁），再决定是否推送 `origin/main`；本轮未执行任何 Git 写操作。
2. **发布**：若要把 Day 7 上线，需要单独授权，走「同一 `projectId` / `siteId` 新 action → `prepare_site` → `get_publish_status` → `publish_site`」，发布后用同一套脚本对公网重跑取证并核对线上与本地逐字节一致（不得把构建通过当成发布成功）。
3. **人工项**：真机读屏、无痕目视、真实剪贴板、其它内核浏览器，结论写回本文档与 `PROJECT_STATUS.md`。
4. **参赛材料**：可引用的真实证据现在有两处——`.day6-evidence/`（43 个文件，已随 `82ecef4` 入库，含本地与公网各 12 张截图与两份落盘 `.md`）与 `.day7-evidence/`（31 个文件：10 份脚本、8 份 `.json` 结果、12 张截图、1 份落盘 `.md`，**是否入库待你确认**）；另有线上站点封面图与公开地址。仍然没有：读屏录屏、用户测试、第三方审计、宣传视频。

---

## 2026-11-19 · Day 8｜最终复验 + 参赛交付材料（零源码改动）

### 0. 本轮边界（先说清没动什么）

**本轮没有修改任何 `src/` 下的业务代码，也没有新增依赖、路由、实验或视觉设计。**
Day 7 的四项改动（A1 首页主按钮上提、A2 报告人工验证三态、A3 导航 44px、B1 焦点交接）在源码里已逐项 grep 复核确认存在，
按「当前代码正常就不要重复修改」的要求**一处未再动**。本轮做的三件事：
①在最新源码上重跑质量闸门并复现构建；②用真实浏览器重跑一遍评委动线并把截图/读数落盘成可引用的参赛证据；③产出 `submission/` 参赛材料包。
Git 与发布**依然未执行**（详见 §5）。

### 1. 质量闸门（真实执行，非引用 Day 7 结论）

| 项 | 结果 |
| --- | --- |
| `npx tsc --noEmit` | 干净，0 输出 |
| `npm test` | **18 个测试文件 / 295 条全部通过**，与 Day 7 记录持平；旧测试零删改、零跳过、零放宽断言 |
| `npm run build` | 通过，产出 4 个文件 |
| 可复现构建 | 先 `rm -rf dist` 再重建：`index-mFcMtZD3.js` **372750 B** / `index-CFHpowcy.css` **29485 B**，哈希与 Day 7 记录**逐字符一致** ⇒ 产物只由源码决定 |
| 五条路由入包 | 压缩产物里 `#/`、`#/contrast`、`#/form-label`、`#/keyboard`、`#/report` 全部存在 |
| 依赖 | `package.json` 未变动；运行时依赖仍是 `react` / `react-dom` / `lucide-react` 三个，零后端、零数据库、零第三方 API |
| 环境口径 | 本机 `node` 不在 PATH，所有命令前需 `export PATH="/d/Soft_Ware:$PATH"`（遗留问题 #14，与应用无关） |

### 2. Day 7 四项修复的存在性复核（源码 grep + 运行时各一次）

| 项 | 源码位置 | Day 8 运行时读数 |
| --- | --- | --- |
| A1 首页主按钮在折线内 | `HomePage.tsx:135` 品牌句、`:148` 「开始第一个实验」 | 320×568 顶边 **499px（inFold=true）**；390=470、768=356、1440=408，四档全在折线内 |
| A2 报告人工验证三态 + 数字同源 | `reportModel.ts:134-138`、`:458-482`、`:506-521`（`pendingManual` / `confirmedManual` / `extraVerification` + `manualVerificationGroups()`） | 三组标题逐字为「实验内仍待你本人完成的观察（**1 项**）」/「实验内已由你确认完成的观察（**1 项**）」/「建议额外进行的辅助技术与真实场景验证（**3 项**）」；`countsMatch=true`；无虚假「你还没有点」提示 |
| A3 导航 44px | `AppHeader.tsx:23/45/46`（`min-h-11`，无 `sm:min-h-9`） | 20 组视口的 `allNavH` 集合只有一个值 **{44}** |
| B1 焦点交接 | `ContrastLabPage.tsx:545/577/606`、`FormLabelLabPage.tsx:442`、`KeyboardFocusLabPage.tsx:534`、`ReportPage.tsx:457`（`tabIndex={-1}` + `focus()`） | 六个动作后 `activeElement` **无一退回 `<body>`**，见 §3 逐条落点 |

### 3. 真实浏览器复验（headless Edge 157 + 原生 CDP，本地 `dist`，脚本与产物在 `.day8-evidence/`）

驱动方式与 Day 7 相同：`Input.dispatchKeyEvent` 真实按键、`Input.dispatchMouseEvent` 命中校验后点击、`getComputedStyle` 读真实级联、`Emulation` 切视口、`Page.setDownloadBehavior` 真实落盘、`Network.*` 数请求。
三条脚本由 Day 7 的 `verify.mjs` / `verify2.mjs` / `verify4.mjs` 最小改动派生（**只换输出目录、调试端口、临时目录前缀与文件名**，逐行 diff 已核对），另新写 `capture-shots.mjs` 负责截图。

| 项 | Day 8 实测 |
| --- | --- |
| 评委动线（`judge-flow.json`） | 首页 → 色彩（生成 + 应用）→ 表单（修复）→ 键盘（两轮 Tab + 修复 + 确认）→ 报告，真实按键与点击，机械耗时 **6287ms**（Day 7 为 5023ms，同一台机器同一构建的量测抖动）。**这是机器操作时间，不含人阅读时间，不得写成「3 分钟达标」** |
| 键盘两轮 | R1 修复前：4 次 Tab 命中 3 个示例按钮，`before=3 / after=null`；R2 修复后：16 次 Tab 命中同 3 个，`before=3 / after=3`；`我已完成观察` 在门控满足前不可点 |
| 报告四项计数 | `3 / 3`、`3 / 3`、`3 / 3`、待观察 `1 项`、额外验证 `3 项` |
| 导出 | 复制载荷 **6197 字符 === 页面 textarea** 逐字一致（鼠标与键盘 Enter 两条路径各自通过，Enter 前 `activeElement` 就是该按钮）；`.md` 真实落盘 `AccessLab-成果报告-20261119094129.md` **13577 B === textarea UTF-8 字节数，identical=true**。OS 剪贴板 `readText()` 回读仍是 6425 字符 ≠ 6197，与 Day 7 同样判定：**无头环境回读不可靠，人工粘贴回读维持未验证** |
| 会话性 | 路由切走再回来台账 `3 / 3`；重进键盘实验不覆盖他项；**刷新后 `0 / 3` 且三个导出按钮全禁用** |
| 焦点交接逐条（`focus-handoff.json`） | 生成修复建议 → `div`「建议 · 尚未应用」→ 下次 Tab 落「应用该修复」；应用该修复 → `div`「修复已应用」→ 「撤销本次修复」；撤销 → `p`「已撤销本次修复，文字颜色恢复为 #777777。」→ 「进入表单标签实验」；修复标签关联 → `p`「标签关联已修复…」→「重置实验」；**重置实验 → 焦点仍在「重置实验」自身（未误交接）**；修复焦点指示 → `p`「已应用焦点修复…」→「重置实验」 |
| 非法输入 / 过期建议 | `#12zz` → `aria-invalid=true` + 两条描述、修复区显示「存在无效颜色，修复功能已暂停」、**生成按钮消失**；改成 `#7b7b7b` 后实时对比度变 `2.29:1` 但**复制按钮 present=false**（旧建议不自动复活） |
| 视口矩阵（`viewport.json`） | 5 路由 × 320 / 390 / 768 / 1440 = **20 组**：横向溢出 `{0, -15}`（负数是滚动条宽度，即 320/390 溢出为 `0`）、越界元素 **0**、小于 24px 的可点击目标 **0**、代码块未撑破 **0**、`h1` 全在页头之下 |
| 键盘地图 | skip link 首站 `solid 3px 2px` → Enter 后 `activeElement === <main id="main">`；五条导航与 logo 全 `solid 3px 2px`；键盘实验缺陷态三按钮 `outline: none 3px`（**教学缺陷未被破坏**） |
| 语义（DOM 计数） | 五路由 `h1` 各 1、标题**无跳级**、`nav[aria-label="主导航"]`、`aria-current="page"` 唯一、无名称可交互控件 **0**。⚠️ 本轮只重跑了 DOM 计数，`banner=1` 那条可访问性树结论沿用 Day 7 的 `part5-*.json`，**本轮未重跑 AX 树** |
| 控制台与网络 | 三趟跑下来 `console error = 0`、`warning = 0`；整场评委动线总请求 93 个（含本机浏览器注入的本地安全组件），**non-2xx = 0**；属于本应用的资源 4 个、loopback DCL 90ms（本机数字，不代表公网，不出 Lighthouse 分数） |

### 4. 参赛材料包 `submission/`（6 份，全中文，可直接使用）

| 文件 | 体量 | 内容 |
| --- | --- | --- |
| `README.md` | 11242 B | 材料总览、功能与技术栈、目录结构、运行命令、Day 1–8 时间线、「这个产品不做什么」诚实边界、赛事规则口径（标注需以官方公告核对） |
| `forum-post.md` | 25072 B | 天池论坛正式作品帖：官方要求的五部分齐全，9 处 `【插图：…】` 标记 + 4 处 `【请填写…】` 身份占位符；第五部分分 10 节写「哪些交给 Qoder、哪些我自己判断、哪些我不同意它」；第 9 节逐条列明**没有**的证据 |
| `demo-script.md` | 12476 B | 60–90 秒演示视频分镜（6 段，每段含页面/操作/口播/关键数据/镜头/必须真机还是可剪辑），附 75 秒裁剪方案与约 240 字完整口播稿、红线清单 |
| `demo-checklist.md` | 8823 B | 录前 A–H 八组检查项，A1 是阻塞项（公网仍是 Day 6，必须先发布再录，否则录进去的是旧版） |
| `evidence-index.md` | 17560 B | 证据总索引：Day 8 / Day 7 / Day 6 三批 + VCS/构建/部署证据，逐条标注「能证明什么 / 是否独立核验 / 适不适合公开 / 要不要打码」，含 14 张截图逐张说明与 §7 **待补充**清单（10 项） |
| `final-checklist.md` | 12540 B | A 阻塞项、B 参赛资格（全为「待你本人操作」）、C 帖子五部分对照、D 占位符 D1–D7、E 11 项未验证人工项、F 质量闸门真实数字、G 排期、H 发帖前 10 分钟走查、I 授权事项汇总 |

**取证截图**：`.day8-evidence/shots-post/` 共 **14 张 PNG**（13 张 1440×900 + 1 张 320×567 手机首屏），由 `capture-shots.mjs` 在**同一条连续会话**里按「首页 → 色彩前后 → 表单前后 → 键盘缺陷态/修复态 → 报告」顺序拍摄，画面里的数值与 §3 的 JSON 读数是同一趟运行。
过程中修正过一处会误导人的取景：键盘实验那两张最初定位到了页面下方**静态示意图卡片**（右侧那张本来就画着焦点环），换成把**真正聚焦的元素**滚到视口中央后重拍——现在的 `09` 缺陷态实测 `outline: none 3px`、`10` 修复态实测 `solid 3px rgb(67, 56, 202) offset 3px`，差异只由页面自身一条 CSS 规则产生。

### 5. 线上仍是 Day 6：本轮唯一的 P0 阻塞项

Day 8 再次只读核对（`curl` 匿名请求 + 资源存在性）：

- 线上 `index.html` 引用 `index-gw0uvRiw.js` + `index-DgYwPq9n.css`（Day 6 构建）；
- 本地 Day 7/8 构建的 `index-mFcMtZD3.js`、`index-CFHpowcy.css` 在线上**都是 `404`**；
- 站点 `lifecycle: active`、`access_mode: public`（未新建站点，未改访问范围）。

⇒ **评委现在点开链接看到的是 Day 6**，也就是 Day 7 已经修掉的四个问题（手机首屏看不到主按钮、报告「人工验证」三态未拆、导航 36px、五个主操作后焦点退回 `<body>`）在当前公网上**依然存在**。
本轮**未执行发布**：A3/A4 只做到「把方案摆出来等你逐项确认」。同样地，Git 也**未执行** `add` / `commit` / `push`，HEAD 仍是 `82ecef4`（与 `origin/main` 一致，无未推送提交）。

### 6. Day 8 结论

**代码质量侧：绿灯且可复现**——tsc 干净、295/295、构建哈希与 Day 7 一致、评委动线与焦点交接在真实按键下重跑无回归、20 组视口无溢出无小目标、控制台干净。
**材料侧：齐了**——`submission/` 六份 + 14 张同源截图 + 4 份 JSON 证据 + 3 份运行日志。
**交付侧：两步都还没走**——提交与发布都在等你授权，且**发布必须先于录视频与发帖**（否则公网展示的是旧版）。
仍然没有的东西照旧没有：真机读屏、非 Chromium 内核、OS 剪贴板人工回读、无痕目视、真实移动网络、用户调研数据、宣传视频。材料与页面里都没有把它们写成已完成。

### 7. 待你确认后的剩余动作

1. **Git**：确认拆两次提交（① Day 7 的 7 个源码文件 + `src/App.day7.test.tsx` ② 三份治理文档的 Day 6 遗留 + Day 7 + Day 8 段落），并决定 `.AccessLab 无障碍实验室.qoder.site`（纯格式重排）、`.day7-evidence/`、`.day8-evidence/`、`submission/` 是否入库；确认后才谈是否推送 `origin/main`。
2. **发布**：确认后走「同一 `projectId` / `siteId` 新 action → `prepare_site` → `get_publish_status` → `publish_site`」，发布后用匿名请求核对线上引用已变成 `index-mFcMtZD3.js` + `index-CFHpowcy.css` 且与本地逐字节一致，再重跑一遍公网取证。
3. **录视频 / 发帖**：都排在发布之后。发帖前把 4 处身份占位符换成真实信息、9 处插图标记换成真图。
4. **人工项**：真机读屏、无痕目视、剪贴板人工回读、Firefox / Safari，结果写回本文档与 `PROJECT_STATUS.md`。





---

## 2026-11-19 · Day 8 收口轮｜参赛材料事实口径修正 + 精简版参赛帖（零源码改动）

> 本轮范围：①重跑工程闸门留档；②修正参赛材料里三处**站不住的表述**；③产出正式提交用的**精简版参赛帖**；
> ④把 Git 提交与 Sites 发布**方案定稿**到可以直接批准执行的程度。**未新增实验、未重构、未改设计、未动一行业务代码。**

### 1. 工程闸门（本轮独立重跑，非引用 Day 8 上午记录）

| 项 | 结果 |
| --- | --- |
| 环境 | `export PATH="/d/Soft_Ware:$PATH"` 后 node **v25.2.1** / npm **11.6.2**（直接 `npm` 仍会 `node: not found`，遗留 #14 属实） |
| `npx tsc --noEmit` | ✅ 无输出，退出码 0（10:36） |
| `npm test` | ✅ **18 文件 / 295 条全部通过**，14.53s，0 失败 0 跳过（10:36） |
| `npm run build` | ✅ 2105 modules / 481ms（10:37） |
| 产物 | `index-mFcMtZD3.js` **372750 B**、`index-CFHpowcy.css` **29485 B**、`index.html` 678 B、`favicon.svg` 232 B —— 与 Day 7、Day 8 上午**逐字符一致**，可复现构建已连续三轮成立；文档与材料改完后于 **11:06** 再跑一遍（tsc 0 / 295 全绿 / 403ms），**哈希仍不变 ⇒ 连续四轮** |
| 关键数值独立复算 | ✅ 用 WCAG 2.2 相对亮度公式另写脚本重算：`#777777`/`#FFFFFF` = **4.4781**、`#767676`/`#FFFFFF` = **4.5422**、`#000`/`#fff` = **21.00** ⇒ 帖子里的 4.48 / 4.54 / 21:1 与判定（未达 AA / 达到 AA）**属实且非写死** |
| `git status` | HEAD 仍 `82ecef4`，`main` 与 `origin/main` **0 ahead / 0 behind**；7 个源码文件 + 3 份治理文档 + Sites 描述符为已跟踪修改，`src/App.day7.test.tsx` / `.day7-evidence/` / `.day8-evidence/` / `submission/` 共 **69 个文件未跟踪** |

### 2. 修正之一：开发周期「共 8 天」不成立

原表述：`2026-11-16 → 11-19，共 8 天，单人`。
**按日历核对**：本文档自己的章节标题就是证据 —— Day 1–3 全部落在 11-16 / 11-17，Day 4–7 全部落在 11-18，Day 8 在 11-19。
即 **11-16 → 11-19 共 4 个自然日**，"Day 1–8" 是**开发阶段编号**，不是 8 天日历时间。
已统一改为：**「2026-11-16 → 11-19，4 个自然日、8 个开发阶段，单人」**，涉及
`submission/forum-post.md`（第五部分开头 + 数据总览表）、`submission/forum-post-final.md`、
`submission/README.md`（开发历程表上方新增时间口径说明）、`submission/final-checklist.md`（B10 + H 组走查项）。

### 3. 修正之二：「真实物理 Tab」→ 真实浏览器键盘事件

**问题**：现有键盘 / 焦点证据由自动化脚本经 CDP `Input.dispatchKeyEvent` 向真实浏览器发送 Tab 键事件得到，
能证明**真实内核的焦点变化、键盘顺序与计算样式**，但**无法证明真人手按实体键盘**，原措辞越了这条线。
**已改**（改为「自动化脚本向真实浏览器发送 Tab 键事件」并补上"能证明 / 不能证明"的界）：
`submission/forum-post.md`（键盘实验图注 + 第五部分第 3、4 节）、`submission/evidence-index.md`（§1.6 的 09/10/11 三张图说明 + 顶部新增「证据口径统一定义」）、
`submission/demo-script.md`（顶部新增「口径区分」：**待录视频**用真实按键 ≠ **已归档截图**来自自动化）、`submission/final-checklist.md`（E 组术语口径 + H 组"搜『真实物理』应为 0"）、
`PROJECT_STATUS.md`（§2 表头 + 遗留 #4）、`DEVLOG.md`（Day 3 复核轮 / Day 4 两处历史记录**就地更正术语并保留当日实况**）。
**没有因此贬低已有证据**：真实浏览器 + CDP 的键盘取证仍然是本作品最硬的部分之一，只是不再把它说成实体键盘或读屏实测。
`demo-script.md` 里"录制必须用真实物理键盘"一句**保留** —— 那是对**尚未录制的视频**的操作要求，不是对既有证据的声称。

### 4. 修正之三：未经确认的第一人称经历

`forum-post.md` 原稿含「我以前基本没想过」「无障碍规范我读过但读完留不下东西」「我试过几种学习方式」「`SC 1.4.3` 我背下来了」，
以及三段以"某类使用者的感受"口吻描述低视力 / 键盘 / 读屏用户体验的文字。
这些**无法由仓库内任何资料证实**，可能是起草时代入的。已按以下原则处理：
- **保留**用户已确认的信息：计算机专业学生、单人参赛、全程 Qoder 开发部署；
- 把个人经历改写为**客观的项目观察**（"学生阶段判断页面做完了的标准通常是…"），不再声称个体历史；
- 需要第一人称动机的地方加显式标记：**【以下段落是作品动机，请本人按真实经历确认或改写后再发布】**（D5）；
- 三段"使用者的感受"前加**「以下是从缺陷本身推出的后果，不是用户访谈或真实用户测试的结论」**；
- **未新增**任何访谈、调查、用户反馈或影响数据；`final-checklist.md` H 组新增"全文搜『请填写』应为 0"与 D5 确认项。

### 5. 修正之四：自检其余无障碍声明（A4）

逐条比对代码 / 证据后确认需要加限定的两处，已改：
- 「全站可以只用键盘走通 / 焦点环始终可见」→ 明确为**真实浏览器键盘事件 + DOM 与可访问性树核对**；
- 「遵守 `prefers-reduced-motion`」→ 明确为 **`prefers-reduced-motion: reduce` 下不播动效（CDP 媒体仿真验证），系统级开关下的实际观感未人工复核**。
核对无误、保持原文的：报告逐字声明「本报告仅针对 AccessLab 内置示例，不是网站 WCAG 合规认证。」（`src/lib/reportModel.ts:26`）；
色彩只判 SC 1.4.3 普通文本 AA；44px 与 SC 2.5.8 / 2.5.5 的口径区分；未检查项逐条列出。
**未出现**任何"整站 WCAG 合规""读屏实测通过""跨浏览器已验证"式宣称。

### 6. 新产出：`submission/forum-post-final.md`（正式提交优先用）

原长版 `forum-post.md`（实测 **6338 汉字 / 361 行**）**完整保留**，作为详细技术版本与答辩备份。
精简版实测（`node` 逐字符统计，只数 `[一-鿿]`）：**五部分正文 2834 汉字**，加「附：数据与边界」共 **3200 汉字**，整份文件 **3538 汉字 / 181 行**（含全角标点则 3809）。
建议区间是 1800–2500，正文超出约 330 字的部分是**必须保留的证据与边界声明**（三个实验的代表性数值、Qoder 七项分工、我把关的三处、未验证清单），
按"真实证据需要更多篇幅可适度增加、不机械截断"处理；初稿曾达 3996 汉字，已逐轮压缩。
结构：`【Hack4Good】` 标题 → 帖首公网链接 + Qoder 账号占位符 → 五部分（自我介绍 / 作品是什么 / 为什么做 / 怎么用 5 步 / 如何用 Qoder 完成）→ 数据与边界 → 帖尾链接。
**6 处配图标记引用的 8 张 PNG 全部真实存在**（`.day8-evidence/shots-post/` 的 01 / 03 / 04 / 06 / 08 / 09 / 10 / 12，已逐个 `test -f` 验证）；
**Qoder 会话截图与终端截图明确标「待补充、不得用浏览器截图冒充」** —— 这两类目前没有文件。
正文**不含**任何"最新版已上线""视频已录好""认证已通过"的声明。

### 7. Git 与发布：方案定稿，仍然**一个写操作都没执行**

提交分组、逐组文件清单、diff 摘要、建议排除项与两个知情细节（本地绝对路径、CRLF 警告）见
`submission/final-checklist.md` **I-1**；发布链路与回退路径见同文件 **I-2** 与本文档 Day 8 第 7 节。
本轮**未执行** `git add` / `commit` / `push` / `reset` / `rebase`，**未调用** `prepare_site` / `publish_site`，
只做了只读核对（`get_site`、匿名 `curl`、`git status`、`git diff --stat`）。

### 8. 本轮公网核验的**真实边界**

只做到了这些：匿名 `GET /` 返回 200 且 `<head>` 引用 `index-gw0uvRiw.js` + `index-DgYwPq9n.css`；
Day 7 的两个资源名请求返回 **404**；`get_site` 显示 `lifecycle: active`、`access_mode: public`、`backend.status: disabled`。
**11:07 第四次复确认**结论未变（首页 200 / 57720 B；两个 Day 7 资源仍 `404`）。
顺带核清一个会造成误判的细节：**匿名首页 57720 B 与本地 `dist/index.html` 的 678 B 不相等是正常的** ——
差值是 Sites 托管注入的平台脚本（含 4 处 `qoder` 字样），所以发布后的逐字节 `cmp` 只适用于 **JS / CSS 两个资源文件**，
`index.html` 只核引用到的文件名。
**没有**在公网上跑通三个实验与报告导出 —— 因为公网上跑的是 Day 6 版本，Day 7 的四项修复尚未发布。
所以：**在 I-2 的发布 + 线上哈希核对 + 公网重跑取证完成之前，任何材料都不得写"最新版已上线"。**
本文件 Day 6/7/8 的"三轮构建哈希一致"指的是**本地重建**产物一致，不涉及公网；
`evidence-index.md` 与 `forum-post-final.md` 里的截图同样来自**本地构建**，已注明发布后需对公网重拍（§7.8）。

### 9. 本轮改了什么 / 明确没改什么

| | |
| --- | --- |
| **改了** | 6 份 `submission/` 文档的**事实口径**（时间、键盘证据、第一人称、无障碍声明限定）；新建 `submission/forum-post-final.md`；`PROJECT_STATUS.md` 术语 2 处；`DEVLOG.md` 历史术语就地更正 2 处 + 本条记录 |
| **没改** | `src/` 全部源码、测试、`package.json`、`package-lock.json`、`.gitignore`、`PRD.md` 的需求与验收口径（本轮无需求变更，无需改动） |
| **没执行** | `git add` / `commit` / `push` / `reset` / `rebase`；`prepare_site` / `publish_site`；论坛发布 |

### 10. 待用户授权后才能继续的动作

1. **Git 提交授权** → 按 `final-checklist.md` I-1 的四组分组提交（含 `.day7-evidence/` / `.day8-evidence/` / `submission/` 的取舍确认）；
2. **远程推送授权**（独立于 1）；
3. **Sites 发布授权**（独立于 1、2）→ 按 I-2 走 `prepare_site` → `publish_site` → 线上哈希核对 → **公网**回归取证；只有全部通过才回填"最新版已上线"；
4. **身份与资格确认**（D2/D3/D4 + E 组实名认证、大学生认证、原创声明）—— 只能由本人确认，不得代填；
5. **论坛发布授权**（发帖本身 + 配图 + 若赛事要求过程凭证则需导出 Qoder 会话记录）；
6. 演示视频**仍未录制**，`final-checklist.md` F2 组保持 ⛔ 未录制状态。

> 收口轮的判定标准只有一条：**材料里的每一句话，都能指回一个真实跑过的命令、一份真实存在的文件或一条明确的"待确认"。**
> 本轮把三处指不回的话改成了指得回的，其余保持不动。

---

## 2026-11-19 11:14 · Day 8 收口轮之后｜**经用户授权执行 Sites 公开发布 + 公网回归取证**

用户指令：「site 更新一下，git 我提交」⇒ **本轮只发布站点，不碰 Git**（`git add` / `commit` / `push` 全部留给用户）。

### 1. 发布链路（同一站点、同一 `projectId` / `siteId`，未新建站点）

```
prepare_site  actionId=a8ffa344-a7c6-4982-a5d8-5d54524d4d68   projectId=01a1e498-acb7-796a-a96d-1c22a6cee214
              webDirectory=dist   spa=false   slug=accessibility-lab   displayName=AccessLab 无障碍实验室
  → descriptorStatus: pending  → get_publish_status: preparation.state=ready / canPublish=true / blockers=[]
  → 同 actionId、完全相同输入重试 prepare_site → descriptorStatus=written
publish_site  → publishOperationId=01a1f1cc-3820-7162-9d17-e6a903d065a5
  → get_publish_status: published=true / operation.state=succeeded / committed=true / readiness=publication_completed
```
`siteId 01a1e498-acba-79ec-8703-a119defbf0f6`、host 未变（`accessibility-lab-3g6uvbn5duq.qoder.zone`）、
`lifecycle: active`、`access_mode: public`、`auth_integration_status: not_required`、无后端。
描述符 `.AccessLab 无障碍实验室.qoder.site` 由工具改写为新 action（+12/−12），**仍未提交，留给用户**。

### 2. 公网逐字节核验（匿名请求，无需登录）

| 项 | 结果 |
| --- | --- |
| 线上 `index.html` 引用 | `assets/index-mFcMtZD3.js` + `assets/index-CFHpowcy.css` ✅ 已是最新构建 |
| Day 7 资源 | `200` / `372750 B`、`200` / `29485 B`，与本地 `dist/assets/` **`cmp` 逐字节一致** |
| SHA-256 | JS `ded139a6…31c903`、CSS `0c615ffc…fde563` —— 线上与本地**两组完全相同** |
| 旧 Day 6 资源 | `index-gw0uvRiw.js` 现在 **404** ⇒ 版本已整体切换，不是新旧并存 |
| 静态路由 | `/`、`/index.html`、`/#/report`、`/?day7=deep#/keyboard` 均 `200`；`/favicon.svg` `200 / 232 B` |
| 响应头 | `cache-control: no-cache` + `last-modified: 19 Nov 2026 03:14:03 GMT`（＝本地 11:14 发布时刻） |
| `index.html` 大小 | 匿名 57720 B ≠ 本地 678 B —— 差值是**托管层注入的水印脚本**，不是产品差异；因此逐字节 `cmp` 只用于 JS / CSS |

### 3. 公网真实浏览器回归（headless Edge 157 + CDP，脚本与读数入库）

`LIVE_URL` 指向公网域名跑既有取证脚本，输出写入 `*-live.json` **不覆盖本地证据**：

| 检查 | 公网实测 |
| --- | --- |
| 色彩实验 | live region 逐字记录 `当前对比度 4.48:1 未达 AA` → 应用后 `4.54:1 达到 AA`，并出现「已应用修复：文字颜色改为 **#767676**，对比度提升至 4.54:1」 |
| 键盘实验 | 两轮 Tab 各命中 3 个示例按钮（`before=3 / after=3`），人工确认按钮解锁并点击成功 |
| 统一报告 | `已记录 3 / 3`、`已实际执行修复 3 / 3`、`已进行修复后复核 3 / 3`、`仍需人工观察 1 项`、`建议额外验证 3 项`，**`countsMatch=true`、`stillPending=false`、已确认行存在** |
| 导出 | 复制载荷 **6197 字符 === 页面 textarea**（鼠标与键盘 Enter 两条路径都通过）；`.md` 真实落盘 **13577 B === textarea 字节数**，`identical=true` |
| 会话性 | 切路由仍 `3 / 3`、重进键盘实验不覆盖（`3 次` 保留）、**刷新回 `0 / 3` 且三个导出按钮全禁用** |
| 控制台 / 网络 | 整场动线 75 个请求 **non-2xx = 0**、**console error = 0、warning = 0、exception = 0** |
| Enter / Space 激活 | 缺陷态按钮两种按键都能激活，`focusAfter.isBody=false`，播报区出现「已展开详情…」 |
| 深链与前后退 | `#/contrast` → `#/report` → 后退命中 `#/contrast` → 前进命中 `#/report` |
| 20 组视口 | 5 路由 × 320 / 390 / 768 / 1440：横向溢出集合 `{0, -15}`、小于 24px 可点击目标 **0**、导航高度 **44**、首页主按钮四档 `ctaFold=true`（320 是 `499`，Day 7 修复在公网上生效） |
| 语义 | 五路由 `h1=1`、标题不跳级、无名称可交互控件 **0**、`nav[aria-label]` 与 `aria-current` 正常 |
| 缺陷态保真 | 键盘实验三个示例按钮在公网上实测 `outline-style: none`（`none 3px rgb(30,41,59)`）⇒ 教学缺陷没有被"顺手修好" |

新写一条最小探针 `.day8-evidence/probe-public-labels-focus.mjs` → `public-labels-focus.json`，补测两项：
- **表单真实 DOM**：修复前 `input.labels = 0`；点「修复标签关联」后 **`labels = 1`**，DOM 为
  `<label for="student-name" class="block text-sm font-semibold text-slate-900">姓名</label>`，**已输入的「张三」未被清空**；
- **焦点环计算样式**：修复后 Tab 到三个示例按钮，实测 **`outline: solid 3px rgb(67, 56, 202)`，`outline-offset: 3px`**，
  且修复后第一个 Tab 停靠点是结果块「已应用焦点修复…」⇒ Day 7 的 B1 焦点交接在公网上也生效。

> 探针踩到的两个坑记下来，免得日后误判：①CDP 没有 `Input.enable` 这个方法；
> ②托管层注入的水印浮层会盖住按钮坐标，导致鼠标点击 `elementFromPoint` 命中的是水印（`contains=false`）——
> 改用 `focus()` + 真实 Enter 按键激活才拿到结果。**公网 Tab 序列里因此多出 `qoder-sites-badge` 停靠点**，
> 那是平台注入元素（带 `aria-label`），不属于产品代码，但"公网 Tab 序列 = 本地 Tab 序列"这句话不成立。

产物：`.day8-evidence/judge-flow-live.json`、`viewport-live.json`、`public-labels-focus.json`、`run-judge-flow-live.log`、`run-viewport-live.log`。

### 4. 仍然没有在公网上验证的（不声称）

真机读屏播报、Firefox / Safari、真机移动浏览器与公网加载性能分数、系统级减弱动效观感、OS 剪贴板人工粘贴回读、无痕窗口目视。
其中**OS 剪贴板**在公网上复测仍是老结果：写入载荷与页面逐字一致，但 `readText()` 回读到 6425 字符的别的内容 ⇒ 维持"未验证"。

### 5. 材料回填

发布与公网核验完成后，才把 `submission/` 与治理文档里的"公网仍是上一版"改为"最新版已上线"，
并把本地截图的说明从"发布后必须对公网重拍"调整为"线上资源与本地逐字节一致，截图与公网渲染同源"。
**Git 未动**：工作区仍是 Day 7 源码 +207/−45、三份治理文档、描述符与四个未跟踪目录，等用户自己提交。

### 6. 11:30 补测：五条 hash 深链在公网**冷启动**渲染

前面的公网取证里，路由是脚本内切换得到的；为回答"评委直接把 `#/report` 粘进地址栏会怎样"，
新写一条探针 `.day8-evidence/probe-public-deeplinks.mjs`：**每个路由开一个全新的 CDP target**，
用 `<站点>/index.html#/xxx` 直接加载，等 2.5 秒后读 DOM。结果（`public-deeplinks.json`）：

| 路由 | `location.hash` | 页面 `h1` | `main` 数 | skip link | `window.onerror` |
| --- | --- | --- | --- | --- | --- |
| `#/` | `#/` | 让网页的障碍，看得见、改得掉。 | 1 | `#main` 在 | 0 |
| `#/contrast` | `#/contrast` | 色彩对比度实验 | 1 | `#main` 在 | 0 |
| `#/form-label` | `#/form-label` | 表单标签实验 | 1 | `#main` 在 | 0 |
| `#/keyboard` | `#/keyboard` | 键盘焦点实验 | 1 | `#main` 在 | 0 |
| `#/report` | `#/report` | 统一成果报告 | 1 | `#main` 在 | 0 |

⇒ **深链不依赖先访问首页**，静态托管下刷新与直接粘贴都落在同一页；`#/` 之外四页的 DOM 里 `header` 标签数为 2（实验页内层 `<header>`），
这与 Day 7 可访问性树的结论一致：**DOM 两个 `header` 不等于两个 `banner` 地标**，本轮只数 DOM 标签，未重跑 AX 树。

> 探针自身的一个坑（否则会被误读成产品缺陷）：第一版用 `/跳到|主内容|skip/i` 匹配 skip link 文案，五页全返回 `null`；
> 换成属性选择器 `a[href="#main"]` 后立刻取到「跳转到主要内容」。那是**脚本的匹配写法问题，不是页面缺 skip link**——
> 教训是：断言优先绑定在结构性属性（`href` / `id`）上，不要用文案正则当契约。

---

## 2026-11-19 11:49 · Day 8 补记：**重建哈希漂移的根因、一处 CSS 构建隔离修复、第二次公开发布与公网复测**

> 触发点：§6 之后核对 `dist/` 时发现，用当前仓库重新构建出来的资源名是 `index-B61kabqi.js` / `index-ea8UcgoS.css`，
> 而 11:14 发布上线的是 `index-mFcMtZD3.js` / `index-CFHpowcy.css`。
> 这意味着 Day 8 复验立起来的那条「从仓库 HEAD 重新构建 = 线上产物」**当场不成立了**。本轮全部动作经用户选择
> **「保留修复并重新发布（推荐）」**后执行。

### 1. 根因：取证文件被 Tailwind v4 的内容扫描当成 class 候选

逐字节比对先排除了 JS：两份 `index-*.js` 都是 **372750 B**，`cmp` 报告**零字节差异**。
差异全在 CSS：线上 29485 B、新构建 30444 B。逐条规则做集合差后，多出来的只有三条工具类：

| 凭空多出的类 | 出处 |
| --- | --- |
| `.shadow` | `.day7-evidence/` 的 DOM / 类名快照文本 |
| `.transform`、`.transition` | `.day8-evidence/public-labels-focus.json` 里**平台注入水印**的 class 字符串 |

也就是说：**仓库里的取证文件不是源代码，却参与了产物 CSS 的生成**。这类风险项目并非第一次遇到——
`src/index.css` 早就为 `.md` 文档和 `*.test.ts(x)` 写过两条 `@source not`，Day 4 还为
`src/lib/keyboardFocusDemo.ts` 加过一条，理由完全相同。这一次只是**同一类泄漏的第三种形态**：取证目录本身。
`vite.config.ts` 没有配置任何 `content` / `sources`，所以默认的自动扫描范围就是整个仓库。

### 2. 修复：一处构建隔离（本轮唯一的源码改动）

`src/index.css` 第 8–14 行新增 **7 行（+7 / −0）**：沿用既有写法加两条排除，并写明为什么。

```css
@source not "../.day*-evidence/**";
@source not "../**/*.{json,jsonl,log}";
```

**它只影响构建期"扫描哪些文件找类名候选"，不改变任何一条真正生效的样式规则。**

### 3. 修好之后产物怎么变（逐条核对，不靠"看起来没坏"）

| 项 | Day 7 / 首次发布（11:14） | 修复后（11:49） | 差异 |
| --- | --- | --- | --- |
| JS | 372750 B（`index-mFcMtZD3.js`） | **372750 B**（`index-aTyl07hG.js`） | **逐字节相同** |
| CSS | 29485 B（`index-CFHpowcy.css`）gzip 6256 B | **28219 B**（`index-Co1Kujov.css`）gzip 6078 B | **−1266 B / gzip −178 B** |
| `index.html` | 678 B | 678 B | 相同 |
| `favicon.svg` | 232 B | 232 B | 相同 |

被删掉的 **1266 B 全部是死代码**：16 条选择器 / 2632 B（`.visible`、`.ring,.ring-1`、`.blur`、
以及 `@property --tw-blur / --brightness / --contrast / --grayscale / --hue-rotate / --invert / --opacity /
--saturate / --sepia / --drop-shadow / --drop-shadow-color / --drop-shadow-alpha / --drop-shadow-size`），
新增 1 条 `.ring-1`（同一声明、重新分组）；同时 `.shadow / .transform / .transition` 三条与 8 条
`@supports (color:color-mix(...))` 块发生了**纯粹的分组重排**（声明一字不改）。
核对方式：`src/` 下**不存在任何 `.json` / `.log` / `.md`** ⇒ 被排除的候选只可能来自取证与文档；
再取「修复后新产物 ∩ 线上旧产物」的交集，结果**没有任何一条规则被移除**。
逐条差异与两份 CSS 原文留档在 `.day8-evidence/rebuild-check/`（`live.css` / `new.css` / `removed-rules.txt`）。

顺带的事实修正：那 959 B 的泄漏是**这几天才进仓库的取证文件**带进来的。
Day 7 记录的 CSS 尺寸 29485 B 当时是对的；**现在写进材料的数字应为 28219 B / gzip 6078 B**。

### 4. 本地行为回归（同一份 `dist/`，`npx vite preview` @127.0.1:4181）

`tsc --noEmit` 退出码 0；`vitest run` **18 个文件 / 295 条全绿**；
评委动线读数与修复前**逐项相同**：4.48 → 4.54 / `姓名 缺少关联的可见标签` + 4.48 仍在 /
`outline: none 3px` → `solid 3px` / 报告三组 1 / 1 / 3 / 下载 13577 B；
20 组视口 **20/20 通过**（`viewport-clean.json` 与逐项日志 `rebuild-check/run-viewport-clean.log`）。

### 5. 第二次公开发布（同一站点，未新建）与逐字节核验

`prepare_site`（新 `actionId d0a23be7-ad65-4e46-b6a7-67db593506c8`，`webDirectory=dist`，`spa=false`）
→ `descriptorStatus: written` → `publish_site` → `published: true` /
`publishOperationId 01a1f1ec-f388-7629-b711-ee3ea249174e` / `state: succeeded` / `committed: true`。
发布前两次干净重建（`rm -rf dist && npm run build` 跑两遍）产物哈希一致 ⇒ 可复现。

| 检查 | 结果 |
| --- | --- |
| 公网 `index.html` 资源引用 | `assets/index-Co1Kujov.css` + `assets/index-aTyl07hG.js` ✅ 指向新构建 |
| 线上 vs 本地逐字节 | `cmp` **零差异**：JS 372750 B、CSS **28219 B**（`Content-Length` 响应头同为 28219） |
| 旧资源是否已被替换 | `index-mFcMtZD3.js` 与 `index-CFHpowcy.css` 均 **404** ✅ |

### 6. 公网复测（11:50–11:51，headless Edge 157）——与 11:14 基线对比

**四条命令跑完退出码全 0，但第一次把产物写错了位置**：我在 `.day8-evidence/rebuild-check/` 目录内执行，
而脚本用 `process.cwd()` 推导输出目录，于是证据落进了 `rebuild-check/.day8-evidence/`。
读数本身仍然有效（`LIVE_URL` 模式下浏览器加载的就是公网），已把四份 JSON 与 `shots-v2/`、`downloads-v2/`
移入 `.day8-evidence/`（**不覆盖任何已有文件**），日志留在 `rebuild-check/run-*-v2.log`。

| 复测项 | v2 公网读数 | 与 11:14 基线的差异 |
| --- | --- | --- |
| 20 组视口审计 | **20/20 通过**、无横向溢出、焦点环始终可见、skip link 首站、`h1=1`、地标齐全、`Enter`/`Space` 都触发 | **`viewport-live.json` 与 `viewport-v2.json` 递归对比：0 处差异；两份日志 `cmp` 完全相同** |
| 评委动线 | 4.48→4.54→撤销回 4.48、`labels 0→1`、`outline none 3px→solid 3px`、报告三组 1/1/3、复制 6197、下载 13577 B、`Enter`/`Space` 焦点交接四项全 `true`、控制台 `error/warning/exception` 全 0 | 仅 3 处**非结论性**差异：机械耗时 5383→5267 ms、下载文件名里的时间戳、两处点击坐标 ±4 px（元素与文案不变） |
| 网络与加载 | 74 个请求、`non2xx=0`、控制台错误 0；PERF 记录 `index-Co1Kujov.css` 128 ms / `index-aTyl07hG.js` 124 ms —— **公网确实用的是新资源**（上一轮是 75 个） | 只有资源名与计时变化 |
| 表单 + 键盘真实按键 | `labels=0 / htmlFor=null` → 回车激活 → `labels=1` + `for="student-name"` + 文本仍是「张三」；缺陷态三按钮均 `outline: none 3px`、修复后 `solid 3px rgb(67, 56, 202)` `offset 3px` | 与上一轮逐项一致；水印仍在 Tab 顺序里加两个 `qoder-sites-badge` 停靠点 |
| 五条深链冷启动 | `#/`·`#/contrast`·`#/form-label`·`#/keyboard`·`#/report` 全部 `ok=true`：`location.hash` 保持、五个 `h1` 正确、`main=1` `footer=1` `nav=1`、skip link `href="#main"` 都在、JS 错误 0 | 与 11:29 那轮逐项一致 |

**这条重建可复现性现在重新成立**：从仓库 HEAD `npm run build` 得到的两个资源文件与线上**逐字节一致**。

### 7. 本轮造成的两处材料失真（已同步更正，不留错值）

1. 全部材料里「线上产物 = `index-mFcMtZD3.js` + `index-CFHpowcy.css`」「CSS 29485 B / gzip 6256 B」已更新为
   `index-aTyl07hG.js` + `index-Co1Kujov.css` / **28219 B / gzip 6078 B**；旧值只保留为历史时刻的读数并标明时间。
2. `.day8-evidence/public-labels-focus.json` 这个文件名在 11:19 的重跑中被覆盖过，
   §2 记录的 10:21:50 那份快照**只存在于本文档的文字里**。当前公网构建的同名取证结果另存为
   `v2-public-labels-focus.json`（11:51）。这是"同一文件名反复覆盖"的做法本身有问题，后续探针一律带版本后缀。


### 8. 12:06 · 从系统「下载」找回一份公网导出样本（`downloads-os/`）

清理取证目录时发现一件漏掉的事：**11:18:56 那一轮公网核验没有给浏览器设置下载目录**
（`Page.setDownloadBehavior`），于是 Edge 按系统默认目录把报告写到了 `C:\Users\zxcvb\Downloads\` 里。
那份样本现在复制回仓库并 `cmp` 核对一致：`.day8-evidence/downloads-os/AccessLab-成果报告-20261119111856.md`
（**13523 B / 6179 字符**，台账 `2 / 3`），同目录 `README.md` 写清来历。

它反而补上了两条平时拿不到的证据：

1. **下载功能在浏览器默认路径下也能落盘**，不依赖脚本指定的目录——`downloads/` 目录曾被后续脚本清空，
   这份因此成为**唯一留存的 11:14 版公网导出样本**。
2. 与完整样本 `downloads-v2/…115045.md`（13577 B / 6197 字符，台账 `3 / 3`）逐行对比：
   **229 行里只有 9 行不同**——1 行生成时间 + 8 行台账计数与逐项「状态」；**产品文案、声明句、未检查项逐字一致**。
   这一条顺手证明了台账**不会把没做过的实验算成做过**：只跑色彩 + 表单，导出就如实写 `2 / 3`。

> 口径：参赛帖与答辩要引用的完整样本仍用 `downloads-v2/`，这份部分进度的只作过程证据。
> 教训与 §7 同源：**取证脚本必须显式设置输出目录与下载目录**，否则证据会散落到仓库外，
> 而「证据就在这里」的默认假设会让人根本找不到它。

> **一句话教训**：构建产物必须只由源代码决定。仓库里任何"证据"文件都不应该能改变产物字节——
> 否则每多存一份取证，"从仓库重建 = 线上产物"这条可复现性承诺就悄悄失效一次，而且**没有任何测试会报错**。
