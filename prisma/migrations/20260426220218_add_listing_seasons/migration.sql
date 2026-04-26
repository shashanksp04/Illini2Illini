-- CreateEnum
CREATE TYPE "Season" AS ENUM ('SPRING', 'SUMMER', 'FALL', 'FULL_YEAR');

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "seasons" "Season"[] DEFAULT ARRAY[]::"Season"[];
