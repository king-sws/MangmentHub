-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PRO', 'BUSINESS');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "planExpires" TIMESTAMP(3),
ADD COLUMN     "planStarted" TIMESTAMP(3),
ADD COLUMN     "planUpdated" TIMESTAMP(3);
