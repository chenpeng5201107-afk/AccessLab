/**
 * 统一成果报告的数据层（纯函数）
 *
 * 报告页与导出的 Markdown 使用同一个 buildReportModel() 结果，
 * 所以「屏幕上看到的」和「复制 / 下载下来的」逐字一致；这里不重新实现任何检测，
 * 只把 src/lib/experimentLedger.ts 里已经真实产生的结果排成人能读、也能核对的结构。
 */

import { formatContrastRatio } from './contrast'
import { STAGE_META } from './keyboardFocusDemo'
import { ROUTE_HASH } from '../hooks/useHashRoute'
import {
  EXPERIMENT_KEYS,
  progressOf,
  summarizeLedger,
  type ContrastRecord,
  type ExperimentKey,
  type ExperimentProgress,
  type FormLabelRecord,
  type IssueSnapshot,
  type KeyboardRecord,
  type LedgerState,
  type LedgerSummary,
} from './experimentLedger'

export const NON_CERTIFICATION_STATEMENT = '本报告仅针对 AccessLab 内置示例，不是网站 WCAG 合规认证。'

export const SESSION_SCOPE_STATEMENT =
  '这些记录只保存在本次浏览器会话的内存里：刷新页面或关闭标签页就会清空，不写入 localStorage、数据库或任何服务器，也不保存你在示例表单里输入的文字。'

export const SNAPSHOT_STATEMENT =
  '台账记录的是「你在本次会话里对该实验做到了哪一步」。实验页在路由切换后会回到自己的初始状态，因此「已应用修复」表示会话内确实改过并留下了前后证据，不代表你此刻打开的页面仍处于修复状态。'

/**
 * 人工验证的三种状态必须分开数，不能揉成一张「待办」清单：
 * - in-lab 待完成：本实验里由你亲自做的那一步，产品还没有记录到；
 * - in-lab 已完成：你已经做完并点过确认，这条就从待办移到已完成，不再重复提醒；
 * - 建议额外验证：需要真实辅助技术或真实设备场景，产品没有覆盖，点过任何确认都不算做过。
 * done 为 null 表示该实验没有供你确认的入口，因此它的观察项会一直留在待完成一栏；
 * pending 为 null 表示这项验证本来就不在实验内（如需要真实读屏软件的表单实验）。
 */
const IN_LAB_MANUAL: Record<ExperimentKey, { pending: string | null; done: string | null }> = {
  contrast: {
    pending:
      '色彩对比度实验：在你自己的屏幕上确认这段示例文字是否真的读得舒服（数值达标不等于人人可读）。实验页没有记录这一步的按钮，所以程序无法替你勾掉它。',
    done: null,
  },
  'form-label': {
    // 表单实验要确认的是读屏实际朗读结果，不属于实验内能完成的观察，一律列进下方额外验证。
    pending: null,
    done: null,
  },
  keyboard: {
    pending: '键盘焦点实验：你还没有点「我已完成观察」。',
    done: '键盘焦点实验：修复前后的两轮 Tab 体验都已完成，并由你本人点击「我已完成观察」确认——这只说明你在本机浏览器里看得见焦点轮廓。',
  },
}

/** 与确认状态无关：产品没有覆盖、仍建议在真实辅助技术或真实使用场景里补做的验证 */
const EXTRA_VERIFICATION_ITEMS: Record<ExperimentKey, string> = {
  contrast: '色彩对比度实验：换到你的真实设备、不同屏幕亮度与环境光下再看一次；本项目不测量你的屏幕、环境亮度与色觉差异。',
  'form-label':
    '表单标签实验：用真实屏幕阅读器（如 NVDA / VoiceOver）走到「姓名」输入框，听它报出的名称是否与页面上看到的标签一致——本项目未做任何真机辅助技术测试。',
  keyboard:
    '键盘焦点实验：在其它浏览器与真实屏幕阅读器组合下复走一遍焦点播报；你在本机确认过看得见，不能代替这些环境下的结果。',
}

export const UNCHECKED_SCOPE = [
  '整站符合性：三个实验各自只覆盖示例组件上的少数成功标准，不构成整站结论。',
  '色彩实验的边界：只对内置示例的一组「前景文字 / 背景色」判定 SC 1.4.3 的普通文本 AA 档（≥ 4.5:1）；这一项通过不代表你的项目、你的其它配色通过。',
  '大文本对比度：同属 SC 1.4.3，但门槛换成 3:1（AA）；色彩实验只判普通文本那一档，没有判大文本。',
  '增强对比（AAA）：SC 1.4.6 要求普通文本 7:1、大文本 4.5:1；本实验只做到 AA，不对 AAA 下任何结论。',
  '非文本对比：SC 1.4.11 管的是界面组件边界与图形（≥ 3:1），和上面两条是不同的成功标准；色彩实验没有测它，键盘实验只对焦点轮廓单独实测过这一条。',
  '键盘操作全链路、焦点顺序、焦点是否被遮挡、拖拽与手势替代。',
  '动态内容、错误提示与帮助文本、语言切换、时区与货币、媒体字幕等。',
  '图片内文字、渐变与半透明背景、真实字体渲染差异、色觉差异：程序算不出，也不测量你的屏幕与环境亮度。',
  '真实屏幕阅读器与放大工具下的行为——本项目未做任何真机辅助技术测试。',
]

/**
 * 「修复后复核」这一列到底数了什么，页面上的统计标签与导出的 Markdown 必须共用这一段说明：
 * 三个实验的复核方式不同，且表单 / 键盘只有在复核结果满足各自目标时才计入。
 */
export const REVERIFIED_HELP =
  '复核 = 修复之后又真实跑过一次：色彩按新配色重算比值、表单重读真实 DOM 且问题清零、键盘用 Tab 把示例按钮重新走过一轮（含人工键盘体验）。仍发现问题的复核实例不计入这一列。'

const ISSUE_LABELS: Record<string, string> = {
  'control-missing-id': '控件没有 id，无法用 for 建立显式关联',
  'no-associated-label': '缺少程序化关联的可见标签',
  'label-no-visible-text': '关联到的 label 没有可见文字或被显式隐藏',
  'placeholder-as-only-name': '只有 placeholder 在承担标签职责',
  'no-accessible-name': '完全没有可访问名称',
  'dangling-label-for': 'label 的 for 指向了作用域内不存在的控件',
}

export interface ReportRow {
  label: string
  value: string
  tone: 'neutral' | 'pass' | 'fail' | 'warn'
}

export interface CodeSection {
  label: string
  language: 'css' | 'html'
  code: string
}

export interface ExperimentReportView {
  key: ExperimentKey
  order: number
  name: string
  statusLabel: string
  statusTone: 'neutral' | 'pass' | 'warn' | 'fail'
  recorded: boolean
  rows: ReportRow[]
  notes: string[]
  code: CodeSection | null
  wcagBasis: string
  scope: string
  limits: string[]
  manualCheck: string
  /** 本实验内已由你本人确认过的人工观察；没有则为 null */
  manualDone: string | null
  labHash: string
  labName: string
  progress: ExperimentProgress
}

export interface ReportModel {
  generatedAt: string
  summary: LedgerSummary
  conclusions: string[]
  /** 实验内还等着你做的人工观察 */
  pendingManual: string[]
  /** 实验内你已经做完并确认过的人工观察 */
  confirmedManual: string[]
  /** 与确认状态无关、建议在真实辅助技术 / 真实设备场景补做的验证 */
  extraVerification: string[]
  experiments: ExperimentReportView[]
  statements: {
    nonCertification: string
    sessionScope: string
    snapshot: string
    reVerifiedHelp: string
  }
  uncheckedScope: string[]
  hasRecords: boolean
}

function ratio(value: number | null): string {
  return value === null ? '—（无法计算）' : formatContrastRatio(value)
}

function aaVerdict(passes: boolean | null): { value: string; tone: ReportRow['tone'] } {
  if (passes === null) return { value: '未判定', tone: 'neutral' }
  return passes ? { value: '达到 AA（≥4.5:1）', tone: 'pass' } : { value: '未达 AA（<4.5:1）', tone: 'fail' }
}

function issueCodesOf(snapshot: IssueSnapshot | null): string {
  if (snapshot === null) return '未记录'
  if (snapshot.issueCount === 0) return '没有发现问题'
  const unique = Array.from(new Set(snapshot.codes))
  return `${snapshot.issueCount} 项：${unique.map((code) => ISSUE_LABELS[code] ?? code).join('、')}`
}

function notRecordedView(
  key: ExperimentKey,
  order: number,
  name: string,
  labHash: string,
  labName: string,
  wcagBasis: string,
  scope: string,
  notes: string[],
): ExperimentReportView {
  return {
    key,
    order,
    name,
    statusLabel: '未记录（本次会话还没有在该实验里运行过检测）',
    statusTone: 'neutral',
    recorded: false,
    rows: [{ label: '本次会话记录', value: '无', tone: 'neutral' }],
    notes,
    code: null,
    wcagBasis,
    scope,
    limits: ['本次会话没有运行该实验，因此没有任何结论可以引用。'],
    manualCheck: '需要先完成实验，再按上面的项目人工验证。',
    manualDone: null,
    labHash,
    labName,
    progress: { inspected: false, repairApplied: false, reVerified: false, manualConfirmed: false },
  }
}

function contrastView(ledger: LedgerState, record: ContrastRecord | null): ExperimentReportView {
  const base = notRecordedView(
    'contrast',
    1,
    '色彩对比度实验',
    ROUTE_HASH['contrast-lab'],
    '回到色彩对比度实验',
    'WCAG 2.2 SC 1.4.3 对比度（最低）——本实验只判其中「普通文本 AA ≥ 4.5:1」这一档。',
    '只判定示例预览里「前景文字 / 背景色」这一对配色的普通文本对比度。',
    [
      '还没有记录：先在色彩对比度实验里点一次「生成修复建议」，本页才会登记真实算出的数值。',
      '达标与否一律用未四舍五入的真实比值判定：#777777 / #ffffff ≈4.48:1 属于未达 AA，#767676 / #ffffff ≈4.54:1 才算达到 AA。',
    ],
  )
  if (record === null) return base

  const stageLabel =
    record.stage === 'applied'
      ? '修复已应用到实验页面，并按新配色重新算过'
      : record.stage === 'suggested'
        ? '已生成修复建议，尚未应用到实验页面'
        : '已检测当前配色，尚未生成修复建议'

  const verdict = aaVerdict(record.currentMeetsAa)
  const rows: ReportRow[] = [
    {
      label: '当前配色',
      value: `${record.textColor} / ${record.backgroundColor}`,
      tone: 'neutral',
    },
    {
      label: '当前对比度（显示两位小数）',
      value: ratio(record.currentRatio),
      tone: record.currentMeetsAa === null ? 'neutral' : record.currentMeetsAa ? 'pass' : 'fail',
    },
    { label: '当前 AA 判定（普通文本 4.5:1）', value: verdict.value, tone: verdict.tone },
  ]

  if (record.beforeTextColor !== null && record.afterTextColor !== null) {
    const beforeVerdict = aaVerdict(record.beforeMeetsAa)
    const afterVerdict = aaVerdict(record.afterMeetsAa)
    rows.push(
      { label: '修复前文字色 / 背景色', value: `${record.beforeTextColor} / ${record.beforeBackgroundColor ?? record.backgroundColor}`, tone: 'neutral' },
      { label: '修复前对比度', value: ratio(record.beforeRatio), tone: beforeVerdict.tone },
      { label: '修复前 AA 判定', value: beforeVerdict.value, tone: beforeVerdict.tone },
      { label: `${record.repairApplied ? '修复后' : '建议'}文字色（背景保持不变）`, value: record.afterTextColor, tone: 'neutral' },
      { label: `${record.repairApplied ? '修复后' : '建议'}对比度`, value: ratio(record.afterRatio), tone: afterVerdict.tone },
      { label: `${record.repairApplied ? '修复后' : '建议'} AA 判定`, value: afterVerdict.value, tone: afterVerdict.tone },
    )
  }

  rows.push({
    label: '是否已实际应用修复',
    value: record.repairApplied
      ? '是：点过「应用修复」，实验页面的文字颜色确实换成了建议值'
      : record.stage === 'suggested'
        ? '否：只生成了建议，没有应用到实验页面'
        : '否：还没有生成建议',
    tone: record.repairApplied ? 'pass' : 'warn',
  })

  if (record.invalidInput) {
    rows.push({
      label: '输入有效性',
      value: '当前颜色输入无效，页面上的结论仍来自上一次有效配色',
      tone: 'warn',
    })
  }

  return {
    ...base,
    statusLabel: record.invalidInput ? `${stageLabel}（输入当前无效，结论暂不更新）` : stageLabel,
    statusTone: record.repairApplied ? 'pass' : record.stage === 'suggested' ? 'warn' : 'neutral',
    recorded: true,
    rows,
    notes: [
      '建议与应用是两件事：只有点过「应用修复」，实验页面才真的使用建议色；改色、撤销或重置都会让这条结论失效。',
      '算法保持背景不变、只朝纯黑或纯白方向逼近文字色，取 RGB 变化更小的那个方向；它不是全局最优，也不保证人眼感知差异最小。',
      '达标判定使用未四舍五入的真实比值，展示时才格式化成两位小数。',
    ],
    limits: [
      '只判定这一对「前景文字 / 背景色」在 SC 1.4.3 普通文本 AA 档（≥ 4.5:1）；同一条 1.4.3 里大文本的 3:1 档、SC 1.4.6 的 AAA 档（普通文本 7:1 / 大文本 4.5:1）、SC 1.4.11 的非文本对比（≥ 3:1）都不在范围内。',
      '不评估图片内的文字、渐变或半透明背景、阴影与真实字体渲染差异。',
      '不测量你的屏幕、环境亮度与色觉差异，也无法验证你是否真的看得清。',
      '结论只适用于实验预览里的示例文字，不代表页面其它文本达标，更不代表整站符合 WCAG 2.2。',
    ],
    code: record.css === null ? null : { label: '修复前后 CSS（与实验页展示一致）', language: 'css', code: record.css },
    manualCheck: '在你自己的屏幕与环境下确认这段示例文字是否真的清楚；数值达标不代表所有人都读得同样轻松。',
    progress: progressOf('contrast', ledger),
  }
}

function formLabelView(ledger: LedgerState, record: FormLabelRecord | null): ExperimentReportView {
  const base = notRecordedView(
    'form-label',
    2,
    '表单标签实验',
    ROUTE_HASH['form-label-lab'],
    '回到表单标签实验',
    'WCAG 2.2 SC 1.3.1 信息与关系、SC 3.3.2 标签或说明（本实验只检查文本录入控件的程序化标签关联）。',
    '只检查示例表单内文本录入控件的 label 关联，以及 label 的 for 是否指向作用域内真实存在的控件。',
    [
      '还没有记录：进入表单标签实验，让程序对真实 DOM 跑一次检测，本页才会登记控件数与问题数。',
      '同一个「姓名」字段可能同时暴露两个不同问题——「缺少关联的可见标签」与「完全没有可访问名称」，它们不是两个坏掉的输入框。',
    ],
  )
  if (record === null) return base

  const rows: ReportRow[] = [
    { label: '检查的文本录入控件数', value: `${record.after.checkedControlCount} 个`, tone: 'neutral' },
    { label: '修复前问题', value: issueCodesOf(record.before), tone: record.before && record.before.issueCount > 0 ? 'fail' : 'neutral' },
    { label: '修复后（最近一次真实 DOM 检测）问题', value: issueCodesOf(record.after), tone: record.after.issueCount === 0 ? 'pass' : 'fail' },
    {
      label: '是否真的改过 DOM',
      value: record.repairApplied
        ? '是：「姓名」那行文字已从普通文本换成带 for 的 label，随后重新读取真实 DOM'
        : '否：示例表单仍是缺陷态',
      tone: record.repairApplied ? 'pass' : 'warn',
    },
    {
      label: '重新检测后的结论',
      value:
        record.repairApplied && record.after.issueCount === 0
          ? '示例控件的标签关联检查已无问题'
          : record.repairApplied
            ? '仍存在问题，见上方分类'
            : '尚未执行修复后的重新检测',
      tone: record.repairApplied && record.after.issueCount === 0 ? 'pass' : 'warn',
    },
    {
      label: '指向不存在控件的 label',
      value: `${record.after.danglingLabelCount} 个`,
      tone: record.after.danglingLabelCount === 0 ? 'pass' : 'fail',
    },
  ]

  return {
    ...base,
    statusLabel:
      record.repairApplied && record.after.issueCount === 0
        ? '已修复并通过重新检测（仅指示例控件的标签关联）'
        : record.repairApplied
          ? '已应用修复，重新检测仍有问题'
          : '已检测，尚未修复',
    statusTone: record.repairApplied && record.after.issueCount === 0 ? 'pass' : record.repairApplied ? 'warn' : 'fail',
    recorded: true,
    rows,
    notes: [
      '「已修复」的依据是修复后对真实 DOM 的重新检测结果，不是页面上那个修复按钮的状态位。',
      'placeholder 不是关联的可见标签：用户一输入它就消失，也不能替代 label。',
      '本实验不对屏幕阅读器实际朗读出的内容下结论；要确认朗读结果，请用真实读屏软件走一遍。',
      '示例表单不会提交：不发送请求，也不保存任何输入内容，因此这里没有任何姓名或邮箱。',
    ],
    limits: [
      '只检查文本录入控件的程序化标签关联：错误识别（SC 3.3.1）、错误建议（SC 3.3.3）、输入用途（SC 1.3.5）与完整可访问名称计算都不在判定范围内。',
      '可见性只识别 hidden、aria-hidden、行内 display:none 与 sr-only 约定，不读取盒模型尺寸，因此发现不了被 CSS 位移或透明隐藏的标签。',
      '不覆盖下拉、单选、复选、按钮类控件以外的组件，也不检查整个表单或整站。',
      '全部通过也只说明这几个控件有了正确关联的可见标签，不等于符合 WCAG 2.2，也不等于读屏软件真的读对了。',
    ],
    code: {
      label: '修复前 HTML',
      language: 'html',
      code: `<!-- 修复前 -->\n${record.beforeHtml}\n\n<!-- 修复后 -->\n${record.afterHtml}`,
    },
    manualCheck: '用真实屏幕阅读器聚焦到「姓名」输入框，确认它读出的名称与页面上看到的标签一致。',
    progress: progressOf('form-label', ledger),
  }
}

function keyboardView(ledger: LedgerState, record: KeyboardRecord | null): ExperimentReportView {
  const base = notRecordedView(
    'keyboard',
    3,
    '键盘焦点实验',
    ROUTE_HASH['keyboard-lab'],
    '回到键盘焦点实验',
    'WCAG 2.2 SC 2.4.7 焦点可见（并涉及 SC 2.1.1 键盘、SC 2.4.11 焦点未被完全遮挡）。',
    '只检查示例按钮上的焦点规则与键盘到达记录，并等你自己确认看得见。',
    [
      '还没有记录：进入键盘焦点实验，用 Tab 走到示例按钮，本页才会登记键盘到达次数。',
      '规则检测、是否应用修复、是否人工确认是三件不同的事，报告里始终分开列出。',
    ],
  )
  if (record === null) return base

  const stage = STAGE_META[record.stage]
  const rows: ReportRow[] = [
    {
      label: '真实 DOM 规则检测',
      value:
        record.ruleIssueCount === null
          ? '未记录'
          : `${record.buttonCount ?? 0} 个示例按钮（键盘可走到 ${record.keyboardReachableCount ?? 0} 个），焦点规则问题 ${record.ruleIssueCount} 项`,
      tone: record.ruleIssueCount === null ? 'neutral' : record.ruleIssueCount === 0 ? 'pass' : 'fail',
    },
    {
      label: '焦点指示修复是否应用',
      value: record.repairApplied ? '是：示例按钮已换成带 outline 的 :focus-visible 规则' : '否：仍是 outline: none 的缺陷态',
      tone: record.repairApplied ? 'pass' : 'warn',
    },
    { label: '修复前键盘导航到达次数', value: `${record.beforeSightings} 次`, tone: record.beforeSightings > 0 ? 'neutral' : 'warn' },
    { label: '修复后键盘导航到达次数', value: `${record.afterSightings} 次`, tone: record.afterSightings > 0 ? 'neutral' : 'warn' },
    {
      label: '你是否已确认观察结果',
      value: record.manualConfirmed ? '是：由你点击「我已完成观察」记录，不是程序自动判定' : '否：还需要你亲自确认',
      tone: record.manualConfirmed ? 'pass' : 'warn',
    },
    { label: '教学阶段', value: `${stage.label} — ${stage.detail}`, tone: 'neutral' },
  ]

  return {
    ...base,
    statusLabel: record.manualConfirmed
      ? '已完成两轮键盘体验并由你确认观察'
      : record.repairApplied
        ? `已应用修复，${record.afterSightings > 0 ? '还差你的确认' : '修复后还没用键盘走一遍'}`
        : record.beforeSightings > 0
          ? '已体验缺陷态，等待修复与复走'
          : '尚未记录到键盘体验',
    statusTone: record.manualConfirmed ? 'pass' : record.repairApplied ? 'warn' : 'neutral',
    recorded: true,
    rows,
    notes: [
      '只统计 Tab / Shift+Tab 产生的键盘焦点到达；鼠标点击带来的焦点不计入，Enter 激活按钮也不算「走过」。',
      'CSS 规则检测能告诉你按钮上挂的是哪条规则，不能告诉你屏幕上真的看得见——所以「WCAG 2.4.7 是否达标」只能由你的观察支持，程序不做自动认证。',
      '修复前后的两轮记录分别保存，互不借用；重置实验会把两轮记录、修复状态和你的确认一并清零。',
    ],
    limits: [
      '静态规则检测只能读出示例按钮上挂的是哪条 CSS，不能证明屏幕上真的看得见轮廓——SC 2.4.7 的结论必须由你的观察支持。',
      '未判定焦点顺序是否合理、焦点是否被遮挡（SC 2.4.11）、焦点指示的最小尺寸与对比（SC 2.4.13）。',
      '未测试真实辅助技术、放大工具与不同浏览器 / 操作系统下的焦点表现。',
      '范围只有这三个示例按钮，不代表页面其它控件（链接、输入框、自定义组件）的焦点可见性。',
    ],
    code: {
      label: '修复前后焦点规则 CSS',
      language: 'css',
      code: `/* 修复前（缺陷态） */\n${record.beforeCss}\n\n/* 修复后 */\n${record.afterCss}`,
    },
    manualCheck: record.manualConfirmed
      ? '本实验内的 Tab 观察你已经确认过；仍建议在其它浏览器与真实屏幕阅读器组合下复走一遍——那不是本机确认能代替的。'
      : '只用 Tab 依次走到三个示例按钮，确认每一处都能看出焦点在哪；这一步无法由程序代替。',
    manualDone: record.manualConfirmed ? IN_LAB_MANUAL.keyboard.done : null,
    progress: progressOf('keyboard', ledger),
  }
}

function buildConclusions(summary: LedgerSummary): string[] {
  return [
    `本次会话在 ${summary.experimentCount} 个实验里登记了 ${summary.recordedCount} 个实验的结果；未登记的实验在下方标为「未记录」。`,
    `已实际执行修复：${summary.repairAppliedCount} 个实验（色彩应用修复 / 表单换上有 for 的 label / 焦点规则换成带 outline 的 :focus-visible）。`,
    `已进行修复后复核（含人工键盘体验）：${summary.reVerifiedCount} 个实验。`,
    `人工确认：${summary.manualConfirmedCount} 个实验由你本人点过确认。三个实验里只有键盘焦点实验提供这个入口，且点过确认只代表你在那台设备上看过，不等于做过屏幕阅读器或整站验证。`,
    '这里不给总分、也不给百分比，更不给「整体合规」这种结论——三个实验各自只覆盖少数成功标准，剩余判断仍需要人来做。',
  ]
}

export function buildReportModel(ledger: LedgerState, generatedAt: Date): ReportModel {
  const summary = summarizeLedger(ledger)
  const inspectedKeys = EXPERIMENT_KEYS.filter((key) => progressOf(key, ledger).inspected)

  // 三条清单各自只装自己那一类：确认过的项从「待完成」移到「已完成」，额外验证永远另列。
  const pendingManual: string[] = []
  const confirmedManual: string[] = []
  for (const key of inspectedKeys) {
    const item = IN_LAB_MANUAL[key]
    if (key === 'keyboard' && progressOf(key, ledger).manualConfirmed) {
      if (item.done !== null) confirmedManual.push(item.done)
    } else if (item.pending !== null) {
      const keyboard = key === 'keyboard' ? ledger.keyboard : null
      const next = keyboard && keyboard.beforeSightings > 0 && keyboard.afterSightings > 0 && keyboard.repairApplied
        ? '修复前后均已有 Tab 到达记录，还差本人确认。'
        : '请检查是否已完成修复前后两轮键盘体验。'
      pendingManual.push(key === 'keyboard' ? item.pending + next : item.pending)
    }
  }
  const extraVerification = inspectedKeys.map((key) => EXTRA_VERIFICATION_ITEMS[key])

  const experiments: ExperimentReportView[] = [
    contrastView(ledger, ledger.contrast),
    formLabelView(ledger, ledger.formLabel),
    keyboardView(ledger, ledger.keyboard),
  ]

  return {
    generatedAt: formatDateTime(generatedAt),
    summary,
    conclusions: buildConclusions(summary),
    pendingManual,
    confirmedManual,
    extraVerification,
    experiments,
    statements: {
      nonCertification: NON_CERTIFICATION_STATEMENT,
      sessionScope: SESSION_SCOPE_STATEMENT,
      snapshot: SNAPSHOT_STATEMENT,
      reVerifiedHelp: REVERIFIED_HELP,
    },
    uncheckedScope: UNCHECKED_SCOPE,
    hasRecords: summary.recordedCount > 0,
  }
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export interface ManualVerificationGroup {
  heading: string
  note: string
  items: string[]
}

/** 页面与 Markdown 共用同一份分组与计数：标题里的数字就是下面列出的条目数 */
export function manualVerificationGroups(model: ReportModel): ManualVerificationGroup[] {
  return [
    {
      heading: `实验内仍待你本人完成的观察（${model.pendingManual.length} 项）`,
      note: '这些属于实验范围内、要你自己看一眼的判断。产品没有记录入口的（如色彩主观可读性），会一直留在这一栏。',
      items: model.pendingManual,
    },
    {
      heading: `实验内已由你确认完成的观察（${model.confirmedManual.length} 项）`,
      note: '下面这些不再出现在待完成清单里；确认只对你本机那一次体验负责，不延伸到屏幕阅读器或整站。',
      items: model.confirmedManual,
    },
    {
      heading: `建议额外进行的辅助技术与真实场景验证（${model.extraVerification.length} 项）`,
      note: '这些都不是点一下按钮就能算完成的：本项目没有真机辅助技术测试环境，也没有做过整站符合性判断。',
      items: model.extraVerification,
    },
  ]
}

export function manualVerificationMarkdownLines(model: ReportModel): string[] {
  if (!model.hasRecords) {
    return ['- 本次会话没有已记录的实验，暂无可引用的人工验证项。', '']
  }
  return manualVerificationGroups(model).flatMap((group) => [
    `#### ${group.heading}`,
    '',
    ...(group.items.length > 0 ? group.items.map((line) => `- ${line}`) : ['- 当前没有条目。']),
    '',
    `> ${group.note}`,
    '',
  ])
}

export function formatDateTime(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}:${pad(date.getSeconds())}`
}

function tableRows(rows: ReportRow[]): string {
  return ['| 项目 | 记录 |', '| --- | --- |', ...rows.map((row) => `| ${row.label} | ${row.value.replace(/\|/g, '\\|')} |`)].join(
    '\n',
  )
}

/** 页面展示与导出共用同一份模型：Markdown 只是它的另一种排版 */
export function renderReportMarkdown(model: ReportModel): string {
  const parts: string[] = [
    '# AccessLab 统一成果报告',
    '',
    `- 生成时间：${model.generatedAt}`,
    `- 记录范围：AccessLab 内置的三个教学示例，本次浏览器会话的内存记录`,
    `- ${model.statements.nonCertification}`,
    '',
    '## 总览',
    '',
    ...model.conclusions.map((line) => `- ${line}`),
    '',
    `> 「已进行修复后复核」这一列怎么数：${model.statements.reVerifiedHelp}`,
    '',
    '### 人工验证的三种状态',
    '',
    ...manualVerificationMarkdownLines(model),
    `> ${model.statements.sessionScope}`,
    '',
    `> ${model.statements.snapshot}`,
    '',
    '## 实验成果',
    '',
  ]

  for (const experiment of model.experiments) {
    parts.push(
      `### ${experiment.order}. ${experiment.name}`,
      '',
      `- 状态：${experiment.statusLabel}`,
      `- WCAG 依据：${experiment.wcagBasis}`,
      `- 本次范围：${experiment.scope}`,
      '',
      tableRows(experiment.rows),
      '',
    )

    if (experiment.notes.length > 0) {
      parts.push('证据与说明：', '', ...experiment.notes.map((note) => `- ${note}`), '')
    }

    if (experiment.code) {
      parts.push(`${experiment.code.label}：`, '', '```' + experiment.code.language, experiment.code.code, '```', '')
    }

    parts.push('未覆盖范围：', '', ...experiment.limits.map((line) => `- ${line}`), '')
    if (experiment.manualDone) {
      parts.push(`实验内已确认：${experiment.manualDone}`, '')
    }
    parts.push(`需人工验证：${experiment.manualCheck}`, '', `再验证入口：${experiment.labHash}（${experiment.labName}）`, '')
  }

  parts.push(
    '## 本次没有检查的范围',
    '',
    ...model.uncheckedScope.map((line) => `- ${line}`),
    '',
    '## 可复用代码',
    '',
    '上面每个实验卡片里的代码块都可以直接复制到自有项目：CSS 片段对应色彩与焦点规则，HTML 片段对应表单标签关联。',
    '',
    '## 声明',
    '',
    `- ${model.statements.nonCertification}`,
    `- ${model.statements.sessionScope}`,
    `- 报告中的数值来自本项目 src/lib 内的 WCAG 2.2 计算与真实 DOM 检测，未使用任何 AI 或外部服务。`,
    '',
  )

  return parts.join('\n')
}
