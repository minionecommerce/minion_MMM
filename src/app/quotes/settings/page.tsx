import { requirePageAccess } from '@/lib/auth';
import { todayDay } from '@/lib/leads/format';
import { quoteAbilities } from '@/lib/quotes/access';
import { peekNumber } from '@/lib/quotes/numbering-server';
import { loadSettings } from '@/lib/quotes/settings';
import { companyImageUrls } from '@/lib/quotes/settings-files';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

// Quote Settings: how quotes are numbered, taxes, TDS / TCS, rounding, how amounts look, the company on the document, the messages.
// Everyone who can see quotes can read them; only a Super Admin can change them.
export default async function Page() {
  const ctx = await requirePageAccess(['quotes']);
  const settings = await loadSettings();
  const today = todayDay();
  const [images, next] = await Promise.all([companyImageUrls(settings.company), peekNumber(settings.numbering, today)]);
  return <SettingsClient settings={settings} images={images} nextNumber={next.number} today={today} abilities={quoteAbilities(ctx)} />;
}
