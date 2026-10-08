-- Items: Purchase Information and the Default Tax Rates (Intra / Inter State) of the New Item form.
-- Additive only: every new column is empty or has a default, no existing value is changed.
-- A new item is not returnable unless the form says so: the default of "returnable" becomes false (rows that exist keep the value they have).

ALTER TABLE "CatalogItem"
  ADD COLUMN IF NOT EXISTS "purchaseInfo" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "costPrice" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "purchaseAccount" TEXT,
  ADD COLUMN IF NOT EXISTS "purchaseDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "receivable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "interTaxId" TEXT;

ALTER TABLE "CatalogItem" ALTER COLUMN "returnable" SET DEFAULT false;
