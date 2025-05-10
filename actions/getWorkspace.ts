// actions/workspace.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getWorkspaces() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  // workspaces you own
  const owned = await prisma.workspace.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { boards: true, members: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  
  // workspaces you're a member of
  const memberLinks = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: {
      workspace: {
        include: {
          _count: { select: { boards: true, members: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  
  // Create a Set of workspace IDs we've already included
  const workspaceIds = new Set(owned.map(workspace => workspace.id));
  
  // Only include member workspaces that aren't already in the owned list
  const memberWorkspaces = memberLinks
    .map(m => m.workspace)
    .filter(workspace => !workspaceIds.has(workspace.id));
  
  return [...owned, ...memberWorkspaces];
}
