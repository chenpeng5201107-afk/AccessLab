import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  CircleCheckBig,
  ClipboardCopy,
  Download,
  Info,
  ListChecks,
  RotateCcw,
} from 'lucide-react'

import { useExperimentLedger } from '../context/ExperimentLedgerContext'
import { ROUTE_HASH } from '../hooks/useHashRoute'
import {
  NON_CERTIFICATION_STATEMENT,
  buildReportModel,
  manualVerificationGroups,
  renderReportMarkdown,
  type ExperimentReportView,
  type ReportRow,
} from '../lib/reportModel'
import type { ExperimentProgress } from '../lib/experimentLedger'

const PROGRESS_ITEMS: Array<{ key: keyof ExperimentProgress; label: string }> = [
  { key: 'inspected', label: '已检测' },
  { key: 'repairApplied', label: '已应用修复' },
  { key: 'reVerified', label: '修复后复核' },
  { key: 'manualConfirmed', label: '已人工确认' },
]

/** 状态徽章：颜色之外还带图标与文字，避免只靠红绿区分（同一套色板也用在实验页） */
const STATUS_TONE: Record<ExperimentReportView['statusTone'], string> = {
  neutral: 'bg-slate-100 text-slate-800 ring-slate-500/30',
  pass: 'bg-emerald-50 text-emerald-900 ring-emerald-700/30',
  warn: 'bg-amber-50 text-amber-900 ring-amber-700/30',
  fail: 'bg-red-50 text-red-900 ring-red-700/30',
}

function RowValue({ row }: { row: ReportRow }) {
  return (
    <span
      className={`block min-w-0 font-semibold sm:ml-3 sm:max-w-[36rem] sm:text-right ${
        row.tone === 'fail'
          ? 'text-red-900'
          : row.tone === 'pass'
            ? 'text-emerald-900'
            : row.tone === 'warn'
              ? 'text-amber-900'
              : 'text-slate-900'
      }`}
    >
      {row.tone === 'pass' ? (
        <CircleCheckBig className="mr-1 inline-block size-3.5 shrink-0 align-[-2px] text-emerald-800" aria-hidden="true" />
      ) : row.tone === 'fail' ? (
        <CircleAlert className="mr-1 inline-block size-3.5 shrink-0 align-[-2px] text-red-800" aria-hidden="true" />
      ) : row.tone === 'warn' ? (
        <Info className="mr-1 inline-block size-3.5 shrink-0 align-[-2px] text-amber-800" aria-hidden="true" />
      ) : null}
      {row.value}
    </span>
  )
}

function CodeBlock({ code, label }: { code: string; label: string }) {
  return (
    <div className="mt-3 min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</p>
      <pre className="mt-1.5 min-w-0 max-w-full overflow-x-auto rounded-xl bg-slate-900 px-4 py-3 text-xs leading-relaxed text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function ProgressList({ progress }: { progress: ExperimentProgress }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
      {PROGRESS_ITEMS.map((item) => {
        const done = progress[item.key]
        return (
          <li
            key={item.key}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 ring-1 ring-inset ${
              done ? 'bg-emerald-50 text-emerald-900 ring-emerald-700/30' : 'bg-slate-50 text-slate-700 ring-slate-300'
            }`}
          >
            {done ? (
              <CircleCheckBig className="size-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <span className="size-3.5 shrink-0 rounded-full border border-current" aria-hidden="true" />
            )}
            {item.label}
            <span className="sr-only">{done ? '已完成' : '尚未完成'}</span>
          </li>
        )
      })}
    </ul>
  )
}

function ExperimentSection({ experiment, order }: { experiment: ExperimentReportView; order: number }) {
  const headingId = `report-experiment-${experiment.key}-heading`
  return (
    <section
      aria-labelledby={headingId}
      className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h3 id={headingId} className="text-lg font-semibold tracking-tight text-slate-900">
        <span className="text-indigo-800">{order}.</span> {experiment.name}
      </h3>
      <div
        className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-sm font-semibold ring-1 ring-inset ${STATUS_TONE[experiment.statusTone]}`}
      >
        <ListChecks className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>状态：{experiment.statusLabel}</span>
      </div>

      <ProgressList progress={experiment.progress} />

      <dl className="mt-4 space-y-2 text-sm">
        {experiment.rows.map((row) => (
          <div key={row.label} className="min-w-0 border-b border-slate-100 pb-2 sm:flex sm:items-baseline sm:justify-between sm:gap-3">
            <dt className="text-slate-600">{row.label}</dt>
            <dd className="min-w-0">
              <RowValue row={row} />
            </dd>
          </div>
        ))}
      </dl>

      {experiment.notes.length > 0 ? (
        <div className="mt-4 border-t border-slate-200 pt-3">
          <h4 className="text-sm font-semibold text-slate-900">证据与说明</h4>
          <ul className="mt-1.5 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700">
            {experiment.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {experiment.code ? <CodeBlock code={experiment.code.code} label={experiment.code.label} /> : null}

      <div className="mt-4 border-t border-slate-200 pt-3 text-sm">
        <p className="font-semibold text-slate-900">WCAG 依据：{experiment.wcagBasis}</p>
        <p className="mt-1 text-slate-700">本次范围：{experiment.scope}</p>
        <details className="mt-3 min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-2">
          <summary className="cursor-pointer rounded-lg px-2 py-2.5 text-sm font-semibold text-indigo-800">
            展开查看：这一项没有检查的内容（{experiment.limits.length} 条）
          </summary>
          <ul className="mt-1.5 list-disc space-y-1 px-2 pb-1 text-sm leading-relaxed text-slate-700">
            {experiment.limits.map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
          </ul>
        </details>
        {experiment.manualDone ? (
          <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 font-semibold text-emerald-900 ring-1 ring-inset ring-emerald-700/30">
            实验内已确认：{experiment.manualDone}
          </p>
        ) : null}
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 font-semibold text-amber-900 ring-1 ring-inset ring-amber-700/30">
          仍需你人工验证：{experiment.manualCheck}
        </p>
      </div>

      <a
        href={experiment.labHash}
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-800 no-underline transition-colors hover:border-indigo-700 hover:bg-indigo-50"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {experiment.labName}
      </a>
    </section>
  )
}

function downloadFileName(generatedAt: string): string {
  const stamp = generatedAt.replace(/[^0-9]/g, '').slice(0, 14)
  return `AccessLab-成果报告-${stamp}.md`
}

export function ReportPage() {
  const { ledger, dispatch } = useExperimentLedger()
  const model = useMemo(() => buildReportModel(ledger, new Date()), [ledger])
  const [status, setStatus] = useState<string | null>(null)
  const [confirmingClear, setConfirmingClear] = useState(false)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const clearRef = useRef<HTMLButtonElement>(null)
  const statusRef = useRef<HTMLParagraphElement>(null)
  /** 确认区收起后才把焦点交回触发按钮：早一步调用会落在还没渲染出来的节点上 */
  const restoreFocusRef = useRef(false)

  useEffect(() => {
    if (confirmingClear) {
      confirmRef.current?.focus()
      return
    }
    if (restoreFocusRef.current) {
      restoreFocusRef.current = false
      // 清空之后按钮会变成禁用态，禁用按钮接不住焦点，这时把焦点交给状态提示本身
      const trigger = clearRef.current
      if (trigger && !trigger.disabled) trigger.focus()
      else statusRef.current?.focus()
    }
  }, [confirmingClear])

  const markdown = useMemo(() => renderReportMarkdown(model), [model])

  const handleCopy = async () => {
    if (!model.hasRecords) return
    if (!navigator.clipboard?.writeText) {
      setStatus('当前浏览器不支持自动复制，请展开下方「报告全文」，全选后手动复制。')
      return
    }
    try {
      await navigator.clipboard.writeText(markdown)
      setStatus('已复制完整 Markdown 报告，内容与上方展示逐字一致，可直接粘贴到笔记或 .md 文件。')
    } catch {
      setStatus('复制失败（可能是浏览器拒绝了剪贴板权限）。请展开下方「报告全文」，全选后手动复制。')
    }
  }

  const handleDownload = () => {
    if (!model.hasRecords) return
    if (typeof Blob === 'undefined' || typeof URL?.createObjectURL !== 'function') {
      setStatus('当前浏览器不支持本地下载，请展开下方「报告全文」手动复制保存。')
      return
    }
    try {
      const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url
      link.download = downloadFileName(model.generatedAt)
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setStatus(`已生成 ${downloadFileName(model.generatedAt)}：文件只在你的浏览器里拼装，没有上传到任何服务器。`)
    } catch {
      setStatus('下载失败，请展开下方「报告全文」手动复制保存。')
    }
  }

  const handleClearConfirmed = () => {
    dispatch({ type: 'clear-all' })
    restoreFocusRef.current = true
    setConfirmingClear(false)
    setStatus('已清空本次会话登记的实验记录。各实验页里的示例仍可重新操作，记录会随新的检测重新写入。')
  }

  const handleCancelClear = () => {
    restoreFocusRef.current = true
    setConfirmingClear(false)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <a
        href={ROUTE_HASH.home}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-800 underline decoration-indigo-400 decoration-2 underline-offset-4 hover:decoration-indigo-800"
      >
        返回首页
      </a>

      <header className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">统一成果报告</h1>
        <p className="mt-3 text-base leading-relaxed text-slate-700">
          这一页把三个实验的真实结果放在一起：每个数值都来自实验里已经跑过的检测与计算，
          本页不重新判断颜色、标签或焦点，只把已有结论按「检测 / 修复 / 修复后复核 / 人工确认」分开登记。
        </p>
        <p className="mt-3 text-sm text-slate-600">报告生成时间：{model.generatedAt}</p>
        <p className="mt-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold leading-relaxed text-amber-900 ring-1 ring-inset ring-amber-700/30">
          {NON_CERTIFICATION_STATEMENT}
        </p>
      </header>

      <section
        aria-labelledby="report-overview-heading"
        className="mt-6 min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 id="report-overview-heading" className="text-lg font-semibold tracking-tight text-slate-900">
          1. 本次会话总览
        </h2>

        <p className="mt-2 text-base font-semibold text-pretty text-slate-900">
          {model.hasRecords
            ? `这次会话登记了 ${model.summary.recordedCount} / ${model.summary.experimentCount} 个实验的成果，其中 ${model.summary.repairAppliedCount} 个真正改动了页面，${model.summary.manualConfirmedCount} 个已由你本人确认。`
            : '这次会话还没有登记任何实验成果：报告只写真实跑过的检测，不会预先替你填上结论。'}
        </p>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <dt className="text-sm text-slate-600">已记录 / 总实验数</dt>
            <dd className="mt-1 text-3xl font-bold text-slate-900 tabular-nums">
              {model.summary.recordedCount} / {model.summary.experimentCount}
            </dd>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <dt className="text-sm text-slate-600">已实际执行修复的实验数</dt>
            <dd className="mt-1 text-3xl font-bold text-slate-900 tabular-nums">
              {model.summary.repairAppliedCount} / {model.summary.experimentCount}
            </dd>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <dt className="text-sm text-slate-600">已进行修复后复核（含人工键盘体验）的实验数</dt>
            <dd className="mt-1 text-3xl font-bold text-slate-900 tabular-nums">
              {model.summary.reVerifiedCount} / {model.summary.experimentCount}
            </dd>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <dt className="text-sm text-slate-600">实验内仍待你本人完成的观察</dt>
            <dd className="mt-1 text-3xl font-bold text-slate-900 tabular-nums">{model.pendingManual.length} 项</dd>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <dt className="text-sm text-slate-600">建议额外进行的辅助技术验证</dt>
            <dd className="mt-1 text-3xl font-bold text-slate-900 tabular-nums">{model.extraVerification.length} 项</dd>
          </div>
        </dl>

        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          「修复后复核」这一列怎么数：{model.statements.reVerifiedHelp}
        </p>

        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700">
          {model.conclusions.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <h3 className="mt-4 text-sm font-semibold text-slate-900">人工验证的三种状态</h3>
        {model.hasRecords ? (
          <ul className="mt-1.5 space-y-3">
            {manualVerificationGroups(model).map((group) => (
              <li key={group.heading}>
                <h4 className="text-sm font-semibold text-slate-900">{group.heading}</h4>
                {group.items.length > 0 ? (
                  <ul className="mt-1 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700">
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-slate-600">当前没有条目。</p>
                )}
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{group.note}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1.5 text-sm text-slate-700">
            本次会话还没有可引用的实验记录，因此没有列出验证项。做完实验再回来，这里会逐条告诉你还差哪一步。
          </p>
        )}

        {model.summary.notRecordedKeys.length > 0 ? (
          <p className="mt-3 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">
            尚未记录的实验：
            {model.summary.notRecordedKeys
              .map((key) => (key === 'contrast' ? '色彩对比度实验' : key === 'form-label' ? '表单标签实验' : '键盘焦点实验'))
              .join('、')}
            。它们没有运行过检测，所以报告里不会替它们编一个结论。
          </p>
        ) : null}

        {!model.hasRecords ? (
          <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
            <p className="text-sm font-semibold text-slate-900">想让这一页有内容？从任意一个实验开始：</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {[
                { href: ROUTE_HASH['contrast-lab'], label: '色彩对比度实验' },
                { href: ROUTE_HASH['form-label-lab'], label: '表单标签实验' },
                { href: ROUTE_HASH['keyboard-lab'], label: '键盘焦点实验' },
              ].map((entry) => (
                <li key={entry.href}>
                  <a
                    href={entry.href}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-indigo-800"
                  >
                    {entry.label}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              做完任意一次检测再回到这一页，上面的数字和下面的记录都会随之填上。
            </p>
          </div>
        ) : null}

        <p className="mt-4 text-xs leading-relaxed text-slate-600">{model.statements.sessionScope}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{model.statements.snapshot}</p>
      </section>

      <section aria-labelledby="report-experiments-heading" className="mt-6 space-y-6">
        <h2 id="report-experiments-heading" className="sr-only">
          各实验的成果记录
        </h2>
        {model.experiments.map((experiment, index) => (
          <ExperimentSection key={experiment.key} experiment={experiment} order={index + 1} />
        ))}
      </section>

      <section
        aria-labelledby="report-export-heading"
        className="mt-6 min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 id="report-export-heading" className="text-lg font-semibold tracking-tight text-slate-900">
          2. 导出与清空
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          复制与下载的内容和上方展示完全同源：同一份记录数据渲染成 Markdown，不额外添加任何结论。
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!model.hasRecords}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-700"
          >
            <ClipboardCopy className="size-4" aria-hidden="true" />
            复制 Markdown 报告
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!model.hasRecords}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-indigo-700 hover:bg-indigo-50 hover:text-indigo-900 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            <Download className="size-4" aria-hidden="true" />
            下载 .md 文件
          </button>

          {model.hasRecords ? (
            <p className="text-xs text-slate-600">
              导出按钮当前可用；没有记录时它们保持禁用，避免导出一份空的「成果」。
            </p>
          ) : null}
        </div>

        {!model.hasRecords ? (
          <p className="mt-3 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">
            本次会话还没有任何实验记录，因此没有可复制或可下载的成果。请先去三个实验里跑一次检测。
          </p>
        ) : null}

        <p
          ref={statusRef}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          tabIndex={-1}
          className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${
            status ? 'bg-slate-100 text-slate-800' : 'text-slate-600 font-normal'
          }`}
        >
          {status ?? '这里的提示只反映你刚才在本报页面上的操作。'}
        </p>

        <details className="mt-4 min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-indigo-800">
            展开查看报告全文（Markdown 原文，可手动全选复制）
          </summary>
          <label htmlFor="report-markdown-source" className="mt-3 block text-xs text-slate-600">
            报告全文（只读文本框）：
          </label>
          <textarea
            id="report-markdown-source"
            readOnly
            value={markdown}
            rows={12}
            className="mt-1.5 min-w-0 w-full max-w-full overflow-auto rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs leading-relaxed text-slate-900"
          />
        </details>

        <div className="mt-5 border-t border-slate-200 pt-4">
          <h3 className="text-sm font-semibold text-slate-900">清空本次实验记录</h3>
          {confirmingClear ? (
            <div role="group" aria-labelledby="report-clear-confirm-heading" className="mt-2 rounded-xl bg-red-50 p-4 ring-1 ring-inset ring-red-700/30">
              <p id="report-clear-confirm-heading" className="text-sm font-semibold text-red-900">
                确认清空本次会话登记的实验记录？
              </p>
              <p className="mt-1 text-sm leading-relaxed text-red-900">
                这只删除 AccessLab 在本页内存里的三条实验记录，不会清除浏览器其它数据、不会改动实验页的示例内容，也不会影响线上站点。
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  ref={confirmRef}
                  type="button"
                  onClick={handleClearConfirmed}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-800"
                >
                  确认清空记录
                </button>
                <button
                  type="button"
                  onClick={handleCancelClear}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-500"
                >
                  取消，保留记录
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                点击后会先要求你确认，确认后才真正清空；取消则原样保留。
              </p>
              <button
                ref={clearRef}
                type="button"
                onClick={() => setConfirmingClear(true)}
                disabled={!model.hasRecords}
                className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-red-700 hover:bg-red-50 hover:text-red-900 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                清空本次实验记录
              </button>
            </>
          )}
        </div>
      </section>

      <section
        aria-labelledby="report-notes-heading"
        className="mt-6 min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 id="report-notes-heading" className="text-lg font-semibold tracking-tight text-slate-900">
          3. 学习提示与重新验证
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
          <li>
            把「已检测」「已给出建议」「已应用修复」「已进行修复后复核」「已人工确认」当成五件不同的事：
            本报告分列记录它们，正是为了避免把其中一步说成整件事完成。
          </li>
          <li>
            每个实验都可以回去重做：改了颜色、撤销了修复、重置了表单或焦点实验，旧结论都会随之失效，
            报告只反映最近一次的真实状态。
          </li>
          <li>
            建议的 HTML / CSS 可以直接复制到自有项目，但那只是「起点」：真实页面上还有状态色、占位符、
            禁用态、错误提示等本页没有检查的内容。
          </li>
          <li>
            刷新页面后这份内存台账就会清空——这是刻意的设计：本报告不落盘、不上传，也不保存任何表单输入。
          </li>
        </ul>

        <details className="mt-4 min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-indigo-800">
            展开查看：整份报告没有检查的范围
          </summary>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700">
            {model.uncheckedScope.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>

        <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold leading-relaxed text-slate-800">
          {NON_CERTIFICATION_STATEMENT}
        </p>
      </section>
    </div>
  )
}
