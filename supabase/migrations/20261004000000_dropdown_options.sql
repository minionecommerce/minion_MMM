-- Dropdown option management: default marker + new index. Additive only; the old "isActive" column is removed
-- in a later migration once no deployed code reads it.
ALTER TABLE "LeadOption" ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "LeadOption_type_sortOrder_idx" ON "LeadOption"("type", "sortOrder");
