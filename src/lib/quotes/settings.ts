// Quote Settings: numbering, taxes, TDS / TCS, rounding, how amounts are shown, company details and messages. One JSON row per group
// in QuoteSetting. Reading never fails (a group that is missing or broken falls back to its defaults); saving checks everything and only
// a Super Admin may save.

import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { ServiceError } from "@/lib/users/service";
import { assertSuperAdmin } from "@/lib/users/layout";
import { isId, stripControl } from "@/lib/records/values";
import {
  DEFAULT_COMPANY, DEFAULT_DISPLAY, DEFAULT_DOCUMENT, DEFAULT_HEADER, DEFAULT_NUMBERING, DEFAULT_SETTINGS, DEFAULT_TAXES, DEFAULT_TCS, DEFAULT_TDS, DEFAULT_TEMPLATES, SETTING_GROUPS,
  type SettingGroup,
} from "./defaults";
import { validatePattern } from "./numbering";
import {
  FY_FORMATS, HEADER_KEYS, HEADER_NAMES, ROUNDING_MODES,
  type CompanySettings, type DisplaySettings, type DocumentSettings, type FyFormat, type HeaderKey, type HeaderRow, type NumberingSettings, type QuoteSettings, type RoundingMode, type TaxDef, type TemplateSettings, type WithholdingDef,
} from "./types";

type Db = Prisma.TransactionClient | typeof prisma;
const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const bad = (message: string): never => { throw new ServiceError(400, message); };
const tidy = (v: unknown, max: number, what: string, required = false): string => {
  if (v === undefined || v === null) v = "";
  if (typeof v !== "string") bad(`${what} must be text.`);
  const s = stripControl(v as string).replace(/[ \t]+/g, " ").trim();
  if (required && !s) bad(`${what} is required.`);
  if (s.length > max) bad(`${what} can be ${max} characters long at most.`);
  return s;
};
// Several lines of text: line breaks are kept
const tidyLines = (v: unknown, max: number, what: string): string => {
  if (v === undefined || v === null) return "";
  if (typeof v !== "string") bad(`${what} must be text.`);
  const s = stripControl((v as string).replace(/\r\n?/g, "\n")).split("\n").map(l => l.replace(/[ \t]+/g, " ").trim()).join("\n").trim();
  if (s.length > max) bad(`${what} can be ${max} characters long at most.`);
  return s;
};
const intIn = (v: unknown, min: number, max: number, what: string): number => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  if (!Number.isInteger(n) || n < min || n > max) bad(`${what} must be a whole number from ${min} to ${max}.`);
  return n;
};
const rateIn = (v: unknown, what: string): number => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  if (!Number.isFinite(n) || n < 0 || n > 100) bad(`${what} must be a percentage from 0 to 100.`);
  if (Math.round(n * 1000) / 1000 !== n) bad(`${what} can have 3 decimal places at most.`);
  return n;
};
const bool = (v: unknown, what: string): boolean => { if (typeof v !== "boolean") bad(`${what} must be Yes or No.`); return v as boolean; };
const newId = (prefix: string) => `${prefix}_${randomBytes(4).toString("hex")}`;

// ---------------------------------------------------------------------------
// Checking one group
// ---------------------------------------------------------------------------
function parseNumbering(v: unknown): NumberingSettings {
  if (!isObject(v)) return bad("The numbering settings are not valid.");
  const pattern = tidy(v.pattern, 60, "The quote number format", true);
  const problem = validatePattern(pattern);
  if (problem) bad(problem);
  if (!FY_FORMATS.includes(v.fyFormat as FyFormat)) bad("Choose a financial year format from the list.");
  return {
    pattern,
    fyFormat: v.fyFormat as FyFormat,
    fyStartMonth: intIn(v.fyStartMonth, 1, 12, "The first month of the financial year"),
    padding: intIn(v.padding, 0, 12, "The number of digits"),
    resetEachFy: bool(v.resetEachFy, "Start a new series every financial year"),
    startNumber: intIn(v.startNumber, 1, 999_999_999, "The first number of a series"),
    allowManual: bool(v.allowManual, "Allow typing the quote number"),
  };
}

function parseTaxes(v: unknown): TaxDef[] {
  if (!Array.isArray(v)) return bad("The taxes are not valid.");
  if (v.length > 100) bad("There can be 100 taxes at most.");
  const names = new Set<string>();
  const ids = new Set<string>();
  return v.map((raw, i) => {
    if (!isObject(raw)) return bad(`Tax ${i + 1} is not valid.`);
    const name = tidy(raw.name, 40, "A tax name", true);
    if (names.has(name.toLowerCase())) bad(`There are two taxes called "${name}".`);
    names.add(name.toLowerCase());
    const rate = rateIn(raw.rate, `The rate of ${name}`);
    let id = typeof raw.id === "string" && /^[a-z0-9_]{1,40}$/.test(raw.id) ? raw.id : newId("tax");
    if (ids.has(id)) id = newId("tax");
    ids.add(id);
    const parts = Array.isArray(raw.components) ? raw.components : [];
    if (parts.length > 4) bad(`${name} can be split into 4 parts at most.`);
    let components = parts.map(p => {
      if (!isObject(p)) return bad(`A part of ${name} is not valid.`);
      return { name: tidy(p.name, 30, `A part of ${name}`, true), rate: rateIn(p.rate, `A part of ${name}`) };
    });
    if (!components.length) components = [{ name, rate }];
    const sum = Math.round(components.reduce((a, c) => a + c.rate, 0) * 1000) / 1000;
    if (sum !== rate) bad(`The parts of ${name} add up to ${sum}%, not ${rate}%.`);
    return { id, name, rate, components, active: raw.active === undefined ? true : bool(raw.active, `Active for ${name}`) };
  });
}

function parseWithholding(v: unknown, what: string, prefix: string): WithholdingDef[] {
  if (!Array.isArray(v)) return bad(`The ${what} list is not valid.`);
  if (v.length > 100) bad(`There can be 100 ${what} rates at most.`);
  const names = new Set<string>();
  const ids = new Set<string>();
  return v.map((raw, i) => {
    if (!isObject(raw)) return bad(`A ${what} rate is not valid (row ${i + 1}).`);
    const name = tidy(raw.name, 60, `A ${what} name`, true);
    if (names.has(name.toLowerCase())) bad(`There are two ${what} rates called "${name}".`);
    names.add(name.toLowerCase());
    let id = typeof raw.id === "string" && /^[a-z0-9_]{1,40}$/.test(raw.id) ? raw.id : newId(prefix);
    if (ids.has(id)) id = newId(prefix);
    ids.add(id);
    return { id, name, rate: rateIn(raw.rate, `The rate of ${name}`), active: raw.active === undefined ? true : bool(raw.active, `Active for ${name}`) };
  });
}

function parseDisplay(v: unknown): DisplaySettings {
  if (!isObject(v)) return bad("The display settings are not valid.");
  if (v.grouping !== "western" && v.grouping !== "indian") bad("Choose how digits are grouped.");
  if (v.wordsStyle !== "international" && v.wordsStyle !== "indian") bad("Choose how amounts are written in words.");
  return {
    currencySymbol: tidy(v.currencySymbol, 8, "The currency symbol", true),
    grouping: v.grouping as "western" | "indian",
    wordsStyle: v.wordsStyle as "international" | "indian",
    wordsCurrency: tidy(v.wordsCurrency, 40, "The currency name in words", true),
    documentTitle: tidy(v.documentTitle, 60, "The title of the quote document", true),
  };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function parseCompany(v: unknown, db: Db): Promise<CompanySettings> {
  if (!isObject(v)) return bad("The company details are not valid.");
  const email = tidy(v.email, 200, "The email address");
  if (email && !EMAIL.test(email)) bad("The company email address is not valid.");
  const stateCode = tidy(v.stateCode, 2, "The state code");
  if (stateCode && !/^\d{2}$/.test(stateCode)) bad("The state code is two digits, like 33 for Tamil Nadu.");
  const gstin = tidy(v.gstin, 20, "The GSTIN").toUpperCase();
  if (gstin && !/^[0-9A-Z]{10,20}$/.test(gstin)) bad("The GSTIN can have letters and digits only.");
  const file = async (raw: unknown, what: string): Promise<string | null> => {
    if (raw === null || raw === undefined || raw === "") return null;
    if (!isId(raw)) return bad(`${what} is not valid.`);
    const found = await db.moduleFile.findFirst({ where: { id: raw, module: "quote", recordId: "settings", deletedAt: null, status: "READY" }, select: { id: true } });
    if (!found) bad(`${what} was not found. Upload it again.`);
    return raw;
  };
  return {
    name: tidy(v.name, 200, "The company name"),
    registration: tidy(v.registration, 200, "The registration line"),
    address: tidyLines(v.address, 500, "The address"),
    gstin,
    phone: tidy(v.phone, 60, "The phone number"),
    email,
    website: tidy(v.website, 200, "The website"),
    stateCode,
    bankName: tidy(v.bankName, 100, "The bank name"),
    bankAccountHolder: tidy(v.bankAccountHolder, 100, "The account holder"),
    bankAccountNumber: tidy(v.bankAccountNumber, 40, "The account number"),
    bankIfsc: tidy(v.bankIfsc, 20, "The IFSC code").toUpperCase(),
    bankBranch: tidy(v.bankBranch, 100, "The bank branch"),
    logoFileId: await file(v.logoFileId, "The company logo"),
    signatureFileId: await file(v.signatureFileId, "The signature"),
  };
}

function parseTemplates(v: unknown): TemplateSettings {
  if (!isObject(v)) return bad("The message settings are not valid.");
  return {
    emailSubject: tidy(v.emailSubject, 200, "The email subject", true),
    emailBody: tidyLines(v.emailBody, 5000, "The email message"),
    shareValidDays: intIn(v.shareValidDays, 1, 365, "The days a shared link works"),
    defaultValidDays: v.defaultValidDays === null || v.defaultValidDays === "" || v.defaultValidDays === undefined ? null : intIn(v.defaultValidDays, 1, 3650, "The days a new quote is valid"),
  };
}

// The rows under the company block of the quote document. Every row is listed once; a row that is missing (settings saved before it
// existed) is added at the end with its defaults. The quote number and the quote date cannot be switched off.
export function parseDocument(v: unknown): DocumentSettings {
  if (!isObject(v) || !Array.isArray(v.header)) return bad("The document settings are not valid.");
  if (v.header.length > HEADER_KEYS.length) bad("There are too many header rows.");
  const seen = new Set<HeaderKey>();
  const rows: HeaderRow[] = v.header.map((raw, i) => {
    if (!isObject(raw)) return bad(`Header row ${i + 1} is not valid.`);
    if (!HEADER_KEYS.includes(raw.key as HeaderKey)) return bad(`Header row ${i + 1} is not one of the known rows.`);
    const key = raw.key as HeaderKey;
    if (seen.has(key)) bad(`"${HEADER_NAMES[key]}" is listed twice.`);
    seen.add(key);
    if (raw.column !== "left" && raw.column !== "right") bad(`Choose the left or the right column for "${HEADER_NAMES[key]}".`);
    const label = tidy(raw.label, 40, `The printed label of "${HEADER_NAMES[key]}"`, true);
    const show = bool(raw.show, `Printed for "${HEADER_NAMES[key]}"`);
    if (!show && (key === "number" || key === "date")) bad("The quote number and the quote date are always printed.");
    return { key, label, column: raw.column as "left" | "right", show };
  });
  for (const d of DEFAULT_HEADER) if (!seen.has(d.key)) rows.push({ ...d });
  return { header: rows };
}

async function parseGroup(group: SettingGroup, v: unknown, db: Db): Promise<unknown> {
  switch (group) {
    case "numbering": return parseNumbering(v);
    case "taxes": return parseTaxes(v);
    case "tds": return parseWithholding(v, "TDS", "tds");
    case "tcs": return parseWithholding(v, "TCS", "tcs");
    case "rounding": {
      if (!isObject(v) || !ROUNDING_MODES.some(m => m.mode === v.mode)) return bad("Choose a rounding rule from the list.");
      return { mode: v.mode as RoundingMode };
    }
    case "display": return parseDisplay(v);
    case "company": return parseCompany(v, db);
    case "templates": return parseTemplates(v);
    case "document": return parseDocument(v);
  }
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------
async function readGroup<T>(group: SettingGroup, stored: unknown, fallback: T, db: Db): Promise<T> {
  if (stored === undefined || stored === null) return fallback;
  try {
    return (await parseGroup(group, stored, db)) as T;
  } catch {
    return fallback; // a broken row never takes the quote screens down
  }
}

export async function loadSettings(db: Db = prisma): Promise<QuoteSettings> {
  const rows = await db.quoteSetting.findMany();
  const by = new Map(rows.map(r => [r.key, r.value]));
  const [numbering, taxes, tds, tcs, rounding, display, company, templates, document] = await Promise.all([
    readGroup("numbering", by.get("numbering"), DEFAULT_NUMBERING, db),
    readGroup("taxes", by.get("taxes"), DEFAULT_TAXES, db),
    readGroup("tds", by.get("tds"), DEFAULT_TDS, db),
    readGroup("tcs", by.get("tcs"), DEFAULT_TCS, db),
    readGroup("rounding", by.get("rounding"), DEFAULT_SETTINGS.rounding, db),
    readGroup("display", by.get("display"), DEFAULT_DISPLAY, db),
    readGroup("company", by.get("company"), DEFAULT_COMPANY, db),
    readGroup("templates", by.get("templates"), DEFAULT_TEMPLATES, db),
    readGroup("document", by.get("document"), DEFAULT_DOCUMENT, db),
  ]);
  return { numbering, taxes, tds, tcs, rounding, display, company, templates, document };
}

// ---------------------------------------------------------------------------
// Saving (Super Admin only)
// ---------------------------------------------------------------------------
// A tax or a TDS / TCS rate that quotes or items use cannot be deleted: it is switched off instead
async function assertNotInUse(group: SettingGroup, before: { id: string; name: string }[], after: { id: string }[]) {
  const kept = new Set(after.map(x => x.id));
  const removed = before.filter(x => !kept.has(x.id));
  for (const r of removed) {
    const used = group === "taxes"
      ? (await prisma.quoteItem.count({ where: { taxId: r.id } })) + (await prisma.catalogItem.count({ where: { taxId: r.id, deletedAt: null } }))
      : await prisma.quote.count({ where: { tdsTcsTaxId: r.id } });
    if (used > 0) throw new ServiceError(409, `"${r.name}" is used by ${used} ${group === "taxes" ? "quote line or item" : "quote"}${used === 1 ? "" : "s"}, so it cannot be deleted. Switch it off instead.`);
  }
}

export async function saveSettingsGroup(ctx: AuthContext, group: string, value: unknown): Promise<QuoteSettings> {
  assertSuperAdmin(ctx);
  if (!(SETTING_GROUPS as readonly string[]).includes(group)) throw new ServiceError(404, "Unknown settings group.");
  const g = group as SettingGroup;
  const current = await loadSettings();
  const parsed = await parseGroup(g, value, prisma);
  if (g === "taxes") await assertNotInUse(g, current.taxes, parsed as TaxDef[]);
  if (g === "tds") await assertNotInUse(g, current.tds, parsed as WithholdingDef[]);
  if (g === "tcs") await assertNotInUse(g, current.tcs, parsed as WithholdingDef[]);
  await prisma.$transaction(async tx => {
    await tx.$executeRaw`INSERT INTO "QuoteSetting" ("key", "value", "updatedAt") VALUES (${g}, ${JSON.stringify(parsed)}::jsonb, now())
      ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = now()`;
    await writeAudit({
      action: "QUOTE_SETTINGS_UPDATED", actorUserId: ctx.userId,
      oldValue: JSON.parse(JSON.stringify({ group: g, value: (current as Record<string, unknown>)[g] })),
      newValue: JSON.parse(JSON.stringify({ group: g, value: parsed })),
    }, tx);
  }, { maxWait: 10_000, timeout: 20_000 });
  return loadSettings();
}
