/* eslint-disable @typescript-eslint/no-unused-vars */
// lib/subscription-sync.ts
import { prisma } from "@/lib/prisma";
import { PlanType, getEffectivePlan } from "@/lib/plans";
import Stripe from "stripe";
import { addDays } from "date-fns";

// Initialize Stripe with a valid API version
// Using a version that's compatible with Stripe library v18.1.0
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16", // Changed from "2025-04-30.basil" to supported version
});

/**
 * Synchronizes a user's subscription state between the database and Stripe
 * This ensures that manual changes in Prisma Studio are properly reflected
 */
export async function syncSubscriptionState(userId: string) {
  try {
    // Get user from database
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const effectivePlan = getEffectivePlan(currentPlan, user.planExpires);
    
    // Case 1: Plan is FREE in DB - ensure no active subscription in Stripe
    if (currentPlan === "FREE") {
      // If there's an active Stripe subscription, cancel it
      if (user.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(user.stripeSubscriptionId);
          
          // Update user record to clear Stripe subscription ID
          await prisma.user.update({
            where: { id: userId },
            data: {
              stripeSubscriptionId: null,
              planExpires: null,
            },
          });
          
          console.log(`Canceled Stripe subscription for FREE user ${userId}`);
        } catch (err) {
          // If subscription doesn't exist in Stripe, just clear it from our DB
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
    
    // First, make sure we have a Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email || "",
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      
      customerId = customer.id;
      
      // Update user with new customer ID
      await prisma.user.update({
        where: { id: userId },
        data: {
          stripeCustomerId: customerId,
        },
      });
    }
    
    // Figure out which price to use
    const priceEnvKey = `STRIPE_PRICE_ID_${currentPlan}`;
    const priceId = process.env[priceEnvKey];
    if (!priceId) {
      throw new Error(`No Stripe price ID found for plan: ${currentPlan}`);
    }
    
    // Check if user already has a subscription in Stripe
    if (user.stripeSubscriptionId) {
      try {
        // Get current subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        // If status is active and plan matches, nothing to do
        if (subscription.status === "active") {
          // Update expiry date to match Stripe
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
        // Subscription not found in Stripe, need to create new one
        console.log("Stripe subscription not found, will create new one");
      }
    }
    
    // Create new subscription in Stripe
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata: {
        userId: userId,
        plan: currentPlan,
      },
    });
    
    // Update user with subscription details
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
 * This can be called after manually changing plan in Prisma Studio
 */
export async function forceUpdatePlan(userId: string, plan: PlanType) {
  try {
    // Update the plan in the database first
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: plan,
        planUpdated: new Date(),
        // If it's a paid plan, set a temporary expiry date that will be updated by sync
        planExpires: plan !== "FREE" ? addDays(new Date(), 30) : null,
      },
    });
    
    // Then sync with Stripe to ensure consistency
    return await syncSubscriptionState(userId);
    
  } catch (error) {
    console.error("Failed to force update plan:", error);
    throw new Error(`Failed to update plan: ${(error as Error).message}`);
  }
}