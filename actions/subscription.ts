/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/subscription.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";
import { PlanType } from "@/lib/plans";
import { createCheckoutSession, verifyCheckoutSession, stripe } from "@/actions/stripe";
import { updateTransactionStatus } from "@/lib/transaction-helper";

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
    console.log(`Creating checkout session for user ${session.user.id} - Plan: ${plan}`);
    
    // Create the checkout session (this will create a transaction record)
    const checkoutSession = await createCheckoutSession({
      userId: session.user.id,
      plan,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/subscription`,
    });
    
    if (!checkoutSession || !checkoutSession.sessionId) {
      throw new Error("Failed to create checkout session");
    }
    
    console.log(`Checkout session created: ${checkoutSession.sessionId} for transaction: ${checkoutSession.transactionId}`);
    
    return { 
      success: true, 
      sessionId: checkoutSession.sessionId,
      url: checkoutSession.url,
      transactionId: checkoutSession.transactionId
    };
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    throw new Error(`Failed to create checkout session: ${(error as Error).message}`);
  }
}

// Verify and confirm a Stripe checkout session
// Fixed confirmSubscriptionCheckout function
export async function confirmSubscriptionCheckout(sessionId: string) {
  const session = await auth();
 
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    console.log(`Confirming checkout session: ${sessionId} for user: ${session.user.id}`);
    
    // Verify the checkout session with Stripe
    const checkoutSession = await verifyCheckoutSession(sessionId);
    
    if (!checkoutSession || checkoutSession.payment_status !== 'paid') {
      throw new Error("Payment incomplete or session invalid");
    }

    // Extract metadata from the session
    const { plan, userId, transactionId } = checkoutSession.metadata as { 
      plan: PlanType; 
      userId: string; 
      transactionId?: string;
    };
    
    // Verify that the session belongs to the current user
    if (userId !== session.user.id) {
      throw new Error("Session does not belong to current user");
    }

    // FIXED: Ensure we get the IDs as strings, not full objects
    const customerId = typeof checkoutSession.customer === 'string' 
      ? checkoutSession.customer 
      : checkoutSession.customer?.id;
      
    const subscriptionId = typeof checkoutSession.subscription === 'string'
      ? checkoutSession.subscription
      : checkoutSession.subscription?.id;

    if (!customerId || !subscriptionId) {
      throw new Error("Missing customer or subscription ID from checkout session");
    }

    console.log(`Checkout session verified - TransactionId: ${transactionId}, Plan: ${plan}`);
    console.log(`Customer ID: ${customerId}, Subscription ID: ${subscriptionId}`);

    // Update the transaction status if we have the transaction ID
    if (transactionId) {
      try {
        await updateTransactionStatus(transactionId, 'COMPLETED' as any, {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripeSessionId: sessionId,
          completedAt: new Date(),
        });
        console.log(`Transaction ${transactionId} marked as completed`);
      } catch (transactionError) {
        console.error(`Failed to update transaction ${transactionId}:`, transactionError);
        // Don't throw here - the payment succeeded, so continue with subscription update
      }
    }

    // Update user subscription with string IDs
    const result = await updateSubscription(plan, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      paymentId: sessionId
    });

    console.log(`Subscription updated for user ${session.user.id} - Plan: ${plan}`);
    
    return result;
  } catch (error) {
    console.error("Failed to confirm checkout session:", error);
    
    // Try to mark transaction as failed if we can extract the transaction ID
    try {
      const checkoutSession = await verifyCheckoutSession(sessionId);
      const transactionId = checkoutSession?.metadata?.transactionId;
      
      if (transactionId) {
        await updateTransactionStatus(transactionId, 'FAILED' as any, {
          failureReason: (error as Error).message,
          failedAt: new Date(),
        });
        console.log(`Transaction ${transactionId} marked as failed`);
      }
    } catch (updateError) {
      console.error("Failed to update transaction status:", updateError);
    }
    
    throw new Error(`Failed to confirm subscription: ${(error as Error).message}`);
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
    console.log(`Updating subscription for user ${session.user.id} to plan: ${plan}`);
    
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
    
    console.log(`User ${session.user.id} subscription updated successfully:`, {
      plan: user.plan,
      planStarted: user.planStarted,
      planExpires: user.planExpires,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId
    });
    
    // Revalidate all paths that might display plan information
    revalidatePath('/dashboard');
    revalidatePath('/settings');
    revalidatePath('/settings/subscription');
    revalidatePath('/workspace/[workspaceId]');
   
    return { success: true, user };
  } catch (error) {
    console.error("Failed to update subscription:", error);
    throw new Error(`Failed to update subscription: ${(error as Error).message}`);
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
      // Cancel subscription in Stripe
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      
      console.log(`Stripe subscription ${user.stripeSubscriptionId} marked for cancellation`);
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