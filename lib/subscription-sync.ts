/* eslint-disable @typescript-eslint/no-unused-vars */
// lib/subscription-sync.ts
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// Define PlanType locally if not available from @/lib/plans
export type PlanType = "FREE" | "PRO" | "BUSINESS";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Helper function to add days to a date
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Helper function to get effective plan
function getEffectivePlan(plan: PlanType, planExpires?: Date | null): PlanType {
  if (plan === "FREE") return "FREE";
  if (!planExpires) return plan;
  return new Date() > planExpires ? "FREE" : plan;
}

/**
 * Synchronizes a user's subscription state between the database and Stripe
 */
export async function syncSubscriptionState(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        planExpires: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const currentPlan = user.plan as PlanType;
    const effectivePlan = getEffectivePlan(currentPlan, user.planExpires);
    
    // Case 1: Plan is FREE in DB - ensure no active subscription in Stripe
    if (currentPlan === "FREE") {
      if (user.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(user.stripeSubscriptionId);
          
          await prisma.user.update({
            where: { id: userId },
            data: {
              stripeSubscriptionId: null,
              planExpires: null,
            },
          });
          
          console.log(`Canceled Stripe subscription for FREE user ${userId}`);
        } catch (err) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              stripeSubscriptionId: null,
            },
          });
        }
      }
      return { success: true, message: "Subscription synced - FREE plan" };
    }
    
    // Case 2: Paid plan in DB
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || "",
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      
      customerId = customer.id;
      
      await prisma.user.update({
        where: { id: userId },
        data: {
          stripeCustomerId: customerId,
        },
      });
    }
    
    // Get the correct price ID
    const priceEnvKey = `STRIPE_PRICE_ID_${currentPlan}`;
    const priceId = process.env[priceEnvKey];
    if (!priceId) {
      throw new Error(`No Stripe price ID found for plan: ${currentPlan}`);
    }
    
    // Check existing subscription
    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        if (subscription.status === "active") {
          const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
          await prisma.user.update({
            where: { id: userId },
            data: {
              planExpires: currentPeriodEnd,
            },
          });
          
          return { success: true, message: "Subscription already active and synced" };
        }
      } catch (err) {
        console.log("Stripe subscription not found, will create new one");
      }
    }
    
    // Create new subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata: {
        userId: userId,
        plan: currentPlan,
      },
    });
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeSubscriptionId: subscription.id,
        planExpires: new Date(subscription.current_period_end * 1000),
        planStarted: new Date(),
        planUpdated: new Date(),
      },
    });
    
    return { 
      success: true, 
      message: `Subscription created/updated for plan ${currentPlan}`,
      subscriptionId: subscription.id,
    };
    
  } catch (error) {
    console.error("Failed to sync subscription:", error);
    throw new Error(`Failed to sync subscription: ${(error as Error).message}`);
  }
}

/**
 * Force updates a user's plan with proper Stripe integration
 */
export async function forceUpdatePlan(
  userId: string, 
  plan: PlanType,
  options?: {
    effectiveDate?: Date;
    prorationBehavior?: "create_prorations" | "none" | "always_invoice";
    sendNotification?: boolean;
  }
) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: plan,
        planUpdated: new Date(),
        planExpires: plan !== "FREE" ? addDays(new Date(), 30) : null,
      },
    });
    
    return await syncSubscriptionState(userId);
    
  } catch (error) {
    console.error("Failed to force update plan:", error);
    throw new Error(`Failed to update plan: ${(error as Error).message}`);
  }
}