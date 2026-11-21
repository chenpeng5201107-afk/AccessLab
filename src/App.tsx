import { useEffect, useReducer, useRef } from 'react'

import { AppHeader } from './components/AppHeader'
import { ExperimentLedgerProvider } from './context/ExperimentLedgerContext'
import { ROUTE_HASH, useHashRoute, type Route } from './hooks/useHashRoute'
import { ContrastLabPage } from './pages/ContrastLabPage'
import { FormLabelLabPage } from './pages/FormLabelLabPage'
import { HomePage } from './pages/HomePage'
import { KeyboardFocusLabPage } from './pages/KeyboardFocusLabPage'
import { ReportPage } from './pages/ReportPage'
import { StudyPage } from './pages/StudyPage'
import { newStudy, studyReducer } from './lib/study'
import './study.css'
import './observatory.css'

const PAGE_TITLES: Record<Route, string> = {
  home: 'AccessLab｜无障碍实验室',
  diagnosis: '校园初诊｜AccessLab',
  transfer: '图书馆迁移测验｜AccessLab',
  'contrast-lab': '色彩对比度实验｜AccessLab 无障碍实验室',
  'form-label-lab': '表单标签实验｜AccessLab 无障碍实验室',
  'keyboard-lab': '键盘焦点实验｜AccessLab 无障碍实验室',
  report: '统一成果报告｜AccessLab 无障碍实验室',
}

function AppShell() {
  const route = useHashRoute()
  const [study, dispatchStudy] = useReducer(studyReducer, undefined, newStudy)
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
    <div className="flex min-h-dvh flex-col" data-page={route}>
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

      <AppHeader key={route} currentRoute={route} />

      <main id="main" ref={mainRef} tabIndex={-1} className="grow">
        {route.endsWith('-lab') && study.campus.submitted && (
          <aside className="study-return">
            <span>修复后回到案例，试试效果。</span>
            <a href={ROUTE_HASH.diagnosis}>返回校园案例 →</a>
            {study.library.submitted && <a href={ROUTE_HASH.report}>回到学习报告 →</a>}
          </aside>
        )}
        {route === 'diagnosis' || route === 'transfer' ? (
          <StudyPage
            key={route}
            id={route === 'diagnosis' ? 'campus' : 'library'}
            study={study}
            dispatch={dispatchStudy}
          />
        ) : route === 'contrast-lab' ? (
          <ContrastLabPage returnToCase={study.campus.submitted} />
        ) : route === 'form-label-lab' ? (
          <FormLabelLabPage returnToCase={study.campus.submitted} />
        ) : route === 'keyboard-lab' ? (
          <KeyboardFocusLabPage returnToCase={study.campus.submitted} />
        ) : route === 'report' ? (
          <ReportPage study={study} onClearStudy={() => dispatchStudy({ type: 'clear' })} />
        ) : (
          <HomePage />
        )}
      </main>

      <footer className="closing site-foot border-t border-slate-200 bg-white">
        <div className="wrap mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>AccessLab 无障碍实验室 <span className="footer-track">· Hack4Good · 技术向善</span></p>
        </div>
      </footer>
    </div>
  )
}

/**
 * 台账挂在路由与页面之上：换页面不会丢掉本次会话已登记的成果，
 * 刷新页面则回到空台账（内存 only，没有任何持久化）。
 */
export default function App() {
  return (
    <ExperimentLedgerProvider>
      <AppShell />
    </ExperimentLedgerProvider>
  )
}
