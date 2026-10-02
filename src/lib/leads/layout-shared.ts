// Page-layout definitions for the Lead form. Shared by server and browser code (no server-only imports).
// "System" fields are the original form fields: they can be renamed, made required and given a default,
// but not deleted or retyped. Super Admins can add "custom" fields on top (stored in Lead.customFields).

export const FIELD_TYPES = [
  "TEXT", "TEXTAREA", "NUMBER", "DATE", "EMAIL", "PHONE", "URL", "CHECKBOX", "DROPDOWN",
  "PERSON", "RATE", "FILE",
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

// What a Super Admin can pick when adding a new field
export const CUSTOM_FIELD_TYPES: { type: FieldType; label: string; hint: string }[] = [
  { type: "TEXT", label: "Single Line", hint: "Short text" },
  { type: "TEXTAREA", label: "Multi Line", hint: "Long text" },
  { type: "NUMBER", label: "Number", hint: "Numbers, decimals allowed" },
  { type: "DATE", label: "Date", hint: "Calendar date" },
  { type: "DROPDOWN", label: "Pick List", hint: "Choose one from a list you manage" },
  { type: "CHECKBOX", label: "Checkbox", hint: "Yes / No" },
  { type: "EMAIL", label: "Email", hint: "Email address" },
  { type: "PHONE", label: "Phone", hint: "Phone number" },
  { type: "URL", label: "URL", hint: "Web link" },
];
export const CUSTOM_TYPE_SET = new Set<string>(CUSTOM_FIELD_TYPES.map(t => t.type));

export const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  TEXT: "Single Line", TEXTAREA: "Multi Line", NUMBER: "Number", DATE: "Date", EMAIL: "Email", PHONE: "Phone",
  URL: "URL", CHECKBOX: "Checkbox", DROPDOWN: "Pick List", PERSON: "Person", RATE: "Percentage", FILE: "File Upload",
};

export type LeadFieldDto = {
  id: string;
  key: string;
  label: string;
  type: FieldType;
  isSystem: boolean;
  required: boolean;
  requiredLocked: boolean; // required cannot be changed (the lead cannot be saved without it)
  defaultValue: string | null; // text; for pick lists the option id; for checkboxes "true"/"false"
  defaultable: boolean; // a default value can be set
  optionType: string | null; // which LeadOption list a pick list uses
  parentOptionType: string | null; // cascading pick lists (Category under Main Category)
  sortOrder: number;
};

type SystemDef = {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  requiredLocked?: boolean;
  optionType?: string;
  parentOptionType?: string;
  defaultable?: boolean;
};

// In the order they appear on the form
export const SYSTEM_FIELDS: SystemDef[] = [
  { key: "customerName", label: "Customer Name", type: "TEXT", required: true, requiredLocked: true, defaultable: false },
  { key: "contactNumber", label: "Contact Number", type: "PHONE", required: true, requiredLocked: true, defaultable: false },
  { key: "taskAssignedPersonId", label: "Task Assigned Person", type: "PERSON", required: true },
  { key: "productOrServiceId", label: "Product or Service", type: "DROPDOWN", required: true, optionType: "PRODUCT_OR_SERVICE", defaultable: true },
  { key: "exactRequirement", label: "Exact Requirement", type: "TEXT", required: false, defaultable: true },
  { key: "modeOfCustomerId", label: "Mode of Customer", type: "DROPDOWN", required: true, optionType: "MODE_OF_CUSTOMER", defaultable: true },
  { key: "sourceId", label: "Source", type: "DROPDOWN", required: false, optionType: "SOURCE", defaultable: true },
  { key: "location", label: "Location", type: "TEXT", required: true, defaultable: true },
  { key: "exactLocation", label: "Exact Location", type: "TEXT", required: false, defaultable: true },
  { key: "locationLink", label: "Location Link", type: "URL", required: false, defaultable: true },
  { key: "mainCategoryId", label: "Main Category", type: "DROPDOWN", required: true, optionType: "MAIN_CATEGORY", defaultable: false },
  { key: "categoryId", label: "Category", type: "DROPDOWN", required: true, optionType: "CATEGORY", parentOptionType: "MAIN_CATEGORY", defaultable: false },
  { key: "subcategoryId", label: "Subcategory", type: "DROPDOWN", required: true, optionType: "SUBCATEGORY", parentOptionType: "CATEGORY", defaultable: false },
  { key: "leadPersonId", label: "Lead Person", type: "PERSON", required: false },
  { key: "leadStatusId", label: "Lead Status", type: "DROPDOWN", required: true, optionType: "LEAD_STATUS", defaultable: true },
  { key: "amount", label: "Amount", type: "NUMBER", required: false, defaultable: true },
  { key: "conventionalRate", label: "Conventional Rate", type: "RATE", required: false, defaultable: true },
  { key: "notes", label: "Notes", type: "TEXTAREA", required: false, defaultable: true },
  { key: "leadTypeId", label: "Type Of Lead", type: "DROPDOWN", required: false, optionType: "LEAD_TYPE", defaultable: true },
  { key: "attachments", label: "Upload Files", type: "FILE", required: false, requiredLocked: true, defaultable: false },
  { key: "dailyTask", label: "Daily Task Settings", type: "CHECKBOX", required: false, requiredLocked: true, defaultable: true },
];

export const FIELD_LABEL_MAX = 60;
export const OPTION_LABEL_MAX = 100;
export const MAX_CUSTOM_FIELDS = 40;
export const customOptionType = (fieldKey: string) => `CF:${fieldKey}`;

// What the form shows for a stored custom value
export function displayCustomValue(field: LeadFieldDto, raw: unknown, optionLabel: (id: string) => string | undefined): string {
  if (raw === null || raw === undefined || raw === "") return "—";
  if (field.type === "CHECKBOX") return raw === true || raw === "true" ? "Yes" : "No";
  if (field.type === "DROPDOWN") return optionLabel(String(raw)) ?? "—";
  return String(raw);
}
