import { useEffect, useState } from 'react'

export type Route = 'home' | 'contrast-lab' | 'form-label-lab' | 'keyboard-lab' | 'report'

export const ROUTE_HASH: Record<Route, string> = {
  home: '#/',
  'contrast-lab': '#/contrast',
  'form-label-lab': '#/form-label',
  'keyboard-lab': '#/keyboard',
  report: '#/report',
}

const HASH_TO_ROUTE: Record<string, Route> = {
  '': 'home',
  '#': 'home',
  '#/': 'home',
  '#/contrast': 'contrast-lab',
  '#/form-label': 'form-label-lab',
  '#/keyboard': 'keyboard-lab',
  '#/report': 'report',
}

/**
 * 只有上表中的 hash 才是业务路由。
 * 页内锚点（#main、#experiments 等）返回 null，交由调用方保持当前页面。
 */
export function routeFromHash(hash: string): Route | null {
  return HASH_TO_ROUTE[hash] ?? null
}

/** hash 变化时的路由迁移规则：非路由 hash 不改变当前业务路由 */
export function nextRoute(current: Route, hash: string): Route {
  return routeFromHash(hash) ?? current
}

function readRoute(): Route {
  return routeFromHash(window.location.hash) ?? 'home'
}

/**
 * 两个页面的静态站点使用 hash 路由，
 * 这样刷新 /#/contrast 不依赖服务端的 SPA rewrite。
 */
export function useHashRoute(): Route {
  const [route, setRoute] = useState(readRoute)

  useEffect(() => {
    const handleHashChange = () =>
      setRoute((current) => nextRoute(current, window.location.hash))
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return route
}
