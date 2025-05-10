import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const getBoards = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const boards = await prisma.board.findMany({
    where: {
      workspace: {
        userId: session.user.id, // ✅ this is the correct way
      },
    },
    include: {
      workspace: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return boards;
};
