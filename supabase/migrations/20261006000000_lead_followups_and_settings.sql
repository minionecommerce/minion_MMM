-- Leads: follow-up proof and the saved order of the Leads table columns.
-- Additive only: two new tables and one new nullable column. Nothing existing is changed or removed.
CREATE TABLE IF NOT EXISTS "LeadFollowUp" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "nextAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "LeadFollowUp_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LeadFollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "LeadFollowUp_leadId_completedAt_idx" ON "LeadFollowUp"("leadId", "completedAt");
ALTER TABLE "LeadFollowUp" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "LeadFollowUp" FROM anon, authenticated;

ALTER TABLE "LeadAttachment" ADD COLUMN IF NOT EXISTS "followUpId" TEXT;
CREATE INDEX IF NOT EXISTS "LeadAttachment_followUpId_idx" ON "LeadAttachment"("followUpId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LeadAttachment_followUpId_fkey') THEN
    ALTER TABLE "LeadAttachment" ADD CONSTRAINT "LeadAttachment_followUpId_fkey" FOREIGN KEY ("followUpId") REFERENCES "LeadFollowUp"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "LeadSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LeadSetting_pkey" PRIMARY KEY ("key")
);
ALTER TABLE "LeadSetting" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "LeadSetting" FROM anon, authenticated;
