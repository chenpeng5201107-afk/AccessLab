# AccessLab 项目状态

> 最后更新：2026-11-17（**Day 3 复核轮**：Day 2 / Day 3 源码均已提交（`943a3ac` / `737ceb7`，HEAD = `7067ec4`），本轮零源码改动，重跑 `npm test` **90/90**、`npm run build` 通过，
> 并把上一轮记为「本环境不可测」的 **320/390 横向溢出**与**真实物理 Tab**补成实测数据；线上经 curl 核对仍是 Day 2 产物（Day 3 资源 404），**Day 3 发布待用户授权**）

## 1. 当前阶段

**Day 2 已结项并发布到公网（线上 = 本地构建，`public` 无登录可访问）。Day 3 的「表单标签无障碍实验」已完成开发、测试与真实浏览器取证：姓名输入框的缺陷标签由 `<span>` 真实改成 `<label for="student-name">`，检测读取浏览器真实 DOM，修复后结论由 2 项问题归 0、点击 label 可聚焦输入框、可重置复现。**

Day 3 范围严格限定在表单标签实验：
**未开发**键盘焦点实验（首页仍只放卡片）、**未**开发展示报告系统、**未**引入后端/数据库/外部 AI API、**未新增任何依赖**、
**未**重构路由系统（只在既有 hash 表上追加 `#/form-label`）、**未**做无关视觉重构。
Day 1 / Day 2 的页面与算法未被改动，`npm test` 中原有 60 条**零回归**。

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

## 3. 链接与命令

- 站点地址：https://accessibility-lab-3g6uvbn5duq.qoder.zone （公开可访问，实测无登录门；**当前线上为 Day 2 构建 `index-Biknu-lx.js`，不含 Day 3 表单实验**；Day 3 待发产物 = `dist/`，入口 `index-AFw0dV32.js`）
- 本地开发：`npm run dev` ｜ 预览产物：`npm run preview` ｜ 测试：`npm test` ｜ 构建：`npm run build` → `dist/`
- 仓库状态：HEAD = **`7067ec4` `docs: record day3 commit hash and deferred publication`**；Day 3 功能提交 = `737ceb7`，其父 `943a3ac`（Day 2 稳定版）即**回退点**。均未推送远程。
  唯一有意保留的未提交改动是 `.AccessLab 无障碍实验室.qoder.site` 的 `publication` 块（Sites 工具写入的云端 ID + base64 冻结 `index.html`，与「不跟踪构建产物」的既有约定冲突，经用户确认不入库）。
- 环境提醒：`node` 不在系统 PATH，会话内需 `export PATH="/d/Soft_Ware:$PATH"`（node v25.2.1 / npm 11.6.2，测试与构建实测正常）。

## 4. 遗留问题

| # | 问题 | 影响 | 建议处理 |
| --- | --- | --- | --- |
| 1 | ~~Day 3 改动未提交~~ ✅ 已提交 `737ceb7`（经用户确认，不含 `.qoder.site` 描述符） | — | 如需推送远程由人工决定 |
| 2 | **Day 3 未发布**（复核已通过，按约定等用户授权后才上线），线上仍是 Day 2 版本 | 评委暂时访问不到表单实验 | 授权后按官方工作流发布当前 `dist/`（入口 `index-AFw0dV32.js`）；回退手段：`943a3ac` 可重建 Day 2 同哈希产物 + 旧 action `0bf1a61d…` 的历史发布仍在平台 |
| 3 | ~~320 / 390 横向溢出与 44px 触控目标在本环境不可测~~ ✅ **本轮已实测通过** | — | 同源 iframe 窄视口：`scrollWidth === clientWidth`（305 / 375），三页无横向溢出；仅 sr-only skip link 高度 < 44px（非指点目标）。真机观感仍可由人工目视复核 |
| 4 | ~~真实物理 Tab 焦点序列未取到证据~~ ✅ **本轮已可用并取证**（部分） | 只逐步走到第 5 站，未逐个按完 14 站 | `press_key Tab` 已能驱动遍历：前 5 站顺序正确、焦点样式 `3px indigo outline / offset 2px`、全页无正值 `tabindex`（顺序 = DOM 顺序）。剩余站点建议人工按完一遍 |
| 5 | 真机读屏（NVDA / VoiceOver / TalkBack）未验证；复制成功分支需真实手势 | 「实际朗读」与「复制成功」文案未被真眼真耳确认 | 人工用读屏对比缺陷态/修复态朗读，并各点一次复制按钮 |
| 6 | 检测器可见性判定不读盒模型尺寸 | CSS 位移 / 透明度隐藏的标签检不出来 | 已作为已知限制写进页面向评委说明；后续可加 `getClientRects()` 判定（仅在真实浏览器有意义） |
| 7 | 色彩实验非法输入的两个 `role=status` 播报区（前轮遗留 #4） | 严格「单区」口径可能被判多区 | 经用户确认保持现状；表单页已按「单一 `aria-live` 区」实现并测试 |
| 8 | `node` 不在 PATH、node v25.2.1 超出 vitest 引擎声明 | 新会话直接 `npm` 会 `node: not found` | 会话内 `export PATH="/d/Soft_Ware:$PATH"` |

> 注意：不要在同一天同时推进多个实验模块；保留已通过验收的模块，避免无关重构。

## 5. 下一阶段（Day 4）任务建议

1. 发布 Day 3（只剩遗留 #2：授权后走官方工作流上线 `index-AFw0dV32.js`），让人人有公网链接可玩到表单实验；提交部分已完成（`737ceb7` / `7067ec4`）。
2. 人工补齐遗留 #5（真机读屏的实际朗读、真实指针点击 label、复制成功分支）与 #4 剩余站点的目视复核，把结论写回本文档（哪些已过、哪些仍需改）。#3 已由本轮实测关闭。
3. 键盘焦点实验（`#/keyboard`）：复用 `formLabelAudit` 的「只读真实 DOM」模式做焦点顺序 / 焦点可见 / trap 检测。
4. 视需要补大文本 AA 3:1（仍属 1.4.3，勿与 1.4.6 AAA 混称）。
5. 「实验结果报告」最小版：汇总当前配色 / 对比度 / 标签检测结果为可复制摘要（不引入后端）。
