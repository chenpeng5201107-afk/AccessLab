// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { EMAIL_FIELD, NAME_FIELD, demoFormHtml } from '../lib/formLabelDemoFields'
import { FormLabelLabPage } from './FormLabelLabPage'

/**
 * Day 3 表单标签实验的组件接线层测试。
 * lib 层的 formLabelAudit.test.ts 已经证明「给定 DOM 结构 → 给定结论」；
 * 这里证明的是：React 真的把状态渲染成了那套 DOM，而检测读的确实是渲染出来的节点。
 *
 * 说明：jsdom 不实现 label 的点击激活行为（实测 label.click() 不会移动焦点），
 * 所以「点标签把焦点交给输入框」这一条在这里只断言浏览器据以激活的 label.control 指向，
 * 真实焦点转移由生产构建上的浏览器验证负责，不在这里用 jsdom 冒充。
 */

let container: HTMLDivElement
let root: Root

function click(el: HTMLElement) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  })
}

function textOf(el: Element | null): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function buttonByLabel(label: string): HTMLElement | null {
  return [...container.querySelectorAll('button')].find((b) => textOf(b).includes(label)) ?? null
}

function sectionByHeading(heading: string): HTMLElement | null {
  const h2 = [...container.querySelectorAll('h2')].find((h) => textOf(h).includes(heading))
  return h2 ? h2.closest('section') : null
}

function notice(): string {
  return textOf(container.querySelector('p[role="status"]'))
}

function codeColumns(): HTMLElement[] {
  return [...container.querySelectorAll('h3')]
    .filter((h) => /修复前|修复后/.test(textOf(h)))
    .map((h) => h.parentElement as HTMLElement)
}

function nameInput(): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>(`#${NAME_FIELD.id}`)
  expect(input, `示例表单里应存在 id=${NAME_FIELD.id} 的输入框`).toBeTruthy()
  return input!
}

/** TS lib 把 labels 标成可空；浏览器与 jsdom 实际都会返回集合，这里统一收口 */
function labelsOf(control: HTMLInputElement): HTMLLabelElement[] {
  return Array.from(control.labels ?? [])
}

function captionElement(): Element {
  return nameInput().parentElement!.firstElementChild!
}

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(<FormLabelLabPage />)
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

describe('FormLabelLabPage · 初始缺陷状态（要求 #1 #2）', () => {
  it('「姓名」只是一个 span，与输入框没有任何程序化关联', () => {
    expect(captionElement().tagName).toBe('SPAN')
    expect(textOf(captionElement())).toBe('姓名')
    expect(labelsOf(nameInput()).length).toBe(0)
  })

  it('检测结果读到的就是这个真实 DOM：2 个控件、2 项问题，且区分两种「没名字」', () => {
    const results = textOf(sectionByHeading('3. 检测结果'))
    expect(results).toContain('本次检查 2 个文本录入控件，发现 2 项标签关联问题')
    expect(results).toContain('缺少关联的可见标签')
    expect(results).toContain('有可访问名称')
    expect(results).toContain('placeholder')
  })

  it('电子邮箱字段从一开始就是正确关联的对照样本', () => {
    const email = container.querySelector<HTMLInputElement>(`#${EMAIL_FIELD.id}`)!
    expect(labelsOf(email).length).toBe(1)
    expect(textOf(labelsOf(email)[0])).toBe('电子邮箱')
    expect(labelsOf(email)[0].htmlFor).toBe(EMAIL_FIELD.id)
  })

  it('缺陷被限制在标注了教学示例的区域内，页面自身的控件都有可访问名称', () => {
    const unlabeled = [...container.querySelectorAll('button')].filter((b) => textOf(b) === '')
    expect(unlabeled).toEqual([])
    expect(textOf(container)).toContain('教学示例')

    // 全页只有一个活动播报区：没有反馈文案时它不渲染，出现反馈时也只有一个
    expect(container.querySelectorAll('[aria-live]').length).toBe(0)
    click(buttonByLabel('重新检测')!)
    expect(container.querySelectorAll('[aria-live]').length).toBe(1)
    expect(container.querySelectorAll('[role="status"]').length).toBe(1)
  })
})

describe('FormLabelLabPage · 一键修复与重新验证（要求 #3 #4 #5 #6 #10）', () => {
  it('点「修复标签关联」后 DOM 真的换成了 label，id / htmlFor 对得上', () => {
    click(buttonByLabel('修复标签关联')!)

    expect(captionElement().tagName).toBe('LABEL')
    expect(captionElement().getAttribute('for')).toBe(NAME_FIELD.id)
    const input = nameInput()
    expect(labelsOf(input).length).toBe(1)
    expect(labelsOf(input)[0]).toBe(captionElement())
    // 浏览器点击标签时靠 label.control 定位控件；真实的焦点转移见浏览器验证
    expect((captionElement() as HTMLLabelElement).control).toBe(input)
  })

  it('修复后重新运行的检测里，对应问题已经消失，只剩邮箱一条通过', () => {
    click(buttonByLabel('修复标签关联')!)

    const results = textOf(sectionByHeading('3. 检测结果'))
    expect(results).toContain('发现 0 项标签关联问题')
    expect(results).not.toContain('缺少关联的可见标签')
    expect(results).toContain('这个控件的标签关联检查没有发现问题')
    expect(notice()).toContain('检测将在新的 DOM 上重新运行')
  })

  it('修复不会清掉学员已经输入的内容，也不会碰到邮箱字段', () => {
    const input = nameInput()
    act(() => {
      input.value = '张三'
    })

    click(buttonByLabel('修复标签关联')!)

    expect(nameInput().value).toBe('张三')
    expect(nameInput()).toBe(input)
    expect(captionElement().tagName).toBe('LABEL')
  })

  it('修复后该字段不再只有 placeholder 提供名称，来源改为关联 label', () => {
    click(buttonByLabel('修复标签关联')!)
    const results = textOf(sectionByHeading('3. 检测结果'))
    expect(results).toContain('associated-label')
    expect(results).not.toContain('placeholder-as-only-name')
  })
})

describe('FormLabelLabPage · 重置与重新检测（要求 #7）', () => {
  it('点「重置实验」后回到 span 状态，检测结果也重新报出问题', () => {
    click(buttonByLabel('修复标签关联')!)
    expect(sectionByHeading('3. 检测结果')!.textContent).toContain('发现 0 项')

    click(buttonByLabel('重置实验')!)

    expect(captionElement().tagName).toBe('SPAN')
    expect(labelsOf(nameInput()).length).toBe(0)
    expect(textOf(sectionByHeading('3. 检测结果'))).toContain('发现 2 项标签关联问题')
    expect(notice()).toContain('实验已重置')
    expect(buttonByLabel('修复标签关联')).toBeTruthy()
  })

  it('点「重新检测」按当前真实 DOM 播报数量', () => {
    click(buttonByLabel('重新检测')!)
    expect(notice()).toContain('已按当前真实 DOM 重新检测：检查 2 个文本录入控件，发现 2 项问题')

    click(buttonByLabel('修复标签关联')!)
    click(buttonByLabel('重新检测')!)
    expect(notice()).toContain('发现 0 项问题')
  })

  it('演示按钮只拦提交，不发请求也不写数据', () => {
    const originalLocation = window.location.href
    click(buttonByLabel('提交登记')!)

    expect(notice()).toContain('演示表单没有提交')
    expect(window.location.href).toBe(originalLocation)
    expect(container.querySelectorAll('form[method]').length).toBe(0)
  })
})

describe('FormLabelLabPage · 代码对比与复制（要求 #8 #9）', () => {
  it('两栏代码的 id / for 就是页面真实使用的值，且与当前状态对应', () => {
    const [beforeCol, afterCol] = codeColumns()

    expect(textOf(beforeCol)).toContain('<span>姓名</span>')
    expect(textOf(afterCol)).toContain(`<label for="${NAME_FIELD.id}">姓名</label>`)
    expect(textOf(afterCol)).toContain(`id="${NAME_FIELD.id}"`)
    expect(textOf(beforeCol)).toContain(`id="${EMAIL_FIELD.id}"`)

    expect(textOf(beforeCol)).toContain('与当前 DOM 一致')
    expect(textOf(afterCol)).not.toContain('与当前 DOM 一致')

    click(buttonByLabel('修复标签关联')!)
    const [beforeAgain, afterAgain] = codeColumns()
    expect(textOf(afterAgain)).toContain('与当前 DOM 一致')
    expect(textOf(beforeAgain)).not.toContain('与当前 DOM 一致')
  })

  it('代码以文本渲染，不会被当成 HTML 注入执行', () => {
    const code = container.querySelector('pre code')!
    expect(code.textContent).toContain('<label for=')
    // 展示用的 <label> / <input> 文本绝不能变成真实节点
    expect(code.querySelector('label')).toBeNull()
    expect(code.querySelector('input')).toBeNull()
    expect(container.querySelectorAll('pre code').length).toBe(2)
  })

  it('剪贴板不可用时如实提示，不谎报复制成功', async () => {
    click(buttonByLabel('复制修复后的 HTML')!)
    await act(async () => {
      await Promise.resolve()
    })

    expect(notice()).toContain('不支持自动复制')
    expect(notice()).not.toContain('已复制')
  })

  it('剪贴板可用时复制的确实是修复后的 HTML', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    click(buttonByLabel('复制修复后的 HTML')!)
    await act(async () => {
      await Promise.resolve()
    })

    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText.mock.calls[0][0]).toBe(demoFormHtml(true))
    expect(writeText.mock.calls[0][0]).toContain(`<label for="${NAME_FIELD.id}">姓名</label>`)
    expect(notice()).toContain('已复制修复后的 HTML 代码')
  })

  it('剪贴板被拒绝时给出失败提示，而不是成功文案', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')) },
      configurable: true,
    })

    click(buttonByLabel('复制修复后的 HTML')!)
    await act(async () => {
      await Promise.resolve()
    })

    expect(notice()).toContain('复制失败')
    expect(notice()).not.toContain('已复制')
  })
})
