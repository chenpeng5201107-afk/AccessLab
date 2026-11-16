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
| 当前访问级别 | ⚠️ `private`——「此站点仅向受邀用户开放」，需 Qoder 登录后访问 |

发布共执行两次，同一 Project / Site，未创建重复站点：

1. 首个 action `b14f486c…`：首次创建 Project/Site 并发布成功。
2. 但随后为修复第 6 节的两项无障碍问题修改了源码，线上产物已过期，
   因此 `npm run build` 重新构建（JS 哈希 `index-CkcvWwoW.js` → `index-CRbJDy1g.js`），
   并用新 action `1abb0737…` 复用 `projectId` 重新发布。当前线上版本为后者。

上传前已检查产物：`dist/` 仅 3 个文件，无 source map、无 `.env`、无凭据。

公开访问设置方法（**尚未执行**，需用户明确授权）：
`update_access_policy`，参数 `mode: "public"` + `confirmPublic: true`（`selected` 模式可指定至多 50 位用户）。
新建站点默认 private，切换受众属于独立授权动作，不由「部署」这一请求自动推导。

### 6. 本次会话中发现并修复的问题

1. **`tsconfig.node.json` 误写入多余标签** —— 检查后确认文件实际内容正确，为虚惊。
2. **实验卡片标题被朗读成「01色彩对比度实验」** —— 装饰性序号混入了无障碍名称。
   修复：序号 `<span>` 加 `aria-hidden="true"`，朗读恢复为纯标题。
3. **React StrictMode 下首屏即抢焦点** —— 开发模式双次执行 effect 导致初次加载就 `focus()` 到 `<main>`。
   修复：改用 `lastRouteRef` 与当前路由比较，只有真正发生路由变更才移动焦点。
   （两项修复均在浏览器中复验通过。）

### 7. 未解决的问题

- 站点为 private，公开可访问性尚未开启，也未验证线上真实渲染。
- 内置浏览器视口不可用，缺少视觉截图与肉眼回归。
- `node` 不在系统 PATH（实际安装在 `D:/Soft_Ware`），新会话需手动前置该目录，否则 npm 报 `node: not found`。
- 尚未配置 CI，构建与测试依赖本地手动执行。
