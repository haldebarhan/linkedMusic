/*
  Warnings:

  - You are about to drop the column `announcementId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `providerRef` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionId` on the `payments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[reference]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `amount` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `planId` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reference` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_announcementId_fkey";

-- DropIndex
DROP INDEX "payments_announcementId_purpose_status_idx";

-- DropIndex
DROP INDEX "payments_subscriptionId_idx";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "announcementId",
DROP COLUMN "metadata",
DROP COLUMN "providerRef",
DROP COLUMN "subscriptionId",
ADD COLUMN     "amount" INTEGER NOT NULL,
ADD COLUMN     "planId" INTEGER NOT NULL,
ADD COLUMN     "reference" TEXT NOT NULL,
ALTER COLUMN "currency" SET DEFAULT 'XOF',
ALTER COLUMN "purpose" SET DEFAULT 'SUBSCRIPTION';

-- CreateIndex
CREATE UNIQUE INDEX "payments_reference_key" ON "payments"("reference");

-- CreateIndex
CREATE INDEX "payments_purpose_status_idx" ON "payments"("purpose", "status");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
