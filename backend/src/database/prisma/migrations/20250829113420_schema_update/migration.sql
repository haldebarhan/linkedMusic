/*
  Warnings:

  - You are about to drop the column `data` on the `announcements` table. All the data in the column will be lost.
  - You are about to drop the column `field_id` on the `field_options` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `fields` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `fields` table. All the data in the column will be lost.
  - You are about to drop the column `required` on the `fields` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `fields` table. All the data in the column will be lost.
  - You are about to drop the column `visible_in_search` on the `fields` table. All the data in the column will be lost.
  - You are about to drop the `service_type_fields` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[fieldId,value]` on the table `field_options` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[key]` on the table `fields` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fieldId` to the `field_options` table without a default value. This is not possible if the table is not empty.
  - Added the required column `label` to the `field_options` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inputType` to the `fields` table without a default value. This is not possible if the table is not empty.
  - Added the required column `key` to the `fields` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."FieldInputType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'SELECT', 'CHECKBOX', 'RADIO', 'MULTISELECT', 'TOGGLE', 'RANGE');

-- DropForeignKey
ALTER TABLE "public"."announcements" DROP CONSTRAINT "announcements_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."field_options" DROP CONSTRAINT "field_options_field_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."service_type_fields" DROP CONSTRAINT "service_type_fields_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "public"."service_type_fields" DROP CONSTRAINT "service_type_fields_serviceTypeId_fkey";

-- AlterTable
ALTER TABLE "public"."announcements" DROP COLUMN "data",
ADD COLUMN     "categoryId" INTEGER,
ADD COLUMN     "userId" INTEGER;

-- AlterTable
ALTER TABLE "public"."field_options" DROP COLUMN "field_id",
ADD COLUMN     "fieldId" INTEGER NOT NULL,
ADD COLUMN     "label" TEXT NOT NULL,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."fields" DROP COLUMN "name",
DROP COLUMN "order",
DROP COLUMN "required",
DROP COLUMN "type",
DROP COLUMN "visible_in_search",
ADD COLUMN     "filterable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "inputType" "public"."FieldInputType" NOT NULL,
ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "placeholder" TEXT,
ADD COLUMN     "searchable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "unit" TEXT;

-- DropTable
DROP TABLE "public"."service_type_fields";

-- CreateTable
CREATE TABLE "public"."ServiceTypeField" (
    "serviceTypeId" INTEGER NOT NULL,
    "fieldId" INTEGER NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "visibleInForm" BOOLEAN NOT NULL DEFAULT true,
    "visibleInFilter" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ServiceTypeField_pkey" PRIMARY KEY ("serviceTypeId","fieldId")
);

-- CreateTable
CREATE TABLE "public"."ann_field_values" (
    "id" BIGSERIAL NOT NULL,
    "announcementId" INTEGER NOT NULL,
    "fieldId" INTEGER NOT NULL,
    "valueText" TEXT,
    "valueNumber" DOUBLE PRECISION,
    "valueBoolean" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ann_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ann_field_value_options" (
    "id" BIGSERIAL NOT NULL,
    "annFieldValueId" BIGINT NOT NULL,
    "optionId" INTEGER NOT NULL,

    CONSTRAINT "ann_field_value_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ann_field_values_fieldId_idx" ON "public"."ann_field_values"("fieldId");

-- CreateIndex
CREATE INDEX "ann_field_values_fieldId_valueBoolean_idx" ON "public"."ann_field_values"("fieldId", "valueBoolean");

-- CreateIndex
CREATE INDEX "ann_field_values_fieldId_valueNumber_idx" ON "public"."ann_field_values"("fieldId", "valueNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ann_field_values_announcementId_fieldId_key" ON "public"."ann_field_values"("announcementId", "fieldId");

-- CreateIndex
CREATE INDEX "ann_field_value_options_optionId_idx" ON "public"."ann_field_value_options"("optionId");

-- CreateIndex
CREATE UNIQUE INDEX "ann_field_value_options_annFieldValueId_optionId_key" ON "public"."ann_field_value_options"("annFieldValueId", "optionId");

-- CreateIndex
CREATE INDEX "announcements_serviceTypeId_idx" ON "public"."announcements"("serviceTypeId");

-- CreateIndex
CREATE INDEX "announcements_categoryId_idx" ON "public"."announcements"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "field_options_fieldId_value_key" ON "public"."field_options"("fieldId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "fields_key_key" ON "public"."fields"("key");

-- AddForeignKey
ALTER TABLE "public"."field_options" ADD CONSTRAINT "field_options_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "public"."fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServiceTypeField" ADD CONSTRAINT "ServiceTypeField_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "public"."service_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServiceTypeField" ADD CONSTRAINT "ServiceTypeField_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "public"."fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."announcements" ADD CONSTRAINT "announcements_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."announcements" ADD CONSTRAINT "announcements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ann_field_values" ADD CONSTRAINT "ann_field_values_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "public"."announcements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ann_field_values" ADD CONSTRAINT "ann_field_values_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "public"."fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ann_field_value_options" ADD CONSTRAINT "ann_field_value_options_annFieldValueId_fkey" FOREIGN KEY ("annFieldValueId") REFERENCES "public"."ann_field_values"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ann_field_value_options" ADD CONSTRAINT "ann_field_value_options_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "public"."field_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
