import { useState } from 'react'
import { CircleAlert, CircleCheckBig, Info, RotateCcw } from 'lucide-react'

import { ColorControl } from '../components/ColorControl'
import { ROUTE_HASH } from '../hooks/useHashRoute'
import {
  AA_NORMAL_TEXT_RATIO,
  contrastRatioFromHex,
  formatContrastRatio,
  meetsAaNormalText,
} from '../lib/contrast'

const DEFAULT_TEXT_COLOR = '#777777'
const DEFAULT_BACKGROUND_COLOR = '#ffffff'

export function ContrastLabPage() {
  const [textColor, setTextColor] = useState(DEFAULT_TEXT_COLOR)
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND_COLOR)

  const ratio = contrastRatioFromHex(textColor, backgroundColor)
  const passes = ratio !== null && meetsAaNormalText(ratio)
  const isDefault =
    textColor === DEFAULT_TEXT_COLOR && backgroundColor === DEFAULT_BACKGROUND_COLOR

  const handleReset = () => {
    setTextColor(DEFAULT_TEXT_COLOR)
    setBackgroundColor(DEFAULT_BACKGROUND_COLOR)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <a
        href={ROUTE_HASH.home}
        className="text-sm font-semibold text-indigo-800 underline decoration-indigo-400 decoration-2 underline-offset-4 hover:decoration-indigo-800"
      >
        返回首页
      </a>

      <header className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          色彩对比度实验
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-700">
          调整下方两个颜色，右侧预览会实时更新，
          对比度数值由 WCAG 2.2 的相对亮度算法现场计算得出。
          默认配色（#777777 / #FFFFFF）是一个典型的「看起来还行、实际不合格」的案例。
        </p>
      </header>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <section
          aria-labelledby="controls-heading"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 id="controls-heading" className="text-lg font-semibold tracking-tight text-slate-900">
            1. 调整颜色
          </h2>

          <div className="mt-4 space-y-4">
            <ColorControl label="文字颜色" value={textColor} onChange={setTextColor} />
            <ColorControl label="背景颜色" value={backgroundColor} onChange={setBackgroundColor} />
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-indigo-700 hover:bg-indigo-50 hover:text-indigo-900"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            重置为默认颜色
          </button>
          {isDefault ? (
            <p className="mt-2 text-xs text-slate-600">当前已是默认配色。</p>
          ) : (
            <p className="mt-2 text-xs text-slate-600">已修改，可一键恢复默认配色。</p>
          )}
        </section>

        <div className="space-y-6">
          <section
            aria-labelledby="preview-heading"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 id="preview-heading" className="text-lg font-semibold tracking-tight text-slate-900">
              2. 实时预览
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              预览区内的配色完全由你控制，用于模拟真实内容卡片。
            </p>

            <div
              className="mt-4 rounded-xl border border-slate-300 p-6"
              style={{ backgroundColor, color: textColor }}
            >
              <p className="text-xs font-semibold tracking-wide uppercase">缴费提醒</p>
              <h3 className="mt-2 text-xl font-bold">本学期图书馆逾期费用</h3>
              <p className="mt-2 text-sm leading-relaxed">
                你有一笔 3.50 元的逾期费用需要在 11 月 30 日前完成缴纳，逾期后借阅权限会被暂停。
              </p>
              <p className="mt-3 text-xs">费用编号 LG-2026-1116-073</p>
            </div>
          </section>

          <section
            aria-labelledby="result-heading"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 id="result-heading" className="text-lg font-semibold tracking-tight text-slate-900">
              3. 检测结果
            </h2>

            {ratio === null ? (
              <p className="mt-4 text-sm font-semibold text-red-800">
                当前颜色值无效，无法计算对比度。请重新选择颜色。
              </p>
            ) : (
              <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3"
              >
                <div>
                  <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                    对比度
                  </p>
                  <p className="mt-1 font-mono text-4xl font-bold text-slate-900 tabular-nums">
                    {formatContrastRatio(ratio)}
                  </p>
                </div>

                <div
                  className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold ring-1 ring-inset ${
                    passes
                      ? 'bg-emerald-50 text-emerald-900 ring-emerald-700/30'
                      : 'bg-red-50 text-red-900 ring-red-700/30'
                  }`}
                >
                  {passes ? (
                    <CircleCheckBig className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                  ) : (
                    <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                  )}
                  <span>
                    {passes
                      ? `达到普通文本 AA（≥ ${AA_NORMAL_TEXT_RATIO}:1）`
                      : `未达普通文本 AA（需 ≥ ${AA_NORMAL_TEXT_RATIO}:1）`}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-5 border-t border-slate-200 pt-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Info className="size-4 shrink-0 text-indigo-800" aria-hidden="true" />
                本实验检查什么、不检查什么
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-700">
                <li>
                  检查：前景色与背景色这一对颜色的对比度，是否满足成功标准
                  1.4.3（Contrast (Minimum)，AA 级）对<strong>普通文本</strong>要求的{' '}
                  {AA_NORMAL_TEXT_RATIO}:1。
                </li>
                <li>
                  不检查：1.4.3 对<strong>大文本</strong>要求的 3:1（AA 级）。
                </li>
                <li>
                  不检查：成功标准 1.4.6（Contrast (Enhanced)，AAA 级）要求的普通文本 7:1、
                  大文本 4.5:1。
                </li>
                <li>
                  不检查：成功标准 1.4.11（Non-text Contrast，AA 级）要求的图形与界面组件 3:1。
                </li>
                <li>不检查：语义结构、键盘可达性、屏幕阅读器朗读顺序等其他成功标准。</li>
                <li className="font-semibold text-slate-900">
                  因此：本项通过不代表该组件或整个网站已经符合 WCAG 2.2。
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
