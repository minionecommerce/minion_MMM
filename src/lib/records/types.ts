// Types shared by the server and the browser for the four record modules: Material Vendor, Service Vendor,
// Pre-Payment Records and Payment Collection Records. No server-only imports here.

export const MODULE_IDS = ["materialVendor", "serviceVendor", "prePayment", "paymentCollection"] as const;
export type ModuleId = (typeof MODULE_IDS)[number];

// AUTO (the record's own ID), LOOKUP (a deal or a vendor) and APPROVER (Approved By) exist only as standard fields.
export type FieldType =
  | "TEXT" | "TEXTAREA" | "NUMBER" | "CURRENCY" | "DATE" | "DATETIME" | "EMAIL" | "PHONE" | "URL"
  | "CHECKBOX" | "DROPDOWN" | "USER" | "FILE"
  | "AUTO" | "LOOKUP" | "APPROVER";

export type CustomFieldType = Exclude<FieldType, "AUTO" | "LOOKUP" | "APPROVER">;
export type LookupKind = "deal" | "materialVendor" | "serviceVendor";
export type FieldOption = { id: string; label: string };

// What a Super Admin can pick in New Field. The same field-type list as Users → Edit Page Layout, plus Date & Time,
// Currency / Amount, File Upload and User Lookup.
export const CUSTOM_FIELD_TYPES: { type: CustomFieldType; label: string; hint: string }[] = [
  { type: "TEXT", label: "Single Line", hint: "Short text" },
  { type: "TEXTAREA", label: "Multi Line", hint: "Long text" },
  { type: "NUMBER", label: "Number", hint: "Numbers, decimals allowed" },
  { type: "CURRENCY", label: "Currency / Amount", hint: "An amount of money" },
  { type: "DATE", label: "Date", hint: "Calendar date" },
  { type: "DATETIME", label: "Date & Time", hint: "A date with a time" },
  { type: "DROPDOWN", label: "Dropdown", hint: "Choose one from a list you manage" },
  { type: "CHECKBOX", label: "Checkbox", hint: "Yes / No" },
  { type: "FILE", label: "File Upload", hint: "Documents or photos" },
  { type: "USER", label: "User Lookup", hint: "One of the active CRM users" },
  { type: "EMAIL", label: "Email", hint: "Email address" },
  { type: "PHONE", label: "Phone", hint: "Phone number" },
  { type: "URL", label: "URL", hint: "Web link" },
];
export const CUSTOM_TYPE_SET = new Set<string>(CUSTOM_FIELD_TYPES.map(t => t.type));
// A column of a table section (Price Detail, Remarks) is a simpler field: no User Lookup, no Date & Time
export const TABLE_COLUMN_TYPES = new Set<string>(["TEXT", "TEXTAREA", "NUMBER", "CURRENCY", "DATE", "DROPDOWN", "CHECKBOX", "FILE", "EMAIL", "PHONE", "URL"]);

export const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  TEXT: "Single Line", TEXTAREA: "Multi Line", NUMBER: "Number", CURRENCY: "Currency / Amount", DATE: "Date", DATETIME: "Date & Time",
  EMAIL: "Email", PHONE: "Phone", URL: "URL", CHECKBOX: "Checkbox", DROPDOWN: "Dropdown", USER: "User Lookup", FILE: "File Upload",
  AUTO: "Auto ID", LOOKUP: "Lookup", APPROVER: "Approval",
};

// The types a custom field can be switched to without losing what people already typed
export const TYPE_GROUPS: FieldType[][] = [
  ["TEXT", "TEXTAREA"],
  ["NUMBER", "CURRENCY"],
];
// Looser text types can become plain text, never the other way round (old values might not be valid emails, ...)
export function typeChoicesFor(type: FieldType, isSystem: boolean, inTable: boolean): FieldType[] {
  if (isSystem) return [];
  const group = TYPE_GROUPS.find(g => g.includes(type));
  const choices: FieldType[] = group ? [...group] : [];
  if (type === "EMAIL" || type === "PHONE" || type === "URL") choices.push("TEXT", "TEXTAREA");
  return Array.from(new Set(choices)).filter(t => t === type || !inTable || TABLE_COLUMN_TYPES.has(t));
}

export const FIELD_LABEL_MAX = 60;
export const OPTION_LABEL_MAX = 100;
export const SECTION_LABEL_MAX = 60;
export const MAX_CUSTOM_FIELDS = 60;
export const MAX_CUSTOM_SECTIONS = 8;
export const MAX_OPTIONS = 200;
export const MAX_ROWS = 200;
export const MAX_FILE_MB = 10; // the Storage bucket's own limit
export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
export const PAGE_SIZE = 50;
export const DEFAULT_CURRENCY = "INR";
export const CURRENCY_CODES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "SAR", "AUD", "CAD", "JPY", "CNY"] as const;

// ---------------------------------------------------------------------------
// The layout the screens use (system fields and fields added in Edit Page Layout, merged)
// ---------------------------------------------------------------------------
export type LayoutField = {
  key: string; // a standard field: its column name. A field added in Edit Page Layout: cf_<random>
  label: string;
  type: FieldType;
  isSystem: boolean;
  section: string; // id of the section it belongs to
  required: boolean;
  requiredLocked: boolean; // cannot be made optional or hidden (the record cannot be saved without it)
  enabled: boolean; // shown on the form and the record; a hidden field keeps its data
  readOnly: boolean; // shown but not typed in (Payment ID, Exchange Rate)
  inList: boolean; // is a column of the list page
  listable: boolean; // can be a column of the list page
  defaultValue: string | null; // option id / user id / "@me" / "@today" / "@now" / text
  defaultable: boolean;
  options: FieldOption[]; // DROPDOWN
  lookup: LookupKind | null;
  prefix: string | null; // CURRENCY: written before the number
  currency: string; // CURRENCY: the code that goes with the amounts
  maxFiles: number; // FILE
  maxLength: number | null; // TEXT / TEXTAREA
  integer: boolean; // NUMBER: whole numbers only
  min: number | null; // NUMBER / CURRENCY
  typeChoices: FieldType[]; // what this field can be switched to (fields added in Edit Page Layout only)
};

export type LayoutSection = { id: string; label: string; kind: "FORM" | "TABLE"; isSystem: boolean };

export type ModuleLayoutDto = {
  module: ModuleId;
  sections: LayoutSection[];
  fields: LayoutField[]; // in form order; the fields of one section keep their relative order
  columns: string[]; // field keys of the list page, in order (the ID column always comes first, Actions last)
};

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------
export type FileDto = { id: string; fileName: string; size: number; mimeType: string; url: string | null };
export type RecordValues = Record<string, unknown>; // by field key: text, number, option id, user id, ... or FileDto[] for File Upload fields
export type RowDto = { id: string; values: RecordValues };

export type RecordDto = {
  id: string;
  code: string;
  values: RecordValues;
  rows: Record<string, RowDto[]>; // by table section id
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null; // when Approved By was set (Pre-Payment and Payment Collection only)
};

export type RecordRefs = {
  users: Record<string, string>; // id -> name
  deals: Record<string, { code: string; name: string; customer: string | null; closed: boolean }>;
  materialVendors: Record<string, { code: string; name: string }>;
  serviceVendors: Record<string, { code: string; name: string }>;
};

export type LookupItem = { id: string; label: string; sub?: string | null; tag?: string | null };

export type ListRow = { id: string; code: string; cells: Record<string, string> };
export type ListData = {
  rows: ListRow[];
  total: number; // all records
  showing: number; // the ones that match the search / filters
  page: number;
  pageCount: number;
  pageSize: number;
};

export type ListParams = {
  q?: string;
  sort?: string;
  dir?: "asc" | "desc";
  page: number;
  filters: Record<string, string[]>; // field key -> chosen option / user ids ("none" = empty)
};

export type Abilities = { create: boolean; edit: boolean; delete: boolean; export: boolean; approve: boolean; layout: boolean };
