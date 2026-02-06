-- AlterTable
ALTER TABLE "opportunities" ADD COLUMN     "owner_changed_at" TIMESTAMP(3),
ADD COLUMN     "previous_owner_id" TEXT;
