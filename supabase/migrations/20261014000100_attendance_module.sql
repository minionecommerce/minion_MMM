-- Attendance module: a person's own check in / check out, office and site movements, and the monthly calendar built from them.
-- Additive only (nothing existing is changed or removed) and safe to run twice.
--   NEW   "AttendanceDay"      one row per person per calendar day: check in, check out, the office hours that were in force that day
--   NEW   "AttendanceMovement" the Office Out / Office In / Site In / Site Out entries of a day (with the Site Visit Code or the "Other" text)
--   NEW   "AttendanceSetting"  one JSON row per settings group; "schedule" = {"start":"09:00","end":"18:30","weeklyOff":[0]}.
--                              No row is created here: with none, the code uses 09:00 - 18:30 and Sunday as the weekly off.
--   DATA  "Permission"         the six attendance.* permissions (view, create, edit, delete, approve, export) of the new "attendance" module
--   DATA  "RolePermission"     attendance.view + attendance.create for every existing role, so each employee can open the page and mark their
--                              own attendance (the same way every role already has Dashboard and My Work). Admins and Super Admins have everything anyway.
-- To undo: DROP TABLE "AttendanceMovement", "AttendanceDay", "AttendanceSetting"; delete the "Permission" rows of module 'attendance'
-- (their "RolePermission" rows go with them).

CREATE TABLE IF NOT EXISTS "AttendanceDay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "checkInAt" TIMESTAMP(3),
    "checkOutAt" TIMESTAMP(3),
    "stdStartMin" INTEGER,
    "stdEndMin" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AttendanceDay_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AttendanceDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "AttendanceDay_userId_day_key" ON "AttendanceDay"("userId", "day");
CREATE INDEX IF NOT EXISTS "AttendanceDay_day_idx" ON "AttendanceDay"("day");

CREATE TABLE IF NOT EXISTS "AttendanceMovement" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "purposeKind" TEXT,
    "siteVisitCode" TEXT,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AttendanceMovement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AttendanceMovement_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "AttendanceDay"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "AttendanceMovement_dayId_seq_key" ON "AttendanceMovement"("dayId", "seq");

CREATE TABLE IF NOT EXISTS "AttendanceSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AttendanceSetting_pkey" PRIMARY KEY ("key")
);

-- The permissions of the new module (ids follow the existing perm_<module>_<action> pattern; the order is the catalog's)
INSERT INTO "Permission" ("id", "module", "action", "description", "sortOrder", "isLegacy") VALUES
    ('perm_attendance_view',    'attendance', 'view',    'View Attendance',    156, false),
    ('perm_attendance_create',  'attendance', 'create',  'Create Attendance',  157, false),
    ('perm_attendance_edit',    'attendance', 'edit',    'Edit Attendance',    158, false),
    ('perm_attendance_delete',  'attendance', 'delete',  'Delete Attendance',  159, false),
    ('perm_attendance_approve', 'attendance', 'approve', 'Approve Attendance', 160, false),
    ('perm_attendance_export',  'attendance', 'export',  'Export Attendance',  161, false)
ON CONFLICT ("module", "action") DO NOTHING;

-- Every existing role may open the page and mark its own attendance
INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "effect", "scope")
SELECT gen_random_uuid()::text, r."id", p."id", 'ALLOW', 'ALL'
FROM "Role" r
CROSS JOIN "Permission" p
WHERE p."module" = 'attendance' AND p."action" IN ('view', 'create')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
