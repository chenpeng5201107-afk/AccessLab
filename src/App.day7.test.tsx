// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import App from './App'
import { buildReportModel, manualVerificationGroups, renderReportMarkdown } from './lib/reportModel'
import {
  deriveContrastRecord,
  deriveFormRecord,
  deriveKeyboardRecord,
  emptyLedger,
  snapshotFromAudit,
  type LedgerState,
} from './lib/experimentLedger'
import { auditFormLabels } from './lib/formLabelAudit'
import { demoFormHtml } from './lib/formLabelDemoFields'
import { buildRepairCss } from './lib/colorRepair'
import { BROKEN_FOCUS_CSS, FIXED_FOCUS_CSS, BASE_CLASS } from './lib/keyboardFocusDemo'

/**
 * Day 7 综合质量验收的回归网。
 *
 * 三件事各守一条线：
 * - 报告里「人工验证」的三种状态不能互相冒充（A2）：确认过的键盘观察不再挂在待完成清单，
 *   但屏幕阅读器 / 真实设备这类额外验证不会因为一次点击就变成「已做过」；
 * - 页面上的统计数字必须等于它下面真正列出的条目数，且与导出的 Markdown 同源；
 * - 首页主操作提前到核心价值说明之后仍然只有一条、六个导航入口一个不少（A1 / A3）。
 *
 * 渲染的是完整 App（外壳 + hash 路由 + 会话台账），三实验靠真实点击跑完，
 * 所以这里的读数与报告页显示的是同一条数据链，不是手抄的期望值。
 */

const DEFECT_FORM = `
  <form>
    <div><span>姓名</span><input id="student-name" type="text" placeholder="请输入姓名"></div>
    <div><label for="student-email">电子邮箱</label><input id="student-email" type="email" placeholder="example@school.edu"></div>
  </form>
`

const REPAIRED_FORM = `
  <form>
    <div><label for="student-name">姓名</label><input id="student-name" type="text" placeholder="请输入姓名"></div>
    <div><label for="student-email">电子邮箱</label><input id="student-email" type="email" placeholder="example@school.edu"></div>
  </form>
`

let container: HTMLDivElement
let root: Root
let auditBox: HTMLDivElement

function squeeze(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function mainText(): string {
  return squeeze(document.querySelector('main')?.textContent ?? '')
}

function buttonByLabel(label: string): HTMLButtonElement {
  const button = [...document.querySelectorAll('button')].find((el) => squeeze(el.textContent ?? '') === label)
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

function auditOf(html: string) {
  auditBox.innerHTML = html
  return auditFormLabels(auditBox)
}

function fullLedger(keyboardConfirmed: boolean): LedgerState {
  return {
    contrast: deriveContrastRecord({
      textColor: '#767676',
      backgroundColor: '#ffffff',
      hasInvalidInput: false,
      stage: 'applied',
      repairApplied: true,
      beforeTextColor: '#777777',
      afterTextColor: '#767676',
      css: buildRepairCss({
        beforeTextColor: '#777777',
        beforeBackgroundColor: '#ffffff',
        afterTextColor: '#767676',
        afterBackgroundColor: '#ffffff',
        applied: true,
      }),
    }),
    formLabel: deriveFormRecord({
      labelFixed: true,
      report: auditOf(REPAIRED_FORM),
      before: snapshotFromAudit(auditOf(DEFECT_FORM)),
      beforeHtml: demoFormHtml(false),
      afterHtml: demoFormHtml(true),
    }),
    keyboard: deriveKeyboardRecord({
      mode: 'repaired',
      beforeSightings: 3,
      afterSightings: 3,
      confirmed: keyboardConfirmed,
      report: null,
      beforeCss: BROKEN_FOCUS_CSS,
      afterCss: FIXED_FOCUS_CSS,
    }),
  }
}

/** 报告页上真正渲染出来的人工验证分组：标题声称几条，下面就得列出几条 */
function renderedManualGroups(): Array<{ heading: string; claimed: number; actual: number }> {
  return [...document.querySelectorAll('main h4')]
    .filter((h) => /（\d+ 项）/.test(h.textContent ?? ''))
    .map((h) => {
      const heading = squeeze(h.textContent ?? '')
      const list = h.parentElement?.querySelector('ul') ?? null
      return {
        heading,
        claimed: Number(heading.match(/（(\d+) 项）/)?.[1] ?? -1),
        actual: list ? list.querySelectorAll(':scope > li').length : 0,
      }
    })
}

function markdownSource(): string {
  const box = document.querySelector<HTMLTextAreaElement>('textarea#report-markdown-source')
  expect(box, '报告页应有只读的 Markdown 全文框').toBeTruthy()
  return box!.value
}

function runAllThreeLabs(thenConfirm = true) {
  goto('#/contrast')
  click(buttonByLabel('生成修复建议'))
  click(buttonByLabel('应用该修复'))
  goto('#/form-label')
  click(buttonByLabel('修复标签关联'))
  goto('#/keyboard')
  demoButtons().forEach(pressTabThenFocus)
  click(buttonByLabel('修复焦点指示'))
  demoButtons().forEach(pressTabThenFocus)
  if (thenConfirm) click(buttonByLabel('我已完成观察'))
  goto('#/report')
}

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  window.location.hash = '#/'
  container = document.createElement('div')
  document.body.appendChild(container)
  auditBox = document.createElement('div')
  document.body.appendChild(auditBox)
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
  auditBox.remove()
  window.location.hash = '#/'
  vi.restoreAllMocks()
  Reflect.deleteProperty(navigator, 'clipboard')
})

describe('Day 7 A2 · 报告人工验证的三种状态', () => {
  it('三实验全部完成且键盘已确认时，不再把同一次 Tab 观察列为待完成', () => {
    const model = buildReportModel(fullLedger(true), new Date(2026, 10, 18, 10, 30, 0))

    expect(model.summary.recordedCount).toBe(3)
    expect(model.summary.manualConfirmedCount).toBe(1)
    expect(model.pendingManual.join('\n')).not.toContain('你还没有点「我已完成观察」')
    expect(model.confirmedManual).toHaveLength(1)
    expect(model.confirmedManual[0]).toContain('键盘焦点实验')
    expect(model.confirmedManual[0]).toContain('由你本人点击「我已完成观察」确认')
  })

  it('键盘未确认时，仍如实留在实验内待完成清单', () => {
    const model = buildReportModel(fullLedger(false), new Date(2026, 10, 18, 10, 30, 0))

    expect(model.pendingManual.join('\n')).toContain('你还没有点「我已完成观察」')
    expect(model.pendingManual.join('\n')).not.toContain('也没有走完修复前后的两轮键盘体验')
    expect(model.confirmedManual).toEqual([])
  })

  it('一次确认不会把屏幕阅读器与真实设备验证说成已做过', () => {
    const model = buildReportModel(fullLedger(true), new Date(2026, 10, 18, 10, 30, 0))
    const extra = model.extraVerification.join('\n')

    expect(model.extraVerification).toHaveLength(3)
    expect(extra).toContain('NVDA / VoiceOver')
    expect(extra).toContain('本项目未做任何真机辅助技术测试')
    expect(extra).toContain('其它浏览器与真实屏幕阅读器组合')
    // 额外验证一栏没有任何「已完成」状态可挂
    expect(extra).not.toMatch(/已通过|已验证|已符合/)
    expect(model.confirmedManual.join('\n')).not.toMatch(/NVDA|VoiceOver|屏幕阅读器/)
  })

  it('色彩的主观可读性没有确认入口，始终留在待完成并说明原因', () => {
    const model = buildReportModel(fullLedger(true), new Date(2026, 10, 18, 10, 30, 0))

    expect(model.pendingManual).toHaveLength(1)
    expect(model.pendingManual[0]).toContain('色彩对比度实验')
    expect(model.pendingManual[0]).toContain('实验页没有记录这一步的按钮')
  })

  it('空台账不编造任何人工验证条目', () => {
    const model = buildReportModel(emptyLedger, new Date(2026, 10, 18, 10, 30, 0))

    expect(model.pendingManual).toEqual([])
    expect(model.confirmedManual).toEqual([])
    expect(model.extraVerification).toEqual([])
    expect(renderReportMarkdown(model)).toContain('本次会话没有已记录的实验，暂无可引用的人工验证项。')
  })

  it('确认之后撤销键盘实验，待完成提示会如实回来', () => {
    const before = buildReportModel(fullLedger(true), new Date(2026, 10, 18, 10, 30, 0))
    const afterReset = buildReportModel(
      { ...fullLedger(true), keyboard: deriveKeyboardRecord({ mode: 'broken', beforeSightings: 0, afterSightings: 0, confirmed: false, report: null, beforeCss: BROKEN_FOCUS_CSS, afterCss: FIXED_FOCUS_CSS }) },
      new Date(2026, 10, 18, 10, 30, 0),
    )

    expect(before.confirmedManual).toHaveLength(1)
    expect(afterReset.confirmedManual).toEqual([])
    expect(afterReset.pendingManual.join('\n')).toContain('你还没有点「我已完成观察」')
  })
})

describe('Day 7 A2 · 统计数字、页面与 Markdown 同源', () => {
  it('真实点完三实验并确认后，报告页不再出现「你还没有点」', () => {
    runAllThreeLabs()

    const text = mainText()
    expect(text).toContain('实验内已确认：键盘焦点实验')
    expect(text).not.toContain('你还没有点「我已完成观察」')
    expect(text).toContain('仍需你人工验证：本实验内的 Tab 观察你已经确认过')
  })

  it('每个分组的标题数字等于它下面真正列出的条目数', () => {
    runAllThreeLabs()

    const groups = renderedManualGroups()
    expect(groups).toHaveLength(3)
    for (const group of groups) {
      expect(group.actual, `「${group.heading}」的条目数应与标题一致`).toBe(group.claimed)
    }
    const model = buildReportModel(fullLedger(true), new Date(2026, 10, 18, 10, 30, 0))
    expect(groups.map((g) => g.claimed)).toEqual([
      model.pendingManual.length,
      model.confirmedManual.length,
      model.extraVerification.length,
    ])
  })

  it('未确认时同一套数字会跟着变，不会停在旧值', () => {
    runAllThreeLabs(false)

    const groups = renderedManualGroups()
    expect(groups).toHaveLength(3)
    for (const group of groups) {
      expect(group.actual).toBe(group.claimed)
    }
    expect(groups[0].claimed).toBe(2)
    expect(groups[1].claimed).toBe(0)
  })

  it('分组标题与条目逐字出现在导出的 Markdown 里', () => {
    runAllThreeLabs()

    const markdown = markdownSource()
    const model = buildReportModel(fullLedger(true), new Date(2026, 10, 18, 10, 30, 0))
    for (const group of manualVerificationGroups(model)) {
      expect(markdown).toContain(group.heading)
      for (const item of group.items) {
        expect(markdown).toContain(item)
      }
    }
    expect(markdown).toContain('实验内已确认：键盘焦点实验')
    expect(markdown).not.toContain('你还没有点「我已完成观察」')
  })

  it('人工确认口径写清了它不代表读屏或整站验证', () => {
    runAllThreeLabs()

    expect(mainText()).toContain('点过确认只代表你在那台设备上看过')
  })
})

describe('Day 7 A1 · 首页主操作', () => {
  it('主按钮紧跟在核心价值说明之后，且全页只有一个是「开始校园初诊」', () => {
    const main = document.querySelector('main')
    expect(main).toBeTruthy()

    const cta = [...main!.querySelectorAll('a')].find((a) => squeeze(a.textContent ?? '') === '开始校园初诊')
    expect(cta, '首页应有唯一的主操作「开始校园初诊」').toBeTruthy()
    expect(cta!.getAttribute('href')).toBe('#/diagnosis')
    expect([...main!.querySelectorAll('a')].filter((a) => squeeze(a.textContent ?? '') === '开始校园初诊')).toHaveLength(1)

    const lead = main!.querySelector('h1 + p')
    const experiments = main!.querySelector('#experiments')
    expect(lead, '首页应有核心价值说明').toBeTruthy()
    // 阅读顺序：标题、任务、开始入口、专项实验。
    expect(lead!.compareDocumentPosition(cta!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(cta!.compareDocumentPosition(experiments!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('压缩首屏的同时没有丢品牌主张与实验入口', () => {
    const text = mainText()

    expect(text).toContain('让网页的障碍，看得见、改得掉。')
    for (const label of ['色彩对比度实验', '表单标签实验', '键盘焦点实验']) {
      expect(text).toContain(label)
    }
    expect(text).toContain('摄影社报名页')
    expect(text).toContain('图书馆预约页')
    expect(text).toContain('Hack4Good · 技术向善')
    expect(document.querySelector('footer')?.textContent).toContain('Hack4Good · 技术向善')
  })
})

describe('Day 7 A3 · 顶部导航', () => {
  it('展开后按 Escape 会收起导航并把焦点还给按钮', () => {
    const toggle = document.querySelector<HTMLButtonElement>('button[aria-controls="site-nav"]')!
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    const link = document.querySelector<HTMLAnchorElement>('#site-nav a')!
    act(() => link.focus())
    act(() => { link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })) })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(toggle)
  })

  it('六个导航入口齐全，且全部带着 44px 目标高度类名', () => {
    const links = [...document.querySelectorAll('header nav a')]

    expect(links.map((a) => squeeze(a.textContent ?? ''))).toEqual([
      '首页',
      '案例学习',
      '色彩对比度实验',
      '表单标签实验',
      '键盘焦点实验',
      '成果报告',
    ])
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['#/', '#/diagnosis', '#/contrast', '#/form-label', '#/keyboard', '#/report'])
    for (const link of links) {
      expect(link.className).toContain('min-h-11')
      expect(link.className).not.toContain('min-h-9')
    }
  })

  it('当前页仍带 aria-current，桌面与移动用同一档目标高度', () => {
    goto('#/keyboard')

    const active = document.querySelector('header nav a[aria-current="page"]')
    expect(squeeze(active?.textContent ?? '')).toBe('键盘焦点实验')
    expect([...document.querySelectorAll('header nav a[aria-current="page"]')]).toHaveLength(1)
  })
})

describe('Day 7 B1 · 主操作把按钮换成结果块后，焦点要有人接住', () => {
  /** 焦点落点：jsdom 里读 activeElement，等价于真机上看键盘用户停在哪 */
  function focusNow(): { tag: string; text: string; isBody: boolean } {
    const el = document.activeElement as HTMLElement | null
    return {
      tag: el ? el.tagName.toLowerCase() : 'none',
      text: squeeze(el === document.body ? '' : el?.textContent ?? ''),
      isBody: el === document.body,
    }
  }

  it('色彩实验：生成 / 应用 / 撤销三步的结果块都接住焦点，不落回 body', () => {
    goto('#/contrast')

    click(buttonByLabel('生成修复建议'))
    const afterGenerate = focusNow()
    expect(afterGenerate.isBody).toBe(false)
    expect(afterGenerate.text).toContain('建议文字颜色')
    expect(afterGenerate.text).toContain('建议 · 尚未应用')

    click(buttonByLabel('应用该修复'))
    const afterApply = focusNow()
    expect(afterApply.isBody).toBe(false)
    expect(afterApply.text).toContain('修复已应用')
    expect(afterApply.text).toContain('撤销本次修复')

    click(buttonByLabel('撤销本次修复'))
    const afterUndo = focusNow()
    expect(afterUndo.isBody).toBe(false)
    expect(afterUndo.text).toMatch(/^已撤销本次修复，文字颜色恢复为 #777777/)
    expect(mainText()).toContain('4.48:1')
  })

  it('表单实验：修好之后焦点落在「标签关联已修复」这一行', () => {
    goto('#/form-label')

    click(buttonByLabel('修复标签关联'))
    const afterFix = focusNow()
    expect(afterFix.isBody).toBe(false)
    expect(afterFix.text).toContain('标签关联已修复（当前 DOM 使用 label + htmlFor）')
  })

  it('键盘实验：应用修复后焦点落在「已应用焦点修复」这一行，且不污染两轮计数', () => {
    goto('#/keyboard')
    demoButtons().forEach(pressTabThenFocus)
    const before = mainText()

    click(buttonByLabel('修复焦点指示'))
    const afterFix = focusNow()
    expect(afterFix.isBody).toBe(false)
    expect(afterFix.text).toContain('已应用焦点修复')

    click(buttonByLabel('重置实验'))
    // 重置只是把内容换回初始态：焦点交接不该在这一步被误触发
    expect(focusNow().text).not.toContain('已应用焦点修复')
    expect(buttonByLabel('修复焦点指示')).toBeTruthy()
    expect(mainText()).toContain('修复前键盘到达 0 次')
    expect(before).toContain('修复前键盘到达 3 次')
  })

  it('接住焦点的是结果块本身：可程序聚焦、不进入 Tab 顺序、也不新增播报区', () => {
    goto('#/contrast')
    click(buttonByLabel('生成修复建议'))

    const el = document.activeElement as HTMLElement
    expect(el.getAttribute('tabindex')).toBe('-1')
    expect(el.getAttribute('role')).toBeNull()
    expect(el.getAttribute('aria-live')).toBeNull()
    // 焦点块就在原来那个操作区里，没有被扔到页面别处
    expect(sectionTitleOf(el)).toContain('智能修复建议')
  })
})

function sectionTitleOf(el: Element): string {
  return squeeze(el.closest('section')?.querySelector('h2')?.textContent ?? '')
}

describe('Day 7 · 旧功能与台账无回归', () => {
  it('三实验真实跑完后报告读数仍是 3/3，且色彩数值来自算法', () => {
    runAllThreeLabs()

    const text = mainText()
    expect(text).toContain('4.48')
    expect(text).toContain('4.54')
    expect(text).toContain('没有发现问题')
    expect(document.querySelector('.report-stats dd')?.textContent).toBe('3 / 3')
  })

  it('清空报告后三种人工验证状态一起归零', () => {
    runAllThreeLabs()
    expect(renderedManualGroups().length).toBe(3)

    click(buttonByLabel('清空本次实验记录'))
    click(buttonByLabel('确认清空记录'))

    const text = mainText()
    expect(text).toContain('还没有实验记录')
    expect(renderedManualGroups()).toEqual([])
    expect(document.querySelector('.report-stats')).toBeNull()
  })
})
