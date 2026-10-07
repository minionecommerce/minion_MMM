-- Projects module: Deals -> Convert to Project, the Projects list and the Project page with its templates.
-- Additive only (no existing row, column or table is changed or removed) and safe to run twice.
--   ALTER "Project"        new empty columns: project code (MP1, MP2 ...), site location + link, product / service, prior completion,
--                          actual start, completed date, exclusions, incentive %, custom fields, soft delete, who/when. The one older
--                          demo project keeps working: it simply has no project code.
--   ALTER "Deal"           "projectConvertedAt": set when a deal is converted (the deal stays; it only moves to the Converted Deals filter)
--   ALTER "PrePayment"     "workTypeId": the Work Type (a project template) of a pre-payment record
--   NEW   "ProjectQuoteLine"        the Exclusions typed for one accepted quote (Project Value Information)
--   NEW   "ProjectItemSelection"    Template + Service / Material Vendors chosen for one quote item (Vendor Selection)
--   NEW   "ProjectWorkCoverage"     the Completed tick of one template (Work Coverage)
--   NEW   "ProjectMaterialVendor"   Material Vendor Involvement rows (MP1M1 ...)
--   NEW   "ProjectServiceVendor"    Service Vendor Involvement rows (MP1S1 ...)
--   NEW   "ProjectProcurement" + "ProjectProcurementRow"   Material Procurement blocks and their rows
-- Nothing is stored that can be worked out: Project Value, Collected Amount, Expenses, Given Amounts ... are read live from the quotes,
-- PCRs and PPRs of the deal. No permission rows are needed: the "projects" module's permissions already exist. The project numbers come
-- from the "Counter" row "project" (created on first use).
-- To undo: DROP TABLE "ProjectProcurementRow", "ProjectProcurement", "ProjectServiceVendor", "ProjectMaterialVendor", "ProjectWorkCoverage",
-- "ProjectItemSelection", "ProjectQuoteLine"; then drop the added columns of "Project", "Deal" and "PrePayment" (and DELETE the "Counter" row
-- "project" and the "ModuleLayout" row "project").

-- ---------------------------------------------------------------------------
-- Existing tables: new empty columns
-- ---------------------------------------------------------------------------
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "projectSeq" INTEGER;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "projectCode" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "siteLocation" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "siteLocationLink" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "productOrService" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "priorCompletionDate" DATE;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "actualStartDate" DATE;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "completedDate" DATE;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "exclusions" DECIMAL(16,2);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "incentivePercent" DECIMAL(7,3);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "customFields" JSONB;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "createdById" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "updatedById" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "convertedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "Project_projectSeq_key" ON "Project"("projectSeq");
CREATE UNIQUE INDEX IF NOT EXISTS "Project_projectCode_key" ON "Project"("projectCode");
CREATE INDEX IF NOT EXISTS "Project_deletedAt_projectSeq_idx" ON "Project"("deletedAt", "projectSeq");
CREATE INDEX IF NOT EXISTS "Project_dealId_idx" ON "Project"("dealId");

ALTER TABLE "Deal" ADD COLUMN IF NOT EXISTS "projectConvertedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Deal_projectConvertedAt_idx" ON "Deal"("projectConvertedAt");

ALTER TABLE "PrePayment" ADD COLUMN IF NOT EXISTS "workTypeId" TEXT;
CREATE INDEX IF NOT EXISTS "PrePayment_workTypeId_idx" ON "PrePayment"("workTypeId");

-- ---------------------------------------------------------------------------
-- New tables: the rows of the project templates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "ProjectQuoteLine" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "quoteExclusion" DECIMAL(16,2),
    "customFields" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectQuoteLine_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProjectQuoteLine_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectQuoteLine_projectId_quoteId_key" ON "ProjectQuoteLine"("projectId", "quoteId");

CREATE TABLE IF NOT EXISTS "ProjectItemSelection" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "quoteItemId" TEXT NOT NULL,
    "templateId" TEXT,
    "serviceVendorIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "materialVendorIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "customFields" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectItemSelection_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProjectItemSelection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectItemSelection_projectId_quoteItemId_key" ON "ProjectItemSelection"("projectId", "quoteItemId");
CREATE INDEX IF NOT EXISTS "ProjectItemSelection_projectId_templateId_idx" ON "ProjectItemSelection"("projectId", "templateId");

CREATE TABLE IF NOT EXISTS "ProjectWorkCoverage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "customFields" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectWorkCoverage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProjectWorkCoverage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectWorkCoverage_projectId_templateId_key" ON "ProjectWorkCoverage"("projectId", "templateId");

CREATE TABLE IF NOT EXISTS "ProjectMaterialVendor" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "materialCode" TEXT NOT NULL,
    "materialVendorId" TEXT NOT NULL,
    "materialList" TEXT,
    "materialQuotedValue" DECIMAL(16,2),
    "planningToTake" DATE,
    "takenDate" DATE,
    "materialStatus" TEXT,
    "materialTaskPersonId" TEXT,
    "customFields" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectMaterialVendor_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProjectMaterialVendor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectMaterialVendor_projectId_seq_key" ON "ProjectMaterialVendor"("projectId", "seq");
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectMaterialVendor_projectId_materialCode_key" ON "ProjectMaterialVendor"("projectId", "materialCode");
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectMaterialVendor_projectId_materialVendorId_key" ON "ProjectMaterialVendor"("projectId", "materialVendorId");

CREATE TABLE IF NOT EXISTS "ProjectServiceVendor" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "serviceCode" TEXT NOT NULL,
    "serviceVendorId" TEXT NOT NULL,
    "serviceQuotedValue" DECIMAL(16,2),
    "serviceStartDate" DATE,
    "serviceStartedDate" DATE,
    "serviceCompletionDate" DATE,
    "serviceCompletedDate" DATE,
    "customFields" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectServiceVendor_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProjectServiceVendor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectServiceVendor_projectId_seq_key" ON "ProjectServiceVendor"("projectId", "seq");
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectServiceVendor_projectId_serviceCode_key" ON "ProjectServiceVendor"("projectId", "serviceCode");
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectServiceVendor_projectId_serviceVendorId_key" ON "ProjectServiceVendor"("projectId", "serviceVendorId");

CREATE TABLE IF NOT EXISTS "ProjectProcurement" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "quoteItemId" TEXT,
    "itemLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectProcurement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProjectProcurement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ProjectProcurement_projectId_sortOrder_idx" ON "ProjectProcurement"("projectId", "sortOrder");

CREATE TABLE IF NOT EXISTS "ProjectProcurementRow" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "procVendorName" TEXT,
    "procVendorNumber" TEXT,
    "procLocation" TEXT,
    "procQuoteValue" DECIMAL(16,2),
    "procSize" TEXT,
    "procNotes" TEXT,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectProcurementRow_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProjectProcurementRow_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectProcurementRow_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "ProjectProcurement"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ProjectProcurementRow_blockId_sortOrder_idx" ON "ProjectProcurementRow"("blockId", "sortOrder");
CREATE INDEX IF NOT EXISTS "ProjectProcurementRow_projectId_idx" ON "ProjectProcurementRow"("projectId");
