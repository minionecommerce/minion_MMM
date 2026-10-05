-- Tasks module: recreates the five task tables exactly as defined in prisma/schema.prisma (they were dropped on 2026-10-02)
-- and adds what the new Tasks page needs: taskType, notes, productId, assignedAt, startedAt, starred, real foreign keys to
-- Lead / Deal / Customer, and the indexes for type + status, person, date and link lookups.

CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "taskType" TEXT NOT NULL DEFAULT 'task',
    "projectId" TEXT,
    "leadId" TEXT,
    "customerId" TEXT,
    "dealId" TEXT,
    "landscapeId" TEXT,
    "productId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Not Started',
    "dueDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "assigneeId" TEXT,
    "assignedByEmployeeId" TEXT,
    "secondaryAssigneeId" TEXT,
    "requiresCompletionProof" BOOLEAN NOT NULL DEFAULT false,
    "requiresVerification" BOOLEAN NOT NULL DEFAULT false,
    "verifiedById" TEXT,
    "completionNotes" TEXT,
    "completedAt" TIMESTAMP(3),
    "isRecurringInstance" BOOLEAN NOT NULL DEFAULT false,
    "recurringSeriesId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskRecurringSeries" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "repeatInterval" INTEGER NOT NULL DEFAULT 1,
    "repeatUnit" TEXT NOT NULL DEFAULT 'Day',
    "repeatUntil" TIMESTAMP(3),
    "projectId" TEXT,
    "assigneeId" TEXT,
    "secondaryAssigneeId" TEXT,
    "requiresCompletionProof" BOOLEAN NOT NULL DEFAULT false,
    "requiresVerification" BOOLEAN NOT NULL DEFAULT false,
    "createdByEmployeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskRecurringSeries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskChecklistItem" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskChecklistItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskComment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskAuditLog" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Task_taskType_status_idx" ON "Task"("taskType", "status");
CREATE INDEX "Task_assigneeId_status_idx" ON "Task"("assigneeId", "status");
CREATE INDEX "Task_assignedByEmployeeId_status_idx" ON "Task"("assignedByEmployeeId", "status");
CREATE INDEX "Task_startDate_idx" ON "Task"("startDate");
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
CREATE INDEX "Task_assignedAt_idx" ON "Task"("assignedAt");
CREATE INDEX "Task_completedAt_idx" ON "Task"("completedAt");
CREATE INDEX "Task_leadId_idx" ON "Task"("leadId");
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");
CREATE INDEX "Task_dealId_idx" ON "Task"("dealId");
CREATE INDEX "Task_customerId_idx" ON "Task"("customerId");

ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_landscapeId_fkey" FOREIGN KEY ("landscapeId") REFERENCES "Landscape"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedByEmployeeId_fkey" FOREIGN KEY ("assignedByEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_secondaryAssigneeId_fkey" FOREIGN KEY ("secondaryAssigneeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_recurringSeriesId_fkey" FOREIGN KEY ("recurringSeriesId") REFERENCES "TaskRecurringSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskRecurringSeries" ADD CONSTRAINT "TaskRecurringSeries_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskRecurringSeries" ADD CONSTRAINT "TaskRecurringSeries_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskRecurringSeries" ADD CONSTRAINT "TaskRecurringSeries_secondaryAssigneeId_fkey" FOREIGN KEY ("secondaryAssigneeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskRecurringSeries" ADD CONSTRAINT "TaskRecurringSeries_createdByEmployeeId_fkey" FOREIGN KEY ("createdByEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskChecklistItem" ADD CONSTRAINT "TaskChecklistItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskAuditLog" ADD CONSTRAINT "TaskAuditLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskAuditLog" ADD CONSTRAINT "TaskAuditLog_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Same lock-down as every other table in this project: only the server (service role) can read or write
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Task" FROM anon, authenticated;
ALTER TABLE "TaskRecurringSeries" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "TaskRecurringSeries" FROM anon, authenticated;
ALTER TABLE "TaskChecklistItem" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "TaskChecklistItem" FROM anon, authenticated;
ALTER TABLE "TaskComment" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "TaskComment" FROM anon, authenticated;
ALTER TABLE "TaskAuditLog" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "TaskAuditLog" FROM anon, authenticated;
