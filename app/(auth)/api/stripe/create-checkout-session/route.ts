import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import Stripe from "stripe";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil", // Use the most recent version or specify the version you want
});

// Define pricing IDs - these would come from your Stripe dashboard
const STRIPE_PRICE_IDS = {
  PRO: process.env.STRIPE_PRICE_ID_PRO!,
  BUSINESS: process.env.STRIPE_PRICE_ID_BUSINESS!,
};

// Validation schema
const checkoutSchema = z.object({
  plan: z.enum(["PRO", "BUSINESS"]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
   
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await req.json();
    const { plan } = checkoutSchema.parse(body);
   
    // Get Stripe price ID for the selected plan
    const priceId = STRIPE_PRICE_IDS[plan];
   
    if (!priceId) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
   
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
     
      customerId = customer.id;
     
      // Save Stripe customer ID to user record
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/subscription?canceled=true`,
      metadata: {
        userId: user.id,
        plan: plan,
      },
    });

    // Return the full session ID for client-side redirection
    return NextResponse.json({ 
      id: checkoutSession.id,
      url: checkoutSession.url 
    });
    
  } catch (error) {
    console.error("Stripe checkout error:", error);
   
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
   
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}