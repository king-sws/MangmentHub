/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface TaskDetailsProps {
  taskId: string;
  userId: string;
}

export function TaskDetails({ taskId, userId }: TaskDetailsProps) {
  const router = useRouter();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTask() {
      const res = await fetch(`/api/cards/${taskId}`);
      const data = await res.json();
      setTask(data);
      setLoading(false);
    }
    fetchTask();
  }, [taskId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{task.title}</h2>
        <p className="text-sm text-muted-foreground">
          Project: <Badge>{task.list.board.title}</Badge>
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Description</h3>
        <p className="text-muted-foreground">
          {task.description || "No description provided"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium">Status</h3>
          <Badge variant={task.status === "DONE" ? "success" : "default"}>
            {task.status}
          </Badge>
        </div>
        <div>
          <h3 className="text-sm font-medium">Due Date</h3>
          <p className="text-muted-foreground">
            {task.dueDate ? format(new Date(task.dueDate), "PPP") : "None"}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium">Assignee</h3>
        <p className="text-muted-foreground">
          {task.assignees.length > 0
            ? task.assignees[0].name || task.assignees[0].email
            : "Unassigned"}
        </p>
      </div>

      <div className="flex gap-4">
        <Button onClick={() => router.back()}>Back</Button>
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/${userId}/tasks/${taskId}/edit`)}
        >
          Edit Task
        </Button>
      </div>
    </div>
  );
}