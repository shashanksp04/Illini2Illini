-- AlterTable
ALTER TABLE "reddit_listings" ADD COLUMN     "image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[];
