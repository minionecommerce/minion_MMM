import { requirePageAccess } from '@/lib/auth';
import { todayDay } from '@/lib/leads/format';
import { getLayout } from '@/lib/records/layout';
import { activeUsers } from '@/lib/records/lookups';
import { quoteAbilities } from '@/lib/quotes/access';
import { peekNumber } from '@/lib/quotes/numbering-server';
import { loadSettings } from '@/lib/quotes/settings';
import QuoteForm from '../QuoteForm';

export const dynamic = 'force-dynamic';

// New Quote: the form follows the Quote layout (Edit Page Layout); numbers, taxes and rounding come from Quote Settings.
export default async function Page() {
  const ctx = await requirePageAccess(['quotes'], 'create');
  const today = todayDay();
  const settings = await loadSettings();
  const [layout, users, next] = await Promise.all([getLayout('quote'), activeUsers(), peekNumber(settings.numbering, today)]);
  return (
    <QuoteForm
      key="new"
      mode="create"
      layout={layout}
      settings={settings}
      nextNumber={next.number}
      users={users}
      me={{ id: ctx.userId, name: ctx.name ?? '' }}
      abilities={quoteAbilities(ctx)}
      today={today}
    />
  );
}
