# AccessLab 项目状态

> 最后更新：2026-11-17（**Day 3｜表单标签无障碍实验**：Day 2 已正式结项（提交 `943a3ac` + 已发布线上）；Day 3 新增实验页、真实 DOM 检测器与 29 条新测试，`npm test` **90/90**、`npm run build` 通过；Day 3 改动**待确认后提交**、**待授权后发布**）

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

## 3. 链接与命令

- 站点地址：https://accessibility-lab-3g6uvbn5duq.qoder.zone （公开可访问，**当前线上为 Day 2 构建 `index-Biknu-lx.js`，不含 Day 3 表单实验**）
- 本地开发：`npm run dev` ｜ 预览产物：`npm run preview` ｜ 测试：`npm test` ｜ 构建：`npm run build` → `dist/`
- 仓库状态：HEAD = `943a3ac`（Day 2 稳定提交，构成 Day 3 的回退点）；Day 3 的 11 项改动（6 改 + 5 新）**尚未提交**，提交与推送均需人工确认。
- 环境提醒：`node` 不在系统 PATH，会话内需 `export PATH="/d/Soft_Ware:$PATH"`（node v25.2.1 / npm 11.6.2，测试与构建实测正常）。

## 4. 遗留问题

| # | 问题 | 影响 | 建议处理 |
| --- | --- | --- | --- |
| 1 | **Day 3 改动未提交**（HEAD 仍 `943a3ac`） | 表单实验无提交点 | 经用户确认后创建独立 Day 3 提交；**不推送远程** |
| 2 | **Day 3 未发布**，线上仍是 Day 2 版本 | 评委访问不到表单实验 | 用户授权后按官方工作流发布新 `dist/`（`index-AFw0dV32.js`）；回退手段：`943a3ac` 可重建同哈希产物 + 旧 action `0bf1a61d…` 的历史发布仍在 |
| 3 | 320 / 390 横向溢出与 44px 触控目标**在本环境不可测** | 窄屏观感无像素级证据 | 人工在 320/390/768/1440 目视（内嵌浏览器 `viewport=0x0`、`visibilityState=hidden`，此前溢出扫描产出 106 条假阳性） |
| 4 | **真实物理 Tab 焦点序列未取到证据** | 键盘遍历顺序未实测 | 人工按 Tab 走一遍。录制器两次尝试均 `tabsRecorded: 0`（页面未 attached，按键不驱动焦点遍历），按约定停止重试；结构性替代证据：无正值 `tabindex`、全局 `:focus-visible` 3px indigo |
| 5 | 真机读屏（NVDA / VoiceOver / TalkBack）未验证；复制成功分支需真实手势 | 「实际朗读」与「复制成功」文案未被真眼真耳确认 | 人工用读屏对比缺陷态/修复态朗读，并各点一次复制按钮 |
| 6 | 检测器可见性判定不读盒模型尺寸 | CSS 位移 / 透明度隐藏的标签检不出来 | 已作为已知限制写进页面向评委说明；后续可加 `getClientRects()` 判定（仅在真实浏览器有意义） |
| 7 | 色彩实验非法输入的两个 `role=status` 播报区（前轮遗留 #4） | 严格「单区」口径可能被判多区 | 经用户确认保持现状；表单页已按「单一 `aria-live` 区」实现并测试 |
| 8 | `node` 不在 PATH、node v25.2.1 超出 vitest 引擎声明 | 新会话直接 `npm` 会 `node: not found` | 会话内 `export PATH="/d/Soft_Ware:$PATH"` |

> 注意：不要在同一天同时推进多个实验模块；保留已通过验收的模块，避免无关重构。

## 5. 下一阶段（Day 4）任务建议

1. 先把 Day 3 提交 + 发布补上（遗留 #1、#2），让人人有公网链接可玩到表单实验。
2. 人工补齐遗留 #3–#5 的验证并把结论写回本文档（哪些已过、哪些仍需改）。
3. 键盘焦点实验（`#/keyboard`）：复用 `formLabelAudit` 的「只读真实 DOM」模式做焦点顺序 / 焦点可见 / trap 检测。
4. 视需要补大文本 AA 3:1（仍属 1.4.3，勿与 1.4.6 AAA 混称）。
5. 「实验结果报告」最小版：汇总当前配色 / 对比度 / 标签检测结果为可复制摘要（不引入后端）。
