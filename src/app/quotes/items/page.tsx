import { redirect } from 'next/navigation';

// The Items module has its own place in the navigator now (/items); old links and bookmarks come here
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) { const x = Array.isArray(v) ? v[0] : v; if (x) query.set(k, x); }
  const s = query.toString();
  redirect(s ? `/items?${s}` : '/items');
}
