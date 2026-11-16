import { Contrast, Keyboard, ArrowRight, TextCursorInput } from 'lucide-react'

import { ExperimentCard } from '../components/ExperimentCard'
import { ROUTE_HASH } from '../hooks/useHashRoute'

const EXPERIMENTS = [
  {
    index: 1,
    title: '色彩对比度实验',
    summary:
      '调整文字色与背景色，实时看到 WCAG 2.2 相对亮度算出的对比度，并判断是否达到普通文本 AA 的 4.5:1 门槛。',
    icon: Contrast,
    status: 'available' as const,
    href: ROUTE_HASH['contrast-lab'],
  },
  {
    index: 2,
    title: '表单标签无障碍实验',
    summary:
      '对比缺失 label 的输入框与正确关联 label 的输入框，观察屏幕阅读器与点击区域会失去什么。',
    icon: TextCursorInput,
    status: 'upcoming' as const,
  },
  {
    index: 3,
    title: '键盘焦点实验',
    summary: '用 Tab 键走查一条真实操作流程，找出焦点不可见、焦点丢失与陷阱的位置。',
    icon: Keyboard,
    status: 'upcoming' as const,
  },
]

export function HomePage() {
  return (
    <>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-900 ring-1 ring-indigo-700/20 ring-inset">
            Hack4Good · 技术向善赛道
          </p>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            AccessLab
          </h1>
          <p className="mt-2 text-xl font-semibold text-indigo-800">无障碍实验室</p>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-700">
            让每个人都能更轻松地使用互联网。
          </p>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-700">
            AccessLab 是面向学生开发者的交互式网页无障碍学习与检测平台。
            我们不把 WCAG 条文当作背诵清单，而是把真实的网页组件、实时计算和可对比的结果放在你面前，
            让你亲手改一个颜色、看一次结果，就明白无障碍为什么重要。
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href={ROUTE_HASH['contrast-lab']}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-6 py-3.5 text-base font-semibold text-white no-underline transition-colors hover:bg-indigo-800"
            >
              开始体验
              <ArrowRight className="size-5" aria-hidden="true" />
            </a>
            <a
              href="#experiments"
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-3 text-base font-semibold text-indigo-800 underline decoration-indigo-400 decoration-2 underline-offset-4 hover:decoration-indigo-800"
            >
              查看实验方向
            </a>
          </div>
        </div>
      </section>

      <section id="experiments" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-14 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">实验方向</h2>
          <p className="mt-2 text-base leading-relaxed text-slate-700">
            AccessLab 计划提供三个实验。当前开放第一个，另外两个仍在开发中，因此不提供可点击的入口。
          </p>
        </div>

        <ul className="mt-8 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {EXPERIMENTS.map((experiment) => (
            <li key={experiment.index} className="h-full">
              <ExperimentCard {...experiment} />
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
