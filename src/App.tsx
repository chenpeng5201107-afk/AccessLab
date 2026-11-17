import { useEffect, useRef } from 'react'

import { AppHeader } from './components/AppHeader'
import { useHashRoute, type Route } from './hooks/useHashRoute'
import { ContrastLabPage } from './pages/ContrastLabPage'
import { FormLabelLabPage } from './pages/FormLabelLabPage'
import { HomePage } from './pages/HomePage'

const PAGE_TITLES: Record<Route, string> = {
  home: 'AccessLab｜无障碍实验室',
  'contrast-lab': '色彩对比度实验｜AccessLab 无障碍实验室',
  'form-label-lab': '表单标签实验｜AccessLab 无障碍实验室',
}

export default function App() {
  const route = useHashRoute()
  const mainRef = useRef<HTMLElement>(null)
  const lastRouteRef = useRef<Route>(route)

  useEffect(() => {
    document.title = PAGE_TITLES[route]
    if (lastRouteRef.current === route) return
    lastRouteRef.current = route
    // 单页路由切换不会触发浏览器朗读新页面，把焦点交给主内容区
    mainRef.current?.focus()
    window.scrollTo({ top: 0 })
  }, [route])

  return (
    <div className="flex min-h-dvh flex-col">
      {/* 拦截默认 hash 跳转：本应用用 hash 路由，跳到 #main 会被当成未知路由而把用户踢回首页 */}
      <a
        href="#main"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('main')?.focus()
        }}
        className="sr-only rounded-lg bg-indigo-700 px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-30"
      >
        跳转到主要内容
      </a>

      <AppHeader currentRoute={route} />

      <main id="main" ref={mainRef} tabIndex={-1} className="grow outline-none">
        {route === 'contrast-lab' ? (
          <ContrastLabPage />
        ) : route === 'form-label-lab' ? (
          <FormLabelLabPage />
        ) : (
          <HomePage />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            AccessLab 无障碍实验室 · 让每个人都能更轻松地使用互联网。
          </p>
          <p>
            对比度依据 WCAG 2.2 相对亮度算法实时计算 · 仅覆盖单条成功标准 · 纯前端，无数据库
          </p>
        </div>
      </footer>
    </div>
  )
}
