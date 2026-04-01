-- CreateTable
CREATE TABLE "listing_views" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "viewer_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_views_listing_id_idx" ON "listing_views"("listing_id");

-- CreateIndex
CREATE INDEX "listing_views_viewer_user_id_idx" ON "listing_views"("viewer_user_id");

-- AddForeignKey
ALTER TABLE "listing_views" ADD CONSTRAINT "listing_views_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_views" ADD CONSTRAINT "listing_views_viewer_user_id_fkey" FOREIGN KEY ("viewer_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
