import { describe, expect, it } from 'vitest'

import { ROUTE_HASH, nextRoute, routeFromHash, type Route } from './useHashRoute'

describe('routeFromHash', () => {
  it('识别业务路由 hash', () => {
    expect(routeFromHash('')).toBe('home')
    expect(routeFromHash('#')).toBe('home')
    expect(routeFromHash('#/')).toBe('home')
    expect(routeFromHash('#/contrast')).toBe('contrast-lab')
    expect(routeFromHash('#/form-label')).toBe('form-label-lab')
    expect(routeFromHash('#/keyboard')).toBe('keyboard-lab')
    expect(routeFromHash('#/report')).toBe('report')
  })

  it('每个路由自己的 hash 都能解析回该路由', () => {
    // 直接取 ROUTE_HASH 的键：新增路由忘了登记映射表时，这里会立刻失败
    for (const route of Object.keys(ROUTE_HASH) as Route[]) {
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
    expect(nextRoute('home', ROUTE_HASH['form-label-lab'])).toBe('form-label-lab')
    expect(nextRoute('contrast-lab', ROUTE_HASH['form-label-lab'])).toBe('form-label-lab')
    expect(nextRoute('form-label-lab', ROUTE_HASH['contrast-lab'])).toBe('contrast-lab')
    expect(nextRoute('home', ROUTE_HASH['keyboard-lab'])).toBe('keyboard-lab')
    expect(nextRoute('form-label-lab', ROUTE_HASH['keyboard-lab'])).toBe('keyboard-lab')
    expect(nextRoute('keyboard-lab', ROUTE_HASH['contrast-lab'])).toBe('contrast-lab')
    expect(nextRoute('keyboard-lab', ROUTE_HASH.home)).toBe('home')
  })

  it('表单实验页激活「跳转到主要内容」或区块锚点后仍停留在本页', () => {
    expect(nextRoute('form-label-lab', '#main')).toBe('form-label-lab')
    expect(nextRoute('form-label-lab', '#experiments')).toBe('form-label-lab')
  })

  it('键盘实验页激活「跳转到主要内容」或区块锚点后仍停留在本页', () => {
    expect(nextRoute('keyboard-lab', '#main')).toBe('keyboard-lab')
    expect(nextRoute('keyboard-lab', '#experiments')).toBe('keyboard-lab')
  })

  it('未知 hash 不会把实验页重置为首页', () => {
    expect(nextRoute('contrast-lab', '#/typo')).toBe('contrast-lab')
    expect(nextRoute('form-label-lab', '#/typo')).toBe('form-label-lab')
    expect(nextRoute('keyboard-lab', '#/typo')).toBe('keyboard-lab')
    expect(nextRoute('contrast-lab', '#')).toBe('home')
  })
})
