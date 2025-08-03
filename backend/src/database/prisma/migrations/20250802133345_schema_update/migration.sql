-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN', 'PROVIDER');

-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('ACTIVATED', 'DESACTIVATED', 'SUSPENDED', 'REMOVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."ProfileStatus" AS ENUM ('VERIFIED', 'UNVERIFIED', 'PENDING_APPROVAL', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."ProfileType" AS ENUM ('STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "public"."FieldType" AS ENUM ('text', 'number', 'textarea', 'select', 'checkbox');

-- CreateEnum
CREATE TYPE "public"."AnnouncementStatus" AS ENUM ('PUBLISHED', 'DRAFT', 'ARCHIVED', 'PENDING_APPROVAL');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "status" "public"."Status" NOT NULL DEFAULT 'ACTIVATED',
    "profile_image" TEXT NOT NULL,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."profiles" (
    "id" SERIAL NOT NULL,
    "display_name" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "user_id" INTEGER NOT NULL,
    "status" "public"."ProfileStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "type" "public"."ProfileType" NOT NULL DEFAULT 'STANDARD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."files" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "profile_id" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."service_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category_id" INTEGER NOT NULL,
    "group_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parent_id" INTEGER,

    CONSTRAINT "service_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fields" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "public"."FieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible_in_search" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."field_options" (
    "id" SERIAL NOT NULL,
    "value" TEXT NOT NULL,
    "field_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServiceTypeField" (
    "serviceTypeId" INTEGER NOT NULL,
    "fieldId" INTEGER NOT NULL,

    CONSTRAINT "ServiceTypeField_pkey" PRIMARY KEY ("serviceTypeId","fieldId")
);

-- CreateTable
CREATE TABLE "public"."role_groups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."announcements" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "images" TEXT[],
    "serviceTypeId" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isHighlighted" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."AnnouncementStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "price" INTEGER,
    "location" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."favorites" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "announcementId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Conversation" (
    "id" SERIAL NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "announcementId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."custom_fields" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "type" "public"."FieldType" NOT NULL,
    "value" TEXT NOT NULL,
    "annoncementId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_uid_key" ON "public"."users"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "public"."users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "public"."profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "public"."categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "service_types_slug_key" ON "public"."service_types"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "role_groups_name_key" ON "public"."role_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_senderId_receiverId_announcementId_key" ON "public"."Conversation"("senderId", "receiverId", "announcementId");

-- AddForeignKey
ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."files" ADD CONSTRAINT "files_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_types" ADD CONSTRAINT "service_types_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."service_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_types" ADD CONSTRAINT "service_types_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."role_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_types" ADD CONSTRAINT "service_types_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."field_options" ADD CONSTRAINT "field_options_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "public"."fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServiceTypeField" ADD CONSTRAINT "ServiceTypeField_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "public"."service_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServiceTypeField" ADD CONSTRAINT "ServiceTypeField_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "public"."fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."announcements" ADD CONSTRAINT "announcements_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."announcements" ADD CONSTRAINT "announcements_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "public"."service_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."favorites" ADD CONSTRAINT "favorites_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "public"."announcements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "public"."announcements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."custom_fields" ADD CONSTRAINT "custom_fields_annoncementId_fkey" FOREIGN KEY ("annoncementId") REFERENCES "public"."announcements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
