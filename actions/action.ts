// actions/action.ts
"use server";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SendPasswordResetEmail, SendWelcomeEmail } from "@/nodemailer/email";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import crypto from "crypto";


// Sign in with credentials
// Update SignInWithCredentials function in actions/action.ts
export const SignInWithCredentials = async (
  email: string, 
  password: string,
  inviteToken?: string
) => {
  try {
    // Add console.log to track what's happening
    console.log("Attempting to sign in with:", { email, hasInviteToken: !!inviteToken });
    
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    
    console.log("Sign in result:", result);

    if (!result || result.error) {
      return { 
        success: false, 
        error: result?.error || "Authentication failed" 
      };
    }

    // If there's an invite token, process it after successful sign-in
    if (inviteToken) {
      try {
        // Get the current user ID - we need to fetch the user since result.user might not be available
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
      } catch (inviteError) {
        console.error("Error processing invite:", inviteError);
        // Still return success for the sign-in but note invite processing failed
        return { 
          success: true, 
          inviteProcessed: false,
          error: "Failed to process invitation"
        };
      }
    }

    // Successfully signed in
    return { 
      success: true,
      // Get userId from session if available
      userId: result?.user?.id || null
    };
  } catch (error) {
    console.error("Sign-in error:", error);
    return { success: false, error: "An error occurred during sign-in." };
  }
}

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


// Request password reset
export const RequestPasswordReset = async (email: string) => {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return { 
        success: true, 
        message: "If an account with that email exists, you will receive a password reset link." 
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email }
    });

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        email,
        expiresAt,
      }
    });

    // Send reset email
    await SendPasswordResetEmail(email, user.name || "User", resetToken);

    return { 
      success: true, 
      message: "If an account with that email exists, you will receive a password reset link." 
    };
  } catch (error) {
    console.error("Password reset request error:", error);
    return { 
      success: false, 
      error: "Failed to process password reset request" 
    };
  }
};

// Verify reset token
export const VerifyResetToken = async (token: string) => {
  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: {
        id: true,
        email: true,
        expiresAt: true,
        used: true
      }
    });

    if (!resetToken) {
      return { success: false, error: "Invalid reset token" };
    }

    if (resetToken.used) {
      return { success: false, error: "Reset token has already been used" };
    }

    if (new Date() > resetToken.expiresAt) {
      // Clean up expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id }
      });
      return { success: false, error: "Reset token has expired" };
    }

    return { 
      success: true, 
      email: resetToken.email 
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return { success: false, error: "Failed to verify reset token" };
  }
};

// Reset password
export const ResetPassword = async (token: string, newPassword: string) => {
  try {
    // Verify token first
    const tokenVerification = await VerifyResetToken(token);
    if (!tokenVerification.success) {
      return tokenVerification;
    }

    const email = tokenVerification.email!;

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { token },
      data: { used: true }
    });

    return { 
      success: true, 
      message: "Password has been reset successfully" 
    };
  } catch (error) {
    console.error("Password reset error:", error);
    return { 
      success: false, 
      error: "Failed to reset password" 
    };
  }
};