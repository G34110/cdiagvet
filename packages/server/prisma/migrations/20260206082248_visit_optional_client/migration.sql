-- DropForeignKey
ALTER TABLE "visits" DROP CONSTRAINT "visits_client_id_fkey";

-- AlterTable
ALTER TABLE "visits" ALTER COLUMN "client_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
