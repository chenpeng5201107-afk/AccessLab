# AccessLab｜无障碍实验室

**2026 Qoder 高校创造力大赛 · Hack4Good · 技术向善**

**让网页的障碍，看得见、改得掉。**

AccessLab 用于网页无障碍教育与辅助技术普及。学生开发者和校园网站维护者可以在摄影社报名页上体验三种障碍：低视力用户读不清集合地点、读屏用户难以确认输入框用途、键盘用户找不到当前焦点。开发者能修复样本，再用图书馆预约页检验自己的判断。[本届参赛作品帖草稿](submission/hack4good-entry.md)

## 在本机运行

本版使用 Node.js 24 验证。项目基于 React、TypeScript 与 Vite，依赖由 package-lock.json 锁定。

```shell
npm ci
npm run dev
```

## 直接部署到 Qoder Sites

1. 在 Qoder CN 打开本项目根目录（包含 `package.json`）。
2. 安装命令为 `npm ci`，构建命令为 `npm run build`。本轮已在根目录生成 `dist/`，可直接作为静态发布目录。如从 Git 检出，请重新构建。
3. 在 Qoder Sites 选择当前项目，发布目录选 `dist`，入口为 `index.html`，访问范围设为公开。无需配置环境变量、数据库、API Key 或路由重写。
4. 发布后用未登录的浏览器打开公网地址，确认首页显示「开始校园初诊」，并由 `#/diagnosis` 走到学习报告。旧线上截图和部署记录见历史材料，本版发布状态以实际公网复验为准。

本地查看相同产物：

```shell
npm run build
npm run preview
```

## 使用流程

- **校园初诊**：试读地点、点击输入框标题、用 Tab 找操作按钮，提交三项判断。取证工具提供组件片段及实测对比度。
- **跟练修复**：按错因进入色彩、表单标签或键盘焦点实验，完成该实验的修复。返回案例应用修复，在同一个样本上复验。
- **图书馆迁移测验**：检查另一张页面，分辨正确实现和缺陷。第一次交卷后锁定首答。错题提供新的订正问题。
- **学习报告**：查看三个能力的初诊、案例修复、迁移首答与订正，复制或下载 Markdown。可直接从导航进入原有三个实验。
- 进度只在当前页面会话的内存中，切换路由会保留，刷新后会清空。示例姓名或代号不进入记录。报告页提供确认后清空和 Markdown 备份。

## 验证与开发来源

`npm test` 运行算法、组件和路由集成测试。`npm run build` 执行类型检查与静态生产构建。
两个案例均为教学示例，给出的是对应题目与检查项的结果。

原有三个实验及上一版 Qoder Sites 部署过程记录在 DEVLOG.md。校园案例、错题订正、学习报告和本轮界面打磨由 Codex 在现有项目上实现。

首页的灰度滑块可用方向键调节，复用实验页的对比度计算。网页使用 design-taste-frontend 的丝绸光影和标题动效，字体随站点部署，字体许可位于 public/type/。

本地生产版预览：[首页](submission/preview/01-home.png) · [校园初诊](submission/preview/02-diagnosis.png) · [学习报告](submission/preview/03-learning-report.png) · [手机案例页](submission/preview/04-mobile.png)。

更正赛道前的界面布局、性能测量和待处理项目见[历史前端验收记录](submission/studyhack-preview/design-review.md)。

当前版本功能、用法与部署参数以本 README 为准；较早阶段的记录保留在 PRD.md、PROJECT_STATUS.md、DEVLOG.md 和 submission/ 中。
