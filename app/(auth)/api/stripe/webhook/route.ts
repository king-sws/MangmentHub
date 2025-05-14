/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { addDays } from "date-fns";
import { stripe, verifyStripeWebhookEvent } from "@/actions/stripe";
import { SubscriptionPlan } from "@prisma/client";
import { headers } from "next/headers";

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
        const { plan, userId } = session.metadata as { plan: string; userId: string };
        
        if (!userId || !plan) {
          console.error("Missing metadata in checkout session");
          break;
        }
      
        // Get subscription ID from the session
        if (session.subscription) {
          const subscriptionId = session.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Update user with subscription details
          await prisma.user.update({
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
          
          console.log(`Updated subscription for user ${userId} to plan ${plan}`);
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
            // Extend subscription period
            await prisma.user.update({
              where: { id: user.id },
              data: {
                planUpdated: new Date(),
                planExpires: addDays(new Date(), 30), // Extend for another 30 days
              },
            });
            
            console.log(`Extended subscription for user ${user.id}`);
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
          await prisma.user.update({
            where: { id: user.id },
            data: {
              plan: "FREE",
              planUpdated: new Date(),
              planExpires: null,
              stripeSubscriptionId: null,
            },
          });
          
          console.log(`Downgraded user ${user.id} to FREE plan due to subscription deletion`);
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
            console.log(`Payment failed for user ${user.id} - subscription ${subscriptionId}`);
            // You could add code here to notify the user about the payment failure
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