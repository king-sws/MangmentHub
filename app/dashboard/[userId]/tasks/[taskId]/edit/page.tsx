"use client";

import { useParams } from "next/navigation";
import { TaskEditForm } from "@/components/tasks/TaskEditForm";

export default function TaskEditPage() {
  const params = useParams();
  const taskId = params?.taskId as string;
  const userId = params?.userId as string;
  
  return (
    <div className="container py-6">
      <TaskEditForm taskId={taskId} userId={userId} />
    </div>
  );
}