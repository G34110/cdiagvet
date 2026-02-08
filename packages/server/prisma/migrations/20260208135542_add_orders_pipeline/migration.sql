/*
  Warnings:

  - The values [PENDING,CONFIRMED,SHIPPED,DELIVERED,CANCELLED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `total` on the `orders` table. All the data in the column will be lost.
  - Added the required column `owner_id` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "OpportunityStatus" ADD VALUE 'CONVERTI';

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('BROUILLON', 'VALIDEE', 'PREPARATION', 'EXPEDIEE', 'LIVREE', 'ANNULEE');
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'BROUILLON';
COMMIT;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "total",
ADD COLUMN     "delivered_at" TIMESTAMP(3),
ADD COLUMN     "expected_delivery" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "opportunity_id" TEXT,
ADD COLUMN     "owner_id" TEXT NOT NULL,
ADD COLUMN     "tax_rate" DOUBLE PRECISION NOT NULL DEFAULT 20,
ADD COLUMN     "tenant_id" TEXT NOT NULL,
ADD COLUMN     "total_ht" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "total_ttc" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tracking_number" TEXT,
ADD COLUMN     "validated_at" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'BROUILLON';

-- CreateTable
CREATE TABLE "order_lines" (
    "id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_code" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT,
    "kit_id" TEXT,

    CONSTRAINT "order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_owner_id_idx" ON "orders"("owner_id");

-- CreateIndex
CREATE INDEX "orders_client_id_idx" ON "orders"("client_id");

-- CreateIndex
CREATE INDEX "orders_opportunity_id_idx" ON "orders"("opportunity_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_kit_id_fkey" FOREIGN KEY ("kit_id") REFERENCES "product_kits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
