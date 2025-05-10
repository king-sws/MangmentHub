'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronDown, Plus } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface Workspace {
  id: string
  name: string
  role?: string
}

export function WorkspaceSwitcher() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  
  // Extract current path context and workspaceId
  const getPathInfo = (path: string) => {
    // Determine if we're in the workspace context or dashboard context
    let context = 'dashboard' // Default context
    let workspaceId = ''
    
    const parts = path.split('/')
    
    if (path.startsWith('/workspace/') && parts.length > 2) {
      context = 'workspace'
      workspaceId = parts[2]
    } else if (path.startsWith('/board/') && parts.length > 2) {
      // For board paths, we're still in a workspace context
      // But we'll need to find which workspace this board belongs to
      context = 'board'
      // workspaceId will be determined later from the board data
    } else if (path.startsWith('/dashboard/') && parts.length > 2) {
      context = 'dashboard'
      workspaceId = parts[2]
    }
    
    return { context, workspaceId }
  }
  
  const { context, workspaceId: currentWorkspaceId } = getPathInfo(pathname)
  
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/workspaces/user')
        if (!response.ok) throw new Error('Failed to fetch workspaces')
        
        const data = await response.json()
        if (Array.isArray(data.workspaces)) {
          setWorkspaces(data.workspaces)
          
          // Find current workspace using the extracted ID
          if (currentWorkspaceId) {
            const current = data.workspaces.find((w: Workspace) => w.id === currentWorkspaceId)
            if (current) {
              setCurrentWorkspace(current)
            } else if (data.workspaces.length > 0) {
              // If the current ID is not found, use the first workspace
              setCurrentWorkspace(data.workspaces[0])
            }
          } else if (data.workspaces.length > 0) {
            // If no ID in URL, default to first workspace
            setCurrentWorkspace(data.workspaces[0])
          }
        } else {
          console.error('Invalid workspaces data format:', data)
          setWorkspaces([])
        }
      } catch (error) {
        console.error('Error fetching workspaces:', error)
        setWorkspaces([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchWorkspaces()
  }, [currentWorkspaceId, pathname])
  
  // Handle workspace change based on current context
  const handleWorkspaceChange = (workspace: Workspace) => {
    if (context === 'workspace' || context === 'board') {
      router.push(`/workspace/${workspace.id}`)
    } else {
      // Default to dashboard context
      router.push(`/dashboard`)
    }
  }
  
  const handleCreateWorkspace = () => {
    router.push('/workspace/new')
  }
  
  if (loading) {
    return <Skeleton className="h-9 w-[180px]" />
  }
  
  if (!currentWorkspace && workspaces.length === 0) {
    return (
      <Button
        onClick={handleCreateWorkspace}
        className="flex items-center gap-2 text-sm"
        variant="outline"
      >
        <Plus className="h-4 w-4" />
        Create Workspace
      </Button>
    )
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 px-3 py-2">
          <span className="font-medium truncate max-w-[150px]">
            {currentWorkspace?.name || "Select Workspace"}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px]">
        <DropdownMenuLabel>Your Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.length > 0 ? (
          workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              className={`cursor-pointer ${workspace.id === currentWorkspace?.id ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
              onClick={() => handleWorkspaceChange(workspace)}
            >
              <div className="flex items-center justify-between w-full">
                <span>{workspace.name}</span>
                {workspace.role && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({workspace.role})
                  </span>
                )}
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>No workspaces found</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCreateWorkspace} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Create New Workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}