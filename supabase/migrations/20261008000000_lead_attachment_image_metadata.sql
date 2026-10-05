-- Image optimization: photos are stored as an optimized WebP plus a thumbnail (see src/lib/leads/image-optimize.ts).
-- Additive only: five new nullable columns and two indexes on "LeadAttachment". Existing rows keep NULLs and keep
-- working; nothing is changed or removed. Table-level RLS and the revokes from anon/authenticated still apply.
ALTER TABLE "LeadAttachment"
  ADD COLUMN IF NOT EXISTS "thumbnailPath" TEXT,
  ADD COLUMN IF NOT EXISTS "width" INTEGER,
  ADD COLUMN IF NOT EXISTS "height" INTEGER,
  ADD COLUMN IF NOT EXISTS "originalSize" INTEGER,
  ADD COLUMN IF NOT EXISTS "contentHash" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "LeadAttachment_thumbnailPath_key" ON "LeadAttachment"("thumbnailPath");
CREATE INDEX IF NOT EXISTS "LeadAttachment_leadId_contentHash_idx" ON "LeadAttachment"("leadId", "contentHash");
