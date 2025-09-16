/*
  Warnings:

  - You are about to drop the `ServiceTypeField` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ServiceTypeField" DROP CONSTRAINT "ServiceTypeField_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ServiceTypeField" DROP CONSTRAINT "ServiceTypeField_serviceTypeId_fkey";

-- DropTable
DROP TABLE "public"."ServiceTypeField";

-- CreateTable
CREATE TABLE "public"."category_fields" (
    "categoryId" INTEGER NOT NULL,
    "fieldId" INTEGER NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "visibleInFilter" BOOLEAN NOT NULL DEFAULT true,
    "visibleInForm" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "category_fields_pkey" PRIMARY KEY ("categoryId","fieldId")
);

-- AddForeignKey
ALTER TABLE "public"."category_fields" ADD CONSTRAINT "category_fields_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."category_fields" ADD CONSTRAINT "category_fields_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "public"."fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;
