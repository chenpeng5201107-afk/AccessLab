// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useEffect } from 'react'

import { ExperimentLedgerProvider, useExperimentLedger } from '../context/ExperimentLedgerContext'
import {
  deriveContrastRecord,
  deriveFormRecord,
  deriveKeyboardRecord,
  emptyLedger,
  snapshotFromAudit,
  type LedgerState,
} from '../lib/experimentLedger'
import { auditFormLabels } from '../lib/formLabelAudit'
import { demoFormHtml } from '../lib/formLabelDemoFields'
import { buildRepairCss } from '../lib/colorRepair'
import { BROKEN_FOCUS_CSS, FIXED_FOCUS_CSS } from '../lib/keyboardFocusDemo'
import { NON_CERTIFICATION_STATEMENT } from '../lib/reportModel'
import { ReportPage } from './ReportPage'

/**
 * 报告页的组件接线层：这里的记录全部由 derive* 函数从真实检测结果算出来，
 * 所以页面显示的每一个数字都能追回 formLabelAudit / contrast / keyboardFocusDemo。
 *
 * 覆盖任务书第七节 #7 #8 #9 #10 #11 #12 #13 #14：
 * 页面 / 复制 / 下载同源、空状态与部分完成、撤销后结论失效、剪贴板失败不谎报、
 * 清空需要明确确认、静态可访问性检查（标题层级、状态播报、代码块横向滚动、状态不只靠颜色）。
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

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.appendChild(container)
  auditBox = document.createElement('div')
  document.body.appendChild(auditBox)
  Reflect.deleteProperty(navigator, 'clipboard')
})

afterEach(() => {
  act(() => {
    root.unmount()
  })
  container.remove()
  auditBox.remove()
})

function auditOf(html: string) {
  auditBox.innerHTML = html
  return auditFormLabels(auditBox)
}

function contrastLedger(overrides: { stage: 'audited' | 'suggested' | 'applied'; repairApplied: boolean }): LedgerState {
  const applied = overrides.stage === 'applied'
  return {
    ...emptyLedger,
    contrast: deriveContrastRecord({
      textColor: applied ? '#767676' : '#777777',
      backgroundColor: '#ffffff',
      hasInvalidInput: false,
      stage: overrides.stage,
      repairApplied: overrides.repairApplied,
      beforeTextColor: overrides.stage === 'audited' ? null : '#777777',
      afterTextColor: overrides.stage === 'audited' ? null : '#767676',
      css:
        overrides.stage === 'audited'
          ? null
          : buildRepairCss({
              beforeTextColor: '#777777',
              beforeBackgroundColor: '#ffffff',
              afterTextColor: '#767676',
              afterBackgroundColor: '#ffffff',
              applied,
            }),
    }),
  }
}

function formLedger(labelFixed: boolean): LedgerState {
  return {
    ...emptyLedger,
    formLabel: deriveFormRecord({
      labelFixed,
      report: auditOf(labelFixed ? REPAIRED_FORM : DEFECT_FORM),
      before: snapshotFromAudit(auditOf(DEFECT_FORM)),
      beforeHtml: demoFormHtml(false),
      afterHtml: demoFormHtml(true),
    }),
  }
}

function keyboardLedger(input: { repaired: boolean; before: number; after: number; confirmed: boolean }): LedgerState {
  return {
    ...emptyLedger,
    keyboard: deriveKeyboardRecord({
      mode: input.repaired ? 'repaired' : 'broken',
      beforeSightings: input.before,
      afterSightings: input.after,
      confirmed: input.confirmed,
      report: null,
      beforeCss: BROKEN_FOCUS_CSS,
      afterCss: FIXED_FOCUS_CSS,
    }),
  }
}

function merge(...ledgers: LedgerState[]): LedgerState {
  return ledgers.reduce<LedgerState>(
    (acc, item) => ({
      contrast: item.contrast ?? acc.contrast,
      formLabel: item.formLabel ?? acc.formLabel,
      keyboard: item.keyboard ?? acc.keyboard,
    }),
    emptyLedger,
  )
}

function Seeder({ ledger }: { ledger: LedgerState }) {
  const { dispatch } = useExperimentLedger()
  useEffect(() => {
    dispatch({ type: 'clear-all' })
    if (ledger.contrast) dispatch({ type: 'contrast:sync', record: ledger.contrast })
    if (ledger.formLabel) dispatch({ type: 'form-label:sync', record: ledger.formLabel })
    if (ledger.keyboard) dispatch({ type: 'keyboard:sync', record: ledger.keyboard })
  }, [dispatch, ledger])
  return null
}

function render(ledger: LedgerState) {
  root = createRoot(container)
  act(() => {
    root.render(
      <ExperimentLedgerProvider>
        <>
          <Seeder ledger={ledger} />
          <ReportPage />
        </>
      </ExperimentLedgerProvider>,
    )
  })
}

function rerender(ledger: LedgerState) {
  act(() => {
    root.render(
      <ExperimentLedgerProvider>
        <>
          <Seeder ledger={ledger} />
          <ReportPage />
        </>
      </ExperimentLedgerProvider>,
    )
  })
}

function text(): string {
  return container.textContent ?? ''
}

function byLabel(label: string): HTMLButtonElement {
  const button = [...container.querySelectorAll('button')].find((el) => (el.textContent ?? '').trim() === label)
  expect(button, `页面上应有按钮「${label}」`).toBeTruthy()
  return button as HTMLButtonElement
}

function click(el: HTMLElement) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  })
}

function statusLine(): string {
  const node = container.querySelector('[role="status"][aria-live="polite"]')
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

describe('ReportPage · 空状态与部分完成（要求 #13）', () => {
  it('没有记录时只显示学习入口，不显示统计、导出与清空', () => {
    render(emptyLedger)

    expect(text()).toContain('统一成果报告')
    expect(text()).toContain('还没有实验记录')
    expect(container.querySelector('#report-export-heading')).toBeNull()
    expect(container.querySelector('.report-stats')).toBeNull()
    expect(container.querySelector('a[href="#/diagnosis"]')).toBeTruthy()
    expect(text()).toContain(NON_CERTIFICATION_STATEMENT)
  })

  it('只做完表单实验时：色彩与键盘仍是未记录，不互相冒充', () => {
    render(formLedger(false))

    expect(text()).toContain('已检测，尚未修复')
    expect(text()).toContain('2 项：缺少程序化关联的可见标签、只有 placeholder 在承担标签职责')
    expect(text()).toContain('尚未记录的实验：色彩对比度实验、键盘焦点实验')
    expect(text()).toContain('已检测')
    expect(text()).toContain('1 / 3')
  })
})

describe('ReportPage · 结论边界（要求 #4 #5 #6）', () => {
  it('只生成建议绝不写成已应用', () => {
    render(contrastLedger({ stage: 'suggested', repairApplied: false }))

    expect(text()).toContain('已生成修复建议，尚未应用到实验页面')
    expect(text()).toContain('否：只生成了建议，没有应用到实验页面')
    expect(text()).not.toContain('是：点过「应用修复」')
  })

  it('撤销修复后，报告里不再出现「已应用」', () => {
    render(contrastLedger({ stage: 'applied', repairApplied: true }))
    expect(text()).toContain('是：点过「应用修复」，实验页面的文字颜色确实换成了建议值')

    rerender(contrastLedger({ stage: 'audited', repairApplied: false }))
    expect(text()).not.toContain('是：点过「应用修复」')
    expect(text()).toContain('已检测当前配色，尚未生成修复建议')
  })

  it('键盘实验未经本人确认时，仍列在待人工验证里', () => {
    render(keyboardLedger({ repaired: true, before: 3, after: 3, confirmed: false }))

    expect(text()).toContain('否：还需要你亲自确认')
    expect(text()).toContain('你还没有点「我已完成观察」')
    expect(text()).toContain('不能证明屏幕上真的看得见轮廓')
  })

  it('全做完也不出现总分、百分比或整体合规的说法', () => {
    render(merge(contrastLedger({ stage: 'applied', repairApplied: true }), formLedger(true), keyboardLedger({ repaired: true, before: 3, after: 3, confirmed: true })))

    expect(text()).not.toMatch(/100%|\d{1,3}\s*分\b/)
    expect(text()).toContain('这里不给总分、也不给百分比')
    expect(text()).toContain(NON_CERTIFICATION_STATEMENT)
  })

  it('每个实验卡都带回实验页的入口', () => {
    render(emptyLedger)

    const links = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href'))
    expect(links).toContain('#/contrast')
    expect(links).toContain('#/form-label')
    expect(links).toContain('#/keyboard')
  })
})

describe('ReportPage · 复制与下载（要求 #11 #12 #14）', () => {
  it('复制的就是页面上那份 Markdown，一字不加', async () => {
    render(merge(contrastLedger({ stage: 'applied', repairApplied: true }), formLedger(true)))
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    click(byLabel('复制 Markdown 报告'))
    await act(async () => {
      await Promise.resolve()
    })

    expect(writeText).toHaveBeenCalledTimes(1)
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement
    expect(writeText.mock.calls[0][0]).toBe(textarea.value)
    expect(statusLine()).toContain('已复制完整 Markdown 报告')
    const copied = writeText.mock.calls[0][0] as string
    expect(copied).toContain('# AccessLab 统一成果报告')
    expect(copied).toContain('修复已应用到实验页面，并按新配色重新算过')
    expect(copied).toContain('<label for="student-name">姓名</label>')
    expect(copied).toContain('## 本次没有检查的范围')
  })

  it('剪贴板不可用时如实说明，并给出手动复制方式', async () => {
    render(formLedger(true))

    click(byLabel('复制 Markdown 报告'))
    await act(async () => {
      await Promise.resolve()
    })

    expect(statusLine()).toContain('当前浏览器不支持自动复制')
    expect(statusLine()).toContain('手动')
    expect(text()).not.toContain('已复制完整 Markdown 报告')
    expect(container.querySelector('textarea')?.value).toContain('# AccessLab 统一成果报告')
  })

  it('剪贴板被拒绝时不谎报成功', async () => {
    render(formLedger(true))
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')) },
      configurable: true,
    })

    click(byLabel('复制 Markdown 报告'))
    await act(async () => {
      await Promise.resolve()
    })

    expect(statusLine()).toContain('复制失败')
    expect(text()).not.toContain('已复制完整 Markdown 报告')
  })

  it('下载在浏览器本地生成 .md：内容与复制一致，且不请求任何网络地址', async () => {
    render(merge(formLedger(true), keyboardLedger({ repaired: true, before: 3, after: 3, confirmed: true })))

    const clicks: HTMLAnchorElement[] = []
    let captured: Blob | undefined
    const originalClick = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = function patched(this: HTMLAnchorElement) {
      clicks.push(this)
    }
    const createObjectURL = vi.fn((blob: Blob) => {
      captured = blob
      return 'blob:accesslab-report'
    })
    const revokeObjectURL = vi.fn()
    Object.defineProperty(window.URL, 'createObjectURL', { value: createObjectURL, configurable: true })
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true })

    click(byLabel('下载 .md 文件'))
    await act(async () => {
      await Promise.resolve()
    })

    HTMLAnchorElement.prototype.click = originalClick

    expect(clicks).toHaveLength(1)
    expect(clicks[0].download).toMatch(/^AccessLab-成果报告-[0-9]+\.md$/)
    expect(clicks[0].href).toBe('blob:accesslab-report')
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:accesslab-report')

    const markdown = await captured!.text()
    expect(markdown).toContain('已修复并通过重新检测（仅指示例控件的标签关联）')
    expect(markdown).toContain('是：由你点击「我已完成观察」记录，不是程序自动判定')
    expect(markdown).toContain(NON_CERTIFICATION_STATEMENT)
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe(markdown)
    expect(statusLine()).toContain('没有上传到任何服务器')
  })

  it('浏览器不支持本地下载时给出手动方案', () => {
    render(formLedger(true))
    Object.defineProperty(window.URL, 'createObjectURL', { value: undefined, configurable: true })

    click(byLabel('下载 .md 文件'))

    expect(statusLine()).toContain('当前浏览器不支持本地下载')
  })
})

describe('ReportPage · 清空需要明确确认（要求 #10）', () => {
  it('第一下只进入确认状态，取消后记录仍在', () => {
    render(formLedger(true))

    click(byLabel('清空本次实验记录'))
    expect(text()).toContain('确认清空本次会话登记的实验记录？')
    expect(byLabel('复制 Markdown 报告').disabled).toBe(false)

    click(byLabel('取消，保留记录'))
    expect(text()).not.toContain('确认清空本次会话登记的实验记录？')
    expect(text()).toContain('已修复并通过重新检测（仅指示例控件的标签关联）')
    expect(document.activeElement).toBe(byLabel('清空本次实验记录'))
  })

  it('确认后才真的清空，焦点不丢并且播报结果', () => {
    render(merge(formLedger(true), contrastLedger({ stage: 'applied', repairApplied: true })))

    click(byLabel('清空本次实验记录'))
    expect(document.activeElement).toBe(byLabel('确认清空记录'))
    // 只清记录：实验页的示例内容、其它站点数据都不在管辖范围
    expect(text()).toContain('不会清除浏览器其它数据')

    click(byLabel('确认清空记录'))

    expect(statusLine()).toContain('已清空本次会话登记的实验记录')
    expect(text()).toContain('还没有实验记录')
    expect(byLabel('复制 Markdown 报告').disabled).toBe(true)
    // 清空后触发按钮变成禁用态，禁用按钮接不住焦点；焦点必须留在可见的状态提示上，不能掉回 body
    expect(byLabel('清空本次实验记录').disabled).toBe(true)
    expect(document.activeElement).toBe(container.querySelector('[role="status"]'))
    expect(document.activeElement).not.toBe(document.body)
  })
})

describe('ReportPage · 静态可访问性检查（要求 #14）', () => {
  it('一个 h1、层级不跳级，状态区用 role=status 播报', () => {
    render(merge(formLedger(true), keyboardLedger({ repaired: false, before: 3, after: 0, confirmed: false })))

    const headings = [...container.querySelectorAll('h1, h2, h3, h4')].map((el) => Number(el.tagName[1]))
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    // 标题层级可以回退到上一级，但不能跳级（例如 h2 直接出现 h4）
    for (let index = 1; index < headings.length; index += 1) {
      expect(headings[index] - headings[index - 1]).toBeLessThanOrEqual(1)
    }

    const live = container.querySelector('[role="status"]')
    expect(live?.getAttribute('aria-live')).toBe('polite')
    expect(live?.getAttribute('aria-atomic')).toBe('true')
  })

  it('所有操作控件都有可读名称，代码块自己横向滚动', () => {
    render(formLedger(true))

    for (const button of container.querySelectorAll('button')) {
      expect((button.textContent ?? '').trim().length).toBeGreaterThan(0)
    }
    const pres = [...container.querySelectorAll('pre')]
    expect(pres.length).toBeGreaterThan(0)
    for (const pre of pres) {
      expect(pre.className).toContain('overflow-x-auto')
      expect(pre.className).toContain('min-w-0')
    }
    const textarea = container.querySelector('textarea')!
    expect(container.querySelector(`label[for="${textarea.id}"]`)).toBeTruthy()
  })

  it('状态不只靠颜色：通过 / 未通过都带文字与图标', () => {
    render(merge(contrastLedger({ stage: 'applied', repairApplied: true }), formLedger(false)))

    expect(text()).toContain('达到 AA（≥4.5:1）')
    expect(text()).toContain('未达 AA')
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(0)
    const passIcons = [...container.querySelectorAll('svg')]
    for (const icon of passIcons) {
      expect(icon.getAttribute('aria-hidden')).toBe('true')
    }
  })
})
