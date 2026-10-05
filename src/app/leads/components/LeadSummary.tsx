'use client';

const pill = 'inline-block px-2.5 py-0.5 rounded bg-[#fde8e8] text-[#d9232b] font-bold text-[14px]';

// The Total Leads number is a button: it shows every lead (onShowAll drops the search and filters). The Deals page says "Deals".
export default function LeadSummary({ total, showing, onShowAll, noun = 'Leads' }: { total: number; showing: number; onShowAll: () => void; noun?: string }) {
  const lower = noun.toLowerCase();
  return (
    <div className="flex flex-wrap lg:flex-nowrap items-center gap-x-3 gap-y-1 text-[14px] font-semibold text-[#333] lg:whitespace-nowrap shrink-0">
      <span>Total {noun}: <button type="button" onClick={onShowAll} title={`Show all ${lower}`} aria-label={`Show all ${total} ${lower}`} className={`${pill} cursor-pointer underline underline-offset-2 hover:bg-[#fbd0d0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f5b800]`}>{total}</button></span>
      <span className="text-gray-300">|</span>
      <span>Showing: <span className={pill}>{showing}</span></span>
    </div>
  );
}
