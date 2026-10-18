-- Unified Vendors: Material and Service Vendors share ONE ID series (V1, V2, V3 ...).
-- Nothing is deleted. Every vendor, its prices, remarks, Pre-Payment / Payment Collection links and Project involvement rows keep
-- their database id, so all relations keep working. Only the vendor's visible ID (code, and the seq behind it) changes; the ID it had
-- before is kept in "legacyCode" (MV12, SV3 ...) so it can still be looked up and nothing is lost.
--   1. "legacyCode" on both vendor tables.
--   2. Every vendor (deleted ones included, so no old number can ever be reused) is numbered in creation order across both tables.
--   3. The shared counter row "vendor" is set to the highest number, so the next vendor is V<max+1>. New vendors take their number
--      from that one row inside the transaction that saves them (INSERT ... ON CONFLICT DO UPDATE), so two people saving at the
--      same moment can never get the same number.
-- Run once. A second run does nothing (it only touches rows whose "legacyCode" is still empty).
-- To undo: copy "legacyCode" back into "code" and set "seq" to its number, then drop the column. The old counters
-- ("materialVendor", "serviceVendor") are left untouched for that reason.

ALTER TABLE "MaterialVendor" ADD COLUMN IF NOT EXISTS "legacyCode" TEXT;
ALTER TABLE "ServiceVendor" ADD COLUMN IF NOT EXISTS "legacyCode" TEXT;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "MaterialVendor" WHERE "legacyCode" IS NULL) OR EXISTS (SELECT 1 FROM "ServiceVendor" WHERE "legacyCode" IS NULL) THEN
    -- numbers are given out after the ones already used by an earlier run (none on the first run)
    CREATE TEMP TABLE vendor_numbering ON COMMIT DROP AS
      SELECT kind, id,
             row_number() OVER (ORDER BY "createdAt", kind, seq) + COALESCE((SELECT "value" FROM "Counter" WHERE "key" = 'vendor'), 0) AS n
      FROM (
        SELECT 'M'::text AS kind, id, "createdAt", seq FROM "MaterialVendor" WHERE "legacyCode" IS NULL
        UNION ALL
        SELECT 'S'::text, id, "createdAt", seq FROM "ServiceVendor" WHERE "legacyCode" IS NULL
      ) v;

    -- step one moves the old values out of the way (seq and code are unique), step two writes the new ones
    UPDATE "MaterialVendor" SET "legacyCode" = "code", "seq" = -"seq", "code" = '~' || "code" WHERE "legacyCode" IS NULL;
    UPDATE "ServiceVendor"  SET "legacyCode" = "code", "seq" = -"seq", "code" = '~' || "code" WHERE "legacyCode" IS NULL;
    UPDATE "MaterialVendor" m SET "seq" = n.n, "code" = 'V' || n.n FROM vendor_numbering n WHERE n.kind = 'M' AND n.id = m.id;
    UPDATE "ServiceVendor"  s SET "seq" = n.n, "code" = 'V' || n.n FROM vendor_numbering n WHERE n.kind = 'S' AND n.id = s.id;

    INSERT INTO "Counter" ("key", "value", "updatedAt")
      VALUES ('vendor', (SELECT COALESCE(MAX(n), 0) FROM vendor_numbering), now())
      ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = now();
  END IF;
END $$;
