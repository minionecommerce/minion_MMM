// Calendar and clock helpers of the Attendance module. Pure functions: no database, no framework, safe in the browser.
// A calendar day is the text YYYY-MM-DD (the CRM time zone's day) and a month is YYYY-MM.
// Day arithmetic goes through UTC, so it never depends on the zone of the device or the server.

export const pad2 = (n: number) => String(n).padStart(2, "0");

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_SHORT = MONTHS.map(m => m.slice(0, 3));
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const WEEKDAYS_SHORT = WEEKDAYS.map(d => d.slice(0, 3));
export const weekdayName = (weekday: number) => WEEKDAYS[weekday] ?? "";

const at0 = (day: string) => new Date(`${day}T00:00:00Z`);
const textOf = (d: Date) => d.toISOString().slice(0, 10);

export function isMonthText(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  return year >= 2000 && year <= 2100;
}

export function addDays(day: string, n: number) {
  const d = at0(day);
  d.setUTCDate(d.getUTCDate() + n);
  return textOf(d);
}

export const weekdayOf = (day: string) => at0(day).getUTCDay();
export const monthOf = (day: string) => day.slice(0, 7);
export const firstDayOf = (month: string) => `${month}-01`;

export function lastDayOf(month: string) {
  const [y, m] = month.split("-").map(Number);
  return textOf(new Date(Date.UTC(y, m, 0)));
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
}

export function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

// The Sunday that starts the week of a day
export const weekStartOf = (day: string) => addDays(day, -weekdayOf(day));

// The days a month's calendar shows: whole Sunday-to-Saturday weeks that cover the month
export function gridDays(month: string) {
  const first = firstDayOf(month);
  const last = lastDayOf(month);
  const out: string[] = [];
  for (let d = addDays(first, -weekdayOf(first)), end = addDays(last, 6 - weekdayOf(last)); d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

// 03 Oct 2026 (Saturday)
export function formatDayLong(day: string) {
  const d = at0(day);
  return `${pad2(d.getUTCDate())} ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()} (${WEEKDAYS[d.getUTCDay()]})`;
}

// 03 Oct
export function formatDayShort(day: string) {
  const d = at0(day);
  return `${pad2(d.getUTCDate())} ${MONTHS_SHORT[d.getUTCMonth()]}`;
}

// 28 Sep – 04 Oct 2026
export function formatWeekRange(from: string, to: string) {
  return `${formatDayShort(from)} – ${formatDayShort(to)} ${to.slice(0, 4)}`;
}

// 168h 30m (the minutes always have two digits)
export function formatHm(min: number) {
  const m = Math.max(0, Math.round(min));
  return `${Math.floor(m / 60)}h ${pad2(m % 60)}m`;
}

// 09 hrs 30 mins
export function formatShift(min: number) {
  const m = Math.max(0, Math.round(min));
  return `${pad2(Math.floor(m / 60))} hrs ${pad2(m % 60)} mins`;
}

// 12 mins, 1 hr 5 mins: for "Late by ..."
export function formatShort(min: number) {
  const m = Math.max(0, Math.round(min));
  if (m < 60) return `${m} ${m === 1 ? "min" : "mins"}`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h} hr ${m % 60} ${m % 60 === 1 ? "min" : "mins"}` : `${h} hr`;
}

// 540 -> 09:00 AM
export function formatClock(minutesAfterMidnight: number) {
  const h24 = Math.floor(minutesAfterMidnight / 60) % 24;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${pad2(h12)}:${pad2(minutesAfterMidnight % 60)} ${h24 < 12 ? "AM" : "PM"}`;
}

// "09:00" -> 540; anything else -> null
export function parseClock(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

// The minutes after midnight of a moment, as the clock of that time zone shows it
export function minutesOfDay(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hourCycle: "h23", hour: "2-digit", minute: "2-digit" }).formatToParts(date);
  const h = Number(parts.find(p => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find(p => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}
