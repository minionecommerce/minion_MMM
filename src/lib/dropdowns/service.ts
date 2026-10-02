import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { ServiceError } from "@/lib/users/service";
import { LABEL_MAX, getListDef, type DropdownListDef, type DropdownOptionDto } from "./registry";

type Tx = Prisma.TransactionClient;

// Thrown when an action touches existing records and the caller has not confirmed it yet.
// The API turns it into a 409 that carries the number of records, so the screen can warn first.
export class DropdownInUseError extends Error {
  constructor(public action: "delete" | "rename", public usage: number, message: string) {
    super(message);
  }
}

export function assertSuperAdmin(ctx: AuthContext) {
  if (!ctx.isSuperAdmin) throw new ServiceError(403, "Only a Super Admin can manage dropdown options.");
}

function listOrThrow(key: string): DropdownListDef {
  const def = getListDef(key);
  if (!def) throw new ServiceError(404, "Unknown dropdown.");
  return def;
}

function cleanLabel(raw: string) {
  const label = raw.replace(/\s+/g, " ").trim();
  if (!label) throw new ServiceError(400, "Label is required.");
  if (label.length > LABEL_MAX) throw new ServiceError(400, `Label must be ${LABEL_MAX} characters or fewer.`);
  return label;
}

// ---------------------------------------------------------------------------
// Where each list is used. "text" lists store the label on the record; "reference"
// lists (Leads page) store a link to the option row.
// ---------------------------------------------------------------------------
type TextTarget = {
  count: (label: string) => Promise<number>;
  rename: (from: string, to: string, tx: Tx) => Promise<number>;
};

const plain = (count: (l: string) => Promise<number>, rename: (f: string, t: string, tx: Tx) => Promise<{ count: number }>): TextTarget => ({
  count,
  rename: async (f, t, tx) => (await rename(f, t, tx)).count,
});

const TEXT_TARGETS: Record<string, TextTarget> = {
  CUSTOMER_TYPE: plain(
    l => prisma.customer.count({ where: { customerType: l } }),
    (f, t, tx) => tx.customer.updateMany({ where: { customerType: f }, data: { customerType: t } }),
  ),
  CRM_LEAD_SOURCE: plain(
    l => prisma.lead.count({ where: { source: l } }),
    (f, t, tx) => tx.lead.updateMany({ where: { source: f }, data: { source: t } }),
  ),
  PROPERTY_TYPE: plain(
    l => prisma.lead.count({ where: { propertyType: l } }),
    (f, t, tx) => tx.lead.updateMany({ where: { propertyType: f }, data: { propertyType: t } }),
  ),
  BUDGET_RANGE: plain(
    l => prisma.lead.count({ where: { budgetRange: l } }),
    (f, t, tx) => tx.lead.updateMany({ where: { budgetRange: f }, data: { budgetRange: t } }),
  ),
  LEAD_PRIORITY: plain(
    l => prisma.lead.count({ where: { priority: l } }),
    (f, t, tx) => tx.lead.updateMany({ where: { priority: f }, data: { priority: t } }),
  ),
  FOLLOWUP_TYPE: plain(
    l => prisma.followUp.count({ where: { type: l } }),
    (f, t, tx) => tx.followUp.updateMany({ where: { type: f }, data: { type: t } }),
  ),
  VISIT_TYPE: plain(
    l => prisma.siteVisit.count({ where: { visitType: l } }),
    (f, t, tx) => tx.siteVisit.updateMany({ where: { visitType: f }, data: { visitType: t } }),
  ),
  PROJECT_TYPE: plain(
    l => prisma.project.count({ where: { type: l } }),
    (f, t, tx) => tx.project.updateMany({ where: { type: f }, data: { type: t } }),
  ),
  LANDSCAPE_TYPE: plain(
    l => prisma.landscape.count({ where: { type: l } }),
    (f, t, tx) => tx.landscape.updateMany({ where: { type: f }, data: { type: t } }),
  ),
  MAINTENANCE_TYPE: plain(
    l => prisma.landscapeMaintenance.count({ where: { type: l } }),
    (f, t, tx) => tx.landscapeMaintenance.updateMany({ where: { type: f }, data: { type: t } }),
  ),
  // Stored as a JSON array of names, e.g. ["Security","Plumbing"]
  SERVICES: {
    count: l => prisma.lead.count({ where: { services: { contains: JSON.stringify(l) } } }),
    rename: async (from, to, tx) => {
      const rows = await tx.lead.findMany({ where: { services: { contains: JSON.stringify(from) } }, select: { id: true, services: true } });
      let changed = 0;
      for (const row of rows) {
        let names: unknown;
        try { names = JSON.parse(row.services ?? "[]"); } catch { continue; }
        if (!Array.isArray(names) || !names.includes(from)) continue;
        const next = [...new Set(names.map(n => (n === from ? to : n)))];
        await tx.lead.update({ where: { id: row.id }, data: { services: JSON.stringify(next) } });
        changed++;
      }
      return changed;
    },
  },
};

// Lead column that links to the option row, for each Leads-page list
const REFERENCE_FIELDS = {
  SOURCE: "sourceId",
  MODE_OF_CUSTOMER: "modeOfCustomerId",
  PRODUCT_OR_SERVICE: "productOrServiceId",
  REQUIREMENT: "requirementId",
  MAIN_CATEGORY: "mainCategoryId",
  CATEGORY: "categoryId",
  SUBCATEGORY: "subcategoryId",
  LEAD_STATUS: "leadStatusId",
  LEAD_TYPE: "leadTypeId",
} as const satisfies Record<string, keyof Prisma.LeadWhereInput>;

type ReferenceField = (typeof REFERENCE_FIELDS)[keyof typeof REFERENCE_FIELDS];

function referenceField(def: DropdownListDef): ReferenceField {
  const f = (REFERENCE_FIELDS as Record<string, ReferenceField>)[def.key];
  if (!f) throw new Error(`No lead field configured for ${def.key}`);
  return f;
}

async function countUsage(def: DropdownListDef, option: { id: string; label: string }): Promise<number> {
  if (def.storage === "reference") {
    return prisma.lead.count({ where: { [referenceField(def)]: option.id, deletedAt: null } });
  }
  return TEXT_TARGETS[def.key].count(option.label);
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------
const optionSelect = { id: true, label: true, parentId: true, isDefault: true, sortOrder: true } as const;

// Any signed-in user: used by the forms
export async function getOptions(key: string): Promise<DropdownOptionDto[]> {
  listOrThrow(key);
  return prisma.leadOption.findMany({ where: { type: key }, orderBy: [{ sortOrder: "asc" }, { label: "asc" }], select: optionSelect });
}

// Super Admin: options plus how many records use each
export async function getOptionsWithUsage(key: string): Promise<DropdownOptionDto[]> {
  const def = listOrThrow(key);
  const options = await getOptions(key);
  const usage = await Promise.all(options.map(o => countUsage(def, o)));
  return options.map((o, i) => ({ ...o, usage: usage[i] }));
}

export async function getListSummaries() {
  const grouped = await prisma.leadOption.groupBy({ by: ["type"], _count: { _all: true } });
  return Object.fromEntries(grouped.map(g => [g.type, g._count._all])) as Record<string, number>;
}

// ---------------------------------------------------------------------------
// Writes (Super Admin only; each one is audited)
// ---------------------------------------------------------------------------
async function assertLabelFree(tx: Tx, type: string, parentId: string | null, label: string, exceptId?: string) {
  const clash = await tx.leadOption.findFirst({
    where: { type, parentId, label: { equals: label, mode: "insensitive" }, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { id: true },
  });
  if (clash) throw new ServiceError(409, `"${label}" already exists in this list.`);
}

async function setDefault(tx: Tx, def: DropdownListDef, id: string, makeDefault: boolean) {
  if (def.parentKey) throw new ServiceError(400, "A default can only be set on lists without levels.");
  if (makeDefault && !def.multi) await tx.leadOption.updateMany({ where: { type: def.key, isDefault: true, id: { not: id } }, data: { isDefault: false } });
  await tx.leadOption.update({ where: { id }, data: { isDefault: makeDefault } });
}

export async function createOption(ctx: AuthContext, key: string, input: { label: string; parentId?: string | null; isDefault?: boolean }) {
  assertSuperAdmin(ctx);
  const def = listOrThrow(key);
  const label = cleanLabel(input.label);

  let parentId: string | null = null;
  if (def.parentKey) {
    if (!input.parentId) throw new ServiceError(400, "Choose which level above this option belongs to.");
    const parent = await prisma.leadOption.findFirst({ where: { id: input.parentId, type: def.parentKey }, select: { id: true } });
    if (!parent) throw new ServiceError(400, "The selected parent does not exist.");
    parentId = parent.id;
  } else if (input.parentId) {
    throw new ServiceError(400, "This list has no levels.");
  }
  if (input.isDefault && def.parentKey) throw new ServiceError(400, "A default can only be set on lists without levels.");

  return prisma.$transaction(async tx => {
    await assertLabelFree(tx, def.key, parentId, label);
    const last = await tx.leadOption.aggregate({ where: { type: def.key }, _max: { sortOrder: true } });
    const created = await tx.leadOption.create({
      data: { type: def.key, label, parentId, sortOrder: (last._max.sortOrder ?? -1) + 1 },
      select: optionSelect,
    });
    if (input.isDefault) await setDefault(tx, def, created.id, true);
    await writeAudit({ action: "DROPDOWN_OPTION_CREATED", actorUserId: ctx.userId, metadata: { list: def.key, optionId: created.id, label } }, tx);
    return { ...created, isDefault: !!input.isDefault };
  });
}

export async function updateOption(
  ctx: AuthContext,
  id: string,
  input: { label?: string; isDefault?: boolean; applyToExistingRecords?: boolean },
) {
  assertSuperAdmin(ctx);
  const current = await prisma.leadOption.findUnique({ where: { id }, select: { id: true, type: true, label: true, parentId: true, isDefault: true } });
  if (!current) throw new ServiceError(404, "Option not found.");
  const def = listOrThrow(current.type);

  const newLabel = input.label === undefined ? null : cleanLabel(input.label);
  const renaming = newLabel !== null && newLabel !== current.label;

  // Text lists keep the label on every record, so a rename has to update those records too.
  // Make that explicit instead of doing it silently.
  let renamedRecords = 0;
  if (renaming && def.storage === "text") {
    const usage = await TEXT_TARGETS[def.key].count(current.label);
    if (usage > 0 && !input.applyToExistingRecords) {
      throw new DropdownInUseError("rename", usage, `"${current.label}" is used by ${usage} existing record${usage === 1 ? "" : "s"}. Renaming will update them to "${newLabel}".`);
    }
  }

  return prisma.$transaction(async tx => {
    if (renaming) {
      await assertLabelFree(tx, def.key, current.parentId, newLabel!, id);
      await tx.leadOption.update({ where: { id }, data: { label: newLabel! } });
      if (def.storage === "text") renamedRecords = await TEXT_TARGETS[def.key].rename(current.label, newLabel!, tx);
    }
    if (input.isDefault !== undefined && input.isDefault !== current.isDefault) await setDefault(tx, def, id, input.isDefault);
    await writeAudit(
      {
        action: "DROPDOWN_OPTION_UPDATED",
        actorUserId: ctx.userId,
        oldValue: { label: current.label, isDefault: current.isDefault },
        newValue: { label: newLabel ?? current.label, isDefault: input.isDefault ?? current.isDefault },
        metadata: { list: def.key, optionId: id, recordsRenamed: renamedRecords },
      },
      tx,
    );
    return { ...(await tx.leadOption.findUniqueOrThrow({ where: { id }, select: optionSelect })), recordsUpdated: renamedRecords };
  });
}

export async function deleteOption(ctx: AuthContext, id: string, confirm: boolean) {
  assertSuperAdmin(ctx);
  const option = await prisma.leadOption.findUnique({ where: { id }, select: { id: true, type: true, label: true } });
  if (!option) throw new ServiceError(404, "Option not found.");
  const def = listOrThrow(option.type);

  // A level that still has options below it cannot be removed: those would be left without a parent.
  const children = await prisma.leadOption.count({ where: { parentId: id } });
  if (children > 0) {
    throw new ServiceError(409, `"${option.label}" still has ${children} option${children === 1 ? "" : "s"} under it. Delete or move those first.`);
  }

  const usage = await countUsage(def, option);
  if (usage > 0 && !confirm) {
    throw new DropdownInUseError("delete", usage, "This option is currently being used by existing records. Deleting it may affect existing data. Are you sure you want to continue?");
  }

  return prisma.$transaction(async tx => {
    let cleared: string[] = [];
    if (def.storage === "reference" && usage > 0) {
      // Records only hold a link, so the link has to be cleared. Write down exactly which leads were touched.
      const field = referenceField(def);
      const affected = await tx.lead.findMany({ where: { [field]: id }, select: { id: true, leadCode: true } });
      await tx.lead.updateMany({ where: { [field]: id }, data: { [field]: null } });
      cleared = affected.map(l => l.leadCode ?? l.id);
    }
    // Text lists: records keep the text they already have, so no record is changed.
    await tx.leadOption.delete({ where: { id } });
    await writeAudit(
      {
        action: "DROPDOWN_OPTION_DELETED",
        actorUserId: ctx.userId,
        oldValue: { label: option.label },
        metadata: {
          list: def.key,
          optionId: id,
          recordsUsingIt: usage,
          recordsKeptText: def.storage === "text" ? usage : 0,
          leadsFieldCleared: cleared.slice(0, 500),
          leadsFieldClearedCount: cleared.length,
        },
      },
      tx,
    );
    return { deleted: true, usage };
  });
}

export async function reorderOptions(ctx: AuthContext, key: string, orderedIds: string[]) {
  assertSuperAdmin(ctx);
  const def = listOrThrow(key);
  if (new Set(orderedIds).size !== orderedIds.length) throw new ServiceError(400, "Duplicate options in the new order.");
  const rows = await prisma.leadOption.findMany({ where: { id: { in: orderedIds }, type: def.key }, select: { id: true, sortOrder: true } });
  if (rows.length !== orderedIds.length) throw new ServiceError(400, "The new order contains options that are not in this list.");

  // Re-use the same set of position numbers, so options not included in this call keep their places.
  const slots = rows.map(r => r.sortOrder).sort((a, b) => a - b);
  await prisma.$transaction(async tx => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx.leadOption.update({ where: { id: orderedIds[i] }, data: { sortOrder: slots[i] } });
    }
    await writeAudit({ action: "DROPDOWN_OPTIONS_REORDERED", actorUserId: ctx.userId, metadata: { list: def.key, count: orderedIds.length } }, tx);
  });
  return { ok: true };
}
