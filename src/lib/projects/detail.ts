// Everything the Project page shows, read live from the project's own rows and from the records of its deal (accepted quotes, Pre-Payment
// Records, Payment Collection Records, tasks). Nothing here is stored: a number is worked out again every time the page is read, so it is
// always the current one.
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac/effective";
import type { ModuleKey, Action } from "@/lib/rbac/catalog";
import { taskScope } from "@/lib/tasks/service";
import { taskVisibility } from "@/lib/tasks/rules";
import { formatDate, formatTime } from "@/lib/leads/format";
import { createReadUrls } from "@/lib/leads/storage";
import { getLayout } from "@/lib/records/layout";
import { filesOf } from "@/lib/records/files";
import { buildRefs, emptyRefIds } from "@/lib/records/lookups";
import { PROJECT_TEMPLATE_FIELD } from "@/lib/records/registry";
import { formatDay } from "@/lib/records/values";
import type { FieldOption, FileDto, LayoutField, ModuleLayoutDto } from "@/lib/records/types";
import {
  countsAsMoney, daysBetween, durationText, financials, selectedVendors, templatesOfVendor, toPaise, toRupees, totalOf, valueInformation, vendorBalance, workCoverage,
  type SelectionIn,
} from "./calc";
import { dec, decOr0, fieldValue, loadProject, need } from "./common";
import type { ProjectAbilities, ProjectDetail, ProjectRow, VendorName } from "./types";

export function projectAbilities(ctx: AuthContext): ProjectAbilities {
  const has = (m: ModuleKey, a: Action) => hasPermission(ctx.permissions, m, a);
  return {
    edit: has("projects", "edit"), create: has("projects", "create"), export: has("projects", "export"), layout: ctx.isSuperAdmin,
    pprView: has("ppr", "view"), pprCreate: has("ppr", "create"), pcrView: has("payments", "view"), pcrCreate: has("payments", "create"),
    tasksView: has("tasks", "view"), tasksCreate: has("tasks", "create"),
  };
}

// What the values of the typed fields of a table row are: by layout field key. A File Upload field holds the files of the row.
function rowValues(layout: ModuleLayoutDto, section: string, row: Record<string, unknown> | undefined, rowId: string, files: Map<string, FileDto[]>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of layout.fields) {
    if (f.section !== section || f.type === "CALC" || f.type === "AUTO") continue;
    out[f.key] = f.type === "FILE" ? files.get(`${rowId}|${f.key}`) ?? [] : row ? fieldValue(f, row) : null;
  }
  return out;
}

const optionLabel = (f: LayoutField | undefined, id: string | null | undefined) => (id ? f?.options.find(o => o.id === id)?.label ?? "" : "");
const fieldOf = (layout: ModuleLayoutDto, key: string) => layout.fields.find(f => f.key === key);
const dayText = (d: Date | null) => (d ? formatDay(d.toISOString().slice(0, 10)) : "");
const stampText = (d: Date | null) => (d ? `${formatDate(d)} ${formatTime(d)}` : "");

// Money of a set of records by vendor / template, added up in paise
function sumBy<T>(rows: T[], key: (r: T) => string | null, amount: (r: T) => number | null): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of rows) {
    const k = key(r);
    if (k) out.set(k, (out.get(k) ?? 0) + toPaise(amount(r)));
  }
  return out;
}

export async function getProjectDetail(ctx: AuthContext, id: string): Promise<ProjectDetail> {
  need(ctx, "view");
  const project = await loadProject(id);
  const abilities = projectAbilities(ctx);
  const scope = abilities.tasksView ? await taskScope(ctx) : null;

  const [layout, pprLayout, pcrLayout, deal, quotes, quoteLines, selections, coverage, materialRows, serviceRows, blocks, pprs, pcrs, projectFiles, tasks] = await Promise.all([
    getLayout("project"),
    getLayout("prePayment"),
    getLayout("paymentCollection"),
    prisma.deal.findUnique({ where: { id: project.dealId }, select: { dealNumber: true, title: true, lead: { select: { customerName: true } } } }),
    prisma.quote.findMany({
      where: { dealId: project.dealId, status: "Accepted", deletedAt: null },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      select: {
        id: true, quoteNumber: true, date: true, reference: true, amount: true,
        lineItems: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, name: true, description: true, amount: true } },
      },
    }),
    prisma.projectQuoteLine.findMany({ where: { projectId: project.id } }),
    prisma.projectItemSelection.findMany({ where: { projectId: project.id } }),
    prisma.projectWorkCoverage.findMany({ where: { projectId: project.id } }),
    prisma.projectMaterialVendor.findMany({ where: { projectId: project.id }, orderBy: { seq: "asc" } }),
    prisma.projectServiceVendor.findMany({ where: { projectId: project.id }, orderBy: { seq: "asc" } }),
    prisma.projectProcurement.findMany({ where: { projectId: project.id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: { rows: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } } }),
    prisma.prePayment.findMany({
      where: { dealId: project.dealId, deletedAt: null },
      orderBy: [{ date: "asc" }, { seq: "asc" }],
      select: { id: true, code: true, date: true, utrDate: true, paymentMode: true, paymentStatus: true, materialVendorId: true, serviceVendorId: true, workTypeId: true, remarks: true, amount: true },
    }),
    prisma.paymentCollection.findMany({
      where: { dealId: project.dealId, deletedAt: null },
      orderBy: [{ date: "asc" }, { seq: "asc" }],
      select: { id: true, code: true, date: true, utrDate: true, paymentMode: true, paymentStatus: true, materialVendorId: true, serviceVendorId: true, remarks: true, amount: true },
    }),
    filesOf("project", project.id),
    scope
      ? prisma.task.findMany({
          where: { AND: [taskVisibility(scope), { projectId: project.id }] },
          orderBy: [{ assignedAt: "asc" }, { createdAt: "asc" }],
          select: { id: true, title: true, status: true, assignedAt: true, completedAt: true, assignee: { select: { user: { select: { name: true } } } }, assignedBy: { select: { user: { select: { name: true } } } } },
        })
      : Promise.resolve([]),
  ]);

  // ---- Templates and the choices of the dropdowns
  const templateField = fieldOf(layout, PROJECT_TEMPLATE_FIELD);
  const templates: FieldOption[] = templateField?.options ?? [];
  const templateName = new Map(templates.map(o => [o.id, o.label]));
  const templateLabel = (tid: string | null | undefined) => (tid ? templateName.get(tid) ?? "" : "");

  // ---- Project Value Information
  const exclusionOf = new Map(quoteLines.map(l => [l.quoteId, dec(l.quoteExclusion)]));
  const lineOf = new Map(quoteLines.map(l => [l.quoteId, l]));
  const info = valueInformation(quotes.map(q => ({ id: q.id, amount: decOr0(q.amount), exclusion: exclusionOf.get(q.id) ?? null })));
  const valueRows: ProjectRow[] = quotes.map((q, i) => {
    const out = info.lines[i];
    const saved = lineOf.get(q.id);
    return {
      id: q.id,
      values: rowValues(layout, "valueInfo", saved as unknown as Record<string, unknown> | undefined, q.id, projectFiles),
      calc: { viNo: i + 1, viQuoteNo: q.quoteNumber ?? "", viQuoteDate: dayText(q.date), viReference: q.reference ?? "", viQuoteValue: out.quoteValue, viTotal: out.total },
      meta: { quoteId: q.id, href: `/quotes/${q.id}` },
    };
  });

  // ---- The items of the accepted quotes and what was chosen for them
  type Item = { id: string; quoteId: string; no: number; name: string; amount: number };
  const items: Item[] = quotes.flatMap(q => q.lineItems.map((l, i) => ({ id: l.id, quoteId: q.id, no: i + 1, name: l.name?.trim() || l.description?.trim() || "Item", amount: decOr0(l.amount) })));
  const order = items.map(i => i.id);
  const selectionOf = new Map(selections.map(s => [s.quoteItemId, s]));
  const selectionsIn: SelectionIn[] = selections.map(s => ({ quoteItemId: s.quoteItemId, templateId: s.templateId, serviceVendorIds: s.serviceVendorIds, materialVendorIds: s.materialVendorIds }));
  const chosen = selectedVendors(selectionsIn, order);
  const selection = {
    groups: quotes.map(q => ({
      quoteId: q.id,
      quoteNumber: q.quoteNumber ?? "",
      rows: items.filter(i => i.quoteId === q.id).map<ProjectRow>(i => {
        const s = selectionOf.get(i.id);
        return {
          id: i.id,
          values: rowValues(layout, "vendorSelection", s as unknown as Record<string, unknown> | undefined, i.id, projectFiles),
          calc: { vsNo: i.no, vsItem: i.name, vsVendors: { service: s?.serviceVendorIds ?? [], material: s?.materialVendorIds ?? [] } },
          meta: { quoteItemId: i.id, quoteId: q.id },
        };
      }),
    })),
  };

  // ---- Money: the Pre-Payment and Payment Collection Records of the deal (rejected and cancelled ones are not money)
  const pprCounted = pprs.filter(p => countsAsMoney(p.paymentStatus));
  const pcrCounted = pcrs.filter(p => countsAsMoney(p.paymentStatus));
  const expenses = totalOf(pprCounted.map(p => dec(p.amount)));
  const collected = totalOf(pcrCounted.map(p => dec(p.amount)));
  const money = financials({ projectValue: info.total, collected, expenses, exclusions: dec(project.exclusions), incentivePercent: dec(project.incentivePercent) });

  const givenMaterial = sumBy(pprCounted, p => p.materialVendorId, p => dec(p.amount));
  const givenService = sumBy(pprCounted, p => p.serviceVendorId, p => dec(p.amount));
  const spentByTemplate = Object.fromEntries(Array.from(sumBy(pprCounted, p => p.workTypeId, p => dec(p.amount)), ([k, v]) => [k, toRupees(v)]));

  // ---- Work Coverage
  const savedCoverage = new Map(coverage.map(c => [c.templateId, c]));
  const coverageRows: ProjectRow[] = workCoverage(
    items.map(i => ({ id: i.id, templateId: selectionOf.get(i.id)?.templateId ?? null, amount: i.amount })),
    spentByTemplate,
    Object.fromEntries(coverage.map(c => [c.templateId, c.completed])),
  ).map((r, i) => {
    const saved = savedCoverage.get(r.templateId);
    const values = rowValues(layout, "workCoverage", saved as unknown as Record<string, unknown> | undefined, r.templateId, projectFiles);
    values.completed = r.completed;
    return { id: r.templateId, values, calc: { wcNo: i + 1, wcTemplate: templateLabel(r.templateId) || r.templateId, wcItemValue: r.itemValue, wcAmountSpent: r.amountSpent, wcProfit: r.profit }, meta: { templateId: r.templateId } };
  });

  // ---- Names of the people and vendors the rows point at
  const materialIds = new Set<string>([...chosen.material, ...materialRows.map(r => r.materialVendorId), ...pprs.map(p => p.materialVendorId), ...pcrs.map(p => p.materialVendorId)].filter((x): x is string => !!x));
  const serviceIds = new Set<string>([...chosen.service, ...serviceRows.map(r => r.serviceVendorId), ...pprs.map(p => p.serviceVendorId), ...pcrs.map(p => p.serviceVendorId)].filter((x): x is string => !!x));
  const userIds = new Set<string>(materialRows.map(r => r.materialTaskPersonId).filter((x): x is string => !!x));
  const [materialNames, serviceNames, userNames] = await Promise.all([
    materialIds.size ? prisma.materialVendor.findMany({ where: { id: { in: Array.from(materialIds) } }, select: { id: true, code: true, companyName: true } }) : [],
    serviceIds.size ? prisma.serviceVendor.findMany({ where: { id: { in: Array.from(serviceIds) } }, select: { id: true, code: true, name: true } }) : [],
    userIds.size ? prisma.user.findMany({ where: { id: { in: Array.from(userIds) } }, select: { id: true, name: true, email: true } }) : [],
  ]);
  const refs: ProjectDetail["refs"] = {
    users: Object.fromEntries(userNames.map(u => [u.id, u.name?.trim() || u.email || "Unnamed"])),
    materialVendors: Object.fromEntries(materialNames.map(v => [v.id, { code: v.code, name: v.companyName } satisfies VendorName])),
    serviceVendors: Object.fromEntries(serviceNames.map(v => [v.id, { code: v.code, name: v.name } satisfies VendorName])),
    templates: Object.fromEntries(templates.map(o => [o.id, o.label])),
    deals: {},
    lookups: {},
  };

  // ---- Material Vendor Involvement
  const materialInvolvement: ProjectRow[] = materialRows.map((r, i) => {
    const given = toRupees(givenMaterial.get(r.materialVendorId) ?? 0);
    const { balance, credit } = vendorBalance(dec(r.materialQuotedValue), given);
    return {
      id: r.id,
      values: rowValues(layout, "materialVendors", r as unknown as Record<string, unknown>, r.id, projectFiles),
      calc: { mvNo: i + 1, mvGiven: given, mvBalance: balance, mvCredit: credit },
      meta: { vendorId: r.materialVendorId, selected: chosen.material.includes(r.materialVendorId) },
    };
  });

  // ---- Service Vendor Involvement
  const serviceInvolvement: ProjectRow[] = serviceRows.map((r, i) => {
    const given = toRupees(givenService.get(r.serviceVendorId) ?? 0);
    const { balance } = vendorBalance(dec(r.serviceQuotedValue), given);
    const planned = daysBetween(dayOfDate(r.serviceStartDate), dayOfDate(r.serviceCompletionDate));
    const actual = daysBetween(dayOfDate(r.serviceStartedDate), dayOfDate(r.serviceCompletedDate));
    const templateIds = templatesOfVendor(selectionsIn, order, "service", r.serviceVendorId);
    return {
      id: r.id,
      values: rowValues(layout, "serviceVendors", r as unknown as Record<string, unknown>, r.id, projectFiles),
      calc: { svNo: i + 1, svDuration: { planned, actual, text: durationText(planned, actual) }, svGiven: given, svBalance: balance },
      meta: { vendorId: r.serviceVendorId, selected: chosen.service.includes(r.serviceVendorId), templateIds },
    };
  });

  // ---- Payment Collection and Site Expenses: the records of the other modules, with their attachments
  const wantPpr = abilities.pprView && pprs.length > 0;
  const wantPcr = abilities.pcrView && pcrs.length > 0;
  const attachmentRows = wantPpr || wantPcr
    ? await prisma.moduleFile.findMany({
        where: {
          fieldKey: "attachment", deletedAt: null, status: "READY",
          OR: [...(wantPpr ? [{ module: "prePayment", recordId: { in: pprs.map(p => p.id) } }] : []), ...(wantPcr ? [{ module: "paymentCollection", recordId: { in: pcrs.map(p => p.id) } }] : [])],
        },
        orderBy: { createdAt: "asc" },
        select: { id: true, module: true, recordId: true, fileName: true, size: true, mimeType: true, storagePath: true },
      })
    : [];
  const urls = await createReadUrls(attachmentRows.map(f => f.storagePath));
  const attachments = new Map<string, FileDto[]>();
  for (const f of attachmentRows) {
    const key = `${f.module}|${f.recordId}`;
    const list = attachments.get(key) ?? [];
    list.push({ id: f.id, fileName: f.fileName, size: f.size, mimeType: f.mimeType, url: urls.get(f.storagePath) ?? null });
    attachments.set(key, list);
  }
  const vendorText = (materialId: string | null, serviceId: string | null) =>
    [materialId ? refs.materialVendors[materialId] : null, serviceId ? refs.serviceVendors[serviceId] : null].filter((v): v is VendorName => !!v).map(v => `${v.code} - ${v.name}`).join(", ");

  const pprModeField = fieldOf(pprLayout, "paymentMode");
  const pprStatusField = fieldOf(pprLayout, "paymentStatus");
  const pcrModeField = fieldOf(pcrLayout, "paymentMode");
  const pcrStatusField = fieldOf(pcrLayout, "paymentStatus");

  const paymentRows: ProjectRow[] = pcrs.map((p, i) => ({
    id: p.id,
    values: {},
    calc: {
      pcNo: i + 1, pcDate: dayText(p.date), pcCode: p.code, pcMode: optionLabel(pcrModeField, p.paymentMode), pcVendor: vendorText(p.materialVendorId, p.serviceVendorId),
      pcPaymentDate: dayText(p.utrDate), pcRemarks: p.remarks ?? "", pcAttachment: attachments.get(`paymentCollection|${p.id}`) ?? [], pcAmount: dec(p.amount),
    },
    meta: { href: `/payment-collections/${p.id}`, counted: countsAsMoney(p.paymentStatus), status: optionLabel(pcrStatusField, p.paymentStatus) },
  }));
  const expenseRows: ProjectRow[] = pprs.map((p, i) => ({
    id: p.id,
    values: {},
    calc: {
      seNo: i + 1, seDate: dayText(p.date), seCode: p.code, seMode: optionLabel(pprModeField, p.paymentMode), seVendor: vendorText(p.materialVendorId, p.serviceVendorId),
      sePaymentDate: dayText(p.utrDate), seRemarks: p.remarks ?? "", seAttachment: attachments.get(`prePayment|${p.id}`) ?? [], seWorkType: templateLabel(p.workTypeId), seAmount: dec(p.amount),
    },
    meta: { href: `/pre-payments/${p.id}`, counted: countsAsMoney(p.paymentStatus), status: optionLabel(pprStatusField, p.paymentStatus) },
  }));

  // ---- Tasks
  const taskRows: ProjectRow[] = tasks.map((t, i) => ({
    id: t.id,
    values: {},
    calc: { tkNo: i + 1, tkName: t.title, tkAssignedTo: t.assignee?.user.name ?? "", tkAssignedBy: t.assignedBy?.user.name ?? "", tkAssignedAt: stampText(t.assignedAt), tkCompletedAt: stampText(t.completedAt) },
    meta: { status: t.status },
  }));

  // ---- Material Procurement
  const itemLabelOf = new Map(items.map(i => [i.id, quotes.length > 1 ? `${i.name} (${quotes.find(q => q.id === i.quoteId)?.quoteNumber ?? ""})` : i.name]));
  const procurement = {
    blocks: blocks.map(b => ({
      id: b.id,
      quoteItemId: b.quoteItemId,
      itemLabel: (b.quoteItemId ? itemLabelOf.get(b.quoteItemId) : null) ?? b.itemLabel,
      rows: b.rows.map<ProjectRow>((r, i) => ({ id: r.id, values: rowValues(layout, "procurement", r as unknown as Record<string, unknown>, r.id, projectFiles), calc: { prNo: i + 1 }, meta: {} })),
    })),
    itemChoices: items.map(i => ({ id: i.id, label: itemLabelOf.get(i.id) ?? i.name })),
  };

  // ---- The Project Information fields (and those of any form section added in Edit Page Layout) and the typed fields of the Financial Summary
  const record = project as unknown as Record<string, unknown>;
  const formSections = new Set(layout.sections.filter(s => s.kind === "FORM").map(s => s.id));
  const values: Record<string, unknown> = {};
  for (const f of layout.fields) {
    if ((!formSections.has(f.section) && f.section !== "summary") || f.type === "CALC") continue;
    values[f.key] = f.type === "AUTO" ? project.projectCode : f.type === "FILE" ? projectFiles.get(`|${f.key}`) ?? [] : fieldValue(f, record);
  }
  values.dealId = project.dealId;

  // The records a Lookup field added to the project points to (a customer, another deal ...), named
  const lookupIds = emptyRefIds();
  for (const f of layout.fields) {
    const v = values[f.key];
    if (f.isSystem || f.type !== "LOOKUP" || typeof v !== "string") continue;
    (f.lookup === "deal" ? lookupIds.deals : f.lookup === "customer" ? lookupIds.customers : f.lookup === "project" ? lookupIds.projects : f.lookup === "materialVendor" ? lookupIds.materialVendors : lookupIds.serviceVendors).add(v);
  }
  const lookupRefs = Object.values(lookupIds).some(s => s.size) ? await buildRefs(lookupIds) : null;
  if (lookupRefs) {
    refs.deals = lookupRefs.deals;
    refs.lookups = { ...(lookupRefs.lookups ?? {}), ...refs.lookups };
    Object.assign(refs.materialVendors, lookupRefs.materialVendors);
    Object.assign(refs.serviceVendors, lookupRefs.serviceVendors);
  }

  return {
    id: project.id,
    code: project.projectCode,
    dealId: project.dealId,
    dealNumber: deal?.dealNumber ?? "",
    dealName: deal?.title ?? "",
    customerName: deal?.lead.customerName ?? "",
    values,
    money,
    valueInfo: { rows: valueRows, total: info.total },
    selection,
    workCoverage: coverageRows,
    materialVendors: materialInvolvement,
    serviceVendors: serviceInvolvement,
    payments: abilities.pcrView ? { rows: paymentRows, total: collected } : null,
    expenses: abilities.pprView ? { rows: expenseRows, total: expenses } : null,
    tasks: abilities.tasksView ? taskRows : null,
    procurement,
    templates,
    refs,
    abilities,
    updatedAt: project.updatedAt.toISOString(),
  };
}

const dayOfDate = (d: Date | null | undefined) => (d instanceof Date ? d.toISOString().slice(0, 10) : null);
