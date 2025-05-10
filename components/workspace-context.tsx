// components/workspace-context.tsx
'use client'

import { createContext, useContext } from 'react'
import type { PlanType } from '@/lib/plans'

type WorkspaceContextType = {
  plan: PlanType
  workspaceLimit: number
  boardLimit: number
  memberLimit: number
  currentBoards: number
  currentMembers: number
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null)

export function WorkspaceProvider({ 
  children,
  value
}: {
  children: React.ReactNode
  value: WorkspaceContextType
}) {
  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}