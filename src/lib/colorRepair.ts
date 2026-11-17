/**
 * 色彩修复建议（确定性算法，不接入任何 AI）
 *
 * 设计说明：
 * - 只调整「文字颜色」，保持用户选择的背景颜色不变（第一版范围）。
 * - 沿 RGB 三个通道同方向把文字色分别朝「纯黑」与「纯白」线性逼近，
 *   用二分搜索找到「首次满足目标对比度」的整数配色，再比较两个方向的
 *   RGB 欧氏距离，选变化更小的一方。
 * - 这不是全局最优、也不保证人眼感知差异最小，只是尽量减小 RGB 改动的实用建议。
 * - 对比度全部走 contrast.ts 的真实 WCAG 2.2 计算，最终结果会用生成的
 *   十六进制颜色重新算一次并验证达标；判定用未四舍五入的原值。
 */

import {
  AA_NORMAL_TEXT_RATIO,
  contrastRatio,
  parseHexColor,
  normalizeHex,
  type Rgb,
} from './contrast'

export interface RepairSuggestion {
  /** 算法是否给出了可用结论（false 表示输入非法或无法达标） */
  ok: boolean
  /** 原文字颜色，规范化为 #rrggbb 小写；输入非法时回退成原始字符串 */
  originalTextColor: string
  /** 建议文字颜色；无法生成时为 null */
  suggestedTextColor: string | null
  /** 修复前真实对比度；输入非法时为 null */
  beforeRatio: number | null
  /** 修复后真实对比度；无需修复时为修复前的值，无法生成时为 null */
  afterRatio: number | null
  /** 当前是否未达标、需要修复 */
  needsRepair: boolean
  /** ok 为 false 时的原因 */
  reason?: 'invalid-color' | 'unreachable'
}

const BLACK: Rgb = { r: 0, g: 0, b: 0 }
const WHITE: Rgb = { r: 255, g: 255, b: 255 }
/** 二分搜索的离散步数；每步对应一次整数取色 */
const STEPS = 256

function rgbToHex(color: Rgb): string {
  const to2 = (v: number) => v.toString(16).padStart(2, '0')
  return `#${to2(color.r)}${to2(color.g)}${to2(color.b)}`
}

/** 从 orig 朝 endpoint 按 k/STEPS 比例插值，返回取整后的整数颜色 */
function stepColor(orig: Rgb, endpoint: Rgb, k: number): Rgb {
  const f = k / STEPS
  return {
    r: Math.round(orig.r + (endpoint.r - orig.r) * f),
    g: Math.round(orig.g + (endpoint.g - orig.g) * f),
    b: Math.round(orig.b + (endpoint.b - orig.b) * f),
  }
}

function rgbDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2)
}

/**
 * 沿 orig→endpoint 方向二分搜索「首次满足 minRatio」的整数配色。
 *
 * 前提：k=0（原色）不达标、k=STEPS（端点）达标，且达标集合是 [k*, STEPS] 的后缀
 * （文字色朝单端移动时亮度单调，对比度对固定背景呈先降后升的 V 形，
 * 起点已在下降段下方，故只会跨越一次）。端点不达标时该方向直接返回 null。
 */
function searchToward(orig: Rgb, bg: Rgb, endpoint: Rgb, minRatio: number): Rgb | null {
  if (contrastRatio(endpoint, bg) < minRatio) return null

  let lo = 0
  let hi = STEPS
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (contrastRatio(stepColor(orig, endpoint, mid), bg) >= minRatio) hi = mid
    else lo = mid + 1
  }

  const candidate = stepColor(orig, endpoint, lo)
  // 取整可能让边界点刚好差一点，向端点方向最多补几步，仍不达标则放弃该方向
  for (let k = lo + 1; contrastRatio(candidate, bg) < minRatio && k <= STEPS; k++) {
    const next = stepColor(orig, endpoint, k)
    candidate.r = next.r
    candidate.g = next.g
    candidate.b = next.b
  }
  return contrastRatio(candidate, bg) >= minRatio ? candidate : null
}

/**
 * 生成符合 WCAG AA 的文字颜色建议。
 * 保持背景不变，只调文字；已达标时原样返回、不做任何改动。
 */
export function suggestTextColor(
  textColor: string,
  backgroundColor: string,
  minRatio: number = AA_NORMAL_TEXT_RATIO,
): RepairSuggestion {
  const textRgb = parseHexColor(textColor)
  const bgRgb = parseHexColor(backgroundColor)
  const original = normalizeHex(textColor) ?? textColor.trim()

  if (!textRgb || !bgRgb) {
    return {
      ok: false,
      originalTextColor: original,
      suggestedTextColor: null,
      beforeRatio: null,
      afterRatio: null,
      needsRepair: false,
      reason: 'invalid-color',
    }
  }

  const beforeRatio = contrastRatio(textRgb, bgRgb)

  // 已经满足：保留原色，不改（用未取整的真实值判定）
  if (beforeRatio >= minRatio) {
    return {
      ok: true,
      originalTextColor: original,
      suggestedTextColor: original,
      beforeRatio,
      afterRatio: beforeRatio,
      needsRepair: false,
    }
  }

  const towardBlack = searchToward(textRgb, bgRgb, BLACK, minRatio)
  const towardWhite = searchToward(textRgb, bgRgb, WHITE, minRatio)

  let best: Rgb | null = null
  let bestDistance = Number.POSITIVE_INFINITY
  for (const cand of [towardBlack, towardWhite]) {
    if (!cand) continue
    const distance = rgbDistance(cand, textRgb)
    // 距离更小者优先；并列时偏向压暗（更贴近正文可读性的常见做法）
    if (distance < bestDistance) {
      best = cand
      bestDistance = distance
    }
  }

  if (!best) {
    return {
      ok: false,
      originalTextColor: original,
      suggestedTextColor: null,
      beforeRatio,
      afterRatio: null,
      needsRepair: true,
      reason: 'unreachable',
    }
  }

  const afterRatio = contrastRatio(best, bgRgb)
  return {
    ok: true,
    originalTextColor: original,
    suggestedTextColor: rgbToHex(best),
    beforeRatio,
    afterRatio,
    needsRepair: true,
  }
}

/** 单个 CSS 声明块（不含注释） */
export function cssBlock(textColor: string, backgroundColor: string): string {
  return `.accessible-text {\n  color: ${textColor};\n  background-color: ${backgroundColor};\n}`
}

/**
 * 生成「修复前 / 修复后」对照的 CSS 文本，供展示。
 * applied 为 true 时后段标题为「已应用修复」，否则「建议修复后」。
 */
export function buildRepairCss(options: {
  beforeTextColor: string
  beforeBackgroundColor: string
  afterTextColor: string
  afterBackgroundColor: string
  applied: boolean
}): string {
  const afterLabel = options.applied ? '已应用修复' : '建议修复后'
  const before = cssBlock(options.beforeTextColor, options.beforeBackgroundColor)
  const after = cssBlock(options.afterTextColor, options.afterBackgroundColor)
  return `/* 修复前 */\n${before}\n\n/* ${afterLabel} */\n${after}\n`
}

/** 复制按钮用的「修复后」单段 CSS（背景不变，仅文字色为建议值） */
export function buildAfterCss(
  afterTextColor: string,
  backgroundColor: string,
): string {
  return `${cssBlock(afterTextColor, backgroundColor)}\n`
}
