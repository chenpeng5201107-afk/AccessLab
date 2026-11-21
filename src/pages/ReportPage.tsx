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
import { learningMarkdown, learningRows, reviewAdvice, TOPICS, type StudyState } from '../lib/study'
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
        <CircleCheckBig
          className="mr-1 inline-block size-3.5 shrink-0 align-[-2px] text-emerald-800"
          aria-hidden="true"
        />
      ) : row.tone === 'fail' ? (
        <CircleAlert
          className="mr-1 inline-block size-3.5 shrink-0 align-[-2px] text-red-800"
          aria-hidden="true"
        />
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
              done
                ? 'bg-emerald-50 text-emerald-900 ring-emerald-700/30'
                : 'bg-slate-50 text-slate-700 ring-slate-300'
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

function ExperimentSection({ experiment }: { experiment: ExperimentReportView }) {
  const headingId = `report-experiment-${experiment.key}-heading`
  return (
    <section
      aria-labelledby={headingId}
      className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h3 id={headingId} className="text-lg font-semibold tracking-tight text-slate-900">
        {experiment.name}
      </h3>
      <div
        className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-sm font-semibold ring-1 ring-inset ${STATUS_TONE[experiment.statusTone]}`}
      >
        <ListChecks className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>状态：{experiment.statusLabel}</span>
      </div>

      <details className="lab-fold inline-fold">
        <summary>查看检测证据与代码</summary>
        <ProgressList progress={experiment.progress} />

        <dl className="mt-4 space-y-2 text-sm">
          {experiment.rows.map((row) => (
            <div
              key={row.label}
              className="min-w-0 border-b border-slate-100 pb-2 sm:flex sm:items-baseline sm:justify-between sm:gap-3"
            >
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
      </details>
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

export function ReportPage({ study, onClearStudy }: { study?: StudyState; onClearStudy?: () => void } = {}) {
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

  const hasStudy = study?.campus.submitted === true
  const canExport = model.hasRecords || hasStudy
  const hasDraft = Object.keys(study?.campus.answers ?? {}).length > 0
  const canClear = canExport || hasDraft
  const markdown = useMemo(() => {
    const labText = renderReportMarkdown(model)
    return study?.campus.submitted ? learningMarkdown(study) + '\n\n' + labText : labText
  }, [model, study])

  const handleCopy = async () => {
    if (!canExport) return
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
    if (!canExport) return
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
    onClearStudy?.()
    restoreFocusRef.current = true
    setConfirmingClear(false)
    setStatus('已清空本次会话登记的实验记录。各实验页里的示例仍可重新操作，记录会随新的检测重新写入。')
  }

  const handleCancelClear = () => {
    restoreFocusRef.current = true
    setConfirmingClear(false)
  }

  return (
    <div className="lab-page mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
      <a href={ROUTE_HASH.home} className="study-back">
        ← 学习首页
      </a>
      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">统一成果报告</h1>
        <p className="lab-lead">回看本次判断、修复和复测。刷新或关闭页面会清空记录。</p>
      </header>

      <section className="study-panel study-report" aria-labelledby="learning-title">
        <h2 id="learning-title">{hasStudy ? '学习复盘' : canExport ? '校园初诊' : '从一次校园初诊开始'}</h2>
        {hasStudy && study ? (
          <>
            <table>
              <caption className="sr-only">三项能力的本次练习记录</caption>
              <thead>
                <tr>
                  <th scope="col">能力</th>
                  <th scope="col">校园初诊</th>
                  <th scope="col">跟练修复</th>
                  <th scope="col">图书馆首答</th>
                </tr>
              </thead>
              <tbody>
                {learningRows(study).map((row) => (
                  <tr key={row.key}>
                    <th scope="row">
                      <a href={ROUTE_HASH[TOPICS[row.key].route]}>{row.title}</a>
                    </th>
                    <td>
                      <span className="verdict" data-value={row.diagnosis}>
                        {row.diagnosis}
                      </span>
                    </td>
                    <td>{row.practice}</td>
                    <td>
                      <span className="verdict" data-value={row.transfer}>
                        {row.transfer}
                      </span>
                      {study.corrected.includes(row.key) && (
                        <small className="block text-slate-600">已完成订正</small>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3">{reviewAdvice(study)}</p>
            <div className="study-inline">
              <a href={ROUTE_HASH.transfer}>{study.library.submitted ? '查看迁移解析' : '进入迁移测验'} →</a>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-slate-600">试用摄影社报名页，留下你的第一份判断记录。</p>
            <a href={ROUTE_HASH.diagnosis} className="report-start">
              {hasDraft ? '继续校园初诊' : '开始校园初诊'} <ArrowRight size={16} aria-hidden="true" />
            </a>
          </>
        )}
      </section>

      {(canClear || status) && (
        <section
          aria-labelledby="report-export-heading"
          className="mt-6 min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 id="report-export-heading" className="text-lg font-semibold tracking-tight text-slate-900">
            保存本次报告
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!canExport}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-700"
            >
              <ClipboardCopy className="size-4" aria-hidden="true" />
              复制 Markdown 报告
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={!canExport}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-indigo-700 hover:bg-indigo-50 hover:text-indigo-900 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              <Download className="size-4" aria-hidden="true" />
              {hasStudy ? '下载学习报告' : '下载 .md 文件'}
            </button>
          </div>

          <p
            ref={statusRef}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            tabIndex={-1}
            className={`report-feedback mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${
              status ? 'bg-slate-100 text-slate-800' : 'text-slate-600 font-normal'
            }`}
          >
            {status}
          </p>

          <details className="mt-4 min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-indigo-800">
              展开查看报告全文（Markdown）
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
            {confirmingClear ? (
              <div
                role="group"
                aria-labelledby="report-clear-confirm-heading"
                className="mt-2 rounded-xl bg-red-50 p-4 ring-1 ring-inset ring-red-700/30"
              >
                <p id="report-clear-confirm-heading" className="text-sm font-semibold text-red-900">
                  确认清空本次会话登记的实验记录？
                </p>
                <p className="mt-1 text-sm leading-relaxed text-red-900">
                  本次案例首答、订正、草稿和三项实验记录都会清空，不会清除浏览器其它数据。建议先下载想保留的报告。
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
                <button
                  ref={clearRef}
                  type="button"
                  onClick={() => setConfirmingClear(true)}
                  disabled={!canClear}
                  className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-red-700 hover:bg-red-50 hover:text-red-900 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  清空本次实验记录
                </button>
              </>
            )}
          </div>
        </section>
      )}

      {model.hasRecords ? (
        <section className="report-overview" aria-labelledby="report-overview-heading">
          <h2 id="report-overview-heading">实验记录</h2>
          <dl className="report-stats">
            <div>
              <dt>已检测</dt>
              <dd>
                {model.summary.recordedCount} / {model.summary.experimentCount}
              </dd>
            </div>
            <div>
              <dt>已应用修复</dt>
              <dd>{model.summary.repairAppliedCount}</dd>
            </div>
            <div>
              <dt>修复后复核</dt>
              <dd>{model.summary.reVerifiedCount}</dd>
            </div>
            <div>
              <dt>已人工确认</dt>
              <dd>{model.summary.manualConfirmedCount}</dd>
            </div>
          </dl>
          <details className="lab-fold inline-fold">
            <summary>查看验证清单与统计说明</summary>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              「修复后复核」这一列怎么数：{model.statements.reVerifiedHelp}
            </p>

            <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700">
              {model.conclusions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">人工验证的三种状态</h3>
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

            {model.summary.notRecordedKeys.length > 0 ? (
              <p className="mt-3 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">
                尚未记录的实验：
                {model.summary.notRecordedKeys
                  .map((key) =>
                    key === 'contrast' ? '色彩对比度实验' : key === 'form-label' ? '表单标签实验' : '键盘焦点实验',
                  )
                  .join('、')}
                。
              </p>
            ) : null}

            <p className="mt-4 text-xs leading-relaxed text-slate-600">{model.statements.sessionScope}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{model.statements.snapshot}</p>
            <p className="mt-2 text-xs text-slate-600">报告生成时间：{model.generatedAt}</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
              {model.uncheckedScope.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </details>
        </section>
      ) : (
        <section className="report-overview" aria-labelledby="report-overview-heading">
          <h2 id="report-overview-heading">专项实验</h2>
          <p className="mt-1 text-sm text-slate-600">还没有实验记录。也可以从一项练习开始。</p>
          <div className="study-inline report-lab-links">
            {model.experiments.map((experiment) => (
              <a key={experiment.key} href={experiment.labHash}>
                {experiment.name} <ArrowRight size={15} aria-hidden="true" />
              </a>
            ))}
          </div>
        </section>
      )}

      {model.hasRecords && (
        <section aria-labelledby="report-experiments-heading" className="mt-4 grid gap-3">
          <h2 id="report-experiments-heading" className="sr-only">
            各实验的成果记录
          </h2>
          {model.experiments
            .filter((experiment) => experiment.recorded)
            .map((experiment) => (
              <ExperimentSection key={experiment.key} experiment={experiment} />
            ))}
        </section>
      )}

      <p className="mt-5 text-xs leading-relaxed text-slate-600">{NON_CERTIFICATION_STATEMENT}</p>
    </div>
  )
}
