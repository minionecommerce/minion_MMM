'use client';

import { CalendarDays } from 'lucide-react';
import type { DealRow } from '@/lib/deals/queries';
import DealIcon from '@/app/leads/components/DealIcon';
import { CustomerDetailsCell } from '@/app/leads/components/LeadCells';

// The cells that are specific to deals. Follow-up, Requirements (with the Amount = Deal Value), Staff Assignment, Status, Source,
// Categories and Location are the Leads page's own cells, reading the lead behind the deal.

// Deal ID and Date: the Deal ID, the Lead ID it came from, then when the deal and the lead were created
export function DealIdCell({ row }: { row: DealRow }) {
  return (
    <div className="min-w-0">
      <div className="text-[#d9232b] font-bold text-[14px]">{row.code}</div>
      <div className="mt-1 text-[12px] italic text-gray-600">Lead: {row.leadCode}</div>
      <div className="mt-3 text-[12px] text-gray-600"><span className="font-semibold text-gray-700">Deal Created:</span> {row.deal.created}</div>
      <div className="mt-1.5 text-[12px] text-gray-600"><span className="font-semibold text-gray-700">Lead Created:</span> {row.deal.leadCreated}</div>
    </div>
  );
}

// Customer details with the Deal Name above the customer, behind the Deal icon
export function DealCustomerCell({ row }: { row: DealRow }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-1.5 text-[13px] font-bold text-[#333]" title="Deal Name">
        <DealIcon className="w-[18px] h-[18px] mt-px text-[#d9232b]" /><span className="min-w-0 break-words">{row.deal.name}</span>
      </div>
      <CustomerDetailsCell row={row} />
    </div>
  );
}

// Deal Validity: the Closing Date typed when the lead was converted
export function DealValidityCell({ row }: { row: DealRow }) {
  return (
    <div className="flex items-center gap-1.5 text-[13px] text-[#333] whitespace-nowrap">
      <CalendarDays className="w-4 h-4 text-gray-500 shrink-0" aria-hidden="true" />{row.deal.validity ?? '—'}
    </div>
  );
}
