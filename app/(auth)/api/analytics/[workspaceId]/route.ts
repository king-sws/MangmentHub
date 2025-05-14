// /app/(auth)/api/analytics/[workspaceId]/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const { workspaceId } = params;
    
    // Check if user has access to this workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { userId: session.user.id },
          { members: { some: { userId: session.user.id } } }
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
    
    if (!workspace) {
      return new NextResponse("Workspace not found", { status: 404 });
    }
    
    // Calculate workspace metrics
    const totalBoards = workspace.boards.length;
    
    let totalCards = 0;
    let completedCards = 0;
    const cardsByBoard: {
      [boardId: string]: {
        boardTitle: string;
        totalCards: number;
        completedCards: number;
      };
    } = {};
    const cardsByStatus = {
      BACKLOG: 0,
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0
    };
    
    // Calculate cards due this week
    const today = new Date();
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
    
    let cardsDueThisWeek = 0;
    
    workspace.boards.forEach(board => {
      cardsByBoard[board.id] = {
        boardTitle: board.title,
        totalCards: 0,
        completedCards: 0
      };
      
      board.lists.forEach(list => {
        list.cards.forEach(card => {
          totalCards++;
          cardsByBoard[board.id].totalCards++;
          
          if (card.completed) {
            completedCards++;
            cardsByBoard[board.id].completedCards++;
          }
          
          cardsByStatus[card.status]++;
          
          // Check if card is due this week
          if (card.dueDate && new Date(card.dueDate) <= endOfWeek && !card.completed) {
            cardsDueThisWeek++;
          }
        });
      });
    });
    
    // Calculate completion rates
    const workspaceCompletionRate = totalCards > 0 ? (completedCards / totalCards) * 100 : 0;
    
    const boardCompletionRates = Object.keys(cardsByBoard).map(boardId => {
      const board = cardsByBoard[boardId];
      return {
        boardId,
        boardTitle: board.boardTitle,
        completionRate: board.totalCards > 0 ? (board.completedCards / board.totalCards) * 100 : 0,
        totalCards: board.totalCards,
        completedCards: board.completedCards
      };
    });
    
    return NextResponse.json({
      overview: {
        totalBoards,
        totalCards,
        completedCards,
        workspaceCompletionRate,
        cardsDueThisWeek
      },
      boardCompletionRates,
      cardsByStatus,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("[WORKSPACE_ANALYTICS_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}