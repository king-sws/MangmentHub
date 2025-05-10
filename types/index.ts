// types/index.ts
export type WorkspaceMember = {
    id: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
    workspaceId: string;
    createdAt: Date;
    updatedAt: Date;
  };
  
  export type CardWithDetails = {
    id: string;
    title: string;
    description: string | null;
    status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
    dueDate: Date | null;
    list: {
      id: string;
      title: string;
      board: {
        id: string;
        title: string;
      };
    };
    assignees: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    }[];
  };

  export type Task = {
    id: string;
    title: string;
    description?: string | null;
    listId: string;
    order: number;
    dueDate?: Date | null;
    completed: boolean;
    createdAt: Date;
    updatedAt?: Date | null;
    status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
    assignees: User[];
  };
  
  export type User = {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  };
  
  export type List = {
    id: string;
    title: string;
    boardId: string;
    order: number;
    cards: Task[];
  };
  
  export type Board = {
    id: string;
    title: string;
    workspaceId: string;
    order: number;
    lists: List[];
  };
  
  export type Workspace = {
    id: string;
    name: string;
    userId: string;
    boards: Board[];
  };
  