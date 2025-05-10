// contexts/WorkspaceContext.tsx
'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { useParams, usePathname } from 'next/navigation'

interface WorkspaceContextType {
  workspaceId: string | null
  userRole: 'OWNER' | 'ADMIN' | 'MEMBER' | null
  isLoading: boolean
  canManageMembers: boolean
  canManageSettings: boolean
  canCreateBoards: boolean
  refreshWorkspaceData: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspaceId: null,
  userRole: null,
  isLoading: true,
  canManageMembers: false,
  canManageSettings: false,
  canCreateBoards: false,
  refreshWorkspaceData: async () => {}
})

export const useWorkspace = () => useContext(WorkspaceContext)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const params = useParams()
  const pathname = usePathname()
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'OWNER' | 'ADMIN' | 'MEMBER' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const canManageMembers = userRole === 'OWNER' || userRole === 'ADMIN'
  const canManageSettings = userRole === 'OWNER'
  const canCreateBoards = userRole === 'OWNER' || userRole === 'ADMIN'
  
  useEffect(() => {
    const wsId = params?.workspaceId as string || null
    setWorkspaceId(wsId)
    if (!wsId) {
      setUserRole(null)
      setIsLoading(false)
    }
  }, [params, pathname])
  
  const fetchWorkspaceData = async () => {
    if (!workspaceId) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/role`)
      if (!response.ok) throw new Error('Failed to fetch workspace role')
      
      const data = await response.json()
      setUserRole(data.role)
    } catch (error) {
      console.error('Error fetching workspace role:', error)
      setUserRole(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (workspaceId) fetchWorkspaceData()
  }, [workspaceId])

  return (
    <WorkspaceContext.Provider value={{
      workspaceId,
      userRole,
      isLoading,
      canManageMembers,
      canManageSettings,
      canCreateBoards,
      refreshWorkspaceData: fetchWorkspaceData
    }}>
      {children}
    </WorkspaceContext.Provider>
  )
}