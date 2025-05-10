"use client";

import { DndContext } from "@dnd-kit/core";
import { Column } from "./Column";

export default function BoardPage() {
  const columns = [
    {
      id: "todo",
      title: "To Do",
      tasks: [
        { id: "task-1", title: "Learn DnD-Kit" },
        { id: "task-2", title: "Setup Board" },
      ],
    },
    {
      id: "in-progress",
      title: "In Progress",
      tasks: [
        { id: "task-3", title: "Build Column Component" },
      ],
    },
    {
      id: "done",
      title: "Done",
      tasks: [
        { id: "task-4", title: "Install Packages" },
      ],
    },
  ];

  return (
    <DndContext>
      <div className="flex gap-6 p-10">
        {columns.map((column) => (
          <Column key={column.id} title={column.title} tasks={column.tasks} />
        ))}
      </div>
    </DndContext>
  );
}
