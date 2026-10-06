// Quote numbers: QT/MSHS/26-27/A/723. The format is a pattern a Super Admin edits in Quote Settings, not code:
//   {FY}   the financial year of the quote date, written as the FY format says (26-27)
//   {SEQ}  the running number (723)           {YYYY} {YY} {MM}  the year / month of the quote date
// A number series is the pattern worked out for a date WITHOUT its running number (QT/MSHS/26-27/A/). Every series counts on its own,
// so a new financial year starts a new series by itself. Pure functions, shared by the server and the browser.

import type { FyFormat, NumberingSettings } from "./types";

const TOKEN = /\{([A-Za-z]+)\}/g;
const TOKENS = new Set(["FY", "SEQ", "YYYY", "YY", "MM"]);
const ALLOWED = /^[A-Za-z0-9/\-_. {}]+$/;

// null = fine, otherwise what is wrong with the pattern
export function validatePattern(pattern: string): string | null {
  const p = pattern.trim();
  if (!p) return "Enter the quote number format.";
  if (p.length > 60) return "The quote number format can be 60 characters long at most.";
  if (!ALLOWED.test(p)) return "Use letters, digits, spaces and / - _ . only, plus the tokens {FY}, {SEQ}, {YYYY}, {YY} and {MM}.";
  let seq = 0;
  for (const m of p.matchAll(TOKEN)) {
    if (!TOKENS.has(m[1])) return `{${m[1]}} is not a token. Use {FY}, {SEQ}, {YYYY}, {YY} or {MM}.`;
    if (m[1] === "SEQ") seq++;
  }
  if (p.replace(TOKEN, "").includes("{") || p.replace(TOKEN, "").includes("}")) return "A { or } is not closed: write tokens as {FY} or {SEQ}.";
  if (seq !== 1) return "The format needs {SEQ} exactly once: it is the running number.";
  return null;
}

// The financial year a day (YYYY-MM-DD) is in
export function fyOf(day: string, startMonth: number): { start: number; end: number } {
  const year = Number(day.slice(0, 4));
  const month = Number(day.slice(5, 7));
  const start = month >= startMonth ? year : year - 1;
  return { start, end: startMonth === 1 ? start : start + 1 };
}

export function formatFy(start: number, end: number, format: FyFormat): string {
  const yy = (y: number) => String(((y % 100) + 100) % 100).padStart(2, "0");
  if (start === end) return format === "YY" || format === "YY-YY" ? yy(start) : String(start); // a calendar year has no second year
  switch (format) {
    case "YYYY-YY": return `${start}-${yy(end)}`;
    case "YYYY-YYYY": return `${start}-${end}`;
    case "YY": return yy(start);
    case "YYYY": return String(start);
    default: return `${yy(start)}-${yy(end)}`;
  }
}

export const padSeq = (seq: number, padding: number): string => String(seq).padStart(Math.max(0, Math.min(12, padding)), "0");

// The pattern worked out for a day: `seq` is the text for {SEQ} ("" for the series), `fy` overrides {FY}
function expand(n: NumberingSettings, day: string, seq: string, fy?: string): string {
  const { start, end } = fyOf(day, n.fyStartMonth);
  const fyText = fy ?? formatFy(start, end, n.fyFormat);
  return n.pattern.trim().replace(TOKEN, (_, token: string) => {
    switch (token) {
      case "FY": return fyText;
      case "SEQ": return seq;
      case "YYYY": return day.slice(0, 4);
      case "YY": return day.slice(2, 4);
      case "MM": return day.slice(5, 7);
      default: return "";
    }
  });
}

// The series of a day, and the key of its counter. Without "start a new series every financial year" the counter ignores the year.
export function seriesOf(n: NumberingSettings, day: string): { series: string; key: string } {
  const series = expand(n, day, "");
  return { series, key: `quote:${n.resetEachFy ? series : expand(n, day, "", "")}` };
}

export function renderNumber(n: NumberingSettings, day: string, seq: number): string {
  return expand(n, day, padSeq(seq, n.padding));
}
