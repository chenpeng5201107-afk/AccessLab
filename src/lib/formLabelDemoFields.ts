export interface DemoField {
  id: string
  /** 字段可见标题文字；修复前后这段文字都在页面上显示，变的只是它是否为 label */
  caption: string
  type: 'text' | 'email'
  placeholder: string
  autoComplete: 'name' | 'email'
}

/**
 * 示例字段用固定 id 而不是 useId：本页的教学目标就是展示 `for` / `id` 这一对显式关联，
 * id 必须与代码对比区里写给学员看的那份完全一致。
 */
export const NAME_FIELD: DemoField = {
  id: 'student-name',
  caption: '姓名',
  type: 'text',
  placeholder: '请输入姓名',
  autoComplete: 'name',
}

export const EMAIL_FIELD: DemoField = {
  id: 'student-email',
  caption: '电子邮箱',
  type: 'email',
  placeholder: 'example@school.edu',
  autoComplete: 'email',
}

export interface MarkupLine {
  text: string
  /** 该行在修复前后是否不同；用于高亮关键变化，不额外维护第二套差异逻辑 */
  changed: boolean
}

const LINES: Array<{ before: string; after: string }> = [
  { before: '<form>', after: '<form>' },
  {
    before: '  <!-- 「姓名」这几个字确实在页面上，但它只是一个普通文本节点 -->',
    after: '  <!-- 可见文字与输入框通过 for / id 建立程序化关联 -->',
  },
  {
    before: `  <span>${NAME_FIELD.caption}</span>`,
    after: `  <label for="${NAME_FIELD.id}">${NAME_FIELD.caption}</label>`,
  },
  {
    before: `  <input id="${NAME_FIELD.id}" type="${NAME_FIELD.type}" placeholder="${NAME_FIELD.placeholder}" autocomplete="${NAME_FIELD.autoComplete}">`,
    after: `  <input id="${NAME_FIELD.id}" type="${NAME_FIELD.type}" placeholder="${NAME_FIELD.placeholder}" autocomplete="${NAME_FIELD.autoComplete}">`,
  },
  { before: '', after: '' },
  {
    before: `  <label for="${EMAIL_FIELD.id}">${EMAIL_FIELD.caption}</label>`,
    after: `  <label for="${EMAIL_FIELD.id}">${EMAIL_FIELD.caption}</label>`,
  },
  {
    before: `  <input id="${EMAIL_FIELD.id}" type="${EMAIL_FIELD.type}" placeholder="${EMAIL_FIELD.placeholder}" autocomplete="${EMAIL_FIELD.autoComplete}">`,
    after: `  <input id="${EMAIL_FIELD.id}" type="${EMAIL_FIELD.type}" placeholder="${EMAIL_FIELD.placeholder}" autocomplete="${EMAIL_FIELD.autoComplete}">`,
  },
  { before: '', after: '' },
  { before: '  <button type="submit">提交登记（演示）</button>', after: '  <button type="submit">提交登记（演示）</button>' },
  { before: '</form>', after: '</form>' },
]

/** 代码对比区的数据源：与组件实际渲染出来的 id / for 出自同一份字段配置，不会各说各话 */
export function demoFormMarkup(fixed: boolean): MarkupLine[] {
  return LINES.map((line) => ({
    text: fixed ? line.after : line.before,
    changed: line.before !== line.after,
  }))
}

export function demoFormHtml(fixed: boolean): string {
  return demoFormMarkup(fixed)
    .map((line) => line.text)
    .join('\n')
}
