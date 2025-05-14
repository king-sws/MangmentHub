"use client";

import { useParams } from "next/navigation";
import { TaskDetails } from "@/components/tasks/TaskDetails";

export default function TaskDetailsPage() {
  const params = useParams();
  const taskId = params.taskId as string;
  const userId = params.userId as string;
  
  return (
    <div className="container py-6">
      <TaskDetails taskId={taskId} userId={userId} />
    </div>
  );
}