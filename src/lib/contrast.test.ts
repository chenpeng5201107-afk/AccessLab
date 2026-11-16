import { describe, expect, it } from 'vitest'

import {
  AA_NORMAL_TEXT_RATIO,
  contrastRatio,
  contrastRatioFromHex,
  formatContrastRatio,
  meetsAaNormalText,
  normalizeHex,
  parseHexColor,
  relativeLuminance,
} from './contrast'

describe('parseHexColor', () => {
  it('解析 6 位十六进制颜色', () => {
    expect(parseHexColor('#777777')).toEqual({ r: 119, g: 119, b: 119 })
  })

  it('展开 3 位缩写并忽略大小写与空格', () => {
    expect(parseHexColor(' #FFF ')).toEqual({ r: 255, g: 255, b: 255 })
    expect(parseHexColor('abc')).toEqual({ r: 170, g: 187, b: 204 })
  })

  it('非法输入返回 null', () => {
    expect(parseHexColor('')).toBeNull()
    expect(parseHexColor('#12')).toBeNull()
    expect(parseHexColor('#12345g')).toBeNull()
    expect(parseHexColor('red')).toBeNull()
  })
})

describe('normalizeHex', () => {
  it('统一为 #rrggbb 小写', () => {
    expect(normalizeHex('#ABC')).toBe('#aabbcc')
    expect(normalizeHex('#AABBCC')).toBe('#aabbcc')
    expect(normalizeHex('nope')).toBeNull()
  })
})

describe('relativeLuminance', () => {
  it('黑色为 0，白色为 1', () => {
    expect(relativeLuminance(parseHexColor('#000000')!)).toBeCloseTo(0, 6)
    expect(relativeLuminance(parseHexColor('#ffffff')!)).toBeCloseTo(1, 6)
  })
})

describe('contrastRatio', () => {
  it('黑白对比度为 21:1', () => {
    const ratio = contrastRatio(parseHexColor('#000000')!, parseHexColor('#ffffff')!)
    expect(ratio).toBeCloseTo(21, 4)
  })

  it('相同颜色的对比度为 1:1', () => {
    const white = parseHexColor('#ffffff')!
    expect(contrastRatio(white, white)).toBeCloseTo(1, 6)

    const gray = parseHexColor('#777777')!
    expect(contrastRatio(gray, gray)).toBeCloseTo(1, 6)
  })

  it('对比度与前后景色顺序无关', () => {
    const fg = parseHexColor('#1a4d8f')!
    const bg = parseHexColor('#f5f7fa')!
    expect(contrastRatio(fg, bg)).toBeCloseTo(contrastRatio(bg, fg), 10)
  })

  it('纯红与白色的对比度约为 4:1', () => {
    const ratio = contrastRatioFromHex('#ff0000', '#ffffff')!
    expect(ratio).toBeCloseTo(4, 2)
  })

  it('默认实验配色 #777777 / #ffffff 约为 4.48:1', () => {
    const ratio = contrastRatioFromHex('#777777', '#ffffff')!
    expect(ratio).toBeCloseTo(4.48, 1)
  })

  it('任一侧颜色非法时返回 null', () => {
    expect(contrastRatioFromHex('#777777', 'zzz')).toBeNull()
    expect(contrastRatioFromHex('', '#ffffff')).toBeNull()
  })
})

describe('meetsAaNormalText', () => {
  it('阈值为 4.5:1', () => {
    expect(AA_NORMAL_TEXT_RATIO).toBe(4.5)
  })

  it('恰好达到 4.5 判为通过，低于则不通过', () => {
    expect(meetsAaNormalText(4.5)).toBe(true)
    expect(meetsAaNormalText(4.51)).toBe(true)
    expect(meetsAaNormalText(21)).toBe(true)
    expect(meetsAaNormalText(4.49)).toBe(false)
    expect(meetsAaNormalText(4.48)).toBe(false)
    expect(meetsAaNormalText(1)).toBe(false)
  })
})

describe('formatContrastRatio', () => {
  it('保留两位小数并附带比例符号', () => {
    expect(formatContrastRatio(21)).toBe('21.00:1')
    expect(formatContrastRatio(1)).toBe('1.00:1')
    expect(formatContrastRatio(4.478)).toBe('4.48:1')
  })
})
