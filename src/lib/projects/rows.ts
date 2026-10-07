// Changing the rows of the project templates: Project Value Information (Exclusions), Vendor Selection, Work Coverage, Material and Service
// Vendor Involvement, Material Procurement. Every function checks the permission and that the row belongs to the project, saves in one
// transaction (with the project row locked, so two people never number the same vendor row twice) and answers with the project as it is now.
import { ZodError, type ZodIssue } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { ServiceError } from "@/lib/users/service";
import { removeObjects } from "@/lib/leads/storage";
import { getLayout } from "@/lib/records/layout";
import { bindFiles, type FileSlot } from "@/lib/records/files";
import { isId } from "@/lib/records/values";
import { checkQuoteExclusion, daysBetween, materialCodeFor, selectedVendors, serviceCodeFor, type SelectionIn } from "./calc";
import { audit, changes, dec, has, isObject, loadProject, lockProject, mergeCustom, need, sectionFields, splitValues, TX, type Db, type ProjectRecord } from "./common";
import { getProjectDetail } from "./detail";
import type { ProjectDetail } from "./types";

const issue = (key: string, message: string): ZodIssue => ({ code: "custom", path: ["values", key], message });
const MAX_VENDORS_PER_ITEM = 50;
const MAX_BLOCKS = 100;
const MAX_ROWS_PER_BLOCK = 200;

// The items of the accepted quotes of the deal, in the order the page shows them
async function acceptedItems(db: Db, dealId: string) {
  const quotes = await db.quote.findMany({
    where: { dealId, status: "Accepted", deletedAt: null },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    select: { id: true, quoteNumber: true, amount: true, lineItems: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, name: true, description: true } } },
  });
  return { quotes, items: quotes.flatMap(q => q.lineItems.map(l => ({ id: l.id, quoteId: q.id, name: l.name?.trim() || l.description?.trim() || "Item" }))) };
}

// A slot per File Upload field that was sent, for the row it belongs to
const slotsOf = (split: { slots: { fieldKey: string; ids: string[] }[] }, rowId: string): FileSlot[] => split.slots.map(s => ({ fieldKey: s.fieldKey, rowId, ids: s.ids }));

// ---------------------------------------------------------------------------
// Project Value Information: the Exclusions of one accepted quote
// ---------------------------------------------------------------------------
export async function updateQuoteLine(ctx: AuthContext, projectId: string, quoteId: string, values: unknown): Promise<ProjectDetail> {
  need(ctx, "edit");
  const project = await loadProject(projectId);
  if (!isId(quoteId)) throw new ServiceError(404, "Quote not found");
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, dealId: project.dealId, status: "Accepted", deletedAt: null }, select: { id: true, quoteNumber: true, amount: true } });
  if (!quote) throw new ServiceError(409, "That quote is not an accepted quote of this deal any more. Reload the page.");
  const layout = await getLayout("project");
  const split = await splitValues(sectionFields(layout.fields, "valueInfo"), values);
  if (has(split.columns, "quoteExclusion") && split.columns.quoteExclusion !== null) {
    const problem = checkQuoteExclusion(split.columns.quoteExclusion as number, dec(quote.amount) ?? 0);
    if (problem) throw new ZodError([issue("quoteExclusion", problem)]);
  }
  const removed: string[] = [];
  await prisma.$transaction(async tx => {
    await lockProject(tx, project.id);
    const before = await tx.projectQuoteLine.findUnique({ where: { projectId_quoteId: { projectId: project.id, quoteId } } });
    const custom = Object.keys(split.custom).length ? { customFields: mergeCustom(before?.customFields, split.custom) } : {};
    const row = await tx.projectQuoteLine.upsert({
      where: { projectId_quoteId: { projectId: project.id, quoteId } },
      create: { projectId: project.id, quoteId, ...split.columns, ...custom },
      update: { ...split.columns, ...custom },
    });
    if (split.slots.length) removed.push(...(await bindFiles(tx, ctx, "project", project.id, slotsOf(split, row.id), [])));
    const diff = changes(before ? (before as unknown as Record<string, unknown>) : {}, split.columns);
    if (Object.keys(diff.to).length) await audit(tx, ctx, project, "Quote value information changed", { quote: quote.quoteNumber, ...diff.from }, { quote: quote.quoteNumber, ...diff.to });
    await tx.project.update({ where: { id: project.id }, data: { updatedById: ctx.userId } });
  }, TX);
  await removeObjects(removed);
  return getProjectDetail(ctx, projectId);
}

// ---------------------------------------------------------------------------
// Vendor Selection: the Template and the Service / Material Vendors of one item. The two Involvement tables follow from it.
// ---------------------------------------------------------------------------
export type SelectionInput = { values?: unknown; serviceVendorIds?: string[]; materialVendorIds?: string[] };

async function checkVendors(kind: "service" | "material", ids: string[]) {
  const wanted = Array.from(new Set(ids));
  if (wanted.length > MAX_VENDORS_PER_ITEM) throw new ServiceError(400, `At most ${MAX_VENDORS_PER_ITEM} vendors can be chosen for one item.`);
  if (!wanted.every(isId)) throw new ServiceError(400, "A vendor is not valid.");
  if (!wanted.length) return wanted;
  const found = kind === "service"
    ? await prisma.serviceVendor.findMany({ where: { id: { in: wanted }, deletedAt: null }, select: { id: true } })
    : await prisma.materialVendor.findMany({ where: { id: { in: wanted }, deletedAt: null }, select: { id: true } });
  const ok = new Set(found.map(v => v.id));
  const missing = wanted.filter(id => !ok.has(id));
  if (missing.length) throw new ServiceError(400, `A ${kind} vendor was not found (it may have been deleted). Reload the page and choose again.`);
  return wanted;
}

export async function updateItemSelection(ctx: AuthContext, projectId: string, quoteItemId: string, input: SelectionInput): Promise<ProjectDetail> {
  need(ctx, "edit");
  const project = await loadProject(projectId);
  if (!isId(quoteItemId)) throw new ServiceError(404, "Item not found");
  const { items } = await acceptedItems(prisma, project.dealId);
  const item = items.find(i => i.id === quoteItemId);
  if (!item) throw new ServiceError(409, "That item is not in an accepted quote of this deal any more. Reload the page.");
  const layout = await getLayout("project");
  const split = await splitValues(sectionFields(layout.fields, "vendorSelection"), input.values ?? {});
  const service = input.serviceVendorIds ? await checkVendors("service", input.serviceVendorIds) : null;
  const material = input.materialVendorIds ? await checkVendors("material", input.materialVendorIds) : null;

  const removed: string[] = [];
  await prisma.$transaction(async tx => {
    await lockProject(tx, project.id);
    const before = await tx.projectItemSelection.findUnique({ where: { projectId_quoteItemId: { projectId: project.id, quoteItemId } } });
    const custom = Object.keys(split.custom).length ? { customFields: mergeCustom(before?.customFields, split.custom) } : {};
    const data = { ...split.columns, ...(service ? { serviceVendorIds: service } : {}), ...(material ? { materialVendorIds: material } : {}), ...custom };
    const row = await tx.projectItemSelection.upsert({
      where: { projectId_quoteItemId: { projectId: project.id, quoteItemId } },
      create: { projectId: project.id, quoteItemId, ...data },
      update: data,
    });
    if (split.slots.length) removed.push(...(await bindFiles(tx, ctx, "project", project.id, slotsOf(split, row.id), [])));
    await syncVendorRows(tx, project, ctx);
    await tx.project.update({ where: { id: project.id }, data: { updatedById: ctx.userId } });
    await audit(tx, ctx, project, "Vendor selection changed", before ? { item: item.name, template: before.templateId, service: before.serviceVendorIds, material: before.materialVendorIds } : { item: item.name },
      { item: item.name, template: row.templateId, service: row.serviceVendorIds, material: row.materialVendorIds });
  }, TX);
  await removeObjects(removed);
  return getProjectDetail(ctx, projectId);
}

// One Involvement row per vendor chosen anywhere in Vendor Selection, numbered in the order the vendors first appear (MP1M1, MP1M2 ... / MP1S1 ...).
// A row never changes its code. A vendor that is no longer chosen keeps its row when anything was entered on it or paid to it; an empty row goes.
export async function syncVendorRows(tx: Prisma.TransactionClient, project: ProjectRecord, me: { userId: string }) {
  const { items } = await acceptedItems(tx, project.dealId);
  const order = items.map(i => i.id);
  const selections = await tx.projectItemSelection.findMany({ where: { projectId: project.id } });
  const chosen = selectedVendors(selections.map<SelectionIn>(s => ({ quoteItemId: s.quoteItemId, templateId: s.templateId, serviceVendorIds: s.serviceVendorIds, materialVendorIds: s.materialVendorIds })), order);

  const [materialRows, serviceRows] = await Promise.all([
    tx.projectMaterialVendor.findMany({ where: { projectId: project.id } }),
    tx.projectServiceVendor.findMany({ where: { projectId: project.id } }),
  ]);

  let seq = materialRows.reduce((m, r) => Math.max(m, r.seq), 0);
  const haveMaterial = new Set(materialRows.map(r => r.materialVendorId));
  for (const vendorId of chosen.material) {
    if (haveMaterial.has(vendorId)) continue;
    seq += 1;
    // the Task Person starts as the person who chose the vendor (it can be changed in the row)
    await tx.projectMaterialVendor.create({ data: { projectId: project.id, seq, sortOrder: seq, materialCode: materialCodeFor(project.projectCode, seq), materialVendorId: vendorId, materialTaskPersonId: me.userId } });
  }
  seq = serviceRows.reduce((m, r) => Math.max(m, r.seq), 0);
  const haveService = new Set(serviceRows.map(r => r.serviceVendorId));
  for (const vendorId of chosen.service) {
    if (haveService.has(vendorId)) continue;
    seq += 1;
    await tx.projectServiceVendor.create({ data: { projectId: project.id, seq, sortOrder: seq, serviceCode: serviceCodeFor(project.projectCode, seq), serviceVendorId: vendorId } });
  }

  const nobody = (v: unknown) => v === null || v === undefined || (typeof v === "string" && v.trim() === "");
  const noCustom = (c: unknown) => !isObject(c) || Object.keys(c).length === 0;
  for (const r of materialRows) {
    if (chosen.material.includes(r.materialVendorId)) continue;
    // (the Task Person it started with does not count as something entered)
    const empty = nobody(r.materialList) && r.materialQuotedValue === null && !r.planningToTake && !r.takenDate && nobody(r.materialStatus) && noCustom(r.customFields);
    if (!empty) continue;
    const [paid, files] = await Promise.all([
      tx.prePayment.count({ where: { dealId: project.dealId, materialVendorId: r.materialVendorId, deletedAt: null } }),
      tx.moduleFile.count({ where: { module: "project", rowId: r.id, deletedAt: null } }),
    ]);
    if (paid === 0 && files === 0) await tx.projectMaterialVendor.delete({ where: { id: r.id } });
  }
  for (const r of serviceRows) {
    if (chosen.service.includes(r.serviceVendorId)) continue;
    const empty = r.serviceQuotedValue === null && !r.serviceStartDate && !r.serviceStartedDate && !r.serviceCompletionDate && !r.serviceCompletedDate && noCustom(r.customFields);
    if (!empty) continue;
    const paid = await tx.prePayment.count({ where: { dealId: project.dealId, serviceVendorId: r.serviceVendorId, deletedAt: null } });
    if (paid === 0) await tx.projectServiceVendor.delete({ where: { id: r.id } });
  }
}

// ---------------------------------------------------------------------------
// Work Coverage: the Completed tick of a template (and the fields added to the table)
// ---------------------------------------------------------------------------
export async function updateWorkCoverage(ctx: AuthContext, projectId: string, templateId: string, values: unknown): Promise<ProjectDetail> {
  need(ctx, "edit");
  const project = await loadProject(projectId);
  const layout = await getLayout("project");
  const split = await splitValues(sectionFields(layout.fields, "workCoverage"), values);
  const removed: string[] = [];
  await prisma.$transaction(async tx => {
    await lockProject(tx, project.id);
    // the template must be one used in Vendor Selection now (those are the rows of the table)
    const { items } = await acceptedItems(tx, project.dealId);
    const used = await tx.projectItemSelection.count({ where: { projectId: project.id, templateId, quoteItemId: { in: items.map(i => i.id) } } });
    if (used === 0) throw new ServiceError(409, "That template is not used in Vendor Selection any more. Reload the page.");
    const before = await tx.projectWorkCoverage.findUnique({ where: { projectId_templateId: { projectId: project.id, templateId } } });
    const custom = Object.keys(split.custom).length ? { customFields: mergeCustom(before?.customFields, split.custom) } : {};
    const row = await tx.projectWorkCoverage.upsert({
      where: { projectId_templateId: { projectId: project.id, templateId } },
      create: { projectId: project.id, templateId, ...split.columns, ...custom },
      update: { ...split.columns, ...custom },
    });
    if (split.slots.length) removed.push(...(await bindFiles(tx, ctx, "project", project.id, slotsOf(split, row.id), [])));
    if (has(split.columns, "completed")) await audit(tx, ctx, project, split.columns.completed ? "Work coverage completed" : "Work coverage reopened", undefined, { template: templateId });
    await tx.project.update({ where: { id: project.id }, data: { updatedById: ctx.userId } });
  }, TX);
  await removeObjects(removed);
  return getProjectDetail(ctx, projectId);
}

// ---------------------------------------------------------------------------
// Material and Service Vendor Involvement: the typed columns of a row
// ---------------------------------------------------------------------------
async function updateInvolvementRow(ctx: AuthContext, projectId: string, rowId: string, values: unknown, kind: "material" | "service"): Promise<ProjectDetail> {
  need(ctx, "edit");
  const project = await loadProject(projectId);
  if (!isId(rowId)) throw new ServiceError(404, "Row not found");
  const section = kind === "material" ? "materialVendors" : "serviceVendors";
  const layout = await getLayout("project");
  const split = await splitValues(sectionFields(layout.fields, section), values);
  const removed: string[] = [];
  await prisma.$transaction(async tx => {
    await lockProject(tx, project.id);
    const before = (kind === "material"
      ? await tx.projectMaterialVendor.findFirst({ where: { id: rowId, projectId: project.id } })
      : await tx.projectServiceVendor.findFirst({ where: { id: rowId, projectId: project.id } })) as (Record<string, unknown> & { id: string; customFields: unknown }) | null;
    if (!before) throw new ServiceError(404, "That row no longer exists. Reload the page.");

    if (kind === "service") {
      // dates, as they will be after this change
      const day = (key: string) => { const v = has(split.columns, key) ? split.columns[key] : before[key]; return v instanceof Date ? v.toISOString().slice(0, 10) : null; };
      const issues: ZodIssue[] = [];
      if (["serviceStartDate", "serviceCompletionDate"].some(k => has(split.columns, k)) && day("serviceStartDate") && day("serviceCompletionDate") && daysBetween(day("serviceStartDate"), day("serviceCompletionDate")) === null) issues.push(issue("serviceCompletionDate", "The Completion Date cannot be before the Start Date"));
      if (["serviceStartedDate", "serviceCompletedDate"].some(k => has(split.columns, k)) && day("serviceStartedDate") && day("serviceCompletedDate") && daysBetween(day("serviceStartedDate"), day("serviceCompletedDate")) === null) issues.push(issue("serviceCompletedDate", "The Completed Date cannot be before the Started Date"));
      if (issues.length) throw new ZodError(issues);
    }

    const data = { ...split.columns, ...(Object.keys(split.custom).length ? { customFields: mergeCustom(before.customFields, split.custom) } : {}) };
    if (kind === "material") await tx.projectMaterialVendor.update({ where: { id: rowId }, data });
    else await tx.projectServiceVendor.update({ where: { id: rowId }, data });
    if (split.slots.length) removed.push(...(await bindFiles(tx, ctx, "project", project.id, slotsOf(split, rowId), [])));
    const code = String(before[kind === "material" ? "materialCode" : "serviceCode"]);
    const diff = changes(before, { ...split.columns, ...Object.fromEntries(Object.entries(split.custom).map(([k, v]) => [`customFields.${k}`, v])) });
    if (Object.keys(diff.to).length || split.slots.length) await audit(tx, ctx, project, `${kind === "material" ? "Material" : "Service"} vendor row changed`, { row: code, ...diff.from }, { row: code, ...diff.to, ...(split.slots.length ? { filesSaved: split.slots.map(s => s.fieldKey) } : {}) });
    await tx.project.update({ where: { id: project.id }, data: { updatedById: ctx.userId } });
  }, TX);
  await removeObjects(removed);
  return getProjectDetail(ctx, projectId);
}

export const updateMaterialRow = (ctx: AuthContext, projectId: string, rowId: string, values: unknown) => updateInvolvementRow(ctx, projectId, rowId, values, "material");
export const updateServiceRow = (ctx: AuthContext, projectId: string, rowId: string, values: unknown) => updateInvolvementRow(ctx, projectId, rowId, values, "service");

// ---------------------------------------------------------------------------
// Material Procurement: blocks (MATERIAL 1, MATERIAL 2 ...) and their rows
// ---------------------------------------------------------------------------
export async function addProcurementBlock(ctx: AuthContext, projectId: string): Promise<ProjectDetail> {
  need(ctx, "edit");
  const project = await loadProject(projectId);
  await prisma.$transaction(async tx => {
    await lockProject(tx, project.id);
    const blocks = await tx.projectProcurement.findMany({ where: { projectId: project.id }, select: { sortOrder: true } });
    if (blocks.length >= MAX_BLOCKS) throw new ServiceError(400, `A project can have at most ${MAX_BLOCKS} materials here.`);
    const block = await tx.projectProcurement.create({ data: { projectId: project.id, sortOrder: blocks.reduce((m, b) => Math.max(m, b.sortOrder), 0) + 1 } });
    await tx.projectProcurementRow.create({ data: { projectId: project.id, blockId: block.id, sortOrder: 1 } }); // it starts with one row to type in
    await audit(tx, ctx, project, "Material procurement block added", undefined, { block: blocks.length + 1 });
  }, TX);
  return getProjectDetail(ctx, projectId);
}

async function ownBlock(tx: Db, projectId: string, blockId: string) {
  if (!isId(blockId)) throw new ServiceError(404, "Material not found");
  const block = await tx.projectProcurement.findFirst({ where: { id: blockId, projectId } });
  if (!block) throw new ServiceError(404, "That material no longer exists. Reload the page.");
  return block;
}

export async function deleteProcurementBlock(ctx: AuthContext, projectId: string, blockId: string): Promise<ProjectDetail> {
  need(ctx, "edit");
  const project = await loadProject(projectId);
  const removed: string[] = [];
  await prisma.$transaction(async tx => {
    await lockProject(tx, project.id);
    const block = await ownBlock(tx, project.id, blockId);
    const rows = await tx.projectProcurementRow.findMany({ where: { blockId: block.id }, select: { id: true } });
    await tx.projectProcurement.delete({ where: { id: block.id } }); // its rows go with it
    removed.push(...(await bindFiles(tx, ctx, "project", project.id, [], rows.map(r => r.id))));
    await audit(tx, ctx, project, "Material procurement block removed", { item: block.itemLabel, rows: rows.length });
  }, TX);
  await removeObjects(removed);
  return getProjectDetail(ctx, projectId);
}

// The Item Name at the top of a block: one of the items of the accepted quotes (or none)
export async function setProcurementItem(ctx: AuthContext, projectId: string, blockId: string, quoteItemId: string | null): Promise<ProjectDetail> {
  need(ctx, "edit");
  const project = await loadProject(projectId);
  await prisma.$transaction(async tx => {
    await lockProject(tx, project.id);
    const block = await ownBlock(tx, project.id, blockId);
    let label: string | null = null;
    if (quoteItemId) {
      const { items } = await acceptedItems(tx, project.dealId);
      const item = items.find(i => i.id === quoteItemId);
      if (!item) throw new ServiceError(409, "That item is not in an accepted quote of this deal. Reload the page.");
      label = item.name;
    }
    await tx.projectProcurement.update({ where: { id: block.id }, data: { quoteItemId, itemLabel: label } });
    await audit(tx, ctx, project, "Material procurement item changed", { item: block.itemLabel }, { item: label });
  }, TX);
  return getProjectDetail(ctx, projectId);
}

export async function addProcurementRow(ctx: AuthContext, projectId: string, blockId: string): Promise<ProjectDetail> {
  need(ctx, "edit");
  const project = await loadProject(projectId);
  await prisma.$transaction(async tx => {
    await lockProject(tx, project.id);
    const block = await ownBlock(tx, project.id, blockId);
    const rows = await tx.projectProcurementRow.findMany({ where: { blockId: block.id }, select: { sortOrder: true } });
    if (rows.length >= MAX_ROWS_PER_BLOCK) throw new ServiceError(400, `A material can have at most ${MAX_ROWS_PER_BLOCK} rows.`);
    await tx.projectProcurementRow.create({ data: { projectId: project.id, blockId: block.id, sortOrder: rows.reduce((m, r) => Math.max(m, r.sortOrder), 0) + 1 } });
  }, TX);
  return getProjectDetail(ctx, projectId);
}

export async function updateProcurementRow(ctx: AuthContext, projectId: string, rowId: string, values: unknown): Promise<ProjectDetail> {
  need(ctx, "edit");
  const project = await loadProject(projectId);
  if (!isId(rowId)) throw new ServiceError(404, "Row not found");
  const layout = await getLayout("project");
  const split = await splitValues(sectionFields(layout.fields, "procurement"), values);
  const removed: string[] = [];
  await prisma.$transaction(async tx => {
    await lockProject(tx, project.id);
    const before = await tx.projectProcurementRow.findFirst({ where: { id: rowId, projectId: project.id } });
    if (!before) throw new ServiceError(404, "That row no longer exists. Reload the page.");
    await tx.projectProcurementRow.update({ where: { id: rowId }, data: { ...split.columns, ...(Object.keys(split.custom).length ? { customFields: mergeCustom(before.customFields, split.custom) } : {}) } });
    if (split.slots.length) removed.push(...(await bindFiles(tx, ctx, "project", project.id, slotsOf(split, rowId), [])));
    await tx.project.update({ where: { id: project.id }, data: { updatedById: ctx.userId } });
  }, TX);
  await removeObjects(removed);
  return getProjectDetail(ctx, projectId);
}

export async function deleteProcurementRow(ctx: AuthContext, projectId: string, rowId: string): Promise<ProjectDetail> {
  need(ctx, "edit");
  const project = await loadProject(projectId);
  if (!isId(rowId)) throw new ServiceError(404, "Row not found");
  const removed: string[] = [];
  await prisma.$transaction(async tx => {
    await lockProject(tx, project.id);
    const row = await tx.projectProcurementRow.findFirst({ where: { id: rowId, projectId: project.id } });
    if (!row) throw new ServiceError(404, "That row no longer exists. Reload the page.");
    await tx.projectProcurementRow.delete({ where: { id: rowId } });
    removed.push(...(await bindFiles(tx, ctx, "project", project.id, [], [rowId])));
  }, TX);
  await removeObjects(removed);
  return getProjectDetail(ctx, projectId);
}
