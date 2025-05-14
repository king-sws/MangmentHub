"use client";

import { useState } from "react";
import { NewTaskDialog } from "./NewTaskDialog";

export function TasksHeader() {
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <p className="text-sm text-muted-foreground">View all of your tasks here</p>
        </div>
      </div>
      <div className="border-b" />
      <NewTaskDialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen} />
    </div>
  );
}