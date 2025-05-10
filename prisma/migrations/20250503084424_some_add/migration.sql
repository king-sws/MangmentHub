/*
  Warnings:

  - Changed the type of `role` on the `Invitation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `role` on the `WorkspaceMember` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- AlterTable
ALTER TABLE "Invitation" DROP COLUMN "role",
ADD COLUMN     "role" "WorkspaceRole" NOT NULL;

-- AlterTable
ALTER TABLE "WorkspaceMember" DROP COLUMN "role",
ADD COLUMN     "role" "WorkspaceRole" NOT NULL;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
