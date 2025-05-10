"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function renameWorkspace({ id, name }: { id: string; name: string }) {
  try {
    const session = await auth();
    // Assuming your auth session has the user ID in session.user.id
    const userId = session?.user?.id;
    
    console.log("Auth session:", session); // For debugging
    
    if (!userId) {
      console.error("No user ID found in session");
      throw new Error("Authentication failed");
    }
    
    // 1) Find and verify
    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace || workspace.userId !== session.user.id) {
      throw new Error("Forbidden");
    }

    // 2) Update by id
    await prisma.workspace.update({
      where: { id },
      data: { name },
    });

    
    revalidatePath('/dashboard/[userId]', 'layout');
    revalidatePath('/workspace/[id]', 'layout');
    return { success: true };
  } catch (error) {
    console.error("Failed to rename workspace:", error);
    throw error;
  }
}

export async function deleteWorkspace({ id }: { id: string }) {
  try {
    const session = await auth();
    // Assuming your auth session has the user ID in session.user.id
    const userId = session?.user?.id;
    
    console.log("Auth session for delete:", session); // For debugging
    
    if (!userId) {
      console.error("No user ID found in session");
      throw new Error("Authentication failed");
    }
    
    // Check if the workspace exists and belongs to the user
    const workspace = await prisma.workspace.findUnique({
      where: { id },
    });
    
    if (!workspace) {
      throw new Error("Workspace not found");
    }
    
    if (workspace.userId !== userId) {
      throw new Error("You don't have permission to delete this workspace");
    }
    
    await prisma.workspace.delete({
      where: { id },
    });
    
    revalidatePath('/dashboard/[userId]', 'layout');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete workspace:", error);
    throw error;
  }
}