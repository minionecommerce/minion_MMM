-- Users → Edit Page Layout: one small settings table (a single "layout" row is stored in it).
-- Additive only: one new table. Nothing existing is changed or removed.
CREATE TABLE IF NOT EXISTS "UserSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserSetting_pkey" PRIMARY KEY ("key")
);
ALTER TABLE "UserSetting" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "UserSetting" FROM anon, authenticated;
