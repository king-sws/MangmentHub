// hooks/useWorkspacePermissions.ts
import { prisma } from "@/lib/prisma";


interface UseWorkspacePermissionsParams {
  workspaceId: string;
  userId: string;
}

export async function checkWorkspacePermissions({ 
  workspaceId, 
  userId 
}: UseWorkspacePermissionsParams) {
  // First check if user is owner
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });
  
  if (!workspace) {
    return { hasAccess: false, isOwner: false, role: null };
  }
  
  // Check if user is owner
  if (workspace.userId === userId) {
    return { hasAccess: true, isOwner: true, role: 'OWNER' as const };
  }
  
  // Check membership
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId,
      workspaceId,
    },
  });
  
  return { 
    hasAccess: !!membership, 
    isOwner: false, 
    role: membership?.role || null
  };
}