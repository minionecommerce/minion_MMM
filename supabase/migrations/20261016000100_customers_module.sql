-- Customers module: the Zoho-style Customer form opened from Create Quote > Customer Name (Add New Customer / Edit).
-- Additive only (no existing row, column or table is changed or removed) and safe to run twice.
--   ALTER "Customer"   new empty columns: salutation, first / last name, company, work phone, language, communication channels, GST treatment,
--                      legal / trade name, place of supply, PAN, tax preference, currency, accounts receivable, opening balance, credit limit,
--                      payment terms, portal, remarks, the billing and shipping address (9 columns each) and customFields (fields added in
--                      Edit Page Layout). The ten customers that exist keep working: their new columns are simply empty.
--   "name" stays the Display Name, "phone" the Mobile, "gstin" the GSTIN / UIN, "address" the Billing Address as printed lines.
-- Customer numbers (CUS-00001 ...) come from the "Counter" row "customer" (created on first use). The "customers" permissions already exist;
-- the Documents of a customer are rows of "ModuleFile" (module "customer"), so no table is added.
-- To undo: drop the added columns of "Customer" (and DELETE the "Counter" row "customer" and the "ModuleLayout" row "customer").

ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "salutation" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "companyName" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "workPhone" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "language" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "commEmail" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "commWhatsapp" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "gstTreatment" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "legalName" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "tradeName" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "placeOfSupply" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "pan" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "taxPreference" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "currency" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "accountsReceivable" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "openingBalance" DECIMAL(14,2);
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "creditLimit" DECIMAL(14,2);
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "paymentTerms" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "portalEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "remarks" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "billAttention" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "billCountry" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "billStreet1" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "billStreet2" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "billCity" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "billState" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "billPinCode" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "billPhone" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "billFax" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "shipAttention" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "shipCountry" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "shipStreet1" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "shipStreet2" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "shipCity" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "shipState" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "shipPinCode" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "shipPhone" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "shipFax" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "customFields" JSONB;
