import { ArrowRight, CircleAlert, CircleCheckBig, Contrast, Keyboard, TextCursorInput } from 'lucide-react'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Activity, SlidersHorizontal } from 'lucide-react'
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
    title: '色彩对比度实验',
    summary: '调整图书馆提醒的配色，让小字也能看清。',
    icon: Contrast,
    href: ROUTE_HASH['contrast-lab'],
  },
  {
    title: '表单标签实验',
    summary: '点一下“姓名”，看光标能否进入输入框。',
    icon: TextCursorInput,
    href: ROUTE_HASH['form-label-lab'],
  },
  {
    title: '键盘焦点实验',
    summary: '用 Tab 走过三个按钮，找回消失的焦点。',
    icon: Keyboard,
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

/** 首页使用与实验页相同的计算，试色不计入学生的独立作答。 */
function ContrastConsole() {
  const [shade, setShade] = useState(118)
  const hex = '#' + shade.toString(16).padStart(2, '0').repeat(3).toUpperCase()
  const ratio = contrastRatioFromHex(hex, '#FFFFFF')!
  const passes = meetsAaNormalText(ratio)
  return (
    <div className="scope-console app-frame" aria-label="实时文字对比度实验">
      <div className="scope-bar">
        <span>
          <Activity size={16} aria-hidden="true" /> 对比度实验台
        </span>
        <span className="scope-standard">WCAG 2.2 · 1.4.3</span>
      </div>
      <div className="scope-body">
        <div className="specimen" style={{ '--sample-ink': hex } as CSSProperties}>
          <div className="specimen-text">
            <span aria-hidden="true">Aa</span>
            <p>图书归还提醒</p>
          </div>
          <span className="specimen-cross" aria-hidden="true">
            ＋
          </span>
          <div className="specimen-scale" aria-hidden="true" />
        </div>
        <div className="scope-controls">
          <div className="measure-top">
            <span>文字对比度</span>
            <strong data-pass={passes}>{passes ? '达到 AA' : '未达 AA'}</strong>
          </div>
          <div className="scope-reading">
            <div className="ratio-readout" aria-hidden="true">
              {ratio.toFixed(2)}
              <small>:1</small>
            </div>
            <span className="aa-limit">AA ≥ 4.5:1</span>
          </div>
          <label htmlFor="scope-shade">
            <span>
              <SlidersHorizontal size={14} aria-hidden="true" />
              文字灰度
            </span>
            <code>{hex}</code>
          </label>
          <input
            id="scope-shade"
            type="range"
            min="0"
            max="255"
            value={shade}
            aria-valuetext={
              hex + '，对比度 ' + formatContrastRatio(ratio) + (passes ? '，达到普通文本 AA' : '，未达普通文本 AA')
            }
            onChange={(event) => setShade(Number(event.target.value))}
          />
        </div>
      </div>
    </div>
  )
}

export function HomePage() {
  const hero = useRef<HTMLElement>(null)
  const experiments = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!hero.current || !experiments.current || typeof window.matchMedia !== 'function') return
    const section = experiments.current
    const ground = hero.current.querySelector<HTMLElement>('[data-fx]')!
    const base = new URL(import.meta.env.BASE_URL + 'assets/', document.baseURI)
    let active = true
    let releaseEffect: (() => void) | undefined
    let releaseMoment: (() => void) | undefined
    const kit = (file: string) => import(/* @vite-ignore */ new URL(file, base).href)
    // The CSS ground and intact heading also render when enhancement modules are unavailable.
    void kit('effects/fx.js')
      .then(async (fx) => {
        if (!active) return
        const api = await fx.mount(ground, 'silk-folds', {
          palette: fx.readPalette(ground),
          params: { speed: 0.12, tone: 1, folds: 0.85, sheen: 0.9 },
          seed: 22,
        })
        if (!api) return
        if (!active) {
          api.destroy()
          return
        }
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduced) api.pause()
        const freeze = window.setTimeout(() => api.pause(), 3600)
        releaseEffect = () => {
          window.clearTimeout(freeze)
          api.destroy()
        }
      })
      .catch(() => {})
    void kit('moments/moments.js')
      .then(async (moments) => {
        if (!active) return
        const api = await moments.mount(section)
        if (!active) {
          api?.destroy?.()
          return
        }
        releaseMoment = () => api?.destroy?.()
      })
      .catch(() => {})
    void kit('motion/motion.js')
      .then((motion) => {
        if (active) motion.refresh()
      })
      .catch(() => {})
    return () => {
      active = false
      releaseEffect?.()
      releaseMoment?.()
    }
  }, [])
  return (
    <>
      <section ref={hero} className="study-hero hero hero--centred" data-enter="" aria-labelledby="hero-h">
        <div className="optical-ground hero__bg" aria-hidden="true" data-fx="silk-folds" />
        <div className="wrap hero-layout">
          <div className="hero-text">
            <div className="course-line">Hack4Good · 技术向善</div>
            <h1 id="hero-h">
              让网页的障碍，
              <br />
              <em>看得见、改得掉。</em>
            </h1>
            <p>低视力用户能看清集合地点吗？只用键盘能报名吗？在摄影社报名页动手修，再到图书馆预约页试一遍。</p>
            <div className="hero-actions">
              <a href={ROUTE_HASH.diagnosis} className="btn lead-action text-base font-bold">
                开始校园初诊 <ArrowRight size={18} aria-hidden="true" />
              </a>
              <a href="#experiments" className="btn browse-action text-sm">
                浏览专项实验
              </a>
            </div>
          </div>
          <div className="hero__window" data-visual="" data-enter-media="">
            <ContrastConsole />
          </div>
        </div>
      </section>
      <section
        ref={experiments}
        className="lab-selection section"
        id="experiments"
        data-moment="letters-assemble"
        data-moment-opts='{"spread":0.45}'
        aria-labelledby="experiments-heading"
      >
        <div className="wrap">
          <h2 id="experiments-heading" className="mo-la__type">
            三个实验方向
          </h2>
          <ul className="lab-trio">
            {EXPERIMENTS.map((experiment) => (
              <li key={experiment.href}>
                <ExperimentCard {...experiment} />
              </li>
            ))}
          </ul>
          <details className="study-details mt-8">
            <summary>课堂示例 · 配色只差一点，判定会变吗？</summary>
            <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div className="space-y-4">
                {FIX_CASES.map((item) => (
                  <div key={item.label} className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">{item.label}</p>
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
          </details>
          {/* 轻量入口：报告不是第四个实验，而是把上面三个实验本次会话的真实结果汇总起来 */}
          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-slate-700">
            已经做过练习？
            <a href={ROUTE_HASH.report} className="btn report-action">
              统一成果报告
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </p>
        </div>
      </section>
    </>
  )
}
