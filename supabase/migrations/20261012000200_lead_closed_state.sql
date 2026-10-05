-- Leads: "Closed" belongs in the Status column (Open / Closed), not in the Lead Status list.
-- This replaces the "Closed" Lead Status added by 20261012000100_lead_close.sql: a lead is closed when Lead."closedAt" is
-- set, and its Lead Status is left alone. The closing reason and files stay in LeadClosure.
-- One new nullable column; the only data changes are for leads that were closed with the old "Closed" Lead Status.

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3);

-- Leads closed so far: mark them closed, from their latest completed closing
UPDATE "Lead" l
SET "closedAt" = c."closedAt"
FROM (
  SELECT DISTINCT ON ("leadId") "leadId", "closedAt"
  FROM "LeadClosure"
  WHERE "closedAt" IS NOT NULL
  ORDER BY "leadId", "closedAt" DESC
) c
WHERE c."leadId" = l."id" AND l."leadStatusId" = 'lo_status_closed' AND l."closedAt" IS NULL;

-- ...and put their Lead Status back to what it was before they were closed (the audit trail kept it)
UPDATE "Lead" l
SET "leadStatusId" = prev."oldStatus"
FROM (
  SELECT DISTINCT ON (a."leadId") a."leadId", (a."oldValue"::jsonb ->> 'leadStatusId') AS "oldStatus"
  FROM "CRMAuditLog" a
  WHERE a."action" = 'Closed' AND a."leadId" IS NOT NULL AND a."oldValue" IS NOT NULL
  ORDER BY a."leadId", a."createdAt" DESC
) prev
WHERE l."id" = prev."leadId" AND l."leadStatusId" = 'lo_status_closed'
  AND prev."oldStatus" IS NOT NULL
  AND EXISTS (SELECT 1 FROM "LeadOption" o WHERE o."id" = prev."oldStatus" AND o."type" = 'LEAD_STATUS');

-- The "Closed" option leaves the Lead Status list, as long as no lead still uses it
DELETE FROM "LeadOption" o
WHERE o."id" = 'lo_status_closed'
  AND NOT EXISTS (SELECT 1 FROM "Lead" WHERE "leadStatusId" = 'lo_status_closed');
