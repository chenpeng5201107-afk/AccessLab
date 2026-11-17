import { describe, expect, it } from 'vitest'

import {
  initialRepairState,
  repairReducer,
  type RepairState,
} from './repairWorkflow'

const START: RepairState = initialRepairState

describe('repairReducer · 修复工作流', () => {
  it('#7 generate→apply 后快照的「修复后颜色」等于建议色，原色被保留', () => {
    const suggested = repairReducer(START, {
      type: 'generate',
      textColor: '#777777',
      backgroundColor: '#ffffff',
    })
    expect(suggested.phase).toBe('suggested')
    const s = suggested.suggestion!
    expect(s.suggestedTextColor).toBe('#767676')

    const applied = repairReducer(suggested, { type: 'apply' })
    expect(applied.phase).toBe('applied')
    expect(applied.snapshot).not.toBeNull()
    // 组件把 textColor 设为建议色后，输入框/取色器/预览同源一致
    expect(applied.snapshot!.afterTextColor).toBe(s.suggestedTextColor)
    // 撤销所需的应用前快照
    expect(applied.snapshot!.beforeTextColor).toBe('#777777')
    expect(applied.snapshot!.afterRatio).toBeGreaterThanOrEqual(4.5)
  })

  it('#8 undo 恢复到应用前状态', () => {
    const applied = repairReducer(
      repairReducer(START, {
        type: 'generate',
        textColor: '#777777',
        backgroundColor: '#ffffff',
      }),
      { type: 'apply' },
    )
    const undone = repairReducer(applied, { type: 'undo' })
    expect(undone.phase).toBe('idle')
    expect(undone.snapshot).toBeNull()
    expect(undone.suggestion).toBeNull()
    // 组件据此把 textColor 写回 beforeTextColor（#777777）
    expect(applied.snapshot!.beforeTextColor).toBe('#777777')
  })

  it('#9 手动改色让旧建议失效，不能被继续误用', () => {
    const suggested = repairReducer(START, {
      type: 'generate',
      textColor: '#777777',
      backgroundColor: '#ffffff',
    })
    const afterChange = repairReducer(suggested, { type: 'color-changed' })
    expect(afterChange.phase).toBe('idle')
    expect(afterChange.suggestion).toBeNull()
    // 失效后再 apply 是空操作，拿不到过期快照
    const triedApply = repairReducer(afterChange, { type: 'apply' })
    expect(triedApply.phase).toBe('idle')
    expect(triedApply.snapshot).toBeNull()
  })

  it('已应用后手动改色同样清空', () => {
    const applied = repairReducer(
      repairReducer(START, {
        type: 'generate',
        textColor: '#777777',
        backgroundColor: '#ffffff',
      }),
      { type: 'apply' },
    )
    expect(repairReducer(applied, { type: 'color-changed' })).toEqual(initialRepairState)
  })

  it('#10 重置等同改色：清空建议与快照', () => {
    const suggested = repairReducer(START, {
      type: 'generate',
      textColor: '#777777',
      backgroundColor: '#ffffff',
    })
    expect(repairReducer(suggested, { type: 'color-changed' })).toEqual(initialRepairState)
  })

  it('已达 AA 时 generate 不进入 suggested，apply 无效', () => {
    const passed = repairReducer(START, {
      type: 'generate',
      textColor: '#000000',
      backgroundColor: '#ffffff',
    })
    expect(passed.phase).toBe('idle')
    expect(passed.suggestion!.needsRepair).toBe(false)
    expect(repairReducer(passed, { type: 'apply' }).phase).toBe('idle')
  })

  it('非法颜色 generate 不进入 suggested', () => {
    const invalid = repairReducer(START, {
      type: 'generate',
      textColor: 'zzz',
      backgroundColor: '#ffffff',
    })
    expect(invalid.phase).toBe('idle')
    expect(invalid.suggestion!.ok).toBe(false)
    expect(repairReducer(invalid, { type: 'apply' }).phase).toBe('idle')
  })

  it('idle 下 apply / undo 都是空操作', () => {
    expect(repairReducer(START, { type: 'apply' })).toBe(START)
    expect(repairReducer(START, { type: 'undo' })).toBe(START)
  })
})
