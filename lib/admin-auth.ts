/* eslint-disable @typescript-eslint/no-unused-vars */
// lib/admin-auth.ts
import { NextRequest } from "next/server";
import { Session } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface AdminValidationResult {
  success: boolean;
  error?: string;
  statusCode?: number;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Admin API key validation schema
const adminKeySchema = z.object({
  key: z.string().min(32, "Admin key must be at least 32 characters"),
  permissions: z.array(z.string()).optional(),
});

// Get admin configuration from environment
const getAdminConfig = () => {
  const adminKey = process.env.ADMIN_API_KEY;
  const allowedAdminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  
  if (!adminKey) {
    throw new Error("ADMIN_API_KEY environment variable is required");
  }

  return {
    adminKey,
    allowedAdminEmails: allowedAdminEmails.map(email => email.trim()),
  };
};

/**
 * Validates admin access using multiple authentication methods
 */
export async function validateAdminAccess(
  req: NextRequest,
  session?: Session | null
): Promise<AdminValidationResult> {
  try {
    const config = getAdminConfig();
    
    // Method 1: API Key authentication (for service-to-service calls)
    const apiKey = req.headers.get("x-admin-key") || req.nextUrl.searchParams.get("adminKey");
    
    if (apiKey) {
      return validateApiKeyAccess(apiKey, config.adminKey);
    }

    // Method 2: Session-based authentication (for web interface)
    if (session?.user) {
      return await validateSessionAccess(session, config.allowedAdminEmails);
    }

    return {
      success: false,
      error: "Authentication required",
      statusCode: 401,
    };

  } catch (error) {
    console.error("Admin validation error:", error);
    return {
      success: false,
      error: "Authentication service unavailable",
      statusCode: 503,
    };
  }
}

/**
 * Validates API key access
 */
function validateApiKeyAccess(
  providedKey: string,
  expectedKey: string
): AdminValidationResult {
  // Use timing-safe comparison to prevent timing attacks
  const isValidKey = timingSafeEqual(providedKey, expectedKey);
  
  if (!isValidKey) {
    return {
      success: false,
      error: "Invalid admin key",
      statusCode: 401,
    };
  }

  return {
    success: true,
    user: {
      id: "system",
      email: "system@admin",
      role: "ADMIN",
    },
  };
}

/**
 * Validates session-based access
 */
async function validateSessionAccess(
  session: Session,
  allowedEmails: string[]
): Promise<AdminValidationResult> {
  const userEmail = session.user?.email;
  
  if (!userEmail) {
    return {
      success: false,
      error: "User email not found in session",
      statusCode: 401,
    };
  }

  // Check if user is in allowed admin emails list
  const isAllowedEmail = allowedEmails.length === 0 || allowedEmails.includes(userEmail);
  
  if (!isAllowedEmail) {
    return {
      success: false,
      error: "Access denied: insufficient permissions",
      statusCode: 403,
    };
  }

  // Get user from database to verify admin role
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    return {
      success: false,
      error: "User not found",
      statusCode: 404,
    };
  }

  if (user.role !== "ADMIN") {
    return {
      success: false,
      error: "Access denied: admin role required",
      statusCode: 403,
    };
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Check specific admin permissions
 */
export async function hasAdminPermission(
  req: NextRequest,
  session: Session | null,
  permission: string
): Promise<boolean> {
  const validation = await validateAdminAccess(req, session);
  
  if (!validation.success) {
    return false;
  }

  // For now, all admins have all permissions
  // In the future, you could implement role-based permissions
  return true;
}

/**
 * Admin permission middleware
 */
export function requireAdminPermission(permission: string) {
  return async (req: NextRequest, session: Session | null) => {
    const hasPermission = await hasAdminPermission(req, session, permission);
    
    if (!hasPermission) {
      throw new Error(`Admin permission required: ${permission}`);
    }
  };
}