/*
  Warnings:

  - You are about to drop the column `filiere_id` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_filiere_id_fkey";

-- DropIndex
DROP INDEX "users_filiere_id_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "filiere_id";

-- CreateTable
CREATE TABLE "user_filieres" (
    "user_id" TEXT NOT NULL,
    "filiere_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_filieres_pkey" PRIMARY KEY ("user_id","filiere_id")
);

-- AddForeignKey
ALTER TABLE "user_filieres" ADD CONSTRAINT "user_filieres_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_filieres" ADD CONSTRAINT "user_filieres_filiere_id_fkey" FOREIGN KEY ("filiere_id") REFERENCES "filieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;
