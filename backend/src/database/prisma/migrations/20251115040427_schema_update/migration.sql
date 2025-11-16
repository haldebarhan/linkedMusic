-- CreateTable
CREATE TABLE "banner_slides" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "mediaType" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "link" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banner_slides_pkey" PRIMARY KEY ("id")
);
