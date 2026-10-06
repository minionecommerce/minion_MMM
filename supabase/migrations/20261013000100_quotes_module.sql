-- Quotes module (Zoho Books style quotes inside the CRM): numbering, items, taxes, totals, share link, activity.
-- Additive only. "Quote" and "QuoteItem" exist already (and are empty), so they are extended instead of duplicated:
-- the older /crm screens, Deals, Leads, Customers and Sales Orders keep pointing at the same table.
--   NEW   "CatalogItem"   the items that are picked on a quote (name, description, HSN/SAC, unit, rate, default tax)
--   NEW   "QuoteSetting"  one JSON row per settings group (numbering, taxes, rounding, company details, templates)
--   ADD   "Quote"         nullable columns: reference, subject, terms, project, salesperson, customer details, totals, share link, soft delete
--   ADD   "QuoteItem"     nullable columns: sort order, catalogue item, name, HSN, tax, custom columns
--   ADD   "Customer"      "gstin"
--   DATA  "Counter"       one row so the next quote number is QT/MSHS/26-27/A/723 (the number Zoho shows next)
-- Quote numbers come from "Counter" (one row per number series, key 'quote:<series>'); the series is the number format without
-- its running number, so a new financial year starts a new series by itself.
-- To undo: DROP TABLE "CatalogItem", "QuoteSetting"; drop the added columns; DELETE the 'quote:%' rows of "Counter".

CREATE TABLE IF NOT EXISTS "CatalogItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "hsn" TEXT,
    "unit" TEXT,
    "rate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'Goods',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "customFields" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CatalogItem_name_idx" ON "CatalogItem"("name");
CREATE INDEX IF NOT EXISTS "CatalogItem_deletedAt_isActive_idx" ON "CatalogItem"("deletedAt", "isActive");

CREATE TABLE IF NOT EXISTS "QuoteSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "QuoteSetting_pkey" PRIMARY KEY ("key")
);

ALTER TABLE "Quote"
    ADD COLUMN IF NOT EXISTS "reference" TEXT,
    ADD COLUMN IF NOT EXISTS "subject" TEXT,
    ADD COLUMN IF NOT EXISTS "terms" TEXT,
    ADD COLUMN IF NOT EXISTS "projectId" TEXT,
    ADD COLUMN IF NOT EXISTS "salespersonId" TEXT,
    ADD COLUMN IF NOT EXISTS "billingAddress" TEXT,
    ADD COLUMN IF NOT EXISTS "customerGstin" TEXT,
    ADD COLUMN IF NOT EXISTS "placeOfSupply" TEXT,
    ADD COLUMN IF NOT EXISTS "projectLocation" TEXT,
    ADD COLUMN IF NOT EXISTS "numberSeries" TEXT,
    ADD COLUMN IF NOT EXISTS "numberSeq" INTEGER,
    ADD COLUMN IF NOT EXISTS "subTotal" DECIMAL(14,2),
    ADD COLUMN IF NOT EXISTS "discountPercent" DECIMAL(7,3),
    ADD COLUMN IF NOT EXISTS "discountAmount" DECIMAL(14,2),
    ADD COLUMN IF NOT EXISTS "taxTotal" DECIMAL(14,2),
    ADD COLUMN IF NOT EXISTS "shippingCharges" DECIMAL(14,2),
    ADD COLUMN IF NOT EXISTS "tdsTcsKind" TEXT,
    ADD COLUMN IF NOT EXISTS "tdsTcsTaxId" TEXT,
    ADD COLUMN IF NOT EXISTS "tdsTcsName" TEXT,
    ADD COLUMN IF NOT EXISTS "tdsTcsRate" DECIMAL(7,3),
    ADD COLUMN IF NOT EXISTS "tdsTcsAmount" DECIMAL(14,2),
    ADD COLUMN IF NOT EXISTS "adjustmentLabel" TEXT,
    ADD COLUMN IF NOT EXISTS "adjustment" DECIMAL(14,2),
    ADD COLUMN IF NOT EXISTS "roundOff" DECIMAL(14,2),
    ADD COLUMN IF NOT EXISTS "retainerInvoice" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "shareToken" TEXT,
    ADD COLUMN IF NOT EXISTS "shareExpiresAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "customFields" JSONB,
    ADD COLUMN IF NOT EXISTS "updatedById" TEXT,
    ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

ALTER TABLE "QuoteItem"
    ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "itemId" TEXT,
    ADD COLUMN IF NOT EXISTS "name" TEXT,
    ADD COLUMN IF NOT EXISTS "hsn" TEXT,
    ADD COLUMN IF NOT EXISTS "taxId" TEXT,
    ADD COLUMN IF NOT EXISTS "taxName" TEXT,
    ADD COLUMN IF NOT EXISTS "taxRate" DECIMAL(7,3),
    ADD COLUMN IF NOT EXISTS "taxAmount" DECIMAL(14,2),
    ADD COLUMN IF NOT EXISTS "customFields" JSONB;

ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "gstin" TEXT;

DO $$ BEGIN
    ALTER TABLE "Quote" ADD CONSTRAINT "Quote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "Quote" ADD CONSTRAINT "Quote_salespersonId_fkey" FOREIGN KEY ("salespersonId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Quote_shareToken_key" ON "Quote"("shareToken");
CREATE INDEX IF NOT EXISTS "Quote_date_idx" ON "Quote"("date");
CREATE INDEX IF NOT EXISTS "Quote_deletedAt_idx" ON "Quote"("deletedAt");
CREATE INDEX IF NOT EXISTS "Quote_projectId_idx" ON "Quote"("projectId");
CREATE INDEX IF NOT EXISTS "Quote_salespersonId_idx" ON "Quote"("salespersonId");
CREATE INDEX IF NOT EXISTS "Quote_numberSeries_numberSeq_idx" ON "Quote"("numberSeries", "numberSeq");
CREATE INDEX IF NOT EXISTS "QuoteItem_quoteId_sortOrder_idx" ON "QuoteItem"("quoteId", "sortOrder");
CREATE INDEX IF NOT EXISTS "QuoteItem_itemId_idx" ON "QuoteItem"("itemId");

-- Same protection as every other table: only the server (service role / direct connection) can reach the new tables
ALTER TABLE "CatalogItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuoteSetting" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "CatalogItem", "QuoteSetting" FROM anon, authenticated;

-- The current series is QT/MSHS/26-27/A/: 722 is the last number used, so the next quote is 723
INSERT INTO "Counter" ("key", "value", "updatedAt") VALUES ('quote:QT/MSHS/26-27/A/', 722, now()) ON CONFLICT ("key") DO NOTHING;
