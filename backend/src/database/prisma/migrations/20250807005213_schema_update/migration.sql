-- CreateTable
CREATE TABLE "public"."favorite_topics" (
    "id" SERIAL NOT NULL,
    "topicId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "favorite_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."watch_topics" (
    "id" SERIAL NOT NULL,
    "topicId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watch_topics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "favorite_topics_userId_topicId_key" ON "public"."favorite_topics"("userId", "topicId");

-- CreateIndex
CREATE UNIQUE INDEX "watch_topics_userId_topicId_key" ON "public"."watch_topics"("userId", "topicId");

-- AddForeignKey
ALTER TABLE "public"."favorite_topics" ADD CONSTRAINT "favorite_topics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."favorite_topics" ADD CONSTRAINT "favorite_topics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."watch_topics" ADD CONSTRAINT "watch_topics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."watch_topics" ADD CONSTRAINT "watch_topics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
