// The rules of the Attendance module as pure functions (no database, no framework):
// which action may come next, how a day is classified, shift / overtime / late / early minutes, the month summary and the calendar rows.
// The server feeds them rows from the database; nothing here reads a clock, so every rule can be tested with made-up rows.

import { firstDayOf, formatClock, gridDays, lastDayOf, minutesOfDay, monthLabel, monthOf, parseClock, weekdayOf } from "./time";
import type {
  AttendanceAction,
  DayDetail,
  DayKind,
  DayStatus,
  GridDay,
  HistoryItem,
  HoursSummary,
  MovementType,
  Overview,
  Schedule,
  ScheduleView,
  SiteVisitCodeOption,
  Summary,
  Whereabouts,
} from "./types";

export type MovementRow = { seq: number; type: string; at: Date; purposeKind: string | null; siteVisitCode: string | null; detail: string | null };
export type DayRow = {
  day: string; // YYYY-MM-DD
  status: string;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  stdStartMin: number | null; // the office hours that were in force when the day was started
  stdEndMin: number | null;
  movements: MovementRow[];
};

const bySeq = (a: MovementRow, b: MovementRow) => a.seq - b.seq;

// ---------------------------------------------------------------------------
// The office hours setting (stored as JSON: {"start":"09:00","end":"18:30","weeklyOff":[0]})
// ---------------------------------------------------------------------------
export const DEFAULT_SCHEDULE: Schedule = { startMin: 9 * 60, endMin: 18 * 60 + 30, weeklyOff: [0] };

// null when the stored value is not usable (the caller then uses the default)
export function parseSchedule(value: unknown): Schedule | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const startMin = parseClock(v.start);
  const endMin = parseClock(v.end);
  if (startMin === null || endMin === null || endMin <= startMin) return null;
  const off = v.weeklyOff;
  if (!Array.isArray(off) || off.some(d => !Number.isInteger(d) || d < 0 || d > 6)) return null;
  return { startMin, endMin, weeklyOff: [...new Set(off as number[])].sort() };
}

export function scheduleView(s: Schedule): ScheduleView {
  return { startLabel: formatClock(s.startMin), endLabel: formatClock(s.endMin), dailyMin: s.endMin - s.startMin, weeklyOff: s.weeklyOff };
}

// ---------------------------------------------------------------------------
// The flow of a day:  Check In -> Office Out -> Site In -> Site Out -> (Site In -> Site Out ...) -> Office In -> Check Out
// Office Out and Office In can repeat; Check Out is allowed from anywhere after Check In (also at a site or on the way).
// ---------------------------------------------------------------------------
export function whereabouts(row: DayRow | null): Whereabouts {
  if (!row || !row.checkInAt) return "NOT_STARTED";
  if (row.checkOutAt) return "DONE";
  const last = [...row.movements].sort(bySeq).pop();
  if (!last) return "OFFICE";
  if (last.type === "SITE_IN") return "SITE";
  if (last.type === "OFFICE_OUT" || last.type === "SITE_OUT") return "OUT";
  return "OFFICE";
}

const NEXT: Record<Whereabouts, AttendanceAction[]> = {
  NOT_STARTED: ["CHECK_IN"],
  OFFICE: ["OFFICE_OUT", "CHECK_OUT"],
  OUT: ["SITE_IN", "OFFICE_IN", "CHECK_OUT"],
  SITE: ["SITE_OUT", "CHECK_OUT"],
  DONE: [],
};

export function allowedActions(row: DayRow | null): AttendanceAction[] {
  if (row && !row.checkInAt && row.status !== "PRESENT") return []; // the day is marked as leave or absent
  return NEXT[whereabouts(row)];
}

// Why an action is not allowed right now (null when it is)
export function refusal(row: DayRow | null, action: AttendanceAction): string | null {
  if (allowedActions(row).includes(action)) return null;
  if (row && !row.checkInAt && row.status !== "PRESENT") return `Today is marked as ${row.status === "LEAVE" ? "leave" : "absent"}.`;
  const w = whereabouts(row);
  if (action === "CHECK_IN") return "You have already checked in today.";
  if (w === "NOT_STARTED") return "Check In first.";
  if (w === "DONE") return "You have already checked out today.";
  switch (action) {
    case "OFFICE_OUT":
      return w === "OUT" ? "You are already out of the office." : "You are at a site. Mark Site Out first.";
    case "OFFICE_IN":
      return w === "OFFICE" ? "You are already in the office." : "You are at a site. Mark Site Out first.";
    case "SITE_IN":
      return w === "SITE" ? "You are already at a site. Mark Site Out first." : "Mark Office Out before Site In.";
    case "SITE_OUT":
      return "You are not at a site.";
    default:
      return "That action is not available now.";
  }
}

// The moment of the latest thing recorded on a day (a new entry is never stamped earlier than this)
export function latestEventAt(row: DayRow): Date | null {
  let latest: Date | null = row.checkInAt;
  for (const m of row.movements) if (!latest || m.at > latest) latest = m.at;
  if (row.checkOutAt && (!latest || row.checkOutAt > latest)) latest = row.checkOutAt;
  return latest;
}

// ---------------------------------------------------------------------------
// How a day shows in the calendar
// ---------------------------------------------------------------------------
// A past working day with nothing recorded is Absent, but only once the person has started using Attendance
// (the day of their first Check In): the days before that were never tracked, so they stay Not Marked.
// Today (before Check In) and the future are Not Marked. A weekly off is never absent.
export function classifyDay(day: string, row: DayRow | null, o: { today: string; trackingStart: string | null; weeklyOff: number[] }): DayKind {
  if (row) {
    if (row.status === "LEAVE") return "LEAVE";
    if (row.status === "ABSENT") return "ABSENT";
    if (row.checkInAt) return "PRESENT";
  }
  if (o.weeklyOff.includes(weekdayOf(day))) return "WEEKLY_OFF";
  if (day < o.today && o.trackingStart !== null && day >= o.trackingStart) return "ABSENT";
  return "NOT_MARKED";
}

// ---------------------------------------------------------------------------
// Minutes of a day. Worked = Check Out minus Check In (a day without Check Out has no worked time yet).
// Overtime = worked minus the office hours of the day (all of it on a weekly off). Office = worked minus the time out of the office
// (from each Office Out to the next Office In, or to Check Out).
// ---------------------------------------------------------------------------
export type DayStats = { workedMin: number; overtimeMin: number; officeMin: number; outMin: number; lateMin: number; earlyMin: number; expectedMin: number };

export function dayStats(row: DayRow, schedule: Schedule, timeZone: string): DayStats {
  const start = row.stdStartMin ?? schedule.startMin;
  const end = row.stdEndMin ?? schedule.endMin;
  const off = schedule.weeklyOff.includes(weekdayOf(row.day));
  const expectedMin = off ? 0 : Math.max(0, end - start);
  const none: DayStats = { workedMin: 0, overtimeMin: 0, officeMin: 0, outMin: 0, lateMin: 0, earlyMin: 0, expectedMin };
  if (!row.checkInAt) return none;

  const lateMin = off ? 0 : Math.max(0, minutesOfDay(row.checkInAt, timeZone) - start);
  if (!row.checkOutAt) return { ...none, lateMin };

  const workedMin = Math.max(0, Math.floor((row.checkOutAt.getTime() - row.checkInAt.getTime()) / 60000));
  const earlyMin = off ? 0 : Math.max(0, end - minutesOfDay(row.checkOutAt, timeZone));

  let outMs = 0;
  let since: number | null = null;
  for (const m of [...row.movements].sort(bySeq)) {
    if (m.type === "OFFICE_OUT" && since === null) since = m.at.getTime();
    else if (m.type === "OFFICE_IN" && since !== null) {
      outMs += m.at.getTime() - since;
      since = null;
    }
  }
  if (since !== null) outMs += row.checkOutAt.getTime() - since;
  const outMin = Math.min(workedMin, Math.max(0, Math.floor(outMs / 60000)));

  return { workedMin, overtimeMin: Math.max(0, workedMin - expectedMin), officeMin: workedMin - outMin, outMin, lateMin, earlyMin, expectedMin };
}

// ---------------------------------------------------------------------------
// The movement history of a day: Check In, every movement, Check Out.
// A pair is numbered (Site In 1, Site Out 1, Site In 2 ...) once the day has more than one of it.
// ---------------------------------------------------------------------------
const LABELS: Record<MovementType, string> = { OFFICE_OUT: "Office Out", OFFICE_IN: "Office In", SITE_IN: "Site In", SITE_OUT: "Site Out" };

export function historyOf(row: DayRow, fmtTime: (d: Date) => string): HistoryItem[] {
  const moves = [...row.movements].sort(bySeq);
  const total = (t: MovementType) => moves.filter(m => m.type === t).length;
  const numbered = {
    OFFICE: total("OFFICE_OUT") > 1 || total("OFFICE_IN") > 1,
    SITE: total("SITE_IN") > 1 || total("SITE_OUT") > 1,
  };
  const seen: Record<string, number> = {};
  const items: HistoryItem[] = [];

  if (row.checkInAt) items.push({ key: "in", type: "CHECK_IN", label: "Check In", time: fmtTime(row.checkInAt), at: row.checkInAt.toISOString(), detail: null });
  for (const m of moves) {
    const type = m.type as MovementType;
    if (!(type in LABELS)) continue;
    seen[type] = (seen[type] ?? 0) + 1;
    const group = type.startsWith("OFFICE") ? "OFFICE" : "SITE";
    items.push({
      key: `m${m.seq}`,
      type,
      label: numbered[group] ? `${LABELS[type]} ${seen[type]}` : LABELS[type],
      time: fmtTime(m.at),
      at: m.at.toISOString(),
      detail: m.detail ? (m.purposeKind === "OTHER" ? `Other - ${m.detail}` : m.detail) : null,
    });
  }
  if (row.checkOutAt) items.push({ key: "out", type: "CHECK_OUT", label: "Check Out", time: fmtTime(row.checkOutAt), at: row.checkOutAt.toISOString(), detail: null });
  return items;
}

function detailOf(row: DayRow, schedule: Schedule, timeZone: string, today: string, fmtTime: (d: Date) => string): DayDetail {
  const stats = dayStats(row, schedule, timeZone);
  const off = schedule.weeklyOff.includes(weekdayOf(row.day));
  return {
    status: (row.status === "LEAVE" || row.status === "ABSENT" ? row.status : "PRESENT") as DayStatus,
    checkIn: row.checkInAt ? fmtTime(row.checkInAt) : null,
    checkInAt: row.checkInAt ? row.checkInAt.toISOString() : null,
    checkOut: row.checkOutAt ? fmtTime(row.checkOutAt) : null,
    checkOutAt: row.checkOutAt ? row.checkOutAt.toISOString() : null,
    shiftMin: row.checkInAt && row.checkOutAt ? stats.workedMin : null,
    expectedStart: formatClock(row.stdStartMin ?? schedule.startMin),
    expectedEnd: formatClock(row.stdEndMin ?? schedule.endMin),
    expectedMin: stats.expectedMin,
    lateMin: stats.lateMin,
    earlyMin: stats.earlyMin,
    overtimeMin: stats.overtimeMin,
    missingCheckOut: !!row.checkInAt && !row.checkOutAt && row.day < today,
    workedOnWeeklyOff: off && !!row.checkInAt,
    history: historyOf(row, fmtTime),
  };
}

// ---------------------------------------------------------------------------
// The whole page for a month
// ---------------------------------------------------------------------------
export type OverviewInput = {
  month: string; // YYYY-MM
  today: string; // the day in the CRM time zone
  timeZone: string;
  schedule: Schedule;
  rows: DayRow[]; // the person's days inside the calendar's range
  todayRow: DayRow | null;
  trackingStart: string | null;
  codes: SiteVisitCodeOption[];
  fmtTime: (d: Date) => string;
};

export function buildOverview(input: OverviewInput): Overview {
  const { month, today, timeZone, schedule, trackingStart, fmtTime } = input;
  const byDay = new Map(input.rows.map(r => [r.day, r]));

  const grid: GridDay[] = gridDays(month).map(day => {
    const row = byDay.get(day) ?? null;
    const stats = row ? dayStats(row, schedule, timeZone) : null;
    return {
      day,
      weekday: weekdayOf(day),
      inMonth: monthOf(day) === month,
      kind: classifyDay(day, row, { today, trackingStart, weeklyOff: schedule.weeklyOff }),
      workedMin: stats?.workedMin ?? 0,
      overtimeMin: stats?.overtimeMin ?? 0,
      officeMin: stats?.officeMin ?? 0,
      detail: row ? detailOf(row, schedule, timeZone, today, fmtTime) : null,
    };
  });

  const inMonth = grid.filter(g => g.inMonth);
  const isOff = (g: GridDay) => schedule.weeklyOff.includes(g.weekday);
  const count = (k: DayKind) => inMonth.filter(g => g.kind === k).length;

  // Attendance % counts working days only (a Sunday worked is Present but does not lift the percentage)
  const presentWorking = inMonth.filter(g => g.kind === "PRESENT" && !isOff(g)).length;
  const absent = count("ABSENT");
  const summary: Summary = {
    present: count("PRESENT"),
    absent,
    leave: count("LEAVE"),
    notMarked: count("NOT_MARKED"),
    weeklyOff: count("WEEKLY_OFF"),
    attendancePct: presentWorking + absent > 0 ? Math.round((presentWorking / (presentWorking + absent)) * 100) : null,
  };

  let totalMin = 0;
  let overtimeMin = 0;
  let officeMin = 0;
  let daysWorked = 0;
  let overtimeDays = 0;
  for (const g of inMonth) {
    totalMin += g.workedMin;
    overtimeMin += g.overtimeMin;
    officeMin += g.officeMin;
    if (g.workedMin > 0) daysWorked++;
    if (g.overtimeMin > 0) overtimeDays++;
  }
  const workingDays = inMonth.filter(g => !isOff(g) && g.kind !== "LEAVE").length;
  const hours: HoursSummary = {
    totalMin,
    overtimeMin,
    officeMin,
    outMin: totalMin - officeMin,
    avgMin: daysWorked ? Math.round(totalMin / daysWorked) : 0,
    daysWorked,
    overtimeDays,
    expectedMin: workingDays * Math.max(0, schedule.endMin - schedule.startMin),
  };

  const first = firstDayOf(month);
  const last = lastDayOf(month);
  const todayInMonth = today >= first && today <= last;

  return {
    today,
    month,
    monthLabel: monthLabel(month),
    defaultDay: todayInMonth ? today : first,
    schedule: scheduleView(schedule),
    grid,
    summary,
    hours,
    me: { whereabouts: whereabouts(input.todayRow), allowed: allowedActions(input.todayRow) },
    codes: input.codes,
  };
}
