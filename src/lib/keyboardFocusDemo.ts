/**
 * Day 4 键盘焦点实验的数据源。
 *
 * 这里最重要的一条约定：注入到页面上的真实 CSS，与代码对比区展示给学员看的 CSS，
 * 必须是同一批字符串常量（都由 RULE_LINES 生成）。这样「展示的代码」和「实际生效的规则」
 * 不可能各说各话，也能在自动化测试里逐字符比对。
 */

export type FocusMode = 'broken' | 'repaired'

export const BASE_CLASS = 'kf-demo-btn'
export const BROKEN_CLASS = 'kf-demo-btn--broken'
export const FIXED_CLASS = 'kf-demo-btn--fixed'
/** 第 4 节示意图使用的类：把轮廓「钉」在静态插图上，插图本身不参与 Tab 顺序 */
export const PREVIEW_FIXED_CLASS = 'kf-demo-btn--preview-fixed'

/** 焦点轮廓颜色与修复后代码里写的完全一致 */
export const FOCUS_RING_COLOR = '#4338ca'
export const FOCUS_RING_WIDTH = '3px'

/** WCAG 2.2 SC 1.4.11 非文本对比度的最低要求：焦点指示这类 UI 组件状态与其相邻颜色的对比 */
export const NON_TEXT_MIN_CONTRAST_RATIO = 3

/**
 * 焦点规则逐行定义：before 是缺陷态，after 是修复态。
 * before / after 为 null 表示该行只存在于其中一版。
 */
const RULE_LINES: Array<{ selector: string; before: string | null; after: string | null }> = [
  { selector: `${BROKEN_CLASS} / ${FIXED_CLASS}`, before: null, after: null },
  {
    selector: ':focus-visible',
    before: `.${BROKEN_CLASS}:focus-visible {`,
    after: `.${FIXED_CLASS}:focus-visible {`,
  },
  {
    selector: 'outline',
    before: '  outline: none;',
    after: `  outline: ${FOCUS_RING_WIDTH} solid ${FOCUS_RING_COLOR};`,
  },
  {
    selector: 'outline-offset',
    before: null,
    after: '  outline-offset: 3px;',
  },
  { selector: 'close', before: '}', after: '}' },
]

function renderRule(side: 'before' | 'after'): string {
  return RULE_LINES.map((line) => line[side])
    .filter((line): line is string => line !== null)
    .join('\n')
}

export const BROKEN_FOCUS_CSS = renderRule('before')
export const FIXED_FOCUS_CSS = renderRule('after')

export interface CssRuleLine {
  text: string
  /** 该行是否为修复真正改动（或新增）的部分，用于高亮关键变化 */
  changed: boolean
}

export function focusCssLines(fixed: boolean): CssRuleLine[] {
  return RULE_LINES.filter((line) => (fixed ? line.after : line.before) !== null).map((line) => {
    const text = (fixed ? line.after : line.before)!
    const other = fixed ? line.before : line.after
    return { text, changed: text !== other }
  })
}

/** 按钮常态外观：与 AccessLab 的白底 / 浅灰描边一致；刻意不写任何 transition */
const BASE_CSS = `/* 教学示例按钮的常态外观（与焦点指示无关） */
.${BASE_CLASS} {
  min-height: 44px;
  padding: 10px 18px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  background-color: #ffffff;
  color: #1e293b;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.25rem;
  text-align: center;
  transition: none;
}`

/**
 * hover 只跟随指针，键盘 Tab 不会产生 hover，因此它不能代替焦点指示。
 * 故意保留一条很轻的 hover 变化，让学员能分辨「鼠标划过的反应」和「键盘焦点的痕迹」。
 */
const HOVER_CSS = `/* 指针悬停的样子：它不是焦点指示，别把它当成键盘焦点 */
.${BASE_CLASS}:hover {
  border-color: #94a3b8;
}`

/** 无动画：焦点指示不该靠动效取胜，同时也天然满足 prefers-reduced-motion */
const REDUCED_MOTION_CSS = `/* 焦点轮廓不使用动画；保留这条声明，是为了让「不依赖动效」这件事写清楚 */
@media (prefers-reduced-motion: reduce) {
  .${BASE_CLASS},
  .${BASE_CLASS}:focus-visible,
  .${PREVIEW_FIXED_CLASS} {
    transition: none;
    animation: none;
  }
}`

/** 第 4 节静态示意区使用：把修复后的轮廓效果画在一张不能聚焦的图上 */
const PREVIEW_CSS = `/* 修复前后对比区的静态示意图专用：轮廓被固定在图上，图本身不参与 Tab 顺序 */
.${PREVIEW_FIXED_CLASS} {
  outline: ${FOCUS_RING_WIDTH} solid ${FOCUS_RING_COLOR};
  outline-offset: 3px;
}`

/** 实际注入页面的完整样式表；代码对比区的两块内容就是它的逐字子串 */
export const DEMO_STYLE_SHEET = [BASE_CSS, HOVER_CSS, BROKEN_FOCUS_CSS, FIXED_FOCUS_CSS, PREVIEW_CSS, REDUCED_MOTION_CSS].join(
  '\n\n',
)

export const DEMO_STYLE_ATTR = 'data-keyboard-focus-demo'

export function demoButtonClassName(mode: FocusMode): string {
  return `${BASE_CLASS} ${mode === 'repaired' ? FIXED_CLASS : BROKEN_CLASS}`
}

/** 当前样式状态下真正生效的那条焦点规则 */
export function activeFocusCss(mode: FocusMode): string {
  return mode === 'repaired' ? FIXED_FOCUS_CSS : BROKEN_FOCUS_CSS
}

export function inactiveFocusCss(mode: FocusMode): string {
  return mode === 'repaired' ? BROKEN_FOCUS_CSS : FIXED_FOCUS_CSS
}

export interface DemoButtonSpec {
  id: string
  label: string
  /** 说明该按钮在演示流程里做什么，用于告诉学员这三个按钮不是摆设 */
  actionHint: string
}

export const DEMO_BUTTONS: DemoButtonSpec[] = [
  {
    id: 'kf-view-details',
    label: '查看详情',
    actionHint: '展开／收起当前这条借阅记录的详细信息',
  },
  {
    id: 'kf-save-selection',
    label: '保存选择',
    actionHint: '把当前这条记录加入下方已保存列表',
  },
  {
    id: 'kf-step-back',
    label: '返回上一步',
    actionHint: '撤回最近一次保存，把记录退回候选位置',
  },
]

export interface DemoRecord {
  id: string
  title: string
  shelf: string
  due: string
}

/** 演示数据：只是本页内存里的三条示例馆藏，不发请求、不写任何存储 */
export const DEMO_RECORDS: DemoRecord[] = [
  { id: 'rec-wcag', title: '《WCAG 实战》', shelf: '主馆 3 楼 无障碍书架', due: '2026-11-20' },
  { id: 'rec-ud', title: '《通用设计原理》', shelf: '分馆 密集书库', due: '2026-11-25' },
  { id: 'rec-a11y', title: '《从坡道到屏幕阅读器》', shelf: '参考阅览室', due: '2026-12-02' },
]

export interface DemoWorkflowState {
  detailsOpen: boolean
  savedIds: string[]
  lastMessage: string | null
}

export const initialDemoWorkflowState: DemoWorkflowState = {
  detailsOpen: false,
  savedIds: [],
  lastMessage: null,
}

export type DemoWorkflowEvent =
  | { type: 'toggle-details' }
  | { type: 'save-current' }
  | { type: 'step-back' }
  | { type: 'reset' }

/** 当前待处理的记录：已保存几条，就轮到第几条；三条都保存完就停在最后一条并如实说明 */
export function currentRecordIndex(savedCount: number): number {
  return Math.min(savedCount, DEMO_RECORDS.length - 1)
}

export function currentRecord(savedCount: number): DemoRecord {
  return DEMO_RECORDS[currentRecordIndex(savedCount)]
}

export function recordById(id: string): DemoRecord | undefined {
  return DEMO_RECORDS.find((record) => record.id === id)
}

export function demoWorkflowReducer(
  state: DemoWorkflowState,
  event: DemoWorkflowEvent,
): DemoWorkflowState {
  switch (event.type) {
    case 'toggle-details':
      return {
        ...state,
        detailsOpen: !state.detailsOpen,
        lastMessage: state.detailsOpen
          ? `已收起详情。当前候选记录：${currentRecord(state.savedIds.length).title}。`
          : `已展开详情：${currentRecord(state.savedIds.length).title} · ${currentRecord(state.savedIds.length).shelf}。`,
      }

    case 'save-current': {
      if (state.savedIds.length >= DEMO_RECORDS.length) {
        return {
          ...state,
          lastMessage: '三条示例记录都已保存完毕，可先按「返回上一步」撤回一条。',
        }
      }
      const record = currentRecord(state.savedIds.length)
      if (state.savedIds.includes(record.id)) {
        return { ...state, lastMessage: `「${record.title}」已经在已保存列表里，没有重复写入。` }
      }
      return {
        ...state,
        savedIds: [...state.savedIds, record.id],
        lastMessage: `已保存 ${state.savedIds.length + 1} / ${DEMO_RECORDS.length} 条：${record.title}（应归还 ${record.due}）。`,
      }
    }

    case 'step-back': {
      if (state.savedIds.length === 0) {
        return { ...state, lastMessage: '没有可撤销的保存记录：列表已经是空的。' }
      }
      const removed = state.savedIds[state.savedIds.length - 1]
      const record = recordById(removed)
      return {
        ...state,
        savedIds: state.savedIds.slice(0, -1),
        lastMessage: `已撤回最近一次保存：${record?.title ?? removed}，现在剩 ${state.savedIds.length - 1} 条。`,
      }
    }

    case 'reset':
      return { ...initialDemoWorkflowState }
  }
}

/**
 * 教学状态机的五个阶段：把「CSS 改了」「修复后又用键盘走了一遍」「人真的确认了」分开记。
 *
 * 观察次数按修复前 / 修复后两轮独立统计：只有一轮记录不足以说明学员真的比较过两种样式，
 * 「我已完成观察」也因此必须同时看到两轮记录才放开。
 */
export type ObservationStage =
  | 'not-experienced'
  | 'awaiting-manual-check'
  | 'repair-applied'
  | 'awaiting-confirmation'
  | 'confirmed'

/** 修复前（缺陷态）与修复后（修复态）各算一轮，互不借用对方的次数 */
export type SightingPhase = 'before' | 'after'
export type SightingCounts = Record<SightingPhase, Record<string, number>>

export function emptySightingCounts(): SightingCounts {
  return { before: {}, after: {} }
}

/** 应用修复时保留修复前的那一轮，只把修复后那一轮从零开始 */
export function startAfterPhase(counts: SightingCounts): SightingCounts {
  return { before: counts.before, after: {} }
}

export function phaseOfMode(mode: FocusMode): SightingPhase {
  return mode === 'repaired' ? 'after' : 'before'
}

export function recordKeyboardSighting(
  counts: SightingCounts,
  phase: SightingPhase,
  buttonId: string,
): SightingCounts {
  const current = counts[phase]
  return { ...counts, [phase]: { ...current, [buttonId]: (current[buttonId] ?? 0) + 1 } }
}

export function sightingTotal(counts: Record<string, number>): number {
  return Object.values(counts).reduce((sum, count) => sum + count, 0)
}

export interface ObservationInput {
  mode: FocusMode
  /** 缺陷态下，键盘导航真正到达过示例按钮的次数 */
  beforeSightings: number
  /** 修复态下，键盘导航真正到达过示例按钮的次数 */
  afterSightings: number
}

export interface StageInput extends ObservationInput {
  confirmed: boolean
}

export const STAGE_META: Record<
  ObservationStage,
  { label: string; detail: string; tone: 'neutral' | 'warn' | 'info' | 'done' }
> = {
  'not-experienced': {
    label: '尚未体验',
    detail: '键盘焦点还没有到达过示例按钮。请先按 Tab 走一遍。',
    tone: 'neutral',
  },
  'awaiting-manual-check': {
    label: '待人工检查',
    detail:
      '焦点已经到达过示例按钮，但当前样式刻意去掉了轮廓——它到底看不看得见，只能由你的眼睛判断。',
    tone: 'warn',
  },
  'repair-applied': {
    label: '已应用焦点修复',
    detail:
      '页面已换上带轮廓的焦点规则。这一步只是「CSS 生效了」，还需要你再用 Tab 走一次并确认观察结果。',
    tone: 'info',
  },
  'awaiting-confirmation': {
    label: '修复后已用键盘复走',
    detail:
      '修复后的按钮你已经用 Tab 走过一轮。最后一步是把「看不看得见」交给你自己判断，再点「我已完成观察」。',
    tone: 'info',
  },
  confirmed: {
    label: '用户已确认观察结果',
    detail: '你确认了自己看到的差别。这条记录来自你的观察，不是程序自动扫描的结论。',
    tone: 'done',
  },
}

export function resolveStage({
  mode,
  beforeSightings,
  afterSightings,
  confirmed,
}: StageInput): ObservationStage {
  if (confirmed) return 'confirmed'
  if (mode === 'repaired') return afterSightings > 0 ? 'awaiting-confirmation' : 'repair-applied'
  return beforeSightings > 0 ? 'awaiting-manual-check' : 'not-experienced'
}

export const OBSERVATION_STATEMENT =
  '你已经体验了焦点指示修复。本次实验只验证了指定组件的焦点显示与基本操作，不能代表整个网站已经符合全部无障碍规范。'

export const CONFIRM_DISABLED_REASON =
  '「我已完成观察」要等你先点过「修复焦点指示」，并在修复前后各用 Tab 走一遍示例按钮后才可确认。'

/**
 * 确认观察的三条硬条件：修复前真的用键盘走过、修复已经应用、修复后又走过一轮。
 * 缺任何一条，「我已完成观察」都只是程序替学员签字。
 */
export function canConfirmObservation({ mode, beforeSightings, afterSightings }: ObservationInput): boolean {
  return mode === 'repaired' && beforeSightings > 0 && afterSightings > 0
}

/** 按当前还缺的那一步说明为什么不能确认；三条都满足时返回 null */
export function confirmBlockReason({ mode, beforeSightings, afterSightings }: ObservationInput): string | null {
  if (mode !== 'repaired') return CONFIRM_DISABLED_REASON
  if (beforeSightings === 0) {
    return '修复后的规则已经挂上了，但修复前那一轮没有键盘记录，两轮无从比较。请点「重置实验」，先用 Tab 走一遍原始按钮。'
  }
  if (afterSightings === 0) {
    return '修复已经应用，但修复后这一轮还没走过。请再用 Tab 走一遍同样三个按钮，然后才能记录你的观察。'
  }
  return null
}
