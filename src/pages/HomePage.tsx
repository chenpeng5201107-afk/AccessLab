import { ArrowRight, CircleAlert, CircleCheckBig, Contrast, Keyboard, TextCursorInput } from 'lucide-react'

import { ExperimentCard } from '../components/ExperimentCard'
import { ROUTE_HASH } from '../hooks/useHashRoute'
import {
  AA_NORMAL_TEXT_RATIO,
  contrastRatioFromHex,
  formatContrastRatio,
  meetsAaNormalText,
} from '../lib/contrast'
import { suggestTextColor } from '../lib/colorRepair'

const EXPERIMENTS = [
  {
    index: 1,
    title: '色彩对比度实验',
    summary: '换一对颜色，当场看到反差够不够，以及该把它改成什么样。',
    icon: Contrast,
    status: 'available' as const,
    href: ROUTE_HASH['contrast-lab'],
  },
  {
    index: 2,
    title: '表单标签无障碍实验',
    summary: '输入框旁边那行字，读屏软件可能根本读不到。补上真正的关联试试。',
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
    // 直接用实验页那套算法的输出，首页看到的数字进实验页一模一样
    after: {
      fg: suggestTextColor('#777777', '#ffffff').suggestedTextColor ?? '#777777',
      bg: '#ffffff',
      caption: '算法建议：背景不动，只把文字加深',
    },
  },
  {
    label: '主按钮文字',
    sample: '立即处理',
    before: { fg: '#ffffff', bg: '#6366f1', caption: '亮靛蓝底 + 白字' },
    after: { fg: '#ffffff', bg: '#4338ca', caption: '另一种做法：文字不动，背景加深' },
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
  const before = tag === '修复前'

  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
            before ? 'bg-slate-100 text-slate-800' : 'bg-indigo-100 text-indigo-900'
          }`}
        >
          {tag}
        </span>
        <span className="font-mono text-base font-bold text-slate-900 tabular-nums">
          {ratio === null ? '—' : formatContrastRatio(ratio)}
        </span>
      </div>

      <div
        className="mt-2 flex min-h-20 items-center justify-center rounded-md border border-slate-300 px-2 py-4 text-center text-sm font-semibold"
        style={{ backgroundColor: bg, color: fg }}
      >
        <span>{sample}</span>
      </div>

      <p
        className={`mt-2 flex flex-wrap items-center gap-1.5 text-xs font-semibold ${
          passes ? 'text-emerald-900' : 'text-red-900'
        }`}
      >
        {passes ? (
          <CircleCheckBig className="size-3.5 shrink-0" aria-hidden="true" />
        ) : (
          <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
        )}
        {passes ? '达到 AA' : '未达 AA'}
        <span className="font-normal text-slate-600">
          {before ? `（需 ≥ ${AA_NORMAL_TEXT_RATIO}:1）` : `（≥ ${AA_NORMAL_TEXT_RATIO}:1 达标）`}
        </span>
      </p>
      <p className="mt-0.5 text-xs text-slate-600">{caption}</p>
    </div>
  )
}

const AUDIENCE_POINTS = [
  { term: '给谁用', desc: '学生开发者、前端初学者' },
  { term: '解决什么', desc: '发现并修好最常见的无障碍问题' },
  { term: '怎么体验', desc: '三个动手实验，成果还能导出成报告' },
]

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

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-pretty text-slate-700">
              页面自己用着没问题，别人可能看不清按钮、找不到输入框、用键盘走两步就丢了位置。
              AccessLab 把这些缺陷做成能动手改的真实实验：改一处，当场看到差别。
            </p>

            <dl className="mt-6 grid gap-x-6 gap-y-3 border-t border-slate-200 pt-5 sm:grid-cols-3">
              {AUDIENCE_POINTS.map((point) => (
                <div key={point.term} className="min-w-0">
                  <dt className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                    {point.term}
                  </dt>
                  <dd className="mt-1 text-sm leading-snug font-semibold text-slate-900">{point.desc}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
              <a
                href={ROUTE_HASH['contrast-lab']}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-7 py-3.5 text-base font-bold text-white no-underline shadow-sm transition-colors hover:bg-indigo-800"
              >
                开始第一个实验
                <ArrowRight className="size-5" aria-hidden="true" />
              </a>
              <a
                href="#experiments"
                className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-800 underline decoration-indigo-300 decoration-2 underline-offset-4 hover:decoration-indigo-800"
              >
                查看另外两个实验
              </a>
            </div>

            <p className="mt-5 text-xs text-slate-600">
              2026 Qoder 高校创造力大赛 · Hack4Good 技术向善赛道
            </p>
          </div>

          <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              同一句话，只是换个颜色
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              下面两组数值由和实验页相同的算法实时算出，不是配图。
            </p>

            <div className="mt-4 space-y-4">
              {FIX_CASES.map((item) => (
                <div key={item.label} className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                    {item.label}
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <Swatch tag="修复前" sample={item.sample} {...item.before} />
                    <Swatch tag="修复后" sample={item.sample} {...item.after} />
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              判定依据：WCAG 2.2 成功标准 1.4.3 给普通文本定的 AA 档，比值需 ≥ {AA_NORMAL_TEXT_RATIO}:1。
            </p>

            <a
              href={ROUTE_HASH['contrast-lab']}
              className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-indigo-800 underline decoration-indigo-300 decoration-2 underline-offset-4 hover:decoration-indigo-800"
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
            三个都已经可以体验，建议按顺序做完：换一对颜色、补一个标签关联、再用 Tab 走一遍焦点。
            每个实验只覆盖对应的成功标准，结论不代表整站符合 WCAG 2.2。
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
          每个实验做完都会把真实结果登记进本次会话的台账。做完后可以去
          <a
            href={ROUTE_HASH.report}
            className="mx-1 inline-flex min-h-11 items-center gap-1 font-semibold text-indigo-800 underline decoration-indigo-300 decoration-2 underline-offset-4 hover:decoration-indigo-800"
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
