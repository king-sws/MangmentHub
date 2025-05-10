/* eslint-disable @typescript-eslint/no-explicit-any */

// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { addDays } from "date-fns";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

// This is your Stripe webhook secret for testing your endpoint locally
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Update user with subscription details
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: plan as any, // TypeScript expects SubscriptionPlan enum
            planStarted: new Date(),
            planUpdated: new Date(),
            planExpires: addDays(new Date(), 30), // 30-day subscription period
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
          },
        });
      }
      break;
    }
    
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.lines.data[0]?.subscription as string;
      
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
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
