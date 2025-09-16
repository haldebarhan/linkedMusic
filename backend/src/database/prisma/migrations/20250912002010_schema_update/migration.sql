/*
  Warnings:

  - You are about to drop the column `category_id` on the `service_types` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "service_types" DROP CONSTRAINT "service_types_category_id_fkey";

-- AlterTable
ALTER TABLE "service_types" DROP COLUMN "category_id";

-- CreateTable
CREATE TABLE "category_service_types" (
    "category_id" INTEGER NOT NULL,
    "service_type_id" INTEGER NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_service_types_pkey" PRIMARY KEY ("category_id","service_type_id")
);

-- CreateTable
CREATE TABLE "announcement_categories" (
    "announcementId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "announcement_categories_pkey" PRIMARY KEY ("announcementId","categoryId")
);

-- CreateIndex
CREATE INDEX "category_service_types_service_type_id_idx" ON "category_service_types"("service_type_id");

-- CreateIndex
CREATE INDEX "announcement_categories_categoryId_idx" ON "announcement_categories"("categoryId");

-- AddForeignKey
ALTER TABLE "category_service_types" ADD CONSTRAINT "category_service_types_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_service_types" ADD CONSTRAINT "category_service_types_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "service_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_categories" ADD CONSTRAINT "announcement_categories_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_categories" ADD CONSTRAINT "announcement_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
