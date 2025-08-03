/*
  Warnings:

  - You are about to drop the `Conversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceTypeField` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Conversation" DROP CONSTRAINT "Conversation_announcementId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Conversation" DROP CONSTRAINT "Conversation_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Conversation" DROP CONSTRAINT "Conversation_senderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ServiceTypeField" DROP CONSTRAINT "ServiceTypeField_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ServiceTypeField" DROP CONSTRAINT "ServiceTypeField_serviceTypeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."messages" DROP CONSTRAINT "messages_conversationId_fkey";

-- DropTable
DROP TABLE "public"."Conversation";

-- DropTable
DROP TABLE "public"."ServiceTypeField";

-- CreateTable
CREATE TABLE "public"."service_type_fields" (
    "serviceTypeId" INTEGER NOT NULL,
    "fieldId" INTEGER NOT NULL,

    CONSTRAINT "service_type_fields_pkey" PRIMARY KEY ("serviceTypeId","fieldId")
);

-- CreateTable
CREATE TABLE "public"."conversations" (
    "id" SERIAL NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "announcementId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."styles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "styles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversations_senderId_receiverId_announcementId_key" ON "public"."conversations"("senderId", "receiverId", "announcementId");

-- CreateIndex
CREATE UNIQUE INDEX "styles_name_key" ON "public"."styles"("name");

-- AddForeignKey
ALTER TABLE "public"."service_type_fields" ADD CONSTRAINT "service_type_fields_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "public"."service_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_type_fields" ADD CONSTRAINT "service_type_fields_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "public"."fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "public"."announcements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
