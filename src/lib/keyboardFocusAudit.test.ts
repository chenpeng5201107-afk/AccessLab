// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'

import {
  BASE_CLASS,
  BROKEN_CLASS,
  BROKEN_FOCUS_CSS,
  DEMO_BUTTONS,
  DEMO_STYLE_ATTR,
  DEMO_STYLE_SHEET,
  FIXED_CLASS,
  FIXED_FOCUS_CSS,
} from './keyboardFocusDemo'
import { auditKeyboardFocusDemo } from './keyboardFocusAudit'

/**
 * 「检测」只允许读已经渲染出来的真实节点，所以这里的夹具就是手工搭出来的真 DOM：
 * 一个带 data 标记的 style 节点 + 三个带类名的 button。
 * 关键回归是「只换节点上的类名，结论必须跟着翻」——它证明结论来自节点，不是来自参数。
 */

function makeScope(options: {
  variant?: 'broken' | 'fixed' | 'mixed' | 'none'
  sheet?: string | null
  tabIndex?: string
  disabled?: boolean
} = {}): HTMLElement {
  const scope = document.createElement('div')

  if (options.sheet !== null) {
    const style = document.createElement('style')
    style.setAttribute(DEMO_STYLE_ATTR, 'true')
    style.textContent = options.sheet ?? DEMO_STYLE_SHEET
    scope.appendChild(style)
  }

  DEMO_BUTTONS.forEach((spec, index) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.id = spec.id
    button.textContent = spec.label
    const variant =
      options.variant === 'mixed' ? (index === 0 ? 'broken' : 'fixed') : (options.variant ?? 'broken')
    if (variant !== 'none') button.className = `${BASE_CLASS} ${variant === 'broken' ? BROKEN_CLASS : FIXED_CLASS}`
    if (options.tabIndex !== undefined) button.setAttribute('tabindex', options.tabIndex)
    if (options.disabled) button.disabled = true
    scope.appendChild(button)
  })

  document.body.appendChild(scope)
  return scope
}

const scopes: HTMLElement[] = []

function withScope(options: Parameters<typeof makeScope>[0] = {}): HTMLElement {
  const scope = makeScope(options)
  scopes.push(scope)
  return scope
}

afterEach(() => {
  scopes.splice(0).forEach((scope) => scope.remove())
})

describe('auditKeyboardFocusDemo · 没有节点就没有结论', () => {
  it('scope 为 null 时全表归零，不编造按钮数量', () => {
    const report = auditKeyboardFocusDemo(null)
    expect(report.scopeFound).toBe(false)
    expect(report.buttonCount).toBe(0)
    expect(report.keyboardReachableCount).toBe(0)
    expect(report.mode).toBeNull()
    expect(report.indicatorSuppressed).toBe(false)
  })

  it('缺陷态：三个按钮、样式状态读成 broken、轮廓确实被 outline: none 压掉', () => {
    const report = auditKeyboardFocusDemo(withScope())

    expect(report.scopeFound).toBe(true)
    expect(report.stylesheetFound).toBe(true)
    expect(report.buttonCount).toBe(3)
    expect(report.mode).toBe('broken')
    expect(report.modeConsistent).toBe(true)
    expect(report.brokenRule.present).toBe(true)
    expect(report.brokenRule.suppressesOutline).toBe(true)
    expect(report.fixedRule.definesVisibleOutline).toBe(true)
    expect(report.indicatorSuppressed).toBe(true)
    expect(report.issueCodes).toEqual(['focus-indicator-suppressed'])
    expect(report.issueCount).toBe(1)
    expect(report.activeRule?.ruleText).toBe(BROKEN_FOCUS_CSS)
  })

  it('按钮的可访问名称来自真实文本，三个都读得到', () => {
    const report = auditKeyboardFocusDemo(withScope())
    expect(report.rows.map((row) => row.accessibleName)).toEqual(['查看详情', '保存选择', '返回上一步'])
    expect(report.rows.every((row) => row.keyboardReachable)).toBe(true)
  })
})

describe('auditKeyboardFocusDemo · 结论跟着节点变（节点级回归）', () => {
  it('只把类名从 broken 换成 fixed，样式状态与「有没有轮廓」就一起翻转', () => {
    const scope = withScope()
    expect(auditKeyboardFocusDemo(scope).indicatorSuppressed).toBe(true)

    scope.querySelectorAll('button').forEach((button) => {
      button.classList.remove(BROKEN_CLASS)
      button.classList.add(FIXED_CLASS)
    })

    const after = auditKeyboardFocusDemo(scope)
    expect(after.mode).toBe('repaired')
    expect(after.indicatorSuppressed).toBe(false)
    expect(after.issueCount).toBe(0)
    expect(after.activeRule?.ruleText).toBe(FIXED_FOCUS_CSS)
  })

  it('类名写着 fixed 但样式表里的轮廓规则被删掉 → 两条问题都如实报，不跟着类名说谎', () => {
    const crippled = DEMO_STYLE_SHEET.replace(FIXED_FOCUS_CSS, `.${FIXED_CLASS}:focus-visible {\n  outline: none;\n}`)
    const report = auditKeyboardFocusDemo(withScope({ variant: 'fixed', sheet: crippled }))

    expect(report.fixedRule.definesVisibleOutline).toBe(false)
    expect(report.indicatorSuppressed).toBe(true)
    expect(report.issueCodes).toEqual(['focus-indicator-suppressed', 'visible-outline-rule-missing'])
    expect(report.issueCount).toBe(2)
  })

  it('样式表节点缺失时如实说明没读到，而不是默认「已修复」', () => {
    const report = auditKeyboardFocusDemo(withScope({ sheet: null }))
    expect(report.stylesheetFound).toBe(false)
    expect(report.brokenRule.present).toBe(false)
    expect(report.fixedRule.present).toBe(false)
    expect(report.indicatorSuppressed).toBe(false)
  })

  it('按钮没有挂任何实验类名 → 样式状态读不出来，不猜', () => {
    const report = auditKeyboardFocusDemo(withScope({ variant: 'none' }))
    expect(report.mode).toBeNull()
    expect(report.modeConsistent).toBe(false)
    expect(report.rows.every((row) => row.variant === 'unknown')).toBe(true)
  })

  it('三个按钮类名不一致时不假装成一个整体状态', () => {
    const report = auditKeyboardFocusDemo(withScope({ variant: 'mixed' }))
    expect(report.modeConsistent).toBe(false)
    expect(report.mode).toBeNull()
  })

  it('tabindex 与 disabled 会被如实计入「键盘能不能走到」', () => {
    expect(auditKeyboardFocusDemo(withScope({ tabIndex: '-1' })).keyboardReachableCount).toBe(0)

    const disabledScope = withScope({ disabled: true })
    expect(auditKeyboardFocusDemo(disabledScope).keyboardReachableCount).toBe(0)
    expect(auditKeyboardFocusDemo(disabledScope).buttonCount).toBe(3)
  })
})

describe('auditKeyboardFocusDemo · 解析器与真实样式表对得上', () => {
  it('用页面真正注入的那张表，两条规则都能被认出来', () => {
    const report = auditKeyboardFocusDemo(withScope({ variant: 'fixed' }))
    expect(report.brokenRule.ruleText).toBe(BROKEN_FOCUS_CSS)
    expect(report.fixedRule.ruleText).toBe(FIXED_FOCUS_CSS)
  })

  it('样式表里只有无关选择器时，不会把别人的规则当成示例按钮的规则', () => {
    const scope = withScope({
      variant: 'fixed',
      sheet: `.x:focus-visible { outline: none; } .y:focus-visible { outline: 2px dashed #000; }`,
    })
    const report = auditKeyboardFocusDemo(scope)
    // 类名对不上时两条规则都应读不到，解析器不会把无关规则当成按钮的规则
    expect(report.brokenRule.present).toBe(false)
    expect(report.fixedRule.present).toBe(false)
  })
})
