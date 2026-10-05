import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac/effective";
import { ServiceError } from "@/lib/users/service";
import { AUDIO_FILE_EXTENSIONS, isAllowedAudioType, sniffAudioType } from "@/lib/leads/audio-types";
import { IMAGE_FILE_EXTENSIONS, isAllowedImageType, maxFileBytes, maxFileLabel, storageExtension, UNKNOWN_MIME_TYPE } from "@/lib/leads/constants";
import { formatDate, formatTime, todayBounds, zonedDateTime } from "@/lib/leads/format";
import { sniffImageType } from "@/lib/leads/image-types";
import { createReadUrls, createUploadUrl, readHead, removeObjects, statObject } from "@/lib/leads/storage";
import {
  buildTaskWhere, buildViewCountWhere, isCompletedStatus, remainingText, STARTED_STATUS, TASK_PAGE_SIZE, TASK_TYPES, TASK_VIEWS,
  taskOrderBy, taskVisibility, timeAgo, type TaskListParams, type TaskScope, type TaskTypeId, type TaskViewId,
} from "./rules";
import { checkEditAgainstType, MAX_TASK_FILES, type TaskEditInput, type TaskInput } from "./schemas";
import type { DateTimeText, LinkOption, TaskDetail, TaskFile, TaskListResult, TaskOptions, TaskRow } from "./types";

export const TASK_BUCKET = process.env.TASK_ATTACHMENTS_BUCKET || "task-attachments";

const badRequest = (m: string) => new ServiceError(400, m);
const notFound = () => new ServiceError(404, "Task not found");

type Action = "view" | "create" | "edit" | "delete";
function need(ctx: AuthContext, action: Action) {
  if (!hasPermission(ctx.permissions, "tasks", action)) throw new ServiceError(403, `You do not have permission to ${action} tasks.`);
}

// ---------------------------------------------------------------------------
// Who the signed-in user may see (see rules.ts). Managers include everyone who reports to them, directly or not.
// ---------------------------------------------------------------------------
export async function taskScope(ctx: AuthContext): Promise<TaskScope> {
  if (ctx.isAdmin || ctx.isSuperAdmin) return { all: true, me: ctx.employeeId, people: ctx.employeeId ? [ctx.employeeId] : [] };
  if (!ctx.employeeId) return { all: false, me: null, people: [] };
  const reports = await prisma.$queryRaw<{ id: string }[]>`
    WITH RECURSIVE reports AS (
      SELECT "id" FROM "Employee" WHERE "managerId" = ${ctx.employeeId}
      UNION
      SELECT e."id" FROM "Employee" e JOIN reports r ON e."managerId" = r."id"
    ) SELECT "id" FROM reports`;
  return { all: false, me: ctx.employeeId, people: [ctx.employeeId, ...reports.map(r => r.id)] };
}

type CapabilityInput = { assigneeId: string | null; assignedByEmployeeId: string | null; status: string };

// What the user may do to one task. The same checks run again in every action, so hiding a button is never the only protection.
function capabilities(ctx: AuthContext, scope: TaskScope, t: CapabilityInput) {
  const has = (a: Action) => hasPermission(ctx.permissions, "tasks", a);
  const done = isCompletedStatus(t.status);
  const taskPerson = scope.all || (!!t.assigneeId && scope.people.includes(t.assigneeId));
  const assigner = scope.all || (!!t.assignedByEmployeeId && scope.people.includes(t.assignedByEmployeeId));
  return {
    start: has("edit") && taskPerson && !done && t.status !== STARTED_STATUS,
    complete: has("edit") && taskPerson && !done,
    upload: has("edit") && taskPerson,
    star: has("edit") && !done,
    edit: has("edit") && assigner,
    delete: has("delete") && assigner,
  };
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------
const ROW_SELECT = {
  id: true, taskType: true, title: true, description: true, notes: true, status: true, priority: true, productId: true,
  startDate: true, dueDate: true, assignedAt: true, startedAt: true, completedAt: true, starred: true, requiresCompletionProof: true,
  assigneeId: true, assignedByEmployeeId: true,
  assignee: { select: { id: true, user: { select: { name: true } } } },
  assignedBy: { select: { id: true, user: { select: { name: true } } } },
  lead: { select: { id: true, leadCode: true, customerName: true, contactNumber: true, exactRequirement: true, requirement: true, customer: { select: { customerCode: true } } } },
  customer: { select: { customerCode: true } },
  _count: { select: { resources: true } },
} satisfies Prisma.TaskSelect;
type RowRecord = Prisma.TaskGetPayload<{ select: typeof ROW_SELECT }>;

const when = (d: Date | null): DateTimeText | null => (d ? { date: formatDate(d), time: formatTime(d) } : null);
const person = (e: { id: string; user: { name: string | null } } | null) => (e ? { id: e.id, name: e.user.name ?? "—" } : null);

function toRow(t: RowRecord, ctx: AuthContext, scope: TaskScope, now: Date, today: [Date, Date]): TaskRow {
  const done = isCompletedStatus(t.status);
  return {
    id: t.id,
    taskType: (TASK_TYPES.some(x => x.id === t.taskType) ? t.taskType : "task") as TaskTypeId,
    title: t.title,
    assigned: when(t.assignedAt)!,
    start: when(t.startDate),
    due: when(t.dueDate),
    remaining: remainingText(t.dueDate, done, now, today),
    completed: when(t.completedAt),
    assignee: person(t.assignee),
    assignedBy: person(t.assignedBy),
    lead: t.lead ? { id: t.lead.id, code: t.lead.leadCode ?? "—" } : null,
    // Lead tasks show the customer and the lead's requirement above the task's own notes, as in the legacy page
    notes: {
      customerName: t.lead?.customerName ?? null,
      contactNumber: t.lead?.contactNumber ?? null,
      requirement: t.lead ? t.lead.exactRequirement ?? t.lead.requirement ?? null : null,
      text: t.notes,
    },
    status: t.status,
    statusAgo: timeAgo(done ? t.completedAt : t.assignedAt, now),
    productId: t.productId,
    customerCode: t.customer?.customerCode ?? t.lead?.customer?.customerCode ?? null,
    starred: t.starred,
    filesCount: t._count.resources,
    requiresCompletionProof: t.requiresCompletionProof,
    can: capabilities(ctx, scope, t),
  };
}

const dayBounds = (day: string) => todayBounds(new Date(`${day}T12:00:00Z`));

export async function listTasks(ctx: AuthContext, params: TaskListParams): Promise<TaskListResult> {
  need(ctx, "view");
  const now = new Date();
  const today = todayBounds(now);
  const scope = await taskScope(ctx);
  const range = params.dateField && (params.from || params.to)
    ? { field: params.dateField, from: params.from ? dayBounds(params.from)[0] : undefined, to: params.to ? dayBounds(params.to)[1] : undefined }
    : undefined;

  // One page of rows, plus the count of every view (type, search and date filter applied) for the tab badges
  const [rows, ...countList] = await Promise.all([
    prisma.task.findMany({
      where: buildTaskWhere(params, scope, now, range),
      select: ROW_SELECT,
      orderBy: taskOrderBy(params.view, params.sort, params.dir),
      skip: (params.page - 1) * TASK_PAGE_SIZE,
      take: TASK_PAGE_SIZE,
    }),
    ...TASK_VIEWS.map(v => prisma.task.count({ where: buildViewCountWhere(v.id, params, scope, now, range) })),
  ]);
  const counts = Object.fromEntries(TASK_VIEWS.map((v, i) => [v.id, countList[i]])) as Record<TaskViewId, number>;
  const total = counts[params.view];
  return {
    rows: rows.map(r => toRow(r, ctx, scope, now, today)),
    total,
    counts,
    page: params.page,
    pageCount: Math.max(1, Math.ceil(total / TASK_PAGE_SIZE)),
    pageSize: TASK_PAGE_SIZE,
  };
}

export async function getTaskOptions(ctx: AuthContext): Promise<TaskOptions> {
  need(ctx, "view");
  const employees = await prisma.employee.findMany({
    where: { user: { deletedAt: null, status: "ACTIVE" } },
    select: { id: true, designation: true, user: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  });
  return { employees: employees.map(e => ({ id: e.id, designation: e.designation, name: e.user.name ?? "—" })) };
}

// Pick-lists for the Create New Task form. Needs the view permission of the module being searched.
export async function searchLinks(ctx: AuthContext, kind: "lead" | "project" | "deal", q: string): Promise<LinkOption[]> {
  need(ctx, "create");
  const moduleKey = kind === "lead" ? "leads" : kind === "project" ? "projects" : "deals";
  if (!hasPermission(ctx.permissions, moduleKey, "view")) throw new ServiceError(403, `You do not have permission to view ${moduleKey}.`);
  const has = { contains: q, mode: "insensitive" as const };
  if (kind === "lead") {
    const leads = await prisma.lead.findMany({
      // A converted lead is a deal now (it is offered under Deal); tasks already linked to it keep their link
      where: { deletedAt: null, convertedAt: null, ...(q ? { OR: [{ leadCode: has }, { customerName: has }, { contactNumber: has }] } : {}) },
      select: { id: true, leadCode: true, customerName: true },
      orderBy: { leadSeq: { sort: "desc", nulls: "last" } },
      take: 20,
    });
    return leads.map(l => ({ id: l.id, label: `${l.leadCode ?? "Lead"} · ${l.customerName ?? ""}`.trim() }));
  }
  if (kind === "deal") {
    const deals = await prisma.deal.findMany({
      where: q ? { deletedAt: null, OR: [{ dealNumber: has }, { title: has }] } : { deletedAt: null },
      select: { id: true, dealNumber: true, title: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return deals.map(d => ({ id: d.id, label: `${d.dealNumber ?? "Deal"} · ${d.title}` }));
  }
  const projects = await prisma.project.findMany({ where: q ? { name: has } : {}, select: { id: true, name: true }, orderBy: { createdAt: "desc" }, take: 20 });
  return projects.map(p => ({ id: p.id, label: p.name }));
}

// ---------------------------------------------------------------------------
// One task, for the details window: only if the user may see it
// ---------------------------------------------------------------------------
async function loadVisible(scope: TaskScope, id: string) {
  const t = await prisma.task.findFirst({ where: { AND: [{ id }, taskVisibility(scope)] }, select: ROW_SELECT });
  if (!t) throw notFound();
  return t;
}

const parts = (d: Date | null) => (d ? { date: formatDateRaw(d), time: formatTimeRaw(d) } : null);
// yyyy-mm-dd and HH:mm in the CRM time zone, for the edit form's inputs
function formatDateRaw(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: process.env.CRM_TIMEZONE || "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
function formatTimeRaw(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: process.env.CRM_TIMEZONE || "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
}

export async function getTaskDetail(ctx: AuthContext, id: string): Promise<TaskDetail> {
  need(ctx, "view");
  const scope = await taskScope(ctx);
  const t = await loadVisible(scope, id);
  const now = new Date();
  const [files, history, links] = await Promise.all([
    prisma.resource.findMany({ where: { taskId: id }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, storagePath: true, mimeType: true, size: true, createdAt: true } }),
    prisma.taskAuditLog.findMany({ where: { taskId: id }, orderBy: { createdAt: "desc" }, take: 20, select: { action: true, createdAt: true, employee: { select: { user: { select: { name: true } } } } } }),
    prisma.task.findUnique({ where: { id }, select: { projectId: true, dealId: true, leadId: true, project: { select: { name: true } }, deal: { select: { dealNumber: true, title: true } } } }),
  ]);
  const urls = await createReadUrls(files.map(f => f.storagePath), TASK_BUCKET);
  const start = parts(t.startDate);
  const due = parts(t.dueDate);
  const link: TaskDetail["link"] = t.lead
    ? { kind: "lead", id: t.lead.id, label: `${t.lead.leadCode ?? "Lead"} · ${t.lead.customerName ?? ""}`.trim() }
    : links?.projectId ? { kind: "project", id: links.projectId, label: links.project?.name ?? "Project" }
    : links?.dealId ? { kind: "deal", id: links.dealId, label: `${links.deal?.dealNumber ?? "Deal"} · ${links.deal?.title ?? ""}`.trim() }
    : null;
  return {
    ...toRow(t, ctx, scope, now, todayBounds(now)),
    description: t.description,
    priority: t.priority,
    startRaw: start?.date ?? null,
    startTimeRaw: start?.time ?? null,
    dueRaw: due?.date ?? null,
    dueTimeRaw: due?.time ?? null,
    link,
    files: files.map<TaskFile>(f => ({ id: f.id, name: f.name, mimeType: f.mimeType, size: f.size, url: urls.get(f.storagePath) ?? null, createdAt: f.createdAt.toISOString() })),
    history: history.map(h => ({ action: h.action, by: h.employee.user.name ?? "—", at: `${formatDate(h.createdAt)} ${formatTime(h.createdAt)}` })),
  };
}

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------
async function audit(db: Prisma.TransactionClient | typeof prisma, taskId: string, employeeId: string, action: string, oldValue?: unknown, newValue?: unknown) {
  await db.taskAuditLog.create({ data: { taskId, employeeId, action, oldValue: oldValue === undefined ? null : String(oldValue), newValue: newValue === undefined ? null : String(newValue) } });
}

function requireEmployee(ctx: AuthContext) {
  if (!ctx.employeeId) throw badRequest("Your account is not linked to an employee record, so you cannot do this.");
  return ctx.employeeId;
}

// The task type decides what it links to. A Deal or Project task also carries the real lead / customer behind it.
async function resolveLinks(ctx: AuthContext, type: TaskTypeId, input: { leadId: string | null; projectId: string | null; dealId: string | null }) {
  const out = { leadId: null as string | null, projectId: null as string | null, dealId: null as string | null, customerId: null as string | null };
  const canSee = (module: string) => hasPermission(ctx.permissions, module, "view");
  if (type === "lead" && input.leadId) {
    if (!canSee("leads")) throw new ServiceError(403, "You do not have permission to view leads.");
    const lead = await prisma.lead.findFirst({ where: { id: input.leadId, deletedAt: null }, select: { id: true, customerId: true } });
    if (!lead) throw badRequest("That lead was not found.");
    return { ...out, leadId: lead.id, customerId: lead.customerId };
  }
  if (type === "project" && input.projectId) {
    if (!canSee("projects")) throw new ServiceError(403, "You do not have permission to view projects.");
    const project = await prisma.project.findUnique({ where: { id: input.projectId }, select: { id: true, customerId: true, leadId: true } });
    if (!project) throw badRequest("That project was not found.");
    return { ...out, projectId: project.id, customerId: project.customerId, leadId: project.leadId };
  }
  if (type === "deal" && input.dealId) {
    if (!canSee("deals")) throw new ServiceError(403, "You do not have permission to view deals.");
    const deal = await prisma.deal.findFirst({ where: { id: input.dealId, deletedAt: null }, select: { id: true, customerId: true, leadId: true } });
    if (!deal) throw badRequest("That deal was not found.");
    return { ...out, dealId: deal.id, customerId: deal.customerId, leadId: deal.leadId };
  }
  return out;
}

// Date and time typed in the CRM time zone. When only a date is given, the usual working hours are used.
const stamp = (date: string | null, time: string | null, fallback: string) => (date ? zonedDateTime(date, time ?? fallback) : null);

async function assertAssignee(id: string) {
  const e = await prisma.employee.findFirst({ where: { id, user: { deletedAt: null, status: "ACTIVE" } }, select: { id: true } });
  if (!e) throw badRequest("The task person is not valid.");
}

export async function createTask(ctx: AuthContext, input: TaskInput) {
  need(ctx, "create");
  const me = requireEmployee(ctx);
  const assigneeId = input.assigneeId ?? me;
  await assertAssignee(assigneeId);
  const links = await resolveLinks(ctx, input.taskType, input);
  const task = await prisma.$transaction(async tx => {
    const created = await tx.task.create({
      data: {
        taskType: input.taskType,
        title: input.title,
        notes: input.notes,
        productId: input.productId,
        priority: input.priority,
        status: "Not Started",
        startDate: stamp(input.startDate, input.startTime, "09:00"),
        dueDate: stamp(input.dueDate, input.dueTime, "18:00"),
        assigneeId,
        assignedByEmployeeId: me,
        requiresCompletionProof: input.requiresCompletionProof,
        ...links,
      },
      select: { id: true },
    });
    await audit(tx, created.id, me, "CREATED", undefined, input.taskType);
    return created;
  });
  return { id: task.id };
}

async function loadForAction(ctx: AuthContext, id: string, ability: keyof ReturnType<typeof capabilities>) {
  const scope = await taskScope(ctx);
  const t = await loadVisible(scope, id);
  if (!capabilities(ctx, scope, t)[ability]) throw new ServiceError(403, "You do not have permission to do that to this task.");
  return t;
}

export async function updateTask(ctx: AuthContext, id: string, input: TaskEditInput) {
  need(ctx, "edit");
  const me = requireEmployee(ctx);
  const t = await loadForAction(ctx, id, "edit");
  const type = (TASK_TYPES.some(x => x.id === t.taskType) ? t.taskType : "task") as TaskTypeId;
  const problems = checkEditAgainstType(input, type);
  if (problems.length) throw badRequest(problems[0].message);
  const assigneeId = input.assigneeId ?? t.assigneeId ?? me;
  if (assigneeId !== t.assigneeId) await assertAssignee(assigneeId);
  const links = await resolveLinks(ctx, type, input);
  await prisma.$transaction(async tx => {
    await tx.task.update({
      where: { id },
      data: {
        title: input.title,
        notes: input.notes,
        productId: input.productId,
        priority: input.priority,
        startDate: stamp(input.startDate, input.startTime, "09:00"),
        dueDate: stamp(input.dueDate, input.dueTime, "18:00"),
        assigneeId,
        ...(assigneeId !== t.assigneeId ? { assignedAt: new Date() } : {}),
        requiresCompletionProof: input.requiresCompletionProof,
        ...links,
      },
    });
    await audit(tx, id, me, assigneeId !== t.assigneeId ? "ASSIGNED" : "EDITED", t.assigneeId, assigneeId);
  });
}

export async function startTask(ctx: AuthContext, id: string) {
  need(ctx, "edit");
  const me = requireEmployee(ctx);
  const t = await loadForAction(ctx, id, "start");
  await prisma.$transaction(async tx => {
    await tx.task.update({ where: { id }, data: { status: STARTED_STATUS, startedAt: new Date() } });
    await audit(tx, id, me, "STARTED", t.status, STARTED_STATUS);
  });
}

// Complete: saves the status and the time, and moves the task into Completed Task. A task that requires proof needs a file first.
export async function completeTask(ctx: AuthContext, id: string) {
  need(ctx, "edit");
  const me = requireEmployee(ctx);
  const t = await loadForAction(ctx, id, "complete");
  if (t.requiresCompletionProof && t._count.resources === 0) throw badRequest("Upload a proof file before completing this task.");
  await prisma.$transaction(async tx => {
    await tx.task.update({ where: { id }, data: { status: "Completed", completedAt: new Date() } });
    await audit(tx, id, me, "COMPLETED", t.status, "Completed");
  });
}

export async function toggleStar(ctx: AuthContext, id: string) {
  need(ctx, "edit");
  const me = requireEmployee(ctx);
  const t = await loadForAction(ctx, id, "star");
  await prisma.$transaction(async tx => {
    await tx.task.update({ where: { id }, data: { starred: !t.starred } });
    await audit(tx, id, me, t.starred ? "UNSTARRED" : "STARRED");
  });
  return { starred: !t.starred };
}

export async function deleteTask(ctx: AuthContext, id: string) {
  need(ctx, "delete");
  await loadForAction(ctx, id, "delete");
  const files = await prisma.resource.findMany({ where: { taskId: id }, select: { storagePath: true } });
  // File records first: their link to the task is "set null", so they would be left behind once the task is gone
  await prisma.$transaction([prisma.resource.deleteMany({ where: { taskId: id } }), prisma.task.delete({ where: { id } })]); // comments, checklist and history go with the task
  await removeObjects(files.map(f => f.storagePath), TASK_BUCKET);
}

// ---------------------------------------------------------------------------
// Files: browser -> signed URL -> private bucket directly. The server records a file only after it has checked the stored bytes.
// ---------------------------------------------------------------------------
export async function signTaskFiles(ctx: AuthContext, id: string, files: { name: string; type: string; size: number }[]) {
  need(ctx, "edit");
  await loadForAction(ctx, id, "upload");
  const existing = await prisma.resource.count({ where: { taskId: id } });
  if (existing + files.length > MAX_TASK_FILES) throw badRequest(`A task can have at most ${MAX_TASK_FILES} files.`);
  const uploads: { index: number; path: string; uploadUrl: string }[] = [];
  for (const [index, f] of files.entries()) {
    const ext = isAllowedAudioType(f.type) ? AUDIO_FILE_EXTENSIONS[f.type] : isAllowedImageType(f.type) ? IMAGE_FILE_EXTENSIONS[f.type] : storageExtension(f.name);
    const path = `tasks/${id}/${randomUUID()}.${ext}`; // never built from the user's file name
    uploads.push({ index, path, uploadUrl: await createUploadUrl(path, TASK_BUCKET) });
  }
  return { uploads };
}

export async function completeTaskFiles(ctx: AuthContext, id: string, files: { path: string; name: string; type: string; size: number }[]) {
  need(ctx, "edit");
  const me = requireEmployee(ctx);
  await loadForAction(ctx, id, "upload");
  const saved: string[] = [];
  const problems: string[] = [];
  for (const f of files) {
    if (!f.path.startsWith(`tasks/${id}/`) || f.path.includes("..")) { problems.push(`${f.name}: not a valid upload`); continue; }
    const already = await prisma.resource.findFirst({ where: { storagePath: f.path }, select: { id: true } });
    if (already) { problems.push(`${f.name}: already saved`); continue; }
    const stat = await statObject(f.path, TASK_BUCKET);
    if (!stat) { problems.push(`${f.name}: the upload did not finish`); continue; }
    const head = await readHead(f.path, 32, TASK_BUCKET);
    // The stored bytes must be what was declared; the browser's word is not enough
    const imageOk = !f.type.startsWith("image/") || sniffImageType(head) === f.type;
    const audioOk = !f.type.startsWith("audio/") || sniffAudioType(head, true) === f.type;
    if (stat.size <= 0 || stat.size > maxFileBytes(f.type) || !imageOk || !audioOk) {
      await removeObjects([f.path], TASK_BUCKET);
      problems.push(`${f.name}: ${!imageOk ? "not a valid image" : !audioOk ? "not a valid audio file" : `empty or larger than ${maxFileLabel(f.type)}`}`);
      continue;
    }
    await prisma.resource.create({
      data: { name: f.name.slice(0, 255), storagePath: f.path, mimeType: f.type || UNKNOWN_MIME_TYPE, size: stat.size, ownerId: me, taskId: id },
    });
    saved.push(f.name);
  }
  if (saved.length) await audit(prisma, id, me, "FILE_UPLOADED", undefined, saved.join(", "));
  return { saved, problems };
}

export async function removeTaskFile(ctx: AuthContext, id: string, fileId: string) {
  need(ctx, "edit");
  const me = requireEmployee(ctx);
  await loadForAction(ctx, id, "upload");
  const f = await prisma.resource.findFirst({ where: { id: fileId, taskId: id }, select: { id: true, storagePath: true, name: true } });
  if (!f) throw new ServiceError(404, "File not found");
  await prisma.resource.delete({ where: { id: f.id } });
  await removeObjects([f.storagePath], TASK_BUCKET);
  await audit(prisma, id, me, "FILE_REMOVED", f.name);
}
