import { useEffect, useState } from 'react'

export type Route = 'home' | 'contrast-lab'

export const ROUTE_HASH: Record<Route, string> = {
  home: '#/',
  'contrast-lab': '#/contrast',
}

const HASH_TO_ROUTE: Record<string, Route> = {
  '': 'home',
  '#': 'home',
  '#/': 'home',
  '#/contrast': 'contrast-lab',
}

function readRoute(): Route {
  return HASH_TO_ROUTE[window.location.hash] ?? 'home'
}

/**
 * 两个页面的静态站点使用 hash 路由，
 * 这样刷新 /#/contrast 不依赖服务端的 SPA rewrite。
 */
export function useHashRoute(): Route {
  const [route, setRoute] = useState(readRoute)

  useEffect(() => {
    const handleHashChange = () => setRoute(readRoute())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return route
}
