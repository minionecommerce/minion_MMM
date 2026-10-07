import { requirePageAccess } from '@/lib/auth';
import { quoteAbilities } from '@/lib/quotes/access';
import { ITEM_SORTS, listItems, type ItemListParams } from '@/lib/quotes/catalog';
import { loadSettings } from '@/lib/quotes/settings';
import ItemsClient from './ItemsClient';

export const dynamic = 'force-dynamic';

// Items: the Item Master. What can be picked on a quote comes from here (a quote keeps its own copy of the name and the rate it was saved with).
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requirePageAccess(['quotes']);
  const sp = await searchParams;
  const one = (k: string) => { const v = sp[k]; return Array.isArray(v) ? v[0] : v; };
  const filter = one('active');
  const kind = one('kind');
  const params: ItemListParams & { active: 'all' | 'active' | 'inactive' } = {
    q: (one('q') ?? '').trim().slice(0, 100) || undefined,
    page: Math.max(1, Math.min(100000, parseInt(one('page') ?? '1', 10) || 1)),
    active: filter === 'active' || filter === 'inactive' ? filter : 'all',
    kind: kind === 'Goods' || kind === 'Service' ? kind : undefined,
    sort: ITEM_SORTS.find(s => s === one('sort')),
    dir: one('dir') === 'desc' ? 'desc' : 'asc',
  };
  const [data, settings] = await Promise.all([listItems(ctx, params), loadSettings()]);
  return <ItemsClient data={data} params={params} taxes={settings.taxes} display={settings.display} abilities={quoteAbilities(ctx)} />;
}
