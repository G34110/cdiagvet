/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,code]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "opportunity_lines" ADD COLUMN     "kit_id" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "filiere_id" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tenant_id" TEXT NOT NULL,
ADD COLUMN     "unit_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "gtin" DROP NOT NULL;

-- CreateTable
CREATE TABLE "product_kits" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" TEXT NOT NULL,

    CONSTRAINT "product_kits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_kit_items" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "kit_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,

    CONSTRAINT "product_kit_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_kits_tenant_id_idx" ON "product_kits"("tenant_id");

-- CreateIndex
CREATE INDEX "product_kits_is_active_idx" ON "product_kits"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "product_kits_tenant_id_code_key" ON "product_kits"("tenant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "product_kit_items_kit_id_product_id_key" ON "product_kit_items"("kit_id", "product_id");

-- CreateIndex
CREATE INDEX "products_tenant_id_idx" ON "products"("tenant_id");

-- CreateIndex
CREATE INDEX "products_filiere_id_idx" ON "products"("filiere_id");

-- CreateIndex
CREATE INDEX "products_is_active_idx" ON "products"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "products_tenant_id_code_key" ON "products"("tenant_id", "code");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_filiere_id_fkey" FOREIGN KEY ("filiere_id") REFERENCES "filieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_kits" ADD CONSTRAINT "product_kits_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_kit_items" ADD CONSTRAINT "product_kit_items_kit_id_fkey" FOREIGN KEY ("kit_id") REFERENCES "product_kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_kit_items" ADD CONSTRAINT "product_kit_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_lines" ADD CONSTRAINT "opportunity_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_lines" ADD CONSTRAINT "opportunity_lines_kit_id_fkey" FOREIGN KEY ("kit_id") REFERENCES "product_kits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
