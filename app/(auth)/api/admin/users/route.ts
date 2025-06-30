/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { validateAdminAccess } from "@/lib/admin-auth";
import { auditLog } from "@/lib/audit-log";
import { auth } from "@/auth";

// Validation schemas
const usersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  plan: z.enum(["all", "FREE", "PRO", "BUSINESS"]).default("all"),
  role: z.enum(["all", "USER", "ADMIN"]).default("all"),
  sortBy: z.enum(["createdAt", "name", "email", "lastLogin", "plan", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  includeDeleted: z.boolean().default(false),
  adminKey: z.string().optional(),
});

const userCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  plan: z.enum(["FREE", "PRO", "BUSINESS"]).default("FREE"),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
  sendWelcomeEmail: z.boolean().default(true),
  adminKey: z.string().optional(),
});

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
      await auditLog.logSecurityEvent({
        event: 'UNAUTHORIZED_ADMIN_ACCESS',
        severity: 'HIGH',
        ip: clientIp,
        userAgent,
        details: {
          endpoint: '/api/admin/users',
          method: 'GET',
          error: adminValidation.error,
        },
        timestamp: new Date(),
      });
      
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
    const validatedQuery = usersQuerySchema.parse(queryParams);
    
    const {
      page,
      limit,
      search,
      plan,
      role,
      sortBy,
      sortOrder,
      includeDeleted,
    } = validatedQuery;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (plan !== 'all') {
      where.plan = plan;
    }
    
    if (role !== 'all') {
      where.role = role;
    }

    // Build order by
    const orderBy: any = {};
    if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'email') {
      orderBy.email = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          plan: true,
          planExpires: true,
          planStarted: true,
          planUpdated: true,
          role: true,
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
          _count: {
            select: {
              workspaces: true,
              chatMessages: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Log admin action
    await auditLog.logAdminAction({
      adminId: adminValidation.user!.id,
      adminEmail: adminValidation.user!.email,
      action: 'USERS_LIST_VIEW',
      changes: {
        operation: 'LIST_USERS',
        filters: { search, plan, role, sortBy, sortOrder },
        pagination: { page, limit },
        resultsCount: users.length,
      },
      timestamp: new Date(),
      ip: clientIp,
      userAgent,
    });

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      users: users.map(user => ({
        ...user,
        stats: {
          workspaceCount: user._count.workspaces,
          messageCount: user._count.chatMessages,
        },
        // Remove the _count field from response
        _count: undefined,
      })),
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
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
      error: 'Admin users query failed',
      details: {
        endpoint: '/api/admin/users',
        method: 'GET',
        error: (error as Error).message,
        stack: (error as Error).stack,
        ip: clientIp,
        userAgent,
        responseTime,
      },
      timestamp: new Date(),
    });

    console.error("Admin users query error:", error);

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
        error: "Failed to retrieve users",
        code: 'QUERY_ERROR',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
        requestId: generateRequestId(),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  try {
    const session = await auth();
    
    // Parse request body first to get adminKey if provided
    const body = await req.json();
    
    // Add admin key to headers if provided in body for validation
    if (body.adminKey) {
      req.headers.set('x-admin-key', body.adminKey);
    }
    
    // Validate admin access
    const adminValidation = await validateAdminAccess(req, session);
    if (!adminValidation.success) {
      await auditLog.logSecurityEvent({
        event: 'UNAUTHORIZED_ADMIN_ACCESS',
        severity: 'HIGH',
        ip: clientIp,
        userAgent,
        details: {
          endpoint: '/api/admin/users',
          method: 'POST',
          error: adminValidation.error,
        },
        timestamp: new Date(),
      });
      
      return NextResponse.json(
        { 
          error: adminValidation.error,
          code: 'UNAUTHORIZED_ACCESS',
          requestId: generateRequestId(),
        }, 
        { status: adminValidation.statusCode }
      );
    }

    // Validate request data
    const validatedData = userCreateSchema.parse(body);
    const { name, email, password, plan, role, sendWelcomeEmail } = validatedData;

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          error: "User with this email already exists",
          code: 'USER_EXISTS',
          requestId: generateRequestId(),
        }, 
        { status: 409 }
      );
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (password) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const bcrypt = require('bcryptjs');
      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        plan,
        role,
        planStarted: plan !== 'FREE' ? new Date() : undefined,
        emailVerified: new Date(), // Admin-created users are considered verified
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        plan: true,
        planExpires: true,
        planStarted: true,
        planUpdated: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log admin action
    await auditLog.logAdminAction({
      adminId: adminValidation.user!.id,
      adminEmail: adminValidation.user!.email,
      action: 'USER_CREATE',
      targetUserId: newUser.id,
      targetUserEmail: newUser.email,
      changes: {
        operation: 'CREATE_USER',
        userData: {
          name,
          email,
          plan,
          role,
          hasPassword: !!password,
        },
      },
      timestamp: new Date(),
      ip: clientIp,
      userAgent,
    });

    // TODO: Send welcome email if requested
    if (sendWelcomeEmail) {
      // Implement email sending logic here
      console.log(`Would send welcome email to ${email}`);
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      user: newUser,
      metadata: {
        requestId: generateRequestId(),
        responseTime,
        createdBy: adminValidation.user!.email,
        timestamp: new Date().toISOString(),
      },
    }, { status: 201 });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    await auditLog.logError({
      error: 'Admin user creation failed',
      details: {
        endpoint: '/api/admin/users',
        method: 'POST',
        error: (error as Error).message,
        stack: (error as Error).stack,
        ip: clientIp,
        userAgent,
        responseTime,
      },
      timestamp: new Date(),
    });

    console.error("Admin user creation error:", error);

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
        error: "Failed to create user",
        code: 'CREATION_ERROR',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
        requestId: generateRequestId(),
      },
      { status: 500 }
    );
  }
}

// Helper function
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}