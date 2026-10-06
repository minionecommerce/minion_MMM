import { notFound, redirect } from 'next/navigation';
import { requirePageAccess } from '@/lib/auth';
import { todayDay } from '@/lib/leads/format';
import { activeUsers } from '@/lib/records/lookups';
import { quoteAbilities } from '@/lib/quotes/access';
import { getQuote } from '@/lib/quotes/service';
import { ServiceError } from '@/lib/users/service';
import QuoteForm from '../../QuoteForm';

export const dynamic = 'force-dynamic';

// Edit Quote. An invoiced quote is read-only.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePageAccess(['quotes'], 'edit');
  const { id } = await params;
  let found: Awaited<ReturnType<typeof getQuote>>;
  try {
    found = await getQuote(ctx, id);
  } catch (err) {
    if (err instanceof ServiceError && err.status === 404) notFound();
    throw err;
  }
  if (found.quote.status === 'Invoiced') redirect(`/quotes/${id}`);
  const users = await activeUsers();
  return (
    <QuoteForm
      key={found.quote.id}
      mode="edit"
      layout={found.layout}
      settings={found.settings}
      quote={found.quote}
      nextNumber={found.quote.quoteNumber}
      users={users}
      me={{ id: ctx.userId, name: ctx.name ?? '' }}
      abilities={quoteAbilities(ctx)}
      today={todayDay()}
    />
  );
}
