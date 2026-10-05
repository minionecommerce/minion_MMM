-- Super Admin is now a setting of the user (Users → Create / Edit User → Details → Access), not a role.
-- Step 2 of 2: remove the old Super Admin role. Step 1 (20261011000100) already marked everybody who held it as a
-- Super Admin through the new setting. A backup of the removed roles is in docs/super-admin-role-backup-2026-10-03.json.
UPDATE "User"
SET "roleId" = NULL
WHERE "roleId" IN (SELECT "id" FROM "Role" WHERE "isSuperAdmin" = true OR "key" = 'merged_super_admin');

-- Their permission rows go with them (RolePermission cascades)
DELETE FROM "Role" WHERE "isSuperAdmin" = true OR "key" = 'merged_super_admin';

ALTER TABLE "Role" DROP COLUMN "isSuperAdmin";
