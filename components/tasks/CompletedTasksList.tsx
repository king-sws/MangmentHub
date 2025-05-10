'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, LayoutDashboard } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  completed: boolean;
  list: {
    board: {
      id: string;
      title: string;
    };
  };
}

interface CompletedTasksListProps {
  userId: string;
  limit?: number;
}

export function CompletedTasksList({ userId, limit = 5 }: CompletedTasksListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompletedTasks = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/tasks?userId=${userId}&completed=true`);
        if (!response.ok) {
          throw new Error('Failed to fetch completed tasks');
        }
        
        const allTasks = await response.json();
        
        // Sort by most recently completed (assuming completion date is the updated date)
        const sortedTasks = allTasks
          .filter((task: Task) => task.completed)
          .sort((a: Task, b: Task) => {
            // For now, we'll sort by due date as a proxy
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
          })
          .slice(0, limit);
          
        setTasks(sortedTasks);
      } catch (error) {
        console.error('Error fetching completed tasks:', error);
        setError('Failed to load completed tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedTasks();
  }, [userId, limit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="text-center text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center text-muted-foreground">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No completed tasks yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {tasks.map((task) => (
        <Link 
          key={task.id}
          href={`/dashboard/${userId}/tasks/${task.id}`}
          className="flex items-start p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex-1">
            <div className="font-medium line-clamp-1 text-muted-foreground line-through">
              {task.title}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <LayoutDashboard className="h-3 w-3" />
                <span>{task.list.board.title}</span>
                </div>
                {task.dueDate && (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(new Date(task.dueDate))}
                  </span>
                )}
            </div>
            </div>
            <div className="flex flex-col items-end gap-1 min-w-[90px]">
              <span className={`text-xs ${task.status === 'COMPLETED' ? 'text-green-500' : 'text-muted-foreground'}`}>
                {task.status}
              </span>
            </div>
            </Link>
            ))}
            </div>
    );
    }