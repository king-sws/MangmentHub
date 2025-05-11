// lib/plans.ts

// Plan types and limits
export type PlanType = 'FREE' | 'PRO' | 'BUSINESS';

// Define workspace limits per plan
export const WORKSPACE_LIMITS = {
  FREE: 1,
  PRO: 5,
  BUSINESS: Infinity,
};

// Define board limits per workspace
export const BOARD_LIMITS = {
  FREE: 3,
  PRO: 10,
  BUSINESS: Infinity,
};

// Define member limits per workspace
export const MEMBER_LIMITS = {
  FREE: 3,
  PRO: 10,
  BUSINESS: 50,
};

// Plan pricing (monthly)
export const PLAN_PRICES = {
  FREE: 0,
  PRO: 9.99,
  BUSINESS: 29.99,
};

// Plan features
export const PLAN_FEATURES = {
  FREE: [
    '1 Workspace',
    '3 Boards per workspace',
    '3 Members per workspace',
    'Basic task management',
  ],
  PRO: [
    '5 Workspaces',
    '10 Boards per workspace',
    '10 Members per workspace',
    'Advanced task management',
    'Calendar view',
    'Due date reminders',
  ],
  BUSINESS: [
    'Unlimited workspaces',
    'Unlimited boards',
    'Up to 50 members per workspace',
    'All PRO features',
    'Admin controls',
    'Analytics dashboard',
    'Priority support',
  ],
};

// Helper functions
export function getWorkspaceLimit(plan: PlanType): number {
  return WORKSPACE_LIMITS[plan] ?? WORKSPACE_LIMITS.FREE;
}

export function getBoardLimit(plan: PlanType): number {
  return BOARD_LIMITS[plan] ?? BOARD_LIMITS.FREE;
}

export function getMemberLimit(plan: PlanType): number {
  return MEMBER_LIMITS[plan] ?? MEMBER_LIMITS.FREE;
}

export function getPlanPrice(plan: PlanType): number {
  return PLAN_PRICES[plan] ?? PLAN_PRICES.FREE;
}

export function getPlanFeatures(plan: PlanType): string[] {
  return PLAN_FEATURES[plan] ?? PLAN_FEATURES.FREE;
}

// Check if a plan is active
export function isPlanActive(planExpires: Date | null): boolean {
  if (!planExpires) return false;
  return new Date() < new Date(planExpires);
}

// Determine effective plan based on subscription status
export function getEffectivePlan(plan: PlanType, planExpires: Date | null): PlanType {
  // If plan is FREE or plan is active, return the current plan
  if (plan === 'FREE' || isPlanActive(planExpires)) {
    return plan;
  }
  
  // If paid plan has expired, return FREE
  return 'FREE';
}