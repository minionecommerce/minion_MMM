import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac/effective";
import { ServiceError } from "@/lib/users/service";
import { ALLOWED_ATTACHMENT_TYPES, FOLLOWUP_ATTACHMENT_TYPES, MAX_ATTACHMENTS_PER_LEAD, MAX_ATTACHMENT_BYTES } from "./constants";
import { formatDate, formatTime, normalizePhone, zonedDateTime } from "./format";
import type { FollowUpInput, LeadInput } from "./schemas";
import { getLeadRow } from "./queries";
import { checkLeadAgainstLayout, type CustomValues } from "./layout";
import { createReadUrls, createUploadUrl, removeObjects, statObject } from "./storage";

const badRequest = (m: string) => new ServiceError(400, m);
const notFound = () => new ServiceError(404, "Lead not found");

type Db = Prisma.TransactionClient | typeof prisma;

function need(actor: AuthContext, action: "view" | "create" | "edit" | "delete") {
  if (!hasPermission(actor.permissions, "leads", action)) {
    throw new ServiceError(403, `You do not have permission to ${action} leads.`);
  }
}

// ---------------------------------------------------------------------------
// Lead ID: one atomic counter row. The row lock is held until the surrounding
// transaction commits, so two users can never receive the same number, and
// numbers are never reused after a delete.
// ---------------------------------------------------------------------------
export async function nextLeadSeq(db: Db): Promise<number> {
  const rows = await db.$queryRaw<{ value: number }[]>`
    INSERT INTO "Counter" ("key", "value", "updatedAt") VALUES ('lead', 1, now())
    ON CONFLICT ("key") DO UPDATE SET "value" = "Counter"."value" + 1, "updatedAt" = now()
    RETURNING "value"`;
  return Number(rows[0].value);
}

export const leadCodeFor = (seq: number) => `ML${seq}`;

// ---------------------------------------------------------------------------
// Reference validation: every id must exist, be the right kind of option,
// and the category chain must be consistent. Nothing from the browser is trusted.
// ---------------------------------------------------------------------------
async function resolveReferences(input: LeadInput) {
  const optionIds = [input.productOrServiceId, input.requirementId, input.modeOfCustomerId, input.sourceId, input.mainCategoryId, input.categoryId, input.subcategoryId, input.leadStatusId, input.leadTypeId].filter((x): x is string => !!x);
  const options = await prisma.leadOption.findMany({
    where: { id: { in: optionIds } },
    select: { id: true, type: true, parentId: true, label: true },
  });
  const byId = new Map(options.map(o => [o.id, o]));
  const expect = (id: string | null | undefined, type: string, label: string) => {
    if (!id) return null;
    const o = byId.get(id);
    if (!o || o.type !== type) throw badRequest(`${label} is not valid`);
    return o;
  };
  expect(input.productOrServiceId, "PRODUCT_OR_SERVICE", "Product or Service");
  const requirement = expect(input.requirementId, "REQUIREMENT", "Requirements");
  expect(input.modeOfCustomerId, "MODE_OF_CUSTOMER", "Mode of Customer");
  const source = expect(input.sourceId, "SOURCE", "Source");
  expect(input.mainCategoryId, "MAIN_CATEGORY", "Main Category");
  const category = expect(input.categoryId, "CATEGORY", "Category");
  const subcategory = expect(input.subcategoryId, "SUBCATEGORY", "Subcategory");
  expect(input.leadStatusId, "LEAD_STATUS", "Lead Status");
  expect(input.leadTypeId, "LEAD_TYPE", "Type Of Lead");
  if (category && category.parentId !== input.mainCategoryId) throw badRequest("Category does not belong to the selected Main Category");
  if (subcategory && subcategory.parentId !== input.categoryId) throw badRequest("Subcategory does not belong to the selected Category");
  if (subcategory && !category) throw badRequest("Choose a Category for the Subcategory");

  const employeeIds = [input.taskAssignedPersonId, input.leadPersonId].filter((x): x is string => !!x);
  const employees = await prisma.employee.findMany({
    where: { id: { in: employeeIds }, user: { deletedAt: null, status: "ACTIVE" } },
    select: { id: true },
  });
  const known = new Set(employees.map(e => e.id));
  if (input.taskAssignedPersonId && !known.has(input.taskAssignedPersonId)) throw badRequest("Task Assigned Person is not valid");
  if (input.leadPersonId && !known.has(input.leadPersonId)) throw badRequest("Lead Person is not valid");

  return { requirementLabel: requirement?.label ?? null, sourceLabel: source?.label ?? null };
}

async function findOrCreateCustomer(db: Db, name: string, phone: string) {
  const exact = await db.customer.findFirst({ where: { phone }, select: { id: true } });
  if (exact) return exact.id;
  // Older customers were typed with spaces/dashes: compare digits only
  const loose = await db.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "Customer" WHERE regexp_replace("phone", '[^0-9+]', '', 'g') = ${phone} LIMIT 1`;
  if (loose[0]) return loose[0].id;
  return (await db.customer.create({ data: { name, phone, customerType: "Individual" }, select: { id: true } })).id;
}

function leadData(input: LeadInput, refs: Awaited<ReturnType<typeof resolveReferences>>, actor: AuthContext, phone: string, custom: CustomValues) {
  return {
    customerName: input.customerName,
    contactNumber: phone,
    salesExecutiveId: input.taskAssignedPersonId,
    leadPersonId: input.leadPersonId ?? actor.employeeId ?? null,
    productOrServiceId: input.productOrServiceId,
    requirementId: input.requirementId,
    exactRequirement: input.exactRequirement,
    modeOfCustomerId: input.modeOfCustomerId,
    sourceId: input.sourceId,
    location: input.location,
    exactLocation: input.exactLocation,
    locationLink: input.locationLink,
    mainCategoryId: input.mainCategoryId,
    categoryId: input.categoryId,
    subcategoryId: input.subcategoryId,
    leadStatusId: input.leadStatusId,
    leadTypeId: input.leadTypeId,
    amount: input.amount,
    conventionalRate: input.conventionalRate,
    notes: input.notes,
    dailyTask: input.dailyTask,
    customFields: Object.keys(custom).length ? (custom as Prisma.InputJsonObject) : Prisma.DbNull,
    // Mirror into the older CRM columns so /crm keeps showing these leads sensibly
    source: refs.sourceLabel,
    requirement: input.exactRequirement ?? refs.requirementLabel,
    siteLocation: input.location,
    expectedValue: input.amount,
  };
}

async function audit(db: Db, actor: AuthContext, leadId: string, action: string, oldValue?: unknown, newValue?: unknown) {
  await db.cRMAuditLog.create({
    data: {
      entityType: "Lead",
      entityId: leadId,
      leadId,
      action,
      performedById: actor.employeeId,
      oldValue: oldValue === undefined ? null : JSON.stringify(oldValue),
      newValue: newValue === undefined ? null : JSON.stringify(newValue),
    },
  });
}

const TX = { maxWait: 10_000, timeout: 20_000 };

async function insertLead(actor: AuthContext, input: LeadInput, action: string) {
  const custom = await checkLeadAgainstLayout(input);
  const refs = await resolveReferences(input);
  const phone = normalizePhone(input.contactNumber)!;
  return prisma.$transaction(async tx => {
    const customerId = await findOrCreateCustomer(tx, input.customerName, phone);
    // Take the number last, so the counter row is locked for as short a time as possible
    const seq = await nextLeadSeq(tx);
    const code = leadCodeFor(seq);
    const lead = await tx.lead.create({
      data: {
        ...leadData(input, refs, actor, phone, custom),
        customerId,
        leadSeq: seq,
        leadCode: code,
        leadNumber: code,
        status: "New",
        createdById: actor.userId,
        updatedById: actor.userId,
      },
      select: { id: true, leadCode: true, createdAt: true },
    });
    await audit(tx, actor, lead.id, action, undefined, { leadCode: code, customerName: input.customerName, contactNumber: phone });
    return lead;
  }, TX);
}

export async function createLead(actor: AuthContext, input: LeadInput) {
  need(actor, "create");
  return insertLead(actor, input, "Created");
}

export async function updateLead(actor: AuthContext, id: string, input: LeadInput) {
  need(actor, "edit");
  const before = await prisma.lead.findFirst({ where: { id, deletedAt: null } });
  if (!before) throw notFound();
  const custom = await checkLeadAgainstLayout(input);
  const refs = await resolveReferences(input);
  const phone = normalizePhone(input.contactNumber)!;
  const data = leadData(input, refs, actor, phone, custom);

  await prisma.$transaction(async tx => {
    const customerId = phone !== before.contactNumber ? await findOrCreateCustomer(tx, input.customerName, phone) : undefined;
    const record = before as unknown as Record<string, unknown>;
    const changed: Record<string, { from: unknown; to: unknown }> = {};
    for (const [key, value] of Object.entries(data)) {
      const from = record[key];
      const text = (x: unknown) => (x === null || x === undefined || x === Prisma.DbNull ? null : typeof x === "object" && !(x instanceof Date) && !("toFixed" in (x as object)) ? JSON.stringify(x) : String(x));
      const a = text(from);
      const b = text(value);
      if (a !== b) changed[key] = { from: from ?? null, to: value ?? null };
    }
    await tx.lead.update({ where: { id }, data: { ...data, ...(customerId ? { customerId } : {}), updatedById: actor.userId } });
    await audit(tx, actor, id, "Updated", Object.fromEntries(Object.entries(changed).map(([k, v]) => [k, v.from])), Object.fromEntries(Object.entries(changed).map(([k, v]) => [k, v.to])));
  }, TX);
}

export async function updateNotes(actor: AuthContext, id: string, notes: string | null) {
  need(actor, "edit");
  const before = await prisma.lead.findFirst({ where: { id, deletedAt: null }, select: { notes: true } });
  if (!before) throw notFound();
  await prisma.$transaction(async tx => {
    await tx.lead.update({ where: { id }, data: { notes, updatedById: actor.userId } });
    await audit(tx, actor, id, "Notes Updated", { notes: before.notes }, { notes });
  }, TX);
}

// Soft delete: the row, its number and its files are kept
export async function deleteLead(actor: AuthContext, id: string) {
  need(actor, "delete");
  const lead = await prisma.lead.findFirst({ where: { id, deletedAt: null }, select: { leadCode: true, customerName: true } });
  if (!lead) throw notFound();
  await prisma.$transaction(async tx => {
    await tx.lead.update({ where: { id }, data: { deletedAt: new Date(), updatedById: actor.userId } });
    await audit(tx, actor, id, "Deleted", lead);
  }, TX);
}

export async function duplicateLead(actor: AuthContext, id: string) {
  need(actor, "create");
  const src = await prisma.lead.findFirst({ where: { id, deletedAt: null } });
  if (!src) throw notFound();
  if (!src.customerName || !src.contactNumber) throw badRequest("This lead is missing required details. Edit it first, then duplicate.");
  const input: LeadInput = {
    customerName: src.customerName,
    contactNumber: src.contactNumber,
    taskAssignedPersonId: src.salesExecutiveId,
    productOrServiceId: src.productOrServiceId,
    requirementId: src.requirementId,
    exactRequirement: src.exactRequirement,
    modeOfCustomerId: src.modeOfCustomerId,
    sourceId: src.sourceId,
    location: src.location,
    exactLocation: src.exactLocation,
    locationLink: src.locationLink,
    mainCategoryId: src.mainCategoryId,
    categoryId: src.categoryId,
    subcategoryId: src.subcategoryId,
    leadPersonId: src.leadPersonId,
    leadStatusId: src.leadStatusId,
    amount: src.amount !== null ? Number(src.amount) : null,
    conventionalRate: src.conventionalRate !== null ? Number(src.conventionalRate) : null,
    notes: src.notes,
    leadTypeId: src.leadTypeId,
    dailyTask: src.dailyTask,
    customFields: (src.customFields ?? {}) as Record<string, string | number | boolean | null>,
  };
  return insertLead(actor, input, "Duplicated");
}

export async function getLeadDetail(actor: AuthContext, id: string) {
  need(actor, "view");
  const row = await getLeadRow(id);
  if (!row) throw notFound();
  const files = await prisma.leadAttachment.findMany({
    where: { leadId: id, followUpId: null, status: "READY", deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, fileName: true, mimeType: true, size: true, storagePath: true },
  });
  const followUps = await prisma.leadFollowUp.findMany({
    where: { leadId: id, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    take: 50,
    select: {
      id: true, notes: true, nextAt: true, completedAt: true,
      attachments: { where: { status: "READY", deletedAt: null }, orderBy: { createdAt: "asc" }, select: { id: true, fileName: true, mimeType: true, size: true, storagePath: true } },
    },
  });
  const urls = await createReadUrls([...files.map(f => f.storagePath), ...followUps.flatMap(f => f.attachments.map(a => a.storagePath))]);
  return {
    lead: row,
    attachments: files.map(f => ({ id: f.id, fileName: f.fileName, mimeType: f.mimeType, size: f.size, url: urls.get(f.storagePath) ?? null })),
    followUps: followUps.map(f => ({
      id: f.id,
      notes: f.notes,
      doneOn: f.completedAt ? `${formatDate(f.completedAt)} ${formatTime(f.completedAt)}` : "",
      next: f.nextAt ? `${formatDate(f.nextAt)} ${formatTime(f.nextAt)}` : null,
      files: f.attachments.map(a => ({ id: a.id, fileName: a.fileName, mimeType: a.mimeType, size: a.size, url: urls.get(a.storagePath) ?? null })),
    })),
  };
}

// ---------------------------------------------------------------------------
// Attachments: browser -> signed URL -> Supabase Storage directly (no file bytes pass
// through our server). The server then checks what Storage actually holds.
// ---------------------------------------------------------------------------
async function assertCanAttach(actor: AuthContext, leadId: string) {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, deletedAt: null }, select: { createdById: true } });
  if (!lead) throw notFound();
  const canEdit = hasPermission(actor.permissions, "leads", "edit");
  const creatorOfThis = hasPermission(actor.permissions, "leads", "create") && lead.createdById === actor.userId;
  if (!canEdit && !creatorOfThis) throw new ServiceError(403, "You do not have permission to attach files to this lead.");
}

export async function signAttachmentUploads(actor: AuthContext, leadId: string, files: { name: string; type: string; size: number }[]) {
  await assertCanAttach(actor, leadId);
  const existing = await prisma.leadAttachment.count({ where: { leadId, followUpId: null, deletedAt: null, status: { in: ["READY", "PENDING"] } } });
  if (existing + files.length > MAX_ATTACHMENTS_PER_LEAD) {
    throw badRequest(`A lead can have at most ${MAX_ATTACHMENTS_PER_LEAD} files.`);
  }
  const out: { id: string; name: string; uploadUrl: string }[] = [];
  for (const f of files) {
    const ext = ALLOWED_ATTACHMENT_TYPES[f.type];
    if (!ext || f.size > MAX_ATTACHMENT_BYTES) throw badRequest(`${f.name}: file type or size is not allowed`);
    const storagePath = `leads/${leadId}/${randomUUID()}.${ext}`; // never built from the user's file name
    const uploadUrl = await createUploadUrl(storagePath);
    const row = await prisma.leadAttachment.create({
      data: { leadId, storagePath, fileName: f.name.slice(0, 255), mimeType: f.type, size: f.size, status: "PENDING", uploadedById: actor.userId },
      select: { id: true },
    });
    out.push({ id: row.id, name: f.name, uploadUrl });
  }
  return out;
}

export async function completeAttachmentUploads(actor: AuthContext, leadId: string, ids: string[]) {
  await assertCanAttach(actor, leadId);
  const rows = await prisma.leadAttachment.findMany({ where: { id: { in: ids }, leadId, status: "PENDING", deletedAt: null } });
  const result: { id: string; ok: boolean; reason?: string }[] = [];
  for (const row of rows) {
    const stat = await statObject(row.storagePath);
    if (!stat) { result.push({ id: row.id, ok: false, reason: "Upload not found" }); continue; }
    const typeOk = stat.mimeType in ALLOWED_ATTACHMENT_TYPES;
    const sizeOk = stat.size > 0 && stat.size <= MAX_ATTACHMENT_BYTES;
    if (!typeOk || !sizeOk) {
      await removeObjects([row.storagePath]);
      await prisma.leadAttachment.update({ where: { id: row.id }, data: { deletedAt: new Date() } });
      result.push({ id: row.id, ok: false, reason: !typeOk ? "File type not allowed" : "File size not allowed" });
      continue;
    }
    await prisma.leadAttachment.update({ where: { id: row.id }, data: { status: "READY", size: stat.size, mimeType: stat.mimeType } });
    result.push({ id: row.id, ok: true });
  }
  return result;
}

export async function removeAttachment(actor: AuthContext, leadId: string, attachmentId: string) {
  need(actor, "edit");
  const row = await prisma.leadAttachment.findFirst({ where: { id: attachmentId, leadId, deletedAt: null } });
  if (!row) throw new ServiceError(404, "File not found");
  await prisma.leadAttachment.update({ where: { id: row.id }, data: { deletedAt: new Date() } });
  await removeObjects([row.storagePath]);
}

// ---------------------------------------------------------------------------
// Follow-up proof (Leads → Follow-up column). Same direct-to-Storage upload as attachments:
// step 1 records the follow-up and hands out upload URLs, step 2 verifies the files and
// only then counts the follow-up and moves the lead's Last / Next dates.
// ---------------------------------------------------------------------------
export async function startFollowUp(actor: AuthContext, leadId: string, input: FollowUpInput) {
  await assertCanAttach(actor, leadId);
  const nextAt = input.nextDate ? zonedDateTime(input.nextDate, input.nextTime || "09:00") : null;
  if (nextAt && nextAt.getTime() < Date.now() - 24 * 60 * 60 * 1000) throw badRequest("The next follow-up cannot be in the past.");

  // Ask Storage for the upload links first, so nothing is saved if storage is not set up
  const planned: { storagePath: string; file: FollowUpInput["files"][number]; uploadUrl: string }[] = [];
  for (const f of input.files) {
    const ext = FOLLOWUP_ATTACHMENT_TYPES[f.type];
    if (!ext || f.size > MAX_ATTACHMENT_BYTES) throw badRequest(`${f.name}: file type or size is not allowed`);
    const storagePath = `leads/${leadId}/followups/${randomUUID()}.${ext}`; // never built from the user's file name
    planned.push({ storagePath, file: f, uploadUrl: await createUploadUrl(storagePath) });
  }

  const followUp = await prisma.leadFollowUp.create({
    data: {
      leadId,
      notes: input.notes,
      nextAt,
      createdById: actor.userId,
      attachments: {
        create: planned.map(p => ({ leadId, storagePath: p.storagePath, fileName: p.file.name.slice(0, 255), mimeType: p.file.type, size: p.file.size, status: "PENDING", uploadedById: actor.userId })),
      },
    },
    select: { id: true, attachments: { select: { id: true, storagePath: true } } },
  });
  const byPath = new Map(planned.map(p => [p.storagePath, p]));
  return {
    followUpId: followUp.id,
    uploads: followUp.attachments.map(a => ({ id: a.id, name: byPath.get(a.storagePath)!.file.name, uploadUrl: byPath.get(a.storagePath)!.uploadUrl })),
  };
}

export async function finishFollowUp(actor: AuthContext, leadId: string, followUpId: string) {
  await assertCanAttach(actor, leadId);
  const followUp = await prisma.leadFollowUp.findFirst({
    where: { id: followUpId, leadId, completedAt: null },
    select: { id: true, nextAt: true, attachments: { where: { status: "PENDING", deletedAt: null }, select: { id: true, storagePath: true } } },
  });
  if (!followUp) throw new ServiceError(404, "Follow-up not found, or it was already saved.");
  if (!followUp.attachments.length) throw badRequest("No files were attached to this follow-up.");

  const problems: string[] = [];
  const good: string[] = [];
  for (const a of followUp.attachments) {
    const stat = await statObject(a.storagePath);
    if (!stat) { problems.push("A file did not finish uploading"); continue; }
    const typeOk = stat.mimeType in FOLLOWUP_ATTACHMENT_TYPES;
    const sizeOk = stat.size > 0 && stat.size <= MAX_ATTACHMENT_BYTES;
    if (!typeOk || !sizeOk) {
      await removeObjects([a.storagePath]);
      await prisma.leadAttachment.update({ where: { id: a.id }, data: { deletedAt: new Date() } });
      problems.push(!typeOk ? "A file type is not allowed" : "A file is empty or larger than 10 MB");
      continue;
    }
    await prisma.leadAttachment.update({ where: { id: a.id }, data: { status: "READY", size: stat.size, mimeType: stat.mimeType } });
    good.push(a.id);
  }
  if (problems.length || !good.length) throw badRequest(`${problems[0] ?? "The files could not be verified"}. Nothing was saved; please try again.`);

  const now = new Date();
  await prisma.$transaction([
    prisma.leadFollowUp.update({ where: { id: followUp.id }, data: { completedAt: now } }),
    prisma.lead.update({ where: { id: leadId }, data: { lastContactedAt: now, nextActionDate: followUp.nextAt } }),
  ]);
  const count = await prisma.leadFollowUp.count({ where: { leadId, completedAt: { not: null } } });
  return {
    count,
    last: { date: formatDate(now), time: formatTime(now) },
    next: followUp.nextAt ? { date: formatDate(followUp.nextAt), time: formatTime(followUp.nextAt) } : null,
  };
}
