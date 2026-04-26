-- AlterTable
ALTER TABLE "reddit_listings" ADD COLUMN     "seasons" "Season"[] DEFAULT ARRAY[]::"Season"[];
