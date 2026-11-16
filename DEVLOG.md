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
