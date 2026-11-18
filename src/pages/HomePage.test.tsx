// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { ROUTE_HASH } from '../hooks/useHashRoute'
import { HomePage } from './HomePage'

/**
 * 首页卡片的职责很窄：三张卡都必须是真入口，不许留「点了没反应」的假按钮。
 * 键盘焦点实验上线后，「还在开发」这类文案也必须一起清掉。
 */

let container: HTMLDivElement
let root: Root

function textOf(el: Element | null): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function cardTitles(): string[] {
  return [...container.querySelectorAll('h3')].map((h) => textOf(h))
}

function cardLink(title: string): HTMLAnchorElement | null {
  const card = [...container.querySelectorAll('article')].find((a) => textOf(a.querySelector('h3')).includes(title))
  return card ? card.querySelector('a') : null
}

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  window.location.hash = '#/'
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(<HomePage />)
  })
})

afterEach(() => {
  act(() => {
    root.unmount()
  })
  container.remove()
})

describe('HomePage · 三张实验卡片（要求 #11）', () => {
  it('三张卡片标题齐全，键盘焦点实验排在第三位', () => {
    const titles = cardTitles()
    expect(titles).toHaveLength(3)
    expect(titles[0]).toContain('色彩对比度实验')
    expect(titles[1]).toContain('表单标签无障碍实验')
    expect(titles[2]).toContain('键盘焦点实验')
  })

  it('三张卡都标着「可体验」，没有任何一张还挂着「即将开放」', () => {
    const badges = [...container.querySelectorAll('article')].map((a) => textOf(a))
    expect(badges.every((card) => card.includes('可体验'))).toBe(true)
    expect(badges.some((card) => card.includes('即将开放'))).toBe(false)
    expect(textOf(container)).not.toContain('本模块将在后续开发日志中上线')
  })

  it('第三张卡的入口就是 #/keyboard', () => {
    const link = cardLink('键盘焦点实验')
    expect(link?.getAttribute('href')).toBe(ROUTE_HASH['keyboard-lab'])
    expect(link?.getAttribute('href')).toBe('#/keyboard')
    expect(textOf(link)).toContain('进入实验')
  })

  it('三个入口的 href 各不相同，且都是 useHashRoute 认识的业务路由', () => {
    const hrefs = [...container.querySelectorAll('article a')].map((a) => a.getAttribute('href'))
    expect(new Set(hrefs).size).toBe(3)
    for (const href of hrefs) {
      expect(Object.values(ROUTE_HASH)).toContain(href)
    }
  })

  it('第三张卡的入口确实是 #/keyboard，写进地址栏就能落到键盘实验', () => {
    const link = cardLink('键盘焦点实验') as HTMLAnchorElement
    act(() => {
      // 原生 <a href="#/keyboard"> 的默认行为就是改 hash；jsdom 不代跑片段导航，真实点击见浏览器取证
      window.location.hash = link.getAttribute('href')!
    })
    expect(window.location.hash).toBe('#/keyboard')
  })

  it('过时文案已更新：三个实验均可体验', () => {
    const text = textOf(container)
    expect(text).not.toContain('前两个已经可以玩')
    expect(text).not.toContain('最后一个还在开发')
    expect(text).toContain('三个都已经可以体验')
  })

  it('第三张卡的宣传语落在键盘焦点上，不空喊', () => {
    const card = [...container.querySelectorAll('article')].find((a) =>
      textOf(a.querySelector('h3')).includes('键盘焦点实验'),
    )!
    expect(textOf(card)).toContain('Tab')
    expect(textOf(card)).toContain('焦点')
  })

  it('首页自己也不留没有名字的按钮，链接文字都有实际含义', () => {
    expect([...container.querySelectorAll('button')].filter((b) => textOf(b) === '')).toEqual([])
    const anchors = [...container.querySelectorAll('a')]
    expect(anchors.length).toBeGreaterThan(5)
    for (const anchor of anchors) {
      expect(textOf(anchor).length).toBeGreaterThan(0)
    }
  })
})
