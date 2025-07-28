/*
  Warnings:

  - Added the required column `updatedAt` to the `field_options` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `fields` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `service_types` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "field_options" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "fields" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "service_types" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "group_id" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "RoleGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoleGroup_name_key" ON "RoleGroup"("name");

-- AddForeignKey
ALTER TABLE "service_types" ADD CONSTRAINT "service_types_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "RoleGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
