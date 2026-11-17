import { Accessibility } from 'lucide-react'

import { ROUTE_HASH, type Route } from '../hooks/useHashRoute'

const NAV_ITEMS: Array<{ route: Route; label: string }> = [
  { route: 'home', label: '首页' },
  { route: 'contrast-lab', label: '色彩对比度实验' },
  { route: 'form-label-lab', label: '表单标签实验' },
]

interface AppHeaderProps {
  currentRoute: Route
}

export function AppHeader({ currentRoute }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <a
          href={ROUTE_HASH.home}
          className="flex items-center gap-2.5 rounded-md text-indigo-800 no-underline"
        >
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-indigo-700 text-white"
          >
            <Accessibility className="size-5" strokeWidth={2.2} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-lg font-semibold tracking-tight">AccessLab</span>
            <span className="text-xs font-medium text-slate-600">无障碍实验室</span>
          </span>
        </a>

        <nav aria-label="主导航">
          <ul className="flex flex-wrap items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = item.route === currentRoute
              return (
                <li key={item.route}>
                  <a
                    href={ROUTE_HASH[item.route]}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium no-underline transition-colors sm:min-h-9 ${
                      active
                        ? 'bg-indigo-50 text-indigo-900 underline decoration-2 underline-offset-4'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-indigo-900'
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </header>
  )
}
