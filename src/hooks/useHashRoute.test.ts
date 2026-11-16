import { describe, expect, it } from 'vitest'

import { ROUTE_HASH, nextRoute, routeFromHash, type Route } from './useHashRoute'

describe('routeFromHash', () => {
  it('识别业务路由 hash', () => {
    expect(routeFromHash('')).toBe('home')
    expect(routeFromHash('#')).toBe('home')
    expect(routeFromHash('#/')).toBe('home')
    expect(routeFromHash('#/contrast')).toBe('contrast-lab')
  })

  it('每个路由自己的 hash 都能解析回该路由', () => {
    const routes: Route[] = ['home', 'contrast-lab']
    for (const route of routes) {
      expect(routeFromHash(ROUTE_HASH[route])).toBe(route)
    }
  })

  it('页内锚点与未知 hash 不算业务路由', () => {
    // #main 是「跳转到主要内容」的目标，#experiments 是首页的区块锚点
    expect(routeFromHash('#main')).toBeNull()
    expect(routeFromHash('#experiments')).toBeNull()
    expect(routeFromHash('#/does-not-exist')).toBeNull()
    expect(routeFromHash('#nonsense')).toBeNull()
  })
})

describe('nextRoute（P1 回归：跳转主内容不得改变业务路由）', () => {
  it('实验页激活「跳转到主要内容」后仍停留在实验页', () => {
    expect(nextRoute('contrast-lab', '#main')).toBe('contrast-lab')
  })

  it('首页激活跳转链接后仍停留在首页', () => {
    expect(nextRoute('home', '#main')).toBe('home')
  })

  it('首页点击区块锚点后仍停留在首页', () => {
    expect(nextRoute('home', '#experiments')).toBe('home')
  })

  it('路由之间的正常跳转仍然生效', () => {
    expect(nextRoute('home', ROUTE_HASH['contrast-lab'])).toBe('contrast-lab')
    expect(nextRoute('contrast-lab', ROUTE_HASH.home)).toBe('home')
  })

  it('未知 hash 不会把实验页重置为首页', () => {
    expect(nextRoute('contrast-lab', '#/typo')).toBe('contrast-lab')
    expect(nextRoute('contrast-lab', '#')).toBe('home')
  })
})
