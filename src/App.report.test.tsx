// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import App from './App'
import { NON_CERTIFICATION_STATEMENT } from './lib/reportModel'
import { BASE_CLASS } from './lib/keyboardFocusDemo'

/**
 * 任务书第七节 #1：跨路由的真实集成。
 *
 * 这里渲染的是完整的 App（外壳 + hash 路由 + 会话台账），不是拼好的假 ledger：
 * 三个实验各自跑一遍真实流程，再切到 #/report 看它引用的到底是不是刚才那些数值。
 * 「建议未应用」「撤销后结论失效」「刷新前只活在内存里」也都靠真实操作来验证，
 * 而不是直接调用 derive* 函数——那样只能测到纯函数，测不到接线。
 */

let container: HTMLDivElement
let root: Root

function squeeze(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function reportText(): string {
  return squeeze(document.querySelector('main')?.textContent ?? '')
}

function buttonByLabel(label: string): HTMLButtonElement {
  const button = [...document.querySelectorAll('button')].find(
    (el) => squeeze(el.textContent ?? '') === label,
  )
  expect(button, `当前页面应有按钮「${label}」`).toBeTruthy()
  return button as HTMLButtonElement
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

function readContrastLab() {
  goto('#/contrast')
  click(buttonByLabel('生成修复建议'))
  click(buttonByLabel('应用该修复'))
}

function readFormLab() {
  goto('#/form-label')
  click(buttonByLabel('修复标签关联'))
}

function readKeyboardLab() {
  goto('#/keyboard')
  expect(demoButtons()).toHaveLength(3)
  demoButtons().forEach(pressTabThenFocus)
  click(buttonByLabel('修复焦点指示'))
  demoButtons().forEach(pressTabThenFocus)
  click(buttonByLabel('我已完成观察'))
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

describe('App · 报告页引用三个实验的真实结果（要求 #1）', () => {
  it('色彩 / 表单 / 键盘各跑一遍后，#/report 显示的是刚才那些数值', () => {
    readContrastLab()
    readFormLab()
    readKeyboardLab()

    goto('#/report')
    expect(document.title).toBe('统一成果报告｜AccessLab 无障碍实验室')
    expect(reportText()).toContain('3 / 3')
    expect(reportText()).not.toContain('未记录（本次会话还没有在该实验里运行过检测）')

    // 色彩：真实比值来自 contrastRatioFromHex，未四舍五入的判定 —— 4.48 未达、4.54 达标
    expect(readout('当前配色')).toBe('#767676 / #ffffff')
    expect(readout('修复前对比度')).toBe('4.48:1')
    expect(readout('修复后对比度')).toBe('4.54:1')
    expect(readout('修复前 AA 判定')).toBe('未达 AA（<4.5:1）')
    expect(readout('修复后 AA 判定')).toBe('达到 AA（≥4.5:1）')
    expect(reportText()).toContain('修复已应用到实验页面，并按新配色重新算过')

    // 表单：修复前 2 项、修复后 0 项，来自真实 DOM 重检
    expect(reportText()).toContain('已修复并通过重新检测（仅指示例控件的标签关联）')
    expect(readout('修复前问题')).toBe('2 项：缺少程序化关联的可见标签、只有 placeholder 在承担标签职责')
    expect(readout('修复后（最近一次真实 DOM 检测）问题')).toBe('没有发现问题')
    expect(readout('检查的文本录入控件数')).toBe('2 个')

    // 键盘：两轮都有键盘到达记录，且由学员自己确认
    expect(reportText()).toContain('已完成两轮键盘体验并由你确认观察')
    expect(readout('修复前键盘导航到达次数')).toBe('3 次')
    expect(readout('修复后键盘导航到达次数')).toBe('3 次')
    expect(readout('你是否已确认观察结果')).toContain('是：由你点击「我已完成观察」记录')
    expect(reportText()).toContain(NON_CERTIFICATION_STATEMENT)
  })

  it('只做完色彩实验：另外两个实验写「未记录」，不互相冒充', () => {
    readContrastLab()

    goto('#/report')
    expect(reportText()).toContain('1 / 3')
    expect(reportText()).toContain('未记录（本次会话还没有在该实验里运行过检测）')
    expect(reportText()).toContain('修复已应用到实验页面，并按新配色重新算过')
    expect(reportText()).not.toContain('已完成两轮键盘体验')
    expect(reportText()).not.toContain('已修复并通过重新检测')
  })

  it('只生成建议、没有应用时，报告写「已生成修复建议，尚未应用」', () => {
    goto('#/contrast')
    click(buttonByLabel('生成修复建议'))

    goto('#/report')
    expect(reportText()).toContain('已生成修复建议，尚未应用到实验页面')
    expect(reportText()).not.toContain('修复已应用到实验页面')
  })

  it('切走再切回实验页不会把已登记的成果清零', () => {
    readContrastLab()
    readFormLab()
    readKeyboardLab()

    // 报告之外再绕一圈首页与其它路由：会话台账必须原样留着
    goto('#/')
    goto('#/contrast')
    goto('#/keyboard')
    goto('#/report')

    expect(reportText()).toContain('3 / 3')
    expect(reportText()).toContain('修复已应用到实验页面，并按新配色重新算过')
    expect(reportText()).toContain('已完成两轮键盘体验并由你确认观察')
  })
})

describe('App · 撤销与重置让旧结论失效（要求 #5 #6）', () => {
  // 撤销 / 重置必须在同一次挂载里操作：换路由会把实验页恢复到初始状态，那属于「会话快照」的语义
  it('应用修复后撤销，报告不再说「已应用」', () => {
    goto('#/contrast')
    click(buttonByLabel('生成修复建议'))
    click(buttonByLabel('应用该修复'))
    click(buttonByLabel('撤销本次修复'))

    goto('#/report')
    expect(reportText()).not.toContain('修复已应用到实验页面')
    expect(reportText()).toContain('已检测当前配色，尚未生成修复建议')
    // 撤销后回到 #777777：仍未达 AA，上一次的建议色数值不再充当本次结论
    expect(reportText()).toContain('#777777')
    expect(reportText()).not.toContain('4.54')
    expect(reportText()).not.toContain('修复前文字色 / 背景色')
  })

  it('重置表单实验后，报告回到「已检测，尚未修复」', () => {
    goto('#/form-label')
    click(buttonByLabel('修复标签关联'))
    click(buttonByLabel('重置实验'))

    goto('#/report')
    expect(reportText()).not.toContain('已修复并通过重新检测')
    expect(reportText()).toContain('已检测，尚未修复')
  })

  it('重置键盘实验后，两轮记录与人工确认一起作废', () => {
    readKeyboardLab()
    click(buttonByLabel('重置实验'))

    goto('#/report')
    expect(reportText()).not.toContain('已完成两轮键盘体验并由你确认观察')
    expect(reportText()).toContain('尚未记录到键盘体验')
  })

  it('键盘实验只走完修复前一轮时，报告不会把「应用了 CSS」说成「已确认」', () => {
    goto('#/keyboard')
    demoButtons().forEach(pressTabThenFocus)
    click(buttonByLabel('修复焦点指示'))

    goto('#/report')
    expect(reportText()).toContain('已应用修复，修复后还没用键盘走一遍')
    expect(reportText()).not.toContain('已完成两轮键盘体验')
    expect(reportText()).toContain('否：还需要你亲自确认')
  })

  it('修复前后各走过一轮、但还没人工确认时，报告停在「还差你的确认」', () => {
    goto('#/keyboard')
    demoButtons().forEach(pressTabThenFocus)
    click(buttonByLabel('修复焦点指示'))
    demoButtons().forEach(pressTabThenFocus)

    goto('#/report')
    expect(reportText()).toContain('已应用修复，还差你的确认')
    expect(readout('修复前键盘导航到达次数')).toBe('3 次')
    expect(readout('修复后键盘导航到达次数')).toBe('3 次')
    expect(readout('你是否已确认观察结果')).toContain('否：还需要你亲自确认')
    expect(reportText()).not.toContain('已完成两轮键盘体验')
  })
})

describe('App · 报告页只汇总，不重新发明检测（要求 #2 #3）', () => {
  it('报告页不提供任何检测按钮，只有回到实验的入口', () => {
    readContrastLab()
    goto('#/report')

    const labels = [...document.querySelectorAll('button')].map((el) => squeeze(el.textContent ?? ''))
    expect(labels).toEqual(['复制 Markdown 报告', '下载 .md 文件', '清空本次实验记录'])

    for (const hash of ['#/contrast', '#/form-label', '#/keyboard']) {
      expect(document.querySelector(`a[href="${hash}"]`)).toBeTruthy()
    }
  })

  it('复制出来的 Markdown 与页面展示同源：没有记录时按钮禁用，有记录时可复制', async () => {
    const written: string[] = []
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn(async (value: string) => {
          written.push(value)
        }),
      },
    })

    goto('#/report')
    expect(buttonByLabel('复制 Markdown 报告').disabled).toBe(true)

    readContrastLab()
    goto('#/report')
    await act(async () => {
      click(buttonByLabel('复制 Markdown 报告'))
    })

    expect(written).toHaveLength(1)
    expect(written[0]).toContain('# AccessLab 统一成果报告')
    expect(written[0]).toContain('4.48')
    expect(written[0]).toContain(NON_CERTIFICATION_STATEMENT)
    // 页面展示、只读原文框、剪贴板三处同源，且全程没有任何网络请求
    const source = document.querySelector<HTMLTextAreaElement>('#report-markdown-source')
    expect(source?.value).toBe(written[0])
    expect(squeeze(document.querySelector('[role="status"]')?.textContent ?? '')).toContain('已复制完整 Markdown 报告')
  })
})
