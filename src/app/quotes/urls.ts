import type { QuoteListParams } from '@/lib/quotes/types';

// The query string of the list / split view for some search parameters, with a few of them changed.
// Anything but the page that changes starts again on page 1.
export function queryOf(p: Partial<QuoteListParams>, patch: Partial<Record<keyof QuoteListParams, string | number | undefined>> = {}): string {
  const merged: Record<string, string | number | undefined> = {
    q: p.q, status: p.status, sort: p.sort, dir: p.dir, page: p.page && p.page > 1 ? p.page : undefined, customer: p.customer, from: p.from, to: p.to,
  };
  const keys = Object.keys(patch);
  if (keys.length && !(keys.length === 1 && keys[0] === 'page')) merged.page = undefined;
  Object.assign(merged, patch);
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : '';
}
