'use client';

import { Search } from 'lucide-react';

export default function LeadSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative w-full lg:w-[280px] shrink-0">
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search leads..."
        aria-label="Search leads"
        className="w-full h-[44px] border-2 border-gray-200 rounded px-3.5 pr-10 text-[14px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#f5b800] bg-white"
      />
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none" />
    </div>
  );
}
