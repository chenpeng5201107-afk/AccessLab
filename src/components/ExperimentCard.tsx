import { ArrowRight, type LucideIcon } from 'lucide-react'

interface ExperimentCardProps {
  title: string
  summary: string
  icon: LucideIcon
  href: string
}

export function ExperimentCard({ title, summary, icon: Icon, href }: ExperimentCardProps) {
  return (
    <article className="experiment-card">
      <a href={href} className="experiment-link" aria-label={'进入实验 · ' + title}>
        <div className="experiment-preview" aria-hidden="true">
          {href === '#/contrast' ? (
            <div className="contrast-fragment">
              <i>Aa</i>
              <i>Aa</i>
            </div>
          ) : href === '#/form-label' ? (
            <div className="form-fragment">
              <code>&lt;label&gt;</code>
              <span>
                姓名
                <i />
              </span>
            </div>
          ) : (
            <div className="key-fragment">
              <kbd>Tab</kbd>
              <b>→</b>
              <kbd>↵</kbd>
            </div>
          )}
        </div>
        <span aria-hidden="true" className="experiment-icon">
          <Icon size={16} strokeWidth={1.8} />
        </span>
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">
            <span className="sr-only">进入实验 · </span>
            {title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{summary}</p>
        </div>
        <ArrowRight aria-hidden="true" className="experiment-arrow size-4" />
      </a>
    </article>
  )
}
