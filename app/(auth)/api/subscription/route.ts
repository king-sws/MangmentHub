import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { addDays } from "date-fns";

// Validation schema for subscription update
const subscriptionSchema = z.object({
  plan: z.enum(["FREE", "PRO", "BUSINESS"]),
  paymentId: z.string().optional(), // Payment processor ID (Stripe, PayPal, etc.)
});

// GET current subscription
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        plan: true,
        planExpires: true,
        planStarted: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user, { status: 200 });
    
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription details' },
      { status: 500 }
    );
  }
}

// POST - Update subscription
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse and validate the request body
    const body = await req.json();
    
    try {
      const validatedData = subscriptionSchema.parse(body);
      
      // In a real app, you would validate the payment with your payment processor here
      // and only update the subscription if the payment was successful
      
      // For demo purposes, we're just updating the subscription directly
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          plan: validatedData.plan,
          planStarted: new Date(),
          planUpdated: new Date(),
          // Set expiration date (30 days for paid plans, null for FREE)
          planExpires: validatedData.plan !== "FREE" 
            ? addDays(new Date(), 30) 
            : null,
        },
        select: {
          plan: true,
          planExpires: true,
          planStarted: true,
        },
      });
      
      return NextResponse.json(updatedUser, { status: 200 });
      
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError;
    }
    
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}