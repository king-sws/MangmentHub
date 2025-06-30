/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/subscription/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { validateAdminAccess } from "@/lib/admin-auth";
import { auditLog } from "@/lib/audit-log";
import { syncSubscriptionState, forceUpdatePlan, type PlanType } from "@/lib/subscription-sync";
import { auth } from "@/auth";

// Enhanced validation schema
const subscriptionUpdateSchema = z.object({
  userId: z.string().cuid("Invalid user ID format"),
  plan: z.enum(["FREE", "PRO", "BUSINESS"]),
  action: z.enum(["update", "sync", "cancel", "reactivate"]),
  reason: z.string().optional(),
  effectiveDate: z.string().datetime().optional(),
  prorationBehavior: z.enum(["create_prorations", "none", "always_invoice"]).default("create_prorations"),
  sendNotification: z.boolean().default(true),
  adminKey: z.string().optional(), // Handle admin key in body
});

const subscriptionQuerySchema = z.object({
  userId: z.string().cuid("Invalid user ID format"),
  includeHistory: z.boolean().default(false),
  adminKey: z.string().optional(), // Handle admin key in query
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  try {
    // Get session for audit logging
    const session = await auth();
    
    // Parse request body first to get adminKey if provided
    const body = await req.json();
    
    // Add admin key to headers if provided in body for validation
    if (body.adminKey) {
      req.headers.set('x-admin-key', body.adminKey);
    }
    
    // Validate admin access
    const adminValidation = await validateAdminAccess(req, session);
    if (!adminValidation.success) {
      await auditLog.logSecurityEvent({
        event: 'UNAUTHORIZED_ADMIN_ACCESS',
        severity: 'HIGH',
        ip: clientIp,
        userAgent,
        details: {
          endpoint: '/api/admin/subscription',
          method: 'POST',
          error: adminValidation.error,
        },
        timestamp: new Date(),
      });
      
      return NextResponse.json(
        { 
          error: adminValidation.error,
          code: 'UNAUTHORIZED_ACCESS',
          requestId: generateRequestId(),
        }, 
        { status: adminValidation.statusCode }
      );
    }

    // Validate request data
    const validatedData = subscriptionUpdateSchema.parse(body);
    const { userId, plan, action, reason, effectiveDate, prorationBehavior, sendNotification } = validatedData;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        planExpires: true,
        planStarted: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
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

    // Store previous state for audit log
    const previousState = {
      plan: user.plan,
      planExpires: user.planExpires,
      planStarted: user.planStarted,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
    };

    let result;
    let operationDetails;

    // Perform requested action
    switch (action) {
      case "update":
        result = await forceUpdatePlan(userId, plan as PlanType, {
          effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
          prorationBehavior,
          sendNotification,
        });
        operationDetails = {
          type: 'PLAN_UPDATE',
          fromPlan: user.plan,
          toPlan: plan,
          prorationBehavior,
          effectiveDate,
        };
        break;

      case "sync":
        result = await syncSubscriptionState(userId);
        operationDetails = {
          type: 'SUBSCRIPTION_SYNC',
          currentPlan: user.plan,
        };
        break;

      case "cancel":
        result = await cancelSubscription(userId, {
          reason,
          effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
        });
        operationDetails = {
          type: 'SUBSCRIPTION_CANCEL',
          currentPlan: user.plan,
          reason,
          effectiveDate,
        };
        break;

      case "reactivate":
        result = await reactivateSubscription(userId, plan);
        operationDetails = {
          type: 'SUBSCRIPTION_REACTIVATE',
          newPlan: plan,
        };
        break;

      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    // Get updated user state
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        planExpires: true,
        planStarted: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    // Log admin action
    await auditLog.logAdminAction({
      adminId: adminValidation.user!.id,
      adminEmail: adminValidation.user!.email,
      action: `SUBSCRIPTION_${action.toUpperCase()}`,
      targetUserId: userId,
      targetUserEmail: user.email,
      changes: {
        previous: previousState,
        current: updatedUser,
        operation: operationDetails,
        reason,
      },
      timestamp: new Date(),
      ip: clientIp,
      userAgent,
    });

    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      result: {
        ...result,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          ...updatedUser,
        },
        operation: operationDetails,
        performedBy: adminValidation.user!.email,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        requestId: generateRequestId(),
        responseTime,
        version: '2.0',
      },
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    await auditLog.logError({
      error: 'Admin subscription operation failed',
      details: {
        endpoint: '/api/admin/subscription',
        method: 'POST',
        error: (error as Error).message,
        stack: (error as Error).stack,
        ip: clientIp,
        userAgent,
        responseTime,
      },
      timestamp: new Date(),
    });

    console.error("Admin subscription error:", error);

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
        error: "Internal server error",
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
        requestId: generateRequestId(),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
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

    const userId = req.nextUrl.searchParams.get("userId");
    const includeHistory = req.nextUrl.searchParams.get("includeHistory") === "true";
    
    if (!userId) {
      return NextResponse.json(
        { 
          error: "userId parameter is required",
          code: 'MISSING_PARAMETER',
          requestId: generateRequestId(),
        }, 
        { status: 400 }
      );
    }

    const { userId: validatedUserId, includeHistory: validatedIncludeHistory } = 
      subscriptionQuerySchema.parse({ userId, includeHistory, adminKey });

    const user = await prisma.user.findUnique({
      where: { id: validatedUserId },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        planExpires: true,
        planStarted: true,
        planUpdated: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        createdAt: true,
        lastLogin: true,
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

    let subscriptionHistory = null;
    if (validatedIncludeHistory) {
      subscriptionHistory = await auditLog.getSubscriptionHistory(validatedUserId);
    }

    await auditLog.logAdminAction({
      adminId: adminValidation.user!.id,
      adminEmail: adminValidation.user!.email,
      action: 'SUBSCRIPTION_VIEW',
      targetUserId: validatedUserId,
      targetUserEmail: user.email,
      changes: {
        operation: 'VIEW_USER_SUBSCRIPTION',
        includeHistory: validatedIncludeHistory,
      },
      timestamp: new Date(),
      ip: clientIp,
      userAgent,
    });

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        planStatus: getPlanStatus(user),
        subscriptionHealth: await getSubscriptionHealth(user),
      },
      subscriptionHistory,
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
      error: 'Admin subscription query failed',
      details: {
        endpoint: '/api/admin/subscription',
        method: 'GET',
        error: (error as Error).message,
        ip: clientIp,
        userAgent,
        responseTime,
      },
      timestamp: new Date(),
    });

    console.error("Admin subscription query error:", error);

    return NextResponse.json(
      {
        error: "Failed to retrieve subscription data",
        code: 'QUERY_ERROR',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
        requestId: generateRequestId(),
      },
      { status: 500 }
    );
  }
}

// Helper functions
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getPlanStatus(user: any) {
  const now = new Date();
  const expired = user.planExpires && new Date(user.planExpires) < now;
  
  return {
    active: !expired && user.plan !== 'FREE',
    expired,
    daysUntilExpiry: user.planExpires 
      ? Math.ceil((new Date(user.planExpires).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null,
    autoRenewing: !!user.stripeSubscriptionId,
  };
}

async function getSubscriptionHealth(user: any) {
  return {
    status: user.stripeSubscriptionId ? 'healthy' : 'no_subscription',
    lastSyncDate: user.planUpdated,
    requiresAttention: false,
  };
}

// Placeholder functions - implement based on your needs
async function cancelSubscription(userId: string, options: any) {
  // Update user to FREE plan and cancel Stripe subscription
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: 'FREE',
      planExpires: null,
      planUpdated: new Date(),
    },
  });
  
  return { message: 'Subscription cancelled successfully' };
}

async function reactivateSubscription(userId: string, plan: string) {
  // Reactivate by forcing plan update
  return await forceUpdatePlan(userId, plan as PlanType);
}