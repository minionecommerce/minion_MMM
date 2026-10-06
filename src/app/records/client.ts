// Browser helpers of the four record modules.
import { callApi, uploadToSignedUrl } from "@/lib/leads/client";
import { formatBytes } from "@/lib/leads/image-optimize";
import { ATTACHMENT_BLOCKED_HINT, isAttachmentAllowed } from "@/lib/leads/constants";
import { MAX_FILE_BYTES, MAX_FILE_MB, type FileDto, type LayoutField, type LookupItem } from "@/lib/records/types";
import { defaultFor } from "@/lib/records/values";

export const api = (slug: string, path = "") => `/api/records/${slug}${path}`;

// Sends one file straight to Storage: asks the server for a signed URL, uploads, then lets the server check what arrived.
// The returned file is only attached to a record when the form is saved.
export async function uploadRecordFile(slug: string, fieldKey: string, file: File): Promise<FileDto> {
  if (file.size === 0) throw new Error(`${file.name}: the file is empty`);
  if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name}: larger than ${MAX_FILE_MB} MB (it is ${formatBytes(file.size)})`);
  if (!isAttachmentAllowed(file.name)) throw new Error(`${file.name}: not allowed (${ATTACHMENT_BLOCKED_HINT})`);
  const signed = await callApi<{ id: string; uploadUrl: string }>(api(slug, "/uploads"), "POST", { fieldKey, name: file.name, type: file.type || "application/octet-stream", size: file.size });
  try {
    await uploadToSignedUrl(signed.uploadUrl, file);
  } catch {
    await callApi(api(slug, `/uploads/${signed.id}`), "DELETE").catch(() => {});
    throw new Error(`${file.name}: the upload failed. Please try again.`);
  }
  const done = await callApi<{ file: FileDto }>(api(slug, `/uploads/${signed.id}`), "PUT");
  return done.file;
}

export const discardRecordFile = (slug: string, id: string) => callApi(api(slug, `/uploads/${id}`), "DELETE").catch(() => {});

export type LookupKind = "deals" | "materialVendors" | "serviceVendors" | "customers" | "projects";
// What a lookup field offers: deals, vendors, customers, projects. `extra` narrows it (customerId: only the deals / projects of that customer).
export async function searchLookup(slug: string, kind: LookupKind, q: string, extra: Record<string, string> = {}): Promise<LookupItem[]> {
  const more = Object.entries(extra).map(([k, v]) => `&${k}=${encodeURIComponent(v)}`).join("");
  const res = await callApi<{ items: LookupItem[] }>(api(slug, `/lookups?kind=${kind}&q=${encodeURIComponent(q)}${more}`), "GET");
  return res.items;
}

// ---------------------------------------------------------------------------
// Form state <-> what the API takes
// ---------------------------------------------------------------------------
// Numbers are kept as typed text while editing; everything else as the API holds it
export type FormValues = Record<string, unknown>;

export function toFormValue(f: LayoutField, stored: unknown): unknown {
  if (f.type === "NUMBER" || f.type === "CURRENCY") return stored === null || stored === undefined ? "" : String(stored);
  if (stored === null || stored === undefined) return f.type === "FILE" ? [] : f.type === "CHECKBOX" ? false : "";
  return stored;
}

// A new record / row starts with the defaults of the layout
export function initialValue(f: LayoutField, me: { id: string } | null, nextCode: string): unknown {
  if (f.type === "AUTO") return nextCode;
  if (f.type === "DATETIME" && f.defaultValue === "@now") return ""; // filled in by the form once it is in the browser
  return toFormValue(f, defaultFor(f, me));
}

export function toPayloadValue(f: LayoutField, value: unknown): unknown {
  switch (f.type) {
    case "NUMBER":
    case "CURRENCY": {
      const s = typeof value === "string" ? value.trim() : value;
      if (s === "" || s === null || s === undefined) return null;
      const n = typeof s === "number" ? s : Number(s);
      return Number.isNaN(n) ? s : n; // a value that is not a number is sent as typed so the server explains it
    }
    case "FILE": return (value as FileDto[]).map(x => x.id);
    case "CHECKBOX": return value === true ? true : null;
    case "DROPDOWN":
    case "USER":
    case "LOOKUP":
    case "APPROVER":
    case "TEXT":
    case "TEXTAREA":
    case "EMAIL":
    case "PHONE":
    case "URL":
    case "DATE":
    case "DATETIME":
      return value === "" || value === undefined ? null : value;
    default: return value;
  }
}

export const isBlankValue = (f: LayoutField, value: unknown) =>
  f.type === "FILE" ? (value as unknown[]).length === 0 : f.type === "CHECKBOX" ? value !== true : value === "" || value === null || value === undefined;

export const newRowKey = () => `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
