'use client';

import { LEAD_FILTERS, type LeadFilterId } from '@/lib/leads/constants';

// The Deals page passes its own buttons (Open Deal, Follow-up Deal, Revive Deal, Today Follow-up)
export default function LeadFilters({ active, onChange, filters = LEAD_FILTERS }: { active?: string; onChange: (id: LeadFilterId | undefined) => void; filters?: readonly { id: LeadFilterId; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {filters.map(f => {
        const on = active === f.id;
        return (
          <button
            key={f.id}
            onClick={() => onChange(on ? undefined : f.id)}
            aria-pressed={on}
            className={`h-[40px] px-4 rounded-[3px] border text-[14px] transition-colors ${on ? 'bg-[#fff3c4] border-[#f5b800] text-black font-semibold' : 'bg-white border-gray-300 text-[#333] hover:border-gray-500'}`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
