-- CreateIndex
CREATE INDEX "ann_field_values_fieldId_value_text_idx" ON "ann_field_values"("fieldId", "value_text");

-- CreateIndex
CREATE INDEX "announcements_isHighlighted_created_at_idx" ON "announcements"("isHighlighted" DESC, "created_at" DESC);

-- CreateIndex
CREATE INDEX "announcements_isHighlighted_published_at_idx" ON "announcements"("isHighlighted" DESC, "published_at" DESC);

-- CreateIndex
CREATE INDEX "announcements_countryCode_idx" ON "announcements"("countryCode");

-- CreateIndex
CREATE INDEX "announcements_city_idx" ON "announcements"("city");

-- CreateIndex
CREATE INDEX "announcements_countryCode_city_idx" ON "announcements"("countryCode", "city");

-- CreateIndex
CREATE INDEX "announcements_price_idx" ON "announcements"("price");

-- CreateIndex
CREATE INDEX "announcements_status_isPublished_isHighlighted_created_at_idx" ON "announcements"("status", "isPublished", "isHighlighted" DESC, "created_at" DESC);

-- CreateIndex
CREATE INDEX "announcements_status_isPublished_published_at_idx" ON "announcements"("status", "isPublished", "published_at" DESC);

-- CreateIndex
CREATE INDEX "announcements_ownerId_status_isPublished_idx" ON "announcements"("ownerId", "status", "isPublished");

-- CreateIndex
CREATE INDEX "announcements_title_idx" ON "announcements" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "announcements_description_idx" ON "announcements" USING GIN ("description" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");
