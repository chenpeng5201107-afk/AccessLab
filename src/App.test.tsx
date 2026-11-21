// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import App from './App'
import { ROUTE_HASH } from './hooks/useHashRoute'

/**
 * 外壳层：路由接线、页面标题、skip link，以及「实验样式不许漏到平台外壳」这条底线。
 *
 * jsdom 不实现浏览器历史栈，所以「前进 / 后退」在这里测的是 hashchange 处理器对
 * 地址变化的反应（浏览器就是靠它驱动本应用的路由）；真实的后 / 退按钮行为在 DEVLOG
 * 记录的真实浏览器取证里核对。
 */

let container: HTMLDivElement
let root: Root

function textOf(el: Element | null): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function heading(): string {
  return textOf(document.querySelector('main h1'))
}

function goto(hash: string) {
  act(() => {
    window.location.hash = hash
  })
  act(() => {
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  window.location.hash = '#/'
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(<App />)
  })
})

afterEach(() => {
  act(() => {
    root.unmount()
  })
  container.remove()
  window.location.hash = '#/'
})

describe('App · 直接打开 #/keyboard（要求 #12）', () => {
  it('深链进实验页，标题也换成键盘焦点实验', () => {
    // React 19 不允许重渲染已卸载的 root：深链要「一开始就停在 #/keyboard」，只能重建一棵子树
    act(() => {
      root.unmount()
    })
    window.location.hash = '#/keyboard'
    act(() => {
      root = createRoot(container)
      root.render(<App />)
    })

    expect(heading()).toBe('键盘焦点实验')
    expect(document.title).toBe('键盘焦点实验｜AccessLab 无障碍实验室')
    expect(container.querySelectorAll('button#kf-view-details')).toHaveLength(1)
  })

  it('其余三条路由各自的标题没有被键盘实验挤掉', () => {
    expect(heading()).toBe('让网页的障碍，看得见、改得掉。')

    goto('#/contrast')
    expect(heading()).toBe('色彩对比度实验')
    expect(document.title).toBe('色彩对比度实验｜AccessLab 无障碍实验室')

    goto('#/form-label')
    expect(heading()).toBe('表单标签实验')
    expect(document.title).toBe('表单标签实验｜AccessLab 无障碍实验室')

    goto('#/')
    expect(document.title).toBe('AccessLab｜无障碍实验室')
  })
})

describe('App · hashchange 驱动的前进后退（要求 #13）', () => {
  it('首页 → 键盘实验 → 色彩实验 → 回退到键盘实验，每次都渲染对的页面', () => {
    goto('#/keyboard')
    expect(heading()).toBe('键盘焦点实验')

    goto('#/contrast')
    expect(heading()).toBe('色彩对比度实验')

    goto('#/keyboard')
    expect(heading()).toBe('键盘焦点实验')

    goto('#/')
    expect(heading()).not.toBe('键盘焦点实验')
  })

  it('三个实验都能在 hash 路由下独立进入，互不残留', () => {
    goto('#/contrast')
    expect(container.textContent).toContain('1. 调整颜色')

    goto('#/form-label')
    expect(container.textContent).not.toContain('1. 调整颜色')
    expect(container.textContent).toContain('试用登记表')

    goto('#/keyboard')
    expect(container.textContent).not.toContain('试用登记表')
    expect(container.textContent).toContain('试用馆藏工具')
  })

  it('typo hash 不会把键盘实验踢回首页', () => {
    goto('#/keyboard')
    goto('#/typo')
    expect(heading()).toBe('键盘焦点实验')
  })
})

describe('App · 跳转到主要内容（要求 #13）', () => {
  it('在键盘实验页激活 skip link，停在原地且焦点交给 main', () => {
    goto('#/keyboard')

    const skip = [...document.querySelectorAll('a')].find((a) => textOf(a) === '跳转到主要内容')!
    act(() => {
      skip.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })

    expect(heading()).toBe('键盘焦点实验')
    expect(document.activeElement).toBe(document.getElementById('main'))
    // 默认行为被拦下，hash 不会变成 #main（那会被当成未知路由）
    expect(window.location.hash).toBe('#/keyboard')
  })

  it('skip link 仍指向 #main，且每个实验页都带着完整外壳', () => {
    for (const hash of ['#/', '#/diagnosis', '#/contrast', '#/form-label', '#/keyboard', '#/report']) {
      goto(hash)
      expect(document.querySelector('a[href="#main"]')).toBeTruthy()
      expect(document.querySelector('header nav')).toBeTruthy()
      expect(document.querySelector('main#main[tabindex="-1"]')).toBeTruthy()
      expect(document.querySelector('footer')).toBeTruthy()
    }
  })
})

describe('App · 导航与样式边界（要求 #11 #14）', () => {
  it('主导航列出六个入口，键盘焦点实验与成果报告都在里面', () => {
    const labels = [...document.querySelectorAll('header nav a')].map((a) => textOf(a))
    expect(labels).toEqual(['首页', '案例学习', '色彩对比度实验', '表单标签实验', '键盘焦点实验', '成果报告'])

    goto('#/keyboard')
    const active = document.querySelector('header nav a[aria-current="page"]')
    expect(textOf(active)).toBe('键盘焦点实验')
    expect(active?.getAttribute('href')).toBe(ROUTE_HASH['keyboard-lab'])
  })

  it('实验注入的样式只命中 kf-demo-btn，不碰外壳的选择器', () => {
    goto('#/keyboard')
    const sheet = document.querySelector('style[data-keyboard-focus-demo]')!.textContent ?? ''

    expect(sheet).toContain('.kf-demo-btn--broken:focus-visible')
    expect(sheet).not.toMatch(/^\s*:focus-visible\s*\{/m)
    expect(sheet).not.toMatch(/^\s*a\s*\{/m)
    expect(sheet).not.toMatch(/^\s*button\s*\{/m)
    expect(sheet).not.toMatch(/\b(header|nav|main|footer)\b/)
  })

  it('离开键盘实验后，页面里不留残余的实验样式节点', () => {
    goto('#/keyboard')
    expect(document.querySelectorAll('style[data-keyboard-focus-demo]')).toHaveLength(1)

    goto('#/')
    expect(document.querySelectorAll('style[data-keyboard-focus-demo]')).toHaveLength(0)
    expect(document.querySelector('button#kf-view-details')).toBeNull()
  })
})
