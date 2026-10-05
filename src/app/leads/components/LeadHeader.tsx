'use client';

import { Check } from 'lucide-react';

// Page title. The action icons (add, filter, refresh, ...) live in LeadToolbar, on the row below.
export default function LeadHeader({ title = 'Lead & Quote Management' }: { title?: string }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <span className="w-9 h-9 rounded-full bg-[#f5b800] flex items-center justify-center shrink-0"><Check className="w-5 h-5 text-white" strokeWidth={3} /></span>
      <h1 className="text-[26px] sm:text-[30px] font-medium text-[#3a3a3a] leading-tight">{title}</h1>
    </div>
  );
}
