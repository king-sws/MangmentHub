/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/users/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { validateAdminAccess } from "@/lib/admin-auth";
import { auditLog } from "@/lib/audit-log";
import { auth } from "@/auth";

// Validation schemas
const userUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  plan: z.enum(["FREE", "PRO", "BUSINESS"]).optional(),
  adminKey: z.string().optional(),
});

// GET /api/admin/users/[userId] - Get specific user details
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const startTime = Date.now();
  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  try {
    const session = await auth();
    
    // Handle admin key in query params
    const adminKey = req.nextUrl.searchParams.get("adminKey");
    if (adminKey) {
      req.headers.set('x-admin-key', adminKey);
    }
    
    // Validate admin access
    const adminValidation = await validateAdminAccess(req, session);
    if (!adminValidation.success) {
      return NextResponse.json(
        { 
          error: adminValidation.error,
          code: 'UNAUTHORIZED_ACCESS',
          requestId: generateRequestId(),
        }, 
        { status: adminValidation.statusCode }
      );
    }

    const { userId } = params;

    // Validate userId format
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { 
          error: "Invalid user ID",
          code: 'INVALID_USER_ID',
          requestId: generateRequestId(),
        }, 
        { status: 400 }
      );
    }

    // Fetch user with detailed information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        plan: true,
        planExpires: true,
        planStarted: true,
        planUpdated: true,
        role: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        // Include related data with counts
        _count: {
          select: {
            workspaces: true,
            chatMessages: true,
            accounts: true,
            assignedCards: true,
            workspaceMemberships: true,
          },
        },
        // Include recent activity
        workspaces: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        accounts: {
          select: {
            provider: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { 
          error: "User not found",
          code: 'USER_NOT_FOUND',
          requestId: generateRequestId(),
        }, 
        { status: 404 }
      );
    }

    // Log admin action
    await auditLog.logAdminAction({
      adminId: adminValidation.user!.id,
      adminEmail: adminValidation.user!.email,
      action: 'USER_VIEW',
      targetUserId: userId,
      targetUserEmail: user.email,
      changes: {
        operation: 'VIEW_USER_DETAILS',
      },
      timestamp: new Date(),
      ip: clientIp,
      userAgent,
    });

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      user,
      metadata: {
        requestId: generateRequestId(),
        responseTime,
        queriedBy: adminValidation.user!.email,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    await auditLog.logError({
      error: 'Admin user details query failed',
      details: {
        endpoint: `/api/admin/users/${params.userId}`,
        method: 'GET',
        error: (error as Error).message,
        stack: (error as Error).stack,
        ip: clientIp,
        userAgent,
        responseTime,
      },
      timestamp: new Date(),
    });

    console.error("Admin user details error:", error);

    return NextResponse.json(
      {
        error: "Failed to retrieve user details",
        code: 'QUERY_ERROR',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
        requestId: generateRequestId(),
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[userId] - Update user details
export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const startTime = Date.now();
  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  try {
    const session = await auth();
    
    // Parse request body
    const body = await req.json();
    
    // Add admin key to headers if provided in body
    if (body.adminKey) {
      req.headers.set('x-admin-key', body.adminKey);
    }
    
    // Validate admin access
    const adminValidation = await validateAdminAccess(req, session);
    if (!adminValidation.success) {
      return NextResponse.json(
        { 
          error: adminValidation.error,
          code: 'UNAUTHORIZED_ACCESS',
          requestId: generateRequestId(),
        }, 
        { status: adminValidation.statusCode }
      );
    }

    const { userId } = params;

    // Validate userId format
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { 
          error: "Invalid user ID",
          code: 'INVALID_USER_ID',
          requestId: generateRequestId(),
        }, 
        { status: 400 }
      );
    }

    // Validate request data
    const validatedData = userUpdateSchema.parse(body);
    const { name, email, role, plan } = validatedData;

    // Check if user exists and get current state
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        planExpires: true,
        planStarted: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { 
          error: "User not found",
          code: 'USER_NOT_FOUND',
          requestId: generateRequestId(),
        }, 
        { status: 404 }
      );
    }

    // Prevent self-demotion from admin
    if (role && role !== 'ADMIN' && existingUser.id === adminValidation.user!.id) {
      return NextResponse.json(
        { 
          error: "Cannot remove admin role from yourself",
          code: 'SELF_DEMOTION_DENIED',
          requestId: generateRequestId(),
        }, 
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: { 
          email: email,
          id: { not: userId }
        },
      });

      if (emailExists) {
        return NextResponse.json(
          { 
            error: "Email already in use by another user",
            code: 'EMAIL_EXISTS',
            requestId: generateRequestId(),
          }, 
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (plan !== undefined) {
      updateData.plan = plan;
      updateData.planUpdated = new Date();
      // If changing to FREE, clear plan dates
      if (plan === 'FREE') {
        updateData.planExpires = null;
        updateData.planStarted = null;
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        planExpires: true,
        planStarted: true,
        planUpdated: true,
        updatedAt: true,
      },
    });

    // Log admin action
    await auditLog.logAdminAction({
      adminId: adminValidation.user!.id,
      adminEmail: adminValidation.user!.email,
      action: 'USER_UPDATE',
      targetUserId: userId,
      targetUserEmail: updatedUser.email,
      changes: {
        previous: {
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          plan: existingUser.plan,
        },
        current: {
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          plan: updatedUser.plan,
        },
        operation: 'UPDATE_USER',
        fieldsChanged: Object.keys(updateData),
      },
      timestamp: new Date(),
      ip: clientIp,
      userAgent,
    });

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      user: updatedUser,
      changes: Object.keys(updateData),
      metadata: {
        requestId: generateRequestId(),
        responseTime,
        updatedBy: adminValidation.user!.email,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    await auditLog.logError({
      error: 'Admin user update failed',
      details: {
        endpoint: `/api/admin/users/${params.userId}`,
        method: 'PATCH',
        error: (error as Error).message,
        stack: (error as Error).stack,
        ip: clientIp,
        userAgent,
        responseTime,
      },
      timestamp: new Date(),
    });

    console.error("Admin user update error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          code: 'VALIDATION_ERROR',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
          requestId: generateRequestId(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update user",
        code: 'UPDATE_ERROR',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
        requestId: generateRequestId(),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[userId] - Delete user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const startTime = Date.now();
  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  try {
    const session = await auth();
    
    // Handle admin key in query params
    const adminKey = req.nextUrl.searchParams.get("adminKey");
    if (adminKey) {
      req.headers.set('x-admin-key', adminKey);
    }
    
    // Validate admin access
    const adminValidation = await validateAdminAccess(req, session);
    if (!adminValidation.success) {
      return NextResponse.json(
        { 
          error: adminValidation.error,
          code: 'UNAUTHORIZED_ACCESS',
          requestId: generateRequestId(),
        }, 
        { status: adminValidation.statusCode }
      );
    }

    const { userId } = params;

    // Validate userId format
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { 
          error: "Invalid user ID",
          code: 'INVALID_USER_ID',
          requestId: generateRequestId(),
        }, 
        { status: 400 }
      );
    }

    // Prevent self-deletion
    if (userId === adminValidation.user!.id) {
      return NextResponse.json(
        { 
          error: "Cannot delete your own account",
          code: 'SELF_DELETE_DENIED',
          requestId: generateRequestId(),
        }, 
        { status: 400 }
      );
    }

    // Check if user exists and get their data for logging
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        createdAt: true,
        _count: {
          select: {
            workspaces: true,
            chatMessages: true,
            assignedCards: true,
          },
        },
      },
    });

    if (!userToDelete) {
      return NextResponse.json(
        { 
          error: "User not found",
          code: 'USER_NOT_FOUND',
          requestId: generateRequestId(),
        }, 
        { status: 404 }
      );
    }

    // Check if user has dependencies that might prevent deletion
    const hasWorkspaces = userToDelete._count.workspaces > 0;
    const hasMessages = userToDelete._count.chatMessages > 0;
    const hasCards = userToDelete._count.assignedCards > 0;

    if (hasWorkspaces || hasMessages || hasCards) {
      return NextResponse.json(
        { 
          error: "Cannot delete user with existing data",
          code: 'USER_HAS_DEPENDENCIES',
          details: {
            workspaces: userToDelete._count.workspaces,
            messages: userToDelete._count.chatMessages,
            assignedCards: userToDelete._count.assignedCards,
          },
          requestId: generateRequestId(),
        }, 
        { status: 400 }
      );
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Log admin action
    await auditLog.logAdminAction({
      adminId: adminValidation.user!.id,
      adminEmail: adminValidation.user!.email,
      action: 'USER_DELETE',
      targetUserId: userId,
      targetUserEmail: userToDelete.email,
      changes: {
        operation: 'DELETE_USER',
        deletedUser: {
          name: userToDelete.name,
          email: userToDelete.email,
          role: userToDelete.role,
          plan: userToDelete.plan,
          createdAt: userToDelete.createdAt,
        },
      },
      timestamp: new Date(),
      ip: clientIp,
      userAgent,
    });

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `User ${userToDelete.email} has been deleted`,
      deletedUser: {
        id: userToDelete.id,
        email: userToDelete.email,
        name: userToDelete.name,
      },
      metadata: {
        requestId: generateRequestId(),
        responseTime,
        deletedBy: adminValidation.user!.email,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    await auditLog.logError({
      error: 'Admin user deletion failed',
      details: {
        endpoint: `/api/admin/users/${params.userId}`,
        method: 'DELETE',
        error: (error as Error).message,
        stack: (error as Error).stack,
        ip: clientIp,
        userAgent,
        responseTime,
      },
      timestamp: new Date(),
    });

    console.error("Admin user deletion error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete user",
        code: 'DELETE_ERROR',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
        requestId: generateRequestId(),
      },
      { status: 500 }
    );
  }
}

// Helper function to generate request IDs
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}