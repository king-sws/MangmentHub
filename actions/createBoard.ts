"use server";
// actions/createBoard.ts
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface CreateBoardProps {
  title: string;
  workspaceId: string;
}

export const createBoard = async ({ 
  title, 
  workspaceId 
}: CreateBoardProps) => {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify user has access to this workspace
  const workspace = await prisma.workspace.findUnique({
    where: {
      id: workspaceId,
      userId: session.user.id,
    },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  // Create the new board
  const board = await prisma.board.create({
    data: {
      title,
      workspaceId,
    },
  });  
  return board;
}