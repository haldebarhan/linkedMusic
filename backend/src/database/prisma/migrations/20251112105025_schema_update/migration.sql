/*
  Warnings:

  - A unique constraint covering the columns `[contact_request_id]` on the table `conversations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ContactRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELED');

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "contact_request_id" INTEGER;

-- CreateTable
CREATE TABLE "contact_requests" (
    "id" SERIAL NOT NULL,
    "announcement_id" INTEGER NOT NULL,
    "requester_id" INTEGER NOT NULL,
    "message" TEXT,
    "status" "ContactRequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "responded_at" TIMESTAMP(3),
    "conversationId" INTEGER,

    CONSTRAINT "contact_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_requests_announcement_id_status_idx" ON "contact_requests"("announcement_id", "status");

-- CreateIndex
CREATE INDEX "contact_requests_requester_id_idx" ON "contact_requests"("requester_id");

-- CreateIndex
CREATE UNIQUE INDEX "contact_requests_announcement_id_requester_id_key" ON "contact_requests"("announcement_id", "requester_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_contact_request_id_key" ON "conversations"("contact_request_id");

-- AddForeignKey
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_contact_request_id_fkey" FOREIGN KEY ("contact_request_id") REFERENCES "contact_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
