-- AlterTable
ALTER TABLE "User" ADD COLUMN     "stripeCustomerId" VARCHAR(255),
ADD COLUMN     "stripeSubscriptionId" VARCHAR(255);
