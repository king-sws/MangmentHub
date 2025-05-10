// components/tasks/TaskContent.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { TaskType } from './Types'
import { TaskModal } from './TaskModal'

export function TaskContent() {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<TaskType[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('/api/tasks')
        const data = await response.json()
        setTasks(data)
      } catch (error) {
        console.error('Error fetching tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) fetchTasks()
  }, [session])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'bg-green-500'
      case 'IN_PROGRESS': return 'bg-yellow-500'
      case 'TODO': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task Name</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Assignees</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>{task.list.board.title}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(task.status)}>
                  {task.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                {task.dueDate?.toLocaleDateString() || '-'}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  {task.assignees.map((assignee) => (
                    <div key={assignee.id} className="flex items-center">
                      {assignee.image && (
                        <img
                          src={assignee.image}
                          alt={assignee.name || ''}
                          className="h-6 w-6 rounded-full mr-2"
                        />
                      )}
                      <span>{assignee.name || assignee.email?.split('@')[0]}</span>
                    </div>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TaskModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}