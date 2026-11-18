import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import {
  Check,
  CircleAlert,
  CircleCheckBig,
  Copy,
  Info,
  RotateCcw,
  Undo2,
  WandSparkles,
} from 'lucide-react'

import { ColorControl } from '../components/ColorControl'
import { NextStepCard } from '../components/NextStepCard'
import { useExperimentLedger } from '../context/ExperimentLedgerContext'
import { ROUTE_HASH } from '../hooks/useHashRoute'
import {
  AA_NORMAL_TEXT_RATIO,
  contrastRatioFromHex,
  formatContrastRatio,
  meetsAaNormalText,
} from '../lib/contrast'
import { buildAfterCss, buildRepairCss } from '../lib/colorRepair'
import { deriveContrastRecord, type ContrastStage } from '../lib/experimentLedger'
import { initialRepairState, repairReducer } from '../lib/repairWorkflow'

const DEFAULT_TEXT_COLOR = '#777777'
const DEFAULT_BACKGROUND_COLOR = '#ffffff'

/** 输入框里的值非法时，预览与检测用的仍是上一次有效配色，必须说清楚，不能让绿灯看起来像新配色的结论 */
const STALE_RESULT_NOTICE = '当前颜色输入无效，检测结果仍基于上一次有效配色。'

/** 修复前后对比区使用的同一句示例文字：两侧只有文字颜色不同 */
const SAMPLE_TEXT = '图书馆提醒：你有一本《WCAG 实战》已逾期，请尽快归还。'

function AaBadge({ textColor, backgroundColor }: { textColor: string; backgroundColor: string }) {
  const ratio = contrastRatioFromHex(textColor, backgroundColor)
  const passes = ratio !== null && meetsAaNormalText(ratio)
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-semibold ring-1 ring-inset ${
        passes ? 'bg-emerald-50 text-emerald-900 ring-emerald-700/30' : 'bg-red-50 text-red-900 ring-red-700/30'
      }`}
    >
      {passes ? (
        <CircleCheckBig className="size-4 shrink-0" aria-hidden="true" />
      ) : (
        <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
      )}
      <span className="font-mono tabular-nums">{ratio === null ? '—' : formatContrastRatio(ratio)}</span>
      <span>{passes ? '达到 AA' : '未达 AA'}</span>
    </span>
  )
}

/** 对比区里的一栏：同一句示例文字、同一背景，只有文字颜色随方案改变 */
function CompareColumn({
  heading,
  headingId,
  textColor,
  backgroundColor,
  sample,
}: {
  heading: string
  headingId: string
  textColor: string
  backgroundColor: string
  sample: string
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
      <h4 id={headingId} className="text-sm font-semibold text-slate-900">
        {heading}
      </h4>
      <div
        className="mt-3 rounded-lg border border-slate-300 p-4 text-sm leading-relaxed"
        style={{ backgroundColor, color: textColor }}
      >
        {sample}
      </div>
      <dl className="mt-3 space-y-1 text-xs text-slate-700">
        <div className="flex justify-between gap-2">
          <dt className="text-slate-600">文字颜色</dt>
          <dd className="font-mono uppercase">{textColor}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-600">背景颜色</dt>
          <dd className="font-mono uppercase">{backgroundColor}</dd>
        </div>
      </dl>
      <div className="mt-2">
        <AaBadge textColor={textColor} backgroundColor={backgroundColor} />
      </div>
    </div>
  )
}

export function ContrastLabPage() {
  const { ledger, dispatch } = useExperimentLedger()
  const [textColor, setTextColor] = useState(DEFAULT_TEXT_COLOR)
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND_COLOR)
  const [textValid, setTextValid] = useState(true)
  const [backgroundValid, setBackgroundValid] = useState(true)
  const [resetSignal, setResetSignal] = useState(0)
  const [repair, dispatchRepair] = useReducer(repairReducer, initialRepairState)
  /**
   * 反馈落在触发它的那一块旁边：修复类操作在第 4 节，复制在第 6 节。
   * 它和第 1 节的配色读数区各自播报各自的内容，不会把对方的句子挤掉。
   */
  const [notice, setNotice] = useState<{ area: 'repair' | 'css'; text: string } | null>(null)

  const ratio = contrastRatioFromHex(textColor, backgroundColor)
  const passes = ratio !== null && meetsAaNormalText(ratio)
  const hasInvalidInput = !textValid || !backgroundValid
  const isDefault =
    textColor === DEFAULT_TEXT_COLOR && backgroundColor === DEFAULT_BACKGROUND_COLOR

  // 手动改色 / 重置都会让旧修复结论过期：清建议、清快照，并清掉上一次的操作反馈
  const handleTextColorChange = (hex: string) => {
    setTextColor(hex)
    dispatchRepair({ type: 'color-changed' })
    setNotice(null)
  }
  const handleBackgroundColorChange = (hex: string) => {
    setBackgroundColor(hex)
    dispatchRepair({ type: 'color-changed' })
    setNotice(null)
  }

  const handleReset = () => {
    setTextColor(DEFAULT_TEXT_COLOR)
    setBackgroundColor(DEFAULT_BACKGROUND_COLOR)
    setResetSignal((signal) => signal + 1)
    dispatchRepair({ type: 'color-changed' })
    setNotice(null)
  }

  // 非法草稿不会走 onChange 提交，父组件收不到改色事件；所以有效性一旦翻成非法，
  // 这里要主动通知修复工作流清掉旧建议 / 快照，杜绝「修复已暂停」却仍展示过期结论。
  // 恢复合法时不重新生成：dispatch 只在非法时发生，旧建议不会自动复活，需用户手动再点。
  // 两个回调都用 useCallback 保持引用稳定，避免 ColorControl 里的 [invalid, onValidityChange] effect 每次渲染都重跑。
  const handleTextValidity = useCallback((isValid: boolean) => {
    setTextValid(isValid)
    if (!isValid) dispatchRepair({ type: 'color-changed' })
  }, [])
  const handleBackgroundValidity = useCallback((isValid: boolean) => {
    setBackgroundValid(isValid)
    if (!isValid) dispatchRepair({ type: 'color-changed' })
  }, [])

  const handleGenerate = () => {
    if (hasInvalidInput) return
    dispatchRepair({ type: 'generate', textColor, backgroundColor })
    setNotice(null)
  }

  const suggestion = repair.suggestion
  const canApply =
    repair.phase === 'suggested' && !hasInvalidInput && !!suggestion?.suggestedTextColor

  const handleApply = () => {
    if (!canApply || !suggestion?.suggestedTextColor) return
    setTextColor(suggestion.suggestedTextColor)
    dispatchRepair({ type: 'apply' })
    setNotice({
      area: 'repair',
      text: `已应用修复：文字颜色改为 ${suggestion.suggestedTextColor}，对比度提升至 ${formatContrastRatio(
        suggestion.afterRatio ?? 0,
      )}。背景颜色未改变。`,
    })
  }

  const handleUndo = () => {
    if (repair.phase !== 'applied' || !repair.snapshot) return
    setTextColor(repair.snapshot.beforeTextColor)
    dispatchRepair({ type: 'undo' })
    setNotice({
      area: 'repair',
      text: `已撤销本次修复，文字颜色恢复为 ${repair.snapshot.beforeTextColor}。`,
    })
  }

  // 对比区与 CSS 区的数据：已应用取快照，未应用取建议；背景两侧始终相同
  const snapshot = repair.snapshot
  const afterColor =
    repair.phase === 'applied'
      ? snapshot?.afterTextColor ?? null
      : suggestion?.suggestedTextColor ?? null
  const beforeColor =
    repair.phase === 'applied'
      ? snapshot?.beforeTextColor ?? null
      : suggestion?.originalTextColor ?? null
  const applied = repair.phase === 'applied'
  // 非法输入期间一律不出前后对比 / CSS / 复制：既靠上面的状态失效兜底，也在渲染处再挡一层，
  // 保证「修复已暂停」时绝不残留可操作的过期产物
  const showRepairOutput = !hasInvalidInput && afterColor !== null && beforeColor !== null

  const handleCopy = async () => {
    if (hasInvalidInput || !afterColor) return
    const css = buildAfterCss(afterColor, backgroundColor)
    if (!navigator.clipboard?.writeText) {
      setNotice({
        area: 'css',
        text: '当前浏览器不支持自动复制，请手动选中上方 CSS 代码复制。',
      })
      return
    }
    try {
      await navigator.clipboard.writeText(css)
      setNotice({ area: 'css', text: '已复制修复后的 CSS 代码。' })
    } catch {
      setNotice({ area: 'css', text: '复制失败，请手动选中上方 CSS 代码复制。' })
    }
  }

  const cssPreview =
    showRepairOutput && afterColor && beforeColor
      ? buildRepairCss({
          beforeTextColor: beforeColor,
          beforeBackgroundColor: backgroundColor,
          afterTextColor: afterColor,
          afterBackgroundColor: backgroundColor,
          applied,
        })
      : null

  const ledgerSyncedRef = useRef(false)
  const repairStage: ContrastStage =
    repair.phase === 'applied' ? 'applied' : repair.phase === 'suggested' ? 'suggested' : 'audited'

  /**
   * 把这一轮真实算出来的结果登记进会话台账（报告页只读台账，不重新检测）。
   * 首次挂载只在台账为空时写入：做完实验切走再回来不会把成果清零；
   * 之后的改色 / 生成 / 应用 / 撤销 / 重置都会如实覆盖，不留下过期的「已通过」。
   */
  useEffect(() => {
    const isFirstSync = !ledgerSyncedRef.current
    ledgerSyncedRef.current = true
    if (isFirstSync && ledger.contrast !== null) return

    dispatch({
      type: 'contrast:sync',
      record: deriveContrastRecord({
        textColor,
        backgroundColor,
        hasInvalidInput,
        stage: repairStage,
        repairApplied: applied,
        beforeTextColor: showRepairOutput ? beforeColor : null,
        afterTextColor: showRepairOutput ? afterColor : null,
        css: cssPreview,
      }),
    })
  }, [
    applied,
    beforeColor,
    afterColor,
    backgroundColor,
    cssPreview,
    dispatch,
    hasInvalidInput,
    ledger.contrast,
    repairStage,
    showRepairOutput,
    textColor,
  ])


  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <a
        href={ROUTE_HASH.home}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-800 underline decoration-indigo-400 decoration-2 underline-offset-4 hover:decoration-indigo-800"
      >
        返回首页
      </a>

      <header className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          色彩对比度实验
        </h1>
        <ol className="mt-4 space-y-2 text-base leading-relaxed text-slate-700">
          <li>
            <strong className="font-semibold text-slate-900">你会遇到什么：</strong>
            默认配色 <span className="font-mono text-sm">#777777</span> /{' '}
            <span className="font-mono text-sm">#FFFFFF</span>{' '}
            看着挺清爽，反差其实不够——典型的「看起来还行、实际不合格」。
          </li>
          <li>
            <strong className="font-semibold text-slate-900">你要做什么：</strong>
            改下面两个颜色，盯着实时比值跨过 4.5:1；改不出来就让算法给建议，再一键应用。
          </li>
          <li>
            <strong className="font-semibold text-slate-900">修好能看到什么：</strong>
            同一句示例文字的修复前后对比，加一段可以直接复制走的 CSS。
          </li>
        </ol>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          对比度数值由 WCAG 2.2 的相对亮度算法现场计算，本页每一处结论都是实时算出来的。
        </p>
      </header>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <section
          aria-labelledby="controls-heading"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 id="controls-heading" className="text-lg font-semibold tracking-tight text-slate-900">
            1. 调整颜色
          </h2>

          <div className="mt-4 space-y-4">
            <ColorControl
              label="文字颜色"
              value={textColor}
              onChange={handleTextColorChange}
              onValidityChange={handleTextValidity}
              resetSignal={resetSignal}
            />
            <ColorControl
              label="背景颜色"
              value={backgroundColor}
              onChange={handleBackgroundColorChange}
              onValidityChange={handleBackgroundValidity}
              resetSignal={resetSignal}
            />
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-indigo-700 hover:bg-indigo-50 hover:text-indigo-900"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            重置为默认颜色
          </button>
          {isDefault ? (
            <p className="mt-2 text-xs text-slate-600">当前已是默认配色。</p>
          ) : (
            <p className="mt-2 text-xs text-slate-600">已修改，可一键恢复默认配色。</p>
          )}

          {/* 全页唯一的实时播报区：正常文档流排在颜色控件下方，不用 sticky 覆盖任何操作控件；下面的「检测结果」只静态展示 */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={`mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 ring-1 ring-inset ${
              passes ? 'bg-emerald-50 ring-emerald-700/30' : 'bg-red-50 ring-red-700/30'
            }`}
          >
            <span className="text-xs font-semibold tracking-wide text-slate-700 uppercase">
              当前对比度
            </span>
            <span className="flex items-baseline gap-2">
              <span className="font-mono text-xl font-bold text-slate-900 tabular-nums">
                {ratio === null ? '—' : formatContrastRatio(ratio)}
              </span>
              <span
                className={`text-sm font-semibold ${passes ? 'text-emerald-900' : 'text-red-900'}`}
              >
                {ratio === null ? '颜色无效' : passes ? '达到 AA' : '未达 AA'}
              </span>
            </span>
            {hasInvalidInput ? (
              <p className="w-full text-xs font-semibold text-red-900">{STALE_RESULT_NOTICE}</p>
            ) : null}
          </div>
        </section>

        <div className="space-y-6">
          <section
            aria-labelledby="preview-heading"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 id="preview-heading" className="text-lg font-semibold tracking-tight text-slate-900">
              2. 实时预览
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              预览区域内的配色完全由你控制，用来模拟一张常见的内容卡片。
              卡片里的通知是一段<strong>虚构的演示文案</strong>，不会真的产生提醒或费用。
            </p>

            <div
              className="mt-4 rounded-xl border border-slate-300 p-6"
              style={{ backgroundColor, color: textColor }}
            >
              <p className="text-xs font-semibold tracking-wide uppercase">
                虚构示例 · 校园场景
              </p>
              <h3 className="mt-2 text-xl font-bold">图书馆模拟逾期提醒</h3>
              <p className="mt-2 text-sm leading-relaxed">
                这是一段编出来给你试色的样例文字：假想的 3.50 元模拟逾期费用，
                以及一个假想的缴纳截止日期。
              </p>
              <p className="mt-3 text-xs">示例编号 FICTION-DEMO-0000（虚构，无对应真实记录）</p>
            </div>
          </section>

          <section
            aria-labelledby="result-heading"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 id="result-heading" className="text-lg font-semibold tracking-tight text-slate-900">
              3. 检测结果
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              对比度衡量的是文字与背景的<strong>反差程度</strong>，范围从 1:1（完全分不开）到
              21:1（纯黑配纯白）。反差太小，低视力用户和老年用户在强光下、在旧屏幕上就会看不清。
            </p>

            {hasInvalidInput ? (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-900 ring-1 ring-inset ring-red-700/30">
                {STALE_RESULT_NOTICE}
              </p>
            ) : null}

            {ratio === null ? (
              <p className="mt-4 text-sm font-semibold text-red-800">
                当前颜色值无效，无法计算对比度。请重新选择颜色。
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                    对比度
                  </p>
                  <p className="mt-1 font-mono text-4xl font-bold text-slate-900 tabular-nums">
                    {formatContrastRatio(ratio)}
                  </p>
                </div>

                <div
                  className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold ring-1 ring-inset ${
                    passes
                      ? 'bg-emerald-50 text-emerald-900 ring-emerald-700/30'
                      : 'bg-red-50 text-red-900 ring-red-700/30'
                  }`}
                >
                  {passes ? (
                    <CircleCheckBig className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                  ) : (
                    <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                  )}
                  <span>
                    {passes
                      ? `达到普通文本 AA（≥ ${AA_NORMAL_TEXT_RATIO}:1）`
                      : `未达普通文本 AA（需 ≥ ${AA_NORMAL_TEXT_RATIO}:1）`}
                    </span>
                </div>
              </div>
            )}

            <div className="mt-5 border-t border-slate-200 pt-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Info className="size-4 shrink-0 text-indigo-800" aria-hidden="true" />
                本实验检查什么、不检查什么
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                只检查一件事：这一对颜色的反差，够不够 WCAG 2.2 成功标准 1.4.3
                给<strong>普通文本</strong>定的 {AA_NORMAL_TEXT_RATIO}:1（AA 级）。
                <span className="mt-1.5 block font-semibold text-slate-900">
                  这一项通过，只代表这一对颜色合格，不代表这个组件或整个网站已经符合 WCAG 2.2。
                </span>
              </p>

              <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
                <summary className="cursor-pointer rounded-lg px-2 py-3 text-sm font-semibold text-indigo-800">
                  展开查看：本次没有检查的内容
                </summary>
                <ul className="mt-1.5 space-y-1.5 px-2 pb-1 text-sm leading-relaxed text-slate-700">
                  <li>
                    1.4.3 对<strong>大文本</strong>要求的 3:1（AA 级）——本实验只判普通文本。
                  </li>
                  <li>
                    成功标准 1.4.6（Contrast (Enhanced)，AAA 级）：普通文本 7:1、大文本 4.5:1。
                  </li>
                  <li>成功标准 1.4.11（Non-text Contrast，AA 级）：图形与界面组件 3:1。</li>
                  <li>语义结构、键盘可达性、屏幕阅读器朗读顺序等其他成功标准。</li>
                </ul>
              </details>
            </div>
          </section>
        </div>
      </div>

      <section
        aria-labelledby="repair-heading"
        className="mt-6 min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 id="repair-heading" className="text-lg font-semibold tracking-tight text-slate-900">
          4. 智能修复建议
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          当配色未达普通文本 AA 时，可生成一个把文字色朝纯黑或纯白微调、尽量减小改动、
          并用真实 WCAG 计算复核达标后的建议色。<strong>只调整文字颜色，背景保持你选的颜色。</strong>
          这是确定性算法，不是全局最优、也不保证人眼感知差异最小。
        </p>

        {hasInvalidInput ? (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 ring-1 ring-inset ring-amber-700/30">
            存在无效颜色，修复功能已暂停。请先修正上方的颜色输入，再使用修复。
          </p>
        ) : null}

        {!hasInvalidInput && passes ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 ring-1 ring-inset ring-emerald-700/30">
            <CircleCheckBig className="size-5 shrink-0" aria-hidden="true" />
            当前配色已达到普通文本 AA，无需修复。
          </p>
        ) : null}

        {!hasInvalidInput && !passes && repair.phase === 'idle' ? (
          <button
            type="button"
            onClick={handleGenerate}
            className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-800"
          >
            <WandSparkles className="size-4" aria-hidden="true" />
            生成修复建议
          </button>
        ) : null}

        {repair.phase === 'suggested' && suggestion?.suggestedTextColor && !hasInvalidInput ? (
          <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">
                建议文字颜色
                <span className="ml-2 rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-semibold text-indigo-900">
                  建议 · 尚未应用
                </span>
              </p>
              <AaBadge
                textColor={suggestion.suggestedTextColor}
                backgroundColor={backgroundColor}
              />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              把文字色从 <span className="font-mono uppercase">{suggestion.originalTextColor}</span>{' '}
              调整为 <span className="font-mono uppercase">{suggestion.suggestedTextColor}</span>
              ，对比度由 {formatContrastRatio(suggestion.beforeRatio ?? 0)} 提升到{' '}
              {formatContrastRatio(suggestion.afterRatio ?? 0)}。本次仅调整文字颜色，未改变背景。
            </p>
            <button
              type="button"
              onClick={handleApply}
              disabled={!canApply}
              className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
            >
              <Check className="size-4" aria-hidden="true" />
              应用该修复
            </button>
          </div>
        ) : null}

        {repair.phase === 'applied' && snapshot && !hasInvalidInput ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">
                修复已应用
                <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-900">
                  已应用
                </span>
              </p>
              <AaBadge textColor={snapshot.afterTextColor} backgroundColor={backgroundColor} />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              文字色已从 <span className="font-mono uppercase">{snapshot.beforeTextColor}</span> 改为{' '}
              <span className="font-mono uppercase">{snapshot.afterTextColor}</span>，
              对比度 {formatContrastRatio(snapshot.beforeRatio)} → {formatContrastRatio(snapshot.afterRatio)}。
            </p>
            <button
              type="button"
              onClick={handleUndo}
              className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-indigo-700 hover:text-indigo-900"
            >
              <Undo2 className="size-4" aria-hidden="true" />
              撤销本次修复
            </button>
          </div>
        ) : null}

        {notice && notice.area === 'repair' ? (
          <p
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800"
          >
            {notice.text}
          </p>
        ) : null}
      </section>

      {showRepairOutput && beforeColor && afterColor ? (
        <section
          aria-labelledby="compare-heading"
          className="mt-6 min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 id="compare-heading" className="text-lg font-semibold tracking-tight text-slate-900">
            5. 修复前后对比
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            两侧使用同一背景与同一句示例文字，只有文字颜色随方案变化。
            {applied
              ? ' 当前展示的是本次「已应用修复」前后的实际结果。'
              : ' 右侧为「建议修复后」，尚未应用到上方配色，仅作预览。'}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CompareColumn
              heading="修复前"
              headingId="compare-before-heading"
              textColor={beforeColor}
              backgroundColor={backgroundColor}
              sample={SAMPLE_TEXT}
            />
            <CompareColumn
              heading={applied ? '已应用修复' : '建议修复后'}
              headingId="compare-after-heading"
              textColor={afterColor}
              backgroundColor={backgroundColor}
              sample={SAMPLE_TEXT}
            />
          </div>
        </section>
      ) : null}

      {cssPreview ? (
        <section
          aria-labelledby="css-heading"
          className="mt-6 min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 id="css-heading" className="text-lg font-semibold tracking-tight text-slate-900">
            6. 对比 CSS 代码
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            下列代码由当前配色与算法结果实时生成，颜色值与上方一致；更改配色会同步更新或清除。
          </p>
          <pre className="mt-3 min-w-0 overflow-x-auto rounded-xl bg-slate-900 px-4 py-3 text-xs leading-relaxed text-slate-100">
            <code>{cssPreview}</code>
          </pre>
          <button
            type="button"
            onClick={handleCopy}
            className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-indigo-700 hover:text-indigo-900"
          >
            <Copy className="size-4" aria-hidden="true" />
            复制修复后的 CSS
          </button>
          {notice && notice.area === 'css' ? (
            <p
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800"
            >
              {notice.text}
            </p>
          ) : null}
        </section>
      ) : null}

      <NextStepCard
        headingId="contrast-next-heading"
        title="下一步：让输入框拥有正确的标签"
        description="颜色只是「看得见」的第一层。另一个常见问题是输入框旁边写着名字、读屏软件却读不出来——下一个实验就修这个，改完还能看到真实 DOM 的复检结果。"
        href={ROUTE_HASH['form-label-lab']}
        linkLabel="进入表单标签实验"
      />
    </div>
  )
}
