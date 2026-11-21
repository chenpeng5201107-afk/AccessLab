export type IssueCode =
  | 'control-missing-id'
  | 'no-associated-label'
  | 'label-no-visible-text'
  | 'placeholder-as-only-name'
  | 'no-accessible-name'
  | 'dangling-label-for'

export type NameSource = 'associated-label' | 'aria-labelledby' | 'aria-label' | 'title' | 'placeholder'

export interface AuditIssue {
  code: IssueCode
  message: string
  /** 该问题主要对应哪一条 WCAG 2.2 成功标准，仅作教学定位，不构成整页判定 */
  standardHint: string
}

export interface FieldAuditRow {
  /** 控件 id；无 id 时给出作用域内的序号描述 */
  controlId: string
  controlType: string
  /** 控件附近视觉上像标签、但未建立关联的文本（即教学示例里的那个 span） */
  unassociatedCaption: string | null
  associatedLabelTexts: string[]
  hasProgrammaticallyAssociatedLabel: boolean
  hasVisibleAssociatedLabel: boolean
  nameSources: NameSource[]
  hasAccessibleName: boolean
  computedName: string
  issues: AuditIssue[]
  passes: boolean
}

export interface LabelSnapshot {
  htmlFor: string
  text: string
}

export interface FormLabelAuditReport {
  rows: FieldAuditRow[]
  /** 写了 for 却在检测作用域内找不到对应控件的 label：关联指向了不存在的 id */
  danglingLabels: LabelSnapshot[]
  checkedControlCount: number
  issueCount: number
  hasIssues: boolean
}

/**
 * 检测只读取真实渲染出来的 DOM：input.labels、label.htmlFor、文本内容、显式隐藏标记。
 * 不依赖任何 React 状态，所以「修复按钮被点过」永远不会被当成检测结论。
 *
 * 刻意保持窄范围：只检查文本录入类控件的程序化标签关联；可见性只认显式隐藏标记，
 * 不读布局盒尺寸（jsdom 的 getBoundingClientRect 恒为 0，用它会把结论做歪）。
 */

const TEXT_ENTRY_TYPES = new Set([
  'text',
  'email',
  'password',
  'search',
  'tel',
  'url',
  'number',
  'date',
  'month',
  'week',
  'time',
  'datetime-local',
])

type LabeledControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

function normalizedText(el: Element): string {
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/** 只认显式隐藏约定（含本项目自身使用的 sr-only），避免依赖真实布局测量 */
function isExplicitlyHidden(el: Element): boolean {
  if (el.hasAttribute('hidden')) return true
  if (el.getAttribute('aria-hidden') === 'true') return true
  if (el instanceof HTMLElement && el.style.display === 'none') return true
  return /(^|\s)(sr-only|invisible)(\s|$)/.test(el.className?.toString() ?? '')
}

function isTextEntryControl(el: Element): el is LabeledControl {
  if (el instanceof HTMLInputElement) return TEXT_ENTRY_TYPES.has(el.type || 'text')
  return el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement
}

function ancestorLabel(control: Element): HTMLLabelElement | null {
  return control.parentElement?.closest('label') ?? null
}

function referencedText(control: Element, attr: string): string {
  const root = control.getRootNode() as Document | ShadowRoot | null
  const ids = (control.getAttribute(attr) ?? '').split(/\s+/).filter(Boolean)
  return ids
    .map((refId) => {
      const referenced = root?.getElementById?.(refId)
      return referenced ? normalizedText(referenced) : ''
    })
    .filter(Boolean)
    .join(' ')
}

/** 控件所在字段里「看起来像标签」却没有关联的同级文本 */
function unassociatedCaptionOf(control: LabeledControl, labels: HTMLLabelElement[]): string | null {
  const wrapper = control.parentElement
  if (!wrapper) return null
  for (const sibling of Array.from(wrapper.children)) {
    if (sibling === control || control.contains(sibling) || sibling.contains(control)) continue
    if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'OPTION'].includes(sibling.tagName)) continue
    if (sibling.tagName === 'LABEL' && labels.includes(sibling as HTMLLabelElement)) continue
    const text = normalizedText(sibling)
    if (text !== '') return text
  }
  return null
}

function collectLabels(control: LabeledControl): HTMLLabelElement[] {
  const explicit = Array.from(control.labels ?? [])
  const wrapped = ancestorLabel(control)
  return wrapped && !explicit.includes(wrapped) ? [...explicit, wrapped] : explicit
}

function computeNameSources(control: LabeledControl, labels: HTMLLabelElement[]): NameSource[] {
  const sources: NameSource[] = []
  if (labels.some((label) => normalizedText(label) !== '')) sources.push('associated-label')
  if (control.getAttribute('aria-labelledby')) sources.push('aria-labelledby')
  if ((control.getAttribute('aria-label') ?? '').trim() !== '') sources.push('aria-label')
  if ((control.getAttribute('title') ?? '').trim() !== '') sources.push('title')
  if ((control.getAttribute('placeholder') ?? '').trim() !== '') sources.push('placeholder')
  return sources
}

function accessibleNameOf(control: LabeledControl, labels: HTMLLabelElement[]): string {
  const labelText = labels.map(normalizedText).filter(Boolean).join(' ')
  if (labelText) return labelText
  const labelledby = referencedText(control, 'aria-labelledby')
  if (labelledby) return labelledby
  const ariaLabel = (control.getAttribute('aria-label') ?? '').trim()
  if (ariaLabel) return ariaLabel
  const title = (control.getAttribute('title') ?? '').trim()
  if (title) return title
  // placeholder 会参与可访问名称计算，但用户一输入就消失，不能当作可靠的可见标签
  return (control.getAttribute('placeholder') ?? '').trim()
}

function auditControl(control: LabeledControl, order: number): FieldAuditRow {
  const labels = collectLabels(control)
  const id = control.id
  const visibleLabelTexts = labels.map(normalizedText).filter((text) => text !== '')
  const hiddenLabelCount = labels.filter((label) => isExplicitlyHidden(label)).length
  const hasProgrammaticallyAssociatedLabel = labels.length > 0
  const hasVisibleAssociatedLabel = visibleLabelTexts.length > 0 && hiddenLabelCount === 0
  const nameSources = computeNameSources(control, labels)
  const name = accessibleNameOf(control, labels)
  const caption = unassociatedCaptionOf(control, labels)

  const issues: AuditIssue[] = []

  if (!id) {
    issues.push({
      code: 'control-missing-id',
      message: '控件没有 id，无法用 label 的 for 建立显式关联（只能改用包裹式 label）。',
      standardHint: 'WCAG 2.2 3.3.2 Labels or Instructions',
    })
  }

  if (!hasProgrammaticallyAssociatedLabel) {
    issues.push({
      code: 'no-associated-label',
      message: caption
        ? `字段上方视觉上写着「${caption}」，但它只是一个普通文本节点，没有与该输入框建立关联。本次检测得到的名称是「${name || '（无名称）'}」。`
        : '该控件没有程序化关联的 label，请为输入框关联一行可见的说明文字。',
      standardHint: 'WCAG 2.2 1.3.1 Info and Relationships、3.3.2 Labels or Instructions',
    })
  } else if (!hasVisibleAssociatedLabel) {
    issues.push({
      code: 'label-no-visible-text',
      message: '控件关联到了 label，但该 label 没有可见文字或被显式隐藏。本实验要求的是「看得见且已关联」的标签。',
      standardHint: 'WCAG 2.2 3.3.2 Labels or Instructions',
    })
  }

  if (visibleLabelTexts.length === 0 && nameSources.includes('placeholder')) {
    issues.push({
      code: 'placeholder-as-only-name',
      message: '当前只有 placeholder 在提示这里填什么。placeholder 在用户输入后会消失，也不能替代可见标签。',
      standardHint: 'WCAG 2.2 3.3.2 Labels or Instructions',
    })
  }

  if (name === '') {
    issues.push({
      code: 'no-accessible-name',
      message: '该控件完全没有可访问名称：没有关联 label，也没有 aria-label / aria-labelledby / title / placeholder。',
      standardHint: 'WCAG 2.2 4.1.2 Name, Role, Value、3.3.2 Labels or Instructions',
    })
  }

  return {
    controlId: id || `第 ${order} 个文本录入控件（无 id）`,
    controlType: control instanceof HTMLInputElement ? control.type || 'text' : control.tagName.toLowerCase(),
    unassociatedCaption: caption,
    associatedLabelTexts: labels.map(normalizedText),
    hasProgrammaticallyAssociatedLabel,
    hasVisibleAssociatedLabel,
    nameSources,
    hasAccessibleName: name !== '',
    computedName: name,
    issues,
    passes: issues.length === 0,
  }
}

export function auditFormLabels(scope: Element | null): FormLabelAuditReport {
  const rows: FieldAuditRow[] = []
  const danglingLabels: LabelSnapshot[] = []

  if (scope) {
    const ownerDoc = scope.ownerDocument ?? document
    const scopedIds = new Set(
      Array.from(scope.querySelectorAll('[id]'))
        .map((el) => el.id)
        .filter(Boolean),
    )

    for (const control of Array.from(scope.querySelectorAll('input, textarea, select'))) {
      if (isTextEntryControl(control)) rows.push(auditControl(control, rows.length + 1))
    }

    for (const label of Array.from(scope.querySelectorAll('label'))) {
      const htmlFor = label.htmlFor || (label.getAttribute('for') ?? '')
      if (!htmlFor) continue // 包裹式 label 没有 for，指向性由 DOM 嵌套决定
      const target = scopedIds.has(htmlFor) ? ownerDoc.getElementById(htmlFor) : null
      if (!target || !scope.contains(target)) {
        danglingLabels.push({ htmlFor, text: normalizedText(label) })
      }
    }
  }

  const issueCount = rows.reduce((sum, row) => sum + row.issues.length, 0) + danglingLabels.length

  return { rows, danglingLabels, checkedControlCount: rows.length, issueCount, hasIssues: issueCount > 0 }
}
