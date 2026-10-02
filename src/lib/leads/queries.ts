import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { COLUMN_FILTER_KEYS, COLUMN_FILTER_MAX_VALUES, LEAD_FILTERS, OPTION_TYPES, PAGE_SIZE, SORT_KEYS, type ColumnFilters, type EmployeeOptionDto, type LeadFilterId, type LeadFormOptions, type LeadOptionDto, type LeadSortKey, type OptionType } from "./constants";
import { formatDate, formatTime, todayBounds } from "./format";
import { getLayout } from "./layout";

export type LeadListParams = {
  q?: string;
  filter?: LeadFilterId | "repeated";
  sort?: LeadSortKey;
  dir?: "asc" | "desc";
  page?: number;
  statusId?: string;
  sourceId?: string;
  assigneeId?: string;
  from?: string; // YYYY-MM-DD, created date range in the CRM time zone
  to?: string;
  cols?: ColumnFilters; // column header tick-box filters; several values in one column = OR, different columns = AND
};

const personSelect = { id: true, designation: true, user: { select: { name: true } } } as const;
const optionSelect = { id: true, label: true, key: true } as const;

const rowSelect = {
  id: true,
  leadSeq: true,
  leadCode: true,
  leadNumber: true,
  createdAt: true,
  customerName: true,
  contactNumber: true,
  exactRequirement: true,
  requirement: true,
  siteLocation: true,
  source: true,
  amount: true,
  expectedValue: true,
  conventionalRate: true,
  notes: true,
  location: true,
  exactLocation: true,
  locationLink: true,
  dailyTask: true,
  customFields: true,
  productOrServiceId: true,
  requirementId: true,
  modeOfCustomerId: true,
  sourceId: true,
  mainCategoryId: true,
  categoryId: true,
  subcategoryId: true,
  leadStatusId: true,
  leadTypeId: true,
  salesExecutiveId: true,
  leadPersonId: true,
  customer: { select: { name: true, phone: true } },
  salesExecutive: { select: personSelect },
  leadPerson: { select: personSelect },
  productOrService: { select: optionSelect },
  requirementOption: { select: optionSelect },
  modeOfCustomer: { select: optionSelect },
  sourceOption: { select: optionSelect },
  mainCategory: { select: optionSelect },
  category: { select: optionSelect },
  subcategory: { select: optionSelect },
  leadStatus: { select: optionSelect },
  leadType: { select: optionSelect },
  _count: { select: { attachments: { where: { status: "READY", deletedAt: null } } } },
} satisfies Prisma.LeadSelect;

type RowRecord = Prisma.LeadGetPayload<{ select: typeof rowSelect }>;

export type LeadRow = ReturnType<typeof toRow>;

function person(p: RowRecord["salesExecutive"]) {
  return p ? { id: p.id, name: p.user?.name ?? "—", designation: p.designation } : null;
}

export function toRow(l: RowRecord) {
  return {
    id: l.id,
    code: l.leadCode ?? l.leadNumber ?? "—",
    date: formatDate(l.createdAt),
    time: formatTime(l.createdAt),
    createdAt: l.createdAt.toISOString(),
    productOrServiceLabel: l.productOrService?.label ?? null,
    customerName: l.customerName ?? l.customer?.name ?? "—",
    contactNumber: l.contactNumber ?? l.customer?.phone ?? "",
    leadTypeLabel: l.leadType?.label ?? null,
    requirementLabel: l.requirementOption?.label ?? null,
    exactRequirement: l.exactRequirement ?? l.requirement ?? null,
    amount: l.amount !== null ? Number(l.amount) : l.expectedValue !== null ? Number(l.expectedValue) : null,
    taskPerson: person(l.salesExecutive),
    leadPerson: person(l.leadPerson),
    leadStatus: l.leadStatus ? { id: l.leadStatus.id, label: l.leadStatus.label, key: l.leadStatus.key } : null,
    notes: l.notes,
    conventionalRate: l.conventionalRate !== null ? Number(l.conventionalRate) : null,
    sourceLabel: l.sourceOption?.label ?? l.source ?? null,
    modeOfCustomerLabel: l.modeOfCustomer?.label ?? null,
    mainCategoryLabel: l.mainCategory?.label ?? null,
    categoryLabel: l.category?.label ?? null,
    subcategoryLabel: l.subcategory?.label ?? null,
    location: l.location ?? l.siteLocation ?? null,
    exactLocation: l.exactLocation,
    locationLink: l.locationLink,
    dailyTask: l.dailyTask,
    customFields: ((l.customFields ?? {}) as Record<string, string | number | boolean>),
    attachmentCount: l._count.attachments,
    ids: {
      taskAssignedPersonId: l.salesExecutiveId,
      leadPersonId: l.leadPersonId,
      productOrServiceId: l.productOrServiceId,
      requirementId: l.requirementId,
      modeOfCustomerId: l.modeOfCustomerId,
      sourceId: l.sourceId,
      mainCategoryId: l.mainCategoryId,
      categoryId: l.categoryId,
      subcategoryId: l.subcategoryId,
      leadStatusId: l.leadStatusId,
      leadTypeId: l.leadTypeId,
    },
  };
}

// Phone numbers that appear on more than one (non-deleted) lead
async function repeatedNumbers(limit = 5000): Promise<string[]> {
  const groups = await prisma.lead.groupBy({
    by: ["contactNumber"],
    where: { deletedAt: null, contactNumber: { not: null } },
    having: { contactNumber: { _count: { gt: 1 } } },
    orderBy: { contactNumber: "asc" },
    take: limit,
  });
  return groups.map(g => g.contactNumber!).filter(Boolean);
}

function orderBy(sort: LeadSortKey | undefined, dir: "asc" | "desc"): Prisma.LeadOrderByWithRelationInput[] {
  const tie: Prisma.LeadOrderByWithRelationInput[] = [{ createdAt: "desc" }, { id: "desc" }];
  switch (sort) {
    case "customer": return [{ customerName: { sort: dir, nulls: "last" } }, ...tie];
    case "requirement": return [{ requirementOption: { label: dir } }, ...tie];
    case "assigned": return [{ salesExecutive: { user: { name: dir } } }, ...tie];
    case "status": return [{ leadStatus: { label: dir } }, ...tie];
    case "source": return [{ sourceOption: { label: dir } }, ...tie];
    case "category": return [{ mainCategory: { label: dir } }, ...tie];
    case "location": return [{ location: { sort: dir, nulls: "last" } }, ...tie];
    case "lead":
    default:
      return [{ leadSeq: { sort: dir, nulls: "last" } }, ...tie];
  }
}

export function parseListParams(sp: Record<string, string | string[] | undefined>): LeadListParams {
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const filter = one("filter");
  const sort = one("sort");
  const id = (k: string) => { const v = one(k); return v && /^[A-Za-z0-9_-]{1,64}$/.test(v) ? v : undefined; };
  const day = (k: string) => { const v = one(k); return v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : undefined; };
  const cols: ColumnFilters = {};
  for (const k of COLUMN_FILTER_KEYS) {
    const raw = one(`f_${k}`);
    if (!raw) continue;
    try {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) continue;
      const vals = arr.filter((v): v is string => typeof v === "string" && v.length > 0 && v.length <= 200).slice(0, COLUMN_FILTER_MAX_VALUES);
      if (vals.length) cols[k] = vals;
    } catch { /* ignore a malformed value */ }
  }
  return {
    cols,
    statusId: id("status"),
    sourceId: id("source"),
    assigneeId: id("assignee"),
    from: day("from"),
    to: day("to"),
    q: one("q")?.trim().slice(0, 100) || undefined,
    filter: filter === "repeated" || LEAD_FILTERS.some(f => f.id === filter) ? (filter as LeadListParams["filter"]) : undefined,
    sort: (SORT_KEYS as readonly string[]).includes(sort ?? "") ? (sort as LeadSortKey) : undefined,
    dir: one("dir") === "asc" ? "asc" : "desc",
    page: Math.max(1, Number(one("page")) || 1),
  };
}

async function buildWhere(params: LeadListParams): Promise<Prisma.LeadWhereInput> {
  const and: Prisma.LeadWhereInput[] = [{ deletedAt: null }];

  if (params.q) {
    const q = params.q;
    const contains = { contains: q, mode: "insensitive" as const };
    const digits = q.replace(/\D/g, "");
    and.push({
      OR: [
        { leadCode: contains },
        { leadNumber: contains },
        { customerName: contains },
        { contactNumber: contains },
        ...(digits.length >= 3 ? [{ contactNumber: { contains: digits } }] : []),
        { exactRequirement: contains },
        { requirement: contains },
        { requirementOption: { label: contains } },
        { salesExecutive: { user: { name: contains } } },
        { leadPerson: { user: { name: contains } } },
        { sourceOption: { label: contains } },
        { source: contains },
        { mainCategory: { label: contains } },
        { category: { label: contains } },
        { subcategory: { label: contains } },
        { location: contains },
        { exactLocation: contains },
        { siteLocation: contains },
        { leadStatus: { label: contains } },
        { customer: { name: contains } },
        { customer: { phone: contains } },
      ],
    });
  }

  const c = params.cols ?? {};
  if (c.customer) and.push({ customerName: { in: c.customer } });
  if (c.requirement) and.push({ requirementId: { in: c.requirement } });
  if (c.assigned) and.push({ salesExecutiveId: { in: c.assigned } });
  if (c.status) and.push({ leadStatusId: { in: c.status } });
  if (c.source) and.push({ sourceId: { in: c.source } });
  if (c.category) and.push({ mainCategoryId: { in: c.category } });
  if (c.location) and.push({ location: { in: c.location } });

  if (params.statusId) and.push({ leadStatusId: params.statusId });
  if (params.sourceId) and.push({ sourceId: params.sourceId });
  if (params.assigneeId) and.push({ salesExecutiveId: params.assigneeId });
  if (params.from) and.push({ createdAt: { gte: todayBounds(new Date(`${params.from}T12:00:00Z`))[0] } });
  if (params.to) and.push({ createdAt: { lt: todayBounds(new Date(`${params.to}T12:00:00Z`))[1] } });

  if (params.filter === "repeated") {
    and.push({ contactNumber: { in: await repeatedNumbers() } });
  } else if (params.filter === "today_followup") {
    const [start, end] = todayBounds();
    and.push({ nextActionDate: { gte: start, lt: end } });
  } else if (params.filter) {
    const f = LEAD_FILTERS.find(x => x.id === params.filter);
    if (f?.statusKey) and.push({ leadStatus: { key: f.statusKey } });
  }
  return { AND: and };
}

export async function listLeads(params: LeadListParams) {
  const page = params.page ?? 1;
  const where = await buildWhere(params);
  const [rows, filteredTotal, total, repeated] = await Promise.all([
    prisma.lead.findMany({
      where,
      select: rowSelect,
      orderBy: orderBy(params.sort, params.dir === "asc" ? "asc" : "desc"),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.lead.count({ where }),
    prisma.lead.count({ where: { deletedAt: null } }),
    repeatedNumbers().then(r => r.length),
  ]);
  return {
    rows: rows.map(toRow),
    summary: { total, showing: filteredTotal, repeated },
    page,
    pageCount: Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE)),
    pageSize: PAGE_SIZE,
  };
}

// For CSV download: same filters, no paging, capped
export async function listLeadsForExport(params: LeadListParams, max = 10000) {
  const where = await buildWhere(params);
  const rows = await prisma.lead.findMany({ where, select: rowSelect, orderBy: orderBy(params.sort, params.dir === "asc" ? "asc" : "desc"), take: max });
  return rows.map(toRow);
}

export async function getLeadRow(id: string) {
  const lead = await prisma.lead.findFirst({ where: { id, deletedAt: null }, select: rowSelect });
  return lead ? toRow(lead) : null;
}

export async function getFormOptions(): Promise<LeadFormOptions> {
  const [options, employees, fields, customers, locations] = await Promise.all([
    prisma.leadOption.findMany({
      where: { OR: [{ type: { in: [...OPTION_TYPES] } }, { type: { startsWith: "CF:" } }] },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      select: { id: true, type: true, key: true, label: true, parentId: true },
    }),
    prisma.employee.findMany({
      where: { user: { deletedAt: null, status: "ACTIVE" } },
      orderBy: { user: { name: "asc" } },
      select: { id: true, designation: true, user: { select: { name: true } } },
    }),
    getLayout(),
    prisma.lead.findMany({ where: { deletedAt: null, customerName: { not: null } }, distinct: ["customerName"], select: { customerName: true }, orderBy: { customerName: "asc" }, take: 1000 }),
    prisma.lead.findMany({ where: { deletedAt: null, location: { not: null } }, distinct: ["location"], select: { location: true }, orderBy: { location: "asc" }, take: 1000 }),
  ]);
  const customOptions: Record<string, LeadOptionDto[]> = {};
  for (const f of fields) if (!f.isSystem && f.optionType) customOptions[f.key] = options.filter(o => o.type === f.optionType) as LeadOptionDto[];
  const of = (type: OptionType) => options.filter(o => o.type === type) as LeadOptionDto[];
  const emp: EmployeeOptionDto[] = employees.map(e => ({ id: e.id, name: e.user.name ?? "Unnamed", designation: e.designation }));
  return {
    sources: of("SOURCE"),
    requirements: of("REQUIREMENT"),
    modesOfCustomer: of("MODE_OF_CUSTOMER"),
    productOrService: of("PRODUCT_OR_SERVICE"),
    mainCategories: of("MAIN_CATEGORY"),
    categories: of("CATEGORY"),
    subcategories: of("SUBCATEGORY"),
    leadStatuses: of("LEAD_STATUS"),
    leadTypes: of("LEAD_TYPE"),
    employees: emp,
    customerNames: customers.map(c => c.customerName!).filter(Boolean),
    locations: locations.map(l => l.location!).filter(Boolean),
    fields,
    customOptions,
  };
}
