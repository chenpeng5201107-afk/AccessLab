// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  deriveContrastRecord,
  deriveFormRecord,
  deriveKeyboardRecord,
  emptyLedger,
  snapshotFromAudit,
  type LedgerState,
} from './experimentLedger'
import { auditFormLabels } from './formLabelAudit'
import { demoFormHtml } from './formLabelDemoFields'
import { buildRepairCss } from './colorRepair'
import { BROKEN_FOCUS_CSS, FIXED_FOCUS_CSS } from './keyboardFocusDemo'
import {
  NON_CERTIFICATION_STATEMENT,
  buildReportModel,
  renderReportMarkdown,
} from './reportModel'

/**
 * 报告数据层的底线：每个结论都要能回到台账里的真实记录，
 * 并且「建议 / 应用 / 复验 / 人工确认」四种状态不许互相冒充，也不许出现分数或合规认证式措辞。
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

const GENERATED_AT = new Date(2026, 10, 18, 10, 30, 0)

let container: HTMLDivElement

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
})

afterEach(() => {
  container.remove()
})

function auditOf(html: string) {
  container.innerHTML = html
  return auditFormLabels(container)
}

function formLedger(labelFixed: boolean): LedgerState {
  const report = auditOf(labelFixed ? REPAIRED_FORM : DEFECT_FORM)
  return {
    ...emptyLedger,
    formLabel: deriveFormRecord({
      labelFixed,
      report,
      before: snapshotFromAudit(auditOf(DEFECT_FORM)),
      beforeHtml: demoFormHtml(false),
      afterHtml: demoFormHtml(true),
    }),
  }
}

function suggestedContrastLedger(): LedgerState {
  return {
    ...emptyLedger,
    contrast: deriveContrastRecord({
      textColor: '#777777',
      backgroundColor: '#ffffff',
      hasInvalidInput: false,
      stage: 'suggested',
      repairApplied: false,
      beforeTextColor: '#777777',
      afterTextColor: '#767676',
      css: buildRepairCss({
        beforeTextColor: '#777777',
        beforeBackgroundColor: '#ffffff',
        afterTextColor: '#767676',
        afterBackgroundColor: '#ffffff',
        applied: false,
      }),
    }),
  }
}

function appliedContrastLedger(): LedgerState {
  return {
    ...emptyLedger,
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
  }
}

function keyboardLedger(input: { before: number; after: number; confirmed: boolean; repaired: boolean }): LedgerState {
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

describe('buildReportModel · 空状态', () => {
  it('三个实验都标为未记录，并且不编造任何结论', () => {
    const model = buildReportModel(emptyLedger, GENERATED_AT)

    expect(model.hasRecords).toBe(false)
    expect(model.summary.recordedCount).toBe(0)
    expect(model.experiments.map((item) => item.recorded)).toEqual([false, false, false])
    for (const experiment of model.experiments) {
      expect(experiment.statusLabel).toContain('未记录')
    }
    expect(model.pendingManual).toEqual([])
  })

  it('生成时间走本地时钟，便于与页面展示逐字一致', () => {
    expect(buildReportModel(emptyLedger, GENERATED_AT).generatedAt).toBe('2026-11-18 10:30:00')
  })
})

describe('renderReportMarkdown · 内容与边界', () => {
  it('空台账也带着三个实验、生成时间与非认证声明', () => {
    const markdown = renderReportMarkdown(buildReportModel(emptyLedger, GENERATED_AT))

    expect(markdown).toContain('AccessLab 统一成果报告')
    expect(markdown).toContain('2026-11-18 10:30:00')
    expect(markdown).toContain('色彩对比度实验')
    expect(markdown).toContain('表单标签实验')
    expect(markdown).toContain('键盘焦点实验')
    expect(markdown).toContain(NON_CERTIFICATION_STATEMENT)
    expect(markdown).toContain('本次会话没有已记录的实验，暂无可引用的人工验证项。')
  })

  it('绝不出现分数、百分比或「合规通过」式措辞', () => {
    const merged: LedgerState = {
      contrast: appliedContrastLedger().contrast,
      formLabel: formLedger(true).formLabel,
      keyboard: keyboardLedger({ before: 3, after: 3, confirmed: true, repaired: true }).keyboard,
    }
    const markdown = renderReportMarkdown(buildReportModel(merged, GENERATED_AT))

    expect(markdown).not.toMatch(/\b\d{1,3}\s*分\b/)
    expect(markdown).not.toContain('100%')
    expect(markdown).not.toMatch(/符合(全部|整站|所有)/)
    expect(markdown).not.toContain('认证通过')
    expect(markdown).toContain('这里不给总分、也不给百分比')
  })

  it('只生成建议时如实写「尚未应用」，不能冒领已修复', () => {
    const markdown = renderReportMarkdown(buildReportModel(suggestedContrastLedger(), GENERATED_AT))

    expect(markdown).toContain('已生成修复建议，尚未应用到实验页面')
    expect(markdown).toContain('否：只生成了建议，没有应用到实验页面')
    expect(markdown).toContain('4.48:1')
    expect(markdown).toContain('未达 AA')
    expect(markdown).toContain('767676')
  })

  it('应用修复后列出真实前后比值，并保留仍需人工看的一句', () => {
    const markdown = renderReportMarkdown(buildReportModel(appliedContrastLedger(), GENERATED_AT))

    expect(markdown).toContain('是：点过「应用修复」，实验页面的文字颜色确实换成了建议值')
    expect(markdown).toContain('达到 AA（≥4.5:1）')
    expect(markdown).toContain('.accessible-text')
    expect(markdown).toContain('在你自己的屏幕与环境下确认这段示例文字')
  })

  it('表单修复通过重检后，结论仍限定在示例控件的标签关联', () => {
    const markdown = renderReportMarkdown(buildReportModel(formLedger(true), GENERATED_AT))

    expect(markdown).toContain('已修复并通过重新检测（仅指示例控件的标签关联）')
    expect(markdown).toContain('2 项：缺少程序化关联的可见标签、只有 placeholder 在承担标签职责')
    expect(markdown).toContain('没有发现问题')
    expect(markdown).toContain('<label for="student-name">姓名</label>')
    expect(markdown).toContain('placeholder 不是关联的可见标签')
    expect(markdown).toContain('本实验不对屏幕阅读器实际朗读出的内容下结论')
  })

  it('键盘实验未确认时，把「还差你的确认」写清楚，且规则检测不等于达标', () => {
    const markdown = renderReportMarkdown(
      buildReportModel(keyboardLedger({ before: 3, after: 0, confirmed: false, repaired: true }), GENERATED_AT),
    )

    expect(markdown).toContain('修复前键盘导航到达次数')
    expect(markdown).toContain('否：还需要你亲自确认')
    expect(markdown).toContain('修复后还没用键盘走一遍')
    expect(markdown).toContain('不能证明屏幕上真的看得见轮廓')
    expect(markdown).toContain('WCAG 2.2 SC 2.4.7')
  })

  it('每个实验都留下可回到实验页重新验证的入口', () => {
    const markdown = renderReportMarkdown(buildReportModel(emptyLedger, GENERATED_AT))

    expect(markdown).toContain('#/contrast')
    expect(markdown).toContain('#/form-label')
    expect(markdown).toContain('#/keyboard')
  })

  it('焦点修复前后 CSS 与实验页同源，逐字出现在报告里', () => {
    const markdown = renderReportMarkdown(
      buildReportModel(keyboardLedger({ before: 3, after: 3, confirmed: true, repaired: true }), GENERATED_AT),
    )

    expect(markdown).toContain(BROKEN_FOCUS_CSS)
    expect(markdown).toContain(FIXED_FOCUS_CSS)
    expect(markdown).toContain('是：由你点击「我已完成观察」记录，不是程序自动判定')
  })

  it('报告里出现的记录数字与台账一致，不自行加减', () => {
    const merged: LedgerState = {
      contrast: appliedContrastLedger().contrast,
      formLabel: null,
      keyboard: null,
    }
    const model = buildReportModel(merged, GENERATED_AT)
    const markdown = renderReportMarkdown(model)

    expect(model.summary.recordedCount).toBe(1)
    expect(model.summary.repairAppliedCount).toBe(1)
    expect(markdown).toContain('本次会话在 3 个实验里登记了 1 个实验的结果')
    expect(markdown.match(/未记录（本次会话还没有在该实验里运行过检测）/g)).toHaveLength(2)
    expect(markdown).toContain('修复已应用到实验页面，并按新配色重新算过')
  })
})
