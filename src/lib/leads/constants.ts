import { MAX_AUDIO_BYTES, MAX_AUDIO_MB } from "./audio-types";
// Shared by server and browser code. No server-only imports.
import type { LeadFieldDto } from "./layout-shared";

export const OPTION_TYPES = [
  "SOURCE",
  "REQUIREMENT",
  "MODE_OF_CUSTOMER",
  "PRODUCT_OR_SERVICE",
  "MAIN_CATEGORY",
  "SUBCATEGORY",
  "LEAD_STATUS",
  "LEAD_TYPE",
  "DEAL_STATUS", // the Deals page's own status list (Edit Deal Layout)
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
  subcategories: LeadOptionDto[];
  leadStatuses: LeadOptionDto[];
  dealStatuses: LeadOptionDto[];
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

// The Status column of the Leads table (the one with the Rate bar): Closed once the lead was closed with Close Lead,
// Follow-up as soon as it has a finished follow-up, otherwise Open. It does not depend on the Lead Status dropdown.
export type LeadStatusText = "Open" | "Follow-up" | "Closed";
export const leadStatusText = (closed: boolean, followUps: number): LeadStatusText => (closed ? "Closed" : followUps > 0 ? "Follow-up" : "Open");
// The choices of the Status column's filter ("state" in the column filters; the Lead Status column is "status")
export const STATUS_FILTER_ITEMS = [
  { value: "open", label: "Open" },
  { value: "follow_up", label: "Follow-up" },
  { value: "closed", label: "Closed" },
] as const;

// Quick filter buttons. Open Lead, Follow-up Lead and Revive Lead (= closed leads) use the Status column above.
// Pending Lead still looks for a Lead Status option with that stable key (labels can be renamed).
export const LEAD_FILTERS = [
  { id: "open", label: "Open Lead", status: "open", statusKey: null },
  { id: "follow_up", label: "Follow-up Lead", status: "follow_up", statusKey: null },
  { id: "revive", label: "Revive Lead", status: "closed", statusKey: null },
  { id: "today_followup", label: "Today Follow-up", status: null, statusKey: null },
  { id: "pending", label: "Pending Lead", status: null, statusKey: "pending" },
] as const;
export type LeadFilterId = (typeof LEAD_FILTERS)[number]["id"];

// Which date the calendar's From / To range applies to, chosen with the funnel icon on the Leads page. Assigned Date is the date
// shown under the Lead ID (when the lead was created and assigned); the other two are the lead's recorded last / next follow-up dates.
export const DATE_FILTER_TYPES = [
  { value: "assigned", label: "Assigned Date" },
  { value: "last", label: "Follow Up Last Date" },
  { value: "next", label: "Follow Up Next Date" },
] as const;
export type DateFilterType = (typeof DATE_FILTER_TYPES)[number]["value"];

export const SORT_KEYS = ["lead", "customer", "requirement", "assigned", "status", "source", "category", "location"] as const;
export type LeadSortKey = (typeof SORT_KEYS)[number];

// Column header filters (tick-box lists). Same keys as the sortable columns, except the Lead ID column.
export const COLUMN_FILTER_KEYS = ["customer", "requirement", "assigned", "leadPerson", "status", "state", "source", "category", "location"] as const;
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
export const MAX_ATTACHMENT_MB = 1; // largest file that is stored: documents as they are, photos after compression
export const MAX_ATTACHMENT_BYTES = MAX_ATTACHMENT_MB * 1024 * 1024;
// Audio recordings have their own, larger limit (see audio-types.ts)
export const maxFileBytes = (type: string) => (type.startsWith("audio/") ? MAX_AUDIO_BYTES : MAX_ATTACHMENT_BYTES);
export const maxFileLabel = (type: string) => `${type.startsWith("audio/") ? MAX_AUDIO_MB : MAX_ATTACHMENT_MB} MB`;

// Any file format is accepted (name, type and size are saved with each file), except programs and scripts
// that can run code when someone opens them. Decided by the file name's extension, never by the browser's
// reported type, which is empty or generic for many formats.
const BLOCKED_ATTACHMENT_EXTENSIONS = new Set([
  "exe", "bat", "cmd", "com", "msi", "scr", "dll", "sys", "pif", "cpl", "lnk", "reg", "hta",
  "vbs", "vbe", "js", "jse", "mjs", "cjs", "wsf", "wsh", "ps1", "psm1", "sh", "bash",
  "jar", "apk", "app", "dmg", "pkg", "deb", "rpm", "swf", "html", "htm", "xhtml", "svg",
]);
export const ATTACHMENT_BLOCKED_HINT = "programs and scripts (.exe, .bat, .js, .html, ...)";

// Lower-case extension of a file name ("" when there is none). Trailing dots/spaces are ignored because Windows drops them.
export function attachmentExtension(name: string) {
  const match = /\.([A-Za-z0-9]{1,10})$/.exec(name.trim().replace(/[. ]+$/, ""));
  return match ? match[1].toLowerCase() : "";
}
export function isAttachmentAllowed(name: string) {
  return !BLOCKED_ATTACHMENT_EXTENSIONS.has(attachmentExtension(name));
}
// Extension used in the storage path, which is never built from the user's file name
export function storageExtension(name: string) {
  return attachmentExtension(name) || "bin";
}
export const UNKNOWN_MIME_TYPE = "application/octet-stream";
export const PASTED_IMAGE_EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

// ---------------------------------------------------------------------------
// Image optimization. Photos are resized, converted to WebP and given a thumbnail in the browser BEFORE they
// are uploaded. Everything tunable lives here. Documents (PDF, Office, CSV, ...) are never touched.
// ---------------------------------------------------------------------------
export const IMAGE_COMPRESSION_QUALITY = 0.8; // WebP quality of the stored image (0-1)
export const MAX_IMAGE_WIDTH = 1920; // px; larger images are scaled down, never up, keeping the aspect ratio
export const MAX_IMAGE_HEIGHT = 1920;
export const THUMBNAIL_MAX_DIMENSION = 400; // px, longest side of the list/gallery thumbnail
export const THUMBNAIL_QUALITY = 0.75;
export const MIN_IMAGE_QUALITY = 0.6; // when a photo is still over the size limit, quality is lowered no further than this...
export const MIN_FIT_DIMENSION = 1000; // ...and then the picture is shrunk, down to this many px on its longest side
export const FALLBACK_JPEG_QUALITY = 0.82; // browsers that cannot encode WebP (Safari) store JPEG instead
export const MAX_ORIGINAL_IMAGE_BYTES = 10 * 1024 * 1024; // the file the user picks, before compression
export const MAX_SOURCE_PIXELS = 64_000_000; // refuse to decode absurdly large images (browser memory)
export const MAX_THUMBNAIL_BYTES = 200 * 1024; // server sanity limit for a thumbnail
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];
export const THUMBNAIL_TYPES = ["image/webp", "image/jpeg"] as const;
export const IMAGE_FILE_EXTENSIONS: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };
export function isAllowedImageType(type: string): type is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}

export const MAX_FOLLOWUP_FILES = 10;
export const FOLLOWUP_NOTES_MAX = 2000;

// Close Lead (Leads → Actions): a reason is required, files are optional. A closed lead shows "Closed" in the Status
// column (Lead.closedAt is set) and keeps its Lead Status as it was. Reopen Lead clears closedAt again.
export const CLOSE_REASON_MAX = 2000;
export const MAX_CLOSE_FILES = 10;

// Convert Lead (Leads → Convert icon): the lead becomes a deal on the Deals page. Deal numbers are DL1, DL2, ... from their own
// counter and never come from the Lead ID. The Closing Date typed in the popup is the deal's validity; it can be today or later.
export const DEAL_NUMBER_PREFIX = "DL";
export const DEAL_NAME_MAX = 200;
export const DEAL_VALUE_MAX = 9999999999.99; // Deal.value is Decimal(12, 2)
export const DEAL_CLOSING_MAX_YEARS = 10; // a Closing Date further away than this is almost certainly a typo

// A lead can only become a deal once it has been followed up: the Follow-up column must show at least this many
export const MIN_FOLLOWUPS_TO_CONVERT = 1;
export const FOLLOWUP_NEEDED_MESSAGE = "Please make your follow-up count as 1 to make it as deal.";

// Columns of the Deals table that can be reordered in Edit Deal Layout (the Actions column always stays last)
export const DEAL_COLUMNS = [
  { id: "deal", label: "Deal ID and Date" },
  { id: "followup", label: "Follow-up" },
  { id: "customer", label: "Customer details" },
  { id: "requirement", label: "Requirements" },
  { id: "validity", label: "Deal Validity" },
  { id: "assigned", label: "Staff Assignment" },
  { id: "status", label: "Deal Status" },
  { id: "state", label: "Status" },
  { id: "source", label: "Source" },
  { id: "category", label: "Categories" },
  { id: "location", label: "Location" },
] as const;
export type DealColumnId = (typeof DEAL_COLUMNS)[number]["id"];
