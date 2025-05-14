// lib/env.ts

/**
 * Environment variables configuration
 * 
 * This file centralizes access to environment variables and ensures
 * they're properly validated at startup
 */

// Function to get required server-only environment variables
function getServerEnv(key: string): string {
  const value = process.env[key];
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required server environment variable: ${key}`);
  }
  return value || '';
}

// Function to get client-side environment variables
function getClientEnv(key: string): string {
  const value = process.env[`NEXT_PUBLIC_${key}`];
  return value || '';
}

// Server-only environment variables
export const serverEnv = {
  STRIPE_SECRET_KEY: getServerEnv('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: getServerEnv('STRIPE_WEBHOOK_SECRET'),
  STRIPE_PRICE_ID_PRO: getServerEnv('STRIPE_PRICE_ID_PRO'),
  STRIPE_PRICE_ID_BUSINESS: getServerEnv('STRIPE_PRICE_ID_BUSINESS'),
  DATABASE_URL: getServerEnv('DATABASE_URL'),
};

// Client-side environment variables
export const clientEnv = {
  STRIPE_PUBLISHABLE_KEY: getClientEnv('STRIPE_PUBLISHABLE_KEY'),
  APP_URL: getClientEnv('APP_URL') || (typeof window !== 'undefined' ? window.location.origin : ''),
};

// Validate environment variables on server startup
export function validateEnv(): void {
  // Only validate in production to avoid development hassles
  if (process.env.NODE_ENV !== 'production') return;

  const requiredServerVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRICE_ID_PRO',
    'STRIPE_PRICE_ID_BUSINESS',
  ];

  const requiredClientVars = [
    'STRIPE_PUBLISHABLE_KEY',
  ];

  // Check server variables
  const missingServerVars = requiredServerVars.filter(
    (key) => !process.env[key]
  );

  // Check client variables
  const missingClientVars = requiredClientVars.filter(
    (key) => !process.env[`NEXT_PUBLIC_${key}`]
  );

  // Report missing variables
  if (missingServerVars.length > 0 || missingClientVars.length > 0) {
    console.error(`
      Missing required environment variables:
      ${missingServerVars.map((key) => `- ${key}`).join('\n      ')}
      ${missingClientVars.map((key) => `- NEXT_PUBLIC_${key}`).join('\n      ')}
    `);

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing required environment variables');
    }
  }
}