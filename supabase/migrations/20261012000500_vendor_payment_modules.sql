-- Four new CRM modules: Material Vendor (MV1, MV2, ...), Service Vendor (SV1, ...), Pre-Payment Records (PPR1, ...) and
-- Payment Collection Records (PCR1, ...), each with its own Edit Page Layout.
-- Additive only: 9 new, empty tables. No existing table, column, row, permission or setting is changed or removed.
--   ModuleLayout            one JSON row per module = that module's Edit Page Layout (created the first time it is edited)
--   ModuleFile              files of the four modules (uploaded to the existing private Storage bucket)
--   MaterialVendor          + MaterialVendorPrice   (Price Detail rows)
--   ServiceVendor           + ServiceVendorPrice (Price Detail rows) + ServiceVendorRemark (Remarks rows)
--   PrePayment, PaymentCollection
-- The IDs come from the existing "Counter" table (keys materialVendor, serviceVendor, prePayment, paymentCollection); the
-- rows are created by the app on first use. Records are only ever soft-deleted, so an ID is never reused.
-- To undo: DROP TABLE the 9 tables listed above (nothing else refers to them).

CREATE TABLE IF NOT EXISTS "ModuleLayout" (
    "module" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ModuleLayout_pkey" PRIMARY KEY ("module")
);

CREATE TABLE IF NOT EXISTS "ModuleFile" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "recordId" TEXT,
    "rowId" TEXT,
    "fieldKey" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "ModuleFile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ModuleFile_storagePath_key" ON "ModuleFile"("storagePath");
CREATE INDEX IF NOT EXISTS "ModuleFile_module_recordId_deletedAt_idx" ON "ModuleFile"("module", "recordId", "deletedAt");
CREATE INDEX IF NOT EXISTS "ModuleFile_rowId_idx" ON "ModuleFile"("rowId");
CREATE INDEX IF NOT EXISTS "ModuleFile_uploadedById_status_createdAt_idx" ON "ModuleFile"("uploadedById", "status", "createdAt");

-- ---------------------------------------------------------------------------
-- Material Vendor
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "MaterialVendor" (
    "id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "phone1" TEXT,
    "phone2" TEXT,
    "address" TEXT,
    "city" TEXT,
    "vendorType" TEXT,
    "shopType" TEXT,
    "taskPersonId" TEXT,
    "email" TEXT,
    "exchangeRate" DECIMAL(18,6),
    "ownerId" TEXT,
    "price" DECIMAL(16,2),
    "rating" TEXT,
    "subCategory" TEXT,
    "category" TEXT,
    "description" TEXT,
    "products" TEXT,
    "currency" TEXT,
    "gstNumber" TEXT,
    "sourceOfSupply" TEXT,
    "customFields" JSONB,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "MaterialVendor_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MaterialVendor_seq_key" ON "MaterialVendor"("seq");
CREATE UNIQUE INDEX IF NOT EXISTS "MaterialVendor_code_key" ON "MaterialVendor"("code");
CREATE INDEX IF NOT EXISTS "MaterialVendor_deletedAt_seq_idx" ON "MaterialVendor"("deletedAt", "seq");
CREATE INDEX IF NOT EXISTS "MaterialVendor_taskPersonId_idx" ON "MaterialVendor"("taskPersonId");
CREATE INDEX IF NOT EXISTS "MaterialVendor_ownerId_idx" ON "MaterialVendor"("ownerId");

CREATE TABLE IF NOT EXISTS "MaterialVendorPrice" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "materialName" TEXT,
    "unit" TEXT,
    "rate" DECIMAL(16,2),
    "size" TEXT,
    "thickness" TEXT,
    "note" TEXT,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MaterialVendorPrice_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "MaterialVendorPrice_vendorId_sortOrder_idx" ON "MaterialVendorPrice"("vendorId", "sortOrder");

-- ---------------------------------------------------------------------------
-- Service Vendor
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "ServiceVendor" (
    "id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nickName" TEXT,
    "phone1" TEXT,
    "phone2" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "vendorType" TEXT,
    "serviceLocation" TEXT,
    "taskPersonId" TEXT,
    "companyName" TEXT,
    "exchangeRate" DECIMAL(18,6),
    "ownerId" TEXT,
    "status" TEXT,
    "serviceCategory" TEXT,
    "serviceType" TEXT,
    "rating" TEXT,
    "source" TEXT,
    "category" TEXT,
    "labourCount" INTEGER,
    "projectDriveLink" TEXT,
    "currency" TEXT,
    "customFields" JSONB,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "ServiceVendor_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ServiceVendor_seq_key" ON "ServiceVendor"("seq");
CREATE UNIQUE INDEX IF NOT EXISTS "ServiceVendor_code_key" ON "ServiceVendor"("code");
CREATE INDEX IF NOT EXISTS "ServiceVendor_deletedAt_seq_idx" ON "ServiceVendor"("deletedAt", "seq");
CREATE INDEX IF NOT EXISTS "ServiceVendor_taskPersonId_idx" ON "ServiceVendor"("taskPersonId");
CREATE INDEX IF NOT EXISTS "ServiceVendor_ownerId_idx" ON "ServiceVendor"("ownerId");

CREATE TABLE IF NOT EXISTS "ServiceVendorPrice" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "serviceName" TEXT,
    "unit" TEXT,
    "rate" DECIMAL(16,2),
    "areaRange" TEXT,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServiceVendorPrice_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ServiceVendorPrice_vendorId_sortOrder_idx" ON "ServiceVendorPrice"("vendorId", "sortOrder");

CREATE TABLE IF NOT EXISTS "ServiceVendorRemark" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "workRemarks" TEXT,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServiceVendorRemark_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ServiceVendorRemark_vendorId_sortOrder_idx" ON "ServiceVendorRemark"("vendorId", "sortOrder");

-- ---------------------------------------------------------------------------
-- Pre-Payment Records and Payment Collection Records (same columns, numbered separately)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "PrePayment" (
    "id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "dealId" TEXT,
    "taskPersonId" TEXT,
    "paymentMode" TEXT,
    "paymentType" TEXT,
    "materialVendorId" TEXT,
    "serviceVendorId" TEXT,
    "amount" DECIMAL(16,2),
    "date" DATE,
    "paymentStatus" TEXT,
    "utrDate" DATE,
    "utrNumber" TEXT,
    "remarks" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "customFields" JSONB,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "PrePayment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PrePayment_seq_key" ON "PrePayment"("seq");
CREATE UNIQUE INDEX IF NOT EXISTS "PrePayment_code_key" ON "PrePayment"("code");
CREATE INDEX IF NOT EXISTS "PrePayment_deletedAt_seq_idx" ON "PrePayment"("deletedAt", "seq");
CREATE INDEX IF NOT EXISTS "PrePayment_dealId_idx" ON "PrePayment"("dealId");
CREATE INDEX IF NOT EXISTS "PrePayment_taskPersonId_idx" ON "PrePayment"("taskPersonId");
CREATE INDEX IF NOT EXISTS "PrePayment_materialVendorId_idx" ON "PrePayment"("materialVendorId");
CREATE INDEX IF NOT EXISTS "PrePayment_serviceVendorId_idx" ON "PrePayment"("serviceVendorId");
CREATE INDEX IF NOT EXISTS "PrePayment_date_idx" ON "PrePayment"("date");

CREATE TABLE IF NOT EXISTS "PaymentCollection" (
    "id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "dealId" TEXT,
    "taskPersonId" TEXT,
    "paymentMode" TEXT,
    "paymentType" TEXT,
    "materialVendorId" TEXT,
    "serviceVendorId" TEXT,
    "amount" DECIMAL(16,2),
    "date" DATE,
    "paymentStatus" TEXT,
    "utrDate" DATE,
    "utrNumber" TEXT,
    "remarks" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "customFields" JSONB,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "PaymentCollection_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentCollection_seq_key" ON "PaymentCollection"("seq");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentCollection_code_key" ON "PaymentCollection"("code");
CREATE INDEX IF NOT EXISTS "PaymentCollection_deletedAt_seq_idx" ON "PaymentCollection"("deletedAt", "seq");
CREATE INDEX IF NOT EXISTS "PaymentCollection_dealId_idx" ON "PaymentCollection"("dealId");
CREATE INDEX IF NOT EXISTS "PaymentCollection_taskPersonId_idx" ON "PaymentCollection"("taskPersonId");
CREATE INDEX IF NOT EXISTS "PaymentCollection_materialVendorId_idx" ON "PaymentCollection"("materialVendorId");
CREATE INDEX IF NOT EXISTS "PaymentCollection_serviceVendorId_idx" ON "PaymentCollection"("serviceVendorId");
CREATE INDEX IF NOT EXISTS "PaymentCollection_date_idx" ON "PaymentCollection"("date");

-- ---------------------------------------------------------------------------
-- Links to users, deals and vendors (a link is cleared, never the record, if its target is ever hard-deleted)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MaterialVendor_taskPersonId_fkey') THEN
    ALTER TABLE "MaterialVendor" ADD CONSTRAINT "MaterialVendor_taskPersonId_fkey" FOREIGN KEY ("taskPersonId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MaterialVendor_ownerId_fkey') THEN
    ALTER TABLE "MaterialVendor" ADD CONSTRAINT "MaterialVendor_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MaterialVendorPrice_vendorId_fkey') THEN
    ALTER TABLE "MaterialVendorPrice" ADD CONSTRAINT "MaterialVendorPrice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "MaterialVendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ServiceVendor_taskPersonId_fkey') THEN
    ALTER TABLE "ServiceVendor" ADD CONSTRAINT "ServiceVendor_taskPersonId_fkey" FOREIGN KEY ("taskPersonId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ServiceVendor_ownerId_fkey') THEN
    ALTER TABLE "ServiceVendor" ADD CONSTRAINT "ServiceVendor_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ServiceVendorPrice_vendorId_fkey') THEN
    ALTER TABLE "ServiceVendorPrice" ADD CONSTRAINT "ServiceVendorPrice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "ServiceVendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ServiceVendorRemark_vendorId_fkey') THEN
    ALTER TABLE "ServiceVendorRemark" ADD CONSTRAINT "ServiceVendorRemark_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "ServiceVendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrePayment_dealId_fkey') THEN
    ALTER TABLE "PrePayment" ADD CONSTRAINT "PrePayment_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrePayment_taskPersonId_fkey') THEN
    ALTER TABLE "PrePayment" ADD CONSTRAINT "PrePayment_taskPersonId_fkey" FOREIGN KEY ("taskPersonId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrePayment_materialVendorId_fkey') THEN
    ALTER TABLE "PrePayment" ADD CONSTRAINT "PrePayment_materialVendorId_fkey" FOREIGN KEY ("materialVendorId") REFERENCES "MaterialVendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrePayment_serviceVendorId_fkey') THEN
    ALTER TABLE "PrePayment" ADD CONSTRAINT "PrePayment_serviceVendorId_fkey" FOREIGN KEY ("serviceVendorId") REFERENCES "ServiceVendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrePayment_approvedById_fkey') THEN
    ALTER TABLE "PrePayment" ADD CONSTRAINT "PrePayment_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PaymentCollection_dealId_fkey') THEN
    ALTER TABLE "PaymentCollection" ADD CONSTRAINT "PaymentCollection_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PaymentCollection_taskPersonId_fkey') THEN
    ALTER TABLE "PaymentCollection" ADD CONSTRAINT "PaymentCollection_taskPersonId_fkey" FOREIGN KEY ("taskPersonId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PaymentCollection_materialVendorId_fkey') THEN
    ALTER TABLE "PaymentCollection" ADD CONSTRAINT "PaymentCollection_materialVendorId_fkey" FOREIGN KEY ("materialVendorId") REFERENCES "MaterialVendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PaymentCollection_serviceVendorId_fkey') THEN
    ALTER TABLE "PaymentCollection" ADD CONSTRAINT "PaymentCollection_serviceVendorId_fkey" FOREIGN KEY ("serviceVendorId") REFERENCES "ServiceVendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PaymentCollection_approvedById_fkey') THEN
    ALTER TABLE "PaymentCollection" ADD CONSTRAINT "PaymentCollection_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Same protection as the other tables: only the app's own database connection can read or write them
ALTER TABLE "ModuleLayout" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ModuleFile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MaterialVendor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MaterialVendorPrice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceVendor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceVendorPrice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceVendorRemark" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PrePayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentCollection" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "ModuleLayout", "ModuleFile", "MaterialVendor", "MaterialVendorPrice", "ServiceVendor", "ServiceVendorPrice", "ServiceVendorRemark", "PrePayment", "PaymentCollection" FROM anon, authenticated;
