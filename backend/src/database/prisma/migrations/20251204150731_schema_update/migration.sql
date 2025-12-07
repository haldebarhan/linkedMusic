-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE 'JEKO';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "external_id" TEXT;
