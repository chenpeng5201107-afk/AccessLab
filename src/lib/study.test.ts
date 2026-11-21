import { describe, expect, it } from 'vitest'
import { EXPERIMENT_KEYS } from './experimentLedger'
import {
  caseFindings,
  learningMarkdown,
  learningRows,
  newStudy,
  studyReducer,
  type CaseId,
  type StudyState,
  type Verdict,
} from './study'

function submit(state: StudyState, id: CaseId, choices: Verdict[]) {
  for (const [i, topic] of EXPERIMENT_KEYS.entries()) {
    state = studyReducer(state, { type: 'answer', id, topic, value: choices[i] })
  }
  return studyReducer(state, { type: 'submit', id })
}

describe('案例学习', () => {
  it('未交初诊不能提前交迁移卷，缺答不能生成学习结果', () => {
    const state = newStudy()
    expect(submit(state, 'library', ['keep', 'repair', 'keep'])).toBe(state)
    expect(studyReducer(state, { type: 'submit', id: 'campus' })).toBe(state)
    expect(studyReducer(state, { type: 'apply', topic: 'contrast' })).toBe(state)
  })

  it('初诊猜错也能进入跟练，跟练不会覆盖首答或计作迁移判断', () => {
    const before = submit(newStudy(), 'campus', ['keep', 'repair', 'unsure'])
    const fixed = studyReducer(before, { type: 'apply', topic: 'contrast' })
    expect(studyReducer(fixed, { type: 'answer', id: 'campus', topic: 'contrast', value: 'repair' })).toBe(
      fixed,
    )
    expect(learningRows(fixed)[0]).toMatchObject({
      diagnosis: '判断有误',
      practice: '已应用到案例',
      transfer: '未交卷',
    })
  })

  it('同一个判断不能机械复制到图书馆场景；有正确组件也有真实缺陷', () => {
    expect(caseFindings('campus').contrast.broken).toBe(true)
    expect(caseFindings('library').contrast.broken).toBe(false)
    const dx = submit(newStudy(), 'campus', ['repair', 'repair', 'repair'])
    const exam = submit(dx, 'library', ['keep', 'keep', 'keep'])
    expect(learningRows(exam).map((row) => row.transfer)).toEqual(['判断正确', '判断有误', '判断正确'])
    expect(studyReducer(exam, { type: 'review', topic: 'form-label', choice: 0 })).toBe(exam)
    const corrected = studyReducer(exam, { type: 'review', topic: 'form-label', choice: 1 })
    expect(learningMarkdown(corrected)).toContain('已完成订正，保留原首答')
    expect(learningRows(corrected)[1].transfer).toBe('判断有误')
    expect(studyReducer(corrected, { type: 'clear' })).toEqual(newStudy())
  })
})
