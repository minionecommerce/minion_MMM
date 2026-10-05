// Pure helpers shared by server and browser.

// Accepts "09445350717", "+91 98765-43210", "(044) 2345 6789". Returns digits with optional leading "+".
export function normalizePhone(raw: string): string | null {
  const value = raw.trim();
  if (!/^\+?[\d\s\-().]+$/.test(value)) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  return (value.startsWith("+") ? "+" : "") + digits;
}

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const TZ_FALLBACK = "Asia/Kolkata";

export function crmTimeZone() {
  return process.env.CRM_TIMEZONE || TZ_FALLBACK;
}

// 12/02/2026
export function formatDate(date: Date, timeZone = crmTimeZone()) {
  return new Intl.DateTimeFormat("en-GB", { timeZone, day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

// 12-02-2026 (the Deals page writes dates with dashes)
export function formatDashDate(date: Date, timeZone = crmTimeZone()) {
  return formatDate(date, timeZone).replace(/\//g, "-");
}

// 04-10-2026, 06:30 PM: when a deal was created, or a lead
export function formatDealStamp(date: Date, timeZone = crmTimeZone()) {
  return `${formatDashDate(date, timeZone)}, ${formatTime(date, timeZone)}`;
}

// A deal's Closing Date (its validity) is a calendar day stored at midnight UTC, so it is written in UTC, not in the CRM time zone
export function formatDealValidity(date: Date) {
  return formatDashDate(date, "UTC");
}

// 10:07 AM (newer ICU versions insert a narrow no-break space before AM/PM)
export function formatTime(date: Date, timeZone = crmTimeZone()) {
  return new Intl.DateTimeFormat("en-US", { timeZone, hour: "2-digit", minute: "2-digit", hour12: true })
    .format(date)
    .replace(/[  ]/g, " ");
}

export function formatRupees(value: number | null | undefined) {
  const n = Number(value ?? 0);
  return "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);
}

// Today as a calendar day in the CRM time zone: 2026-10-04
export function todayDay(now = new Date(), timeZone = crmTimeZone()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

// The Closing Date the Convert popup starts with: two weeks from today, moved to the Monday when that day is a Sunday
export function defaultClosingDay(today = todayDay()) {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 14);
  if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

// True only for a real calendar day written as YYYY-MM-DD ("2026-02-31" is not one)
export function isRealDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

// How far the time zone is ahead of UTC at a given instant, in minutes
function offsetMinutes(instant: Date, timeZone: string) {
  const local = new Intl.DateTimeFormat("en-US", { timeZone, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
    .formatToParts(instant)
    .reduce<Record<string, number>>((acc, p) => (p.type !== "literal" ? { ...acc, [p.type]: Number(p.value) } : acc), {});
  const asUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour === 24 ? 0 : local.hour, local.minute, local.second);
  return Math.round((asUtc - instant.getTime()) / 60000);
}

// [start, end) of "today" in the CRM time zone, as UTC instants
export function todayBounds(now = new Date(), timeZone = crmTimeZone()): [Date, Date] {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now).split("-").map(Number);
  const [y, m, d] = parts;
  const guess = new Date(Date.UTC(y, m - 1, d));
  const start = new Date(guess.getTime() - offsetMinutes(guess, timeZone) * 60000);
  return [start, new Date(start.getTime() + 24 * 60 * 60 * 1000)];
}

// "2026-10-03" + "18:00" typed in the CRM time zone -> the real instant
export function zonedDateTime(date: string, time: string, timeZone = crmTimeZone()): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm));
  return new Date(guess.getTime() - offsetMinutes(guess, timeZone) * 60000);
}
