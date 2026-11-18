// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  deriveContrastRecord,
  deriveFormRecord,
  deriveKeyboardRecord,
  emptyLedger,
  ledgerReducer,
  progressOf,
  snapshotFromAudit,
  summarizeLedger,
  type ContrastRecord,
  type LedgerState,
} from './experimentLedger'
import { auditFormLabels } from './formLabelAudit'
import { BROKEN_FOCUS_CSS, FIXED_FOCUS_CSS } from './keyboardFocusDemo'

/**
 * 台账层的真值表：报告页里的每个数字都要能追到这里，而这里又只接受实验页真实算出来的输入。
 * 重点钉住三件事：边界值用未取整判定、建议与应用分开、人工确认只能由键盘那两条硬条件换来。
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

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
})

afterEach(() => {
  container.remove()
})

function contrast(input: Partial<Parameters<typeof deriveContrastRecord>[0]>) {
  return deriveContrastRecord({
    textColor: '#777777',
    backgroundColor: '#ffffff',
    hasInvalidInput: false,
    stage: 'audited',
    repairApplied: false,
    beforeTextColor: null,
    afterTextColor: null,
    css: null,
    ...input,
  })
}

describe('ledgerReducer · 同步与去重', () => {
  it('同一条记录重复同步不会制造新的状态对象', () => {
    const record = contrast({})
    const first = ledgerReducer(emptyLedger, { type: 'contrast:sync', record })
    const second = ledgerReducer(first, { type: 'contrast:sync', record })

    expect(second).toBe(first)
    expect(second.contrast).toEqual(record)
  })

  it('新的真实结果会覆盖旧结论：撤销后不再有「已应用」', () => {
    const applied = contrast({ stage: 'applied', repairApplied: true, beforeTextColor: '#777777', afterTextColor: '#595959' })
    const afterUndo = contrast({ stage: 'audited', repairApplied: false, textColor: '#777777' })

    const withApply = ledgerReducer(emptyLedger, { type: 'contrast:sync', record: applied })
    expect(withApply.contrast?.repairApplied).toBe(true)

    const cleared = ledgerReducer(withApply, { type: 'contrast:sync', record: afterUndo })
    expect(cleared.contrast?.repairApplied).toBe(false)
    expect(cleared.contrast?.stage).toBe('audited')
  })

  it('clear 只清掉指定实验，clear-all 清空三条', () => {
    const withTwo = ledgerReducer(
      ledgerReducer(emptyLedger, { type: 'contrast:sync', record: contrast({}) }),
      { type: 'form-label:sync', record: deriveFormRecord({ labelFixed: false, report: auditFormLabels(mountForm(DEFECT_FORM)), before: null, beforeHtml: 'A', afterHtml: 'B' }) },
    )

    const onlyForm = ledgerReducer(withTwo, { type: 'clear', key: 'contrast' })
    expect(onlyForm.contrast).toBeNull()
    expect(onlyForm.formLabel).not.toBeNull()

    const none = ledgerReducer(onlyForm, { type: 'clear-all' })
    expect(none).toEqual(emptyLedger)
    expect(ledgerReducer(none, { type: 'clear-all' })).toBe(none)
  })

  function mountForm(html: string) {
    container.innerHTML = html
    return container
  }
})

describe('deriveContrastRecord · 边界值用未取整判定', () => {
  it('#777777 / #ffffff 仍未达 AA，#767676 / #ffffff 才算达到', () => {
    const failing = contrast({})
    expect(failing.currentRatio).toBeCloseTo(4.478, 3)
    expect(failing.currentMeetsAa).toBe(false)

    const passing = contrast({ textColor: '#767676' })
    expect(passing.currentRatio).toBeCloseTo(4.54, 2)
    expect(passing.currentMeetsAa).toBe(true)
  })

  it('只生成建议时 repairApplied 为 false，应用后才为 true', () => {
    const suggested = contrast({
      stage: 'suggested',
      beforeTextColor: '#777777',
      afterTextColor: '#595959',
      css: '/* 建议 */',
    })
    expect(suggested.repairApplied).toBe(false)
    expect(suggested.stage).toBe('suggested')
    expect(suggested.beforeMeetsAa).toBe(false)
    expect(suggested.afterMeetsAa).toBe(true)

    const applied = contrast({
      stage: 'applied',
      repairApplied: true,
      textColor: '#595959',
      beforeTextColor: '#777777',
      afterTextColor: '#595959',
      css: '/* 已应用 */',
    })
    expect(applied.repairApplied).toBe(true)
    expect(applied.afterTextColor).toBe('#595959')
  })

  it('输入非法时不产出新的数值结论，并留下标记', () => {
    const record = contrast({ hasInvalidInput: true, textColor: '#12', stage: 'audited' })
    expect(record.currentRatio).toBeNull()
    expect(record.currentMeetsAa).toBeNull()
    expect(record.invalidInput).toBe(true)
  })
})

describe('deriveFormRecord · 修复前摘要与重检结果分开保存', () => {
  const defectReport = () => {
    container.innerHTML = DEFECT_FORM
    return auditFormLabels(container)
  }
  const repairedReport = () => {
    container.innerHTML = REPAIRED_FORM
    return auditFormLabels(container)
  }

  it('缺陷态：before 与 after 都是当前那次检测，repairApplied 为 false', () => {
    const record = deriveFormRecord({
      labelFixed: false,
      report: defectReport(),
      before: null,
      beforeHtml: '<span>姓名</span>',
      afterHtml: '<label for="student-name">姓名</label>',
    })

    expect(record.repairApplied).toBe(false)
    expect(record.before?.issueCount).toBe(2)
    expect(record.after.issueCount).toBe(2)
    expect(record.after.checkedControlCount).toBe(2)
  })

  it('修复后：after 来自新的真实 DOM，before 保留缺陷态那一次的分类', () => {
    const beforeSnapshot = snapshotFromAudit(defectReport())
    const record = deriveFormRecord({
      labelFixed: true,
      report: repairedReport(),
      before: beforeSnapshot,
      beforeHtml: '<span>姓名</span>',
      afterHtml: '<label for="student-name">姓名</label>',
    })

    expect(record.repairApplied).toBe(true)
    expect(record.after.issueCount).toBe(0)
    expect(record.before?.issueCount).toBe(2)
    expect(record.before?.codes).toEqual(expect.arrayContaining(['no-associated-label', 'placeholder-as-only-name']))
  })

  it('快照只带控件与问题分类，不带任何用户输入内容', () => {
    container.innerHTML = DEFECT_FORM
    const input = container.querySelector('#student-name') as HTMLInputElement
    input.value = '张三'
    const snapshot = snapshotFromAudit(auditFormLabels(container))

    expect(JSON.stringify(snapshot)).not.toContain('张三')
    expect(snapshot.issues.every((issue) => issue.controlId.length > 0)).toBe(true)
  })
})

describe('deriveKeyboardRecord · 三个结论互不冒充', () => {
  const base = {
    beforeSightings: 0,
    afterSightings: 0,
    confirmed: false,
    report: null,
    beforeCss: BROKEN_FOCUS_CSS,
    afterCss: FIXED_FOCUS_CSS,
  }

  it('只走过修复前一轮：已体验、未应用修复、未确认', () => {
    const record = deriveKeyboardRecord({ ...base, mode: 'broken', beforeSightings: 3 })
    expect(record.stage).toBe('awaiting-manual-check')
    expect(record.repairApplied).toBe(false)
    expect(record.manualConfirmed).toBe(false)
    expect(record.beforeSightings).toBe(3)
    expect(record.afterSightings).toBe(0)
  })

  it('应用修复但修复后没走过：repairApplied true、reVerified false', () => {
    const record = deriveKeyboardRecord({ ...base, mode: 'repaired', beforeSightings: 3 })
    expect(record.stage).toBe('repair-applied')
    expect(record.repairApplied).toBe(true)
    expect(progressOf('keyboard', { ...emptyLedger, keyboard: record }).reVerified).toBe(false)
  })

  it('两轮都走过但没点确认：仍然不算已人工确认', () => {
    const record = deriveKeyboardRecord({ ...base, mode: 'repaired', beforeSightings: 3, afterSightings: 3 })
    expect(record.stage).toBe('awaiting-confirmation')
    expect(record.manualConfirmed).toBe(false)
    expect(progressOf('keyboard', { ...emptyLedger, keyboard: record }).reVerified).toBe(true)
  })

  it('真实 DOM 检测结果原样带入，没有结果时保持 null', () => {
    expect(deriveKeyboardRecord({ ...base, mode: 'broken' }).ruleIssueCount).toBeNull()
    const withReport = deriveKeyboardRecord({
      ...base,
      mode: 'repaired',
      report: { issueCount: 0, buttonCount: 3, keyboardReachableCount: 3 } as never,
    })
    expect(withReport.ruleIssueCount).toBe(0)
    expect(withReport.keyboardReachableCount).toBe(3)
  })
})

describe('summarizeLedger · 总览只统计真实记录', () => {
  const keyboardBase = {
    beforeSightings: 0,
    afterSightings: 0,
    confirmed: false,
    report: null,
    beforeCss: BROKEN_FOCUS_CSS,
    afterCss: FIXED_FOCUS_CSS,
  }

  function auditOf(html: string) {
    container.innerHTML = html
    return auditFormLabels(container)
  }

  it('空台账：三个实验都未记录，任何「已完成」计数都是 0', () => {
    const summary = summarizeLedger(emptyLedger)
    expect(summary.experimentCount).toBe(3)
    expect(summary.recordedCount).toBe(0)
    expect(summary.repairAppliedCount).toBe(0)
    expect(summary.reVerifiedCount).toBe(0)
    expect(summary.manualConfirmedCount).toBe(0)
    expect(summary.notRecordedKeys).toEqual(['contrast', 'form-label', 'keyboard'])
  })

  it('部分完成：只有真正应用过修复的实验计入 repairAppliedCount', () => {
    const ledger: LedgerState = {
      contrast: contrast({ stage: 'audited' }),
      formLabel: deriveFormRecord({
        labelFixed: true,
        report: auditOf(REPAIRED_FORM),
        before: snapshotFromAudit(auditOf(DEFECT_FORM)),
        beforeHtml: 'A',
        afterHtml: 'B',
      }),
      keyboard: deriveKeyboardRecord({ ...keyboardBase, mode: 'broken' }),
    }

    const summary = summarizeLedger(ledger)
    expect(summary.recordedCount).toBe(3)
    expect(summary.repairAppliedCount).toBe(1)
    expect(summary.reVerifiedCount).toBe(1)
    expect(summary.manualConfirmedCount).toBe(0)
    expect(summary.notRecordedKeys).toEqual([])
  })

  it('色彩实验即使被计入，也只在其自身达到条件时才算复验', () => {
    const record: ContrastRecord = contrast({
      stage: 'applied',
      repairApplied: true,
      textColor: '#595959',
      beforeTextColor: '#777777',
      afterTextColor: '#595959',
    })
    const ledger: LedgerState = { ...emptyLedger, contrast: record }
    expect(progressOf('contrast', ledger).reVerified).toBe(true)
    expect(progressOf('contrast', ledger).manualConfirmed).toBe(false)
  })
})
