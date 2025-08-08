/*
  Warnings:

  - Added the required column `categoryId` to the `topics` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."topics" ADD COLUMN     "categoryId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."TopicCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TopicCategory_name_key" ON "public"."TopicCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TopicCategory_slug_key" ON "public"."TopicCategory"("slug");

-- AddForeignKey
ALTER TABLE "public"."topics" ADD CONSTRAINT "topics_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."TopicCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
