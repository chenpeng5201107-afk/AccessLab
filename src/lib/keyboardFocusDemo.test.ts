import { describe, expect, it } from 'vitest'

import {
  BASE_CLASS,
  BROKEN_CLASS,
  BROKEN_FOCUS_CSS,
  DEMO_BUTTONS,
  DEMO_RECORDS,
  DEMO_STYLE_SHEET,
  FIXED_CLASS,
  FIXED_FOCUS_CSS,
  FOCUS_RING_COLOR,
  NON_TEXT_MIN_CONTRAST_RATIO,
  OBSERVATION_STATEMENT,
  PREVIEW_FIXED_CLASS,
  STAGE_META,
  activeFocusCss,
  canConfirmObservation,
  confirmBlockReason,
  currentRecord,
  currentRecordIndex,
  demoButtonClassName,
  demoWorkflowReducer,
  emptySightingCounts,
  focusCssLines,
  initialDemoWorkflowState,
  inactiveFocusCss,
  phaseOfMode,
  recordKeyboardSighting,
  resolveStage,
  sightingTotal,
  startAfterPhase,
  type ObservationStage,
} from './keyboardFocusDemo'

/**
 * Day 4 数据源层的测试只回答一个问题：
 * 「注入页面生效的 CSS」和「展示给学员看的 CSS」是不是同一批字符串，
 * 以及四阶段教学状态机与演示流程的结论是否如实。
 * 焦点轮廓在屏幕上看不看得见不在这个文件的职责里，由真实浏览器取证负责。
 */

describe('keyboardFocusDemo · 展示代码与生效代码同源', () => {
  it('修复前后两段 CSS 都是实际注入样式表的逐字片段', () => {
    expect(DEMO_STYLE_SHEET).toContain(BROKEN_FOCUS_CSS)
    expect(DEMO_STYLE_SHEET).toContain(FIXED_FOCUS_CSS)
  })

  it('缺陷规则确实把轮廓去掉，修复规则确实给出实心轮廓', () => {
    expect(BROKEN_FOCUS_CSS).toContain(`.${BROKEN_CLASS}:focus-visible {`)
    expect(BROKEN_FOCUS_CSS).toContain('outline: none;')

    expect(FIXED_FOCUS_CSS).toContain(`.${FIXED_CLASS}:focus-visible {`)
    expect(FIXED_FOCUS_CSS).toContain(`outline: 3px solid ${FOCUS_RING_COLOR};`)
    expect(FIXED_FOCUS_CSS).toContain('outline-offset: 3px;')
  })

  it('代码对比区逐行渲染出来的文本，与两块源常量完全一致', () => {
    expect(focusCssLines(false).map((line) => line.text).join('\n')).toBe(BROKEN_FOCUS_CSS)
    expect(focusCssLines(true).map((line) => line.text).join('\n')).toBe(FIXED_FOCUS_CSS)
  })

  it('高亮只打在真正变化的声明行上，选择器与收尾括号不算改动', () => {
    const before = focusCssLines(false)
    expect(before[0].changed).toBe(true) // 选择器换类名
    expect(before[1].changed).toBe(true) // outline: none
    expect(before.at(-1)!.changed).toBe(false) // }

    const after = focusCssLines(true)
    expect(after.filter((line) => line.changed).map((line) => line.text.trim())).toEqual([
      `.${FIXED_CLASS}:focus-visible {`,
      `outline: 3px solid ${FOCUS_RING_COLOR};`,
      'outline-offset: 3px;',
    ])
  })

  it('activeFocusCss / inactiveFocusCss 按样式状态给出对应的那一段', () => {
    expect(activeFocusCss('broken')).toBe(BROKEN_FOCUS_CSS)
    expect(inactiveFocusCss('broken')).toBe(FIXED_FOCUS_CSS)
    expect(activeFocusCss('repaired')).toBe(FIXED_FOCUS_CSS)
    expect(inactiveFocusCss('repaired')).toBe(BROKEN_FOCUS_CSS)
  })

  it('实验样式只命中 kf-demo-btn 这组类名，绝不写成全局规则', () => {
    const focusLines = DEMO_STYLE_SHEET.split('\n')
      .map((line) => line.trim())
      .filter((line) => line.includes(':focus-visible'))
    expect(focusLines.length).toBeGreaterThan(0)
    for (const line of focusLines) {
      expect(line.startsWith(`.${BASE_CLASS}`)).toBe(true)
    }
    // 没有裸 :focus-visible / button 选择器，平台外壳的全局焦点样式不会被这段样式改掉
    expect(DEMO_STYLE_SHEET).not.toMatch(/\n\s*:focus-visible\s*\{/)
    expect(DEMO_STYLE_SHEET).not.toMatch(/\n\s*button\s*\{/)
  })

  it('焦点轮廓不使用动画与过渡', () => {
    expect(DEMO_STYLE_SHEET).toContain('transition: none;')
    expect(DEMO_STYLE_SHEET).not.toContain('animation-duration')
    expect(DEMO_STYLE_SHEET).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('轮廓色与静态示意类都在样式表里，示意图用的就是同一条规则', () => {
    expect(DEMO_STYLE_SHEET).toContain(`.${PREVIEW_FIXED_CLASS} {`)
    expect(NON_TEXT_MIN_CONTRAST_RATIO).toBe(3)
  })
})

describe('keyboardFocusDemo · 按钮类名与按钮清单', () => {
  it('恰好三个示例按钮，各有 id、可见名称与真实动作说明', () => {
    expect(DEMO_BUTTONS.map((button) => button.label)).toEqual(['查看详情', '保存选择', '返回上一步'])
    expect(new Set(DEMO_BUTTONS.map((button) => button.id)).size).toBe(3)
    for (const button of DEMO_BUTTONS) {
      expect(button.id).toMatch(/^kf-/)
      expect(button.actionHint.length).toBeGreaterThan(4)
    }
  })

  it('类名切换只改样式状态，基类始终保留', () => {
    expect(demoButtonClassName('broken')).toBe(`${BASE_CLASS} ${BROKEN_CLASS}`)
    expect(demoButtonClassName('repaired')).toBe(`${BASE_CLASS} ${FIXED_CLASS}`)
  })
})

describe('keyboardFocusDemo · 五阶段教学状态机', () => {
  it('焦点还没到达、也没修复 → 尚未体验', () => {
    expect(
      resolveStage({ mode: 'broken', beforeSightings: 0, afterSightings: 0, confirmed: false }),
    ).toBe('not-experienced')
  })

  it('修复前到达过但样式仍是缺陷态 → 待人工检查（程序不替学员判断看不看得见）', () => {
    expect(
      resolveStage({ mode: 'broken', beforeSightings: 2, afterSightings: 0, confirmed: false }),
    ).toBe('awaiting-manual-check')
  })

  it('应用修复、修复后还没走过 → 已应用焦点修复，而不是「已通过」', () => {
    const stage = resolveStage({
      mode: 'repaired',
      beforeSightings: 3,
      afterSightings: 0,
      confirmed: false,
    })
    expect(stage).toBe('repair-applied')
    expect(STAGE_META[stage].detail).toContain('CSS 生效了')
    expect(STAGE_META[stage].label).not.toMatch(/通过|合规|达标/)
  })

  it('修复后又用键盘走过一轮、尚未确认 → 单独一个阶段，不与前两步混用', () => {
    const stage = resolveStage({
      mode: 'repaired',
      beforeSightings: 3,
      afterSightings: 1,
      confirmed: false,
    })
    expect(stage).toBe('awaiting-confirmation')
    expect(STAGE_META[stage].detail).toContain('你自己')
    expect(STAGE_META[stage].label).not.toMatch(/通过|合规|达标/)
  })

  it('确认过观察结果才进入最终阶段，且确认优先于其它判断', () => {
    expect(
      resolveStage({ mode: 'repaired', beforeSightings: 3, afterSightings: 3, confirmed: true }),
    ).toBe('confirmed')
    expect(STAGE_META.confirmed.detail).toContain('不是程序自动扫描的结论')
  })

  it('只有修复后一轮、修复前空白时不会跳进确认阶段：前一轮记录是必要条件', () => {
    expect(
      resolveStage({ mode: 'repaired', beforeSightings: 0, afterSightings: 4, confirmed: false }),
    ).toBe('awaiting-confirmation')
    expect(canConfirmObservation({ mode: 'repaired', beforeSightings: 0, afterSightings: 4 })).toBe(false)
  })

  it('五个阶段的标签各自不同，页面上不会混成一句话', () => {
    const stages = Object.keys(STAGE_META) as ObservationStage[]
    expect(stages).toHaveLength(5)
    expect(new Set(stages.map((stage) => STAGE_META[stage].label)).size).toBe(5)
    expect(new Set(stages.map((stage) => STAGE_META[stage].detail)).size).toBe(5)
  })
})

describe('keyboardFocusDemo · 确认观察的三条硬条件', () => {
  const done = { mode: 'repaired', beforeSightings: 2, afterSightings: 2 } as const

  it('没应用修复时不允许确认观察', () => {
    expect(canConfirmObservation({ mode: 'broken', beforeSightings: 5, afterSightings: 0 })).toBe(false)
  })

  it('只改了 CSS、前后都没用键盘走过 → 不能确认', () => {
    expect(canConfirmObservation({ mode: 'repaired', beforeSightings: 0, afterSightings: 0 })).toBe(false)
  })

  it('修复前走过、修复后还没走 → 不能确认（这正是本次修掉的人工确认漏洞）', () => {
    expect(canConfirmObservation({ mode: 'repaired', beforeSightings: 3, afterSightings: 0 })).toBe(false)
  })

  it('修复后走过、修复前记录已经丢了 → 也不能确认', () => {
    expect(canConfirmObservation({ mode: 'repaired', beforeSightings: 0, afterSightings: 3 })).toBe(false)
  })

  it('三条都满足才放开', () => {
    expect(canConfirmObservation(done)).toBe(true)
    expect(confirmBlockReason(done)).toBeNull()
  })

  it('缺哪一步就说明哪一步，不给出笼统的「不可用」', () => {
    expect(confirmBlockReason({ mode: 'broken', beforeSightings: 0, afterSightings: 0 })).toContain(
      '要等你先点过「修复焦点指示」',
    )
    expect(confirmBlockReason({ mode: 'repaired', beforeSightings: 0, afterSightings: 2 })).toContain(
      '修复前那一轮没有键盘记录',
    )
    expect(confirmBlockReason({ mode: 'repaired', beforeSightings: 2, afterSightings: 0 })).toContain(
      '修复后这一轮还没走过',
    )
  })
})

describe('keyboardFocusDemo · 修复前后两轮记录', () => {
  it('两轮记录各自从零开始', () => {
    const counts = emptySightingCounts()
    expect(counts).toEqual({ before: {}, after: {} })
    expect(sightingTotal(counts.before)).toBe(0)
    expect(sightingTotal(counts.after)).toBe(0)
  })

  it('按按钮分别累计，总数把各按钮加起来', () => {
    let counts = recordKeyboardSighting(emptySightingCounts(), 'before', 'kf-view-details')
    counts = recordKeyboardSighting(counts, 'before', 'kf-view-details')
    counts = recordKeyboardSighting(counts, 'before', 'kf-save-selection')

    expect(counts.before['kf-view-details']).toBe(2)
    expect(counts.before['kf-save-selection']).toBe(1)
    expect(sightingTotal(counts.before)).toBe(3)
    expect(sightingTotal(counts.after)).toBe(0)
  })

  it('应用修复时保留修复前那一轮，只把修复后清零', () => {
    let counts = recordKeyboardSighting(emptySightingCounts(), 'before', 'kf-view-details')
    counts = recordKeyboardSighting(counts, 'before', 'kf-save-selection')
    counts = recordKeyboardSighting(counts, 'after', 'kf-view-details')

    const afterRepair = startAfterPhase(counts)
    expect(sightingTotal(afterRepair.before)).toBe(2)
    expect(sightingTotal(afterRepair.after)).toBe(0)
    expect(afterRepair.before).toEqual(counts.before)
  })

  it('修复后的记录写进 after，不会污染修复前那一轮', () => {
    let counts = recordKeyboardSighting(emptySightingCounts(), 'before', 'kf-view-details')
    counts = recordKeyboardSighting(counts, phaseOfMode('repaired'), 'kf-view-details')

    expect(sightingTotal(counts.before)).toBe(1)
    expect(sightingTotal(counts.after)).toBe(1)
  })

  it('phaseOfMode 把缺陷态归为修复前、修复态归为修复后', () => {
    expect(phaseOfMode('broken')).toBe('before')
    expect(phaseOfMode('repaired')).toBe('after')
  })
})

describe('keyboardFocusDemo · 结论文案', () => {
  it('结论文案明确不冒充整站合规', () => {
    expect(OBSERVATION_STATEMENT).toContain('不能代表整个网站已经符合全部无障碍规范')
    expect(OBSERVATION_STATEMENT).toContain('只验证了指定组件')
  })
})

describe('keyboardFocusDemo · 演示流程真的有反馈', () => {
  const first = DEMO_RECORDS[0]
  const second = DEMO_RECORDS[1]

  it('候选记录跟着已保存数量前进，并在最后一条停住', () => {
    expect(currentRecordIndex(0)).toBe(0)
    expect(currentRecordIndex(DEMO_RECORDS.length - 1)).toBe(DEMO_RECORDS.length - 1)
    expect(currentRecordIndex(DEMO_RECORDS.length + 5)).toBe(DEMO_RECORDS.length - 1)
    expect(currentRecord(0).id).toBe(first.id)
  })

  it('初始态没有详情、没有保存、没有反馈', () => {
    expect(initialDemoWorkflowState).toEqual({
      detailsOpen: false,
      savedIds: [],
      lastMessage: null,
    })
  })

  it('「查看详情」真的展开并带上当前记录的馆藏位置', () => {
    const opened = demoWorkflowReducer(initialDemoWorkflowState, { type: 'toggle-details' })
    expect(opened.detailsOpen).toBe(true)
    expect(opened.lastMessage).toContain(first.title)
    expect(opened.lastMessage).toContain(first.shelf)

    const closed = demoWorkflowReducer(opened, { type: 'toggle-details' })
    expect(closed.detailsOpen).toBe(false)
  })

  it('「保存选择」写入一条并把计数报出来，候选记录随之前进', () => {
    const saved = demoWorkflowReducer(initialDemoWorkflowState, { type: 'save-current' })
    expect(saved.savedIds).toEqual([first.id])
    expect(saved.lastMessage).toContain('已保存 1 / 3 条')
    expect(saved.lastMessage).toContain(first.due)
    expect(currentRecord(saved.savedIds.length).id).toBe(second.id)
  })

  it('「返回上一步」撤回最近一条，真的是后进先出', () => {
    const twoSaved = demoWorkflowReducer(
      demoWorkflowReducer(initialDemoWorkflowState, { type: 'save-current' }),
      { type: 'save-current' },
    )
    const undone = demoWorkflowReducer(twoSaved, { type: 'step-back' })
    expect(undone.savedIds).toEqual([first.id])
    expect(undone.lastMessage).toContain('已撤回最近一次保存')
    expect(undone.lastMessage).toContain(second.title)
  })

  it('三条保存完后不越界，且如实说明要先撤回', () => {
    let state = initialDemoWorkflowState
    for (let i = 0; i < DEMO_RECORDS.length; i += 1) {
      state = demoWorkflowReducer(state, { type: 'save-current' })
    }
    expect(state.savedIds).toHaveLength(DEMO_RECORDS.length)

    const extra = demoWorkflowReducer(state, { type: 'save-current' })
    expect(extra.savedIds).toHaveLength(DEMO_RECORDS.length)
    expect(extra.lastMessage).toContain('都已保存完毕')

    const back = demoWorkflowReducer(extra, { type: 'step-back' })
    expect(back.savedIds).toHaveLength(DEMO_RECORDS.length - 1)
  })

  it('列表已空时「返回上一步」承认没有可撤销的记录', () => {
    const empty = demoWorkflowReducer(initialDemoWorkflowState, { type: 'step-back' })
    expect(empty.savedIds).toEqual([])
    expect(empty.lastMessage).toContain('没有可撤销的保存记录')
  })

  it('「重置」一次清掉详情、保存和反馈', () => {
    let state = demoWorkflowReducer(initialDemoWorkflowState, { type: 'toggle-details' })
    state = demoWorkflowReducer(state, { type: 'save-current' })
    expect(state.savedIds).toHaveLength(1)

    expect(demoWorkflowReducer(state, { type: 'reset' })).toEqual(initialDemoWorkflowState)
  })

  it('演示数据固定三条，页面计数与文案都靠它', () => {
    expect(DEMO_RECORDS).toHaveLength(3)
    expect(new Set(DEMO_RECORDS.map((record) => record.id)).size).toBe(3)
  })
})
