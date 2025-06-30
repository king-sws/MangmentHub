/* eslint-disable @typescript-eslint/no-explicit-any */
// types/admin.ts
export interface AdminUser {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT';
  permissions: AdminPermission[];
  createdAt: Date;
  lastLogin?: Date;
}

export interface AdminPermission {
  resource: string;
  actions: ('read' | 'write' | 'delete' | 'admin')[];
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  action: string;
  resource: string;
  resourceId: string;
  previousState?: any;
  newState?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SubscriptionUpdateRequest {
  userId: string;
  plan: 'FREE' | 'PRO' | 'BUSINESS';
  action: 'update' | 'sync' | 'cancel' | 'reactivate';
  reason?: string;
  effectiveDate?: string;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
  sendNotification?: boolean;
}

export interface AdminValidationResult {
  success: boolean;
  error?: string;
  statusCode?: number;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface SubscriptionSyncResult {
  success: boolean;
  message: string;
  subscriptionId?: string;
  user?: {
    id: string;
    email: string;
    plan: string;
    planExpires?: Date;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
}