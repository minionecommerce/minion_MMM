-- Deals -> Convert to Project: the quotes chosen in the popup are linked to the project.
-- Additive only: one new, empty table. No existing table, column, row or setting is changed.
--   ProjectQuote   one row per (project, quote). A project that has rows counts only these quotes, and only the accepted ones, in its
--                  Project Value. A project with no rows (every project made before this) keeps counting every accepted quote of its deal.
-- To undo: DROP TABLE "ProjectQuote" (nothing else refers to it).

CREATE TABLE IF NOT EXISTS "ProjectQuote" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectQuote_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectQuote_projectId_quoteId_key" ON "ProjectQuote"("projectId", "quoteId");
CREATE INDEX IF NOT EXISTS "ProjectQuote_quoteId_idx" ON "ProjectQuote"("quoteId");
ALTER TABLE "ProjectQuote" ADD CONSTRAINT "ProjectQuote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectQuote" ADD CONSTRAINT "ProjectQuote_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
