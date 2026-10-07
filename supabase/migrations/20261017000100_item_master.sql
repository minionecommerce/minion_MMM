-- Items: the New Item form of the Quote page (Item Master) and what a quote line keeps of it.
-- Additive only: every new column is empty or has a default, no existing value is changed.

ALTER TABLE "CatalogItem"
  ADD COLUMN IF NOT EXISTS "category" TEXT,
  ADD COLUMN IF NOT EXISTS "taxPreference" TEXT NOT NULL DEFAULT 'taxable',
  ADD COLUMN IF NOT EXISTS "unitGroup" TEXT,
  ADD COLUMN IF NOT EXISTS "sku" TEXT,
  ADD COLUMN IF NOT EXISTS "identifiers" JSONB,
  ADD COLUMN IF NOT EXISTS "trackInventory" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "inventoryTracking" TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS "inventoryAccount" TEXT,
  ADD COLUMN IF NOT EXISTS "valuationMethod" TEXT NOT NULL DEFAULT 'fifo',
  ADD COLUMN IF NOT EXISTS "reorderPoint" DECIMAL(14,2),
  ADD COLUMN IF NOT EXISTS "returnable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "dimLength" DECIMAL(12,3),
  ADD COLUMN IF NOT EXISTS "dimWidth" DECIMAL(12,3),
  ADD COLUMN IF NOT EXISTS "dimHeight" DECIMAL(12,3),
  ADD COLUMN IF NOT EXISTS "dimUnit" TEXT NOT NULL DEFAULT 'cm',
  ADD COLUMN IF NOT EXISTS "weight" DECIMAL(12,3),
  ADD COLUMN IF NOT EXISTS "weightUnit" TEXT NOT NULL DEFAULT 'kg',
  ADD COLUMN IF NOT EXISTS "taskTemplateId" TEXT;

CREATE INDEX IF NOT EXISTS "CatalogItem_category_idx" ON "CatalogItem" ("category");

ALTER TABLE "QuoteItem"
  ADD COLUMN IF NOT EXISTS "kind" TEXT,
  ADD COLUMN IF NOT EXISTS "taskTemplateId" TEXT;
