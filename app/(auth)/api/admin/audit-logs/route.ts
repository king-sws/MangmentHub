/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/audit-logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { validateAdminAccess } from "@/lib/admin-auth";
import { auditLog } from "@/lib/audit-log";
import { auth } from "@/auth";

// Validation schemas
const auditLogQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
  category: z.enum(["ADMIN", "USER", "SECURITY", "SUBSCRIPTION", "SYSTEM"]).optional(),
  event: z.string().optional(),
  adminId: z.string().optional(),
  targetUserId: z.string().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  adminKey: z.string().optional(),
});

const securityEventQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
  event: z.string().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  ip: z.string().optional(),
  adminKey: z.string().optional(),
});

// GET /api/admin/audit-logs - Get audit logs with filtering and pagination
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  try {
    const session = await auth();
    
    // Handle admin key in query params
    const adminKey = req.nextUrl.searchParams.get("adminKey");
    if (adminKey) {
      req.headers.set('x-admin-key', adminKey);
    }
    
    // Validate admin access
    const adminValidation = await validateAdminAccess(req, session);
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

    // Parse and validate query parameters
    const queryParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const logType = req.nextUrl.searchParams.get("type") || "audit"; // "audit" or "security"
    
    if (logType === "security") {
      const validatedParams = securityEventQuerySchema.parse(queryParams);
      const securityLogs = await getSecurityEvents(validatedParams);
      
      // Log admin action
      await auditLog.logAdminAction({
        adminId: adminValidation.user!.id,
        adminEmail: adminValidation.user!.email,
        action: 'SECURITY_LOGS_VIEW',
        targetUserId: undefined,
        targetUserEmail: undefined,
        changes: {
          operation: 'VIEW_SECURITY_LOGS',
          filters: validatedParams,
        },
        timestamp: new Date(),
        ip: clientIp,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        type: 'security',
        ...securityLogs,
        metadata: {
          requestId: generateRequestId(),
          responseTime: Date.now() - startTime,
          queriedBy: adminValidation.user!.email,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      const validatedParams = auditLogQuerySchema.parse(queryParams);
      const auditLogs = await getAuditLogs(validatedParams);
      
      // Log admin action
      await auditLog.logAdminAction({
        adminId: adminValidation.user!.id,
        adminEmail: adminValidation.user!.email,
        action: 'AUDIT_LOGS_VIEW',
        targetUserId: undefined,
        targetUserEmail: undefined,
        changes: {
          operation: 'VIEW_AUDIT_LOGS',
          filters: validatedParams,
        },
        timestamp: new Date(),
        ip: clientIp,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        type: 'audit',
        ...auditLogs,
        metadata: {
          requestId: generateRequestId(),
          responseTime: Date.now() - startTime,
          queriedBy: adminValidation.user!.email,
          timestamp: new Date().toISOString(),
        },
      });
    }

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    await auditLog.logError({
      error: 'Admin audit logs query failed',
      details: {
        endpoint: '/api/admin/audit-logs',
        method: 'GET',
        error: (error as Error).message,
        stack: (error as Error).stack,
        ip: clientIp,
        userAgent,
        responseTime,
      },
      timestamp: new Date(),
    });

    console.error("Admin audit logs error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
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
        error: "Failed to retrieve audit logs",
        code: 'QUERY_ERROR',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
        requestId: generateRequestId(),
      },
      { status: 500 }
    );
  }
}

// Helper function to get audit logs
async function getAuditLogs(params: z.infer<typeof auditLogQuerySchema>) {
  const {
    page,
    limit,
    category,
    event,
    adminId,
    targetUserId,
    startDate,
    endDate,
    search,
  } = params;

  // Build where clause
  const where: any = {};
  
  if (category) where.category = category;
  if (event) where.event = event;
  if (adminId) where.adminId = adminId;
  if (targetUserId) where.targetUserId = targetUserId;
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }
  
  if (search) {
    where.OR = [
      { adminEmail: { contains: search, mode: 'insensitive' } },
      { targetUserEmail: { contains: search, mode: 'insensitive' } },
      { event: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Get total count for pagination
  const totalCount = await prisma.auditLog.count({ where });

  // Get paginated results
  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  // Get summary statistics
  const stats = await getAuditLogStats();

  return {
    logs,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page * limit < totalCount,
      hasPrev: page > 1,
    },
    stats,
  };
}

// Helper function to get security events
async function getSecurityEvents(params: z.infer<typeof securityEventQuerySchema>) {
  const {
    page,
    limit,
    event,
    severity,
    startDate,
    endDate,
    ip,
  } = params;

  // Build where clause
  const where: any = {};
  
  if (event) where.event = event;
  if (severity) where.severity = severity;
  if (ip) where.ip = ip;
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  // Get total count for pagination
  const totalCount = await prisma.securityEvent.count({ where });

  // Get paginated results
  const events = await prisma.securityEvent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  // Get security event statistics
  const securityStats = await getSecurityEventStats();

  return {
    events,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page * limit < totalCount,
      hasPrev: page > 1,
    },
    stats: securityStats,
  };
}

// Helper function to get audit log statistics
async function getAuditLogStats() {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalLogs,
    last24HoursCount,
    last7DaysCount,
    last30DaysCount,
    categoryBreakdown,
    eventBreakdown,
    topAdmins,
  ] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.count({ where: { createdAt: { gte: last24Hours } } }),
    prisma.auditLog.count({ where: { createdAt: { gte: last7Days } } }),
    prisma.auditLog.count({ where: { createdAt: { gte: last30Days } } }),
    prisma.auditLog.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    }),
    prisma.auditLog.groupBy({
      by: ['event'],
      _count: { event: true },
      orderBy: { _count: { event: 'desc' } },
      take: 10,
    }),
    prisma.auditLog.groupBy({
      by: ['adminEmail'],
      _count: { adminEmail: true },
      where: { adminEmail: { not: null } },
      orderBy: { _count: { adminEmail: 'desc' } },
      take: 5,
    }),
  ]);

  return {
    totalLogs,
    activityCounts: {
      last24Hours: last24HoursCount,
      last7Days: last7DaysCount,
      last30Days: last30DaysCount,
    },
    categoryBreakdown: categoryBreakdown.map(item => ({
      category: item.category,
      count: item._count.category,
    })),
    topEvents: eventBreakdown.map(item => ({
      event: item.event,
      count: item._count.event,
    })),
    topAdmins: topAdmins.map(item => ({
      adminEmail: item.adminEmail,
      count: item._count.adminEmail,
    })),
  };
}

// Helper function to get security event statistics
async function getSecurityEventStats() {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalEvents,
    last24HoursCount,
    last7DaysCount,
    severityBreakdown,
    eventBreakdown,
    topIPs,
  ] = await Promise.all([
    prisma.securityEvent.count(),
    prisma.securityEvent.count({ where: { createdAt: { gte: last24Hours } } }),
    prisma.securityEvent.count({ where: { createdAt: { gte: last7Days } } }),
    prisma.securityEvent.groupBy({
      by: ['severity'],
      _count: { severity: true },
      orderBy: { _count: { severity: 'desc' } },
    }),
    prisma.securityEvent.groupBy({
      by: ['event'],
      _count: { event: true },
      orderBy: { _count: { event: 'desc' } },
      take: 10,
    }),
    prisma.securityEvent.groupBy({
      by: ['ip'],
      _count: { ip: true },
      where: { ip: { not: null } },
      orderBy: { _count: { ip: 'desc' } },
      take: 10,
    }),
  ]);

  return {
    totalEvents,
    activityCounts: {
      last24Hours: last24HoursCount,
      last7Days: last7DaysCount,
    },
    severityBreakdown: severityBreakdown.map(item => ({
      severity: item.severity,
      count: item._count.severity,
    })),
    topEvents: eventBreakdown.map(item => ({
      event: item.event,
      count: item._count.event,
    })),
    topIPs: topIPs.map(item => ({
      ip: item.ip,
      count: item._count.ip,
    })),
  };
}

// Helper function to generate request IDs
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}