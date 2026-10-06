// What Quote Settings start with before anybody changes them. Everything here is editable in Quote Settings (it is stored in the
// QuoteSetting table once changed), so nothing about a company, a bank or a tax rate is fixed in code.

import type { CompanySettings, DisplaySettings, DocumentSettings, HeaderRow, NumberingSettings, QuoteSettings, TaxDef, TemplateSettings, WithholdingDef } from "./types";

// GST rates with the split the quote document prints: GST18 = CGST9 + SGST9 (same state), IGST18 (other state)
function gst(rate: number): TaxDef {
  const half = rate / 2;
  return { id: `gst${String(rate).replace(".", "_")}`, name: `GST${rate}`, rate, active: true, components: [{ name: `CGST${half}`, rate: half }, { name: `SGST${half}`, rate: half }] };
}
function igst(rate: number): TaxDef {
  return { id: `igst${String(rate).replace(".", "_")}`, name: `IGST${rate}`, rate, active: true, components: [{ name: `IGST${rate}`, rate }] };
}

export const DEFAULT_TAXES: TaxDef[] = [gst(0), gst(5), gst(12), gst(18), gst(28), igst(0), igst(5), igst(12), igst(18), igst(28)];

export const DEFAULT_TDS: WithholdingDef[] = [
  { id: "tds_194c_1", name: "194C Contractors - Individual / HUF", rate: 1, active: true },
  { id: "tds_194c_2", name: "194C Contractors - Others", rate: 2, active: true },
  { id: "tds_194j", name: "194J Professional / technical fees", rate: 10, active: true },
  { id: "tds_194h", name: "194H Commission or brokerage", rate: 5, active: true },
  { id: "tds_194i", name: "194I Rent (land, building)", rate: 10, active: true },
  { id: "tds_194q", name: "194Q Purchase of goods", rate: 0.1, active: true },
];

export const DEFAULT_TCS: WithholdingDef[] = [
  { id: "tcs_206c1h", name: "206C(1H) Sale of goods", rate: 0.1, active: true },
  { id: "tcs_1", name: "TCS 1%", rate: 1, active: true },
];

export const DEFAULT_NUMBERING: NumberingSettings = {
  pattern: "QT/{FY}/{SEQ}",
  fyFormat: "YY-YY",
  fyStartMonth: 4,
  padding: 0,
  resetEachFy: true,
  startNumber: 1,
  allowManual: false,
};

export const DEFAULT_DISPLAY: DisplaySettings = {
  currencySymbol: "Rs.",
  grouping: "western",
  wordsStyle: "international",
  wordsCurrency: "Indian Rupee",
  documentTitle: "QUOTATION",
};

export const DEFAULT_COMPANY: CompanySettings = {
  name: "",
  registration: "",
  address: "",
  gstin: "",
  phone: "",
  email: "",
  website: "",
  stateCode: "",
  bankName: "",
  bankAccountHolder: "",
  bankAccountNumber: "",
  bankIfsc: "",
  bankBranch: "",
  logoFileId: null,
  signatureFileId: null,
};

export const DEFAULT_TEMPLATES: TemplateSettings = {
  emailSubject: "Quote {NUMBER} from {COMPANY}",
  emailBody: "Dear {CUSTOMER},\n\nThank you for your interest. Please find your quote {NUMBER} for {TOTAL} here:\n{LINK}\n\nThis quote is valid until {EXPIRY}.\n\nRegards,\n{COMPANY}",
  shareValidDays: 30,
  defaultValidDays: null,
};

// The header of the document as the reference prints it: # and Quote Date on the left, Place Of Supply and the task person on the right
export const DEFAULT_HEADER: HeaderRow[] = [
  { key: "number", label: "#", column: "left", show: true },
  { key: "date", label: "Quote Date", column: "left", show: true },
  { key: "expiry", label: "Expiry Date", column: "left", show: true },
  { key: "reference", label: "Reference#", column: "left", show: true },
  { key: "place", label: "Place Of Supply", column: "right", show: true },
  { key: "person", label: "Task Person", column: "right", show: true },
  { key: "project", label: "Project", column: "right", show: true },
  { key: "deal", label: "Deal", column: "right", show: true },
];
export const DEFAULT_DOCUMENT: DocumentSettings = { header: DEFAULT_HEADER };

export const DEFAULT_SETTINGS: QuoteSettings = {
  numbering: DEFAULT_NUMBERING,
  taxes: DEFAULT_TAXES,
  tds: DEFAULT_TDS,
  tcs: DEFAULT_TCS,
  rounding: { mode: "nearest" },
  display: DEFAULT_DISPLAY,
  company: DEFAULT_COMPANY,
  templates: DEFAULT_TEMPLATES,
  document: DEFAULT_DOCUMENT,
};

export const SETTING_GROUPS = ["numbering", "taxes", "tds", "tcs", "rounding", "display", "company", "templates", "document"] as const;
export type SettingGroup = (typeof SETTING_GROUPS)[number];
