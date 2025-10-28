-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('ACTIVE', 'REMOVED', 'PENDING_REMOVAL');

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE';
