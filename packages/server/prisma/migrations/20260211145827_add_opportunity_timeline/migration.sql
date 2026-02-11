-- CreateEnum
CREATE TYPE "OpportunityEventType" AS ENUM ('STATUS_CHANGE', 'NOTE_ADDED', 'OWNER_CHANGE', 'AMOUNT_CHANGE', 'LINE_ADDED', 'LINE_REMOVED', 'LINE_UPDATED', 'DOCUMENT_ATTACHED', 'RDV_SCHEDULED', 'EMAIL_SENT', 'CREATED');

-- CreateTable
CREATE TABLE "opportunity_notes" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,

    CONSTRAINT "opportunity_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_events" (
    "id" TEXT NOT NULL,
    "type" "OpportunityEventType" NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opportunity_id" TEXT NOT NULL,
    "user_id" TEXT,

    CONSTRAINT "opportunity_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "opportunity_notes_opportunity_id_idx" ON "opportunity_notes"("opportunity_id");

-- CreateIndex
CREATE INDEX "opportunity_notes_created_at_idx" ON "opportunity_notes"("created_at");

-- CreateIndex
CREATE INDEX "opportunity_events_opportunity_id_idx" ON "opportunity_events"("opportunity_id");

-- CreateIndex
CREATE INDEX "opportunity_events_created_at_idx" ON "opportunity_events"("created_at");

-- CreateIndex
CREATE INDEX "opportunity_events_type_idx" ON "opportunity_events"("type");

-- AddForeignKey
ALTER TABLE "opportunity_notes" ADD CONSTRAINT "opportunity_notes_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_notes" ADD CONSTRAINT "opportunity_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_events" ADD CONSTRAINT "opportunity_events_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_events" ADD CONSTRAINT "opportunity_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
