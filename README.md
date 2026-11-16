# AccessLab｜无障碍实验室

> 让每个人都能更轻松地使用互联网。

AccessLab 是面向学生开发者的交互式网页无障碍学习与检测平台。
它用**真实网页组件 + 实时自动检测 + 可对比结果**替代抽象条文，
让开发者亲手改一个颜色、看一次结果，就明白无障碍为什么重要。

2026 Qoder 高校创造力大赛 · Hack4Good 技术向善赛道参赛项目。

## 当前进度

| 模块 | 状态 |
| --- | --- |
| 首页 | ✅ 已上线 |
| 色彩对比度实验（WCAG 2.2 相对亮度 / 普通文本 AA 4.5:1） | ✅ 已上线 |
| 表单标签无障碍实验 | 🔒 即将开放 |
| 键盘焦点实验 | 🔒 即将开放 |
| 实验结果报告 | 🔒 即将开放 |

详见 [PROJECT_STATUS.md](./PROJECT_STATUS.md) 与 [DEVLOG.md](./DEVLOG.md)。

## 技术栈

React 19 · TypeScript 5.9 · Vite 8 · Tailwind CSS 4 · Vitest 5 · 原生 React Hooks

纯前端实现，无数据库，无付费第三方 API。
两个页面使用自建 hash 路由（约 30 行），因此静态托管下刷新 `#/contrast` 无需服务端 rewrite。

## 快速开始

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 运行对比度算法单元测试
npm run build    # 类型检查 + 生产构建，产物在 dist/
npm run preview  # 预览生产构建
```

## 项目结构

```
src/
├─ lib/contrast.ts        # WCAG 2.2 相对亮度与对比度算法
├─ lib/contrast.test.ts   # 算法单元测试
├─ hooks/useHashRoute.ts  # 极简 hash 路由
├─ pages/                 # HomePage / ContrastLabPage
├─ components/            # AppHeader / ExperimentCard / ColorControl
├─ App.tsx                # 布局、skip link、路由与焦点管理
└─ index.css              # Tailwind 入口、焦点样式、reduced-motion
```

## 关于对比度检测的边界

- 检测值由 WCAG 2.2 相对亮度算法实时计算，不存在写死的结论。
- **仅**判定成功标准 1.4.3「普通文本 AA ≥ 4.5:1」。
- 不判定大文本（3:1）、非文本对比（1.4.11）、语义结构与键盘可达性。
- 因此：本项通过 ≠ 该组件或整个网站符合 WCAG 2.2。

## 项目自身遵循的无障碍实践

语义化 landmark、跳转到主内容的 skip link、完整可见的 `:focus-visible` 描边、
连续的标题层级、全部控件带 `<label>`/`aria-label`、结果区 `role="status"` + `aria-live="polite"`、
非法输入通过 `aria-invalid` + `aria-describedby` 反馈、
`prefers-reduced-motion` 降级、界面配色自身满足 AA 对比度。

## 治理文档

- [PRD.md](./PRD.md) — 需求与功能边界
- [DEVLOG.md](./DEVLOG.md) — 按日期的开发记录与测试证据
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) — 当前状态、遗留问题与下一阶段

每次开发前先阅读这三份文件，开发后同步更新 `DEVLOG.md` 与 `PROJECT_STATUS.md`。
