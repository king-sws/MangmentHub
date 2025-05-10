/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/stripe/verify-setup/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET(req: NextRequest) {
  try {
    // Only run this check with a special verification parameter
    const verify = req.nextUrl.searchParams.get("verify");
    if (verify !== "setup") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Environment variable checks
    const envChecks = {
      stripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
      stripePublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      stripePriceIdPro: !!process.env.STRIPE_PRICE_ID_PRO,
      stripePriceIdBusiness: !!process.env.STRIPE_PRICE_ID_BUSINESS,
      stripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      appUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      adminApiKey: !!process.env.ADMIN_API_KEY,
    };
    
    const missingEnvVars = Object.entries(envChecks)
      .filter(([_, exists]) => !exists)
      .map(([name]) => name);
    
    // Initialize Stripe if possible
    let stripeConnection = false;
    let priceProExists = false;
    let priceBusinessExists = false;
    
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: "2025-04-30.basil",
        });
        
        // Test connection
        const testConnection = await stripe.balance.retrieve();
        stripeConnection = !!testConnection;
        
        // Check if price IDs exist
        if (process.env.STRIPE_PRICE_ID_PRO) {
          try {
            const proPriceResult = await stripe.prices.retrieve(
              process.env.STRIPE_PRICE_ID_PRO
            );
            priceProExists = !!proPriceResult?.id;
          } catch (error) {
            console.error("Error retrieving PRO price:", error);
          }
        }
        
        if (process.env.STRIPE_PRICE_ID_BUSINESS) {
          try {
            const businessPriceResult = await stripe.prices.retrieve(
              process.env.STRIPE_PRICE_ID_BUSINESS
            );
            priceBusinessExists = !!businessPriceResult?.id;
          } catch (error) {
            console.error("Error retrieving BUSINESS price:", error);
          }
        }
      } catch (error) {
        console.error("Error connecting to Stripe:", error);
      }
    }
    
    return NextResponse.json({
      status: "ok",
      environment: {
        missingEnvVars,
        allEnvVarsPresent: missingEnvVars.length === 0,
      },
      stripe: {
        connection: stripeConnection,
        prices: {
          pro: priceProExists,
          business: priceBusinessExists,
        }
      },
      message: missingEnvVars.length > 0 
        ? `Missing environment variables: ${missingEnvVars.join(", ")}`
        : "All environment variables present",
      stripeMessage: !stripeConnection 
        ? "Could not connect to Stripe" 
        : "Connected to Stripe successfully",
    });
    
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify setup", message: (error as Error).message },
      { status: 500 }
    );
  }
}