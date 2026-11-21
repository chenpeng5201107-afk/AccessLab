// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import {
  BASE_CLASS,
  BROKEN_CLASS,
  BROKEN_FOCUS_CSS,
  DEMO_BUTTONS,
  DEMO_RECORDS,
  DEMO_STYLE_SHEET,
  FIXED_CLASS,
  FIXED_FOCUS_CSS,
  OBSERVATION_STATEMENT,
  PREVIEW_FIXED_CLASS,
} from '../lib/keyboardFocusDemo'
import { ExperimentLedgerProvider } from '../context/ExperimentLedgerContext'
import { KeyboardFocusLabPage } from './KeyboardFocusLabPage'

/**
 * Day 4 键盘焦点实验的组件接线层测试。
 *
 * 边界说明：jsdom 不做 CSS 级联，也不实现 :focus-visible 的匹配规则，
 * 因此这里能断言的是「按钮身上挂的是哪条规则钩子、样式表里那条规则怎么写的、状态机怎么走的」；
 * 「轮廓到底看不看得见、Tab 顺序对不对、能不能走出实验区」一律交给真实浏览器取证。
 */

let container: HTMLDivElement
let root: Root

function textOf(el: Element | null): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function buttonByLabel(label: string): HTMLButtonElement | null {
  return (
    [...container.querySelectorAll('button')].find((b) => textOf(b) === label) ??
    [...container.querySelectorAll('button')].find((b) => textOf(b).includes(label)) ??
    null
  )
}

function click(el: HTMLElement) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  })
}

function demoButtons(): HTMLButtonElement[] {
  return [...container.querySelectorAll<HTMLButtonElement>(`button.${BASE_CLASS}`)]
}

function injectedSheet(): string {
  const style = container.querySelector('style[data-keyboard-focus-demo]')
  expect(style, '页面应注入带 data-keyboard-focus-demo 的样式表节点').toBeTruthy()
  return style!.textContent ?? ''
}

function notice(): string {
  return textOf(container.querySelector('p[role="status"]'))
}

/** dt/dd 是两个节点，textContent 拼起来不带空格，所以数值直接读 dd */
function readout(label: string): string {
  const dt = [...container.querySelectorAll('dt')].find((d) => textOf(d) === label)
  const dd = dt?.parentElement?.querySelector('dd') ?? null
  expect(dd, `应存在标题为「${label}」的读数行`).toBeTruthy()
  return textOf(dd)
}

/** 代码块按行渲染，跨行没有空白文本：比对时把两侧空白一起清掉 */
function squeeze(value: string): string {
  return value.replace(/\s+/g, '')
}

function sectionByHeading(heading: string): HTMLElement | null {
  const h2 = [...container.querySelectorAll('h2')].find((h) => textOf(h).includes(heading))
  return h2 ? (h2.closest('section') as HTMLElement | null) : null
}

function statusChipText(): string {
  return textOf(sectionByHeading('焦点规则与修复'))
}

/** 真实键盘的语义：先有 Tab 的 keydown，焦点才落到按钮上；鼠标点击带来的 focus 不算 */
function pressTabThenFocus(button: HTMLButtonElement, count = 1) {
  for (let i = 0; i < count; i += 1) {
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
}

/** 鼠标也能把焦点移到按钮上，但那不是键盘观察：pointerdown 会把键盘导航标记清掉 */
function pointerThenFocus(button: HTMLButtonElement) {
  act(() => {
    window.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))
  })
  act(() => {
    button.focus()
  })
  act(() => {
    button.blur()
  })
}

/** 非导航按键（Enter / Space）按下的是已聚焦的按钮，不该被当成「Tab 走过」 */
function pressEnterThenFocus(button: HTMLButtonElement) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  })
  act(() => {
    button.focus()
  })
  act(() => {
    button.blur()
  })
}

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(
      <ExperimentLedgerProvider>
        <KeyboardFocusLabPage />
      </ExperimentLedgerProvider>,
    )
  })
})

afterEach(() => {
  act(() => {
    root.unmount()
  })
  container.remove()
  vi.restoreAllMocks()
  Reflect.deleteProperty(navigator, 'clipboard')
})

describe('KeyboardFocusLabPage · 初始状态（要求 #1 #2 #3 #10）', () => {
  it('验证步骤只在应用修复后显示已切换状态', () => {
    const steps = container.querySelector('#kf-verify-heading')!.closest('section')
    expect(textOf(steps)).not.toContain('已切换到修复态')
    click(buttonByLabel('修复焦点指示')!)
    expect(textOf(steps)).toContain('已切换到修复态')
    const comparison = container.querySelector('#kf-code-heading')!.closest('section')
    expect(textOf(comparison)).not.toContain('上方实验区当前用的就是这一版')
  })

  it('实验区就是三个真实原生按钮，顺序与文案都对得上', () => {
    const buttons = demoButtons()
    expect(buttons).toHaveLength(3)
    expect(buttons.map((button) => button.id)).toEqual(DEMO_BUTTONS.map((spec) => spec.id))
    expect(buttons.map((button) => button.type)).toEqual(['button', 'button', 'button'])
    expect(buttons.every((button) => !button.disabled)).toBe(true)
  })

  it('每个按钮都有可访问名称，页面上不存在没有名字的按钮', () => {
    expect(demoButtons().map((button) => textOf(button))).toEqual(['查看详情', '保存选择', '返回上一步'])
    const nameless = [...container.querySelectorAll('button')].filter((b) => textOf(b) === '')
    expect(nameless).toEqual([])
  })

  it('初始挂的是缺陷类，而样式表里那条规则确实写着 outline: none', () => {
    for (const button of demoButtons()) {
      expect(button.className).toContain(BROKEN_CLASS)
      expect(button.className).not.toContain(FIXED_CLASS)
    }
    const sheet = injectedSheet()
    expect(sheet).toContain(BROKEN_FOCUS_CSS)
    expect(BROKEN_FOCUS_CSS).toContain('outline: none;')
  })

  it('缺陷只限实验区：平台自己的操作按钮一个都没被挂上缺陷类', () => {
    const outside = [...container.querySelectorAll('button')].filter((b) => !b.classList.contains(BASE_CLASS))
    expect(outside.length).toBeGreaterThan(3)
    for (const button of outside) {
      expect(button.className).not.toContain(BROKEN_CLASS)
      expect(button.className).not.toContain(FIXED_CLASS)
    }
    expect(textOf(container)).toContain('修复前 · 隐去焦点轮廓')
  })

  it('教学状态从「尚未体验」开始，且没有伪造任何自动通过', () => {
    expect(statusChipText()).toContain('尚未体验')
    expect(statusChipText()).not.toMatch(/自动检测通过|已符合|合规|达标/)
  })

  it('全页只有一个 aria-live 播报区：没有反馈时 0 个，出现反馈时仍只有 1 个', () => {
    expect(container.querySelectorAll('[aria-live]').length).toBe(0)
    click(buttonByLabel('重新读取真实 DOM')!)
    expect(container.querySelectorAll('[aria-live]').length).toBe(1)
    expect(container.querySelectorAll('[role="status"]').length).toBe(1)
  })
})

describe('KeyboardFocusLabPage · 三个按钮真的有用（要求 #7）', () => {
  it('「查看详情」真的展开详情，再点一次真的收起', () => {
    const details = container.querySelector<HTMLElement>('#kf-details')
    expect(details?.hidden).toBe(true)
    expect(buttonByLabel('查看详情')?.getAttribute('aria-expanded')).toBe('false')

    click(buttonByLabel('查看详情')!)
    expect(container.querySelector<HTMLElement>('#kf-details')?.hidden).toBe(false)
    expect(buttonByLabel('查看详情')?.getAttribute('aria-expanded')).toBe('true')
    expect(textOf(container.querySelector('#kf-details'))).toContain(DEMO_RECORDS[0].title)
    expect(notice()).toContain('已展开详情')

    click(buttonByLabel('查看详情')!)
    expect(container.querySelector<HTMLElement>('#kf-details')?.hidden).toBe(true)
  })

  it('「保存选择」真的往列表里写一条，计数与播报都跟着变', () => {
    expect(textOf(container)).toContain('已保存列表（0 / 3）')

    click(buttonByLabel('保存选择')!)

    expect(textOf(container)).toContain('已保存列表（1 / 3）')
    expect(textOf(container)).toContain(DEMO_RECORDS[0].title)
    expect(notice()).toContain('已保存 1 / 3 条')
    expect(container.querySelectorAll('ul li')).toBeTruthy()
  })

  it('「返回上一步」先承认没东西可撤，撤得动时数量真的回去', () => {
    click(buttonByLabel('返回上一步')!)
    expect(notice()).toContain('没有可撤销的保存记录')
    expect(textOf(container)).toContain('已保存列表（0 / 3）')

    click(buttonByLabel('保存选择')!)
    expect(textOf(container)).toContain('已保存列表（1 / 3）')

    click(buttonByLabel('返回上一步')!)
    expect(textOf(container)).toContain('已保存列表（0 / 3）')
    expect(notice()).toContain('已撤回最近一次保存')
  })

  it('保存满三条后再按不会越界，并如实提示先撤回', () => {
    for (let i = 0; i < DEMO_RECORDS.length; i += 1) click(buttonByLabel('保存选择')!)
    expect(textOf(container)).toContain(`已保存列表（${DEMO_RECORDS.length} / ${DEMO_RECORDS.length}）`)

    click(buttonByLabel('保存选择')!)
    expect(textOf(container)).toContain('都已保存完毕')
    expect(textOf(container)).toContain(`已保存列表（${DEMO_RECORDS.length} / ${DEMO_RECORDS.length}）`)
  })

  it('演示按钮不提交表单、不改地址、不写存储', () => {
    const url = window.location.href
    expect(container.querySelectorAll('form').length).toBe(0)
    click(buttonByLabel('保存选择')!)
    expect(window.location.href).toBe(url)
    expect(Object.keys(localStorage)).toEqual([])
  })
})

describe('KeyboardFocusLabPage · 修复与重置（要求 #4 #5 #6）', () => {
  it('点「修复焦点指示」后按钮真的换成修复类，缺陷类同时消失', () => {
    click(buttonByLabel('修复焦点指示')!)

    for (const button of demoButtons()) {
      expect(button.className).toContain(FIXED_CLASS)
      expect(button.className).not.toContain(BROKEN_CLASS)
      expect(button.className).toContain(BASE_CLASS)
    }
  })

  it('修复后检测结果跟着节点走：问题归 0，读出的是实心轮廓规则', () => {
    click(buttonByLabel('重新读取真实 DOM')!)
    expect(statusChipText()).toContain('规则问题 1 项')

    click(buttonByLabel('修复焦点指示')!)

    expect(statusChipText()).toContain('已应用焦点修复')
    expect(statusChipText()).toContain('没有：规则里带实心轮廓')
    expect(statusChipText()).toContain(FIXED_CLASS)
  })

  it('「已应用焦点修复」不等于「已通过」：文案里明确还要人工确认', () => {
    click(buttonByLabel('修复焦点指示')!)
    const text = statusChipText()
    expect(text).toContain('还需要你再用 Tab 走一次')
    expect(text).not.toMatch(/自动检测通过|已符合 WCAG/)
  })

  it('修复按钮在修复后换成状态说明，但仍保留重置入口', () => {
    click(buttonByLabel('修复焦点指示')!)
    expect(buttonByLabel('修复焦点指示')).toBeNull()
    expect(textOf(container)).toContain('已应用焦点修复（按钮当前挂')
    expect(buttonByLabel('重置实验')).toBeTruthy()
  })

  it('点「重置实验」回到缺陷态，样式状态与保存列表一起恢复初始', () => {
    click(buttonByLabel('保存选择')!)
    click(buttonByLabel('修复焦点指示')!)

    click(buttonByLabel('重置实验')!)

    for (const button of demoButtons()) {
      expect(button.className).toContain(BROKEN_CLASS)
      expect(button.className).not.toContain(FIXED_CLASS)
    }
    expect(textOf(container)).toContain('已保存列表（0 / 3）')
    expect(statusChipText()).toContain('尚未体验')
    expect(notice()).toContain('实验已重置')
    expect(buttonByLabel('修复焦点指示')).toBeTruthy()
  })

  it('样式表两段规则始终都在，切换的是按钮挂的类名', () => {
    const before = injectedSheet()
    click(buttonByLabel('修复焦点指示')!)
    const after = injectedSheet()

    expect(before).toContain(BROKEN_FOCUS_CSS)
    expect(before).toContain(FIXED_FOCUS_CSS)
    expect(after).toBe(before)
    expect(after).toBe(DEMO_STYLE_SHEET)
  })
})

describe('KeyboardFocusLabPage · 修复前后两轮键盘记录（要求 #10 #11）', () => {
  it('键盘 Tab 走到按钮后，状态从「尚未体验」变成「待人工检查」，记进修复前那一轮', () => {
    pressTabThenFocus(demoButtons()[0])

    expect(statusChipText()).toContain('待人工检查')
    expect(readout('修复前：键盘导航到达示例按钮的次数')).toBe('1 次')
    expect(readout('修复后：键盘导航到达示例按钮的次数')).toBe('0 次')
  })

  it('只有键盘导航计数：鼠标点击带来的 focus 不会被冒充成键盘走过', () => {
    pointerThenFocus(demoButtons()[0])

    expect(statusChipText()).toContain('尚未体验')
    expect(readout('修复前：键盘导航到达示例按钮的次数')).toBe('0 次')

    pressTabThenFocus(demoButtons()[1])
    expect(statusChipText()).toContain('待人工检查')
    expect(readout('修复前：键盘导航到达示例按钮的次数')).toBe('1 次')
  })

  it('Enter / Space 之类不移动焦点的按键，也不算一轮键盘观察', () => {
    pressEnterThenFocus(demoButtons()[0])

    expect(readout('修复前：键盘导航到达示例按钮的次数')).toBe('0 次')
    expect(statusChipText()).toContain('尚未体验')
  })

  it('应用修复后修复前记录原样保留，修复后从零开始', () => {
    pressTabThenFocus(demoButtons()[0], 2)
    expect(readout('修复前：键盘导航到达示例按钮的次数')).toBe('2 次')

    click(buttonByLabel('修复焦点指示')!)

    expect(readout('修复前：键盘导航到达示例按钮的次数')).toBe('2 次')
    expect(readout('修复后：键盘导航到达示例按钮的次数')).toBe('0 次')

    pressTabThenFocus(demoButtons()[0])
    expect(readout('修复前：键盘导航到达示例按钮的次数')).toBe('2 次')
    expect(readout('修复后：键盘导航到达示例按钮的次数')).toBe('1 次')
  })

  it('修复后的 Tab 计到 after 轮，状态说明随之换成「待你确认」', () => {
    pressTabThenFocus(demoButtons()[0])
    click(buttonByLabel('修复焦点指示')!)
    pressTabThenFocus(demoButtons()[1])

    expect(statusChipText()).toContain('修复后已用键盘复走')
    expect(statusChipText()).not.toContain('CSS 生效了')
  })

  it('「待人工检查」说的是要人来看，不是程序已经判定看不见', () => {
    pressTabThenFocus(demoButtons()[0])
    expect(statusChipText()).toContain('只能由你的眼睛判断')
  })
})

describe('KeyboardFocusLabPage · 人工验证门控（要求 #11 #12 #13）', () => {
  function confirmButton(): HTMLButtonElement {
    return buttonByLabel('我已完成观察')!
  }

  function verifyStepItems(): string[] {
    const ol = sectionByHeading('确认观察')?.querySelector('ol')
    expect(ol, '第 5 节应有五步验证清单').toBeTruthy()
    return [...ol!.querySelectorAll('li')].map((li) => textOf(li))
  }

  it('五步清单各自独立：修复前体验、修复操作、修复后体验、人工确认分别计数', () => {
    const items = verifyStepItems()
    expect(items).toHaveLength(5)
    expect(items[0]).toContain('先按 Tab 体验原始按钮')
    expect(items[2]).toContain('点击「修复焦点指示」')
    expect(items[3]).toContain('再次使用 Tab 操作相同按钮')
    expect(items[4]).toContain('我已完成观察')
  })

  it('尚未体验时清单第一步不是「已完成」，确认按钮也点不动', () => {
    expect(confirmButton().disabled).toBe(true)
    expect(textOf(container)).toContain('要等你先点过「修复焦点指示」')

    const items = verifyStepItems()
    expect(items[0]).toContain('待人工确认')
    expect(items[0]).toContain('修复前键盘到达 0 次')
  })

  it('没体验就点修复：仍然不能确认，并说明是修复前那一轮缺记录', () => {
    click(buttonByLabel('修复焦点指示')!)

    expect(confirmButton().disabled).toBe(true)
    expect(textOf(container)).toContain('修复前那一轮没有键盘记录')
    expect(confirmButton().getAttribute('aria-disabled')).toBe('true')
  })

  it('修复前走过、修复后没按 Tab：不能确认', () => {
    pressTabThenFocus(demoButtons()[0])
    click(buttonByLabel('修复焦点指示')!)

    expect(confirmButton().disabled).toBe(true)
    expect(textOf(container)).toContain('修复后这一轮还没走过')
    expect(verifyStepItems()[3]).toContain('待人工确认')
  })

  it('修复前走过、修复后用鼠标聚焦：也不算走完一轮', () => {
    pressTabThenFocus(demoButtons()[0])
    click(buttonByLabel('修复焦点指示')!)
    pointerThenFocus(demoButtons()[1])

    expect(readout('修复后：键盘导航到达示例按钮的次数')).toBe('0 次')
    expect(confirmButton().disabled).toBe(true)
  })

  it('前后各有真实键盘记录才放开确认，点下去显示的是那句不冒充全站合规的原话', () => {
    pressTabThenFocus(demoButtons()[0])
    click(buttonByLabel('修复焦点指示')!)
    pressTabThenFocus(demoButtons()[1])

    expect(confirmButton().disabled).toBe(false)
    click(confirmButton())

    expect(textOf(container)).toContain(OBSERVATION_STATEMENT)
    expect(notice()).toBe(OBSERVATION_STATEMENT)
    expect(statusChipText()).toContain('用户已确认观察结果')
  })

  it('确认之后仍然写着「只验证了指定组件」，不升级成整体结论', () => {
    pressTabThenFocus(demoButtons()[0])
    click(buttonByLabel('修复焦点指示')!)
    pressTabThenFocus(demoButtons()[1])
    click(confirmButton())

    expect(textOf(container)).toContain('不能代表整个网站已经符合全部无障碍规范')
    expect(textOf(container)).toContain('不代表整站符合 WCAG 2.2')
    expect(textOf(container)).not.toMatch(/已符合 WCAG|自动检测通过|WCAG 已完全通过/)
  })

  it('走完全部步骤后重置：前后两轮记录与确认状态一起失效', () => {
    pressTabThenFocus(demoButtons()[0])
    click(buttonByLabel('修复焦点指示')!)
    pressTabThenFocus(demoButtons()[1])
    click(confirmButton())

    click(buttonByLabel('重置实验')!)

    expect(readout('修复前：键盘导航到达示例按钮的次数')).toBe('0 次')
    expect(readout('修复后：键盘导航到达示例按钮的次数')).toBe('0 次')
    expect(statusChipText()).toContain('尚未体验')
    expect(confirmButton().disabled).toBe(true)
    expect(textOf(container)).not.toContain(OBSERVATION_STATEMENT)
    expect(verifyStepItems()[0]).toContain('待人工确认')
    expect(verifyStepItems()[4]).toContain('待人工确认')
  })

  it('验证清单把「有客观记录」和「待人工确认」分开标注', () => {
    expect(textOf(sectionByHeading('确认观察'))).toContain('待人工确认')
    pressTabThenFocus(demoButtons()[0])
    expect(verifyStepItems()[0]).toContain('有客观记录')
    expect(verifyStepItems()[0]).toContain('修复前键盘到达 1 次')
  })
})

describe('KeyboardFocusLabPage · 代码对比与复制（要求 #8 #9）', () => {
  function codeColumns(): HTMLElement[] {
    return [...container.querySelectorAll('h3')]
      .filter((h) => /修复前（缺陷示例）|修复后（清晰焦点轮廓）/.test(textOf(h)))
      .map((h) => h.parentElement as HTMLElement)
  }

  it('两栏代码就是注入样式表里的逐字片段，没有第二套手写文案', () => {
    const [beforeCol, afterCol] = codeColumns()
    const sheet = injectedSheet()

    expect(squeeze(textOf(beforeCol))).toContain(squeeze(BROKEN_FOCUS_CSS))
    expect(squeeze(textOf(afterCol))).toContain(squeeze(FIXED_FOCUS_CSS))
    expect(sheet).toContain(BROKEN_FOCUS_CSS)
    expect(sheet).toContain(FIXED_FOCUS_CSS)
  })

  it('「与当前生效的规则一致」跟着按钮身上的类名跑，不是跟着标语说', () => {
    let [beforeCol, afterCol] = codeColumns()
    expect(textOf(beforeCol)).toContain('与当前生效的规则一致')
    expect(textOf(afterCol)).not.toContain('与当前生效的规则一致')

    click(buttonByLabel('修复焦点指示')!)
    ;[beforeCol, afterCol] = codeColumns()
    expect(textOf(afterCol)).toContain('与当前生效的规则一致')
    expect(textOf(beforeCol)).not.toContain('与当前生效的规则一致')

    click(buttonByLabel('重置实验')!)
    ;[beforeCol, afterCol] = codeColumns()
    expect(textOf(beforeCol)).toContain('与当前生效的规则一致')
  })

  it('代码以文本渲染，不会被当成 HTML 注入出真的按钮或样式节点', () => {
    const code = container.querySelector('pre code')!
    expect(code.textContent).toContain('outline: none;')
    expect(code.querySelector('button')).toBeNull()
    expect(code.querySelectorAll('style')).toHaveLength(0)
    // 全页只有一个注入节点，代码块里没有第二个
    expect(container.querySelectorAll('style[data-keyboard-focus-demo]')).toHaveLength(1)
  })

  it('剪贴板不可用时如实提示，不谎报复制成功', async () => {
    click(buttonByLabel('复制修复后的 CSS')!)
    await act(async () => {
      await Promise.resolve()
    })

    expect(notice()).toContain('不支持自动复制')
    expect(notice()).not.toContain('已复制')
  })

  it('剪贴板可用时复制的确实是那段修复后 CSS', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    click(buttonByLabel('复制修复后的 CSS')!)
    await act(async () => {
      await Promise.resolve()
    })

    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText.mock.calls[0][0]).toBe(FIXED_FOCUS_CSS)
    expect(notice()).toContain('已复制修复后的 CSS')
  })

  it('剪贴板被拒绝时给出失败提示，而不是成功文案', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')) },
      configurable: true,
    })

    click(buttonByLabel('复制修复后的 CSS')!)
    await act(async () => {
      await Promise.resolve()
    })

    expect(notice()).toContain('复制失败')
    expect(notice()).not.toContain('已复制')
  })
})

describe('KeyboardFocusLabPage · 焦点陷阱与示意图（要求 #1 #10）', () => {
  it('实验区不出现正 tabindex，也不靠脚本抢焦点', () => {
    const positives = [...container.querySelectorAll<HTMLElement>('[tabindex]')].filter(
      (el) => Number(el.getAttribute('tabindex')) > 0,
    )
    expect(positives).toEqual([])
    expect(document.activeElement).not.toBe(demoButtons()[0])
  })

  it('对比区与反差列表用的是静态示意，不是额外的假按钮', () => {
    const previews = [...container.querySelectorAll(`.${PREVIEW_FIXED_CLASS}`)]
    expect(previews.length).toBeGreaterThan(0)
    for (const preview of previews) {
      expect(preview.tagName).not.toBe('BUTTON')
      expect(preview.getAttribute('aria-hidden')).toBe('true')
      expect(preview.hasAttribute('tabindex')).toBe(false)
    }
    expect(textOf(container)).toContain('静态示意图 · 不能聚焦 · 不参与 Tab 顺序')
  })

  it('本页不引入脚本、不使用 innerHTML 注入', () => {
    expect(container.querySelectorAll('script').length).toBe(0)
    for (const el of [...container.querySelectorAll('*')]) {
      expect(el.hasAttribute('dangerouslySetInnerHTML')).toBe(false)
    }
  })
})
