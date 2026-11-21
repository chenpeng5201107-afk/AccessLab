import { useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'

import { ROUTE_HASH, type Route } from '../hooks/useHashRoute'

const NAV_ITEMS: Array<{ route: Route; label: string }> = [
  { route: 'home', label: '首页' },
  { route: 'diagnosis', label: '案例学习' },
  { route: 'contrast-lab', label: '色彩对比度实验' },
  { route: 'form-label-lab', label: '表单标签实验' },
  { route: 'keyboard-lab', label: '键盘焦点实验' },
  { route: 'report', label: '成果报告' },
]

interface AppHeaderProps {
  currentRoute: Route
}

export function AppHeader({ currentRoute }: AppHeaderProps) {
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  function closeMenu() {
    if (!open) return
    setOpen(false)
    toggleRef.current?.focus()
  }
  return (
    <header
      className="nav nav-centre site-header sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur"
      onKeyDown={(event) => {
        if (event.key === 'Escape') closeMenu()
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <div className="wrap nav-shell">
        <a
          href={ROUTE_HASH.home}
          onClick={closeMenu}
          className="flex min-h-11 items-center gap-2.5 rounded-md text-indigo-800 no-underline"
        >
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-indigo-700 text-white"
          >
            <img src={import.meta.env.BASE_URL + 'favicon.svg'} width="36" height="36" alt="" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-lg font-semibold tracking-tight">AccessLab</span>
            <span className="text-xs font-medium text-slate-600">无障碍实验室</span>
          </span>
        </a>

        <button
          type="button"
          ref={toggleRef}
          className="nav-toggle"
          aria-controls="site-nav"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />} 导航
        </button>
        <nav id="site-nav" data-open={open} aria-label="主导航">
          <ul className="flex flex-wrap items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active =
                item.route === currentRoute || (item.route === 'diagnosis' && currentRoute === 'transfer')
              return (
                <li key={item.route}>
                  <a
                    href={ROUTE_HASH[item.route]}
                    onClick={closeMenu}
                    aria-current={active ? (currentRoute === 'transfer' ? 'location' : 'page') : undefined}
                    className={`flex min-h-11 items-center rounded-lg px-2.5 py-2 text-sm font-medium no-underline transition-colors sm:px-3 ${
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
