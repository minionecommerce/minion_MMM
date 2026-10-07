// The Projects page: the list, its search, filters, sorting and calendar, the Total Value, and the CSV file.
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { ServiceError } from "@/lib/users/service";
import { dateRange } from "@/lib/leads/queries";
import { getLayout } from "@/lib/records/layout";
import { buildRefs, emptyRefIds } from "@/lib/records/lookups";
import { displayValue, formatDay, stripControl } from "@/lib/records/values";
import type { LayoutField, RecordRefs } from "@/lib/records/types";
import { EXCLUDED_PAYMENT_STATUSES, toRupees, toPaise, valueInformation } from "./calc";
import { dec, decOr0, dayOf, fieldValue, need } from "./common";
import { hasPermission } from "@/lib/rbac/effective";
import { PROJECT_DATE_TYPES, PROJECT_FILTER_KEYS, PROJECT_PAGE_SIZE, PROJECT_SORT_KEYS, type ProjectDateBy, type ProjectListParams, type ProjectSortKey } from "./constants";
import type { ProjectListData, ProjectListRow } from "./types";

export function parseProjectParams(sp: Record<string, string | string[] | undefined>): ProjectListParams {
  const one = (k: string) => { const v = sp[k]; return Array.isArray(v) ? v[0] : v; };
  const day = (k: string) => { const v = one(k); return v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : undefined; };
  let from = day("from");
  let to = day("to");
  if (from && to && from > to) [from, to] = [to, from];
  const sort = one("sort");
  const dateBy = one("dateBy");
  const cols: ProjectListParams["cols"] = {};
  for (const k of PROJECT_FILTER_KEYS) {
    const raw = one(`f_${k}`);
    if (!raw) continue;
    try {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) continue;
      const vals = arr.filter((v): v is string => typeof v === "string" && v.length > 0 && v.length <= 300).slice(0, 50);
      if (vals.length) cols[k] = vals;
    } catch { /* an unreadable filter is ignored */ }
  }
  return {
    q: stripControl(one("q") ?? "").trim().slice(0, 100) || undefined,
    sort: (PROJECT_SORT_KEYS as readonly string[]).includes(sort ?? "") ? (sort as ProjectSortKey) : undefined,
    dir: one("dir") === "asc" ? "asc" : "desc",
    page: Math.max(1, Math.min(100000, parseInt(one("page") ?? "1", 10) || 1)),
    from,
    to,
    dateBy: (PROJECT_DATE_TYPES as readonly { value: string }[]).some(d => d.value === dateBy) ? (dateBy as ProjectDateBy) : undefined,
    cols,
  };
}

const base: Prisma.ProjectWhereInput = { deletedAt: null, projectCode: { not: null }, dealId: { not: null } };

// A calendar day range on a date column: whole days, the way the day is stored (midnight UTC)
function dayRange(params: Pick<ProjectListParams, "from" | "to">) {
  if (!params.from && !params.to) return null;
  return {
    ...(params.from ? { gte: new Date(`${params.from}T00:00:00.000Z`) } : {}),
    ...(params.to ? { lt: new Date(new Date(`${params.to}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000) } : {}),
  };
}

function buildWhere(params: ProjectListParams): Prisma.ProjectWhereInput {
  const and: Prisma.ProjectWhereInput[] = [base];
  if (params.q) {
    const contains = { contains: params.q, mode: "insensitive" as const };
    const digits = params.q.replace(/\D/g, "");
    and.push({
      OR: [
        { projectCode: contains }, { name: contains }, { siteLocation: contains },
        { deal: { is: { OR: [{ dealNumber: contains }, { title: contains }, { lead: { is: { OR: [{ customerName: contains }, { contactNumber: contains }, ...(digits.length >= 3 ? [{ contactNumber: { contains: digits } }] : []), { salesExecutive: { is: { user: { is: { name: contains } } } } }] } } }] } } },
      ],
    });
  }
  const c = params.cols;
  if (c.status?.length) and.push({ status: { in: c.status } });
  if (c.taskPerson?.length) and.push({ deal: { is: { lead: { is: { salesExecutiveId: { in: c.taskPerson } } } } } });
  if (c.location?.length) and.push({ siteLocation: { in: c.location } });

  const dateBy = params.dateBy ?? "start";
  if (dateBy === "created") {
    const range = dateRange(params); // an instant: whole days in the CRM time zone
    if (range) and.push({ convertedAt: range });
  } else {
    const range = dayRange(params);
    if (range) and.push({ [dateBy === "start" ? "startDate" : dateBy === "validity" ? "expectedEndDate" : "priorCompletionDate"]: range });
  }
  return { AND: and };
}

function orderBy(sort: ProjectSortKey | undefined, dir: "asc" | "desc"): Prisma.ProjectOrderByWithRelationInput[] {
  const tail: Prisma.ProjectOrderByWithRelationInput = { projectSeq: "desc" };
  const nulls = (field: "siteLocation" | "startDate" | "expectedEndDate" | "priorCompletionDate"): Prisma.ProjectOrderByWithRelationInput => ({ [field]: { sort: dir, nulls: "last" } });
  switch (sort) {
    case "name": return [{ name: dir }, tail];
    case "location": return [nulls("siteLocation"), tail];
    case "start": return [nulls("startDate"), tail];
    case "validity": return [nulls("expectedEndDate"), tail];
    case "prior": return [nulls("priorCompletionDate"), tail];
    case "progress": return [{ progress: dir }, tail];
    case "status": return [{ status: dir }, tail];
    case "code":
    default: return [{ projectSeq: dir }];
  }
}

const listSelect = {
  id: true, projectCode: true, projectSeq: true, name: true, dealId: true, siteLocation: true, siteLocationLink: true, startDate: true, actualStartDate: true,
  expectedEndDate: true, completedDate: true, priorCompletionDate: true, progress: true, status: true, customFields: true, convertedAt: true,
  deal: { select: { dealNumber: true, lead: { select: { customerName: true, contactNumber: true, leadType: { select: { label: true } }, salesExecutive: { select: { user: { select: { name: true } } } } } } } },
} satisfies Prisma.ProjectSelect;
type ListRecord = Prisma.ProjectGetPayload<{ select: typeof listSelect }>;

// Project Value and Collected Amount of a set of projects: the accepted quotes of each deal (less the Exclusions typed in the project) and its PCRs
async function projectMoney(projects: { id: string; dealId: string | null }[]): Promise<Map<string, { value: number; collected: number }>> {
  const out = new Map<string, { value: number; collected: number }>();
  const dealIds = Array.from(new Set(projects.map(p => p.dealId).filter((x): x is string => !!x)));
  if (!dealIds.length) return out;
  const [quotes, lines, collected] = await Promise.all([
    prisma.quote.findMany({ where: { dealId: { in: dealIds }, status: "Accepted", deletedAt: null }, select: { id: true, dealId: true, amount: true } }),
    prisma.projectQuoteLine.findMany({ where: { projectId: { in: projects.map(p => p.id) } }, select: { projectId: true, quoteId: true, quoteExclusion: true } }),
    prisma.paymentCollection.groupBy({
      by: ["dealId"],
      where: { dealId: { in: dealIds }, deletedAt: null, OR: [{ paymentStatus: null }, { paymentStatus: { notIn: [...EXCLUDED_PAYMENT_STATUSES] } }] },
      _sum: { amount: true },
    }),
  ]);
  const exclusion = new Map(lines.map(l => [`${l.projectId}|${l.quoteId}`, dec(l.quoteExclusion)]));
  const sums = new Map(collected.map(c => [c.dealId, dec(c._sum.amount) ?? 0]));
  for (const p of projects) {
    const mine = quotes.filter(q => q.dealId === p.dealId).map(q => ({ id: q.id, amount: decOr0(q.amount), exclusion: exclusion.get(`${p.id}|${q.id}`) ?? null }));
    out.set(p.id, { value: valueInformation(mine).total, collected: p.dealId ? sums.get(p.dealId) ?? 0 : 0 });
  }
  return out;
}

async function toRows(rows: ListRecord[], fields: { status: LayoutField | undefined; columns: LayoutField[] }): Promise<ProjectListRow[]> {
  const money = await projectMoney(rows.map(r => ({ id: r.id, dealId: r.dealId })));
  // the people and records the added columns name
  const ids = emptyRefIds();
  for (const f of fields.columns) {
    if (f.type !== "USER" && f.type !== "LOOKUP") continue;
    for (const r of rows) {
      const v = fieldValue(f, r as unknown as Record<string, unknown>);
      if (typeof v !== "string") continue;
      if (f.type === "USER") ids.users.add(v);
      else (f.lookup === "deal" ? ids.deals : f.lookup === "customer" ? ids.customers : f.lookup === "project" ? ids.projects : f.lookup === "materialVendor" ? ids.materialVendors : ids.serviceVendors).add(v);
    }
  }
  const refs: RecordRefs = Object.values(ids).some(s => s.size) ? await buildRefs(ids) : { users: {}, deals: {}, materialVendors: {}, serviceVendors: {} };

  return rows.map(r => {
    const m = money.get(r.id) ?? { value: 0, collected: 0 };
    const lead = r.deal?.lead;
    const custom: Record<string, string> = {};
    for (const f of fields.columns) custom[f.key] = displayValue(f, fieldValue(f, r as unknown as Record<string, unknown>), refs);
    return {
      id: r.id,
      code: r.projectCode ?? "",
      dealId: r.dealId,
      dealNumber: r.deal?.dealNumber ?? "",
      name: r.name,
      siteLocation: r.siteLocation,
      siteLocationLink: r.siteLocationLink,
      taskPerson: lead?.salesExecutive?.user.name ?? null,
      contact: { customerName: lead?.customerName ?? "", contactNumber: lead?.contactNumber ?? "", leadTypeLabel: lead?.leadType?.label ?? null },
      projectValue: m.value,
      collected: m.collected,
      balance: toRupees(toPaise(m.value) - toPaise(m.collected)),
      startDate: dayOf(r.startDate),
      actualStartDate: dayOf(r.actualStartDate),
      expectedEndDate: dayOf(r.expectedEndDate),
      completedDate: dayOf(r.completedDate),
      priorCompletionDate: dayOf(r.priorCompletionDate),
      progress: r.progress,
      statusLabel: fields.status?.options.find(o => o.id === r.status)?.label ?? r.status ?? "",
      custom,
    };
  });
}

export async function listProjects(ctx: AuthContext, params: ProjectListParams): Promise<ProjectListData> {
  need(ctx, "view");
  const layout = await getLayout("project");
  const where = buildWhere(params);
  const columns = layout.columns.map(k => layout.fields.find(f => f.key === k)).filter((f): f is LayoutField => !!f && !f.isSystem);
  const [rows, showing, total, matching] = await Promise.all([
    prisma.project.findMany({ where, select: listSelect, orderBy: orderBy(params.sort, params.dir), skip: (params.page - 1) * PROJECT_PAGE_SIZE, take: PROJECT_PAGE_SIZE }),
    prisma.project.count({ where }),
    prisma.project.count({ where: base }),
    prisma.project.findMany({ where, select: { id: true, dealId: true }, take: 5000 }), // every match, for the Total Value
  ]);
  const [list, totals] = await Promise.all([
    toRows(rows, { status: layout.fields.find(f => f.key === "status"), columns }),
    projectMoney(matching),
  ]);
  const totalValue = toRupees(Array.from(totals.values()).reduce((a, t) => a + toPaise(t.value), 0));
  return { rows: list, total, showing, totalValue, page: params.page, pageCount: Math.max(1, Math.ceil(showing / PROJECT_PAGE_SIZE)), pageSize: PROJECT_PAGE_SIZE };
}

// What the header filters offer: the statuses (all of them), the task persons of the deals and the site locations that exist among the projects
export async function projectFilterLists() {
  const [layout, rows] = await Promise.all([
    getLayout("project"),
    prisma.project.findMany({ where: base, select: { siteLocation: true, deal: { select: { lead: { select: { salesExecutiveId: true, salesExecutive: { select: { user: { select: { name: true } } } } } } } } }, take: 5000 }),
  ]);
  const people = new Map<string, string>();
  const places = new Set<string>();
  for (const r of rows) {
    const lead = r.deal?.lead;
    if (lead?.salesExecutiveId) people.set(lead.salesExecutiveId, lead.salesExecutive?.user.name ?? "—");
    if (r.siteLocation) places.add(r.siteLocation);
  }
  return {
    statuses: (layout.fields.find(f => f.key === "status")?.options ?? []).map(o => ({ value: o.id, label: o.label })),
    people: Array.from(people, ([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label)),
    locations: Array.from(places).sort((a, b) => a.localeCompare(b)).map(l => ({ value: l, label: l })),
  };
}

const csvCell = (value: unknown) => {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // a spreadsheet runs text that starts with = + - @ as a formula
  return `"${s.replace(/"/g, '""')}"`;
};

export async function exportProjects(ctx: AuthContext, params: ProjectListParams): Promise<string> {
  need(ctx, "view");
  if (!hasPermission(ctx.permissions, "projects", "export")) throw new ServiceError(403, "You do not have permission to export projects.");
  const layout = await getLayout("project");
  const columns = layout.columns.map(k => layout.fields.find(f => f.key === k)).filter((f): f is LayoutField => !!f && !f.isSystem);
  const rows = await prisma.project.findMany({ where: buildWhere(params), select: listSelect, orderBy: orderBy(params.sort, params.dir), take: 10000 });
  const list = await toRows(rows, { status: layout.fields.find(f => f.key === "status"), columns });
  const day = (d: string | null) => (d ? formatDay(d) : "");
  const head = [
    "Project Code", "Deal No", "Project Name", "Site Location", "Site Location Link", "Task Person", "Customer", "Contact Number", "Project Value", "Collected Amount", "Balance Amount",
    "Project Start Date", "Actual Start Date", "Project Validity", "Completed Date", "Prior Completion Date", "Completion %", "Project Status", ...columns.map(f => f.label),
  ];
  const lines = [head.map(csvCell).join(",")];
  for (const r of list) {
    lines.push([
      r.code, r.dealNumber, r.name, r.siteLocation, r.siteLocationLink, r.taskPerson, r.contact.customerName, r.contact.contactNumber, r.projectValue, r.collected, r.balance,
      day(r.startDate), day(r.actualStartDate), day(r.expectedEndDate), day(r.completedDate), day(r.priorCompletionDate), r.progress, r.statusLabel, ...columns.map(f => r.custom[f.key] ?? ""),
    ].map(csvCell).join(","));
  }
  return "﻿" + lines.join("\r\n");
}
