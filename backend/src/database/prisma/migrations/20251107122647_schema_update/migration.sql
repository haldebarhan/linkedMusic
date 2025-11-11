/*
  Warnings:

  - You are about to drop the column `valueBoolean` on the `ann_field_values` table. All the data in the column will be lost.
  - You are about to drop the column `valueNumber` on the `ann_field_values` table. All the data in the column will be lost.
  - You are about to drop the column `valueText` on the `ann_field_values` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `announcements` table. All the data in the column will be lost.
  - You are about to drop the column `serviceTypeId` on the `announcements` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `announcements` table. All the data in the column will be lost.
  - The primary key for the `category_fields` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `categoryId` on the `category_fields` table. All the data in the column will be lost.
  - You are about to drop the column `fieldId` on the `category_fields` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `field_options` table. All the data in the column will be lost.
  - You are about to drop the column `fieldId` on the `field_options` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `field_options` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `fields` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `fields` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `planId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the `TopicCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `announcement_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `category_service_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `comment_likes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `comment_reports` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `custom_fields` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `favorite_topics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `replies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reply_likes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reply_reports` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role_groups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `topics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `watch_topics` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[field_id,value]` on the table `field_options` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `announcements` table without a default value. This is not possible if the table is not empty.
  - Made the column `categoryId` on table `announcements` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `category_id` to the `category_fields` table without a default value. This is not possible if the table is not empty.
  - Added the required column `field_id` to the `category_fields` table without a default value. This is not possible if the table is not empty.
  - Added the required column `field_id` to the `field_options` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `field_options` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `fields` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "HighlightLevel" AS ENUM ('STANDARD', 'PRO', 'PREMIUM', 'VIP');

-- AlterEnum
ALTER TYPE "AnnouncementStatus" ADD VALUE 'REJECTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FieldInputType" ADD VALUE 'DATE';
ALTER TYPE "FieldInputType" ADD VALUE 'FILE';

-- DropForeignKey
ALTER TABLE "announcement_categories" DROP CONSTRAINT "announcement_categories_announcementId_fkey";

-- DropForeignKey
ALTER TABLE "announcement_categories" DROP CONSTRAINT "announcement_categories_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "announcements" DROP CONSTRAINT "announcements_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "announcements" DROP CONSTRAINT "announcements_serviceTypeId_fkey";

-- DropForeignKey
ALTER TABLE "category_fields" DROP CONSTRAINT "category_fields_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "category_fields" DROP CONSTRAINT "category_fields_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "category_service_types" DROP CONSTRAINT "category_service_types_category_id_fkey";

-- DropForeignKey
ALTER TABLE "category_service_types" DROP CONSTRAINT "category_service_types_service_type_id_fkey";

-- DropForeignKey
ALTER TABLE "comment_likes" DROP CONSTRAINT "comment_likes_commentId_fkey";

-- DropForeignKey
ALTER TABLE "comment_likes" DROP CONSTRAINT "comment_likes_userId_fkey";

-- DropForeignKey
ALTER TABLE "comment_reports" DROP CONSTRAINT "comment_reports_commentId_fkey";

-- DropForeignKey
ALTER TABLE "comment_reports" DROP CONSTRAINT "comment_reports_userId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_authorId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_topicId_fkey";

-- DropForeignKey
ALTER TABLE "custom_fields" DROP CONSTRAINT "custom_fields_annoncementId_fkey";

-- DropForeignKey
ALTER TABLE "favorite_topics" DROP CONSTRAINT "favorite_topics_topicId_fkey";

-- DropForeignKey
ALTER TABLE "favorite_topics" DROP CONSTRAINT "favorite_topics_userId_fkey";

-- DropForeignKey
ALTER TABLE "field_options" DROP CONSTRAINT "field_options_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_planId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_userId_fkey";

-- DropForeignKey
ALTER TABLE "replies" DROP CONSTRAINT "replies_authorId_fkey";

-- DropForeignKey
ALTER TABLE "replies" DROP CONSTRAINT "replies_commentId_fkey";

-- DropForeignKey
ALTER TABLE "reply_likes" DROP CONSTRAINT "reply_likes_replyId_fkey";

-- DropForeignKey
ALTER TABLE "reply_likes" DROP CONSTRAINT "reply_likes_userId_fkey";

-- DropForeignKey
ALTER TABLE "reply_reports" DROP CONSTRAINT "reply_reports_replyId_fkey";

-- DropForeignKey
ALTER TABLE "reply_reports" DROP CONSTRAINT "reply_reports_userId_fkey";

-- DropForeignKey
ALTER TABLE "service_types" DROP CONSTRAINT "service_types_group_id_fkey";

-- DropForeignKey
ALTER TABLE "service_types" DROP CONSTRAINT "service_types_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "topics" DROP CONSTRAINT "topics_authorId_fkey";

-- DropForeignKey
ALTER TABLE "topics" DROP CONSTRAINT "topics_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "watch_topics" DROP CONSTRAINT "watch_topics_topicId_fkey";

-- DropForeignKey
ALTER TABLE "watch_topics" DROP CONSTRAINT "watch_topics_userId_fkey";

-- DropIndex
DROP INDEX "ann_field_values_fieldId_valueBoolean_idx";

-- DropIndex
DROP INDEX "ann_field_values_fieldId_valueNumber_idx";

-- DropIndex
DROP INDEX "announcements_serviceTypeId_idx";

-- DropIndex
DROP INDEX "field_options_fieldId_value_key";

-- DropIndex
DROP INDEX "payments_userId_status_purpose_idx";

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'XOF';

-- AlterTable
ALTER TABLE "ann_field_values" DROP COLUMN "valueBoolean",
DROP COLUMN "valueNumber",
DROP COLUMN "valueText",
ADD COLUMN     "value_boolean" BOOLEAN,
ADD COLUMN     "value_date" TIMESTAMP(3),
ADD COLUMN     "value_json" JSONB,
ADD COLUMN     "value_number" DOUBLE PRECISION,
ADD COLUMN     "value_text" TEXT;

-- AlterTable
ALTER TABLE "announcements" DROP COLUMN "createdAt",
DROP COLUMN "serviceTypeId",
DROP COLUMN "updatedAt",
ADD COLUMN     "audios" TEXT[],
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "highlightLevel" "HighlightLevel" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "negotiable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "price_unit" TEXT,
ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "videos" TEXT[],
ALTER COLUMN "categoryId" SET NOT NULL;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "category_fields" DROP CONSTRAINT "category_fields_pkey",
DROP COLUMN "categoryId",
DROP COLUMN "fieldId",
ADD COLUMN     "category_id" INTEGER NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "default_value" JSONB,
ADD COLUMN     "field_id" INTEGER NOT NULL,
ADD COLUMN     "visible_in_list" BOOLEAN NOT NULL DEFAULT true,
ADD CONSTRAINT "category_fields_pkey" PRIMARY KEY ("category_id", "field_id");

-- AlterTable
ALTER TABLE "field_options" DROP COLUMN "createdAt",
DROP COLUMN "fieldId",
DROP COLUMN "updatedAt",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "field_id" INTEGER NOT NULL,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "fields" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dependsOn" TEXT,
ADD COLUMN     "external_table" TEXT,
ADD COLUMN     "helpText" TEXT,
ADD COLUMN     "maxLength" INTEGER,
ADD COLUMN     "maxValue" DOUBLE PRECISION,
ADD COLUMN     "minLength" INTEGER,
ADD COLUMN     "minValue" DOUBLE PRECISION,
ADD COLUMN     "pattern" TEXT,
ADD COLUMN     "required" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showWhen" TEXT,
ADD COLUMN     "sortable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "filterable" SET DEFAULT false,
ALTER COLUMN "searchable" SET DEFAULT false;

-- AlterTable
ALTER TABLE "files" ADD COLUMN     "file_size" INTEGER,
ADD COLUMN     "mime_type" TEXT;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "createdAt",
DROP COLUMN "planId",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "plan_id" INTEGER,
ADD COLUMN     "provider_data" JSONB,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "city" TEXT;

-- DropTable
DROP TABLE "TopicCategory";

-- DropTable
DROP TABLE "announcement_categories";

-- DropTable
DROP TABLE "category_service_types";

-- DropTable
DROP TABLE "comment_likes";

-- DropTable
DROP TABLE "comment_reports";

-- DropTable
DROP TABLE "comments";

-- DropTable
DROP TABLE "custom_fields";

-- DropTable
DROP TABLE "favorite_topics";

-- DropTable
DROP TABLE "replies";

-- DropTable
DROP TABLE "reply_likes";

-- DropTable
DROP TABLE "reply_reports";

-- DropTable
DROP TABLE "role_groups";

-- DropTable
DROP TABLE "service_types";

-- DropTable
DROP TABLE "topics";

-- DropTable
DROP TABLE "watch_topics";

-- DropEnum
DROP TYPE "FieldType";

-- DropEnum
DROP TYPE "ProfileStatus";

-- DropEnum
DROP TYPE "ProfileType";

-- CreateTable
CREATE TABLE "music_styles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "music_styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instruments" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instruments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "languages" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "software" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "software_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "music_styles_name_key" ON "music_styles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "music_styles_slug_key" ON "music_styles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "instruments_name_key" ON "instruments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "instruments_slug_key" ON "instruments"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "languages_name_key" ON "languages"("name");

-- CreateIndex
CREATE UNIQUE INDEX "languages_code_key" ON "languages"("code");

-- CreateIndex
CREATE UNIQUE INDEX "software_name_key" ON "software"("name");

-- CreateIndex
CREATE UNIQUE INDEX "software_slug_key" ON "software"("slug");

-- CreateIndex
CREATE INDEX "ann_field_values_fieldId_value_boolean_idx" ON "ann_field_values"("fieldId", "value_boolean");

-- CreateIndex
CREATE INDEX "ann_field_values_fieldId_value_number_idx" ON "ann_field_values"("fieldId", "value_number");

-- CreateIndex
CREATE INDEX "announcements_ownerId_idx" ON "announcements"("ownerId");

-- CreateIndex
CREATE INDEX "announcements_created_at_idx" ON "announcements"("created_at");

-- CreateIndex
CREATE INDEX "announcements_status_isPublished_idx" ON "announcements"("status", "isPublished");

-- CreateIndex
CREATE INDEX "category_fields_category_id_idx" ON "category_fields"("category_id");

-- CreateIndex
CREATE INDEX "category_fields_field_id_idx" ON "category_fields"("field_id");

-- CreateIndex
CREATE INDEX "field_options_field_id_idx" ON "field_options"("field_id");

-- CreateIndex
CREATE UNIQUE INDEX "field_options_field_id_value_key" ON "field_options"("field_id", "value");

-- CreateIndex
CREATE INDEX "fields_key_idx" ON "fields"("key");

-- CreateIndex
CREATE INDEX "files_user_id_idx" ON "files"("user_id");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "messages_readAt_idx" ON "messages"("readAt");

-- CreateIndex
CREATE INDEX "payments_user_id_status_purpose_idx" ON "payments"("user_id", "status", "purpose");

-- CreateIndex
CREATE INDEX "payments_created_at_idx" ON "payments"("created_at");

-- AddForeignKey
ALTER TABLE "field_options" ADD CONSTRAINT "field_options_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_fields" ADD CONSTRAINT "category_fields_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_fields" ADD CONSTRAINT "category_fields_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "SubscriptionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
