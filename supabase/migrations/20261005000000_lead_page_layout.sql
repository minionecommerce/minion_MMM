-- Leads → Edit Page Layout. Additive only: one new table and one new nullable column.
CREATE TABLE IF NOT EXISTS "LeadField" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "requiredLocked" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "optionType" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LeadField_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "LeadField_key_key" ON "LeadField"("key");
CREATE INDEX IF NOT EXISTS "LeadField_sortOrder_idx" ON "LeadField"("sortOrder");
ALTER TABLE "LeadField" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "LeadField" FROM anon, authenticated;

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "customFields" JSONB;
CREATE INDEX IF NOT EXISTS "LeadOption_type_sortOrder_idx" ON "LeadOption"("type", "sortOrder");
