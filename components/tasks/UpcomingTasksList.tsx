'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { CalendarDays, LayoutDashboard } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';

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

interface UpcomingTasksListProps {
  userId: string;
  limit?: number;
}

// Helper function to get the date 7 days from now
const getNextWeekDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
};

export function UpcomingTasksList({ userId, limit = 5 }: UpcomingTasksListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpcomingTasks = async () => {
      try {
        setLoading(true);
        
        // Get tasks due within the next 7 days
        const nextWeek = getNextWeekDate();
        
        const response = await fetch(`/api/tasks?userId=${userId}&dueDate=${nextWeek}&completed=false`);
        if (!response.ok) {
          throw new Error('Failed to fetch upcoming tasks');
        }
        
        const allTasks = await response.json();
        
        // Sort by due date (closest first)
        const sortedTasks = allTasks
          .filter((task: Task) => task.dueDate && !task.completed)
          .sort((a: Task, b: Task) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          })
          .slice(0, limit);
          
        setTasks(sortedTasks);
      } catch (error) {
        console.error('Error fetching upcoming tasks:', error);
        setError('Failed to load upcoming tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingTasks();
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
          <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No upcoming tasks due this week</p>
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
            <div className="font-medium line-clamp-1">{task.title}</div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <LayoutDashboard className="h-3 w-3" />
                <span className="line-clamp-1">{task.list.board.title}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 min-w-[90px]">
            <StatusBadge status={task.status} />
            {task.dueDate && (
              <span className={`text-xs ${
                new Date(task.dueDate) < new Date() ? "text-red-500 font-medium" : "text-muted-foreground"
              }`}>
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}