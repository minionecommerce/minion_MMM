// Files of the four record modules. Same private Storage bucket and the same direct-to-Storage upload as the Leads files, but
// a file is uploaded BEFORE the record is saved: the form uploads it, keeps its id, and the save attaches it to the record.
//   sign      validates the file and hands out a signed upload URL (the row is PENDING)
//   complete  checks what Storage really holds and marks the row READY
//   discard   throws away an upload that was never attached
// An upload that is never attached (the form was abandoned) is removed the next time the same person uploads, after a day.

import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac/effective";
import { ServiceError } from "@/lib/users/service";
import { ATTACHMENT_BLOCKED_HINT, isAttachmentAllowed, storageExtension, UNKNOWN_MIME_TYPE } from "@/lib/leads/constants";
import { createReadUrls, createUploadUrl, removeObjects, statObject } from "@/lib/leads/storage";
import { customerAbilities } from "@/lib/customers/access";
import { ITEM_IMAGE_HINT, ITEM_IMAGE_MAX_BYTES, ITEM_IMAGE_MAX_MB, isItemImageName } from "@/lib/quotes/item-constants";
import { getLayout } from "./layout";
import { isId, stripControl } from "./values";
import { MODULES } from "./registry";
import { MAX_FILE_BYTES, MAX_FILE_MB, type FileDto, type ModuleId } from "./types";

type Tx = Prisma.TransactionClient;
const DAY = 24 * 60 * 60 * 1000;
const MAX_PENDING_PER_PERSON = 100;

// Anyone who can create or edit the module's records may upload
function needWrite(ctx: AuthContext, moduleId: ModuleId) {
  const perm = MODULES[moduleId].permission;
  // a customer is added and corrected from the quote form: the people who make quotes may attach its documents
  if (moduleId === "customer" && (customerAbilities(ctx).create || customerAbilities(ctx).edit)) return;
  if (!hasPermission(ctx.permissions, perm, "create") && !hasPermission(ctx.permissions, perm, "edit")) {
    throw new ServiceError(403, `You do not have permission to upload files for ${MODULES[moduleId].plural.toLowerCase()}.`);
  }
}

async function sweepAbandoned(userId: string) {
  const old = await prisma.moduleFile.findMany({
    where: { uploadedById: userId, recordId: null, deletedAt: null, createdAt: { lt: new Date(Date.now() - DAY) } },
    select: { id: true, storagePath: true },
    take: 50,
  });
  if (!old.length) return;
  await prisma.moduleFile.updateMany({ where: { id: { in: old.map(o => o.id) } }, data: { deletedAt: new Date() } });
  await removeObjects(old.map(o => o.storagePath));
}

export async function signUpload(ctx: AuthContext, moduleId: ModuleId, input: { fieldKey: string; name: string; type: string; size: number }) {
  needWrite(ctx, moduleId);
  const layout = await getLayout(moduleId);
  const field = layout.fields.find(f => f.key === input.fieldKey);
  if (!field || field.type !== "FILE" || !field.enabled) throw new ServiceError(400, "That file field does not exist. Reload the page and try again.");
  const name = stripControl(input.name).trim();
  if (!name || name.length > 255) throw new ServiceError(400, "The file name is not valid.");
  if (!isAttachmentAllowed(name)) throw new ServiceError(400, `${name}: not allowed (${ATTACHMENT_BLOCKED_HINT})`);
  if (!Number.isInteger(input.size) || input.size <= 0) throw new ServiceError(400, `${name}: the file is empty.`);
  if (input.size > MAX_FILE_BYTES) throw new ServiceError(400, `${name}: larger than ${MAX_FILE_MB} MB.`);
  // the pictures of an item: pictures only, 5 MB each
  if (moduleId === "item") {
    if (!isItemImageName(name)) throw new ServiceError(400, `${name}: not a picture. ${ITEM_IMAGE_HINT}`);
    if (input.size > ITEM_IMAGE_MAX_BYTES) throw new ServiceError(400, `${name}: larger than ${ITEM_IMAGE_MAX_MB} MB.`);
  }

  await sweepAbandoned(ctx.userId);
  const pending = await prisma.moduleFile.count({ where: { uploadedById: ctx.userId, recordId: null, deletedAt: null } });
  if (pending >= MAX_PENDING_PER_PERSON) throw new ServiceError(429, "Too many files are waiting to be saved. Save or cancel the records you are working on first.");

  const storagePath = `records/${moduleId}/${randomUUID()}.${storageExtension(name)}`;
  const uploadUrl = await createUploadUrl(storagePath);
  const row = await prisma.moduleFile.create({
    data: {
      module: moduleId, fieldKey: field.key, storagePath, fileName: name, mimeType: stripControl(input.type).trim().slice(0, 150) || UNKNOWN_MIME_TYPE,
      size: input.size, status: "PENDING", uploadedById: ctx.userId,
    },
    select: { id: true },
  });
  return { id: row.id, uploadUrl };
}

export async function completeUpload(ctx: AuthContext, moduleId: ModuleId, fileId: string): Promise<FileDto> {
  needWrite(ctx, moduleId);
  if (!isId(fileId)) throw new ServiceError(404, "That upload was not found.");
  const row = await prisma.moduleFile.findFirst({ where: { id: fileId, module: moduleId, uploadedById: ctx.userId, status: "PENDING", deletedAt: null } });
  if (!row) throw new ServiceError(404, "That upload was not found.");
  const stat = await statObject(row.storagePath);
  if (!stat) throw new ServiceError(400, "The file did not arrive. Please try again.");
  if (stat.size <= 0 || stat.size > MAX_FILE_BYTES || !isAttachmentAllowed(row.fileName)) {
    await removeObjects([row.storagePath]);
    await prisma.moduleFile.update({ where: { id: row.id }, data: { deletedAt: new Date() } });
    throw new ServiceError(400, `${row.fileName}: the file is empty, larger than ${MAX_FILE_MB} MB, or not an allowed type.`);
  }
  if (moduleId === "item" && (stat.size > ITEM_IMAGE_MAX_BYTES || !isItemImageName(row.fileName))) {
    await removeObjects([row.storagePath]);
    await prisma.moduleFile.update({ where: { id: row.id }, data: { deletedAt: new Date() } });
    throw new ServiceError(400, `${row.fileName}: not a picture, or larger than ${ITEM_IMAGE_MAX_MB} MB.`);
  }
  await prisma.moduleFile.update({ where: { id: row.id }, data: { status: "READY", size: stat.size, mimeType: stat.mimeType || row.mimeType } });
  return { id: row.id, fileName: row.fileName, size: stat.size, mimeType: stat.mimeType || row.mimeType, url: null };
}

// Only an upload that has not been attached to a record yet can be thrown away this way
export async function discardUpload(ctx: AuthContext, moduleId: ModuleId, fileId: string) {
  needWrite(ctx, moduleId);
  if (!isId(fileId)) return;
  const row = await prisma.moduleFile.findFirst({ where: { id: fileId, module: moduleId, uploadedById: ctx.userId, recordId: null, deletedAt: null } });
  if (!row) return;
  await prisma.moduleFile.update({ where: { id: row.id }, data: { deletedAt: new Date() } });
  await removeObjects([row.storagePath]);
}

// ---------------------------------------------------------------------------
// Used when a record is saved
// ---------------------------------------------------------------------------
export type FileSlot = { fieldKey: string; rowId: string | null; ids: string[] };
export const slotKey = (rowId: string | null, fieldKey: string) => `${rowId ?? ""}|${fieldKey}`;

// Attaches the files of the form to the record (and removes the ones that are no longer there). Returns the Storage paths of the
// removed files; the caller deletes those objects after the transaction committed.
export async function bindFiles(tx: Tx, ctx: AuthContext, moduleId: ModuleId, recordId: string, slots: FileSlot[], removedRowIds: string[]): Promise<string[]> {
  const wanted = slots.flatMap(s => s.ids);
  const rows = wanted.length ? await tx.moduleFile.findMany({ where: { id: { in: wanted }, module: moduleId, deletedAt: null, status: "READY" } }) : [];
  const byId = new Map(rows.map(r => [r.id, r]));

  const used = new Set<string>();
  for (const slot of slots) {
    for (const id of slot.ids) {
      if (used.has(id)) throw new ServiceError(400, "A file was added twice. Please upload it again.");
      used.add(id);
      const f = byId.get(id);
      const attachedHere = f?.recordId === recordId;
      const mine = f && f.recordId === null && f.uploadedById === ctx.userId;
      if (!f || f.fieldKey !== slot.fieldKey || !(attachedHere || mine)) throw new ServiceError(400, "A file could not be attached. Please upload it again.");
      if (attachedHere && (f.rowId ?? null) !== slot.rowId) throw new ServiceError(400, "A file could not be attached. Please upload it again.");
    }
    const fresh = slot.ids.filter(id => byId.get(id)!.recordId === null);
    if (fresh.length) await tx.moduleFile.updateMany({ where: { id: { in: fresh } }, data: { recordId, rowId: slot.rowId } });
  }

  // What was attached before but is not in the form any more: a slot only removes files of its own field and row,
  // and the files of a row that was deleted go with it
  const attached = await tx.moduleFile.findMany({ where: { module: moduleId, recordId, deletedAt: null }, select: { id: true, storagePath: true, rowId: true, fieldKey: true } });
  const slotIds = new Map(slots.map(s => [slotKey(s.rowId, s.fieldKey), new Set(s.ids)]));
  const removable = attached.filter(f => {
    if (f.rowId && removedRowIds.includes(f.rowId)) return true;
    const ids = slotIds.get(slotKey(f.rowId, f.fieldKey));
    return !!ids && !ids.has(f.id);
  });
  if (removable.length) await tx.moduleFile.updateMany({ where: { id: { in: removable.map(f => f.id) } }, data: { deletedAt: new Date() } });
  return removable.map(f => f.storagePath);
}

// The files of a record, by (row, field), each with a short-lived link
export async function filesOf(moduleId: ModuleId, recordId: string): Promise<Map<string, FileDto[]>> {
  const rows = await prisma.moduleFile.findMany({
    where: { module: moduleId, recordId, deletedAt: null, status: "READY" },
    orderBy: { createdAt: "asc" },
    select: { id: true, rowId: true, fieldKey: true, fileName: true, size: true, mimeType: true, storagePath: true },
  });
  const urls = await createReadUrls(rows.map(r => r.storagePath));
  const out = new Map<string, FileDto[]>();
  for (const r of rows) {
    const key = `${r.rowId ?? ""}|${r.fieldKey}`;
    const list = out.get(key) ?? [];
    list.push({ id: r.id, fileName: r.fileName, size: r.size, mimeType: r.mimeType, url: urls.get(r.storagePath) ?? null });
    out.set(key, list);
  }
  return out;
}

