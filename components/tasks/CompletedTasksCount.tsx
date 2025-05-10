'use client';

import { useEffect, useState } from 'react';

interface CompletedTasksCountProps {
  userId: string;
}

export function CompletedTasksCount({ userId }: CompletedTasksCountProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCompletedTasksCount = async () => {
      try {
        const response = await fetch(`/api/tasks?userId=${userId}&completed=true`);
        if (response.ok) {
          const tasks = await response.json();
          setCount(tasks.length);
        }
      } catch (error) {
        console.error("Failed to fetch completed tasks count:", error);
      }
    };

    fetchCompletedTasksCount();
  }, [userId]);

  return (
    <div className="text-2xl font-bold">
      {count !== null ? count : '--'}
    </div>
  );
}