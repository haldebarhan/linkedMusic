-- CreateTable
CREATE TABLE "announcement_views" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "announcementId" INTEGER NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "announcement_views_userId_viewedAt_idx" ON "announcement_views"("userId", "viewedAt" DESC);

-- CreateIndex
CREATE INDEX "announcement_views_announcementId_idx" ON "announcement_views"("announcementId");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_views_userId_announcementId_key" ON "announcement_views"("userId", "announcementId");

-- AddForeignKey
ALTER TABLE "announcement_views" ADD CONSTRAINT "announcement_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_views" ADD CONSTRAINT "announcement_views_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
