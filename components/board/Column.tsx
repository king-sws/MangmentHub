"use client";

import { TaskCard } from "./TaskCard";

interface ColumnProps {
  title: string;
  tasks: { id: string; title: string }[];
}

export function Column({ title, tasks }: ColumnProps) {
  return (
    <div className="bg-gray-100 rounded-md p-4 w-64 min-h-[500px] flex flex-col gap-4">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="flex flex-col gap-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} id={task.id} title={task.title} />
        ))}
      </div>
    </div>
  );
}
