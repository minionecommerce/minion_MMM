// Browser helper for the Leads module.
export async function callApi<T = Record<string, unknown>>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const details = Array.isArray(data.details) ? data.details.map((d: { path: string; message: string }) => d.message).join("; ") : "";
    throw new ApiError(details || data.error || `Request failed (${res.status})`, res.status, data.details, data);
  }
  return data as T;
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public details?: { path: string; message: string }[], public body?: { code?: string; usage?: number; action?: string }) {
    super(message);
  }
}
