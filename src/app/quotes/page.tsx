import { requirePageAccess } from '@/lib/auth';
import { getLayout } from '@/lib/records/layout';
import { quoteAbilities } from '@/lib/quotes/access';
import { listQuotes, parseQuoteListParams } from '@/lib/quotes/service';
import { loadSettings } from '@/lib/quotes/settings';
import QuotesList from './QuotesList';

export const dynamic = 'force-dynamic';

// All Quotes: the list. The columns come from the Quote layout (Edit Page Layout), the numbers and money from Quote Settings.
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requirePageAccess(['quotes']);
  const params = parseQuoteListParams(await searchParams);
  const [layout, data, settings] = await Promise.all([getLayout('quote'), listQuotes(ctx, params), loadSettings()]);
  return <QuotesList layout={layout} data={data} params={params} abilities={quoteAbilities(ctx)} display={settings.display} />;
}
