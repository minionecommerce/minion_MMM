-- Leads: "Close Lead" (Leads → Actions → Close Lead). A reason is required, files are optional.
-- Additive only: one new table, one new nullable column and one new option in the Lead Status list.
-- Nothing existing is changed or removed.

-- One row each time a lead is closed. It only counts once its files are verified ("closedAt").
CREATE TABLE IF NOT EXISTS "LeadClosure" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "closedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    CONSTRAINT "LeadClosure_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LeadClosure_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "LeadClosure_leadId_closedAt_idx" ON "LeadClosure"("leadId", "closedAt");
ALTER TABLE "LeadClosure" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "LeadClosure" FROM anon, authenticated;

-- Files added while closing a lead (these are not shown as the lead's own files)
ALTER TABLE "LeadAttachment" ADD COLUMN IF NOT EXISTS "closureId" TEXT;
CREATE INDEX IF NOT EXISTS "LeadAttachment_closureId_idx" ON "LeadAttachment"("closureId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LeadAttachment_closureId_fkey') THEN
    ALTER TABLE "LeadAttachment" ADD CONSTRAINT "LeadAttachment_closureId_fkey" FOREIGN KEY ("closureId") REFERENCES "LeadClosure"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- The "Closed" Lead Status, added at the end of the list. It has a fixed id and key so the app can always find it;
-- the label can still be renamed and the option moved in Edit Properties like any other.
INSERT INTO "LeadOption" ("id", "type", "key", "label", "sortOrder", "createdAt", "updatedAt")
SELECT 'lo_status_closed', 'LEAD_STATUS', 'closed', 'Closed',
       COALESCE((SELECT MAX("sortOrder") FROM "LeadOption" WHERE "type" = 'LEAD_STATUS'), -1) + 1,
       now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "LeadOption" WHERE "id" = 'lo_status_closed');
