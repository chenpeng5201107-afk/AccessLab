import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Check,
  CircleAlert,
  CircleCheckBig,
  Copy,
  Eye,
  Info,
  Keyboard,
  RotateCcw,
  WandSparkles,
} from 'lucide-react'

import { ROUTE_HASH } from '../hooks/useHashRoute'
import { useExperimentLedger } from '../context/ExperimentLedgerContext'
import { contrastRatioFromHex, formatContrastRatio } from '../lib/contrast'
import { deriveKeyboardRecord } from '../lib/experimentLedger'
import { auditKeyboardFocusDemo, ISSUE_TEXT, type KeyboardFocusAuditReport } from '../lib/keyboardFocusAudit'
import {
  BASE_CLASS,
  BROKEN_CLASS,
  BROKEN_FOCUS_CSS,
  CONFIRM_DISABLED_REASON,
  DEMO_BUTTONS,
  DEMO_RECORDS,
  DEMO_STYLE_SHEET,
  FIXED_CLASS,
  FIXED_FOCUS_CSS,
  FOCUS_RING_COLOR,
  NON_TEXT_MIN_CONTRAST_RATIO,
  OBSERVATION_STATEMENT,
  PREVIEW_FIXED_CLASS,
  STAGE_META,
  activeFocusCss,
  canConfirmObservation,
  confirmBlockReason,
  currentRecord,
  demoButtonClassName,
  demoWorkflowReducer,
  emptySightingCounts,
  focusCssLines,
  initialDemoWorkflowState,
  phaseOfMode,
  recordById,
  recordKeyboardSighting,
  resolveStage,
  sightingTotal,
  startAfterPhase,
  type DemoWorkflowEvent,
  type FocusMode,
  type SightingCounts,
} from '../lib/keyboardFocusDemo'

const DEMO_REGION_NOTICE =
  '本区域是一组故意存在无障碍问题的教学组件：只有这里的按钮缺少焦点指示，AccessLab 自身的导航与操作按钮不受影响。'

/** 焦点轮廓会压在这些背景上，数值由 Day 1/2 那套 WCAG 2.2 相对亮度算法实时算出 */
const RING_BACKGROUNDS = [
  { name: '示例卡片白底', hex: '#ffffff' },
  { name: '页面浅灰底', hex: '#f8fafc' },
  { name: '实验区淡靛蓝底', hex: '#eef2ff' },
] as const

function StageBadge({ stage }: { stage: keyof typeof STAGE_META }) {
  const meta = STAGE_META[stage]
  const toneClass = {
    neutral: 'bg-slate-100 text-slate-800 ring-slate-500/30',
    warn: 'bg-amber-50 text-amber-900 ring-amber-700/30',
    info: 'bg-indigo-50 text-indigo-900 ring-indigo-700/30',
    done: 'bg-emerald-50 text-emerald-900 ring-emerald-700/30',
  }[meta.tone]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${toneClass}`}
    >
      {meta.tone === 'done' ? (
        <CircleCheckBig className="size-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <Eye className="size-3.5 shrink-0" aria-hidden="true" />
      )}
      {meta.label}
    </span>
  )
}

function RuleCode({ text }: { text: string }) {
  return (
    <pre className="min-w-0 overflow-x-auto rounded-xl bg-slate-900 px-4 py-3 text-xs leading-relaxed">
      <code>
        {text.split('\n').map((line, index) => (
          <span key={index} className="block text-slate-100">
            {line === '' ? ' ' : line}
          </span>
        ))}
      </code>
    </pre>
  )
}

export function KeyboardFocusLabPage() {
  const pageRef = useRef<HTMLDivElement>(null)
  const { ledger, dispatch } = useExperimentLedger()
  const ledgerSyncedRef = useRef(false)
  const [mode, setMode] = useState<FocusMode>('broken')
  const [confirmed, setConfirmed] = useState(false)
  /** 修复前 / 修复后各一轮，互不借用：应用修复时保留 before、把 after 从零开始 */
  const [sightings, setSightings] = useState<SightingCounts>(emptySightingCounts)
  const [report, setReport] = useState<KeyboardFocusAuditReport | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [workflow, setWorkflow] = useState(initialDemoWorkflowState)
  /** 只有键盘导航产生的焦点才计数；用鼠标点按钮同样会移动焦点，但那不是本实验要记录的东西 */
  const keyboardNavRef = useRef(false)

  useEffect(() => {
    const markKeyboard = (event: KeyboardEvent) => {
      // Tab 与 Shift+Tab（key 同为 Tab）才是「移动焦点」的按键；Enter / Space 只是按下已聚焦的按钮
      if (event.key === 'Tab') {
        keyboardNavRef.current = true
      }
    }
    const markPointer = () => {
      keyboardNavRef.current = false
    }
    window.addEventListener('keydown', markKeyboard, true)
    window.addEventListener('pointerdown', markPointer, true)
    return () => {
      window.removeEventListener('keydown', markKeyboard, true)
      window.removeEventListener('pointerdown', markPointer, true)
    }
  }, [])

  // 结论来自已经渲染出来的真实 DOM：按钮身上挂的是哪个类、注入的样式表里写了什么
  useEffect(() => {
    setReport(auditKeyboardFocusDemo(pageRef.current))
  }, [mode])

  const beforeSightings = sightingTotal(sightings.before)
  const afterSightings = sightingTotal(sightings.after)
  const observation = { mode, beforeSightings, afterSightings }
  const stage = resolveStage({ ...observation, confirmed })
  const canConfirm = canConfirmObservation(observation)
  const blockReason = confirmBlockReason(observation) ?? CONFIRM_DISABLED_REASON
  const record = currentRecord(workflow.savedIds.length)

  /**
   * 会话台账按「规则检测 / 是否应用修复 / 两轮键盘记录 / 是否人工确认」分别登记，
   * 报告页只是把它们并列展示，不会把其中任何一步说成「WCAG 已通过」。
   *
   * 首次「有效」同步要等真实 DOM 检测回来：把它算在挂载那一刻，切回本页时
   * 迟到的检测会把已有记录覆盖成刚进门的空白状态。
   */
  useEffect(() => {
    if (report === null) return
    const isFirstSync = !ledgerSyncedRef.current
    ledgerSyncedRef.current = true
    if (isFirstSync && ledger.keyboard !== null) return

    dispatch({
      type: 'keyboard:sync',
      record: deriveKeyboardRecord({
        mode,
        beforeSightings,
        afterSightings,
        confirmed,
        report,
        beforeCss: BROKEN_FOCUS_CSS,
        afterCss: FIXED_FOCUS_CSS,
      }),
    })
  }, [afterSightings, beforeSightings, confirmed, dispatch, ledger.keyboard, mode, report])
  const nextIndexIsLast = workflow.savedIds.length >= DEMO_RECORDS.length

  const handleFocus = useCallback(
    (id: string) => {
      if (!keyboardNavRef.current) return
      const phase = phaseOfMode(mode)
      setSightings((current) => recordKeyboardSighting(current, phase, id))
    },
    [mode],
  )

  const applyWorkflow = useCallback(
    (event: DemoWorkflowEvent) => {
      const next = demoWorkflowReducer(workflow, event)
      setWorkflow(next)
      setNotice(next.lastMessage)
    },
    [workflow],
  )

  const handleRepair = () => {
    if (mode === 'repaired') return
    setMode('repaired')
    setConfirmed(false)
    // 修复前的那一轮观察必须留住：它是「前后对比」的另一半
    setSightings((current) => startAfterPhase(current))
    setNotice(
      '已把示例按钮换成带 outline 的 :focus-visible 规则。现在请再按 Tab 走一遍同样三个按钮，自己确认焦点是否看得见。',
    )
  }

  const handleReset = () => {
    setMode('broken')
    setConfirmed(false)
    setSightings(emptySightingCounts())
    setWorkflow(initialDemoWorkflowState)
    setNotice('实验已重置：示例按钮又回到「键盘能走到、但看不出焦点在哪」的初始状态，前后两轮观察记录一并清零。')
  }

  const handleReaudit = useCallback(() => {
    const next = auditKeyboardFocusDemo(pageRef.current)
    setReport(next)
    const verdict =
      next.mode === 'repaired'
        ? '当前挂的是带实心轮廓的规则'
        : next.mode === 'broken'
          ? '当前挂的是 outline: none 的规则，焦点位置只能靠猜'
          : '没能从真实 DOM 里认出规则状态'
    setNotice(
      `已按真实 DOM 重新读取：${next.buttonCount} 个示例按钮（键盘可走到 ${next.keyboardReachableCount} 个），${verdict}，规则问题 ${next.issueCount} 项。`,
    )
  }, [])

  const handleConfirm = () => {
    if (!canConfirm) return
    setConfirmed(true)
    setNotice(OBSERVATION_STATEMENT)
  }

  const handleCopy = async () => {
    if (!navigator.clipboard?.writeText) {
      setNotice('当前浏览器不支持自动复制，请手动选中右侧「修复后」CSS 复制。')
      return
    }
    try {
      await navigator.clipboard.writeText(FIXED_FOCUS_CSS)
      setNotice('已复制修复后的 CSS（与上方「修复后」代码块逐字一致）。')
    } catch {
      setNotice('复制失败，请手动选中右侧「修复后」CSS 复制。')
    }
  }

  return (
    <div ref={pageRef} className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      {/* 实验用样式：只命中 kf-demo-btn 这组类名，平台外壳的全局 :focus-visible 不受影响。
          这个 data 属性必须与 keyboardFocusDemo 里的 DEMO_STYLE_ATTR 一致，检测器靠它找回样式表；
          页面测试用 stylesheetFound === true 来钉住这一对。 */}
      <style data-keyboard-focus-demo="true">{DEMO_STYLE_SHEET}</style>

      <a
        href={ROUTE_HASH.home}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-800 underline decoration-indigo-400 decoration-2 underline-offset-4 hover:decoration-indigo-800"
      >
        返回首页
      </a>

      <header className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">键盘焦点实验</h1>
        <p className="mt-3 text-lg font-semibold text-indigo-800">
          不使用鼠标，你还能找到自己正在操作的位置吗？
        </p>
        <p className="mt-3 text-base leading-relaxed text-slate-700">
          键盘用户只能靠屏幕上的焦点轮廓判断「我现在在哪」。这组按钮看起来完全正常，
          Tab 也走得动，唯一被偷偷拿走的恰恰是那条轮廓线。
        </p>
      </header>

      <section
        aria-labelledby="kf-intro-heading"
        className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 id="kf-intro-heading" className="text-lg font-semibold tracking-tight text-slate-900">
          1. 焦点可见为什么是一条硬要求
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
          <li>
            <strong className="text-slate-900">SC 2.1.1 Keyboard</strong>
            ：所有功能都能只用键盘完成。下面的三个按钮本来就是原生
            <span className="font-mono text-indigo-900">button</span>
            ，所以「走得到」这一条并不成问题。
          </li>
          <li>
            <strong className="text-slate-900">SC 2.4.7 Focus Visible</strong>
            ：键盘焦点必须有可见指示。本页的缺陷正是这一条——焦点到达了，却看不出来。
          </li>
          <li>
            <strong className="text-slate-900">SC 2.4.11 Focus Not Obscured (Minimum)</strong>
            ：焦点指示不能别的东西完全盖住。因此实验区刻意不使用
            <span className="font-mono text-indigo-900">overflow: hidden</span>
            ，按钮之间也留出比轮廓外扩范围更大的间距。
          </li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          这是一次交互体验与人工验证教学，不是自动认证工具：程序只能告诉你「哪条规则挂在按钮上」，
          不能替你确认屏幕上真的看得见。
        </p>
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <section
          aria-labelledby="kf-demo-heading"
          className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 id="kf-demo-heading" className="text-lg font-semibold tracking-tight text-slate-900">
            2. 请先别用鼠标
          </h2>
          <p className="mt-2 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-semibold leading-relaxed text-indigo-900">
            请先不要使用鼠标。按 Tab 键依次移动焦点，尝试判断你现在选中了哪个按钮。
          </p>
          <p className="mt-2 text-xs leading-relaxed text-amber-900">{DEMO_REGION_NOTICE}</p>

          <div className="mt-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
              教学示例 · 故意缺少焦点指示
            </p>

            <div className="mt-3 rounded-lg bg-white p-4">
              <div className="flex flex-wrap gap-4">
                {DEMO_BUTTONS.map((button) => (
                  <button
                    key={button.id}
                    id={button.id}
                    type="button"
                    className={demoButtonClassName(mode)}
                    aria-expanded={button.id === 'kf-view-details' ? workflow.detailsOpen : undefined}
                    aria-controls={button.id === 'kf-view-details' ? 'kf-details' : undefined}
                    onFocus={() => handleFocus(button.id)}
                    onClick={() =>
                      applyWorkflow(
                        button.id === 'kf-view-details'
                          ? { type: 'toggle-details' }
                          : button.id === 'kf-save-selection'
                            ? { type: 'save-current' }
                            : { type: 'step-back' },
                      )
                    }
                  >
                    {button.label}
                  </button>
                ))}
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                这三个按钮都有真实作用：{DEMO_BUTTONS.map((b) => `${b.label}—${b.actionHint}`).join('；')}。
                它们也是整个演示里唯一被去掉焦点轮廓的控件。
              </p>

              <div id="kf-details" hidden={!workflow.detailsOpen} className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">当前候选记录</h3>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex flex-wrap justify-between gap-x-3">
                    <dt className="text-slate-600">题名</dt>
                    <dd className="font-semibold text-slate-900">{record.title}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-3">
                    <dt className="text-slate-600">馆藏位置</dt>
                    <dd className="text-slate-900">{record.shelf}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-3">
                    <dt className="text-slate-600">应归还</dt>
                    <dd className="font-mono text-slate-900">{record.due}</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  已保存列表（{workflow.savedIds.length} / {DEMO_RECORDS.length}）
                </h3>
                {workflow.savedIds.length === 0 ? (
                  <p className="mt-1 text-sm text-slate-600">
                    还没有保存任何记录。按「保存选择」试试，注意列表和上面的计数都会真的变化。
                  </p>
                ) : (
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {workflow.savedIds.map((id, index) => {
                      const saved = recordById(id)
                      return (
                        <li key={id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                          <span className="font-mono text-xs text-slate-500">{index + 1}.</span>{' '}
                          <span className="font-semibold text-slate-900">{saved?.title}</span>
                          <span className="text-slate-600"> · {saved?.shelf}</span>
                        </li>
                      )
                    })}
                  </ul>
                )}
                {nextIndexIsLast ? (
                  <p className="mt-2 text-xs font-semibold text-amber-900">
                    三条示例记录都已保存完毕，可以再按「返回上一步」撤回一条重来。
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-slate-600">
            演示数据只存在于这个页面：不提交、不发请求、不写入任何存储，刷新即恢复。
            按 Tab 走完三个按钮后继续按，焦点会离开本区域进入页面其它控件——这里没有焦点陷阱。
          </p>
        </section>

        <section
          aria-labelledby="kf-audit-heading"
          className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="kf-audit-heading" className="text-lg font-semibold tracking-tight text-slate-900">
              3. 焦点规则现状与修复
            </h2>
            <button
              type="button"
              onClick={handleReaudit}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-indigo-700 hover:bg-indigo-50 hover:text-indigo-900"
            >
              <Info className="size-4" aria-hidden="true" />
              重新读取真实 DOM
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StageBadge stage={stage} />
            <span className="text-xs text-slate-600">{STAGE_META[stage].detail}</span>
          </div>

          {report === null ? (
            <p className="mt-4 text-sm text-slate-600">正在读取浏览器中的真实 DOM…</p>
          ) : (
            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <dt className="text-slate-600">实验区内可键盘聚焦的真实按钮</dt>
                <dd className="font-semibold text-slate-900">
                  {report.keyboardReachableCount} / {report.buttonCount} 个
                </dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <dt className="text-slate-600">按钮身上实际挂的类名</dt>
                <dd className="font-mono text-xs text-slate-900">
                  {report.rows.map((row) => row.variant).join(' · ') || '（未读到）'}
                </dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <dt className="text-slate-600">这条规则有没有把轮廓去掉</dt>
                <dd className="font-semibold text-slate-900">
                  {report.indicatorSuppressed ? '有：outline: none' : '没有：规则里带实心轮廓'}
                </dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <dt className="text-slate-600">修复前：键盘导航到达示例按钮的次数</dt>
                <dd className="font-semibold text-slate-900">{beforeSightings} 次</dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <dt className="text-slate-600">修复后：键盘导航到达示例按钮的次数</dt>
                <dd className="font-semibold text-slate-900">{afterSightings} 次</dd>
              </div>
            </dl>
          )}

          {report !== null && report.issueCount > 0 ? (
            <ul className="mt-4 space-y-2">
              {report.issueCodes.map((code) => (
                <li key={code} className="rounded-xl bg-red-50 px-3 py-2 ring-1 ring-inset ring-red-700/30">
                  <p className="flex items-start gap-2 text-sm font-medium text-red-900">
                    <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>{ISSUE_TEXT[code].message}</span>
                  </p>
                  <p className="mt-1 pl-6 text-xs text-red-800">对应规范：{ISSUE_TEXT[code].standardHint}</p>
                </li>
              ))}
            </ul>
          ) : null}

          {report !== null && report.issueCount === 0 && report.mode === 'repaired' ? (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900 ring-1 ring-inset ring-emerald-700/30">
              <CircleCheckBig className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                规则文本里能找到实心轮廓，没有读到「焦点被压掉」的问题。这仍然只说明规则如此——
                你到底看不看得见，得由你自己的眼睛说了算。
              </span>
            </p>
          ) : null}

          <div className="mt-4">
            <h3 className="text-sm font-semibold text-slate-900">当前挂在按钮上的焦点规则</h3>
            <RuleCode text={activeFocusCss(mode)} />
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              这段文本就是本页样式表里正在生效的那一条，会随上方样式状态一起切换。
            </p>
          </div>

          <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-700">
            上表读的是真实节点，但它只证明「哪条规则挂在按钮上」。焦点轮廓在你的屏幕上是否真的看得见、
            Tab 顺序合不合预期，都必须由你在上方实验区用键盘亲自确认，程序不代替这个结论。
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {mode === 'repaired' ? (
              <p className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 ring-1 ring-inset ring-emerald-700/30">
                <CircleCheckBig className="size-5 shrink-0" aria-hidden="true" />
                已应用焦点修复（按钮当前挂 <span className="font-mono">.{FIXED_CLASS}</span>）
              </p>
            ) : (
              <button
                type="button"
                onClick={handleRepair}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-800"
              >
                <WandSparkles className="size-4" aria-hidden="true" />
                修复焦点指示
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-indigo-700 hover:bg-indigo-50 hover:text-indigo-900"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              重置实验
            </button>
          </div>

          {notice ? (
            <p
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800"
            >
              {notice}
            </p>
          ) : null}
        </section>
      </div>

      <section
        aria-labelledby="kf-compare-heading"
        className="mt-6 min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 id="kf-compare-heading" className="text-lg font-semibold tracking-tight text-slate-900">
          4. 修复前后对比
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          上方实验区始终是同一组真实按钮，这里只是把两种样式状态并排画出来便于观察。
          下面的示意卡片不是按钮：不能聚焦，也不进入 Tab 顺序。
        </p>

        <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
          {[
            { fixed: false, title: '修复前：焦点位置难以识别', variant: BROKEN_CLASS },
            { fixed: true, title: '修复后：焦点位置清晰可见', variant: FIXED_CLASS },
          ].map((column) => {
            // 当前是哪一版，以真实 DOM 读出的样式状态为准；还没读到就直接说明
            const currentIsFixed = report === null ? mode === 'repaired' : report.mode === 'repaired'
            const isCurrent = currentIsFixed === column.fixed
            const ringRatio = column.fixed ? contrastRatioFromHex(FOCUS_RING_COLOR, '#ffffff') : null

            return (
              <div key={column.title} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">{column.title}</h3>
                <p className="mt-1.5 text-xs text-slate-600">
                  {column.fixed
                    ? '同一个按钮，焦点到达时多了一圈 3px 实心轮廓。'
                    : '键盘焦点仍在，但屏幕上没有任何痕迹。'}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
                  {DEMO_BUTTONS.map((button) => (
                    <span
                      key={button.id}
                      aria-hidden="true"
                      className={column.fixed ? `${BASE_CLASS} ${PREVIEW_FIXED_CLASS}` : BASE_CLASS}
                    >
                      {button.label}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">静态示意图 · 不能聚焦 · 不参与 Tab 顺序</p>

                <dl className="mt-3 space-y-1 text-xs">
                  <div className="flex flex-wrap justify-between gap-x-3">
                    <dt className="text-slate-600">按钮类名</dt>
                    <dd className="font-mono text-slate-900">{column.variant}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-3">
                    <dt className="text-slate-600">焦点轮廓</dt>
                    <dd className="font-semibold text-slate-900">
                      {column.fixed ? `3px 实心 ${FOCUS_RING_COLOR}` : '无（outline: none）'}
                    </dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-3">
                    <dt className="text-slate-600">轮廓与卡片白底对比度</dt>
                    <dd className="font-mono font-semibold tabular-nums text-slate-900">
                      {ringRatio === null
                        ? '—（没有轮廓可测）'
                        : `${formatContrastRatio(ringRatio)} · 阈值 ${NON_TEXT_MIN_CONTRAST_RATIO}:1`}
                    </dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-3">
                    <dt className="text-slate-600">与当前实验区的对应关系</dt>
                    <dd className="font-semibold text-slate-900">
                      {isCurrent ? '就是上方现在使用的这一版' : '尚未应用到上方实验区'}
                    </dd>
                  </div>
                </dl>
              </div>
            )
          })}
        </div>

        <h3 className="mt-6 text-sm font-semibold text-slate-900">轮廓颜色在各处背景上的实测反差</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          数值用和色彩对比度实验完全相同的 WCAG 2.2 相对亮度算法算出，对照的是 SC 1.4.11 对非文本元素的 3:1 要求。
          达标只是「有希望看见」，最终仍以人眼判断为准。
        </p>
        <ul className="mt-3 grid min-w-0 gap-3 sm:grid-cols-3">
          {RING_BACKGROUNDS.map((background) => {
            const ratio = contrastRatioFromHex(FOCUS_RING_COLOR, background.hex)
            const passes = ratio !== null && ratio >= NON_TEXT_MIN_CONTRAST_RATIO
            return (
              <li key={background.hex} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-700">{background.name}</p>
                <p
                  className="mt-2 grid place-items-center rounded-lg py-5 text-xs font-semibold text-slate-900"
                  style={{ backgroundColor: background.hex }}
                >
                  {/* 用的是第 4 节同一条真实规则，不是这里另画一遍 outline */}
                  <span className={`${BASE_CLASS} ${PREVIEW_FIXED_CLASS}`} aria-hidden="true">
                    焦点轮廓示意
                  </span>
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs">
                  <span className="font-mono font-semibold tabular-nums text-slate-900">
                    {ratio === null ? '—' : formatContrastRatio(ratio)}
                  </span>
                  <span className={passes ? 'font-semibold text-emerald-900' : 'font-semibold text-red-900'}>
                    {passes ? '达到 3:1' : '未达 3:1'}
                  </span>
                  <span className="font-mono text-slate-500">{background.hex}</span>
                </p>
              </li>
            )
          })}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-slate-600">
          补充一条真实存在的坑：如果按钮本身就填充了和轮廓相同的颜色，单色轮廓贴着同色填充会掉到 1:1，
          这时要改用双层描边（浅色 outline + 深色 outline-offset 间隙），而不是换个 hover 色。
        </p>
      </section>

      <section
        aria-labelledby="kf-verify-heading"
        className="mt-6 min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 id="kf-verify-heading" className="text-lg font-semibold tracking-tight text-slate-900">
          5. 人工验证与代码复制
        </h2>

        <ol className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
          {[
            {
              step: '进入实验，先按 Tab 体验原始按钮',
              auto: beforeSightings > 0,
              hint: `修复前键盘到达 ${beforeSightings} 次`,
            },
            { step: '尝试判断当前焦点所在位置', auto: false, hint: '只有你自己能回答「看不看得见」' },
            { step: '点击「修复焦点指示」', auto: mode === 'repaired', hint: '样式状态已切换到修复态' },
            {
              step: '再次使用 Tab 操作相同按钮',
              auto: mode === 'repaired' && afterSightings > 0,
              hint: mode === 'repaired' ? `修复后键盘到达 ${afterSightings} 次` : '先应用修复，再重新走一轮',
            },
            { step: '根据实际体验选择「我已完成观察」', auto: confirmed, hint: '确认动作本身由你完成' },
          ].map((item, index) => (
            <li key={item.step} className="flex flex-wrap items-start gap-2">
              <span className="font-mono text-xs text-slate-500">{index + 1}.</span>
              <span className="grow">{item.step}</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                  item.auto
                    ? 'bg-emerald-50 text-emerald-900 ring-emerald-700/30'
                    : 'bg-slate-100 text-slate-700 ring-slate-500/30'
                }`}
              >
                {item.auto ? (
                  <Check className="size-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
                )}
                {item.auto ? '有客观记录' : '待人工确认'} · {item.hint}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            aria-disabled={!canConfirm}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-700"
          >
            <Keyboard className="size-4" aria-hidden="true" />
            我已完成观察
          </button>
          {confirmed ? (
            <p className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 ring-1 ring-inset ring-emerald-700/30">
              <CircleCheckBig className="size-5 shrink-0" aria-hidden="true" />
              已记录你的观察确认
            </p>
          ) : (
            <p className="text-xs leading-relaxed text-slate-600">{blockReason}</p>
          )}
        </div>

        {confirmed ? (
          <p className="mt-4 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-semibold leading-relaxed text-indigo-900 ring-1 ring-inset ring-indigo-700/30">
            {OBSERVATION_STATEMENT}
          </p>
        ) : null}

        <p className="mt-5 text-sm leading-relaxed text-slate-700">
          <strong className="text-slate-900">可见焦点 ≠ 键盘无障碍全部达标。</strong>
          焦点看得见只解决 SC 2.4.7；能不能走到（2.1.1）、有没有焦点陷阱（2.1.2）、
          顺序是否说得通（2.4.3）、自定义控件有没有正确的角色与状态，都是各自独立的要求。
        </p>
      </section>

      <section
        aria-labelledby="kf-code-heading"
        className="mt-6 min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 id="kf-code-heading" className="text-lg font-semibold tracking-tight text-slate-900">
          6. 修复前后 CSS 对比
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          下面两段不是手写的示意图：它们和页面里那张真正生效的样式表逐字同源，
          高亮行就是修复真正改动的地方。
        </p>

        <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
          {[
            { title: '修复前（缺陷示例）', fixed: false },
            { title: '修复后（清晰焦点轮廓）', fixed: true },
          ].map((column) => {
            const lines = focusCssLines(column.fixed)
            // 「与当前生效规则一致」以真实 DOM 读出的样式状态为准，而不是 React 里的标志位
            const appliedMode = report === null ? mode : report.mode
            const isCurrent = appliedMode === (column.fixed ? 'repaired' : 'broken')

            return (
              <div key={column.title} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">{column.title}</h3>
                {isCurrent ? (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-900">
                    <Check className="size-3.5 shrink-0" aria-hidden="true" />
                    与当前生效的规则一致
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-slate-600">
                    {column.fixed
                      ? '尚未应用到上方实验区，可复制后用于自己的项目。'
                      : '上方实验区当前用的就是这一版。'}
                  </p>
                )}
                <pre className="mt-3 min-w-0 overflow-x-auto rounded-xl bg-slate-900 px-4 py-3 text-xs leading-relaxed">
                  <code>
                    {lines.map((line, index) => (
                      <span
                        key={`${column.title}-${index}`}
                        className={line.changed ? 'block bg-indigo-500/25 text-white' : 'block text-slate-100'}
                      >
                        {line.text === '' ? ' ' : line.text}
                      </span>
                    ))}
                  </code>
                </pre>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-indigo-700 hover:text-indigo-900"
        >
          <Copy className="size-4" aria-hidden="true" />
          复制修复后的 CSS
        </button>

        <details className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-2">
          <summary className="cursor-pointer rounded-lg px-2 py-3 text-sm font-semibold text-indigo-800">
            展开查看：本页实验区实际注入的完整样式表
          </summary>
          <RuleCode text={DEMO_STYLE_SHEET} />
          <p className="mt-2 px-2 text-xs leading-relaxed text-slate-600">
            上面两块代码是这段文本的逐字片段。样式只命中 <span className="font-mono">{BASE_CLASS}</span>{' '}
            这组类名，因此 AccessLab 其它控件仍然使用全局的焦点轮廓。
          </p>
        </details>
      </section>

      <section
        aria-labelledby="kf-scope-heading"
        className="mt-6 min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 id="kf-scope-heading" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
          <Info className="size-5 shrink-0 text-indigo-800" aria-hidden="true" />
          本实验检查什么、不检查什么
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          程序只做两件事：读示例按钮身上的真实类名，读本页注入样式表里对应的
          <span className="font-mono">:focus-visible</span> 规则。据此判断
          <span className="font-mono">.{BROKEN_CLASS}</span> 是否在用
          <span className="font-mono">outline: none</span> 压制焦点、
          <span className="font-mono">.{FIXED_CLASS}</span> 是否定义了实心轮廓。
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-900">
          全部通过也只说明这一组按钮的焦点规则被换成了实心轮廓，不代表整站符合 WCAG 2.2。
        </p>
        <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-slate-700">
          <li>不读取级联计算结果：最终哪条规则赢、轮廓画在屏幕哪个位置，需要真实浏览器与 DevTools。</li>
          <li>不判断焦点顺序是否符合阅读顺序（SC 2.4.3），也不判断任务是否被打断（SC 2.4.10）。</li>
          <li>不检测焦点陷阱（SC 2.1.2）：本页靠「Tab 能走出实验区」由你亲自验证。</li>
          <li>不判断焦点指示的面积是否达到 SC 2.4.13 Focus Appearance 的要求。</li>
          <li>不涉及屏幕阅读器实际朗读，也不做自动修复你项目代码的承诺。</li>
        </ul>
      </section>

      <section
        aria-labelledby="kf-report-heading"
        className="mt-6 min-w-0 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5"
      >
        <h2 id="kf-report-heading" className="text-lg font-semibold tracking-tight text-slate-900">
          下一步：查看统一成果报告
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          这一页把你刚才真实做完的每一步都登记了下来：规则检测、是否应用修复、修复前后两轮键盘记录，
          以及你自己的确认。报告会把三个实验的结果放在一起，并列出仍然需要人工验证的项目。
        </p>
        <a
          href={ROUTE_HASH.report}
          className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white no-underline transition-colors hover:bg-indigo-800"
        >
          查看统一成果报告
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      </section>
    </div>
  )
}
