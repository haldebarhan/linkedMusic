/*
  Warnings:

  - You are about to drop the column `userId` on the `announcements` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ann_field_value_options" DROP CONSTRAINT "ann_field_value_options_annFieldValueId_fkey";

-- DropForeignKey
ALTER TABLE "ann_field_value_options" DROP CONSTRAINT "ann_field_value_options_optionId_fkey";

-- DropForeignKey
ALTER TABLE "ann_field_values" DROP CONSTRAINT "ann_field_values_announcementId_fkey";

-- DropForeignKey
ALTER TABLE "ann_field_values" DROP CONSTRAINT "ann_field_values_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "announcements" DROP CONSTRAINT "announcements_userId_fkey";

-- AlterTable
ALTER TABLE "announcements" DROP COLUMN "userId";

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ann_field_values" ADD CONSTRAINT "ann_field_values_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ann_field_values" ADD CONSTRAINT "ann_field_values_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ann_field_value_options" ADD CONSTRAINT "ann_field_value_options_annFieldValueId_fkey" FOREIGN KEY ("annFieldValueId") REFERENCES "ann_field_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ann_field_value_options" ADD CONSTRAINT "ann_field_value_options_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "field_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
