-- Tasks are being rebuilt from scratch: the old task tables and their data are dropped.
-- A copy of the data was saved to docs/task-data-backup-2026-10-02.json before this ran.
-- "Resource" had a foreign key to "Task": only that constraint is removed (the "taskId" column and every Resource row stay).
ALTER TABLE "Resource" DROP CONSTRAINT IF EXISTS "Resource_taskId_fkey";
DROP TABLE IF EXISTS "TaskAuditLog";
DROP TABLE IF EXISTS "TaskComment";
DROP TABLE IF EXISTS "TaskChecklistItem";
DROP TABLE IF EXISTS "Task";
DROP TABLE IF EXISTS "TaskRecurringSeries";
