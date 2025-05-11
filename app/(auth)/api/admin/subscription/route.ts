// // app/api/admin/subscription/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { z } from "zod";
// import { prisma } from "@/lib/prisma";
// import { syncSubscriptionState, forceUpdatePlan } from "@/lib/subscription-sync";

// // Validation schema for admin update
// const adminUpdateSchema = z.object({
//   userId: z.string(),
//   plan: z.enum(["FREE", "PRO", "BUSINESS"]),
//   action: z.enum(["update", "sync"]),
//   adminKey: z.string(),
// });

// // Protect this route with a simple admin key
// // In production, you would use a proper authentication system
// const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "your-admin-key-here";

// export async function POST(req: NextRequest) {
//   try {
//     // Parse and validate request body
//     const body = await req.json();
//     const { userId, plan, action, adminKey } = adminUpdateSchema.parse(body);
    
//     // Validate admin key
//     if (adminKey !== ADMIN_API_KEY) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }
    
//     // Verify user exists
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: { id: true, plan: true },
//     });
    
//     if (!user) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }
    
//     let result;
    
//     // Perform requested action
//     if (action === "update") {
//       // Force update the plan and sync with Stripe
//       result = await forceUpdatePlan(userId, plan);
//     } else if (action === "sync") {
//       // Just sync existing plan with Stripe
//       result = await syncSubscriptionState(userId);
//     }
    
//     return NextResponse.json({ success: true, result });
//   } catch (error) {
//     console.error("Admin subscription error:", error);
    
//     if (error instanceof z.ZodError) {
//       return NextResponse.json(
//         { error: "Validation error", details: error.errors },
//         { status: 400 }
//       );
//     }
    
//     return NextResponse.json(
//       { error: "Failed to update subscription", message: (error as Error).message },
//       { status: 500 }
//     );
//   }
// }

// // GET to check a user's subscription status
// export async function GET(req: NextRequest) {
//   try {
//     const adminKey = req.nextUrl.searchParams.get("adminKey");
//     const userId = req.nextUrl.searchParams.get("userId");
    
//     // Validate admin key
//     if (adminKey !== ADMIN_API_KEY) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }
    
//     if (!userId) {
//       return NextResponse.json({ error: "userId is required" }, { status: 400 });
//     }
    
//     // Get user with subscription details
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: {
//         id: true,
//         email: true,
//         name: true,
//         plan: true,
//         planExpires: true,
//         planStarted: true,
//         planUpdated: true,
//         stripeCustomerId: true,
//         stripeSubscriptionId: true,
//       },
//     });
    
//     if (!user) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }
    
//     return NextResponse.json({ success: true, user });
//   } catch (error) {
//     console.error("Admin subscription check error:", error);
//     return NextResponse.json(
//       { error: "Failed to check subscription", message: (error as Error).message },
//       { status: 500 }
//     );
//   }
// }