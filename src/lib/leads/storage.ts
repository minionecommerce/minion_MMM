import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ServiceError } from "@/lib/users/service";

// Private Supabase Storage bucket. The browser never gets the service key: the server hands out
// short-lived signed upload URLs and signed read URLs after checking permissions.

export const BUCKET = process.env.LEAD_ATTACHMENTS_BUCKET || "lead-attachments";
export const READ_URL_SECONDS = 600;

let client: SupabaseClient | null = null;

export function isStorageConfigured() {
  return !!(storageUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function storageUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

function admin() {
  if (!isStorageConfigured()) {
    throw new ServiceError(503, "File storage is not configured yet. Ask your administrator to set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  client ??= createClient(storageUrl(), process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export async function createUploadUrl(path: string, bucket = BUCKET) {
  const { data, error } = await admin().storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("Storage createSignedUploadUrl failed:", error?.message);
    throw new ServiceError(502, "Could not prepare the upload. Please try again.");
  }
  return data.signedUrl;
}

// Returns what Storage actually holds (not what the browser claimed), or null if missing
export async function statObject(path: string, bucket = BUCKET): Promise<{ size: number; mimeType: string } | null> {
  const slash = path.lastIndexOf("/");
  const dir = path.slice(0, slash);
  const name = path.slice(slash + 1);
  const { data, error } = await admin().storage.from(bucket).list(dir, { search: name, limit: 5 });
  if (error) throw new ServiceError(502, "Could not verify the upload. Please try again.");
  const item = data?.find(o => o.name === name);
  if (!item) return null;
  const meta = (item.metadata ?? {}) as { size?: number; mimetype?: string };
  return { size: Number(meta.size ?? 0), mimeType: String(meta.mimetype ?? "") };
}

// First bytes of a stored object (a short range request), used to confirm an upload really is the image it claims to be
export async function readHead(path: string, bytes = 32, bucket = BUCKET): Promise<Uint8Array> {
  const { data, error } = await admin().storage.from(bucket).createSignedUrl(path, 60);
  if (error || !data) throw new ServiceError(502, "Could not verify the upload. Please try again.");
  const res = await fetch(data.signedUrl, { headers: { Range: `bytes=0-${bytes - 1}` }, cache: "no-store" });
  if (!res.ok) throw new ServiceError(502, "Could not verify the upload. Please try again.");
  return new Uint8Array((await res.arrayBuffer()).slice(0, bytes));
}

export async function removeObjects(paths: string[], bucket = BUCKET) {
  if (!paths.length) return;
  const { error } = await admin().storage.from(bucket).remove(paths);
  if (error) console.error("Failed to remove storage objects", error.message);
}

export async function createReadUrls(paths: string[], bucket = BUCKET): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!paths.length || !isStorageConfigured()) return out;
  const { data, error } = await admin().storage.from(bucket).createSignedUrls(paths, READ_URL_SECONDS);
  if (error || !data) return out;
  for (const item of data) if (item.path && item.signedUrl) out.set(item.path, item.signedUrl);
  return out;
}
