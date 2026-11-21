import { contrastRatioFromHex, formatContrastRatio, meetsAaNormalText } from './contrast'
import { EXPERIMENT_KEYS, type ExperimentKey } from './experimentLedger'

export type CaseId = 'campus' | 'library'
export type Verdict = 'repair' | 'keep' | 'unsure'
export type Answers = Partial<Record<ExperimentKey, Verdict>>

export const REVIEW = {
  contrast: {
    prompt: '另一段普通正文测得 4.43:1，如何判断？',
    options: ['用原始数值判断，仍低于 4.5:1', '四舍五入为整数后通过'],
    correct: 0,
    feedback: '阈值比较使用未取整的比值。',
  },
  'form-label': {
    prompt: '想让点击「小组代号」能聚焦输入框，该改哪一处？',
    options: ['加粗可见标题', '让 label 的 for 指向输入框的 id'],
    correct: 1,
    feedback: '可见标题与输入控件之间需要程序化关联。',
  },
  keyboard: {
    prompt: '给按钮加上 hover 后，还需要怎么验证？',
    options: ['用 Tab 到达按钮，观察焦点轮廓', '把鼠标悬停在按钮上'],
    correct: 0,
    feedback: '键盘焦点和指针悬停是不同的状态。',
  },
} as const

export const TOPICS = {
  contrast: { title: '文字对比度', route: 'contrast-lab', probe: '查看地点小字与白底的对比度。' },
  'form-label': {
    title: '标签关联',
    route: 'form-label-lab',
    probe: '点输入框上方的文字，观察焦点是否进入输入框。',
  },
  keyboard: {
    title: '键盘焦点',
    route: 'keyboard-lab',
    probe: '用 Tab 走到示例的操作按钮，观察轮廓能否指明当前位置。',
  },
} as const

export const CASES = {
  campus: {
    title: '摄影社周末光影漫步',
    caption: '摄影社 · 校园外拍',
    place: '北图书馆东门集合',
    when: '周六 15:00 — 16:30',
    field: '参加者昵称',
    placeholder: '例如：小林',
    action: '预览报名回执',
    receipt: '报名回执预览已打开。周六 15:00，北图书馆东门集合。',
    ink: '#a5a5a5',
    linked: false,
    ring: false,
  },
  library: {
    title: '图书馆研习间预约',
    caption: '图书馆 · 自习服务',
    place: '南馆二层 · 研习间 B',
    when: '周三 14:00 — 15:00',
    field: '小组代号',
    placeholder: '例如：阅读小组',
    action: '查看可约时段',
    receipt: '可约时段：周三 14:00 — 15:00，南馆二层研习间 B。',
    ink: '#484d63',
    linked: false,
    ring: true,
  },
} as const

export interface Attempt {
  answers: Answers
  submitted: boolean
}
export interface StudyState {
  campus: Attempt
  library: Attempt
  applied: ExperimentKey[]
  corrected: ExperimentKey[]
}
export function newStudy(): StudyState {
  return {
    campus: { answers: {}, submitted: false },
    library: { answers: {}, submitted: false },
    applied: [],
    corrected: [],
  }
}
export type StudyEvent =
  | { type: 'answer'; id: CaseId; topic: ExperimentKey; value: Verdict }
  | { type: 'submit'; id: CaseId }
  | { type: 'apply'; topic: ExperimentKey }
  | { type: 'review'; topic: ExperimentKey; choice: number }
  | { type: 'clear' }

export function studyReducer(state: StudyState, event: StudyEvent): StudyState {
  if (event.type === 'clear') return newStudy()
  if (event.type === 'review') {
    if (
      !state.library.submitted ||
      correctAnswer('library', event.topic, state.library.answers[event.topic]) ||
      state.corrected.includes(event.topic) ||
      event.choice !== REVIEW[event.topic].correct
    )
      return state
    return { ...state, corrected: [...state.corrected, event.topic] }
  }
  if (event.type === 'apply') {
    if (!state.campus.submitted || state.applied.includes(event.topic)) return state
    return { ...state, applied: [...state.applied, event.topic] }
  }
  const attempt = state[event.id]
  if (attempt.submitted || (event.id === 'library' && !state.campus.submitted)) return state
  if (event.type === 'answer')
    return {
      ...state,
      [event.id]: { ...attempt, answers: { ...attempt.answers, [event.topic]: event.value } },
    }
  if (!EXPERIMENT_KEYS.every((key) => attempt.answers[key])) return state
  return { ...state, [event.id]: { ...attempt, submitted: true } }
}

export function caseFindings(id: CaseId) {
  const sample = CASES[id]
  const ratio = contrastRatioFromHex(sample.ink, '#ffffff')!
  const passes = meetsAaNormalText(ratio)
  return {
    contrast: {
      broken: !passes,
      why: `地点文字与白底的对比度为 ${formatContrastRatio(ratio)}，${passes ? '达到' : '低于'}普通文本的 4.5:1 门槛。`,
    },
    'form-label': {
      broken: !sample.linked,
      why: '标题是独立的 span。输入框虽然有占位文字，点标题却无法聚焦，需要用 label 的 for 指向输入框 id。',
    },
    keyboard: {
      broken: !sample.ring,
      why: sample.ring
        ? 'Tab 到达操作按钮时已有清晰轮廓，这条焦点样式可以保留。'
        : '按钮可以用键盘触发，但到达时轮廓被移除了。恢复 :focus-visible 后再走一次。',
    },
  }
}

export function correctAnswer(id: CaseId, key: ExperimentKey, verdict?: Verdict) {
  return verdict === (caseFindings(id)[key].broken ? 'repair' : 'keep')
}
export const topicResult = (id: CaseId, key: ExperimentKey, attempt: Attempt) => {
  if (!attempt.submitted) return '未交卷'
  if (attempt.answers[key] === 'unsure') return '暂不确定'
  return correctAnswer(id, key, attempt.answers[key]) ? '判断正确' : '判断有误'
}
export function learningRows(study: StudyState) {
  return EXPERIMENT_KEYS.map((key) => ({
    key,
    title: TOPICS[key].title,
    diagnosis: topicResult('campus', key, study.campus),
    practice: study.applied.includes(key) ? '已应用到案例' : '未应用到案例',
    transfer: topicResult('library', key, study.library),
  }))
}
export function reviewAdvice(study: StudyState) {
  if (!study.campus.submitted) return '先提交校园报名页的三项判断。'
  if (!study.library.submitted) return '完成图书馆迁移题，看看换一个场景后哪些知识仍能用上。'
  const missed = learningRows(study).filter(
    (row) => row.transfer !== '判断正确' && !study.corrected.includes(row.key),
  )
  if (missed.length) return '建议回练：' + missed.map((row) => row.title).join('、') + '。'
  return study.corrected.length
    ? '已完成本轮错题订正。下次在自己的页面上重新验证这些判断。'
    : '三项迁移判断均正确。可用同样方法再检查一张自己的页面。'
}
export function learningMarkdown(study: StudyState) {
  return [
    '## 学习复盘',
    '',
    '| 能力 | 校园初诊 | 跟练修复 | 图书馆首答 |',
    '| --- | --- | --- | --- |',
    ...learningRows(study).map((r) => `| ${r.title} | ${r.diagnosis} | ${r.practice} | ${r.transfer} |`),
    '',
    ...study.corrected.map((k) => TOPICS[k].title + '：已完成订正，保留原首答。'),
    reviewAdvice(study),
  ].join('\n')
}
