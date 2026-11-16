import { useEffect, useId, useState } from 'react'

import { normalizeHex } from '../lib/contrast'

interface ColorControlProps {
  label: string
  /** 受控的 #rrggbb 颜色 */
  value: string
  onChange: (hex: string) => void
}

/**
 * 同时提供取色器与十六进制输入框：
 * 取色器方便试色，文本框方便键盘输入与精确复现别人给的颜色值。
 */
export function ColorControl({ label, value, onChange }: ColorControlProps) {
  const reactId = useId()
  const textId = `${reactId}-hex`
  const swatchId = `${reactId}-picker`
  const hintId = `${reactId}-hint`
  const errorId = `${reactId}-error`

  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])

  const canonical = normalizeHex(draft)
  const invalid = canonical === null

  const swatchValue = normalizeHex(value) ?? '#000000'

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <label htmlFor={textId} className="block text-sm font-semibold text-slate-900">
        {label}
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          id={swatchId}
          type="color"
          value={swatchValue}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label}取色器`}
          className="size-11 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
        />

        <div className="min-w-36 grow">
          <input
            id={textId}
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            value={draft}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? `${hintId} ${errorId}` : hintId}
            onChange={(event) => {
              const raw = event.target.value
              setDraft(raw)
              const normalized = normalizeHex(raw)
              if (normalized) onChange(normalized)
            }}
            onBlur={() => {
              if (canonical) setDraft(canonical)
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 uppercase"
          />
          <p id={hintId} className="mt-1.5 text-xs text-slate-600">
            支持 #RGB 与 #RRGGBB
          </p>
          {invalid ? (
            <p id={errorId} className="mt-1 text-xs font-semibold text-red-800">
              请输入有效的十六进制颜色，例如 #1a4d8f
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
