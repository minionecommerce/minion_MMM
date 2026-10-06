// Attendance for the signed-in person: the month's overview and the six actions (Check In, Check Out, Office Out, Office In, Site In, Site Out).
// Everything is about the caller's own days: the person is always ctx.userId, never a parameter.

import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac/effective";
import type { Action } from "@/lib/rbac/catalog";
import { ServiceError } from "@/lib/users/service";
import { crmTimeZone, formatTime, todayDay } from "@/lib/leads/format";
import { buildOverview, latestEventAt, refusal, type DayRow } from "./calc";
import { listSiteVisitCodes } from "./codes";
import { loadSchedule } from "./settings";
import { gridDays, isMonthText, monthOf } from "./time";
import { MAX_PURPOSE_TEXT, type ActionBody, type Overview, type Purpose } from "./types";

export function needAttendance(ctx: AuthContext, action: Action) {
  if (!hasPermission(ctx.permissions, "attendance", action)) throw new ServiceError(403, `You do not have permission to ${action === "view" ? "view" : "mark"} attendance.`);
}

const withMovements = { movements: { orderBy: { seq: "asc" as const } } };
type DbDay = Prisma.AttendanceDayGetPayload<{ include: typeof withMovements }>;

const dayDate = (day: string) => new Date(`${day}T00:00:00Z`);
const dayText = (d: Date) => d.toISOString().slice(0, 10);

function toRow(r: DbDay): DayRow {
  return {
    day: dayText(r.day),
    status: r.status,
    checkInAt: r.checkInAt,
    checkOutAt: r.checkOutAt,
    stdStartMin: r.stdStartMin,
    stdEndMin: r.stdEndMin,
    movements: r.movements.map(m => ({ seq: m.seq, type: m.type, at: m.at, purposeKind: m.purposeKind, siteVisitCode: m.siteVisitCode, detail: m.detail })),
  };
}

async function loadDay(userId: string, day: string): Promise<DayRow | null> {
  const r = await prisma.attendanceDay.findUnique({ where: { userId_day: { userId, day: dayDate(day) } }, include: withMovements });
  return r ? toRow(r) : null;
}

// The page for one month (the current month when none is given): calendar days, summary, hours, and what may be pressed today
export async function getOverview(ctx: AuthContext, params: { month?: string | null } = {}): Promise<Overview> {
  needAttendance(ctx, "view");
  const timeZone = crmTimeZone();
  const today = todayDay(new Date(), timeZone);
  const month = params.month || monthOf(today);
  if (!isMonthText(month)) throw new ServiceError(400, "Choose a month like 2026-10.");

  const days = gridDays(month);
  const from = days[0];
  const to = days[days.length - 1];
  const [schedule, found, firstCheckIn] = await Promise.all([
    loadSchedule(),
    prisma.attendanceDay.findMany({ where: { userId: ctx.userId, day: { gte: dayDate(from), lte: dayDate(to) } }, include: withMovements }),
    prisma.attendanceDay.findFirst({ where: { userId: ctx.userId, checkInAt: { not: null } }, orderBy: { day: "asc" }, select: { day: true } }),
  ]);
  const rows = found.map(toRow);
  const todayRow = today >= from && today <= to ? rows.find(r => r.day === today) ?? null : await loadDay(ctx.userId, today);

  return buildOverview({
    month,
    today,
    timeZone,
    schedule,
    rows,
    todayRow,
    trackingStart: firstCheckIn ? dayText(firstCheckIn.day) : null,
    codes: listSiteVisitCodes(),
    fmtTime: d => formatTime(d, timeZone),
  });
}

// The option chosen in the Office Out / Site In popup, checked and turned into what is stored
function resolvePurpose(purpose: Purpose) {
  if (purpose.kind === "CODE") {
    const code = listSiteVisitCodes().find(c => c.code === purpose.code);
    if (!code) throw new ServiceError(400, "Choose a Site Visit Code from the list.");
    return { purposeKind: "CODE", siteVisitCode: code.code, detail: code.label };
  }
  const text = purpose.text.replace(/\s+/g, " ").trim();
  if (!text) throw new ServiceError(400, "Enter the purpose or location.");
  return { purposeKind: "OTHER", siteVisitCode: null as string | null, detail: text.slice(0, MAX_PURPOSE_TEXT) };
}

// One action for today (the CRM time zone's day). The time recorded is the server's clock, never a time sent by the browser.
// The day's row is locked while the action is checked and written, so a double click or a second tab cannot record it twice or out of order.
export async function performAction(ctx: AuthContext, body: ActionBody): Promise<Overview> {
  needAttendance(ctx, "create");
  const purpose = "purpose" in body ? resolvePurpose(body.purpose) : null;
  const timeZone = crmTimeZone();
  const now = new Date();
  const today = todayDay(now, timeZone);
  const schedule = await loadSchedule();

  await prisma.$transaction(async tx => {
    if (body.action === "CHECK_IN") {
      // Starting the day: the row is created if it is not there yet (two taps at once still make one row)
      await tx.$executeRaw`INSERT INTO "AttendanceDay" ("id", "userId", "day", "status", "stdStartMin", "stdEndMin", "createdAt", "updatedAt")
        VALUES (${randomUUID()}, ${ctx.userId}, ${today}::date, 'PRESENT', ${schedule.startMin}, ${schedule.endMin}, now() AT TIME ZONE 'UTC', now() AT TIME ZONE 'UTC')
        ON CONFLICT ("userId", "day") DO NOTHING`;
    }
    const locked = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "AttendanceDay" WHERE "userId" = ${ctx.userId} AND "day" = ${today}::date FOR UPDATE`;
    const dayId = locked[0]?.id;
    if (!dayId) throw new ServiceError(409, refusal(null, body.action) ?? "Check In first.");

    const current = await tx.attendanceDay.findUniqueOrThrow({ where: { id: dayId }, include: withMovements });
    const row = toRow(current);
    const why = refusal(row, body.action);
    if (why) throw new ServiceError(409, why);

    // Never earlier than what is already recorded (servers' clocks can differ by a moment)
    const latest = latestEventAt(row);
    const at = new Date(Math.max(now.getTime(), latest ? latest.getTime() : 0));

    if (body.action === "CHECK_IN") {
      await tx.attendanceDay.update({ where: { id: dayId }, data: { checkInAt: at, stdStartMin: current.stdStartMin ?? schedule.startMin, stdEndMin: current.stdEndMin ?? schedule.endMin } });
    } else if (body.action === "CHECK_OUT") {
      await tx.attendanceDay.update({ where: { id: dayId }, data: { checkOutAt: at } });
    } else {
      const seq = (row.movements.length ? Math.max(...row.movements.map(m => m.seq)) : 0) + 1;
      await tx.attendanceMovement.create({
        data: {
          dayId,
          seq,
          type: body.action,
          at,
          purposeKind: purpose?.purposeKind ?? null,
          siteVisitCode: purpose?.siteVisitCode ?? null,
          detail: purpose?.detail ?? null,
        },
      });
    }
  });

  return getOverview(ctx, { month: monthOf(today) });
}
