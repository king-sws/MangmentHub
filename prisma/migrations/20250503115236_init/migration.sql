/*
  Warnings:

  - Changed the type of `role` on the `Invitation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `role` on the `WorkspaceMember` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Invitation" DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "WorkspaceMember" DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL;

-- DropEnum
DROP TYPE "WorkspaceRole";
