"use client";

import { useDraggable } from "@dnd-kit/core";

interface TaskCardProps {
  id: string;
  title: string;
}

export function TaskCard({ id, title }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-4 rounded-md shadow-md bg-white border text-sm ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {title}
    </div>
  );
}
