/**
 * WCAG 2.2 对比度计算
 * 规范：https://www.w3.org/TR/WCAG22/#relativeluminancedef
 *      https://www.w3.org/TR/WCAG22/#contrast-minimumdef
 */

export interface Rgb {
  /** 0–255 */
  r: number
  /** 0–255 */
  g: number
  /** 0–255 */
  b: number
}

/** 普通文本达到 WCAG 2.2 AA 所需的最低对比度 */
export const AA_NORMAL_TEXT_RATIO = 4.5

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

/**
 * 解析 #RGB / #RRGGBB / RGB / RRGGBB 形式。
 * 非法输入返回 null，供界面提示用户而不是静默回退到默认色。
 */
export function parseHexColor(input: string): Rgb | null {
  const match = HEX_PATTERN.exec(input.trim())
  if (!match) return null

  const digits = match[1]
  const expanded =
    digits.length === 3
      ? digits
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : digits

  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16),
  }
}

/** 统一成 <input type="color"> 要求的 #rrggbb 小写形式 */
export function normalizeHex(input: string): string | null {
  const color = parseHexColor(input)
  if (!color) return null
  return `#${channelToHex(color.r)}${channelToHex(color.g)}${channelToHex(color.b)}`
}

function channelToHex(value: number): string {
  return value.toString(16).padStart(2, '0')
}

/**
 * sRGB 分量线性化。
 * 阈值沿用 WCAG 2.2 正文中的 0.03928，与 axe-core / WebAIM 的实现保持一致。
 */
function linearize(channel: number): number {
  const srgb = channel / 255
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
}

/** 相对亮度 L，取值范围 0（黑）–1（白） */
export function relativeLuminance(color: Rgb): number {
  return (
    0.2126 * linearize(color.r) +
    0.7152 * linearize(color.g) +
    0.0722 * linearize(color.b)
  )
}

/**
 * 对比度 (L1 + 0.05) / (L2 + 0.05)，L1 为较亮一侧。
 * 返回值范围 1–21。
 */
export function contrastRatio(foreground: Rgb, background: Rgb): number {
  const fgLuminance = relativeLuminance(foreground)
  const bgLuminance = relativeLuminance(background)
  const lighter = Math.max(fgLuminance, bgLuminance)
  const darker = Math.min(fgLuminance, bgLuminance)
  return (lighter + 0.05) / (darker + 0.05)
}

/** 任意两个颜色字符串的对比度；有一侧非法时返回 null */
export function contrastRatioFromHex(foreground: string, background: string): number | null {
  const fg = parseHexColor(foreground)
  const bg = parseHexColor(background)
  if (!fg || !bg) return null
  return contrastRatio(fg, bg)
}

export function formatContrastRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`
}

/**
 * 仅针对「普通文本 AA」这一条成功标准。
 * 通过不代表组件或整站符合 WCAG，也不覆盖大文本、非文本对比等要求。
 */
export function meetsAaNormalText(ratio: number): boolean {
  return ratio >= AA_NORMAL_TEXT_RATIO
}
