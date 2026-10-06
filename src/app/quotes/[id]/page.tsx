import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requirePageAccess } from '@/lib/auth';
import { todayDay } from '@/lib/leads/format';
import { quoteAbilities } from '@/lib/quotes/access';
import { documentOf } from '@/lib/quotes/doc-server';
import { originFromHeaders } from '@/lib/quotes/origin';
import { getQuote, listForSidebar, parseQuoteListParams } from '@/lib/quotes/service';
import { ServiceError } from '@/lib/users/service';
import QuoteView from '../QuoteView';

export const dynamic = 'force-dynamic';

// One quote with the list of quotes beside it. The list keeps the search and the view (Draft, Sent, ...) it was opened with.
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requirePageAccess(['quotes']);
  const { id } = await params;
  const sp = await searchParams;
  const listParams = parseQuoteListParams(sp);
  let found: Awaited<ReturnType<typeof getQuote>>;
  try {
    found = await getQuote(ctx, id, originFromHeaders(await headers()));
  } catch (err) {
    if (err instanceof ServiceError && err.status === 404) notFound();
    throw err;
  }
  const [list, doc] = await Promise.all([listForSidebar(ctx, listParams), documentOf(found.quote, found.layout, found.settings)]);
  return (
    <QuoteView
      key={found.quote.id}
      quote={found.quote}
      doc={doc}
      layout={found.layout}
      settings={found.settings}
      abilities={quoteAbilities(ctx)}
      list={list}
      params={listParams}
      salesOrders={found.salesOrders}
      openSend={sp.send === '1'}
      today={todayDay()}
    />
  );
}
