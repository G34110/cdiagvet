/*
  Warnings:

  - You are about to drop the column `address` on the `clients` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "clients" DROP COLUMN "address",
ADD COLUMN     "address_line1" TEXT,
ADD COLUMN     "address_line2" TEXT,
ADD COLUMN     "organization" TEXT,
ADD COLUMN     "region" TEXT,
ALTER COLUMN "country" SET DEFAULT 'FR';
