/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/transaction-helper.ts
import { prisma } from "@/lib/prisma";
import { TransactionType, TransactionStatus, PaymentMethod, SubscriptionPlan, PlanDuration } from "@prisma/client";

export async function createTransaction({
  userId,
  type,
  amount,
  currency = "USD",
  description,
  plan,
  planDuration,
  paymentMethod,
  stripeTransactionId,
  stripePaymentIntentId,
  stripeInvoiceId,
  paypalTransactionId,
  metadata = {},
}: {
  userId: string;
  type: TransactionType;
  amount: number;
  currency?: string;
  description?: string;
  plan?: SubscriptionPlan;
  planDuration?: PlanDuration;
  paymentMethod: PaymentMethod;
  stripeTransactionId?: string;
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;
  paypalTransactionId?: string;
  metadata?: any;
}) {
  try {
    console.log(`Creating transaction for user ${userId}:`, {
      type,
      amount,
      currency,
      plan,
      paymentMethod
    });

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type,
        status: TransactionStatus.PENDING,
        amount,
        currency,
        description: description || `${type} - ${plan || 'N/A'}`,
        plan,
        planDuration,
        paymentMethod,
        stripeTransactionId,
        stripePaymentIntentId,
        stripeInvoiceId,
        paypalTransactionId,
        metadata: metadata || {},
      },
    });
    
    console.log(`✅ Transaction created successfully: ${transaction.id} for user: ${userId}`);
    return transaction;
  } catch (error) {
    console.error("❌ Failed to create transaction:", error);
    throw new Error(`Failed to create transaction: ${(error as Error).message}`);
  }
}

export async function updateTransactionStatus(
  transactionId: string,
  status: TransactionStatus,
  additionalData?: any
) {
  try {
    console.log(`Updating transaction ${transactionId} to status: ${status}`);

    // First, check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { id: true, status: true, metadata: true }
    });

    if (!existingTransaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };
    
    // Set completion timestamp for completed transactions
    if (status === TransactionStatus.COMPLETED) {
      updateData.processedAt = new Date();
    }
    
    // Set failure data for failed transactions
    if (status === TransactionStatus.FAILED) {
      updateData.failureReason = additionalData?.failureReason || additionalData?.error || "Payment failed";
    }
    
    // Set refund data for refunded transactions
    if (status === TransactionStatus.REFUNDED || status === TransactionStatus.PARTIALLY_REFUNDED) {
      updateData.refundedAt = new Date();
      if (additionalData?.refundAmount) {
        updateData.refundAmount = additionalData.refundAmount;
      }
    }
    
    // Merge metadata
    if (additionalData) {
      const existingMetadata = existingTransaction.metadata && typeof existingTransaction.metadata === 'object' 
        ? existingTransaction.metadata as Record<string, any>
        : {};
      
      updateData.metadata = {
        ...existingMetadata,
        ...additionalData,
        lastUpdated: new Date().toISOString(),
      };
    }
    
    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData,
    });
    
    console.log(`✅ Transaction updated successfully: ${transactionId} - Status: ${status}`);
    return transaction;
  } catch (error) {
    console.error(`❌ Failed to update transaction ${transactionId}:`, error);
    throw new Error(`Failed to update transaction: ${(error as Error).message}`);
  }
}

// Helper function to find transaction by Stripe session ID
export async function findTransactionByStripeSession(sessionId: string) {
  try {
    console.log(`Looking for transaction with Stripe session: ${sessionId}`);

    // Try multiple ways to find the transaction
    const transactionByMetadata = await prisma.transaction.findFirst({
      where: {
        OR: [
          {
            metadata: {
              path: ["stripeSessionId"],
              equals: sessionId
            }
          },
          {
            stripeTransactionId: sessionId
          }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            plan: true
          }
        }
      }
    });
    
    if (transactionByMetadata) {
      console.log(`✅ Found transaction by metadata: ${transactionByMetadata.id}`);
      return transactionByMetadata;
    }

    console.log(`⚠️ No transaction found for Stripe session: ${sessionId}`);
    return null;
  } catch (error) {
    console.error("❌ Failed to find transaction by Stripe session:", error);
    return null;
  }
}

// Helper function to find transaction by metadata
export async function findTransactionByMetadata(key: string, value: string) {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: {
        metadata: {
          path: [key],
          equals: value
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            plan: true
          }
        }
      }
    });
    
    return transaction;
  } catch (error) {
    console.error(`Failed to find transaction by metadata ${key}:${value}:`, error);
    return null;
  }
}

// Helper function to get user's transaction history
export async function getUserTransactions(userId: string, limit = 10) {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        refunds: {
          select: {
            id: true,
            amount: true,
            reason: true,
            status: true,
            createdAt: true
          }
        }
      }
    });
    
    console.log(`Retrieved ${transactions.length} transactions for user ${userId}`);
    return transactions;
  } catch (error) {
    console.error("Failed to get user transactions:", error);
    throw error;
  }
}

// Helper function to get transaction statistics
export async function getTransactionStats(userId?: string) {
  try {
    const where = userId ? { userId } : {};
    
    const [total, completed, failed, pending] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.count({ where: { ...where, status: TransactionStatus.COMPLETED } }),
      prisma.transaction.count({ where: { ...where, status: TransactionStatus.FAILED } }),
      prisma.transaction.count({ where: { ...where, status: TransactionStatus.PENDING } }),
    ]);

    const totalRevenue = await prisma.transaction.aggregate({
      where: { ...where, status: TransactionStatus.COMPLETED },
      _sum: { amount: true }
    });

    return {
      total,
      completed,
      failed,
      pending,
      revenue: Number(totalRevenue._sum.amount || 0),
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  } catch (error) {
    console.error("Failed to get transaction stats:", error);
    throw error;
  }
}