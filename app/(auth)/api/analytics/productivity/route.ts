// /app/(auth)/api/analytics/productivity/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    const url = new URL(req.url);
    const startDateParam = url.searchParams.get("startDate");
    const endDateParam = url.searchParams.get("endDate");

    // Set default date range to last 30 days if not provided
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam 
      ? new Date(startDateParam) 
      : new Date(new Date().setDate(endDate.getDate() - 30));

    // Find all cards updated or created by user in date range
    const userCards = await prisma.card.findMany({
      where: {
        OR: [
          {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            assignees: { some: { id: userId } },
          },
          {
            updatedAt: {
              gte: startDate,
              lte: endDate,
            },
            completed: true,
            assignees: { some: { id: userId } },
          },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Generate a date range array to ensure all dates are represented
    const dateRange: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dateRange.push(new Date(currentDate).toISOString().split("T")[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Initialize productivity data
    const productivityByDate: Record<string, { tasksCreated: number; tasksCompleted: number }> = {};
    
    dateRange.forEach((date) => {
      productivityByDate[date] = {
        tasksCreated: 0,
        tasksCompleted: 0,
      };
    });

    // Count tasks created by date
    userCards.forEach((card) => {
      const createdDate = card.createdAt.toISOString().split("T")[0];
      if (productivityByDate[createdDate]) {
        productivityByDate[createdDate].tasksCreated += 1;
      }

      // If card is completed and completion date is within range
      if (card.completed && card.updatedAt) {
        const completedDate = card.updatedAt.toISOString().split("T")[0];
        if (productivityByDate[completedDate]) {
          productivityByDate[completedDate].tasksCompleted += 1;
        }
      }
    });

    // Convert to array format for chart
    const dailyProductivity = Object.keys(productivityByDate).map((date) => ({
      date,
      tasksCreated: productivityByDate[date].tasksCreated,
      tasksCompleted: productivityByDate[date].tasksCompleted,
    }));

    return NextResponse.json({
      dailyProductivity,
      totalTasksCreated: dailyProductivity.reduce(
        (sum, day) => sum + day.tasksCreated,
        0
      ),
      totalTasksCompleted: dailyProductivity.reduce(
        (sum, day) => sum + day.tasksCompleted,
        0
      ),
      timeRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("[PRODUCTIVITY_ANALYTICS_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}