/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";
import { PlanType } from "@/lib/plans";
import { createCheckoutSession } from "@/actions/stripe";

// Get current user's subscription
export async function getCurrentSubscription() {
  const session = await auth();
 
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
 
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true,
      planExpires: true,
      planStarted: true,
      planUpdated: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });
 
  if (!user) {
    throw new Error("User not found");
  }
 
  return user;
}

// Create a Stripe checkout session for subscription
export async function createSubscriptionCheckout(plan: PlanType) {
  const session = await auth();
 
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  
  if (plan === "FREE") {
    // For free plan, just update the subscription directly
    return updateSubscription("FREE");
  }

  try {
    // Create the checkout session
    const checkoutSession = await createCheckoutSession({
      userId: session.user.id,
      plan,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/subscription`,
    });
    
    return { 
      success: true, 
      sessionId: checkoutSession.sessionId,
      url: checkoutSession.url
    };
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    throw new Error("Failed to create checkout session");
  }
}

// Update subscription plan
export async function updateSubscription(
  plan: PlanType, 
  options?: { 
    stripeCustomerId?: string, 
    stripeSubscriptionId?: string, 
    paymentId?: string 
  }
) {
  const session = await auth();
 
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    // Update user's subscription
    const updateData: any = {
      plan: plan,
      planUpdated: new Date(),
    };
    
    // Only update these fields for non-free plans or when we have payment data
    if (plan !== "FREE" || options?.paymentId) {
      updateData.planStarted = new Date();
      updateData.planExpires = addDays(new Date(), 30);
    } else if (plan === "FREE") {
      // For free plan, remove expiration
      updateData.planExpires = null;
    }
    
    // Add Stripe data if available
    if (options?.stripeCustomerId) {
      updateData.stripeCustomerId = options.stripeCustomerId;
    }
    
    if (options?.stripeSubscriptionId) {
      updateData.stripeSubscriptionId = options.stripeSubscriptionId;
    }
    
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });
    
    // Revalidate all paths that might display plan information
    revalidatePath('/dashboard');
    revalidatePath('/settings');
    revalidatePath('/workspace/[workspaceId]');
   
    return { success: true, user };
  } catch (error) {
    console.error("Failed to update subscription:", error);
    throw new Error("Failed to update subscription");
  }
}

// Cancel subscription
export async function cancelSubscription() {
  const session = await auth();
 
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeSubscriptionId: true },
    });
    
    if (user?.stripeSubscriptionId) {
      // Import stripe dynamically to avoid circular dependencies
      const { stripe } = await import("@/actions/stripe");
      
      // Cancel subscription in Stripe
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }
    
    // Update user's plan to FREE after current period
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        planUpdated: new Date(),
        // The actual plan change will happen via webhook when Stripe confirms cancellation
      },
    });
    
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Failed to cancel subscription:", error);
    throw new Error("Failed to cancel subscription");
  }
}

// Check if user can create more workspaces based on their plan
export async function canCreateWorkspace() {
  const session = await auth();
 
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
 
  // Get user with plan details
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true,
      planExpires: true,
    },
  });
 
  if (!user) {
    throw new Error("User not found");
  }
 
  // Get workspace count
  const workspaceCount = await prisma.workspace.count({
    where: { userId: session.user.id },
  });
 
  // Import dynamically to avoid circular dependencies
  const { getWorkspaceLimit, getEffectivePlan } = await import("@/lib/plans");
 
  // Determine effective plan (accounting for expiration)
  const effectivePlan = getEffectivePlan(user.plan as PlanType, user.planExpires);
 
  // Get workspace limit based on effective plan
  const limit = getWorkspaceLimit(effectivePlan);
 
  return {
    canCreate: workspaceCount < limit,
    current: workspaceCount,
    limit: limit,
    plan: effectivePlan
  };
}