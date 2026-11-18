import {
  BASE_CLASS,
  BROKEN_CLASS,
  DEMO_STYLE_ATTR,
  FIXED_CLASS,
  type FocusMode,
} from './keyboardFocusDemo'

/**
 * Day 4 的「检测」只读浏览器里已经渲染出来的真实节点：
 * 示例按钮身上的类名、以及页面注入的那张样式表里到底写了什么规则。
 *
 * 它能证明的只有两件事：哪一条规则现在挂在按钮上、那条规则有没有把轮廓去掉。
 * 它不能证明轮廓在你的屏幕上真的看得见 —— 那需要真实浏览器 + 人眼，见 DEVLOG 的浏览器取证记录。
 * jsdom 不实现 :focus-visible 匹配，也不做级联计算，因此 getComputedStyle 一类的断言留给浏览器。
 */

export interface DemoButtonRow {
  id: string
  accessibleName: string
  /** 原生 button、未被禁用、没有正 tabindex：这三条一起决定「键盘能不能正常走到」 */
  keyboardReachable: boolean
  tabIndexAttribute: string | null
  variant: 'broken' | 'fixed' | 'unknown'
}

export interface FocusRuleSnapshot {
  className: string
  present: boolean
  /** 该类的 :focus-visible 规则里是否写了 outline: none / outline: 0 */
  suppressesOutline: boolean
  /** 该类的 :focus-visible 规则里是否定义了实心轮廓 */
  definesVisibleOutline: boolean
  ruleText: string | null
}

export interface KeyboardFocusAuditReport {
  scopeFound: boolean
  stylesheetFound: boolean
  buttonCount: number
  /** 其中真正能被键盘正常走到的数量，与 buttonCount 不一致时页面必须如实显示差异 */
  keyboardReachableCount: number
  rows: DemoButtonRow[]
  /** 按钮当前实际使用的样式状态；混合状态以第一个按钮为准并如实标记 */
  mode: FocusMode | null
  modeConsistent: boolean
  brokenRule: FocusRuleSnapshot
  fixedRule: FocusRuleSnapshot
  /** 现在挂在按钮上的那条规则 */
  activeRule: FocusRuleSnapshot | null
  issueCodes: KeyboardFocusIssueCode[]
  issueCount: number
  /** 焦点是否被完全移除（outline:none 且没有任何实心轮廓规则生效） */
  indicatorSuppressed: boolean
}

export type KeyboardFocusIssueCode =
  /** 当前生效的规则写了 outline: none / 0，键盘焦点没有可见痕迹 */
  | 'focus-indicator-suppressed'
  /** 样式状态说自己是修复态，但样式表里找不到带实心轮廓的规则 */
  | 'visible-outline-rule-missing'

export const ISSUE_TEXT: Record<KeyboardFocusIssueCode, { message: string; standardHint: string }> = {
  'focus-indicator-suppressed': {
    message: '当前挂在按钮上的规则把焦点轮廓去掉了，键盘焦点在屏幕上没有可见痕迹。',
    standardHint: 'WCAG 2.2 SC 2.4.7 Focus Visible（程序侧只判断规则文本，实际可见性仍需人工确认）',
  },
  'visible-outline-rule-missing': {
    message: '按钮已经换成修复态类名，但样式表里那条规则并没有定义实心轮廓。',
    standardHint: 'WCAG 2.2 SC 2.4.7 Focus Visible',
  },
}

/** 抓出 `<class>:focus-visible { ... }` 这一整块；只在本页自己注入的样式表上跑，不去猜全站级联 */
function extractFocusRule(sheetText: string, className: string): string | null {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`\\.${escaped}\\s*:focus-visible\\s*\\{[^}]*\\}`, 'm')
  return pattern.exec(sheetText)?.[0] ?? null
}

function classifyRule(className: string, ruleText: string | null): FocusRuleSnapshot {
  if (ruleText === null) {
    return {
      className,
      present: false,
      suppressesOutline: false,
      definesVisibleOutline: false,
      ruleText: null,
    }
  }

  const declarations = ruleText.slice(ruleText.indexOf('{') + 1, ruleText.lastIndexOf('}'))
  const outlineDecl = /outline\s*:\s*([^;]+)/i.exec(declarations)?.[1]?.trim() ?? null

  const suppressesOutline = outlineDecl !== null && /^(none|0|medium\s+none|none\s+solid)/i.test(outlineDecl)
  const definesVisibleOutline =
    outlineDecl !== null &&
    !suppressesOutline &&
    /\d/.test(outlineDecl) &&
    /solid|dashed|dotted|double|groove|ridge|inset|outset/i.test(outlineDecl)

  return { className, present: true, suppressesOutline, definesVisibleOutline, ruleText }
}

function variantOf(element: Element): DemoButtonRow['variant'] {
  if (element.classList.contains(BROKEN_CLASS)) return 'broken'
  if (element.classList.contains(FIXED_CLASS)) return 'fixed'
  return 'unknown'
}

export function auditKeyboardFocusDemo(scope: Element | null): KeyboardFocusAuditReport {
  const emptyBroken = classifyRule(BROKEN_CLASS, null)
  const emptyFixed = classifyRule(FIXED_CLASS, null)

  if (scope === null) {
    return {
      scopeFound: false,
      stylesheetFound: false,
      buttonCount: 0,
      keyboardReachableCount: 0,
      rows: [],
      mode: null,
      modeConsistent: false,
      brokenRule: emptyBroken,
      fixedRule: emptyFixed,
      activeRule: null,
      issueCodes: [],
      issueCount: 0,
      indicatorSuppressed: false,
    }
  }

  const buttons = [...scope.querySelectorAll<HTMLButtonElement>(`button.${BASE_CLASS}`)]

  const rows: DemoButtonRow[] = buttons.map((button) => ({
    id: button.id,
    accessibleName: (button.textContent ?? '').replace(/\s+/g, ' ').trim(),
    keyboardReachable: button.tagName === 'BUTTON' && !button.disabled && button.tabIndex >= 0,
    tabIndexAttribute: button.getAttribute('tabindex'),
    variant: variantOf(button),
  }))

  const variants = new Set(rows.map((row) => row.variant))
  const singleVariant = variants.size === 1 ? [...variants][0] : 'unknown'
  const mode: FocusMode | null =
    singleVariant === 'broken' ? 'broken' : singleVariant === 'fixed' ? 'repaired' : null

  const styleEl = scope.querySelector<HTMLStyleElement>(`style[${DEMO_STYLE_ATTR}]`)
  const sheetText = styleEl?.textContent ?? ''
  const brokenRule = classifyRule(BROKEN_CLASS, extractFocusRule(sheetText, BROKEN_CLASS))
  const fixedRule = classifyRule(FIXED_CLASS, extractFocusRule(sheetText, FIXED_CLASS))

  const activeRule = mode === 'broken' ? brokenRule : mode === 'repaired' ? fixedRule : null
  const indicatorSuppressed = activeRule?.suppressesOutline === true
  const visibleRuleMissing = mode === 'repaired' && !fixedRule.definesVisibleOutline

  const issueCodes: KeyboardFocusIssueCode[] = []
  if (indicatorSuppressed) issueCodes.push('focus-indicator-suppressed')
  if (visibleRuleMissing) issueCodes.push('visible-outline-rule-missing')

  return {
    scopeFound: true,
    stylesheetFound: styleEl !== null && sheetText.trim() !== '',
    buttonCount: rows.length,
    keyboardReachableCount: rows.filter((row) => row.keyboardReachable).length,
    rows,
    mode,
    modeConsistent: variants.size <= 1 && singleVariant !== 'unknown',
    brokenRule,
    fixedRule,
    activeRule,
    issueCodes,
    issueCount: issueCodes.length,
    indicatorSuppressed,
  }
}
