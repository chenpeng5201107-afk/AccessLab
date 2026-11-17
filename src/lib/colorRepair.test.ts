import { describe, expect, it } from 'vitest'

import {
  buildAfterCss,
  buildRepairCss,
  cssBlock,
  suggestTextColor,
} from './colorRepair'
import { AA_NORMAL_TEXT_RATIO, contrastRatioFromHex, parseHexColor } from './contrast'

/** 用真实 WCAG 计算复核某个建议色对背景是否真的达标 */
function realRatio(text: string, bg: string): number {
  const ratio = contrastRatioFromHex(text, bg)
  expect(ratio).not.toBeNull()
  return ratio as number
}

describe('suggestTextColor · 生成可达标的建议', () => {
  it('#1 默认 #777777 / #FFFFFF 生成真实满足 4.5:1 的方案', () => {
    const s = suggestTextColor('#777777', '#ffffff')
    expect(s.ok).toBe(true)
    expect(s.needsRepair).toBe(true)
    expect(s.originalTextColor).toBe('#777777')
    expect(s.suggestedTextColor).not.toBeNull()
    // 建议色必须是合法 6 位十六进制
    expect(parseHexColor(s.suggestedTextColor!)).not.toBeNull()
    // 修复前确实不达标，修复后用真实计算复核达标
    expect(s.beforeRatio!).toBeLessThan(AA_NORMAL_TEXT_RATIO)
    expect(s.afterRatio!).toBeGreaterThanOrEqual(AA_NORMAL_TEXT_RATIO)
    expect(realRatio(s.suggestedTextColor!, '#ffffff')).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT_RATIO,
    )
  })

  it('#6 生成的是最小改动方案：#777777 → #767676', () => {
    const s = suggestTextColor('#777777', '#ffffff')
    expect(s.suggestedTextColor).toBe('#767676')
  })

  it('#3 前景与背景相同（白字白底）也能生成通过 AA 的文字色', () => {
    const s = suggestTextColor('#ffffff', '#ffffff')
    expect(s.ok).toBe(true)
    expect(s.needsRepair).toBe(true)
    expect(s.beforeRatio).toBeCloseTo(1, 6)
    expect(realRatio(s.suggestedTextColor!, '#ffffff')).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT_RATIO,
    )
  })

  it('#4 深色背景下同样能生成合格方案（黑底灰字）', () => {
    const s = suggestTextColor('#333333', '#000000')
    expect(s.ok).toBe(true)
    expect(s.needsRepair).toBe(true)
    expect(s.suggestedTextColor).not.toBeNull()
    expect(realRatio(s.suggestedTextColor!, '#000000')).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT_RATIO,
    )
  })

  it('#2 已达标时不得改动原颜色', () => {
    const s = suggestTextColor('#000000', '#ffffff')
    expect(s.ok).toBe(true)
    expect(s.needsRepair).toBe(false)
    expect(s.suggestedTextColor).toBe('#000000')
    expect(s.beforeRatio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT_RATIO)
    expect(s.afterRatio).toBe(s.beforeRatio)
  })

  it('黑白边界：21:1 时判为无需修复', () => {
    const s = suggestTextColor('#ffffff', '#000000')
    expect(s.needsRepair).toBe(false)
    expect(s.suggestedTextColor).toBe('#ffffff')
  })

  it('#5 非法十六进制输入不得给出可用结论', () => {
    const badText = suggestTextColor('zzz', '#ffffff')
    expect(badText.ok).toBe(false)
    expect(badText.reason).toBe('invalid-color')
    expect(badText.suggestedTextColor).toBeNull()
    expect(badText.needsRepair).toBe(false)

    const badBg = suggestTextColor('#777777', '#12g')
    expect(badBg.ok).toBe(false)
    expect(badBg.reason).toBe('invalid-color')
    expect(badBg.suggestedTextColor).toBeNull()
  })

  it('接受目标对比度参数：抬高门槛到 AAA 7:1 仍能生成达标方案', () => {
    const s = suggestTextColor('#777777', '#ffffff', 7)
    expect(s.ok).toBe(true)
    expect(s.needsRepair).toBe(true)
    expect(realRatio(s.suggestedTextColor!, '#ffffff')).toBeGreaterThanOrEqual(7)
  })

  it('建议色永远保持用户背景不变', () => {
    const s = suggestTextColor('#777777', '#f5f0e6')
    // 背景没被改动，所以建议色对该背景仍然达标
    expect(realRatio(s.suggestedTextColor!, '#f5f0e6')).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT_RATIO,
    )
  })

  it('中灰背景 + AAA 7:1：两个方向都不可达时如实报告，不伪造方案', () => {
    const bg = '#7c7c7c'
    // 先自证门槛确实达不到：只调文字色时，两个极端是纯黑与纯白，二者都不够 7:1。
    // （4.5 目标恒有解，因为 ratio(black,bg) × ratio(white,bg) = 21，必有一侧 ≥ √21；
    //  所以 unreachable 只能在更高门槛下出现，这里用 AAA 7:1 覆盖该分支。）
    expect(realRatio('#000000', bg)).toBeLessThan(7)
    expect(realRatio('#ffffff', bg)).toBeLessThan(7)

    const s = suggestTextColor('#bcbcbc', bg, 7)
    expect(s.ok).toBe(false)
    expect(s.reason).toBe('unreachable')
    expect(s.suggestedTextColor).toBeNull()
    expect(s.afterRatio).toBeNull()
    expect(s.needsRepair).toBe(true)
    expect(s.beforeRatio).not.toBeNull()
  })

  it('同一对中灰配色在 4.5 目标下仍有解，说明确实只有 4.5:1 有保证', () => {
    const s = suggestTextColor('#bcbcbc', '#7c7c7c')
    expect(s.ok).toBe(true)
    expect(realRatio(s.suggestedTextColor!, '#7c7c7c')).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT_RATIO,
    )
  })

  it('非法输入优先于不可达：reason 必须是 invalid-color', () => {
    const s = suggestTextColor('zzz', '#7c7c7c', 7)
    expect(s.ok).toBe(false)
    expect(s.reason).toBe('invalid-color')
  })
})

describe('buildRepairCss · 动态生成 CSS', () => {
  it('#11 CSS 文本包含真实的修复前/修复后颜色，而非写死', () => {
    const s = suggestTextColor('#777777', '#ffffff')
    const css = buildRepairCss({
      beforeTextColor: s.originalTextColor,
      beforeBackgroundColor: '#ffffff',
      afterTextColor: s.suggestedTextColor!,
      afterBackgroundColor: '#ffffff',
      applied: false,
    })
    expect(css).toContain('#777777')
    expect(css).toContain('#767676')
    expect(css).toContain('#ffffff')
    expect(css).toContain('/* 修复前 */')
    expect(css).toContain('/* 建议修复后 */')
    expect(css).toContain('color:')
    expect(css).toContain('background-color:')
  })

  it('已应用时后段标题为「已应用修复」', () => {
    const css = buildRepairCss({
      beforeTextColor: '#777777',
      beforeBackgroundColor: '#ffffff',
      afterTextColor: '#767676',
      afterBackgroundColor: '#ffffff',
      applied: true,
    })
    expect(css).toContain('/* 已应用修复 */')
    expect(css).not.toContain('/* 建议修复后 */')
  })

  it('复制段落只含修复后的真实颜色', () => {
    expect(buildAfterCss('#767676', '#ffffff')).toBe(
      '.accessible-text {\n  color: #767676;\n  background-color: #ffffff;\n}\n',
    )
  })

  it('cssBlock 用传入颜色，不含注释', () => {
    const block = cssBlock('#112233', '#445566')
    expect(block).toContain('color: #112233')
    expect(block).toContain('background-color: #445566')
    expect(block).not.toContain('/*')
  })
})
