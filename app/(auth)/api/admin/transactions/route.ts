/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// Helper function to generate request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Enhanced admin validation with token and session support
async function validateAdminAccess(req: NextRequest) {
  try {
    // Check for admin key first (for API access)
    const adminKey = req.headers.get('x-admin-key') || req.nextUrl.searchParams.get('adminKey');
    if (adminKey && adminKey === process.env.ADMIN_API_KEY) {
      // For admin key access, we need to get admin user info
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true, email: true, role: true }
      });
      
      if (adminUser) {
        return { success: true, user: adminUser };
      }
    }

    // Check for Bearer token
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // You'll need to implement your token validation logic here
      // For now, we'll check if it matches a specific admin token
      if (token === process.env.ADMIN_TOKEN) {
        const adminUser = await prisma.user.findFirst({
          where: { role: 'ADMIN' },
          select: { id: true, email: true, role: true }
        });
        
        if (adminUser) {
          return { success: true, user: adminUser };
        }
      }
    }

    // Fallback to session-based auth
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized - No session', statusCode: 401 };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, email: true, id: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return { success: false, error: 'Admin access required', statusCode: 403 };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Admin validation error:', error);
    return { success: false, error: 'Authentication failed', statusCode: 500 };
  }
}

// Simple audit log (replace with your actual implementation)
const auditLog = {
  logAdminAction: async (data: any) => {
    try {
      await prisma.auditLog.create({
        data: {
          event: data.action,
          category: 'ADMIN',
          adminId: data.adminId,
          adminEmail: data.adminEmail,
          targetUserId: data.targetUserId,
          targetUserEmail: data.targetUserEmail,
          changes: data.changes,
          metadata: {
            ip: data.ip,
            userAgent: data.userAgent,
          },
          ip: data.ip,
          userAgent: data.userAgent,
          createdAt: data.timestamp,
        }
      });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  },
  logError: async (data: any) => {
    console.error('Audit log error:', data);
  }
};

// Validation schemas
const transactionQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED", "REFUNDED", "PARTIALLY_REFUNDED", "DISPUTED"]).optional(),
  type: z.enum(["SUBSCRIPTION", "ONE_TIME_PAYMENT", "UPGRADE", "DOWNGRADE", "RENEWAL", "REFUND", "CHARGEBACK", "ADJUSTMENT"]).optional(),
  userId: z.string().cuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),
  paymentMethod: z.enum(["STRIPE_CARD", "STRIPE_BANK", "PAYPAL", "APPLE_PAY", "GOOGLE_PAY", "MANUAL", "CRYPTO"]).optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "amount", "status", "type"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  adminKey: z.string().optional(),
});

const refundSchema = z.object({
  transactionId: z.string().cuid("Invalid transaction ID format"),
  amount: z.number().positive("Amount must be positive"),
  reason: z.string().min(1, "Reason is required"),
  adminKey: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  try {
    const adminValidation = await validateAdminAccess(req);
    if (!adminValidation.success) {
      return NextResponse.json(
        { 
          error: adminValidation.error,
          code: 'UNAUTHORIZED_ACCESS',
          requestId: generateRequestId(),
        }, 
        { status: adminValidation.statusCode }
      );
    }

    // Parse and validate query parameters with error handling
    let validatedQuery;
    try {
      const queryParams = Object.fromEntries(req.nextUrl.searchParams.entries());
      validatedQuery = transactionQuerySchema.parse(queryParams);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Invalid query parameters",
            code: 'VALIDATION_ERROR',
            details: validationError.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            })),
            requestId: generateRequestId(),
          },
          { status: 400 }
        );
      }
      throw validationError;
    }
    
    const {
      page,
      limit,
      status,
      type,
      userId,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      paymentMethod,
      search,
      sortBy,
      sortOrder,
    } = validatedQuery;

    // Build filters with proper type handling
    const where: any = {};
    
    if (status) where.status = status;
    if (type) where.type = type;
    if (userId) where.userId = userId;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    
    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }
    
    // Amount range filter
    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) where.amount.gte = minAmount;
      if (maxAmount !== undefined) where.amount.lte = maxAmount;
    }
    
    // Search filter
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { stripeTransactionId: { contains: search, mode: 'insensitive' } },
        { paypalTransactionId: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get transactions with user data
    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              plan: true,
            },
          },
          refunds: {
            select: {
              id: true,
              amount: true,
              reason: true,
              status: true,
              createdAt: true,
              adminEmail: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    // Get summary statistics
    const summaryStats = await getTransactionSummary(where);

    // Log admin action
    await auditLog.logAdminAction({
      adminId: adminValidation.user!.id,
      adminEmail: adminValidation.user!.email,
      action: 'TRANSACTIONS_VIEW',
      changes: {
        operation: 'VIEW_TRANSACTIONS',
        filters: validatedQuery,
        resultCount: transactions.length,
      },
      timestamp: new Date(),
      ip: clientIp,
      userAgent,
    });

    const responseTime = Date.now() - startTime;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions.map(formatTransaction),
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        summary: summaryStats,
        filters: validatedQuery,
      },
      metadata: {
        requestId: generateRequestId(),
        responseTime,
        queriedBy: adminValidation.user!.email,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    await auditLog.logError({
      error: 'Admin transactions query failed',
      details: {
        endpoint: '/api/admin/transactions',
        method: 'GET',
        error: (error as Error).message,
        ip: clientIp,
        userAgent,
        responseTime,
      },
      timestamp: new Date(),
    });

    console.error("Admin transactions query error:", error);

    return NextResponse.json(
      {
        error: "Failed to retrieve transactions",
        code: 'QUERY_ERROR',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
        requestId: generateRequestId(),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const startTime = Date.now();
  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  try {
    const body = await req.json();
    
    // Handle admin key from request body
    if (body.adminKey) {
      req.headers.set('x-admin-key', body.adminKey);
    }
    
    const adminValidation = await validateAdminAccess(req);
    if (!adminValidation.success) {
      return NextResponse.json(
        { 
          error: adminValidation.error,
          code: 'UNAUTHORIZED_ACCESS',
          requestId: generateRequestId(),
        }, 
        { status: adminValidation.statusCode }
      );
    }

    // Handle refund action
    if (body.action === 'refund') {
      const validatedData = refundSchema.parse(body);
      const { transactionId, amount, reason } = validatedData;

      // Get transaction
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { user: true, refunds: true },
      });

      if (!transaction) {
        return NextResponse.json(
          { error: "Transaction not found", code: 'TRANSACTION_NOT_FOUND', requestId: generateRequestId() },
          { status: 404 }
        );
      }

      // Validate refund amount
      const totalRefunded = transaction.refunds
        .filter(r => r.status === 'COMPLETED')
        .reduce((sum, r) => sum + Number(r.amount), 0);
      
      const availableForRefund = Number(transaction.amount) - totalRefunded;
      
      if (amount > availableForRefund) {
        return NextResponse.json(
          { 
            error: "Refund amount exceeds available amount", 
            code: 'INVALID_REFUND_AMOUNT',
            availableAmount: availableForRefund,
            requestId: generateRequestId()
          },
          { status: 400 }
        );
      }

      // Process refund
      const refund = await processRefund(transaction, amount, reason, adminValidation.user!);

      // Log admin action
      await auditLog.logAdminAction({
        adminId: adminValidation.user!.id,
        adminEmail: adminValidation.user!.email,
        action: 'TRANSACTION_REFUND',
        targetUserId: transaction.userId,
        targetUserEmail: transaction.user.email,
        changes: {
          transactionId,
          refundAmount: amount,
          reason,
          refundId: refund.id,
        },
        timestamp: new Date(),
        ip: clientIp,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        refund: {
          id: refund.id,
          amount: refund.amount,
          status: refund.status,
          createdAt: refund.createdAt,
        },
        requestId: generateRequestId(),
      });
    }

    return NextResponse.json(
      { error: "Invalid action", code: 'INVALID_ACTION', requestId: generateRequestId() },
      { status: 400 }
    );

  } catch (error) {
    console.error("Admin transactions action error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          code: 'VALIDATION_ERROR',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
          requestId: generateRequestId(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
        requestId: generateRequestId(),
      },
      { status: 500 }
    );
  }
}

// Helper functions
function formatTransaction(transaction: any) {
  return {
    id: transaction.id,
    user: {
      id: transaction.user.id,
      name: transaction.user.name,
      email: transaction.user.email,
      plan: transaction.user.plan,
    },
    type: transaction.type,
    status: transaction.status,
    amount: Number(transaction.amount),
    currency: transaction.currency,
    description: transaction.description,
    plan: transaction.plan,
    planDuration: transaction.planDuration,
    paymentMethod: transaction.paymentMethod,
    stripeTransactionId: transaction.stripeTransactionId,
    paypalTransactionId: transaction.paypalTransactionId,
    failureReason: transaction.failureReason,
    refundAmount: transaction.refundAmount ? Number(transaction.refundAmount) : null,
    refunds: transaction.refunds.map((refund: any) => ({
      id: refund.id,
      amount: Number(refund.amount),
      reason: refund.reason,
      status: refund.status,
      createdAt: refund.createdAt,
      adminEmail: refund.adminEmail,
    })),
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
    processedAt: transaction.processedAt,
    refundedAt: transaction.refundedAt,
  };
}

async function getTransactionSummary(where: any) {
  try {
    const [
      totalRevenue,
      totalRefunds,
      completedTransactions,
      failedTransactions,
      recentTransactions,
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { ...where, status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] } },
        _sum: { refundAmount: true },
        _count: true,
      }),
      prisma.transaction.count({
        where: { ...where, status: 'COMPLETED' },
      }),
      prisma.transaction.count({
        where: { ...where, status: 'FAILED' },
      }),
      prisma.transaction.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
    ]);

    return {
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      totalRefunds: Number(totalRefunds._sum.refundAmount || 0),
      netRevenue: Number(totalRevenue._sum.amount || 0) - Number(totalRefunds._sum.refundAmount || 0),
      completedCount: completedTransactions,
      failedCount: failedTransactions,
      refundCount: totalRefunds._count,
      recentTransactions,
      successRate: totalRevenue._count > 0 ? 
        ((completedTransactions / (completedTransactions + failedTransactions)) * 100).toFixed(2) : "0",
    };
  } catch (error) {
    console.error('Error getting transaction summary:', error);
    return {
      totalRevenue: 0,
      totalRefunds: 0,
      netRevenue: 0,
      completedCount: 0,
      failedCount: 0,
      refundCount: 0,
      recentTransactions: 0,
      successRate: "0",
    };
  }
}

async function processRefund(transaction: any, amount: number, reason: string, admin: any) {
  // Create refund record
  const refund = await prisma.refund.create({
    data: {
      transactionId: transaction.id,
      amount,
      reason,
      status: 'PENDING',
      adminId: admin.id,
      adminEmail: admin.email,
    },
  });

  // Process with payment provider (Stripe/PayPal)
  try {
    // Add your payment provider refund logic here
    // For now, we'll mark as completed
    const updatedRefund = await prisma.refund.update({
      where: { id: refund.id },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });

    // Update transaction status
    const totalRefunded = Number(transaction.refundAmount || 0) + amount;
    const newStatus = totalRefunded >= Number(transaction.amount) ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: newStatus,
        refundAmount: totalRefunded,
        refundedAt: new Date(),
      },
    });
    
    return { ...updatedRefund, status: 'COMPLETED', processedAt: new Date() };
  } catch (error) {
    // Mark refund as failed
    await prisma.refund.update({
      where: { id: refund.id },
      data: { status: 'FAILED' },
    });
    throw error;
  }
}