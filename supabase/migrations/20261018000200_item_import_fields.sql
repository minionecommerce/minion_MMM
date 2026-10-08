-- Items: what a Zoho Books item export (Item.csv) holds that the Item Master had no place for.
-- Additive only: every new column is empty, no existing value is changed.
--   externalId   the Item ID of the file (an item is never imported twice; the partial unique index guards it)
--   brand, manufacturer, mrp
--   extra        the other columns of the file as { "Column name": "value" } so nothing available is lost

ALTER TABLE "CatalogItem"
  ADD COLUMN IF NOT EXISTS "externalId" TEXT,
  ADD COLUMN IF NOT EXISTS "brand" TEXT,
  ADD COLUMN IF NOT EXISTS "manufacturer" TEXT,
  ADD COLUMN IF NOT EXISTS "mrp" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "extra" JSONB;

CREATE INDEX IF NOT EXISTS "CatalogItem_externalId_idx" ON "CatalogItem" ("externalId");
CREATE UNIQUE INDEX IF NOT EXISTS "CatalogItem_externalId_live_key" ON "CatalogItem" ("externalId") WHERE "externalId" IS NOT NULL AND "deletedAt" IS NULL;
