// app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession } from "@/actions/stripe";
import { PlanType } from "@/lib/plans";

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

    // Parse request body
    const body = await req.json();
    const { plan } = body as { plan: PlanType };
    
    if (!plan || !["PRO", "BUSINESS"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    // Create checkout session using existing function
    const checkoutResult = await createCheckoutSession({
      userId: user.id,
      plan,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/subscription`,
    });

    // Return session information
    return NextResponse.json(checkoutResult);
    
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session", message: (error as Error).message },
      { status: 500 }
    );
  }
}