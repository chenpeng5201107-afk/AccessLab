import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import {
  Check,
  CircleAlert,
  CircleCheckBig,
  Copy,
  Info,
  RefreshCw,
  RotateCcw,
  WandSparkles,
} from 'lucide-react'

import { ROUTE_HASH } from '../hooks/useHashRoute'
import { useExperimentLedger } from '../context/ExperimentLedgerContext'
import {
  deriveFormRecord,
  snapshotFromAudit,
  type IssueSnapshot,
} from '../lib/experimentLedger'
import { auditFormLabels, type FieldAuditRow, type FormLabelAuditReport } from '../lib/formLabelAudit'
import { EMAIL_FIELD, NAME_FIELD, demoFormHtml, demoFormMarkup } from '../lib/formLabelDemoFields'

const DEMO_FORM_NOTICE =
  '这是一个教学示例表单。它只存在于你的浏览器里：不会提交数据、不发送请求，也不会保存你输入的任何文字。'

/** 故意存在问题的字段被限制在这个区域内；页面自身的导航与操作控件全部保持可访问 */
const DEFECT_REGION_NOTICE = '本区域含一个故意设置的标签关联缺陷，用于观察检测前后的差别。'

function RowBadge({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        ok ? 'bg-emerald-50 text-emerald-900 ring-emerald-700/30' : 'bg-red-50 text-red-900 ring-red-700/30'
      }`}
    >
      {ok ? (
        <CircleCheckBig className="size-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
      )}
      {ok ? yes : no}
    </span>
  )
}

function FieldResultRow({ row }: { row: FieldAuditRow }) {
  return (
    <li className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-slate-900">
        <span className="font-mono text-indigo-900">{row.controlId}</span>
        <span className="text-xs font-medium text-slate-600">type={row.controlType}</span>
      </p>

      <dl className="mt-3 space-y-1.5 text-xs">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <dt className="text-slate-600">程序化关联的 label</dt>
          <dd className="font-semibold text-slate-900">
            {row.hasProgrammaticallyAssociatedLabel
              ? `有 · ${row.associatedLabelTexts.filter(Boolean).join('、') || '（关联到了空 label）'}`
              : '没有'}
          </dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <dt className="text-slate-600">可见且已关联的标签</dt>
          <dd className="font-semibold text-slate-900">{row.hasVisibleAssociatedLabel ? '有' : '无'}</dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <dt className="text-slate-600">可访问名称来源（读屏可用）</dt>
          <dd className="font-mono text-slate-900">{row.nameSources.join('、') || '无'}</dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <dt className="text-slate-600">检测到的控件名称</dt>
          <dd className="font-semibold text-slate-900">{row.computedName || '（空）'}</dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <RowBadge
          ok={row.hasProgrammaticallyAssociatedLabel}
          yes="已建立关联"
          no="缺少关联的可见标签"
        />
        <RowBadge ok={row.hasAccessibleName} yes="有可访问名称" no="完全没有可访问名称" />
      </div>

      {row.issues.length > 0 ? (
        <ul className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-sm">
          {row.issues.map((issue) => (
            <li key={issue.code}>
              <p className="flex items-start gap-2 font-medium text-red-900">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{issue.message}</span>
              </p>
              <p className="mt-1 pl-6 text-xs text-slate-600">对应规范：{issue.standardHint}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 flex items-start gap-2 border-t border-slate-200 pt-3 text-sm font-medium text-emerald-900">
          <CircleCheckBig className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          这个控件的标签关联检查没有发现问题。
        </p>
      )}
    </li>
  )
}

export function FormLabelLabPage() {
  const formRef = useRef<HTMLFormElement>(null)
  const { ledger, dispatch } = useExperimentLedger()
  const [labelFixed, setLabelFixed] = useState(false)
  const [report, setReport] = useState<FormLabelAuditReport | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  /** 缺陷态那次检测的摘要：修复后 DOM 已经变了，报告里的「修复前」只能靠它 */
  const beforeSnapshotRef = useRef<IssueSnapshot | null>(null)
  const ledgerSyncedRef = useRef(false)

  // 检测对象永远是已经渲染出来的真实 DOM 节点，而不是 React 里的某个标志位
  useEffect(() => {
    const next = auditFormLabels(formRef.current)
    setReport(next)
    if (!labelFixed) beforeSnapshotRef.current = snapshotFromAudit(next)
  }, [labelFixed])

  /**
   * 报告台账登记的是上面那次真实 DOM 检测的结果，而不是「修复按钮被点过」。
   * 首次挂载在台账已有记录时不覆盖，保证「修完再切去报告」不丢成果；
   * 重置 / 重新检测会带着新的检测结果重新写入。
   */
  useEffect(() => {
    if (report === null) return
    const isFirstSync = !ledgerSyncedRef.current
    ledgerSyncedRef.current = true
    if (isFirstSync && ledger.formLabel !== null) return

    dispatch({
      type: 'form-label:sync',
      record: deriveFormRecord({
        labelFixed,
        report,
        before: beforeSnapshotRef.current,
        beforeHtml: demoFormHtml(false),
        afterHtml: demoFormHtml(true),
      }),
    })
  }, [dispatch, labelFixed, ledger.formLabel, report])

  const handleRepair = () => {
    if (labelFixed) return
    setLabelFixed(true)
    setNotice('已把「姓名」换成与输入框正确关联的 label，检测将在新的 DOM 上重新运行。')
  }

  const handleReset = () => {
    setLabelFixed(false)
    setNotice('实验已重置：上方又回到「看得见文字、却没有关联标签」的初始状态。')
  }

  const handleReaudit = useCallback(() => {
    const next = auditFormLabels(formRef.current)
    setReport(next)
    setNotice(
      `已按当前真实 DOM 重新检测：检查 ${next.checkedControlCount} 个文本录入控件，发现 ${next.issueCount} 项问题。`,
    )
  }, [])

  const handleDemoSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNotice('演示表单没有提交：没有发出任何请求，你的输入也不会被保存。')
  }

  const handleCopy = async () => {
    const html = demoFormHtml(true)
    if (!navigator.clipboard?.writeText) {
      setNotice('当前浏览器不支持自动复制，请手动选中右侧「修复后」代码复制。')
      return
    }
    try {
      await navigator.clipboard.writeText(html)
      setNotice('已复制修复后的 HTML 代码。')
    } catch {
      setNotice('复制失败，请手动选中右侧「修复后」代码复制。')
    }
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
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">表单标签实验</h1>
        <p className="mt-3 text-base leading-relaxed text-slate-700">
          一个输入框在页面上「看起来有名字」，和辅助技术能不能真的读出这个名字，是两件不同的事。
          下面这个登记表单视觉上完全正常，检测结果却来自浏览器里真实的 DOM。
        </p>
      </header>

      <section
        aria-labelledby="intro-heading"
        className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 id="intro-heading" className="text-lg font-semibold tracking-tight text-slate-900">
          1. 看得见输入框，就真的知道该填什么吗？
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          视觉用户靠排版判断「这行字是给上面那个框的」；屏幕阅读器靠的是 DOM 里的
          <span className="font-mono text-indigo-900">label↔control</span> 关联。
          这层关联一旦缺失，读到输入框时只会被念出控件类型或 placeholder，
          不知道这里要填什么，也听不到后来才出现的错误提示。
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          还要分清两个不同的概念：
          <strong>「缺少关联的可见标签」</strong>说的是没有 <span className="font-mono">label</span> 指向这个控件；
          <strong>「完全没有可访问名称」</strong>说的是连 <span className="font-mono">aria-label</span>、
          <span className="font-mono">title</span>、placeholder 这类替代来源都没有。
          一个控件可能同时中招，也可能只有前一个问题——本页的检测结果会把两者分开显示。
          本次教学目标是原生可见 <span className="font-mono">label</span>，不是用
          <span className="font-mono">aria-label</span> 补救。
        </p>
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <section
          aria-labelledby="demo-heading"
          className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 id="demo-heading" className="text-lg font-semibold tracking-tight text-slate-900">
            2. 真实表单体验
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{DEMO_FORM_NOTICE}</p>

          <div className="mt-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
              教学示例 · {DEFECT_REGION_NOTICE}
            </p>

            <form ref={formRef} onSubmit={handleDemoSubmit} className="mt-3 space-y-4">
              <div>
                {labelFixed ? (
                  <label
                    htmlFor={NAME_FIELD.id}
                    className="block text-sm font-semibold text-slate-900"
                  >
                    {NAME_FIELD.caption}
                  </label>
                ) : (
                  <span className="block text-sm font-semibold text-slate-900">
                    {NAME_FIELD.caption}
                  </span>
                )}
                <input
                  id={NAME_FIELD.id}
                  type={NAME_FIELD.type}
                  placeholder={NAME_FIELD.placeholder}
                  autoComplete={NAME_FIELD.autoComplete}
                  className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor={EMAIL_FIELD.id}
                  className="block text-sm font-semibold text-slate-900"
                >
                  {EMAIL_FIELD.caption}
                </label>
                <input
                  id={EMAIL_FIELD.id}
                  type={EMAIL_FIELD.type}
                  placeholder={EMAIL_FIELD.placeholder}
                  autoComplete={EMAIL_FIELD.autoComplete}
                  className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-800"
              >
                提交登记（演示）
              </button>
            </form>

            <p className="mt-3 text-xs leading-relaxed text-amber-900">
              提示：可以用 Tab 键走到这两个输入框，留意读屏软件（或浏览器开发者工具的
              Accessibility 面板）报出的名称是否不同。不需要填写真实姓名或邮箱。
            </p>
          </div>
        </section>

        <section
          aria-labelledby="audit-heading"
          className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="audit-heading" className="text-lg font-semibold tracking-tight text-slate-900">
              3. 检测结果
            </h2>
            <button
              type="button"
              onClick={handleReaudit}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-indigo-700 hover:bg-indigo-50 hover:text-indigo-900"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              重新检测
            </button>
          </div>

          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            结论来自刚才那次对真实 DOM 的读取：程序遍历示例表单里的文本录入控件，检查
            <span className="font-mono">input.labels</span>、
            <span className="font-mono">label.htmlFor</span> 是否指向正确的
            <span className="font-mono">id</span>，以及关联标签是否真的有可见文字。
          </p>

          {report === null ? (
            <p className="mt-4 text-sm text-slate-600">正在读取浏览器中的真实 DOM…</p>
          ) : (
            <>
              <div
                className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ring-1 ring-inset ${
                  report.hasIssues
                    ? 'bg-red-50 text-red-900 ring-red-700/30'
                    : 'bg-emerald-50 text-emerald-900 ring-emerald-700/30'
                }`}
              >
                本次检查 {report.checkedControlCount} 个文本录入控件，发现 {report.issueCount} 项标签关联问题。
              </div>

              <ul className="mt-4 space-y-4">
                {report.rows.map((row) => (
                  <FieldResultRow key={row.controlId} row={row} />
                ))}
              </ul>

              {report.danglingLabels.length > 0 ? (
                <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 ring-1 ring-inset ring-amber-700/30">
                  还发现 {report.danglingLabels.length} 个 label 的 for 指向了作用域内不存在的控件：
                  {report.danglingLabels.map((label) => `「${label.text || '（空）'}」→ for="${label.htmlFor}"`).join('、')}
                </p>
              ) : null}
            </>
          )}

          <div className="mt-5 border-t border-slate-200 pt-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Info className="size-4 shrink-0 text-indigo-800" aria-hidden="true" />
              本实验检查什么、不检查什么
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              只检查示例表单里文本录入控件的<strong>程序化标签关联</strong>
              （对应 WCAG 2.2 的 1.3.1 信息与关系、3.3.2 标签或说明）。
              <span className="mt-1.5 block font-semibold text-slate-900">
                这里全部通过，只代表这几个控件有了正确关联的可见标签，不代表整个表单或整站符合 WCAG 2.2。
              </span>
            </p>

            <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
              <summary className="cursor-pointer rounded-lg px-2 py-3 text-sm font-semibold text-indigo-800">
                展开查看：本次没有检查的内容
              </summary>
              <ul className="mt-1.5 space-y-1.5 px-2 pb-1 text-sm leading-relaxed text-slate-700">
                <li>3.3.1 错误识别、3.3.3 错误建议：本示例没有真实的校验与报错逻辑。</li>
                <li>1.3.5 识别输入用途：只展示 autocomplete 属性，未对其做合规判定。</li>
                <li>
                  2.5.3 标签在名称内、4.1.2 名称角色值：仅检查 label 关联这一条路径，
                  未覆盖 aria-label 等替代命名方式的完整名称计算。
                </li>
                <li>
                  可见性只识别 hidden 属性、aria-hidden、行内 display:none 与 sr-only 约定；
                  不读取盒模型尺寸，因此不能发现被 CSS 位移或透明隐藏的标签。
                </li>
                <li>
                  键盘可达性、焦点顺序、实际朗读效果与真机辅助技术行为：需要真实读屏软件验证，本页不做代替。
                </li>
              </ul>
            </details>
          </div>
        </section>
      </div>

      <section
        aria-labelledby="fix-heading"
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 id="fix-heading" className="text-lg font-semibold tracking-tight text-slate-900">
          4. 修复与重新验证
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          点击修复会真正改变组件状态并重新渲染 DOM：那行文字从 <span className="font-mono">span</span> 变成带{' '}
          <span className="font-mono">htmlFor</span> 的 <span className="font-mono">label</span>，
          检测随后在新生成的 DOM 上重跑。已输入的内容不会被清掉。
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {labelFixed ? (
            <p className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 ring-1 ring-inset ring-emerald-700/30">
              <CircleCheckBig className="size-5 shrink-0" aria-hidden="true" />
              标签关联已修复（当前 DOM 使用 label + htmlFor）
            </p>
          ) : (
            <button
              type="button"
              onClick={handleRepair}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-800"
            >
              <WandSparkles className="size-4" aria-hidden="true" />
              修复标签关联
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

      <section
        aria-labelledby="code-heading"
        className="mt-6 min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 id="code-heading" className="text-lg font-semibold tracking-tight text-slate-900">
          5. 修复前后 HTML 对比
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          代码由本页实际使用的字段配置生成，<span className="font-mono">id</span> 与{' '}
          <span className="font-mono">for</span> 的值就是上方 DOM 里的真实值；为聚焦标签关联，
          省略了样式属性，也省略了字段外层的布局容器。高亮行是修复真正改动的部分。
        </p>

        <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
          {[
            { title: '修复前（缺陷示例）', fixed: false },
            { title: '修复后（正确关联）', fixed: true },
          ].map((column) => (
            <div key={column.title} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">{column.title}</h3>
              {column.fixed === labelFixed ? (
                <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-900">
                  <Check className="size-3.5 shrink-0" aria-hidden="true" />
                  与当前 DOM 一致
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-slate-600">
                  {column.fixed ? '尚未应用到上方表单，可复制后用于自己的项目。' : '上方表单当前使用的就是这一版。'}
                </p>
              )}
              <pre className="mt-3 min-w-0 overflow-x-auto rounded-xl bg-slate-900 px-4 py-3 text-xs leading-relaxed">
                <code>
                  {demoFormMarkup(column.fixed).map((line, index) => (
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
          ))}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-indigo-700 hover:text-indigo-900"
        >
          <Copy className="size-4" aria-hidden="true" />
          复制修复后的 HTML
        </button>
      </section>
    </div>
  )
}
