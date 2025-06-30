/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/user/subscription/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { addDays } from "date-fns";

// Validation schema for subscription update
const subscriptionSchema = z.object({
  plan: z.enum(["FREE", "PRO", "BUSINESS"]),
  paymentId: z.string().optional(),
  paymentMethod: z.enum(["STRIPE_CARD", "STRIPE_BANK", "PAYPAL", "APPLE_PAY", "GOOGLE_PAY", "MANUAL", "CRYPTO"]).default("MANUAL"),
  amount: z.number().optional(),
  currency: z.string().default("USD"),
});

// Plan pricing configuration
const PLAN_PRICING = {
  FREE: { amount: 0, duration: null },
  PRO: { amount: 29.99, duration: 30 },
  BUSINESS: { amount: 99.99, duration: 30 },
} as const;

// Helper function to generate transaction ID
function generateTransactionId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to determine transaction type
function getTransactionType(oldPlan: string, newPlan: string): "SUBSCRIPTION" | "UPGRADE" | "DOWNGRADE" | "RENEWAL" {
  if (oldPlan === "FREE" && newPlan !== "FREE") return "SUBSCRIPTION";
  if (oldPlan === newPlan) return "RENEWAL";
  
  const planLevels = { FREE: 0, PRO: 1, BUSINESS: 2 };
  const oldLevel = planLevels[oldPlan as keyof typeof planLevels] || 0;
  const newLevel = planLevels[newPlan as keyof typeof planLevels] || 0;
  
  return newLevel > oldLevel ? "UPGRADE" : "DOWNGRADE";
}

// GET current subscription with enhanced transaction details
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
   
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters for transaction filtering
    const url = new URL(req.url);
    const transactionLimit = parseInt(url.searchParams.get('transactionLimit') || '10');
    const includeAll = url.searchParams.get('includeAll') === 'true';
   
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        plan: true,
        planExpires: true,
        planStarted: true,
        planUpdated: true,
      },
    });
   
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get transactions with more details
    const transactionQuery = {
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' as const },
      take: includeAll ? undefined : transactionLimit,
      select: {
        id: true,
        type: true,
        status: true,
        amount: true,
        currency: true,
        plan: true,
        planDuration: true,
        paymentMethod: true,
        description: true,
        stripeTransactionId: true,
        paypalTransactionId: true,
        failureReason: true,
        createdAt: true,
        processedAt: true,
        updatedAt: true,
      },
    };

    const [recentTransactions, totalTransactions] = await Promise.all([
      prisma.transaction.findMany(transactionQuery),
      prisma.transaction.count({ where: { userId: session.user.id } })
    ]);

    // Get transaction summary for the user
    const transactionSummary = await prisma.transaction.groupBy({
      by: ['status'],
      where: { userId: session.user.id },
      _count: true,
      _sum: { amount: true },
    });

    const formattedSummary = {
      total: totalTransactions,
      completed: transactionSummary.find(s => s.status === 'COMPLETED')?._count || 0,
      pending: transactionSummary.find(s => s.status === 'PENDING')?._count || 0,
      failed: transactionSummary.find(s => s.status === 'FAILED')?._count || 0,
      totalSpent: transactionSummary
        .filter(s => s.status === 'COMPLETED')
        .reduce((sum, s) => sum + Number(s._sum.amount || 0), 0),
    };
   
    return NextResponse.json({
      subscription: {
        ...user,
        isActive: user.plan !== 'FREE' && (!user.planExpires || user.planExpires > new Date()),
      },
      transactions: recentTransactions.map(t => ({
        ...t,
        amount: Number(t.amount),
      })),
      transactionSummary: formattedSummary,
      pagination: {
        showing: recentTransactions.length,
        total: totalTransactions,
        hasMore: !includeAll && recentTransactions.length >= transactionLimit,
      }
    }, { status: 200 });
   
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription details' },
      { status: 500 }
    );
  }
}

// POST - Update subscription with enhanced transaction response
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
   
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        plan: true,
        planExpires: true,
        planStarted: true,
        name: true,
        email: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
   
    // Parse and validate the request body
    const body = await req.json();
   
    try {
      const validatedData = subscriptionSchema.parse(body);
      
      // Get plan pricing
      const planConfig = PLAN_PRICING[validatedData.plan];
      const amount = validatedData.amount || planConfig.amount;
      
      // Determine transaction type
      const transactionType = getTransactionType(currentUser.plan, validatedData.plan);
      
      // Create description
      const description = `${transactionType.toLowerCase()} to ${validatedData.plan} plan`;

      // Start database transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create transaction record (initially PENDING)
        const transaction = await tx.transaction.create({
          data: {
            id: generateTransactionId(),
            userId: session.user.id,
            type: transactionType,
            status: "PENDING",
            amount: amount,
            currency: validatedData.currency,
            description,
            plan: validatedData.plan,
            planDuration: planConfig.duration ? 
              (planConfig.duration === 30 ? 'MONTHLY' as any : 'YEARLY' as any) : 
              null,
            paymentMethod: validatedData.paymentMethod,
            stripeTransactionId: validatedData.paymentId?.startsWith('stripe_') ? validatedData.paymentId : null,
            paypalTransactionId: validatedData.paymentId?.startsWith('paypal_') ? validatedData.paymentId : null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // 2. Update user subscription (simulate payment success)
        const updatedUser = await tx.user.update({
          where: { id: session.user.id },
          data: {
            plan: validatedData.plan,
            planStarted: new Date(),
            planUpdated: new Date(),
            planExpires: validatedData.plan !== "FREE"
              ? addDays(new Date(), planConfig.duration || 30)
              : null,
          },
          select: {
            plan: true,
            planExpires: true,
            planStarted: true,
            planUpdated: true,
          },
        });

        // 3. Update transaction to COMPLETED
        const completedTransaction = await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "COMPLETED",
            processedAt: new Date(),
            updatedAt: new Date(),
          },
          select: {
            id: true,
            type: true,
            status: true,
            amount: true,
            currency: true,
            plan: true,
            planDuration: true,
            paymentMethod: true,
            description: true,
            stripeTransactionId: true,
            paypalTransactionId: true,
            createdAt: true,
            processedAt: true,
            updatedAt: true,
          },
        });

        return {
          user: updatedUser,
          transaction: completedTransaction,
        };
      });

      // Get updated transaction list to return
      const updatedTransactions = await prisma.transaction.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          type: true,
          status: true,
          amount: true,
          currency: true,
          plan: true,
          description: true,
          createdAt: true,
          processedAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        subscription: {
          ...result.user,
          isActive: result.user.plan !== 'FREE' && (!result.user.planExpires || result.user.planExpires > new Date()),
        },
        transaction: {
          ...result.transaction,
          amount: Number(result.transaction.amount),
        },
        recentTransactions: updatedTransactions.map(t => ({
          ...t,
          amount: Number(t.amount),
        })),
        message: `Successfully ${transactionType.toLowerCase()}d to ${validatedData.plan} plan`,
      }, { status: 200 });
     
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
    
    // Log failed transaction if we can determine the user
    try {
      const session = await auth();
      if (session?.user?.id) {
        await prisma.transaction.create({
          data: {
            id: generateTransactionId(),
            userId: session.user.id,
            type: "SUBSCRIPTION",
            status: "FAILED",
            amount: 0,
            currency: "USD",
            plan: "FREE",
            paymentMethod: "MANUAL",
            description: `Failed subscription update: ${(error as Error).message}`,
            failureReason: (error as Error).message,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    } catch (logError) {
      console.error("Failed to log error transaction:", logError);
    }
    
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}