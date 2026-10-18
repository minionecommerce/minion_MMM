// My Dashboard: every number is worked out here, on the server, for the signed-in person only. Nothing is taken from the browser except the date
// filter, and nothing is calculated from another person's records.
//
// Who a record belongs to:
//   quotes     Quote.salespersonId (the quote's Task Person, a user)
//   leads      Lead.salesExecutiveId (Staff Assignment / Task Person, an employee); "New Leads" also counts the leads the person created
//   deals      the Task Person of the lead behind the deal (the Deals page shows it that way)
//   projects   Project.managerId (the Task Person of the deal when it was converted)
//   tasks      Task.assigneeId; site visits: SiteVisit.assignedTo
// Which date a metric follows (the filter): quotes - Quote Date; projects - the day the deal was converted; new leads - created; tasks completed -
// completed. Metrics that say "currently" (leads assigned, follow-up / closed leads and deals, pending tasks) and today's site visits do not follow it.
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac/effective";
import { ServiceError } from "@/lib/users/service";
import { crmTimeZone, formatTime, todayBounds, todayDay } from "@/lib/leads/format";
import { statusWhere } from "@/lib/leads/queries";
import { live } from "@/lib/deals/queries";
import { COMPLETED_STATUSES, viewClause, type TaskScope } from "@/lib/tasks/rules";
import { projectMoney } from "@/lib/projects/list";
import { dec } from "@/lib/records/split";
import { classifyDay, type DayRow } from "@/lib/attendance/calc";
import { loadSchedule } from "@/lib/attendance/settings";
import { addDays } from "@/lib/attendance/time";
import { dayRange, instantRange, resolvePeriod, toSlices, type PeriodInput } from "./period";
import type { AttendanceSummary, DashboardCard, DashboardChart, DashboardMetrics, TodayItem, TodaySection } from "./types";

const NONE = "__none__";
const SHOWN = 8; // rows of each "Today's ..." section
const MAX_ATTENDANCE_DAYS = 800;
const dayText = (d: Date) => d.toISOString().slice(0, 10);

// A quote with items, none of which is a Service (a line saved without a kind takes the kind of its catalog item): the quotes of Total Product Sales.
// One Service item takes the whole quote out.
export const PRODUCT_ONLY_QUOTE: Prisma.QuoteWhereInput = {
  lineItems: { some: {}, none: { OR: [{ kind: "Service" }, { kind: null, item: { is: { kind: "Service" } } }] } },
};

export async function getDashboardMetrics(ctx: AuthContext, input: PeriodInput): Promise<DashboardMetrics> {
  const period = resolvePeriod(input);
  const can = (module: string) => hasPermission(ctx.permissions, module, "view");
  const emp = ctx.employeeId ?? NONE;
  const instants = instantRange(period);
  const days = dayRange(period);
  const [todayStart, todayEnd] = todayBounds();
  const now = new Date();
  const cards: DashboardCard[] = [];
  const add = (card: DashboardCard) => cards.push(card);
  const charts: DashboardChart[] = [];
  const today: TodaySection[] = [];
  let attendance: AttendanceSummary | null = null;

  // ---------------- Quotes (Task Person = the quote's salesperson) ----------------
  const quoteMine: Prisma.QuoteWhereInput = { salespersonId: ctx.userId, deletedAt: null };
  const quoteInPeriod: Prisma.QuoteWhereInput = { ...quoteMine, ...(days ? { date: days } : {}) };
  const quoteJob = !can("quotes") ? null : Promise.all([
    prisma.quote.aggregate({ where: { AND: [quoteInPeriod, PRODUCT_ONLY_QUOTE] }, _sum: { amount: true } }),
    prisma.quote.groupBy({ by: ["status"], where: quoteInPeriod, _count: { _all: true } }),
  ]);

  // ---------------- Projects ----------------
  const projectWhere: Prisma.ProjectWhereInput = { deletedAt: null, projectCode: { not: null }, dealId: { not: null }, managerId: emp, ...(instants ? { convertedAt: instants } : {}) };
  const projectJob = !can("projects") ? null : prisma.project.findMany({ where: projectWhere, select: { id: true, dealId: true }, take: 5000 }).then(async rows => {
    const money = await projectMoney(rows);
    return { count: rows.length, value: Array.from(money.values()).reduce((a, m) => a + Math.round(m.value * 100), 0) / 100 };
  });

  // ---------------- Leads (Task Person = salesExecutive) ----------------
  const leadMine: Prisma.LeadWhereInput = { deletedAt: null, convertedAt: null, salesExecutiveId: emp };
  const leadJob = !can("leads") ? null : Promise.all([
    prisma.lead.count({ where: leadMine }),
    prisma.lead.count({ where: { deletedAt: null, ...(instants ? { createdAt: instants } : {}), OR: [{ salesExecutiveId: emp }, { createdById: ctx.userId }] } }),
    prisma.lead.count({ where: { AND: [leadMine, statusWhere("follow_up")!] } }),
    prisma.lead.count({ where: { AND: [leadMine, statusWhere("closed")!] } }),
  ]);
  const leadChartJob = !can("leads") ? null : Promise.all(
    (["open", "follow_up", "closed"] as const).map(s => prisma.lead.count({ where: { AND: [leadMine, statusWhere(s)!, ...(instants ? [{ createdAt: instants }] : [])] } })),
  );

  // ---------------- Deals (Task Person = the lead's salesExecutive); a deal that became a project leaves the normal views ----------------
  const dealOf = (lead: Prisma.LeadWhereInput, extra: Prisma.DealWhereInput = {}): Prisma.DealWhereInput => ({ AND: [live, { lead: { is: { salesExecutiveId: emp } } }, { lead: { is: lead } }, extra] });
  const dealJob = !can("deals") ? null : Promise.all([
    prisma.deal.count({ where: dealOf(statusWhere("follow_up")!, { projectConvertedAt: null }) }),
    prisma.deal.count({ where: dealOf(statusWhere("closed")!, { projectConvertedAt: null }) }),
    prisma.deal.count({ where: dealOf({}, { projectConvertedAt: instants ?? { not: null } }) }),
  ]);
  const dealChartJob = !can("deals") ? null : Promise.all([
    ...(["open", "follow_up", "closed"] as const).map(s => prisma.deal.count({ where: dealOf(statusWhere(s)!, { projectConvertedAt: null, ...(instants ? { createdAt: instants } : {}) }) })),
    prisma.deal.count({ where: dealOf({}, { projectConvertedAt: { not: null }, ...(instants ? { createdAt: instants } : {}) }) }),
  ]);

  // ---------------- Tasks (the person's own: Task.assigneeId) ----------------
  const taskMe: TaskScope = { all: false, me: ctx.employeeId, people: [emp] };
  const taskJob = !can("tasks") ? null : Promise.all([
    // Ongoing and Incomplete (overdue) overlap, so the two are asked as one question: a task is never counted twice
    prisma.task.count({ where: { OR: [viewClause("ongoing", taskMe, now), viewClause("incomplete", taskMe, now)] } }),
    prisma.task.count({ where: { assigneeId: emp, status: { in: COMPLETED_STATUSES }, completedAt: instants ?? { not: null } } }),
  ]);

  // ---------------- Site visits today ----------------
  const visitWhere: Prisma.SiteVisitWhereInput = { assignedTo: emp, visitDate: { gte: todayStart, lt: todayEnd }, status: { notIn: ["Cancelled"] } };
  const visitJob = !can("site_visits") ? null : Promise.all([
    prisma.siteVisit.count({ where: visitWhere }),
    prisma.siteVisit.findMany({ where: visitWhere, orderBy: { visitDate: "asc" }, take: SHOWN, select: { id: true, visitNumber: true, visitDate: true, siteLocation: true, status: true, lead: { select: { customerName: true } } } }),
  ]);

  // ---------------- Today's lists ----------------
  const leadTodayWhere: Prisma.LeadWhereInput = {
    deletedAt: null, convertedAt: null,
    OR: [
      { createdAt: { gte: todayStart, lt: todayEnd }, OR: [{ salesExecutiveId: emp }, { createdById: ctx.userId }] },
      { salesExecutiveId: emp, nextActionDate: { gte: todayStart, lt: todayEnd } },
    ],
  };
  const leadTodayJob = !can("leads") ? null : Promise.all([
    prisma.lead.count({ where: leadTodayWhere }),
    prisma.lead.findMany({ where: leadTodayWhere, orderBy: { createdAt: "desc" }, take: SHOWN, select: { id: true, leadCode: true, customerName: true, exactRequirement: true, createdAt: true, nextActionDate: true } }),
  ]);
  const dealTodayWhere: Prisma.DealWhereInput = {
    AND: [live, { projectConvertedAt: null }, { lead: { is: { salesExecutiveId: emp } } }, {
      OR: [{ createdAt: { gte: todayStart, lt: todayEnd } }, { lead: { is: { nextActionDate: { gte: todayStart, lt: todayEnd } } } }],
    }],
  };
  const dealTodayJob = !can("deals") ? null : Promise.all([
    prisma.deal.count({ where: dealTodayWhere }),
    prisma.deal.findMany({ where: dealTodayWhere, orderBy: { createdAt: "desc" }, take: SHOWN, select: { id: true, dealNumber: true, title: true, createdAt: true, lead: { select: { customerName: true, nextActionDate: true } } } }),
  ]);
  const taskTodayWhere: Prisma.TaskWhereInput = {
    assigneeId: emp, status: { notIn: COMPLETED_STATUSES },
    OR: [{ dueDate: { gte: todayStart, lt: todayEnd } }, { startDate: { gte: todayStart, lt: todayEnd } }],
  };
  const taskTodayJob = !can("tasks") ? null : Promise.all([
    prisma.task.count({ where: taskTodayWhere }),
    prisma.task.findMany({ where: taskTodayWhere, orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { id: "asc" }], take: SHOWN, select: { id: true, title: true, taskType: true, status: true, dueDate: true, startDate: true } }),
  ]);

  const attendanceJob = !can("attendance") ? null : attendanceSummary(ctx.userId, period.from, period.to);

  const [quotes, projects, leads, leadChart, deals, dealChart, tasks, visits, leadToday, dealToday, taskToday, att] = await Promise.all([
    quoteJob, projectJob, leadJob, leadChartJob, dealJob, dealChartJob, taskJob, visitJob, leadTodayJob, dealTodayJob, taskTodayJob, attendanceJob,
  ]);
  attendance = att;

  const statusCount = (s: string) => quotes?.[1].find(r => r.status === s)?._count._all ?? 0;
  const quoteTotal = quotes ? quotes[1].reduce((a, r) => a + r._count._all, 0) : 0;

  // ---- the cards, in the order they were asked for
  if (quotes) add({ key: "productSales", label: "Total Product Sales", value: dec(quotes[0]._sum.amount) ?? 0, format: "money", href: "/quotes", scope: "period" });
  if (projects) {
    add({ key: "projects", label: "Total Projects", value: projects.count, format: "number", href: "/projects", scope: "period" });
    add({ key: "projectValue", label: "Total Project Value", value: projects.value, format: "money", href: "/projects", scope: "period" });
  }
  if (quotes) {
    add({ key: "quotes", label: "Total Quotes", value: quoteTotal, format: "number", href: "/quotes", scope: "period" });
    add({ key: "acceptedQuotes", label: "Accepted Quotes", value: statusCount("Accepted"), format: "number", href: "/quotes", scope: "period" });
    add({ key: "declinedQuotes", label: "Declined Quotes", value: statusCount("Declined"), format: "number", href: "/quotes", scope: "period" });
  }
  if (leads) {
    add({ key: "leadsAssigned", label: "Lead Assigned", value: leads[0], format: "number", href: "/leads", scope: "current" });
    add({ key: "newLeads", label: "New Leads", value: leads[1], format: "number", href: "/leads", scope: "period" });
    add({ key: "followUpLeads", label: "Follow-Up Leads", value: leads[2], format: "number", href: "/leads", scope: "current" });
    add({ key: "closedLeads", label: "Closed Leads", value: leads[3], format: "number", href: "/leads", scope: "current" });
  }
  if (deals) {
    add({ key: "followUpDeals", label: "Follow-Up Deals", value: deals[0], format: "number", href: "/deals", scope: "current" });
    add({ key: "closedDeals", label: "Closed Deals", value: deals[1], format: "number", href: "/deals", scope: "current" });
    add({ key: "dealsConverted", label: "Deals Converted to Projects", value: deals[2], format: "number", href: "/deals", scope: "period" });
  }
  if (tasks) {
    add({ key: "pendingTasks", label: "Pending Tasks", value: tasks[0], format: "number", href: "/tasks", scope: "current" });
    add({ key: "completedTasks", label: "Completed Tasks", value: tasks[1], format: "number", href: "/tasks", scope: "period" });
  }
  if (visits) add({ key: "siteVisitsToday", label: "Today's Site Visits", value: visits[0], format: "number", href: "/crm", scope: "today" });

  // ---- the charts
  if (dealChart) charts.push({ key: "deal", title: "Deal Status", ...toSlices([
    { key: "open", label: "Open", count: dealChart[0] }, { key: "follow_up", label: "Follow-up", count: dealChart[1] },
    { key: "closed", label: "Closed", count: dealChart[2] }, { key: "converted", label: "Converted to Project", count: dealChart[3] },
  ]) });
  if (leadChart) charts.push({ key: "lead", title: "Lead Status", ...toSlices([
    { key: "open", label: "Open", count: leadChart[0] }, { key: "follow_up", label: "Follow-up", count: leadChart[1] }, { key: "closed", label: "Closed", count: leadChart[2] },
  ]) });
  if (quotes) charts.push({ key: "quote", title: "Quote Status", ...toSlices(
    ["Draft", "Sent", "Accepted", "Declined", "Invoiced"].map(s => ({ key: s.toLowerCase(), label: s, count: statusCount(s) })),
  ) });

  // ---- today's lists
  const tz = crmTimeZone();
  const at = (d: Date | null) => (d ? formatTime(d, tz) : "");
  if (leadToday) today.push(section("leads", "Today's Leads", leadToday[0], "/leads", leadToday[1].map<TodayItem>(l => ({
    id: l.id, title: l.customerName || l.leadCode || "Lead", sub: l.exactRequirement || l.leadCode || "",
    meta: l.nextActionDate && l.nextActionDate >= todayStart && l.nextActionDate < todayEnd ? `Follow-up ${at(l.nextActionDate)}` : `Added ${at(l.createdAt)}`,
    href: `/leads?q=${encodeURIComponent(l.leadCode ?? l.customerName ?? "")}`,
  }))));
  if (taskToday) today.push(section("tasks", "Today's Tasks", taskToday[0], "/tasks", taskToday[1].map<TodayItem>(t => ({
    id: t.id, title: t.title, sub: t.status,
    meta: t.dueDate && t.dueDate >= todayStart && t.dueDate < todayEnd ? `Due ${at(t.dueDate)}` : `Starts ${at(t.startDate)}`,
    href: `/tasks?type=${t.taskType}&view=ongoing&q=${encodeURIComponent(t.title)}`,
  }))));
  if (visits) today.push(section("siteVisits", "Today's Site Visits", visits[0], "/crm", visits[1].map<TodayItem>(v => ({
    id: v.id, title: v.lead?.customerName || v.siteLocation || v.visitNumber || "Site visit", sub: v.siteLocation ?? "", meta: `${at(v.visitDate)} · ${v.status}`, href: "/crm",
  }))));
  if (dealToday) today.push(section("deals", "Today's Deals", dealToday[0], "/deals", dealToday[1].map<TodayItem>(d => ({
    id: d.id, title: d.title, sub: d.lead.customerName ?? "",
    meta: d.lead.nextActionDate && d.lead.nextActionDate >= todayStart && d.lead.nextActionDate < todayEnd ? `Follow-up ${at(d.lead.nextActionDate)}` : `Created ${at(d.createdAt)}`,
    href: `/deals?q=${encodeURIComponent(d.dealNumber ?? d.title)}`,
  }))));

  return { userName: ctx.name?.trim() || ctx.email || "there", period, cards, charts, today, attendance, linked: ctx.employeeId !== null };
}

const section = (key: TodaySection["key"], title: string, total: number, href: string, items: TodayItem[]): TodaySection => ({ key, title, total, items, href });

// ---------------------------------------------------------------------------
// Attendance Overview: from the person's days in the Attendance module, with the same rules as its calendar (a past working day nobody marked is
// Absent once the person has started using Attendance; a weekly off is never absent; Attendance % counts working days).
// Total: from the first Check In to today.
// ---------------------------------------------------------------------------
export async function attendanceSummary(userId: string, from: string | null, to: string | null): Promise<AttendanceSummary> {
  const today = todayDay();
  const [schedule, first] = await Promise.all([
    loadSchedule(),
    prisma.attendanceDay.findFirst({ where: { userId, checkInAt: { not: null } }, orderBy: { day: "asc" }, select: { day: true } }),
  ]);
  const trackingStart = first ? dayText(first.day) : null;
  let start = from ?? trackingStart;
  const end = to && to < today ? to : today; // days after today are not marked yet
  if (!start || start > end) return { present: 0, absent: 0, pct: null, workingDays: 0, from: start, to: end };
  if (start < addDays(end, -MAX_ATTENDANCE_DAYS)) start = addDays(end, -MAX_ATTENDANCE_DAYS);
  const rows = await prisma.attendanceDay.findMany({
    where: { userId, day: { gte: new Date(`${start}T00:00:00Z`), lte: new Date(`${end}T00:00:00Z`) } },
    select: { day: true, status: true, checkInAt: true, checkOutAt: true, stdStartMin: true, stdEndMin: true },
  });
  const byDay = new Map(rows.map(r => [dayText(r.day), { day: dayText(r.day), status: r.status, checkInAt: r.checkInAt, checkOutAt: r.checkOutAt, stdStartMin: r.stdStartMin, stdEndMin: r.stdEndMin, movements: [] } satisfies DayRow]));
  let present = 0;
  let presentWorking = 0;
  let absent = 0;
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const kind = classifyDay(d, byDay.get(d) ?? null, { today, trackingStart, weeklyOff: schedule.weeklyOff });
    const off = schedule.weeklyOff.includes(new Date(`${d}T00:00:00Z`).getUTCDay());
    if (kind === "PRESENT") { present++; if (!off) presentWorking++; }
    else if (kind === "ABSENT") absent++;
  }
  const workingDays = presentWorking + absent;
  return { present, absent, pct: workingDays > 0 ? Math.round((presentWorking / workingDays) * 100) : null, workingDays, from: start, to: end };
}


// My Dashboard is for anyone who may open Home or My Work
export function needDashboard(ctx: AuthContext) {
  if (!hasPermission(ctx.permissions, "dashboard", "view") && !hasPermission(ctx.permissions, "my_work", "view")) {
    throw new ServiceError(403, "You do not have permission to view the dashboard.");
  }
}
