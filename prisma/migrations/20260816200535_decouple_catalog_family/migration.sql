/*
  Warnings:

  - You are about to drop the column `catalogId` on the `Family` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Family" DROP CONSTRAINT "Family_catalogId_fkey";

-- AlterTable
ALTER TABLE "Family" DROP COLUMN "catalogId";

-- CreateTable
CREATE TABLE "_CatalogToProduct" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CatalogToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CatalogToProduct_B_index" ON "_CatalogToProduct"("B");

-- AddForeignKey
ALTER TABLE "_CatalogToProduct" ADD CONSTRAINT "_CatalogToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "Catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CatalogToProduct" ADD CONSTRAINT "_CatalogToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
