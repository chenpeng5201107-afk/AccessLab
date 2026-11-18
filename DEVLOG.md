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
2. **真实物理 Tab 焦点序列**：安装 `focusin` 录制器后连按 Tab，录制结果 `tabsRecorded: 0`、`activeElement` 停留在 `main` —— 页面未 attached，按键不驱动焦点遍历。同一问题两次尝试均失败，按约定停止重试并上报。可给的替代证据只有结构性的：本页可聚焦元素全部来自自然 DOM 顺序、无正值 `tabindex`、全局 `:focus-visible` 为 3px indigo 描边。
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
3. **真实物理 Tab 序列**（遗留 #4）：本轮 `press_key Tab` **能够驱动焦点遍历**（上轮 `tabsRecorded: 0` 的阻断已解除）。
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

- 报告页、台账、Markdown 导出、本地下载、清空确认全部开发完成并通过测试与真实浏览器取证；Day 1–4 零回归。
- 线上仍是 Day 3 构建 `index-AFw0dV32.js`；Day 4 / Day 5 改动**尚未提交、尚未发布**，等用户确认。



