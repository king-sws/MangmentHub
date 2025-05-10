"use server";

import { prisma } from "@/lib/prisma";

interface CreateWorkspaceInput {
  name: string;
  userId: string; // 🧠 you must pass userId
}

export async function createWorkspace({ name, userId }: CreateWorkspaceInput) {
  if (!userId) throw new Error("Unauthorized");

  const workspace = await prisma.workspace.create({
    data: {
      name,
      userId,
    },
  });

  return workspace;
}
