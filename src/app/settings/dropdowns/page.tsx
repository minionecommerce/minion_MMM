import { redirect } from 'next/navigation';
import { requirePageAccess } from '@/lib/auth';
import { getListSummaries } from '@/lib/dropdowns/service';
import DropdownManager from './DropdownManager';

export const dynamic = 'force-dynamic';

export default async function DropdownSettingsPage() {
  const ctx = await requirePageAccess(['settings']);
  // Only the Super Admin manages option lists (the API enforces the same rule)
  if (!ctx.isSuperAdmin) redirect('/unauthorized');
  const counts = await getListSummaries();
  return (
    <div className="w-full min-h-screen bg-[#0D0D0F] text-white px-4 sm:px-6 py-6">
      <div className="max-w-[1400px] mx-auto">
        <p className="text-[11px] font-bold tracking-widest text-yellow-400">SETTINGS</p>
        <h1 className="text-[26px] font-extrabold tracking-tight">Dropdown Options</h1>
        <p className="text-[13px] text-gray-400 mt-1 mb-6">Add, rename, reorder, set the default of, or delete the choices shown in dropdown fields across the CRM.</p>
        <DropdownManager counts={counts} />
      </div>
    </div>
  );
}
