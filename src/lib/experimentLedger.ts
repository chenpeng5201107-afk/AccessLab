/**
 * Day 5 统一成果记录（本次浏览器会话的内存台账）
 *
 * 这一层只负责「把三个实验已经真实产生的结论登记下来」，不做任何检测：
 * 数值一律来自 contrast.ts / colorRepair.ts、formLabelAudit.ts、keyboardFocusDemo.ts。
 * 因此报告里出现的每个数字，都是实验页当时真实算出来、真实渲染过的那一份。
 *
 * 台账的语义边界（报告文案必须与之一致）：
 * - 记录的是「本次会话里你在某个实验上做到了哪一步」，不是「当前 DOM 仍是修好的样子」：
 *   实验页在路由切换后会回到自己的初始状态，而台账不会因为切换而清空。
 * - 只有同步（xxx:sync）与显式清除（xxx:clear / clear-all）两种事件；同步事件由实验页在
 *   真实状态变化后发出，因此撤销、重置、改输入都会把旧结论覆盖或清除，不会留下虚假的「已通过」。
 * - 内存 only：不写 localStorage、不发请求、不保存姓名 / 邮箱 / 表单输入内容。
 */

import { contrastRatioFromHex, meetsAaNormalText } from './contrast'
import type { FormLabelAuditReport } from './formLabelAudit'
import { resolveStage, type FocusMode, type ObservationStage } from './keyboardFocusDemo'
import type { KeyboardFocusAuditReport } from './keyboardFocusAudit'

export type ExperimentKey = 'contrast' | 'form-label' | 'keyboard'

export const EXPERIMENT_KEYS: ExperimentKey[] = ['contrast', 'form-label', 'keyboard']

/** 单次检测的问题摘要：数量 + 分类代码，够报告引用，不含任何用户输入 */
export interface IssueSnapshot {
  checkedControlCount: number
  issueCount: number
  codes: string[]
  issues: Array<{ controlId: string; code: string; message: string; standardHint: string }>
  danglingLabelCount: number
}

export type ContrastStage = 'audited' | 'suggested' | 'applied'

export interface ContrastRecord {
  stage: ContrastStage
  /** 当前实验页上正在使用的配色 */
  textColor: string
  backgroundColor: string
  currentRatio: number | null
  currentMeetsAa: boolean | null
  /** 存在建议 / 快照时的那一组前后配色；数值来自 colorRepair.ts 的真实计算 */
  beforeTextColor: string | null
  beforeBackgroundColor: string | null
  beforeRatio: number | null
  beforeMeetsAa: boolean | null
  afterTextColor: string | null
  afterRatio: number | null
  afterMeetsAa: boolean | null
  /** 建议色是否真的写进了实验页面的状态（点过「应用修复」且未被撤销 / 改色失效） */
  repairApplied: boolean
  css: string | null
  /** 输入框里有非法草稿：此时页面上的结论仍来自上一次有效配色 */
  invalidInput: boolean
}

export interface FormLabelRecord {
  /** 缺陷态那次检测；修复后重新进入本页时可能为 null，此时如实写「未记录到修复前的检测」 */
  before: IssueSnapshot | null
  /** 最近一次真实 DOM 检测 */
  after: IssueSnapshot
  repairApplied: boolean
  beforeHtml: string
  afterHtml: string
}

export interface KeyboardRecord {
  mode: FocusMode
  stage: ObservationStage
  beforeSightings: number
  afterSightings: number
  repairApplied: boolean
  manualConfirmed: boolean
  /** 来自真实 DOM 的规则检测，与「看得见吗」这条人工判断严格分开 */
  ruleIssueCount: number | null
  buttonCount: number | null
  keyboardReachableCount: number | null
  beforeCss: string
  afterCss: string
}

export interface LedgerState {
  contrast: ContrastRecord | null
  formLabel: FormLabelRecord | null
  keyboard: KeyboardRecord | null
}

export const emptyLedger: LedgerState = { contrast: null, formLabel: null, keyboard: null }

export type LedgerEvent =
  | { type: 'contrast:sync'; record: ContrastRecord | null }
  | { type: 'form-label:sync'; record: FormLabelRecord | null }
  | { type: 'keyboard:sync'; record: KeyboardRecord | null }
  | { type: 'clear'; key: ExperimentKey }
  | { type: 'clear-all' }

function sameRecord(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function ledgerReducer(state: LedgerState, event: LedgerEvent): LedgerState {
  switch (event.type) {
    case 'contrast:sync':
      return sameRecord(state.contrast, event.record) ? state : { ...state, contrast: event.record }
    case 'form-label:sync':
      return sameRecord(state.formLabel, event.record) ? state : { ...state, formLabel: event.record }
    case 'keyboard:sync':
      return sameRecord(state.keyboard, event.record) ? state : { ...state, keyboard: event.record }
    case 'clear':
      return event.key === 'contrast'
        ? { ...state, contrast: null }
        : event.key === 'form-label'
          ? { ...state, formLabel: null }
          : { ...state, keyboard: null }
    case 'clear-all':
      return state.contrast === null && state.formLabel === null && state.keyboard === null
        ? state
        : { ...emptyLedger }
  }
}

/** 把一次真实检测结果压成报告可引用的摘要 */
export function snapshotFromAudit(report: FormLabelAuditReport): IssueSnapshot {
  return {
    checkedControlCount: report.checkedControlCount,
    issueCount: report.issueCount,
    codes: report.rows.flatMap((row) => row.issues.map((issue) => issue.code)),
    issues: report.rows.flatMap((row) =>
      row.issues.map((issue) => ({
        controlId: row.controlId,
        code: issue.code,
        message: issue.message,
        standardHint: issue.standardHint,
      })),
    ),
    danglingLabelCount: report.danglingLabels.length,
  }
}

export interface ContrastSyncInput {
  textColor: string
  backgroundColor: string
  hasInvalidInput: boolean
  stage: ContrastStage
  repairApplied: boolean
  beforeTextColor: string | null
  afterTextColor: string | null
  css: string | null
}

/**
 * 色彩实验的登记数据：对比度一律现算，且达标与否用未四舍五入的真实值判定
 * （#777777 / #ffffff ≈4.48:1 未达 AA，#767676 / #ffffff ≈4.54:1 达到 AA）。
 */
export function deriveContrastRecord(input: ContrastSyncInput): ContrastRecord {
  const currentRatio = input.hasInvalidInput ? null : contrastRatioFromHex(input.textColor, input.backgroundColor)
  const hasPair = input.beforeTextColor !== null && input.afterTextColor !== null
  const beforeRatio = hasPair
    ? contrastRatioFromHex(input.beforeTextColor!, input.backgroundColor)
    : null
  const afterRatio = hasPair ? contrastRatioFromHex(input.afterTextColor!, input.backgroundColor) : null

  return {
    stage: input.stage,
    textColor: input.textColor,
    backgroundColor: input.backgroundColor,
    currentRatio,
    currentMeetsAa: currentRatio === null ? null : meetsAaNormalText(currentRatio),
    beforeTextColor: input.beforeTextColor,
    beforeBackgroundColor: hasPair ? input.backgroundColor : null,
    beforeRatio,
    beforeMeetsAa: beforeRatio === null ? null : meetsAaNormalText(beforeRatio),
    afterTextColor: input.afterTextColor,
    afterRatio,
    afterMeetsAa: afterRatio === null ? null : meetsAaNormalText(afterRatio),
    repairApplied: input.repairApplied,
    css: input.css,
    invalidInput: input.hasInvalidInput,
  }
}

export interface FormSyncInput {
  labelFixed: boolean
  report: FormLabelAuditReport
  /** 缺陷态那一次检测留下的摘要 */
  before: IssueSnapshot | null
  beforeHtml: string
  afterHtml: string
}

export function deriveFormRecord(input: FormSyncInput): FormLabelRecord {
  const current = snapshotFromAudit(input.report)
  return {
    before: input.labelFixed ? (input.before ?? current) : current,
    after: current,
    repairApplied: input.labelFixed,
    beforeHtml: input.beforeHtml,
    afterHtml: input.afterHtml,
  }
}

export interface KeyboardSyncInput {
  mode: FocusMode
  beforeSightings: number
  afterSightings: number
  confirmed: boolean
  report: KeyboardFocusAuditReport | null
  beforeCss: string
  afterCss: string
}

export function deriveKeyboardRecord(input: KeyboardSyncInput): KeyboardRecord {
  return {
    mode: input.mode,
    stage: resolveStage({
      mode: input.mode,
      beforeSightings: input.beforeSightings,
      afterSightings: input.afterSightings,
      confirmed: input.confirmed,
    }),
    beforeSightings: input.beforeSightings,
    afterSightings: input.afterSightings,
    repairApplied: input.mode === 'repaired',
    manualConfirmed: input.confirmed,
    ruleIssueCount: input.report?.issueCount ?? null,
    buttonCount: input.report?.buttonCount ?? null,
    keyboardReachableCount: input.report?.keyboardReachableCount ?? null,
    beforeCss: input.beforeCss,
    afterCss: input.afterCss,
  }
}

/** 四条进度各自独立：检测过 ≠ 应用了修复 ≠ 重新检测过 ≠ 人工确认过 */
export interface ExperimentProgress {
  inspected: boolean
  repairApplied: boolean
  reVerified: boolean
  manualConfirmed: boolean
}

export function progressOf(key: ExperimentKey, state: LedgerState): ExperimentProgress {
  if (key === 'contrast') {
    const record = state.contrast
    return {
      inspected: record !== null,
      repairApplied: record?.repairApplied === true,
      // 色彩实验没有「改完再扫一遍」这一步：应用后页面立即用真实算法重算当前配色，
      // 所以「重新验证」等价于应用修复后仍算得出现值。
      reVerified: record?.repairApplied === true && record.currentRatio !== null,
      manualConfirmed: false,
    }
  }

  if (key === 'form-label') {
    const record = state.formLabel
    return {
      inspected: record !== null,
      repairApplied: record?.repairApplied === true,
      reVerified: record !== null && record.repairApplied && record.after.issueCount === 0,
      manualConfirmed: false,
    }
  }

  const record = state.keyboard
  return {
    inspected: record !== null,
    repairApplied: record?.repairApplied === true,
    reVerified: record !== null && record.repairApplied && record.afterSightings > 0,
    manualConfirmed: record?.manualConfirmed === true,
  }
}

export interface LedgerSummary {
  experimentCount: number
  recordedCount: number
  notRecordedKeys: ExperimentKey[]
  inspectedCount: number
  repairAppliedCount: number
  reVerifiedCount: number
  manualConfirmedCount: number
}

export function summarizeLedger(state: LedgerState): LedgerSummary {
  const entries = EXPERIMENT_KEYS.map((key) => ({ key, progress: progressOf(key, state) }))
  const recordedKeys = entries.filter((entry) => entry.progress.inspected).map((entry) => entry.key)

  return {
    experimentCount: EXPERIMENT_KEYS.length,
    recordedCount: recordedKeys.length,
    notRecordedKeys: EXPERIMENT_KEYS.filter((key) => !recordedKeys.includes(key)),
    inspectedCount: recordedKeys.length,
    repairAppliedCount: entries.filter((entry) => entry.progress.repairApplied).length,
    reVerifiedCount: entries.filter((entry) => entry.progress.reVerified).length,
    manualConfirmedCount: entries.filter((entry) => entry.progress.manualConfirmed).length,
  }
}
