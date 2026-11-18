import { ArrowRight } from 'lucide-react'

interface NextStepCardProps {
  headingId: string
  /** 「下一步：……」一句把要解决的问题说清楚 */
  title: string
  description: string
  href: string
  linkLabel: string
}

/**
 * 三个实验结尾共用同一种「下一步」区块：只是一个链接，不自动跳转，
 * 也不判断上一个实验做到哪一步——评委随时可以停下或跳走。
 */
export function NextStepCard({ headingId, title, description, href, linkLabel }: NextStepCardProps) {
  return (
    <section
      aria-labelledby={headingId}
      className="mt-6 min-w-0 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5"
    >
      <h2 id={headingId} className="text-lg font-semibold tracking-tight text-slate-900">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">{description}</p>
      <a
        href={href}
        className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white no-underline transition-colors hover:bg-indigo-800"
      >
        {linkLabel}
        <ArrowRight className="size-4" aria-hidden="true" />
      </a>
    </section>
  )
}
