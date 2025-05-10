import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { PlanType, getEffectivePlan, getBoardLimit, getMemberLimit } from '@/lib/plans';

// Middleware function to check subscription limits for board creation
export async function checkBoardLimit(req: NextRequest, workspaceId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return {
      allowed: false,
      message: 'Unauthorized',
      statusCode: 401
    };
  }
  
  try {
    // Find workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        user: {
          select: {
            plan: true,
            planExpires: true,
          }
        }
      }
    });
    
    if (!workspace) {
      return {
        allowed: false,
        message: 'Workspace not found',
        statusCode: 404
      };
    }
    
    // Get effective plan of the workspace owner
    const effectivePlan = getEffectivePlan(
      workspace.user.plan as PlanType, 
      workspace.user.planExpires
    );
    
    // Get board limit based on the plan
    const boardLimit = getBoardLimit(effectivePlan);
    
    // Count existing boards in this workspace
    const boardCount = await prisma.board.count({
      where: { workspaceId }
    });
    
    if (boardCount >= boardLimit) {
      return {
        allowed: false,
        message: `Board limit reached for the ${effectivePlan} plan (${boardCount}/${boardLimit}). Please upgrade to create more boards.`,
        statusCode: 403,
        limit: boardLimit,
        current: boardCount,
        plan: effectivePlan
      };
    }
    
    return {
      allowed: true
    };
    
  } catch (error) {
    console.error('Error checking board limit:', error);
    return {
      allowed: false,
      message: 'Failed to check board limit',
      statusCode: 500
    };
  }
}

// Helper function to check if user can add more members to a workspace
export async function checkMemberLimit(req: NextRequest, workspaceId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return {
      allowed: false,
      message: 'Unauthorized',
      statusCode: 401
    };
  }
  
  try {
    // Find workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        user: {
          select: {
            plan: true,
            planExpires: true,
          }
        }
      }
    });
    
    if (!workspace) {
      return {
        allowed: false,
        message: 'Workspace not found',
        statusCode: 404
      };
    }
    
    // Check if user has permission to manage workspace members
    const memberPermission = await prisma.workspaceMember.findFirst({
      where: { 
        workspaceId,
        userId: session.user.id,
        role: { in: ["OWNER", "ADMIN"] } // Only owners and admins can add members
      }
    });
    
    if (!memberPermission) {
      return {
        allowed: false,
        message: 'You do not have permission to manage members in this workspace',
        statusCode: 403
      };
    }
    
    // Get effective plan of the workspace owner
    const effectivePlan = getEffectivePlan(
      workspace.user.plan as PlanType, 
      workspace.user.planExpires
    );
    
    // Get member limit based on the plan
    const memberLimit = getMemberLimit(effectivePlan);
    
    // Count existing members in this workspace
    const memberCount = await prisma.workspaceMember.count({
      where: { workspaceId }
    });
    
    // Count pending invitations
    const pendingInvitations = await prisma.invitation.count({
      where: { 
        workspaceId,
      }
    });
    
    // Calculate total (existing + pending)
    const totalMemberCount = memberCount + pendingInvitations;
    
    if (totalMemberCount >= memberLimit) {
      return {
        allowed: false,
        message: `Member limit reached for the ${effectivePlan} plan (${totalMemberCount}/${memberLimit}). Please upgrade to add more members.`,
        statusCode: 403,
        limit: memberLimit,
        current: totalMemberCount,
        plan: effectivePlan
      };
    }
    
    return {
      allowed: true
    };
    
  } catch (error) {
    console.error('Error checking member limit:', error);
    return {
      allowed: false,
      message: 'Failed to check member limit',
      statusCode: 500
    };
  }
}

// Middleware function to check if a user's subscription allows a feature
export async function checkFeatureAccess(
  req: NextRequest, 
  featureName: "calendar" | "analytics" | "priority_support" | "admin_controls",
  userId?: string
) {
  const session = await auth();
  const userIdToCheck = userId || session?.user?.id;
  
  if (!userIdToCheck) {
    return {
      allowed: false,
      message: 'Unauthorized',
      statusCode: 401
    };
  }
  
  try {
    // Get user with plan details
    const user = await prisma.user.findUnique({
      where: { id: userIdToCheck },
      select: {
        plan: true,
        planExpires: true,
      }
    });
    
    if (!user) {
      return {
        allowed: false,
        message: 'User not found',
        statusCode: 404
      };
    }
    
    // Get effective plan
    const effectivePlan = getEffectivePlan(user.plan as PlanType, user.planExpires);
    
    // Check feature access based on plan
    let allowed = false;
    
    switch (featureName) {
      case "calendar":
        // Calendar is available on PRO and BUSINESS plans
        allowed = ["PRO", "BUSINESS"].includes(effectivePlan);
        break;
      case "analytics":
      case "admin_controls":
      case "priority_support":
        // These features are only available on BUSINESS plan
        allowed = effectivePlan === "BUSINESS";
        break;
      default:
        // Unknown feature
        return {
          allowed: false,
          message: 'Unknown feature',
          statusCode: 400
        };
    }
    
    if (!allowed) {
      return {
        allowed: false,
        message: `The ${featureName} feature requires a ${featureName === "calendar" ? "PRO" : "BUSINESS"} plan. Please upgrade to access this feature.`,
        statusCode: 403,
        requiredPlan: featureName === "calendar" ? "PRO" : "BUSINESS",
        currentPlan: effectivePlan
      };
    }
    
    return {
      allowed: true
    };
    
  } catch (error) {
    console.error(`Error checking access to ${featureName}:`, error);
    return {
      allowed: false,
      message: `Failed to check access to ${featureName}`,
      statusCode: 500
    };
  }
}

// Express middleware for checking subscription status
export function validateSubscription(
  requiredPlan: PlanType | PlanType[] = ["PRO", "BUSINESS"]
) {
  return async (req: NextRequest, res: NextResponse, next: () => void) => {
    try {
      const session = await auth();
      
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      // Get user with plan details
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          plan: true,
          planExpires: true,
        }
      });
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      // Get effective plan
      const effectivePlan = getEffectivePlan(user.plan as PlanType, user.planExpires);
      
      // Convert requiredPlan to array if it's a single value
      const requiredPlans = Array.isArray(requiredPlan) ? requiredPlan : [requiredPlan];
      
      // Check if user's plan is in the required plans list
      if (!requiredPlans.includes(effectivePlan)) {
        return NextResponse.json(
          { 
            error: `This feature requires a ${requiredPlans.join(' or ')} plan. Your current plan is ${effectivePlan}.`,
            requiredPlans,
            currentPlan: effectivePlan
          },
          { status: 403 }
        );
      }
      
      // Continue to the next middleware or handler
      next();
      
    } catch (error) {
      console.error('Error validating subscription:', error);
      return NextResponse.json(
        { error: 'Failed to validate subscription' },
        { status: 500 }
      );
    }
  };
}