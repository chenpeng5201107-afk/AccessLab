// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import App from './App'
import { REVERIFIED_HELP, UNCHECKED_SCOPE } from './lib/reportModel'
import { BASE_CLASS } from './lib/keyboardFocusDemo'

/**
 * Day 6：产品体验与视觉精修的回归网。
 *
 * 这里只测精修最容易碰坏的三件事：动线接得上、口径说得清、检测算法没被改坏。
 * 渲染的是完整 App（外壳 + hash 路由 + 会话台账），靠真实点击走完
 * 首页 → 色彩 → 表单 → 键盘 → 报告，再比对报告页与导出的 Markdown 用的是不是同一套说法。
 * jsdom 不代跑片段导航，所以下一步入口测的是「链接指向对的路由」与路由切换后的真实结果。
 */

let container: HTMLDivElement
let root: Root

function squeeze(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function mainText(): string {
  return squeeze(document.querySelector('main')?.textContent ?? '')
}

function heading(): string {
  return squeeze(document.querySelector('main h1')?.textContent ?? '')
}

function buttonByLabel(label: string): HTMLButtonElement {
  const button = [...document.querySelectorAll('button')].find(
    (el) => squeeze(el.textContent ?? '') === label,
  )
  expect(button, `当前页面应有按钮「${label}」`).toBeTruthy()
  return button as HTMLButtonElement
}

function linkByText(label: string): HTMLAnchorElement {
  const link = [...document.querySelectorAll('a')].find((el) => squeeze(el.textContent ?? '') === label)
  expect(link, `当前页面应有链接「${label}」`).toBeTruthy()
  return link as HTMLAnchorElement
}

function click(el: HTMLElement) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  })
}

function goto(hash: string) {
  act(() => {
    window.location.hash = hash
  })
  act(() => {
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

/** 与真实键盘一致的顺序：先有 Tab 的 keydown，焦点才落到按钮上 */
function pressTabThenFocus(button: HTMLButtonElement) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
  })
  act(() => {
    button.focus()
  })
  act(() => {
    button.blur()
  })
}

function demoButtons(): HTMLButtonElement[] {
  return [...document.querySelectorAll<HTMLButtonElement>(`button.${BASE_CLASS}`)]
}

/** dt / dd 是两个节点，拼进 textContent 不带空格：要读具体数值就直接取 dd */
function readout(label: string): string {
  const dt = [...document.querySelectorAll('dt')].find((el) => squeeze(el.textContent ?? '') === label)
  const dd = dt?.parentElement?.querySelector('dd') ?? null
  expect(dd, `报告里应有「${label}」这一行读数`).toBeTruthy()
  return squeeze(dd!.textContent ?? '')
}

/** 三个实验页结尾共用的「下一步」区块 */
function nextStepSection(): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>('main section')].find((section) =>
    section.querySelector('h2')?.textContent?.startsWith('下一步：'),
  )
}

function sectionTitle(section: Element | null | undefined): string {
  return squeeze(section?.querySelector('h2')?.textContent ?? '')
}

/** 实验页另有实时读数用 role="status"，所以按文字找回那一轮的操作提示 */
function noticeByPrefix(prefix: string): HTMLElement {
  const node = [...document.querySelectorAll<HTMLElement>('[role="status"]')].find((el) =>
    squeeze(el.textContent ?? '').startsWith(prefix),
  )
  expect(node, `页面应有以「${prefix}」开头的操作提示`).toBeTruthy()
  return node as HTMLElement
}

function runContrastLab() {
  click(buttonByLabel('生成修复建议'))
  click(buttonByLabel('应用该修复'))
}

function runFormLab() {
  click(buttonByLabel('修复标签关联'))
}

function runKeyboardLab() {
  demoButtons().forEach(pressTabThenFocus)
  click(buttonByLabel('修复焦点指示'))
  demoButtons().forEach(pressTabThenFocus)
  click(buttonByLabel('我已完成观察'))
}

function runAllThreeLabs() {
  goto('#/contrast')
  runContrastLab()
  goto('#/form-label')
  runFormLab()
  goto('#/keyboard')
  runKeyboardLab()
  goto('#/report')
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
  vi.restoreAllMocks()
  Reflect.deleteProperty(navigator, 'clipboard')
})

describe('Day 6 · 任务 A1 首页首屏：10 秒讲清价值', () => {
  it('只有一个主行动按钮，指向第一个实验；次要入口明显更轻', () => {
    const anchors = [...document.querySelectorAll('main a')]
    const primary = anchors.filter((a) => (a.className ?? '').includes('text-base font-bold'))
    expect(primary).toHaveLength(1)
    expect(squeeze(primary[0].textContent ?? '')).toContain('开始第一个实验')
    expect(primary[0].getAttribute('href')).toBe('#/contrast')

    const secondary = linkByText('查看另外两个实验')
    expect(secondary.className).toContain('text-sm')
    expect(secondary.className).not.toContain('bg-indigo-700')
  })

  it('首屏用「给谁用 / 解决什么 / 怎么体验」三行回答，且没有夸大结论', () => {
    const terms = [...document.querySelectorAll('main dl dt')].map((dt) => squeeze(dt.textContent ?? ''))
    expect(terms.slice(0, 3)).toEqual(['给谁用', '解决什么', '怎么体验'])
    expect(mainText()).toContain('三个动手实验')
    expect(mainText()).not.toMatch(/100%|完全合规|全部通过|所有问题/)
  })

  it('对比预览把判定依据写出来：WCAG 2.2 SC 1.4.3 的 4.5:1，而不是一句「对比度不足」', () => {
    expect(mainText()).toContain('修复前')
    expect(mainText()).toContain('修复后')
    expect(mainText()).toContain('未达 AA')
    expect(mainText()).toContain('达到 AA')
    expect(mainText()).toContain('4.48:1')
    expect(mainText()).toContain('4.54:1')
    expect(mainText()).toContain('判定依据')
    expect(mainText()).toContain('1.4.3')
    expect(mainText()).toContain('4.5:1')
  })

  it('三张实验卡片结构一致：同一个图标容器、一个 h3、一个够大的进入链接', () => {
    const cards = [...document.querySelectorAll('main article')]
    expect(cards).toHaveLength(3)
    for (const card of cards) {
      expect(card.querySelectorAll('h3')).toHaveLength(1)
      expect(card.className).toContain('p-5')
      expect(card.querySelector('span[aria-hidden="true"].size-11')).toBeTruthy()
      expect(card.querySelector('a[href^="#/"].min-h-11')).toBeTruthy()
      // 摘要一句话说完，评委扫得动；同时不超过科学表述的长度上限
      expect(card.querySelector('p')!.textContent!.length).toBeLessThanOrEqual(40)
    }
    expect(cards.map((card) => card.querySelector('a')!.getAttribute('href'))).toEqual([
      '#/contrast',
      '#/form-label',
      '#/keyboard',
    ])
  })
})

describe('Day 6 · 任务 B 三分钟动线', () => {
  it('色彩实验结尾只有一个下一步区块，标题与入口都指向表单标签实验', () => {
    goto('#/contrast')
    const section = nextStepSection()
    expect(section).toBeTruthy()
    expect([...document.querySelectorAll('main section')].filter((s) => s.querySelector('h2')?.textContent?.startsWith('下一步：'))).toHaveLength(1)
    expect(sectionTitle(section)).toBe('下一步：让输入框拥有正确的标签')
    expect(linkByText('进入表单标签实验').getAttribute('href')).toBe('#/form-label')
  })

  it('表单实验结尾的下一步指向键盘焦点实验', () => {
    goto('#/form-label')
    expect(sectionTitle(nextStepSection())).toBe('下一步：体验键盘焦点')
    expect(linkByText('进入键盘焦点实验').getAttribute('href')).toBe('#/keyboard')
  })

  it('键盘实验仍只有原来那个「查看统一成果报告」入口，没有多出第二个', () => {
    goto('#/keyboard')
    const reportLinks = [...document.querySelectorAll('main a')].filter((a) =>
      squeeze(a.textContent ?? '').includes('查看统一成果报告'),
    )
    expect(reportLinks).toHaveLength(1)
    expect(reportLinks[0].getAttribute('href')).toBe('#/report')
    expect(sectionTitle(nextStepSection())).toBe('下一步：查看统一成果报告')
  })

  it('下一步区块只是一个链接：没有按钮、没有自动跳转、没有完成度门禁', () => {
    for (const hash of ['#/contrast', '#/form-label', '#/keyboard']) {
      goto(hash)
      const section = nextStepSection() as HTMLElement
      expect(section, `${hash} 应有下一步区块`).toBeTruthy()
      expect(section.querySelectorAll('button')).toHaveLength(0)
      expect(section.querySelectorAll('a')).toHaveLength(1)
      // 停在原地：进入实验页后 hash 不变，谁想停都能停
      expect(window.location.hash).toBe(hash)
    }
  })

  it('三个实验首屏都改成「遇到什么 → 做什么 → 看到什么」，但依据与限制说明还在', () => {
    goto('#/contrast')
    expect(mainText()).toContain('你会遇到什么')
    expect(mainText()).toContain('你要做什么')
    expect(mainText()).toContain('修好能看到什么')
    expect(mainText()).toContain('WCAG')

    goto('#/form-label')
    expect(mainText()).toContain('你会遇到什么')
    expect(mainText()).toContain('屏幕阅读器')

    goto('#/keyboard')
    expect(mainText()).toContain('你要做什么')
    expect(mainText()).toContain('2.4.7')
  })

  it('色彩 → 表单 → 键盘 → 报告：一路点下去，前面登记的成果不会被清掉', () => {
    goto('#/contrast')
    runContrastLab()

    goto('#/form-label')
    expect(heading()).toBe('表单标签实验')
    runFormLab()

    goto('#/keyboard')
    expect(heading()).toBe('键盘焦点实验')
    runKeyboardLab()

    goto('#/report')
    expect(heading()).toBe('统一成果报告')
    expect(mainText()).toContain('3 / 3')
    expect(mainText()).toContain('这次会话登记了 3 / 3 个实验的成果，其中 3 个真正改动了页面，1 个已由你本人确认。')
    expect(readout('修复后对比度')).toBe('4.54:1')
    expect(readout('修复后（最近一次真实 DOM 检测）问题')).toBe('没有发现问题')
    expect(readout('修复后键盘导航到达次数')).toBe('3 次')
  })

  it('精修没碰坏三个检测器：真实算法与真实 DOM 的数值仍是 Day 5 那一套', () => {
    runAllThreeLabs()
    expect(readout('修复前对比度')).toBe('4.48:1')
    expect(readout('修复后对比度')).toBe('4.54:1')
    expect(readout('修复前 AA 判定')).toBe('未达 AA（<4.5:1）')
    expect(readout('修复后 AA 判定')).toBe('达到 AA（≥4.5:1）')
    expect(readout('修复前问题')).toBe('2 项：缺少程序化关联的可见标签、只有 placeholder 在承担标签职责')
    expect(mainText()).toContain('已完成两轮键盘体验并由你确认观察')
  })
})

describe('Day 6 · 任务 C 反馈位置与代码块', () => {
  it('应用修复后的提示就在操作区里，不是浮在页面底部', () => {
    goto('#/contrast')
    runContrastLab()

    const status = noticeByPrefix('已应用修复：')
    expect(squeeze(status.textContent ?? '')).toContain('文字颜色改为 #767676')
    expect(status.className).not.toContain('fixed')
    expect(sectionTitle(status.closest('section'))).toContain('修复')
    // 提示就在「应用 / 撤销」这一节里，撤销按钮与它同一区块
    const buttons = [...status.closest('section')!.querySelectorAll('button')].map((b) =>
      squeeze(b.textContent ?? ''),
    )
    expect(buttons).toContain('撤销本次修复')
  })

  it('复制代码的提示紧挨着复制按钮，且没有 fixed 定位的浮层盖住输入区', async () => {
    goto('#/contrast')
    runContrastLab()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn(async () => undefined) },
    })

    click(buttonByLabel('复制修复后的 CSS'))
    await act(async () => {
      await Promise.resolve()
    })

    const status = noticeByPrefix('已复制')
    expect(squeeze(status.textContent ?? '')).toBe('已复制修复后的 CSS 代码。')
    expect(status.className).not.toContain('fixed')
    expect(sectionTitle(status.closest('section'))).toContain('CSS')
    expect(status.closest('section')!.contains(buttonByLabel('复制修复后的 CSS'))).toBe(true)
  })

  it('五个页面都没有打断式的 assertive 播报，代码块也各自横向滚动', () => {
    for (const hash of ['#/contrast', '#/form-label', '#/keyboard', '#/report', '#/']) {
      goto(hash)
      // 状态提示一律礼貌播报，不抢读屏当前的话
      expect(document.querySelectorAll('[aria-live="assertive"]'), `${hash} 不该有 assertive 播报`).toHaveLength(0)
      expect(document.querySelector('[role="status"].fixed'), `${hash} 不该有固定浮层`).toBeNull()
      for (const pre of [...document.querySelectorAll('pre')]) {
        expect(pre.className, `${hash} 的 <pre> 应允许横向滚动`).toContain('overflow-x-auto')
        expect(pre.className).toMatch(/min-w-0|max-w-full/)
      }
    }
  })
})

describe('Day 6 · 任务 D 报告口径一致', () => {
  it('页面不再出现「已重新验证」，统计标签 / 阶段名 / 提示都用「修复后复核」', () => {
    runAllThreeLabs()

    expect(mainText()).toContain('已进行修复后复核（含人工键盘体验）的实验数')
    expect(readout('已进行修复后复核（含人工键盘体验）的实验数')).toBe('3 / 3')
    expect(mainText()).toContain('已进行修复后复核（含人工键盘体验）：3 个实验。')
    expect(mainText()).toContain('检测 / 修复 / 修复后复核 / 人工确认')
    expect(mainText()).toContain('把「已检测」「已给出建议」「已应用修复」「已进行修复后复核」「已人工确认」当成五件不同的事')
    expect(mainText()).toContain(REVERIFIED_HELP)
    expect(mainText()).not.toContain('已重新验证')
    expect(mainText()).not.toContain('复算或重检 DOM')
  })

  it('导出的 Markdown 与页面同口径：同一句复核说明逐字出现在两处', async () => {
    goto('#/contrast')
    runContrastLab()
    goto('#/report')

    const written: string[] = []
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn(async (value: string) => {
          written.push(value)
        }),
      },
    })

    click(buttonByLabel('复制 Markdown 报告'))
    await act(async () => {
      await Promise.resolve()
    })

    expect(written).toHaveLength(1)
    expect(written[0]).toContain('「已进行修复后复核」这一列怎么数：')
    expect(written[0]).toContain(REVERIFIED_HELP)
    expect(written[0]).toContain('已进行修复后复核（含人工键盘体验）：1 个实验。')
    expect(written[0]).not.toContain('已重新验证')
    // 复核口径说明在页面上也能读到，两处不是各写一套
    expect(mainText()).toContain(REVERIFIED_HELP)
  })

  it('走完整条动线后，页面 / 复制 / 下载仍是同一份 Markdown', async () => {
    runAllThreeLabs()

    const written: string[] = []
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn(async (value: string) => {
          written.push(value)
        }),
      },
    })
    click(buttonByLabel('复制 Markdown 报告'))
    await act(async () => {
      await Promise.resolve()
    })

    const anchors: HTMLAnchorElement[] = []
    const originalClick = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = function patched(this: HTMLAnchorElement) {
      anchors.push(this)
    }
    let captured: Blob | undefined
    Object.defineProperty(window.URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn((blob: Blob) => {
        captured = blob
        return 'blob:accesslab-day6'
      }),
    })
    Object.defineProperty(window.URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })

    click(buttonByLabel('下载 .md 文件'))
    await act(async () => {
      await Promise.resolve()
    })
    HTMLAnchorElement.prototype.click = originalClick

    const markdown = await captured!.text()
    const source = document.querySelector('#report-markdown-source') as HTMLTextAreaElement
    expect(written).toHaveLength(1)
    expect(markdown).toBe(written[0])
    expect(source.value).toBe(markdown)
    expect(anchors).toHaveLength(1)
    expect(anchors[0].download).toMatch(/^AccessLab-成果报告-[0-9]+\.md$/)
    expect(markdown).toContain('已进行修复后复核（含人工键盘体验）：3 个实验。')
    expect(markdown).toContain('复核 = 修复之后又真实跑过一次')
    // 三分钟动线走完，报告里三个实验都有真实记录，且不出现分数式结论
    expect(markdown).not.toMatch(/\b\d{1,3}\s*分\b|100%|认证通过/)
  })

  it('未检查范围把 SC 1.4.3 / 1.4.6 / 1.4.11 分开写，各自阈值与适用范围说清', () => {
    goto('#/report')

    expect(UNCHECKED_SCOPE.some((line) => line.includes('SC 1.4.3') && line.includes('4.5:1') && line.includes('普通文本'))).toBe(true)
    expect(UNCHECKED_SCOPE.some((line) => line.includes('SC 1.4.3') && line.includes('3:1') && line.includes('大文本'))).toBe(true)
    expect(UNCHECKED_SCOPE.some((line) => line.includes('SC 1.4.6') && line.includes('7:1') && line.includes('4.5:1'))).toBe(true)
    expect(UNCHECKED_SCOPE.some((line) => line.includes('SC 1.4.11') && line.includes('非文本') && line.includes('3:1'))).toBe(true)
    expect(UNCHECKED_SCOPE.some((line) => line.includes('本实验只做到 AA，不对 AAA 下任何结论'))).toBe(true)
    expect(UNCHECKED_SCOPE.some((line) => line.includes('只对内置示例的一组「前景文字 / 背景色」'))).toBe(true)

    for (const line of UNCHECKED_SCOPE) {
      expect(mainText(), `报告应列出：${line.slice(0, 16)}…`).toContain(squeeze(line))
    }
  })

  it('空报告先说这一页是什么、数据从哪来，再给三个实验入口', () => {
    goto('#/report')

    expect(mainText()).toContain('这次会话还没有登记任何实验成果')
    expect(mainText()).toContain('本次会话还没有任何实验记录')
    expect(mainText()).toContain('想让这一页有内容？从任意一个实验开始：')
    for (const hash of ['#/contrast', '#/form-label', '#/keyboard']) {
      expect(document.querySelector(`main a[href="${hash}"]`)).toBeTruthy()
    }
    expect(mainText()).toContain('刷新页面或关闭标签页就会清空')
    expect(mainText()).toContain('本报告仅针对 AccessLab 内置示例，不是网站 WCAG 合规认证。')
    expect(buttonByLabel('复制 Markdown 报告').disabled).toBe(true)
    expect(buttonByLabel('下载 .md 文件').disabled).toBe(true)
  })

  it('状态用文字说清，不只靠颜色；「已应用修复」不会被写成全部通过', () => {
    goto('#/contrast')
    runContrastLab()
    goto('#/report')

    const statuses = [...document.querySelectorAll('main span')]
      .map((el) => squeeze(el.textContent ?? ''))
      .filter((text) => text.startsWith('状态：'))
    expect(statuses).toHaveLength(3)
    expect(statuses[0]).toBe('状态：修复已应用到实验页面，并按新配色重新算过')
    expect(mainText()).toContain('状态：未记录（本次会话还没有在该实验里运行过检测）')
    expect(mainText()).not.toMatch(/已通过 WCAG|符合全部|整体合规。|100%/)
    expect(mainText()).toContain('更不给「整体合规」这种结论')
  })
})
