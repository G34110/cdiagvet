/*
  Warnings:

  - You are about to drop the column `filiere_id` on the `clients` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_filiere_id_fkey";

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "filiere_id";

-- CreateTable
CREATE TABLE "client_filieres" (
    "client_id" TEXT NOT NULL,
    "filiere_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_filieres_pkey" PRIMARY KEY ("client_id","filiere_id")
);

-- AddForeignKey
ALTER TABLE "client_filieres" ADD CONSTRAINT "client_filieres_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_filieres" ADD CONSTRAINT "client_filieres_filiere_id_fkey" FOREIGN KEY ("filiere_id") REFERENCES "filieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;
