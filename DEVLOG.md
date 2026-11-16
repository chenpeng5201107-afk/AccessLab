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

