'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { DEAL_COLUMNS, type DealColumnId } from '@/lib/leads/constants';
import type { LeadFieldDto } from '@/lib/leads/layout-shared';
import OptionsEditor from '@/app/leads/components/OptionsEditor';
import { ColumnsReorder } from '@/app/leads/components/ReorderDialogs';

const ignore = () => {};

// Super Admin only: the Deals page's own settings, the choices of the Deal Status column and the order of the page's columns.
// (The Edit Deal form is the lead form, so its fields are set up in Edit Page Layout on the Leads page.)
export default function DealLayoutEditor({ statusField, columnOrder, onClose }: { statusField: LeadFieldDto; columnOrder: DealColumnId[]; onClose: () => void }) {
  const [reorder, setReorder] = useState(false);
  const [columns, setColumns] = useState(columnOrder);

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape' && !reorder) onClose(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="deal-layout-title" className="bg-white w-full sm:max-w-[720px] max-h-screen sm:max-h-[94vh] sm:rounded-lg shadow-2xl flex flex-col">
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 id="deal-layout-title" className="text-[19px] font-bold text-[#444]">Edit Deal Layout</h2>
            <p className="text-[12px] text-gray-500 mt-0.5">The Deal Status choices and the order of the columns on the Deals page.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setReorder(true)} className="hidden sm:block px-3 h-[36px] whitespace-nowrap rounded-md border border-gray-300 hover:border-gray-500 bg-white text-[13px] font-medium text-gray-800">Reorder Page Columns</button>
            <button onClick={onClose} aria-label="Close" className="text-gray-500 hover:text-black"><X className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-5 bg-gray-50 flex-1">
          <button onClick={() => setReorder(true)} className="sm:hidden mb-4 px-3 h-[34px] rounded-md border border-gray-300 bg-white text-[13px] font-medium text-gray-800">Reorder Page Columns</button>
          <div className="border border-dashed border-gray-300 rounded-lg bg-white p-4">
            <h3 className="text-[15px] font-bold text-[#333]">Deal Status</h3>
            <p className="text-[12px] text-gray-500 mt-0.5 mb-3">The choices in the Deal Status column and in Edit Deal. Add, rename, drag to reorder or delete them; every change is saved straight away.</p>
            <OptionsEditor field={statusField} parentField={null} onChanged={ignore} noun="deal" />
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-200 px-6 py-3 flex justify-end">
          <button onClick={onClose} className="px-6 h-[40px] rounded-md bg-black hover:bg-[#222] text-white text-[14px] font-medium">Close</button>
        </div>
      </div>

      {reorder && (
        <ColumnsReorder
          columns={columns.map(id => ({ id, label: DEAL_COLUMNS.find(c => c.id === id)?.label ?? id }))}
          endpoint="/api/deals/layout/columns"
          page="Deals"
          onSaved={order => setColumns(order as DealColumnId[])}
          onClose={() => setReorder(false)}
        />
      )}
    </div>
  );
}
