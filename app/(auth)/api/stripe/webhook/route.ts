/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { addDays } from "date-fns";
import { stripe, verifyStripeWebhookEvent } from "@/actions/stripe";
import { SubscriptionPlan, TransactionStatus, TransactionType, PaymentMethod, PlanDuration } from "@prisma/client";
import { headers } from "next/headers";
import { updateTransactionStatus, createTransaction } from "@/lib/transaction-helper";

// Helper function to get plan duration (should match your subscription.ts)
function getPlanDuration(plan: string): PlanDuration {
  // Adjust this based on your actual plan structure
  return "MONTHLY"; // or get from your plan configuration
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = (await headers()).get("stripe-signature");
    
    if (!signature) {
      return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 });
    }
    
    // Verify the webhook event
    let event: Stripe.Event;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    
    try {
      event = await verifyStripeWebhookEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err);
      return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
    }

    // Log the event type for debugging
    console.log(`Processing Stripe webhook: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Extract customer and metadata
        const customerId = session.customer as string;
        const { plan, userId, transactionId } = session.metadata as { 
          plan: string; 
          userId: string; 
          transactionId?: string;
        };
        
        if (!userId || !plan) {
          console.error("Missing metadata in checkout session", { userId, plan, sessionId: session.id });
          break;
        }

        console.log(`Processing checkout completion for user: ${userId}, plan: ${plan}, transactionId: ${transactionId}`);
      
        // Get subscription ID from the session
        if (session.subscription) {
          const subscriptionId = session.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          try {
            // Update user with subscription details
            const updatedUser = await prisma.user.update({
              where: { id: userId },
              data: {
                plan: plan as SubscriptionPlan,
                planStarted: new Date(),
                planUpdated: new Date(),
                planExpires: addDays(new Date(), 30), // 30-day subscription period
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
              },
            });
            
            console.log(`Successfully updated user ${userId} plan to ${plan}`, {
              userId: updatedUser.id,
              plan: updatedUser.plan,
              planStarted: updatedUser.planStarted,
              planExpires: updatedUser.planExpires
            });
            
            // Update transaction if we have the ID
            if (transactionId) {
              const updatedTransaction = await updateTransactionStatus(transactionId, TransactionStatus.COMPLETED, {
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                stripeSessionId: session.id,
                completedAt: new Date(),
              });
              console.log(`Transaction ${transactionId} marked as completed`);
            } else {
              console.warn(`No transactionId found in metadata for session ${session.id}`);
            }
            
          } catch (error) {
            console.error(`Failed to update user ${userId} subscription:`, error);
            
            // If transaction update fails, mark transaction as failed
            if (transactionId) {
              try {
                await updateTransactionStatus(transactionId, TransactionStatus.FAILED, {
                  error: "Failed to update user subscription",
                  failureReason: (error as Error).message,
                });
              } catch (transactionError) {
                console.error(`Failed to update transaction status:`, transactionError);
              }
            }
          }
        } else {
          console.error(`No subscription found in checkout session ${session.id}`);
          
          // Mark transaction as failed if no subscription
          if (transactionId) {
            await updateTransactionStatus(transactionId, TransactionStatus.FAILED, {
              error: "No subscription found in checkout session",
            });
          }
        }
        break;
      }
      
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const customerId = subscription.customer as string;
          
          // Find user by Stripe customer ID
          const user = await prisma.user.findFirst({
            where: { stripeCustomerId: customerId },
          });
          
          if (user) {
            try {
              // Create renewal transaction
              const renewalTransaction = await createTransaction({
                userId: user.id,
                type: TransactionType.RENEWAL,
                amount: invoice.amount_paid,
                currency: invoice.currency.toUpperCase(),
                description: `Subscription renewal - ${user.plan}`,
                plan: user.plan,
                planDuration: getPlanDuration(user.plan),
                paymentMethod: PaymentMethod.STRIPE_CARD,
                stripeTransactionId: invoice.id,
                stripeInvoiceId: invoice.id,
              });

              // Mark transaction as completed
              await updateTransactionStatus(renewalTransaction.id, TransactionStatus.COMPLETED, {
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                stripeInvoiceId: invoice.id,
                renewedAt: new Date(),
              });

              // Extend subscription period
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  planUpdated: new Date(),
                  planExpires: addDays(new Date(), 30), // Extend for another 30 days
                },
              });
              
              console.log(`Extended subscription for user ${user.id} - Transaction: ${renewalTransaction.id}`);
            } catch (error) {
              console.error(`Failed to process renewal for user ${user.id}:`, error);
            }
          } else {
            console.error(`User not found for Stripe customer ${customerId}`);
          }
        }
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Find user by Stripe customer ID and downgrade to FREE plan
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });
        
        if (user) {
          try {
            // Create cancellation transaction
            const cancellationTransaction = await createTransaction({
              userId: user.id,
              type: TransactionType.DOWNGRADE,
              amount: 0,
              currency: "USD",
              description: `Subscription cancelled - downgrade to FREE`,
              plan: "FREE",
              planDuration: getPlanDuration("FREE"),
              paymentMethod: PaymentMethod.MANUAL,
              stripeTransactionId: subscription.id,
            });

            // Mark transaction as completed
            await updateTransactionStatus(cancellationTransaction.id, TransactionStatus.COMPLETED, {
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscription.id,
              cancelledAt: new Date(),
            });

            await prisma.user.update({
              where: { id: user.id },
              data: {
                plan: "FREE",
                planUpdated: new Date(),
                planExpires: null,
                stripeSubscriptionId: null,
              },
            });
            
            console.log(`Downgraded user ${user.id} to FREE plan - Transaction: ${cancellationTransaction.id}`);
          } catch (error) {
            console.error(`Failed to process cancellation for user ${user.id}:`, error);
          }
        } else {
          console.error(`User not found for Stripe customer ${customerId}`);
        }
        break;
      }
      
      // Add handler for payment failures
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const customerId = subscription.customer as string;
          
          // Find user by Stripe customer ID
          const user = await prisma.user.findFirst({
            where: { stripeCustomerId: customerId },
          });
          
          if (user) {
            try {
              // Create failed payment transaction
              const failedTransaction = await createTransaction({
                userId: user.id,
                type: TransactionType.RENEWAL,
                amount: invoice.amount_due,
                currency: invoice.currency.toUpperCase(),
                description: `Failed payment - ${user.plan} subscription`,
                plan: user.plan,
                planDuration: getPlanDuration(user.plan),
                paymentMethod: PaymentMethod.STRIPE_CARD,
                stripeTransactionId: invoice.id,
                stripeInvoiceId: invoice.id,
              });

              // Mark transaction as failed
              await updateTransactionStatus(failedTransaction.id, TransactionStatus.FAILED, {
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                stripeInvoiceId: invoice.id,
                failureReason: "Payment failed",
                failedAt: new Date(),
              });
              
              console.log(`Payment failed for user ${user.id} - Transaction: ${failedTransaction.id}`);
            } catch (error) {
              console.error(`Failed to process payment failure for user ${user.id}:`, error);
            }
          }
        }
        break;
      }

      // Handle successful refunds
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        const chargeId = dispute.charge as string;
        
        // Find transaction by charge ID and create dispute record
        const transaction = await prisma.transaction.findFirst({
          where: { stripeTransactionId: chargeId },
        });
        
        if (transaction) {
          try {
            await updateTransactionStatus(transaction.id, TransactionStatus.DISPUTED, {
              disputeId: dispute.id,
              disputeReason: dispute.reason,
              disputeStatus: dispute.status,
              disputeAmount: dispute.amount,
              disputedAt: new Date(),
            });
            
            console.log(`Dispute created for transaction ${transaction.id}`);
          } catch (error) {
            console.error(`Failed to process dispute for transaction ${transaction.id}:`, error);
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error processing webhook:`, error);
    return NextResponse.json({ error: `Failed to process webhook: ${(error as Error).message}` }, { status: 500 });
  }
}