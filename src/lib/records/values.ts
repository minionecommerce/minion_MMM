// Checking, defaulting and writing the values of record fields. Pure functions shared by the server (which is the one that
// decides) and the browser (which only uses them to warn early).

import { crmTimeZone, isHttpUrl, isRealDay, normalizePhone, todayDay } from "@/lib/leads/format";
import { NOT_YET_APPROVED } from "./registry";
import type { FileDto, LayoutField, RecordRefs } from "./types";

export type Clean = { value: unknown } | { error: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATETIME = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/;
const NUMERIC = /^-?\d+(\.\d+)?$/;

// A bare field of a type, for checking something (a default value) against that type's rules
export function plainField(type: LayoutField["type"], label: string, options: LayoutField["options"] = []): LayoutField {
  return {
    key: "x", label, type, isSystem: false, section: "", required: false, requiredLocked: false, enabled: true, readOnly: false, inList: false,
    listable: false, defaultValue: null, defaultable: true, options, lookup: null, prefix: null, currency: "INR", maxFiles: 1, maxLength: null,
    integer: false, min: null, typeChoices: [],
  };
}

// Ids (cuid and the like): nothing else is ever looked up in the database
export const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
export const isId = (v: unknown): v is string => typeof v === "string" && ID_PATTERN.test(v);
// Control characters (a NUL byte breaks a database text column) are not text anybody typed on purpose
export const stripControl = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

export const isEmptyValue = (v: unknown) =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0);

export function textLimit(f: Pick<LayoutField, "type" | "maxLength">) {
  return f.maxLength ?? (f.type === "TEXTAREA" ? 5000 : 500);
}

function asNumber(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw === "string" && NUMERIC.test(raw.trim())) return Number(raw.trim());
  return null;
}

// Cleans what a form sent for one field. An empty value is `{ value: null }`; whether that is allowed (required) is the caller's call.
// Dropdown values are checked against the options; users, deals, vendors and files need the database and are checked by the server.
export function cleanValue(f: LayoutField, raw: unknown): Clean {
  if (f.type === "CHECKBOX") {
    if (raw === undefined || raw === null || raw === false) return { value: null };
    return raw === true ? { value: true } : { error: `${f.label} must be Yes or No` };
  }
  if (f.type === "FILE") {
    if (raw === undefined || raw === null) return { value: [] };
    if (!Array.isArray(raw) || !raw.every(isId)) return { error: `${f.label} has files that cannot be used` };
    if (new Set(raw).size !== raw.length) return { error: `${f.label} lists a file twice` };
    if (raw.length > f.maxFiles) return { error: `${f.label} can have at most ${f.maxFiles} file${f.maxFiles === 1 ? "" : "s"}` };
    return { value: raw };
  }
  if (isEmptyValue(raw)) return { value: null };

  switch (f.type) {
    case "TEXT":
    case "TEXTAREA": {
      if (typeof raw !== "string") return { error: `${f.label} must be text` };
      const s = raw.trim();
      if (s.includes("\u0000")) return { error: `${f.label} has characters that are not allowed` };
      const max = textLimit(f);
      if (s.length > max) return { error: `${f.label} must be ${max} characters or fewer` };
      return { value: s };
    }
    case "EMAIL": {
      const s = typeof raw === "string" ? raw.trim() : "";
      return EMAIL.test(s) && s.length <= 200 ? { value: s } : { error: `${f.label} must be a valid email address` };
    }
    case "PHONE": {
      const s = typeof raw === "string" ? normalizePhone(raw) : null;
      return s ? { value: s } : { error: `${f.label} must be a valid phone number (7–15 digits)` };
    }
    case "URL": {
      const s = typeof raw === "string" ? raw.trim() : "";
      return isHttpUrl(s) && s.length <= 2000 ? { value: s } : { error: `${f.label} must be a valid http(s) link` };
    }
    case "NUMBER": {
      const n = asNumber(raw);
      if (n === null || Math.abs(n) > 1e12) return { error: `${f.label} must be a number` };
      if (f.integer && !Number.isInteger(n)) return { error: `${f.label} must be a whole number` };
      if (!f.integer && Number(n.toFixed(6)) !== n) return { error: `${f.label} can have at most 6 decimal places` };
      if (f.min !== null && n < f.min) return { error: `${f.label} must be ${f.min} or more` };
      return { value: n };
    }
    case "CURRENCY": {
      const n = asNumber(raw);
      if (n === null || n > 9_999_999_999_999.99) return { error: `${f.label} must be an amount` };
      if (Number(n.toFixed(2)) !== n) return { error: `${f.label} can have at most 2 decimal places` };
      if (n < (f.min ?? 0)) return { error: `${f.label} cannot be less than ${f.min ?? 0}` };
      return { value: n };
    }
    case "DATE": {
      const s = typeof raw === "string" ? raw.trim() : "";
      const year = Number(s.slice(0, 4));
      return isRealDay(s) && year >= 1900 && year <= 2100 ? { value: s } : { error: `${f.label} must be a valid date` };
    }
    case "DATETIME": {
      const s = typeof raw === "string" ? raw.trim() : "";
      const m = DATETIME.exec(s);
      const year = Number(s.slice(0, 4));
      const ok = !!m && isRealDay(m[1]) && Number(m[2]) < 24 && Number(m[3]) < 60 && year >= 1900 && year <= 2100;
      return ok ? { value: s } : { error: `${f.label} must be a valid date and time` };
    }
    case "DROPDOWN": {
      const id = typeof raw === "string" ? raw : "";
      return f.options.some(o => o.id === id) ? { value: id } : { error: `${f.label} is not a valid choice` };
    }
    case "USER":
    case "LOOKUP":
    case "APPROVER": {
      return isId(raw) ? { value: raw } : { error: `${f.label} is not valid` };
    }
    default:
      return { error: `${f.label} cannot be set` };
  }
}

// ---------------------------------------------------------------------------
// Showing values
// ---------------------------------------------------------------------------
export function formatMoney(n: number, prefix: string | null) {
  const text = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  return prefix ? `${prefix} ${text}` : text;
}

export const formatNumber = (n: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 6 }).format(n);

// 2026-10-04 -> 04/10/2026
export const formatDay = (day: string) => (/^\d{4}-\d{2}-\d{2}$/.test(day) ? `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}` : day);

// 2026-10-04T18:30 -> 04/10/2026 06:30 PM
export function formatDateTimeLocal(value: string) {
  const m = DATETIME.exec(value);
  if (!m) return value;
  const hour = Number(m[2]);
  return `${formatDay(m[1])} ${String(hour % 12 || 12).padStart(2, "0")}:${m[3]} ${hour < 12 ? "AM" : "PM"}`;
}

export function userName(refs: RecordRefs, id: string) {
  return refs.users[id] ?? "";
}

export function lookupText(f: Pick<LayoutField, "lookup">, id: string, refs: RecordRefs) {
  if (f.lookup === "deal") {
    const d = refs.deals[id];
    return d ? (d.name ? `${d.code} - ${d.name}` : d.code) : "";
  }
  const v = (f.lookup === "materialVendor" ? refs.materialVendors : refs.serviceVendors)[id];
  return v ? `${v.code} - ${v.name}` : "";
}

// The text a record shows for a field (lists, the record page, the CSV file)
export function displayValue(f: LayoutField, raw: unknown, refs: RecordRefs): string {
  if (f.type === "APPROVER") return raw ? userName(refs, String(raw)) || "" : NOT_YET_APPROVED;
  if (raw === null || raw === undefined || raw === "" || (Array.isArray(raw) && raw.length === 0)) return "";
  switch (f.type) {
    case "CHECKBOX": return raw === true ? "Yes" : "No";
    case "DROPDOWN": return f.options.find(o => o.id === raw)?.label ?? "";
    case "USER": return userName(refs, String(raw));
    case "LOOKUP": return lookupText(f, String(raw), refs);
    case "CURRENCY": return typeof raw === "number" ? formatMoney(raw, f.prefix ?? f.currency) : String(raw);
    case "NUMBER": return typeof raw === "number" ? formatNumber(raw) : String(raw);
    case "DATE": return formatDay(String(raw));
    case "DATETIME": return formatDateTimeLocal(String(raw));
    case "FILE": {
      const files = raw as FileDto[];
      return files.length === 1 ? files[0].fileName : `${files.length} files`;
    }
    default: return String(raw);
  }
}

// ---------------------------------------------------------------------------
// Starting values of a new record / a new table row (the defaults set in Edit Page Layout)
// ---------------------------------------------------------------------------
export function defaultFor(f: LayoutField, me: { id: string } | null): unknown {
  const d = f.defaultValue;
  switch (f.type) {
    case "FILE": return [];
    case "AUTO": case "LOOKUP": case "APPROVER": return null;
    case "CHECKBOX": return d === "true" ? true : null;
    case "DROPDOWN": return d && f.options.some(o => o.id === d) ? d : null;
    case "USER": return d === "@me" ? me?.id ?? null : d || null;
    case "DATE": return d === "@today" ? todayDay() : d && isRealDay(d) ? d : null;
    case "DATETIME": {
      if (d === "@now") return `${todayDay()}T${new Intl.DateTimeFormat("en-GB", { timeZone: crmTimeZone(), hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()).replace(/^24/, "00")}`;
      return d && DATETIME.test(d) ? d : null;
    }
    case "NUMBER": case "CURRENCY": {
      const n = d ? asNumber(d) : null;
      return n;
    }
    default: return d || null;
  }
}

// ---------------------------------------------------------------------------
// What the list page can do with a column
// ---------------------------------------------------------------------------
const SORTABLE = new Set(["TEXT", "TEXTAREA", "EMAIL", "PHONE", "URL", "NUMBER", "CURRENCY", "DATE", "USER", "APPROVER", "LOOKUP"]);
export const isSortable = (f: LayoutField) => f.isSystem && f.listable && SORTABLE.has(f.type);
export const isFilterable = (f: LayoutField) => f.listable && (f.type === "DROPDOWN" || f.type === "USER" || f.type === "APPROVER");
