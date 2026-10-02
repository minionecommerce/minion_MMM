// Shared by server and browser code. No server-only imports.
import type { LeadFieldDto } from "./layout-shared";

export const OPTION_TYPES = [
  "SOURCE",
  "REQUIREMENT",
  "MODE_OF_CUSTOMER",
  "PRODUCT_OR_SERVICE",
  "MAIN_CATEGORY",
  "CATEGORY",
  "SUBCATEGORY",
  "LEAD_STATUS",
  "LEAD_TYPE",
] as const;
export type OptionType = (typeof OPTION_TYPES)[number];

export type LeadOptionDto = {
  id: string;
  type: string;
  key: string | null;
  label: string;
  parentId: string | null;
};

export type EmployeeOptionDto = { id: string; name: string; designation: string | null };

export type LeadFormOptions = {
  sources: LeadOptionDto[];
  requirements: LeadOptionDto[];
  modesOfCustomer: LeadOptionDto[];
  productOrService: LeadOptionDto[];
  mainCategories: LeadOptionDto[];
  categories: LeadOptionDto[];
  subcategories: LeadOptionDto[];
  leadStatuses: LeadOptionDto[];
  leadTypes: LeadOptionDto[];
  employees: EmployeeOptionDto[];
  // Distinct typed values used by the Customer and Location column filters
  customerNames: string[];
  columnOrder: LeadColumnId[];
  exactRequirements: string[];
  locations: string[];
  // Page layout (Edit Page Layout): how each field is set up, plus the options of custom pick-list fields
  fields: LeadFieldDto[];
  customOptions: Record<string, LeadOptionDto[]>;
};

// Quick filter buttons. Each maps to a stable LeadOption.key on LEAD_STATUS (labels can be renamed).
export const LEAD_FILTERS = [
  { id: "open", label: "Open Lead", statusKey: "open" },
  { id: "follow_up", label: "Follow-up Lead", statusKey: "follow_up" },
  { id: "revive", label: "Revive Lead", statusKey: "revive" },
  { id: "today_followup", label: "Today Follow-up", statusKey: null },
  { id: "pending", label: "Pending Lead", statusKey: "pending" },
] as const;
export type LeadFilterId = (typeof LEAD_FILTERS)[number]["id"];

export const SORT_KEYS = ["lead", "customer", "requirement", "assigned", "status", "source", "category", "location"] as const;
export type LeadSortKey = (typeof SORT_KEYS)[number];

// Column header filters (tick-box lists). Same keys as the sortable columns, except the Lead ID column.
export const COLUMN_FILTER_KEYS = ["customer", "requirement", "assigned", "leadPerson", "status", "source", "category", "location"] as const;
export type ColumnFilterKey = (typeof COLUMN_FILTER_KEYS)[number];
export type ColumnFilters = Partial<Record<ColumnFilterKey, string[]>>;
export const COLUMN_FILTER_MAX_VALUES = 200;

// Columns of the Leads table that can be reordered in Edit Page Layout (the Actions column always stays last)
export const LEAD_COLUMNS = [
  { id: "lead", label: "Lead ID & Date" },
  { id: "customer", label: "Customer details" },
  { id: "requirement", label: "Requirements" },
  { id: "assigned", label: "Staff Assignment" },
  { id: "status", label: "Lead Status" },
  { id: "followup", label: "Follow-up" },
  { id: "state", label: "Status" },
  { id: "source", label: "Source" },
  { id: "category", label: "Categories" },
  { id: "location", label: "Location" },
] as const;
export type LeadColumnId = (typeof LEAD_COLUMNS)[number]["id"];

export const CONVENTIONAL_RATES = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export const PAGE_SIZE = 50;

// Attachments
export const MAX_ATTACHMENTS_PER_LEAD = 10;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};
export const ATTACHMENT_ACCEPT = Object.keys(ALLOWED_ATTACHMENT_TYPES).join(",");

// Follow-up proof may also be spreadsheets
export const FOLLOWUP_ATTACHMENT_TYPES: Record<string, string> = {
  ...ALLOWED_ATTACHMENT_TYPES,
  "text/csv": "csv",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};
export const FOLLOWUP_ATTACHMENT_ACCEPT = [...Object.keys(FOLLOWUP_ATTACHMENT_TYPES), ".csv", ".xls", ".xlsx"].join(",");
export const MAX_FOLLOWUP_FILES = 10;
export const FOLLOWUP_NOTES_MAX = 2000;
