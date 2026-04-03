-- CreateEnum
CREATE TYPE "ExternalListingSource" AS ENUM ('REDDIT');

-- CreateTable
CREATE TABLE "reddit_listings" (
    "id" UUID NOT NULL,
    "external_id" TEXT NOT NULL,
    "source" "ExternalListingSource" NOT NULL DEFAULT 'REDDIT',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "monthly_rent" INTEGER,
    "lease_type" "LeaseType",
    "start_date" DATE,
    "end_date" DATE,
    "room_type" "RoomType",
    "furnished" BOOLEAN,
    "utilities_included" BOOLEAN,
    "open_to_negotiation" BOOLEAN,
    "gender_preference" "GenderPreference",
    "nearby_landmark" VARCHAR(500),
    "total_bedrooms" INTEGER,
    "total_bathrooms" INTEGER,
    "exact_address" TEXT,
    "external_url" TEXT NOT NULL,
    "source_created_at" TIMESTAMP(3) NOT NULL,
    "raw_text" TEXT,
    "exclude" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reddit_listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reddit_listings_external_id_key" ON "reddit_listings"("external_id");

-- CreateIndex
CREATE INDEX "reddit_listings_exclude_source_created_at_idx" ON "reddit_listings"("exclude", "source_created_at");
