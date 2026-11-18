import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'

import { emptyLedger, ledgerReducer, type LedgerEvent, type LedgerState } from '../lib/experimentLedger'

interface LedgerContextValue {
  ledger: LedgerState
  dispatch: (event: LedgerEvent) => void
}

const LedgerContext = createContext<LedgerContextValue | null>(null)

/**
 * 实验台账的唯一持有者：放在 App 层，所以路由切换不会丢掉本次会话已经登记的成果。
 * 只存在于内存——刷新页面即清空，不写 localStorage、不写数据库、不发请求。
 */
export function ExperimentLedgerProvider({ children }: { children: ReactNode }) {
  const [ledger, dispatch] = useReducer(ledgerReducer, emptyLedger)
  const value = useMemo(() => ({ ledger, dispatch }), [ledger])

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>
}

export function useExperimentLedger(): LedgerContextValue {
  const value = useContext(LedgerContext)
  if (!value) {
    throw new Error('useExperimentLedger 必须在 ExperimentLedgerProvider 内使用')
  }
  return value
}
