// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { auditFormLabels } from './formLabelAudit'

/**
 * 检测器的真值表测试：每一组都用 innerHTML 现场搭出真实 DOM，再把容器交给 auditFormLabels。
 * 目的是证明结论来自节点本身（labels / htmlFor / 文本 / 隐藏标记），
 * 而不是来自「修复按钮被点过」之类的外部状态——改一个节点，结论必须跟着变。
 */

let container: HTMLDivElement

function mount(html: string): HTMLDivElement {
  container.innerHTML = html
  return container
}

function issueCodesOf(report: ReturnType<typeof auditFormLabels>, controlId: string): string[] {
  const row = report.rows.find((item) => item.controlId === controlId)
  expect(row, `报告里应包含控件 ${controlId}`).toBeTruthy()
  return row!.issues.map((issue) => issue.code)
}

describe('auditFormLabels · 缺陷示例', () => {
  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    container.remove()
  })

  it('视觉上写着「姓名」的 span 不算关联标签：报出缺少关联，同时识别出未关联的可见文字', () => {
    const report = auditFormLabels(
      mount(`
        <form>
          <div><span>姓名</span><input id="student-name" type="text" placeholder="请输入姓名"></div>
        </form>
      `),
    )

    const row = report.rows.find((item) => item.controlId === 'student-name')!
    expect(report.checkedControlCount).toBe(1)
    expect(row.hasProgrammaticallyAssociatedLabel).toBe(false)
    expect(row.hasVisibleAssociatedLabel).toBe(false)
    expect(row.associatedLabelTexts).toEqual([])
    expect(row.unassociatedCaption).toBe('姓名')
    expect(issueCodesOf(report, 'student-name')).toContain('no-associated-label')
    expect(row.passes).toBe(false)
  })

  it('把 placeholder 当成名称来源要单独报一条问题，但控件仍然「有可访问名称」', () => {
    const report = auditFormLabels(
      mount(`<form><div><span>姓名</span><input id="a" type="text" placeholder="请输入姓名"></div></form>`),
    )
    const row = report.rows[0]

    expect(row.nameSources).toEqual(['placeholder'])
    expect(row.hasAccessibleName).toBe(true)
    expect(row.computedName).toBe('请输入姓名')
    expect(row.issues.map((issue) => issue.code)).toEqual(['no-associated-label', 'placeholder-as-only-name'])
  })

  it('什么名称来源都没有时，「缺少关联标签」与「完全没有可访问名称」两条要同时成立', () => {
    const report = auditFormLabels(mount(`<form><div><input id="b" type="text"></div></form>`))
    const row = report.rows[0]

    expect(row.hasProgrammaticallyAssociatedLabel).toBe(false)
    expect(row.hasAccessibleName).toBe(false)
    expect(row.computedName).toBe('')
    expect(row.issues.map((issue) => issue.code)).toContain('no-accessible-name')
  })

  it('只有 aria-label 时：有可访问名称，但依然缺少可见且已关联的 label', () => {
    const report = auditFormLabels(
      mount(`<form><div><input id="c" type="text" aria-label="姓名"></div></form>`),
    )
    const row = report.rows[0]

    expect(row.hasAccessibleName).toBe(true)
    expect(row.nameSources).toContain('aria-label')
    expect(row.hasVisibleAssociatedLabel).toBe(false)
    expect(row.issues.map((issue) => issue.code)).toContain('no-associated-label')
  })

  it('htmlFor 指向别的 id 时，控件按「无关联」处理，并额外记一条悬空 label', () => {
    const report = auditFormLabels(
      mount(`
        <form>
          <div><label for="ghost">姓名</label><input id="student-name" type="text"></div>
        </form>
      `),
    )

    expect(report.rows[0].hasProgrammaticallyAssociatedLabel).toBe(false)
    expect(report.danglingLabels).toEqual([{ htmlFor: 'ghost', text: '姓名' }])
    expect(report.rows[0].issues.map((issue) => issue.code)).toEqual([
      'no-associated-label',
      'no-accessible-name',
    ])
    // 控件侧 2 条（无关联标签 + 完全无可访问名称）+ 悬空 label 1 条
    expect(report.issueCount).toBe(3)
  })

  it('关联到了空文本 / sr-only 的 label：算已关联，但不算可见标签', () => {
    const empty = auditFormLabels(
      mount(`<form><div><label for="d"></label><input id="d" type="text"></div></form>`),
    )
    expect(empty.rows[0].hasProgrammaticallyAssociatedLabel).toBe(true)
    expect(empty.rows[0].hasVisibleAssociatedLabel).toBe(false)
    expect(empty.rows[0].issues.map((issue) => issue.code)).toContain('label-no-visible-text')

    const srOnly = auditFormLabels(
      mount(`<form><div><label for="e" class="sr-only">姓名</label><input id="e" type="text"></div></form>`),
    )
    expect(srOnly.rows[0].hasVisibleAssociatedLabel).toBe(false)
    expect(srOnly.rows[0].issues.map((issue) => issue.code)).toContain('label-no-visible-text')
  })

  it('没有 id 的控件要报 control-missing-id，并用序号描述兜住空 id', () => {
    const report = auditFormLabels(mount(`<form><div><label>姓名<input type="text"></label></div></form>`))

    expect(report.rows[0].controlId).toContain('无 id')
    expect(report.rows[0].issues.map((issue) => issue.code)).toContain('control-missing-id')
  })
})

describe('auditFormLabels · 修复后与真实 DOM 依赖', () => {
  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    container.remove()
  })

  it('label + htmlFor 与 id 一致时问题消失，各项事实全部转为通过', () => {
    const report = auditFormLabels(
      mount(`
        <form>
          <div><label for="student-name">姓名</label><input id="student-name" type="text"></div>
        </form>
      `),
    )
    const row = report.rows[0]

    expect(row.hasProgrammaticallyAssociatedLabel).toBe(true)
    expect(row.hasVisibleAssociatedLabel).toBe(true)
    expect(row.associatedLabelTexts).toEqual(['姓名'])
    expect(row.nameSources).toEqual(['associated-label'])
    expect(row.computedName).toBe('姓名')
    expect(row.issues).toEqual([])
    expect(row.passes).toBe(true)
    expect(report.issueCount).toBe(0)
    expect(report.hasIssues).toBe(false)
  })

  it('包裹式（隐式）label 也算建立了程序化关联', () => {
    const report = auditFormLabels(
      mount(`<form><div><label>姓名<input id="f" type="text"></label></div></form>`),
    )

    expect(report.rows[0].hasVisibleAssociatedLabel).toBe(true)
    expect(report.rows[0].issues).toEqual([])
  })

  it('同一批节点：改掉 span 就转为通过，改回去又报问题（结论不缓存、不写死）', () => {
    const broken = mount(`
      <form>
        <div><span id="caption">姓名</span><input id="student-name" type="text"></div>
      </form>
    `)

    expect(auditFormLabels(broken).hasIssues).toBe(true)

    const caption = broken.querySelector('#caption')!
    const label = broken.ownerDocument.createElement('label')
    label.setAttribute('for', 'student-name')
    label.textContent = '姓名'
    caption.replaceWith(label)

    const fixedReport = auditFormLabels(broken)
    expect(fixedReport.hasIssues).toBe(false)
    expect(fixedReport.rows[0].associatedLabelTexts).toEqual(['姓名'])

    label.replaceWith(caption)
    expect(auditFormLabels(broken).hasIssues).toBe(true)
  })

  it('作用域只覆盖传入的容器：页面其它区域的 label 不会被算进来', () => {
    container.innerHTML = `
      <div id="lab"><form><div><span>姓名</span><input id="student-name" type="text"></div></form></div>
      <div id="chrome"><label for="outside">导航里的搜索</label><input id="outside" type="search"></div>
    `
    const report = auditFormLabels(container.querySelector('#lab')!)

    expect(report.checkedControlCount).toBe(1)
    expect(report.rows.map((row) => row.controlId)).toEqual(['student-name'])
  })

  it('只检查文本录入控件：提交按钮、checkbox、radio 不进入报告', () => {
    const report = auditFormLabels(
      mount(`
        <form>
          <input id="t" type="text">
          <input id="s" type="submit" value="提交">
          <input id="k" type="checkbox">
          <button type="submit">提交登记</button>
        </form>
      `),
    )

    expect(report.checkedControlCount).toBe(1)
    expect(report.rows[0].controlId).toBe('t')
  })

  it('容器为 null 时返回空报告，不抛异常', () => {
    expect(auditFormLabels(null)).toEqual({
      rows: [],
      danglingLabels: [],
      checkedControlCount: 0,
      issueCount: 0,
      hasIssues: false,
    })
  })
})
