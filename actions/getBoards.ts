import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const getBoards = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Calculate date 7 days ago for recent activity
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const boards = await prisma.board.findMany({
    where: {
      workspace: {
        userId: session.user.id,
      },
    },
    include: {
      workspace: true,
      _count: {
        select: { 
          lists: true 
        },
      },
      // Include recent activity from cards
      lists: {
        include: {
          cards: {
            where: {
              OR: [
                { updatedAt: { gte: sevenDaysAgo } },
                { createdAt: { gte: sevenDaysAgo } },
              ],
            },
            select: {
              id: true,
              updatedAt: true,
              createdAt: true,
              title: true,
            },
            orderBy: {
              updatedAt: "desc",
            },
          },
          _count: {
            select: {
              cards: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return boards;
};
