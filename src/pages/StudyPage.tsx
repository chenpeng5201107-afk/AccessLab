import { useEffect, useRef, useState, type Dispatch } from 'react'
import { ArrowRight, BookOpen, ScanEye } from 'lucide-react'
import { useExperimentLedger } from '../context/ExperimentLedgerContext'
import { ROUTE_HASH } from '../hooks/useHashRoute'
import { suggestTextColor } from '../lib/colorRepair'
import { contrastRatioFromHex, formatContrastRatio } from '../lib/contrast'
import { EXPERIMENT_KEYS, progressOf, type ExperimentKey } from '../lib/experimentLedger'
import {
  CASES,
  REVIEW,
  TOPICS,
  caseFindings,
  correctAnswer,
  type CaseId,
  type StudyEvent,
  type StudyState,
  type Verdict,
} from '../lib/study'

const CHOICES: { value: Verdict; label: string }[] = [
  { value: 'repair', label: '需要修复' },
  { value: 'keep', label: '可以保留' },
  { value: 'unsure', label: '暂不确定' },
]

function CaseSample({ id, applied }: { id: CaseId; applied: ExperimentKey[] }) {
  const data = CASES[id]
  const [opened, setOpened] = useState(false)
  const ink = applied.includes('contrast')
    ? (suggestTextColor(data.ink, '#ffffff').suggestedTextColor ?? data.ink)
    : data.ink
  const linked = data.linked || applied.includes('form-label')
  const ring = data.ring || applied.includes('keyboard')
  const inputId = 'case-field-' + id
  return (
    <section className="study-panel" aria-label="操作样本">
      <div className={'case-cover ' + (id === 'library' ? 'library-cover' : 'campus-cover')}>
        <p>{data.caption}</p>
        <h2>{data.title}</h2>
        <p>{data.when}</p>
      </div>
      <div className="case-content">
        <p className="case-location" style={{ color: ink }}>
          {data.place}
        </p>
        <div className="case-field">
          {linked ? <label htmlFor={inputId}>{data.field}</label> : <span>{data.field}</span>}
          <input id={inputId} autoComplete="off" placeholder={data.placeholder} />
        </div>
        <button
          type="button"
          className={'case-action ' + (ring ? 'with-ring' : 'without-ring')}
          aria-expanded={opened}
          onClick={() => setOpened(!opened)}
        >
          {data.action}
        </button>
        {opened && <p className="study-callout">{data.receipt}</p>}
        <details className="study-details">
          <summary>取证工具 · 颜色与组件代码</summary>
          <p>
            地点文字 {ink.toUpperCase()} / 白底，实测 {formatContrastRatio(contrastRatioFromHex(ink, '#ffffff')!)}
            。
          </p>
          <pre>
            {linked ? `<label for="${inputId}">${data.field}</label>` : `<span>${data.field}</span>`}
            <br />
            {`<input id="${inputId}">`}
          </pre>
          <pre>
            {ring ? ':focus-visible { outline: 3px solid #4338ca; }' : ':focus-visible { outline: none; }'}
          </pre>
        </details>
        <p className="study-small">练习用表单，可填任意代号。</p>
      </div>
    </section>
  )
}

interface Props {
  id: CaseId
  study: StudyState
  dispatch: Dispatch<StudyEvent>
}

export function StudyPage({ id, study, dispatch }: Props) {
  const { ledger } = useExperimentLedger()
  const attempt = study[id],
    campus = id === 'campus'
  const applied = campus ? study.applied : []
  const [feedback, setFeedback] = useState<{ topic: ExperimentKey; text: string } | null>(null)
  const resultRef = useRef<HTMLHeadingElement>(null)
  const pendingFocus = useRef(false)
  useEffect(() => {
    if (pendingFocus.current && attempt.submitted) {
      pendingFocus.current = false
      resultRef.current?.focus()
    }
  }, [attempt.submitted])

  if (!campus && !study.campus.submitted)
    return (
      <div className="study-wrap">
        <header className="workspace-intro">
          <h1>图书馆迁移测验</h1>
          <p className="study-sub">先完成校园初诊，迁移测验会保留你换场景后的首次判断。刷新会清空本次学习记录。</p>
        </header>
        <a className="study-primary" href={ROUTE_HASH.diagnosis}>
          开始校园初诊 <ArrowRight size={16} />
        </a>
      </div>
    )
  const findings = caseFindings(id)
  const answered = EXPERIMENT_KEYS.filter((k) => attempt.answers[k]).length
  const score = EXPERIMENT_KEYS.filter((k) => correctAnswer(id, k, attempt.answers[k])).length
  return (
    <div className="study-wrap">
      <div className="study-breadcrumb">
        <a className="study-back" href={campus ? ROUTE_HASH.home : ROUTE_HASH.diagnosis}>
          ← {campus ? '学习首页' : '校园报名页'}
        </a>
        <span>{campus ? '校园初诊' : '迁移测验'}</span>
      </div>
      <header className="workspace-intro">
        <h1>{campus ? '诊断一张校园报名页' : '检查研习间预约页'}</h1>
        <p className="study-sub">
          {attempt.submitted
            ? campus
              ? '对照首答，选一项跟练并把修复用回报名页。'
              : '对照首答与解析，完成错题订正。'
            : campus
              ? '试用摄影社报名页，记录你的三项判断。'
              : '试用预约页，判断哪些组件要修、哪些可以保留。'}
        </p>
      </header>
      <div className="study-grid">
        <CaseSample id={id} applied={applied} />
        <section className="study-panel study-sheet" aria-labelledby="study-sheet-title">
          <div className="study-heading">
            <ScanEye size={20} aria-hidden="true" />
            <h2 id="study-sheet-title" tabIndex={-1} ref={resultRef}>
              {attempt.submitted ? (campus ? '初诊复盘与修复' : '迁移测验结果') : '记录你的判断'}
            </h2>
          </div>
          {!attempt.submitted ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const missing = EXPERIMENT_KEYS.find((k) => !attempt.answers[k])
                if (missing) {
                  setFeedback({ topic: missing, text: '请选择一项，也可以选“暂不确定”。' })
                  document.getElementById('choice-' + missing)?.focus()
                  return
                }
                pendingFocus.current = true
                setFeedback(null)
                dispatch({ type: 'submit', id })
              }}
            >
              {EXPERIMENT_KEYS.map((key) => (
                <fieldset key={key} className="study-question">
                  <legend>{TOPICS[key].title}</legend>
                  <p>{TOPICS[key].probe}</p>
                  <div className="study-choices">
                    {CHOICES.map((choice, i) => (
                      <label key={choice.value}>
                        <input
                          type="radio"
                          id={i === 0 ? 'choice-' + key : undefined}
                          aria-describedby={feedback?.topic === key ? 'feedback-' + key : undefined}
                          name={key}
                          checked={attempt.answers[key] === choice.value}
                          onChange={() => {
                            setFeedback(null)
                            dispatch({ type: 'answer', id, topic: key, value: choice.value })
                          }}
                        />
                        {choice.label}
                      </label>
                    ))}
                  </div>
                  <p id={'feedback-' + key} role="status" className="study-message">
                    {feedback?.topic === key && feedback.text}
                  </p>
                </fieldset>
              ))}
              <div className="answer-progress">
                <progress aria-label="已填写判断" value={answered} max={3} />
                <span>已填 {answered} / 3 项 · 交卷后保留首答</span>
              </div>
              <button className="study-primary" type="submit">
                {campus ? '提交初诊' : '提交迁移测验'} <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <>
              <p className="study-score">
                首次判断正确 <strong>{score} / 3</strong>
              </p>
              {EXPERIMENT_KEYS.map((key) => {
                const fixed = applied.includes(key)
                const practiced = progressOf(key, ledger).repairApplied
                const right = correctAnswer(id, key, attempt.answers[key])
                const answer = CHOICES.find((choice) => choice.value === attempt.answers[key])!.label
                return (
                  <div className="study-result" key={key}>
                    <h3>
                      {TOPICS[key].title}{' '}
                      <small>{right ? '判断正确' : answer === '暂不确定' ? '需要练习' : '需要复盘'}</small>
                    </h3>
                    <p>
                      首答：{answer} · 样本：{findings[key].broken ? '需要修复' : '可以保留'}
                    </p>
                    <p>{findings[key].why}</p>
                    <div className="study-inline">
                      <a href={ROUTE_HASH[TOPICS[key].route]}>
                        <BookOpen size={15} aria-hidden="true" />
                        {campus ? '去做' : '复习'}
                        {TOPICS[key].title}实验
                      </a>
                      {campus && (fixed || practiced) && (
                        <button
                          className="study-secondary"
                          aria-disabled={fixed}
                          type="button"
                          onClick={() => {
                            if (fixed) return
                            dispatch({ type: 'apply', topic: key })
                            setFeedback({ topic: key, text: '已应用，可在报名页复验。' })
                          }}
                        >
                          {fixed ? '✓ 已应用到报名页' : '应用' + TOPICS[key].title + '修复'}
                        </button>
                      )}
                    </div>
                    {!campus && !right && (
                      <fieldset className="study-review">
                        <legend>订正练习 · {REVIEW[key].prompt}</legend>
                        <div className="study-inline">
                          {REVIEW[key].options.map((option, i) => (
                            <button
                              type="button"
                              key={option}
                              className="study-secondary"
                              aria-disabled={study.corrected.includes(key)}
                              onClick={() => {
                                if (study.corrected.includes(key)) return
                                dispatch({ type: 'review', topic: key, choice: i })
                                setFeedback({
                                  topic: key,
                                  text: i === REVIEW[key].correct ? '' : '再想一想。' + REVIEW[key].feedback,
                                })
                              }}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    )}
                    <p role="status" className="study-message">
                      {!campus && study.corrected.includes(key)
                        ? '✓ 已订正。' + REVIEW[key].feedback
                        : feedback?.topic === key && feedback.text}
                    </p>
                  </div>
                )
              })}
              <a href={campus ? ROUTE_HASH.transfer : ROUTE_HASH.report} className="study-primary">
                {campus ? '进入图书馆迁移测验' : '查看学习报告'} <ArrowRight size={16} />
              </a>
              {campus && <p className="study-small">跟练后可返回应用修复，也可直接参加测验。</p>}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
