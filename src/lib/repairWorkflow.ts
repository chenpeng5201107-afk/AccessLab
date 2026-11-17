import { suggestTextColor, type RepairSuggestion } from './colorRepair'

/**
 * 修复工作流的状态机（纯函数，不依赖 React）。
 * ContrastLabPage 用 useReducer 复用它，组件只负责把 phase/snapshot 映射回颜色 state。
 *
 * 不变式：
 * - 任何「用户手动改色 / 重置」都回到 idle，清掉旧建议与快照，杜绝过期结论被复用。
 * - apply 只在 suggested 且建议可用（ok 且 needsRepair）时发生，快照记录应用前/后的文字色。
 * - undo 回到 idle，组件据此把文字色恢复成快照里的原值。
 */

export type RepairPhase = 'idle' | 'suggested' | 'applied'

export interface RepairSnapshot {
  /** 应用修复前的文字颜色 */
  beforeTextColor: string
  /** 应用后的文字颜色（= 建议值） */
  afterTextColor: string
  beforeRatio: number
  afterRatio: number
}

export interface RepairState {
  phase: RepairPhase
  /** 最近一次 generate 的结论；idle 且未生成时为 null */
  suggestion: RepairSuggestion | null
  snapshot: RepairSnapshot | null
}

export type RepairEvent =
  | { type: 'color-changed' }
  | { type: 'generate'; textColor: string; backgroundColor: string }
  | { type: 'apply' }
  | { type: 'undo' }

export const initialRepairState: RepairState = { phase: 'idle', suggestion: null, snapshot: null }

export function repairReducer(state: RepairState, event: RepairEvent): RepairState {
  switch (event.type) {
    case 'color-changed':
      return initialRepairState

    case 'generate': {
      const suggestion = suggestTextColor(event.textColor, event.backgroundColor)
      const usable = suggestion.ok && suggestion.needsRepair && suggestion.suggestedTextColor !== null
      return {
        phase: usable ? 'suggested' : 'idle',
        suggestion,
        snapshot: null,
      }
    }

    case 'apply': {
      const s = state.suggestion
      if (state.phase !== 'suggested' || !s || !s.ok || !s.needsRepair || !s.suggestedTextColor) {
        return state
      }
      if (s.beforeRatio === null || s.afterRatio === null) return state
      return {
        phase: 'applied',
        suggestion: s,
        snapshot: {
          beforeTextColor: s.originalTextColor,
          afterTextColor: s.suggestedTextColor,
          beforeRatio: s.beforeRatio,
          afterRatio: s.afterRatio,
        },
      }
    }

    case 'undo':
      if (state.phase !== 'applied') return state
      return initialRepairState

    default:
      return state
  }
}
