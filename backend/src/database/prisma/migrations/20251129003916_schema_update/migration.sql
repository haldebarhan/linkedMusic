-- CreateEnum
CREATE TYPE "Badge" AS ENUM ('STANDARD', 'BRONZE', 'SILVER', 'GOLD', 'VIP', 'VVIP');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "badge" "Badge" NOT NULL DEFAULT 'STANDARD';
