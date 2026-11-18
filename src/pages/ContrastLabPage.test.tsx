// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { ExperimentLedgerProvider } from '../context/ExperimentLedgerContext'
import { ContrastLabPage } from './ContrastLabPage'

/**
 * 组件接线层测试（任务书第七节 #7 / #8 / #9 / #10 / #11）。
 * repairWorkflow.test.ts 只验证 reducer 的状态转移；这里验证 React 真的把状态
 * 同步回了「十六进制输入框 + 取色器 + 预览 + 检测结果」，以及 ColorControl 的
 * 草稿同步（resetSignal）—— 这些一旦回归，纯函数测试是抓不到的。
 */

const MIN = 4.5

// jsdom 里的受控输入：必须先过原生 value setter，React 的 change tracking 才认这次赋值
function typeInto(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  act(() => {
    setter?.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function click(el: HTMLElement) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  })
}

function textOf(el: Element | null): string {
  return (el?.textContent ?? '').trim()
}

function buttonByLabel(container: HTMLElement, label: string): HTMLElement | null {
  return (
    [...container.querySelectorAll('button')].find((b) => textOf(b).includes(label)) ?? null
  )
}

function controlHexInput(container: HTMLElement, labelText: string): HTMLInputElement {
  const label = [...container.querySelectorAll('label')].find((l) => textOf(l) === labelText)
  expect(label, `找不到「${labelText}」的 label`).toBeTruthy()
  const id = label!.htmlFor
  // 用属性选择器按 id 取元素：jsdom 不实现 CSS.escape，而 useId 的值本身带下划线
  const input = container.querySelector<HTMLInputElement>(`[id="${id}"]`)
  expect(input, `找不到 id=${id} 对应的输入框`).toBeTruthy()
  return input!
}

function pickerInput(container: HTMLElement, labelText: string): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>(
    `input[type="color"][aria-label="${labelText}取色器"]`,
  )
  expect(input, `找不到「${labelText}」取色器`).toBeTruthy()
  return input!
}

/** 按 h2 小标题定位某个区块，返回其内联样式着色容器（预览卡 / 对比栏） */
function sectionByHeading(container: HTMLElement, heading: string): HTMLElement | null {
  const h2 = [...container.querySelectorAll('h2')].find((h) => textOf(h).includes(heading))
  return h2 ? h2.closest('section') : null
}

function tintedBoxInSection(container: HTMLElement, heading: string): HTMLElement | null {
  const section = sectionByHeading(container, heading)
  if (!section) return null
  return section.querySelector<HTMLElement>('div[style*="background-color"]')
}

describe('ContrastLabPage · 修复交互（组件接线层）', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() => {
      root.render(
        <ExperimentLedgerProvider>
          <ContrastLabPage />
        </ExperimentLedgerProvider>,
      )
    })
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
  })

  const textHex = () => controlHexInput(container, '文字颜色')
  const textPicker = () => pickerInput(container, '文字颜色')
  const previewBox = () => tintedBoxInSection(container, '2. 实时预览')

  it('#7 应用修复后，输入框 / 取色器 / 预览 / 检测结果同步为同一个颜色', () => {
    const generate = buttonByLabel(container, '生成修复建议')
    expect(generate, '默认失败配色下应出现「生成修复建议」').toBeTruthy()
    click(generate!)

    const apply = buttonByLabel(container, '应用该修复')
    expect(apply, '生成后应出现「应用该修复」').toBeTruthy()
    expect(textOf(container)).toContain('建议 · 尚未应用')

    click(apply!)

    expect(textHex().value).toBe('#767676')
    expect(textPicker().value).toBe('#767676')
    expect(previewBox()!.style.color.replace(/\s/g, '')).toMatch(/(118,\s*118,\s*118|767676)/i)

    // 检测必须重新执行：读数条与「3. 检测结果」都要变成达标
    const readout = textOf(container.querySelector('[role="status"]'))
    expect(readout).toContain('达到 AA')
    expect(textOf(sectionByHeading(container, '3. 检测结果'))).toContain('达到普通文本 AA')

    // 快照与措辞：已应用，不是「建议」
    expect(textOf(container)).toContain('已应用')
    expect(textOf(container)).not.toContain('建议 · 尚未应用')

    // 背景不能被改动
    expect(pickerInput(container, '背景颜色').value).toBe('#ffffff')
  })

  it('#7 补充：对比区「建议修复后」一栏给出的真实数值确实达标', () => {
    click(buttonByLabel(container, '生成修复建议')!)

    const section = sectionByHeading(container, '5. 修复前后对比')
    expect(section).toBeTruthy()

    // 两栏各有自己的 h4 标题，按标题取所在列，避免在整段文案里猜数字
    const columns = [...section!.querySelectorAll('h4')].map((h) => h.parentElement!)
    expect(columns.length).toBe(2)
    const ratioOf = (col: Element) => {
      const m = textOf(col).match(/(\d+(?:\.\d+)?):1/)
      expect(m, '对比栏应显示实际对比度').toBeTruthy()
      return { value: Number(m![1]), text: textOf(col) }
    }

    const before = ratioOf(columns[0])
    const after = ratioOf(columns[1])
    expect(before.value).toBeLessThan(MIN)
    expect(after.value).toBeGreaterThanOrEqual(MIN)
    expect(after.text).toContain('达到 AA')
    expect(before.text).toContain('未达 AA')
    // 两侧背景必须一致，只有文字色变化（dd 里存的是小写原值，uppercase 只是 CSS 视觉转换）
    const bgOf = (col: Element) => /背景颜色(#[0-9a-f]{6})/i.exec(textOf(col))?.[1]
    expect(bgOf(columns[0])?.toLowerCase()).toBe('#ffffff')
    expect(bgOf(columns[1])?.toLowerCase()).toBe('#ffffff')
  })

  it('#8 撤销修复恢复到应用前状态', () => {
    click(buttonByLabel(container, '生成修复建议')!)
    click(buttonByLabel(container, '应用该修复')!)
    expect(textHex().value).toBe('#767676')

    const undo = buttonByLabel(container, '撤销本次修复')
    expect(undo, '应用后应出现「撤销本次修复」').toBeTruthy()
    click(undo!)

    expect(textHex().value).toBe('#777777')
    expect(textPicker().value).toBe('#777777')
    expect(previewBox()!.style.color).toMatch(/(119,\s*119,\s*119|777777)/i)
    expect(buttonByLabel(container, '生成修复建议')).toBeTruthy()
    expect(sectionByHeading(container, '5. 修复前后对比')).toBeNull()
    expect(sectionByHeading(container, '6. 对比 CSS')).toBeNull()
    expect(textOf(container)).toContain('已撤销本次修复')
  })

  it('#9 手动改色后旧建议失效，过期结论与快照不会残留', () => {
    click(buttonByLabel(container, '生成修复建议')!)
    expect(textOf(container)).toContain('建议文字颜色')

    typeInto(controlHexInput(container, '背景颜色'), '#1a4d8f')

    expect(textOf(container)).not.toContain('建议文字颜色')
    expect(buttonByLabel(container, '应用该修复')).toBeNull()
    expect(sectionByHeading(container, '5. 修复前后对比')).toBeNull()
    expect(sectionByHeading(container, '6. 对比 CSS')).toBeNull()
    expect(buttonByLabel(container, '生成修复建议')).toBeTruthy()

    // 新配色下的检测值是重算的，不是旧结论
    expect(textOf(container.querySelector('[role="status"]')!)).toContain('未达 AA')
  })

  it('#9 已应用后再手动改文字色，快照同样被丢弃', () => {
    click(buttonByLabel(container, '生成修复建议')!)
    click(buttonByLabel(container, '应用该修复')!)
    typeInto(textHex(), '#404040')
    expect(buttonByLabel(container, '撤销本次修复')).toBeNull()
    expect(textOf(container)).not.toContain('修复已应用')
  })

  it('#10 默认配色输入非法十六进制后点重置，输入框与错误提示全部恢复', () => {
    const input = textHex()
    typeInto(input, 'zz')

    expect(input.value).toBe('zz')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(textOf(container)).toContain('请输入有效的十六进制颜色')
    // 非法草稿期间修复必须停摆
    expect(textOf(container)).toContain('修复功能已暂停')
    expect(buttonByLabel(container, '生成修复建议')).toBeNull()

    // 非法输入不得提交：检测仍基于上一次有效配色，并明确说明
    expect(textOf(container.querySelector('[role="status"]')!)).toContain(
      '当前颜色输入无效',
    )

    click(buttonByLabel(container, '重置为默认颜色')!)

    expect(input.value).toBe('#777777')
    expect(input.getAttribute('aria-invalid')).toBeNull()
    expect(textOf(container)).not.toContain('请输入有效的十六进制颜色')
    expect(textOf(container)).not.toContain('修复功能已暂停')
    expect(textOf(container)).not.toContain('当前颜色输入无效')
    expect(buttonByLabel(container, '生成修复建议')).toBeTruthy()
  })

  it('#10 补充：重置时颜色值本来就没变，非法草稿依然被清掉', () => {
    // 文字色保持默认值不变，只在背景框留下非法草稿 —— 单靠 value 变化同步会漏
    const bg = controlHexInput(container, '背景颜色')
    typeInto(bg, 'nope')
    expect(bg.getAttribute('aria-invalid')).toBe('true')

    click(buttonByLabel(container, '重置为默认颜色')!)

    expect(bg.value).toBe('#ffffff')
    expect(bg.getAttribute('aria-invalid')).toBeNull()
    expect(buttonByLabel(container, '生成修复建议')).toBeTruthy()
  })

  it('#11 CSS 区展示的是真实计算出的颜色，改色后立刻清除', () => {
    click(buttonByLabel(container, '生成修复建议')!)
    const code = container.querySelector('pre code')
    expect(code, '应出现 CSS 展示区').toBeTruthy()
    expect(textOf(code)).toContain('#777777')
    expect(textOf(code)).toContain('#767676')
    expect(textOf(code)).toContain('/* 建议修复后 */')

    click(buttonByLabel(container, '应用该修复')!)
    expect(textOf(container.querySelector('pre code')!)).toContain('/* 已应用修复 */')

    typeInto(textHex(), '#abcdef')
    expect(container.querySelector('pre code')).toBeNull()
  })

  it('已达标配色显示「无需修复」，且不出现生成按钮', () => {
    typeInto(textHex(), '#000000')
    expect(textOf(container)).toContain('当前配色已达到普通文本 AA，无需修复')
    expect(buttonByLabel(container, '生成修复建议')).toBeNull()
  })

  it('剪贴板不可用时如实提示，不谎报复制成功', async () => {
    expect('clipboard' in navigator).toBe(false)
    click(buttonByLabel(container, '生成修复建议')!)
    click(buttonByLabel(container, '复制修复后的 CSS')!)
    await act(async () => {
      await Promise.resolve()
    })
    const notice = textOf(container.querySelector('p[role="status"]'))
    expect(notice).toContain('不支持自动复制')
    expect(notice).not.toContain('已复制')
  })

  it('流程中每一步的操作按钮都有准确的可访问名称', () => {
    const names = () => [...container.querySelectorAll('button')].map((b) => textOf(b))
    expect(names()).toContain('生成修复建议')
    expect(names()).toContain('重置为默认颜色')

    click(buttonByLabel(container, '生成修复建议')!)
    // 进入建议态：生成按钮按设计让位给「应用该修复」
    expect(names()).toContain('应用该修复')

    click(buttonByLabel(container, '应用该修复')!)
    expect(names()).toContain('撤销本次修复')
    expect(names()).toContain('复制修复后的 CSS')

    // 取色器也必须有名称，否则键盘/读屏用户只能听到「颜色选择器」
    expect(textPicker().getAttribute('aria-label')).toBe('文字颜色取色器')
    expect(pickerInput(container, '背景颜色').getAttribute('aria-label')).toBe('背景颜色取色器')
  })

  it('场景 A：生成建议后输入非法颜色，旧建议/前后对比/CSS/复制立即失效且不自动复活', () => {
    // 1. 默认失败配色下生成修复建议，四类产物都在
    click(buttonByLabel(container, '生成修复建议')!)
    expect(textOf(container)).toContain('建议文字颜色')
    expect(buttonByLabel(container, '应用该修复')).toBeTruthy()
    expect(sectionByHeading(container, '5. 修复前后对比')).toBeTruthy()
    expect(sectionByHeading(container, '6. 对比 CSS')).toBeTruthy()
    expect(buttonByLabel(container, '复制修复后的 CSS')).toBeTruthy()

    // 2. 文字颜色输入框留下非法草稿（不提交，检测仍基于上一次有效色）
    typeInto(textHex(), 'zz')

    // 3. 非法期间：修复停摆，旧建议 / 应用 / 前后对比 / CSS / 复制全部消失
    expect(textOf(container)).toContain('修复功能已暂停')
    expect(textOf(container)).toContain('当前颜色输入无效')
    expect(textOf(container)).not.toContain('建议文字颜色')
    expect(buttonByLabel(container, '应用该修复')).toBeNull()
    expect(sectionByHeading(container, '5. 修复前后对比')).toBeNull()
    expect(sectionByHeading(container, '6. 对比 CSS')).toBeNull()
    expect(buttonByLabel(container, '复制修复后的 CSS')).toBeNull()

    // 4. 恢复合法输入：旧建议不会自动复活，必须重新点「生成修复建议」
    typeInto(textHex(), '#777777')
    expect(textOf(container)).not.toContain('修复功能已暂停')
    expect(textOf(container)).not.toContain('建议文字颜色')
    expect(buttonByLabel(container, '应用该修复')).toBeNull()
    expect(buttonByLabel(container, '生成修复建议')).toBeTruthy()
  })

  it('场景 B：应用修复后输入非法颜色，旧快照/撤销/前后对比/CSS/复制立即失效且不自动复活', () => {
    // 1. 生成并应用修复，快照态产物都在
    click(buttonByLabel(container, '生成修复建议')!)
    click(buttonByLabel(container, '应用该修复')!)
    expect(textOf(container)).toContain('修复已应用')
    expect(buttonByLabel(container, '撤销本次修复')).toBeTruthy()
    expect(sectionByHeading(container, '5. 修复前后对比')).toBeTruthy()
    expect(sectionByHeading(container, '6. 对比 CSS')).toBeTruthy()
    expect(buttonByLabel(container, '复制修复后的 CSS')).toBeTruthy()

    // 2. 背景颜色输入框留下非法草稿
    typeInto(controlHexInput(container, '背景颜色'), 'ggg')

    // 3. 非法期间：旧快照 / 撤销 / 前后对比 / CSS / 复制全部消失，修复停摆
    expect(textOf(container)).toContain('修复功能已暂停')
    expect(textOf(container)).not.toContain('修复已应用')
    expect(buttonByLabel(container, '撤销本次修复')).toBeNull()
    expect(sectionByHeading(container, '5. 修复前后对比')).toBeNull()
    expect(sectionByHeading(container, '6. 对比 CSS')).toBeNull()
    expect(buttonByLabel(container, '复制修复后的 CSS')).toBeNull()

    // 4. 恢复成合法但仍不合格的输入：仍需重新生成，旧修复不会自动复活
    typeInto(controlHexInput(container, '背景颜色'), '#777777')
    expect(textOf(container)).not.toContain('修复功能已暂停')
    expect(textOf(container)).not.toContain('修复已应用')
    expect(buttonByLabel(container, '撤销本次修复')).toBeNull()
    expect(buttonByLabel(container, '生成修复建议')).toBeTruthy()
  })
})
