import { ArrowRight, Contrast, Keyboard, TextCursorInput } from 'lucide-react'

import { ExperimentCard } from '../components/ExperimentCard'
import { ROUTE_HASH } from '../hooks/useHashRoute'
import { contrastRatioFromHex, formatContrastRatio, meetsAaNormalText } from '../lib/contrast'

const EXPERIMENTS = [
  {
    index: 1,
    title: '色彩对比度实验',
    summary: '换一对颜色，马上看到反差够不够，问题出在哪里。',
    icon: Contrast,
    status: 'available' as const,
    href: ROUTE_HASH['contrast-lab'],
  },
  {
    index: 2,
    title: '表单标签无障碍实验',
    summary: '看看少了标签关联的输入框，会让屏幕阅读器用户难以确认该填什么，容易填错或漏填。',
    icon: TextCursorInput,
    status: 'available' as const,
    href: ROUTE_HASH['form-label-lab'],
  },
  {
    index: 3,
    title: '键盘焦点实验',
    summary: '别用鼠标，只按 Tab 走一遍：焦点走到哪了，你还看得出来吗？',
    icon: Keyboard,
    status: 'available' as const,
    href: ROUTE_HASH['keyboard-lab'],
  },
]

/** 演示配色：每组的数值都由 contrast.ts 的 WCAG 2.2 算法实时算出，不写死结论 */
const FIX_CASES = [
  {
    label: '正文小字',
    sample: '你的书快到期了，记得早点还。',
    before: { fg: '#777777', bg: '#ffffff', caption: '很常见的浅灰正文' },
    after: { fg: '#595959', bg: '#ffffff', caption: '同一色相，加深一档' },
  },
  {
    label: '主按钮文字',
    sample: '立即处理',
    before: { fg: '#ffffff', bg: '#6366f1', caption: '亮靛蓝底 + 白字' },
    after: { fg: '#ffffff', bg: '#4338ca', caption: '换成深一档的靛蓝' },
  },
] as const

interface SwatchProps {
  tag: '修复前' | '修复后'
  fg: string
  bg: string
  caption: string
  sample: string
}

function Swatch({ tag, fg, bg, caption, sample }: SwatchProps) {
  const ratio = contrastRatioFromHex(fg, bg)
  const passes = ratio !== null && meetsAaNormalText(ratio)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div
        className="flex min-h-20 items-center justify-center rounded-lg px-3 py-4 text-center text-sm font-semibold"
        style={{ backgroundColor: bg, color: fg }}
      >
        <span>{sample}</span>
      </div>
      <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span
          className={`rounded-md px-2 py-0.5 font-semibold ${
            passes ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'
          }`}
        >
          {tag}
        </span>
        <span className="font-mono font-semibold text-slate-900 tabular-nums">
          {ratio === null ? '—' : formatContrastRatio(ratio)}
        </span>
        <span className="text-slate-700">{passes ? '反差够用' : '反差偏低，看不清'}</span>
      </p>
      <p className="mt-1 text-xs text-slate-600">{caption}</p>
    </div>
  )
}

export function HomePage() {
  return (
    <>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start lg:gap-12 lg:py-16">
          <div>
            <p className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-900 ring-1 ring-indigo-700/20 ring-inset">
              AccessLab · 无障碍实验室
            </p>

            <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-balance text-slate-900 sm:text-4xl lg:text-[2.75rem]">
              让网页的障碍，
              <br className="hidden sm:block" />
              看得见、改得掉。
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-700">
              很多人上网时看不清按钮、找不到输入框、用键盘走两步就丢了位置，却没人告诉他们问题出在哪。
              AccessLab 把真实页面摆在你面前：改一个颜色、补一个标签关联、再用 Tab 走一遍焦点，
              立刻看见问题，也立刻看见修好后的样子。
            </p>

            <p className="mt-4 text-base font-semibold text-indigo-800">
              让每个人都能更轻松地使用互联网。
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={ROUTE_HASH['contrast-lab']}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-7 py-3.5 text-base font-bold text-white no-underline shadow-sm transition-colors hover:bg-indigo-800"
              >
                开始第一个实验
                <ArrowRight className="size-5" aria-hidden="true" />
              </a>
              <a
                href="#experiments"
                className="inline-flex min-h-12 items-center justify-center rounded-xl px-4 py-3 text-base font-semibold text-indigo-800 underline decoration-indigo-400 decoration-2 underline-offset-4 hover:decoration-indigo-800"
              >
                查看另外两个实验
              </a>
            </div>

            <p className="mt-5 text-xs text-slate-600">
              2026 Qoder 高校创造力大赛 · Hack4Good 技术向善赛道
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              同一句话，只是换个颜色
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              下面两组数值由和实验页相同的算法实时算出，不是配图。
            </p>

            <div className="mt-4 space-y-4">
              {FIX_CASES.map((item) => (
                <div key={item.label}>
                  <p className="mb-2 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                    {item.label}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Swatch tag="修复前" sample={item.sample} {...item.before} />
                    <Swatch tag="修复后" sample={item.sample} {...item.after} />
                  </div>
                </div>
              ))}
            </div>

            <a
              href={ROUTE_HASH['contrast-lab']}
              className="mt-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-indigo-800 underline decoration-indigo-400 decoration-2 underline-offset-4 hover:decoration-indigo-800"
            >
              自己动手改一对颜色
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section id="experiments" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-12 sm:px-6 sm:py-14">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">三个实验方向</h2>
          <p className="mt-2 text-base leading-relaxed text-slate-700">
            三个都已经可以体验：换一对颜色、修一个标签关联、再用 Tab 走一遍焦点。
            每个实验都只覆盖对应的成功标准，结论不代表整站符合 WCAG 2.2。
          </p>
        </div>

        <ul className="mt-8 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {EXPERIMENTS.map((experiment) => (
            <li key={experiment.index} className="h-full">
              <ExperimentCard {...experiment} />
            </li>
          ))}
        </ul>

        {/* 轻量入口：报告不是第四个实验，而是把上面三个实验本次会话的真实结果汇总起来 */}
        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-slate-700">
          做完实验后，可以去
          <a
            href={ROUTE_HASH.report}
            className="mx-1 inline-flex min-h-11 items-center gap-1 font-semibold text-indigo-800 underline decoration-indigo-400 decoration-2 underline-offset-4 hover:decoration-indigo-800"
          >
            统一成果报告
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
          汇总这一轮的检测、修复与待验证项目，并复制或导出成 Markdown。
        </p>
      </section>
    </>
  )
}
