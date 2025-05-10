/* eslint-disable @typescript-eslint/no-unused-vars */
// actions/invitation.ts
"use server";

import { prisma } from "@/lib/prisma";

export const verifyInvitation = async (token: string) => {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { workspace: true },
    });

    if (!invitation) return { success: false, error: "Invalid invitation" };
    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.delete({ where: { id: invitation.id } });
      return { success: false, error: "Invitation expired" };
    }

    return { 
      success: true,
      email: invitation.email,
      workspaceId: invitation.workspaceId,
      role: invitation.role,
    };
  } catch (error) {
    return { success: false, error: "Verification failed" };
  }
};