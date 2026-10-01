'use client';

import { Info } from 'lucide-react';

const pill = 'inline-block px-2.5 py-0.5 rounded bg-[#fde8e8] text-[#d9232b] font-bold text-[14px]';

export default function LeadSummary({ total, showing, repeated, repeatedActive, onRepeated }: {
  total: number; showing: number; repeated: number; repeatedActive: boolean; onRepeated: () => void;
}) {
  return (
    <div className="flex flex-wrap lg:flex-nowrap items-center gap-x-3 gap-y-1 text-[14px] font-semibold text-[#333] lg:whitespace-nowrap shrink-0">
      <span>Total Leads: <span className={pill}>{total}</span></span>
      <span className="text-gray-300">|</span>
      <span>Showing: <span className={pill}>{showing}</span></span>
      <span className="text-gray-300">|</span>
      <span>
        Repeated Numbers:{' '}
        <button onClick={onRepeated} className={`${pill} underline ${repeatedActive ? 'ring-2 ring-[#d9232b]' : ''}`} title="Show leads whose contact number appears more than once">{repeated}</button>
      </span>
      <span title="Repeated Numbers = contact numbers that appear on more than one lead. Click the number to see those leads." className="text-[#2f80ed]"><Info className="w-5 h-5" fill="currentColor" stroke="white" /></span>
    </div>
  );
}
