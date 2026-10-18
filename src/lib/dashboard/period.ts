// The date filter of My Dashboard: Total, Today, Monthly, or a custom Start Date / Due Date. Pure functions (no database), so the page, the API and the
// tests use the same rules. A day is the text YYYY-MM-DD in the CRM time zone.
import { todayBounds, todayDay } from "@/lib/leads/format";
import { addDays, firstDayOf, isMonthText, lastDayOf, monthLabel, monthOf } from "@/lib/attendance/time";

export const PERIOD_MODES = ["total", "today", "monthly"] as const;
export type PeriodMode = (typeof PERIOD_MODES)[number];

export type PeriodInput = { mode?: string | null; from?: string | null; to?: string | null; month?: string | null };
// mode "custom": the user picked a Start Date and / or a Due Date, which beat the three buttons
export type Period = { mode: PeriodMode | "custom"; from: string | null; to: string | null; month: string | null; label: string };

export const DEFAULT_MODE: PeriodMode = "today";

const isDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const dayLabel = (day: string) => `${Number(day.slice(8))} ${MONTHS_SHORT[Number(day.slice(5, 7)) - 1]} ${day.slice(0, 4)}`;

export function resolvePeriod(input: PeriodInput, today: string = todayDay()): Period {
  let from = isDay(input.from) ? input.from : null;
  let to = isDay(input.to) ? input.to : null;
  if (from || to) {
    if (from && to && from > to) [from, to] = [to, from];
    const label = from && to ? (from === to ? dayLabel(from) : `${dayLabel(from)} – ${dayLabel(to)}`) : from ? `From ${dayLabel(from)}` : `Until ${dayLabel(to!)}`;
    return { mode: "custom", from, to, month: null, label };
  }
  const mode = (PERIOD_MODES as readonly string[]).includes(input.mode ?? "") ? (input.mode as PeriodMode) : DEFAULT_MODE;
  if (mode === "total") return { mode, from: null, to: null, month: null, label: "All time" };
  if (mode === "monthly") {
    const month = isMonthText(input.month) ? input.month : monthOf(today);
    return { mode, from: firstDayOf(month), to: lastDayOf(month), month, label: monthLabel(month) };
  }
  return { mode: "today", from: today, to: today, month: null, label: `Today, ${dayLabel(today)}` };
}

// Whole days in the CRM time zone as instants, for a timestamp column (createdAt, completedAt ...): [gte, lt)
export function instantRange(p: Pick<Period, "from" | "to">): { gte?: Date; lt?: Date } | null {
  if (!p.from && !p.to) return null;
  return {
    ...(p.from ? { gte: todayBounds(new Date(`${p.from}T12:00:00Z`))[0] } : {}),
    ...(p.to ? { lt: todayBounds(new Date(`${p.to}T12:00:00Z`))[1] } : {}),
  };
}

// The same days for a column that stores a calendar day as midnight UTC (Quote date, the DATE columns): [gte, lt)
export function dayRange(p: Pick<Period, "from" | "to">): { gte?: Date; lt?: Date } | null {
  if (!p.from && !p.to) return null;
  return {
    ...(p.from ? { gte: new Date(`${p.from}T00:00:00.000Z`) } : {}),
    ...(p.to ? { lt: new Date(`${addDays(p.to, 1)}T00:00:00.000Z`) } : {}),
  };
}

// ---------------------------------------------------------------------------
// Status charts: slices with a count and a percentage; the percentages always add up to 100 (largest remainder)
// ---------------------------------------------------------------------------
export type Slice = { key: string; label: string; count: number; pct: number };

export function toSlices(items: { key: string; label: string; count: number }[]): { total: number; slices: Slice[] } {
  const total = items.reduce((a, i) => a + i.count, 0);
  if (total === 0) return { total: 0, slices: items.map(i => ({ ...i, pct: 0 })) };
  const raw = items.map(i => (i.count / total) * 100);
  const floor = raw.map(Math.floor);
  let left = 100 - floor.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, rem: r - floor[i] })).sort((a, b) => b.rem - a.rem);
  for (const o of order) { if (left <= 0) break; if (items[o.i].count > 0) { floor[o.i]++; left--; } }
  return { total, slices: items.map((i, n) => ({ ...i, pct: floor[n] })) };
}
