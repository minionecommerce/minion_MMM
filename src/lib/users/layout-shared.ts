// Users → Edit Page Layout: how the Create User / Edit User form and the Users table are set up.
// Shared by server and browser code (no server-only imports).
// "System" fields are the original form fields: a Super Admin can rename them, make them required, give some a
// default value and change their order, but not delete or retype them. Full Name and Email are always required
// (a login cannot be created without them). On top of these a Super Admin can add "custom" fields (New Field); their
// values are kept per employee in Employee.customFields.
// "Access" is a system field too, but it decides what a person may do: its first option, Super Admin, makes the user a
// Super Admin (User.isSuperAdmin); every other option is an access level linked to a Role (the permissions it gives).

export type UserFieldKey = "fullName" | "employeeCode" | "email" | "phone" | "departmentId" | "designation" | "access"; // system fields
export type UserFieldType = "TEXT" | "TEXTAREA" | "NUMBER" | "DATE" | "EMAIL" | "PHONE" | "URL" | "CHECKBOX" | "DROPDOWN";

// roleId / locked are only used by the Access field: the Role an access level gives, and the built-in Super Admin option
export type FieldOption = { id: string; label: string; roleId?: string | null; locked?: boolean };

// The built-in option of the Access field that makes a user a Super Admin (it cannot be renamed, moved or deleted)
export const SUPER_ADMIN_ACCESS_ID = "super_admin";
export const SUPER_ADMIN_OPTION: FieldOption = { id: SUPER_ADMIN_ACCESS_ID, label: "Super Admin", roleId: null, locked: true };
export type FieldValue = string | number | boolean | null;

export type UserFieldDto = {
  key: string; // system: one of UserFieldKey; custom: "cf_<random>"
  label: string;
  type: UserFieldType;
  isSystem: boolean;
  required: boolean;
  requiredLocked: boolean; // required cannot be changed
  defaultValue: string | null; // text; for Department the department id; for a custom dropdown the option id; for a checkbox "true"
  defaultable: boolean; // a default value can be set
  options: FieldOption[] | null; // the choices of a custom dropdown (Department's choices are the departments)
};

type SystemDef = { key: UserFieldKey; label: string; type: UserFieldType; required: boolean; requiredLocked: boolean; defaultable: boolean };

// In the order they appear on the form
export const USER_FIELDS: SystemDef[] = [
  { key: "fullName", label: "Full Name", type: "TEXT", required: true, requiredLocked: true, defaultable: false },
  { key: "employeeCode", label: "Employee ID", type: "TEXT", required: false, requiredLocked: false, defaultable: false },
  { key: "email", label: "Email / Username", type: "EMAIL", required: true, requiredLocked: true, defaultable: false },
  { key: "phone", label: "Phone Number", type: "PHONE", required: false, requiredLocked: false, defaultable: false },
  { key: "departmentId", label: "Department", type: "DROPDOWN", required: false, requiredLocked: false, defaultable: true },
  { key: "designation", label: "Designation", type: "TEXT", required: false, requiredLocked: false, defaultable: true },
  { key: "access", label: "Access", type: "DROPDOWN", required: true, requiredLocked: true, defaultable: true },
];

export const USER_FIELD_TYPE_LABEL: Record<UserFieldType, string> = {
  TEXT: "Single Line", TEXTAREA: "Multi Line", NUMBER: "Number", DATE: "Date", EMAIL: "Email", PHONE: "Phone", URL: "URL", CHECKBOX: "Checkbox", DROPDOWN: "Dropdown",
};

// What a Super Admin can pick for a New Field
export const CUSTOM_FIELD_TYPES: { type: UserFieldType; label: string; hint: string }[] = [
  { type: "TEXT", label: "Single Line", hint: "Short text" },
  { type: "DROPDOWN", label: "Dropdown", hint: "Choose one option from a list you add" },
  { type: "TEXTAREA", label: "Multi Line", hint: "Long text" },
  { type: "NUMBER", label: "Number", hint: "Numbers, decimals allowed" },
  { type: "DATE", label: "Date", hint: "Calendar date" },
  { type: "CHECKBOX", label: "Checkbox", hint: "Yes / No" },
  { type: "EMAIL", label: "Email", hint: "Email address" },
  { type: "PHONE", label: "Phone", hint: "Phone number" },
  { type: "URL", label: "URL", hint: "Web link" },
];
export const CUSTOM_TYPE_SET = new Set<string>(CUSTOM_FIELD_TYPES.map(t => t.type));

// The Users table, in its default order (the Actions column always stays last)
export const USER_COLUMNS = [
  { id: "user", label: "User" },
  { id: "employeeCode", label: "Employee ID" },
  { id: "email", label: "Email / Username" },
  { id: "role", label: "Access" },
  { id: "department", label: "Department" },
  { id: "status", label: "Status" },
  { id: "lastLogin", label: "Last Login" },
  { id: "created", label: "Created" },
  { id: "permissions", label: "Permissions" },
] as const;
export type UserColumnId = (typeof USER_COLUMNS)[number]["id"];

export type UserLayout = { fields: UserFieldDto[]; columns: UserColumnId[] };

export const USER_FIELD_LABEL_MAX = 60;
export const USER_OPTION_LABEL_MAX = 100;
export const MAX_CUSTOM_USER_FIELDS = 30;
export const DEPARTMENT_NAME_MAX = 100;

// Which table column shows which form field (its header follows the field's label)
export const COLUMN_FIELD: Partial<Record<UserColumnId, UserFieldKey>> = { employeeCode: "employeeCode", email: "email", role: "access", department: "departmentId" };

// ---------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Checks a value for a field type. `what` starts the message ("Joining Bonus", "Default value"). Empty means "no value".
export function cleanFieldValue(what: string, type: UserFieldType, raw: unknown, options: { id: string }[] | null): { value: FieldValue } | { error: string } {
  if (raw === null || raw === undefined || raw === "") return { value: null };
  if (type === "CHECKBOX") {
    if (raw === true || raw === "true") return { value: true };
    if (raw === false || raw === "false") return { value: false };
    return { error: `${what} must be Yes or No.` };
  }
  if (type === "NUMBER") {
    const n = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() ? Number(raw) : NaN;
    return Number.isFinite(n) ? { value: n } : { error: `${what} must be a number.` };
  }
  if (typeof raw !== "string") return { error: `${what} is not valid.` };
  const v = raw.trim();
  if (!v) return { value: null };
  switch (type) {
    case "TEXT": return v.length > 500 ? { error: `${what} is too long (500 characters at most).` } : { value: v };
    case "TEXTAREA": return v.length > 5000 ? { error: `${what} is too long (5000 characters at most).` } : { value: v };
    case "DATE": {
      const d = new Date(`${v}T00:00:00Z`);
      const ok = /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v; // also refuses 2026-02-30
      return ok ? { value: v } : { error: `${what} must be a valid date.` };
    }
    case "EMAIL": return EMAIL_RE.test(v) && v.length <= 200 ? { value: v } : { error: `${what} must be a valid email address.` };
    case "PHONE": return /^\+?[\d\s\-().]{6,25}$/.test(v) && v.replace(/\D/g, "").length >= 6 ? { value: v } : { error: `${what} must be a valid phone number.` };
    case "URL": {
      try {
        const u = new URL(v);
        return (u.protocol === "http:" || u.protocol === "https:") && v.length <= 500 ? { value: v } : { error: `${what} must be a valid http(s) link.` };
      } catch {
        return { error: `${what} must be a valid http(s) link.` };
      }
    }
    case "DROPDOWN": return options?.some(o => o.id === v) ? { value: v } : { error: `${what} must be one of the options in the list.` };
  }
  return { error: `${what} is not valid.` };
}

const isEmpty = (v: string | null | undefined) => !(v ?? "").trim();

// First required field (other than the always-required ones, which have their own checks) that has no value.
// `custom` holds the form text of the custom fields (a checkbox is "true" when ticked).
export function firstMissingField(fields: UserFieldDto[], values: Partial<Record<UserFieldKey, string | null | undefined>>, custom: Record<string, string> = {}): string | null {
  for (const f of fields) {
    if (!f.required || f.requiredLocked) continue;
    const v = f.isSystem ? values[f.key as UserFieldKey] : custom[f.key];
    if (f.type === "CHECKBOX" ? v !== "true" : isEmpty(v)) return `${f.label} is required.`;
  }
  return null;
}

// What a blank form starts with
export const fieldDefaults = (fields: UserFieldDto[]): Record<UserFieldKey, string> =>
  Object.fromEntries(USER_FIELDS.map(d => [d.key, fields.find(f => f.key === d.key)?.defaultValue ?? ""])) as Record<UserFieldKey, string>;

export const customDefaults = (fields: UserFieldDto[]): Record<string, string> =>
  Object.fromEntries(fields.filter(f => !f.isSystem).map(f => [f.key, f.defaultValue ?? ""]));

// The form text of a stored custom value (what the inputs show)
export const customToForm = (stored: unknown): string => (stored === null || stored === undefined ? "" : String(stored));

// The value to send for a custom field's form text: "" clears it, a checkbox is always true / false
export function customFromForm(field: UserFieldDto, text: string | undefined): FieldValue {
  if (field.type === "CHECKBOX") return text === "true";
  if (!text || !text.trim()) return null;
  if (field.type === "NUMBER") return Number(text);
  return text;
}

// What the profile shows for a stored custom value
export function displayCustomValue(field: UserFieldDto, raw: unknown): string {
  if (raw === null || raw === undefined || raw === "") return "—";
  if (field.type === "CHECKBOX") return raw === true || raw === "true" ? "Yes" : "No";
  if (field.type === "DROPDOWN") return field.options?.find(o => o.id === raw)?.label ?? "—";
  if (field.type === "DATE" && typeof raw === "string") {
    const d = new Date(`${raw}T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? raw : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
  }
  return String(raw);
}

// What to show for a person's Access: Super Admin, the access level's name, or (for accounts that predate access
// levels) the name of their role
export function accessLabel(layout: UserLayout | undefined, who: { isSuperAdmin: boolean; accessId: string | null; roleName: string | null }): string {
  if (who.isSuperAdmin) return SUPER_ADMIN_OPTION.label;
  const level = who.accessId ? layout?.fields.find(f => f.key === "access")?.options?.find(o => o.id === who.accessId) : undefined;
  return level?.label ?? who.roleName ?? "—";
}

// A screen with its own wording keeps it until a Super Admin renames the field
export const renamedLabel = (layout: UserLayout | undefined, key: UserFieldKey, fallback: string) => {
  const label = layout?.fields.find(f => f.key === key)?.label;
  return label && label !== USER_FIELDS.find(f => f.key === key)!.label ? label : fallback;
};

export const fieldLabel = (layout: UserLayout | undefined, key: UserFieldKey) => layout?.fields.find(f => f.key === key)?.label ?? USER_FIELDS.find(f => f.key === key)!.label;
