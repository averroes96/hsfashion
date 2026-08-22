-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "aiCacheUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "aiSimilarCache" JSONB;
