// /app/(auth)/api/analytics/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get user's workspaces
    const workspaces = await prisma.workspace.findMany({
      where: {
        OR: [
          { userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        boards: {
          include: {
            lists: {
              include: {
                cards: true
              }
            }
          }
        }
      }
    });
    
    // Calculate basic metrics
    const totalWorkspaces = workspaces.length;
    const totalBoards = workspaces.reduce((acc, workspace) => acc + workspace.boards.length, 0);
    
    let totalCards = 0;
    let completedCards = 0;
    
    workspaces.forEach(workspace => {
      workspace.boards.forEach(board => {
        board.lists.forEach(list => {
          totalCards += list.cards.length;
          completedCards += list.cards.filter(card => card.completed).length;
        });
      });
    });
    
    // Calculate completion rate
    const completionRate = totalCards > 0 ? (completedCards / totalCards) * 100 : 0;
    
    // Get cards by status
    const cardsByStatus = {
      BACKLOG: 0,
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0
    };
    
    workspaces.forEach(workspace => {
      workspace.boards.forEach(board => {
        board.lists.forEach(list => {
          list.cards.forEach(card => {
            cardsByStatus[card.status]++;
          });
        });
      });
    });
    
    return NextResponse.json({
      overview: {
        totalWorkspaces,
        totalBoards,
        totalCards,
        completedCards,
        completionRate
      },
      cardsByStatus,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("[ANALYTICS_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}