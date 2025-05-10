'use client';

import { useEffect, useState } from 'react';

// Helper function to get the date 7 days from now
const getNextWeekDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
};

interface UpcomingTasksCountProps {
  userId: string;
}

export function UpcomingTasksCount({ userId }: UpcomingTasksCountProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchUpcomingTasksCount = async () => {
      try {
        // Get tasks due within the next 7 days
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = getNextWeekDate();
        
        const response = await fetch(`/api/tasks?userId=${userId}&dueDate=${nextWeek}&completed=false`);
        if (response.ok) {
          const tasks = await response.json();
          // Filter tasks that have a due date after today
          const upcomingTasks = tasks.filter((task: { dueDate: string | number | Date; }) => 
            task.dueDate && new Date(task.dueDate) >= new Date(today)
          );
          setCount(upcomingTasks.length);
        }
      } catch (error) {
        console.error("Failed to fetch upcoming tasks count:", error);
      }
    };

    fetchUpcomingTasksCount();
  }, [userId]);

  return (
    <div className="text-2xl font-bold">
      {count !== null ? count : '--'}
    </div>
  );
}