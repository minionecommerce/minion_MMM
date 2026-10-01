-- Leads module (/leads)
-- Additive only: new columns on "Lead", new tables LeadOption / Counter / LeadAttachment.
-- Existing leads are numbered ML1, ML2, ... in the order they were created.

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "amount" DECIMAL(12,2),
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "contactNumber" TEXT,
ADD COLUMN     "conventionalRate" DECIMAL(5,2),
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "dailyTask" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "exactLocation" TEXT,
ADD COLUMN     "exactRequirement" TEXT,
ADD COLUMN     "leadCode" TEXT,
ADD COLUMN     "leadPersonId" TEXT,
ADD COLUMN     "leadSeq" INTEGER,
ADD COLUMN     "leadStatusId" TEXT,
ADD COLUMN     "leadTypeId" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "locationLink" TEXT,
ADD COLUMN     "mainCategoryId" TEXT,
ADD COLUMN     "modeOfCustomerId" TEXT,
ADD COLUMN     "productOrServiceId" TEXT,
ADD COLUMN     "requirementId" TEXT,
ADD COLUMN     "sourceId" TEXT,
ADD COLUMN     "subcategoryId" TEXT,
ADD COLUMN     "updatedById" TEXT;

-- CreateTable
CREATE TABLE "LeadOption" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "key" TEXT,
    "label" TEXT NOT NULL,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Counter" (
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "LeadAttachment" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LeadAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadOption_type_isActive_sortOrder_idx" ON "LeadOption"("type", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "LeadOption_parentId_idx" ON "LeadOption"("parentId");

-- CreateIndex
CREATE INDEX "LeadOption_type_key_idx" ON "LeadOption"("type", "key");

-- CreateIndex
CREATE UNIQUE INDEX "LeadAttachment_storagePath_key" ON "LeadAttachment"("storagePath");

-- CreateIndex
CREATE INDEX "LeadAttachment_leadId_deletedAt_idx" ON "LeadAttachment"("leadId", "deletedAt");

-- CreateIndex
CREATE INDEX "LeadAttachment_status_createdAt_idx" ON "LeadAttachment"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_leadSeq_key" ON "Lead"("leadSeq");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_leadCode_key" ON "Lead"("leadCode");

-- CreateIndex
CREATE INDEX "Lead_deletedAt_leadSeq_idx" ON "Lead"("deletedAt", "leadSeq");

-- CreateIndex
CREATE INDEX "Lead_contactNumber_idx" ON "Lead"("contactNumber");

-- CreateIndex
CREATE INDEX "Lead_leadPersonId_idx" ON "Lead"("leadPersonId");

-- CreateIndex
CREATE INDEX "Lead_leadStatusId_idx" ON "Lead"("leadStatusId");

-- CreateIndex
CREATE INDEX "Lead_sourceId_idx" ON "Lead"("sourceId");

-- CreateIndex
CREATE INDEX "Lead_mainCategoryId_idx" ON "Lead"("mainCategoryId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_leadPersonId_fkey" FOREIGN KEY ("leadPersonId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_productOrServiceId_fkey" FOREIGN KEY ("productOrServiceId") REFERENCES "LeadOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "LeadOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_modeOfCustomerId_fkey" FOREIGN KEY ("modeOfCustomerId") REFERENCES "LeadOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "LeadOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_mainCategoryId_fkey" FOREIGN KEY ("mainCategoryId") REFERENCES "LeadOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LeadOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "LeadOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_leadStatusId_fkey" FOREIGN KEY ("leadStatusId") REFERENCES "LeadOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_leadTypeId_fkey" FOREIGN KEY ("leadTypeId") REFERENCES "LeadOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadOption" ADD CONSTRAINT "LeadOption_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "LeadOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAttachment" ADD CONSTRAINT "LeadAttachment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- Row level security: the app connects as the table owner (bypasses RLS); the public API roles get nothing.
ALTER TABLE "LeadOption" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Counter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeadAttachment" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "LeadOption", "Counter", "LeadAttachment" FROM anon, authenticated;

-- Backfill: number existing leads in creation order, copy name/phone from the customer
WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY "createdAt", id) AS n FROM "Lead" WHERE "leadSeq" IS NULL
)
UPDATE "Lead" l
SET "leadSeq" = o.n, "leadCode" = 'ML' || o.n, "leadNumber" = 'ML' || o.n
FROM ordered o WHERE l.id = o.id;

UPDATE "Lead" l
SET "customerName" = c.name,
    "contactNumber" = NULLIF(regexp_replace(c.phone, '[^0-9+]', '', 'g'), '')
FROM "Customer" c
WHERE c.id = l."customerId" AND l."customerName" IS NULL;

-- The counter continues after the highest number in use and never goes backwards
INSERT INTO "Counter" ("key", "value", "updatedAt")
SELECT 'lead', COALESCE(MAX("leadSeq"), 0), now() FROM "Lead"
ON CONFLICT ("key") DO UPDATE SET "value" = GREATEST("Counter"."value", EXCLUDED."value");
