-- Deals page: a full copy of the Leads page for converted leads. Each deal gets its own Deal Status (instead of Lead Status)
-- and can be deleted. Two new empty columns on "Deal", a Deal Status pick-list with 8 starting choices (editable later in
-- Edit Deal Layout), and one hidden "Deal Status" row in "LeadField" so the existing pick-list editor can be reused.
-- No existing lead, deal, option, field or setting is changed.

ALTER TABLE "Deal" ADD COLUMN IF NOT EXISTS "dealStatusId" TEXT;
ALTER TABLE "Deal" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

DO $$ BEGIN
  ALTER TABLE "Deal" ADD CONSTRAINT "Deal_dealStatusId_fkey" FOREIGN KEY ("dealStatusId") REFERENCES "LeadOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "Deal_dealStatusId_idx" ON "Deal"("dealStatusId");

-- The starting Deal Status choices (the stages the older CRM used for deals)
INSERT INTO "LeadOption" ("id", "type", "key", "label", "sortOrder", "isActive", "updatedAt")
SELECT v.id, 'DEAL_STATUS', v.key, v.label, v.sort, true, now()
FROM (VALUES
  ('lo_dealstatus_qualification', 'qualification', 'Qualification', 0),
  ('lo_dealstatus_requirements', 'requirements', 'Requirements', 1),
  ('lo_dealstatus_preliminary_quote', 'preliminary_quote', 'Preliminary Quote', 2),
  ('lo_dealstatus_site_visit', 'site_visit', 'Site Visit', 3),
  ('lo_dealstatus_final_quote', 'final_quote', 'Final Quote', 4),
  ('lo_dealstatus_negotiation', 'negotiation', 'Negotiation', 5),
  ('lo_dealstatus_won', 'won', 'Won', 6),
  ('lo_dealstatus_lost', 'lost', 'Lost', 7)
) AS v(id, key, label, sort)
WHERE NOT EXISTS (SELECT 1 FROM "LeadOption" WHERE "type" = 'DEAL_STATUS');

-- Not part of the lead form (the form only shows the fields it knows); it just gives the Deal Status list an editor
INSERT INTO "LeadField" ("id", "key", "label", "fieldType", "isSystem", "required", "requiredLocked", "optionType", "sortOrder", "updatedAt")
SELECT 'lf_deal_status', 'dealStatusId', 'Deal Status', 'DROPDOWN', true, false, true, 'DEAL_STATUS', 1000, now()
WHERE NOT EXISTS (SELECT 1 FROM "LeadField" WHERE "key" = 'dealStatusId');
