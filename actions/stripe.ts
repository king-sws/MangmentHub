/* eslint-disable @typescript-eslint/no-explicit-any */
// actions/stripe.ts
import Stripe from 'stripe';
import { createTransaction } from '@/lib/transaction-helper';
import { TransactionType, PaymentMethod, SubscriptionPlan, PlanDuration } from '@prisma/client';
import { getPlanPrice, type PlanType } from '@/lib/plans';

// Create a Stripe instance with your secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Helper function to get plan price and details
function getPlanDetails(plan: string) {
  const PLAN_DETAILS: { [key: string]: { priceId: string; amount: number; duration: string } } = {
    PRO: {
      priceId: process.env.STRIPE_PRICE_ID_PRO!,
      amount: getPlanPrice('PRO' as PlanType) * 100, // Convert to cents for Stripe
      duration: 'MONTHLY'
    },
    BUSINESS: {
      priceId: process.env.STRIPE_PRICE_ID_BUSINESS!,
      amount: getPlanPrice('BUSINESS' as PlanType) * 100, // Convert to cents for Stripe
      duration: 'MONTHLY'
    },
  };
  
  return PLAN_DETAILS[plan];
}

// Create a Checkout Session
export async function createCheckoutSession({
  userId,
  plan,
  returnUrl,
  metadata = {},
}: {
  userId: string;
  plan: string;
  returnUrl: string;
  metadata?: Record<string, string>;
}) {
  const planDetails = getPlanDetails(plan);
  
  if (!planDetails) {
    throw new Error(`Invalid plan: ${plan}`);
  }

  try {
    // First, create a transaction record
    const transaction = await createTransaction({
      userId,
      type: TransactionType.SUBSCRIPTION,
      amount: planDetails.amount, // Now properly set from plan pricing
      currency: 'USD',
      description: `${plan} subscription - Monthly ($${(planDetails.amount / 100).toFixed(2)})`,
      plan: plan as SubscriptionPlan,
      planDuration: planDetails.duration as PlanDuration,
      paymentMethod: PaymentMethod.STRIPE_CARD,
    });

    console.log(`Created transaction ${transaction.id} for user ${userId} - Plan: ${plan} - Amount: $${(planDetails.amount / 100).toFixed(2)}`);

    // Create Stripe checkout session with transaction ID in metadata
    const session = await stripe.checkout.sessions.create({
      client_reference_id: userId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: planDetails.priceId,
          quantity: 1,
        },
      ],
      success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?canceled=true`,
      metadata: {
        userId,
        plan,
        transactionId: transaction.id, // This is crucial for webhook processing
        amount: planDetails.amount.toString(),
        ...metadata,
      },
    });

    // Update transaction with Stripe session ID
    await updateTransactionWithStripeData(transaction.id, {
      stripeSessionId: session.id,
    });

    console.log(`Created Stripe session ${session.id} for transaction ${transaction.id}`);

    return { 
      sessionId: session.id, 
      url: session.url,
      transactionId: transaction.id 
    };
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    throw new Error(`Failed to create checkout session: ${(error as Error).message}`);
  }
}

// Helper function to update transaction with Stripe data
async function updateTransactionWithStripeData(transactionId: string, stripeData: any) {
  try {
    const { updateTransactionStatus } = await import('@/lib/transaction-helper');
    
    await updateTransactionStatus(transactionId, 'PROCESSING' as any, {
      ...stripeData,
      processingStarted: new Date(),
    });
  } catch (error) {
    console.error('Failed to update transaction with Stripe data:', error);
  }
}

// Verify a Stripe webhook event
export async function verifyStripeWebhookEvent(
  rawBody: string,
  signature: string,
  webhookSecret: string
) {
  try {
    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err);
    throw new Error('Invalid signature');
  }
}

// Verify a checkout session
export async function verifyCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    });
    return session;
  } catch (error) {
    console.error("Failed to verify checkout session:", error);
    throw new Error("Invalid session");
  }
}

// Additional helper function to get plan info for display purposes
export function getPlanInfo(plan: string) {
  const planDetails = getPlanDetails(plan);
  if (!planDetails) return null;
  
  return {
    name: plan,
    price: planDetails.amount / 100, // Convert back to dollars for display
    duration: planDetails.duration,
    priceFormatted: `$${(planDetails.amount / 100).toFixed(2)}/month`
  };
}