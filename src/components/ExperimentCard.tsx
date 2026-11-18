import { ArrowRight, type LucideIcon } from 'lucide-react'

interface ExperimentCardProps {
  index: number
  title: string
  summary: string
  icon: LucideIcon
  status: 'available' | 'upcoming'
  /** 仅在 status 为 available 时提供 */
  href?: string
}

export function ExperimentCard({
  index,
  title,
  summary,
  icon: Icon,
  status,
  href,
}: ExperimentCardProps) {
  const available = status === 'available'

  return (
    <article
      className={`flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm transition-colors ${
        available ? 'border-slate-200 hover:border-indigo-300' : 'border-dashed border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden="true"
          className={`grid size-11 shrink-0 place-items-center rounded-xl ${
            available ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'
          }`}
        >
          <Icon className="size-6" strokeWidth={2} />
        </span>
        {available ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-700/25 ring-inset">
            可体验
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-500/30 ring-inset">
            即将开放
          </span>
        )}
      </div>

      <h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-900">
        <span aria-hidden="true" className="mr-2 font-mono text-sm text-slate-500">
          {String(index).padStart(2, '0')}
        </span>
        {title}
      </h3>
      <p className="mt-2 grow text-sm leading-relaxed text-slate-700">{summary}</p>

      {available && href ? (
        <a
          href={href}
          className="mt-5 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white no-underline transition-colors hover:bg-indigo-800"
        >
          进入实验
          {/* 三张卡的可见文字相同，读屏逐条列表时要能分清进的是哪一个实验 */}
          <span className="sr-only"> · {title}</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      ) : (
        <p className="mt-5 text-sm font-medium text-slate-500">本模块将在后续开发日志中上线。</p>
      )}
    </article>
  )
}
