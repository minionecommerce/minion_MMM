-- Super Admin is now a setting of the user (Users → Create / Edit User → Details → Access), not a role.
-- Step 1 of 2 (additive): two new columns on "User", and the people who hold the Super Admin role today are
-- marked Super Admin through the new setting, so nobody loses access when the application code switches over.
-- The old Super Admin role is left untouched here; step 2 (20261011000200) removes it once everything is verified.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accessId" TEXT;

UPDATE "User"
SET "isSuperAdmin" = true
WHERE "deletedAt" IS NULL
  AND "roleId" IN (SELECT "id" FROM "Role" WHERE "isSuperAdmin" = true);
