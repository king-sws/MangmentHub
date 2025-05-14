// app/actions/check-subscription.ts
'use server'

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan, getWorkspaceLimit } from "@/lib/plans";
import { PlanType } from "@/lib/plans";

export async function checkSubscription() {
  try {
    const session = await auth();
    
    if (!session || !session.user || !session.user.id) {
      return {
        success: false,
        message: "Unauthorized",
        plan: "FREE" as PlanType,
        planExpires: null,
        isActive: false,
        workspaceLimit: getWorkspaceLimit("FREE"),
      };
    }
    
    // Get user with subscription data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        plan: true,
        planExpires: true,
      }
    });
    
    if (!user) {
      return {
        success: false,
        message: "User not found",
        plan: "FREE" as PlanType,
        planExpires: null,
        isActive: false,
        workspaceLimit: getWorkspaceLimit("FREE"),
      };
    }
    
    const effectivePlan = getEffectivePlan(
      user.plan as PlanType, 
      user.planExpires
    );
    
    const isActive = user.plan !== "FREE" && 
      user.planExpires && 
      new Date() < new Date(user.planExpires);
    
    return {
      success: true,
      message: "Subscription checked",
      plan: user.plan as PlanType,
      planExpires: user.planExpires,
      effectivePlan: effectivePlan,
      isActive: isActive,
      workspaceLimit: getWorkspaceLimit(effectivePlan),
    };
  } catch (error) {
    console.error("Error checking subscription:", error);
    return {
      success: false,
      message: "Error checking subscription",
      plan: "FREE" as PlanType,
      planExpires: null,
      isActive: false,
      workspaceLimit: getWorkspaceLimit("FREE"),
    };
  }
}