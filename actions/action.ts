// actions/auth.ts
"use server";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SendWelcomeEmail } from "@/nodemailer/email";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

// Sign in with credentials
export const SignInWithCredentials = async (
  email: string, 
  password: string,
  inviteToken?: string
) => {
  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { success: false, error: result.error };
    }

    // If there's an invite token, process it after successful sign-in
    if (inviteToken) {
      // Get the current user ID
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
      });

      if (user) {
        // Process the invitation
        const processResult = await processInvitationToken(inviteToken, user.id);
        if (!processResult.success) {
          return { 
            success: true, 
            inviteProcessed: false, 
            error: processResult.error,
            workspaceId: null
          };
        }
        return { 
          success: true,
          inviteProcessed: true,
          workspaceId: processResult.workspaceId 
        };
      }
    }

    return { success: true , userId: result?.user?.id};
  } catch (error) {
    console.error("Sign-in error:", error);
    return { success: false, error: "An error occurred during sign-in." };
  }
};

// Sign up with credentials
export const SignUpWithCredentials = async (
  name: string,
  email: string,
  password: string,
  inviteToken?: string
) => {
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return { success: false, error: "User already exists!" };

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    // Process invitation if provided
    let inviteProcessResult: { success: boolean; workspaceId: string | null } = { success: false, workspaceId: null };
    if (inviteToken) {
      const result = await processInvitationToken(inviteToken, user.id);
      inviteProcessResult = {
        success: result.success,
        workspaceId: result.workspaceId ?? null,
      };
    }

    // If no invitation or invitation processing failed, create default workspace
    if (!inviteToken || !inviteProcessResult.success) {
      const workspace = await prisma.workspace.create({
        data: {
          name: "My Workspace",
          userId: user.id,
        },
      });

      await prisma.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: "OWNER",
        },
      });

      inviteProcessResult.workspaceId = workspace.id;
    }

    // Send welcome email
    await SendWelcomeEmail(email, name);

    // Sign in the user
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { 
      success: true, 
      userId: user.id,
      workspaceId: inviteProcessResult.workspaceId,
      inviteProcessed: inviteToken ? inviteProcessResult.success : null
    };
  } catch (error) {
    console.error("Sign-up error:", error);
    return { success: false, error: "Failed to create account" };
  }
};

// Process invitation token
async function processInvitationToken(token: string, userId: string) {
  try {
    // Find invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return { success: false, error: "Invalid invitation" };
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.delete({ where: { id: invitation.id } });
      return { success: false, error: "Invitation expired" };
    }

    // Create workspace membership
    await prisma.workspaceMember.create({
      data: {
        userId,
        workspaceId: invitation.workspaceId,
        role: invitation.role,
      },
    });

    // Delete the invitation now that it's been used
    await prisma.invitation.delete({ where: { id: invitation.id } });

    return { 
      success: true, 
      workspaceId: invitation.workspaceId 
    };
  } catch (error) {
    console.error("Error processing invitation:", error);
    return { success: false, error: "Failed to process invitation" };
  }
}

// Sign out
export const SignOut = async () => {
  await signOut({ redirectTo: "/" });
  redirect("/");
};
