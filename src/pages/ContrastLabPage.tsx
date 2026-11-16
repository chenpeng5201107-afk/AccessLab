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

/** 输入框里的值非法时，预览与检测用的仍是上一次有效配色，必须说清楚，不能让绿灯看起来像新配色的结论 */
const STALE_RESULT_NOTICE = '当前颜色输入无效，检测结果仍基于上一次有效配色。'

export function ContrastLabPage() {
  const [textColor, setTextColor] = useState(DEFAULT_TEXT_COLOR)
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND_COLOR)
  const [textValid, setTextValid] = useState(true)
  const [backgroundValid, setBackgroundValid] = useState(true)
  const [resetSignal, setResetSignal] = useState(0)

  const ratio = contrastRatioFromHex(textColor, backgroundColor)
  const passes = ratio !== null && meetsAaNormalText(ratio)
  const hasInvalidInput = !textValid || !backgroundValid
  const isDefault =
    textColor === DEFAULT_TEXT_COLOR && backgroundColor === DEFAULT_BACKGROUND_COLOR

  const handleReset = () => {
    setTextColor(DEFAULT_TEXT_COLOR)
    setBackgroundColor(DEFAULT_BACKGROUND_COLOR)
    setResetSignal((signal) => signal + 1)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <a
        href={ROUTE_HASH.home}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-800 underline decoration-indigo-400 decoration-2 underline-offset-4 hover:decoration-indigo-800"
      >
        返回首页
      </a>

      <header className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          色彩对比度实验
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-700">
          调整下方两个颜色，预览区域会实时更新，对比度数值由 WCAG 2.2
          的相对亮度算法现场计算。默认配色（#777777 / #FFFFFF）是一个典型的「看起来还行、实际不合格」的案例。
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
            <ColorControl
              label="文字颜色"
              value={textColor}
              onChange={setTextColor}
              onValidityChange={setTextValid}
              resetSignal={resetSignal}
            />
            <ColorControl
              label="背景颜色"
              value={backgroundColor}
              onChange={setBackgroundColor}
              onValidityChange={setBackgroundValid}
              resetSignal={resetSignal}
            />
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-indigo-700 hover:bg-indigo-50 hover:text-indigo-900"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            重置为默认颜色
          </button>
          {isDefault ? (
            <p className="mt-2 text-xs text-slate-600">当前已是默认配色。</p>
          ) : (
            <p className="mt-2 text-xs text-slate-600">已修改，可一键恢复默认配色。</p>
          )}

          {/* 全页唯一的实时播报区：正常文档流排在颜色控件下方，不用 sticky 覆盖任何操作控件；下面的「检测结果」只静态展示 */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={`mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 ring-1 ring-inset ${
              passes ? 'bg-emerald-50 ring-emerald-700/30' : 'bg-red-50 ring-red-700/30'
            }`}
          >
            <span className="text-xs font-semibold tracking-wide text-slate-700 uppercase">
              当前对比度
            </span>
            <span className="flex items-baseline gap-2">
              <span className="font-mono text-xl font-bold text-slate-900 tabular-nums">
                {ratio === null ? '—' : formatContrastRatio(ratio)}
              </span>
              <span
                className={`text-sm font-semibold ${passes ? 'text-emerald-900' : 'text-red-900'}`}
              >
                {ratio === null ? '颜色无效' : passes ? '达到 AA' : '未达 AA'}
              </span>
            </span>
            {hasInvalidInput ? (
              <p className="w-full text-xs font-semibold text-red-900">{STALE_RESULT_NOTICE}</p>
            ) : null}
          </div>
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
              预览区域内的配色完全由你控制，用来模拟一张常见的内容卡片。
              卡片里的通知是一段<strong>虚构的演示文案</strong>，不会真的产生提醒或费用。
            </p>

            <div
              className="mt-4 rounded-xl border border-slate-300 p-6"
              style={{ backgroundColor, color: textColor }}
            >
              <p className="text-xs font-semibold tracking-wide uppercase">
                虚构示例 · 校园场景
              </p>
              <h3 className="mt-2 text-xl font-bold">图书馆模拟逾期提醒</h3>
              <p className="mt-2 text-sm leading-relaxed">
                这是一段编出来给你试色的样例文字：假想的 3.50 元模拟逾期费用，
                以及一个假想的缴纳截止日期。
              </p>
              <p className="mt-3 text-xs">示例编号 FICTION-DEMO-0000（虚构，无对应真实记录）</p>
            </div>
          </section>

          <section
            aria-labelledby="result-heading"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 id="result-heading" className="text-lg font-semibold tracking-tight text-slate-900">
              3. 检测结果
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              对比度衡量的是文字与背景的<strong>反差程度</strong>，范围从 1:1（完全分不开）到
              21:1（纯黑配纯白）。反差太小，低视力用户和老年用户在强光下、在旧屏幕上就会看不清。
            </p>

            {hasInvalidInput ? (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-900 ring-1 ring-inset ring-red-700/30">
                {STALE_RESULT_NOTICE}
              </p>
            ) : null}

            {ratio === null ? (
              <p className="mt-4 text-sm font-semibold text-red-800">
                当前颜色值无效，无法计算对比度。请重新选择颜色。
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
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
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                只检查一件事：这一对颜色的反差，够不够 WCAG 2.2 成功标准 1.4.3
                给<strong>普通文本</strong>定的 {AA_NORMAL_TEXT_RATIO}:1（AA 级）。
                <span className="mt-1.5 block font-semibold text-slate-900">
                  这一项通过，只代表这一对颜色合格，不代表这个组件或整个网站已经符合 WCAG 2.2。
                </span>
              </p>

              <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
                <summary className="cursor-pointer rounded-lg px-2 py-3 text-sm font-semibold text-indigo-800">
                  展开查看：本次没有检查的内容
                </summary>
                <ul className="mt-1.5 space-y-1.5 px-2 pb-1 text-sm leading-relaxed text-slate-700">
                  <li>
                    1.4.3 对<strong>大文本</strong>要求的 3:1（AA 级）——本实验只判普通文本。
                  </li>
                  <li>
                    成功标准 1.4.6（Contrast (Enhanced)，AAA 级）：普通文本 7:1、大文本 4.5:1。
                  </li>
                  <li>成功标准 1.4.11（Non-text Contrast，AA 级）：图形与界面组件 3:1。</li>
                  <li>语义结构、键盘可达性、屏幕阅读器朗读顺序等其他成功标准。</li>
                </ul>
              </details>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
