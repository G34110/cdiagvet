-- CreateEnum
CREATE TYPE "ClientSegmentation" AS ENUM ('DISTRIBUTEUR', 'AGENT', 'AUTRES');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "segmentation" "ClientSegmentation" NOT NULL DEFAULT 'AUTRES';
