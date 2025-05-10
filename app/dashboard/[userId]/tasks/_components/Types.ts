// types.ts
import { Board, Card, List, User } from "@prisma/client";

export type CardWithDetails = {
    id: string
    title: string
    description: string | null
    status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE"
    dueDate: Date | null
    list: {
      id: string
      title: string
      board: {
        id: string
        title: string
      }
    }
    assignees: {
      id: string
      name: string | null
      email: string | null
      image: string | null
    }[]
  }

  // types/task.ts
export type TaskType = {
    id: string
    title: string
    description: string | null
    status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE"
    dueDate: Date | null
    list: {
      id: string
      title: string
      board: {
        id: string
        title: string
      }
    }
    assignees: {
      id: string
      name: string | null
      email: string | null
      image: string | null
    }[]
  }

  // types.ts
export type WorkspaceMember = {
  id: string;
  userId: string;
  workspaceId: string;
  role: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
};


export interface TaskWithDetails extends Card {
  assignees: User[];
  list: List & {
    board: Board;
  };
  completed: boolean;
}

export interface TasksApiResponse {
  tasks: TaskWithDetails[];
}