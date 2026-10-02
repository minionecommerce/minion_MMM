'use client';

import { useState } from 'react';
import { Calendar, Check, Download, FileInput, Filter, LayoutTemplate, Plus, RefreshCw } from 'lucide-react';
import type { LeadFormOptions } from '@/lib/leads/constants';
import type { LeadListParams } from '@/lib/leads/queries';

const iconBtn = 'w-10 h-10 flex items-center justify-center text-gray-800 hover:text-black hover:bg-gray-100 rounded transition-colors';
const field = 'w-full border border-gray-300 rounded px-3 py-2 text-[13px] text-gray-800 bg-white focus:outline-none focus:border-yellow-500';

export default function LeadHeader({ options, params, canCreate, canExport, canEditLayout, refreshing, onAdd, onEditLayout, onRefresh, onParams, exportHref }: {
  options: LeadFormOptions;
  params: LeadListParams;
  canCreate: boolean;
  canExport: boolean;
  canEditLayout: boolean; // Super Admin only
  refreshing: boolean;
  onAdd: () => void;
  onEditLayout: () => void;
  onRefresh: () => void;
  onParams: (u: Record<string, string | undefined>) => void;
  exportHref: string;
}) {
  const [panel, setPanel] = useState<'filter' | 'date' | null>(null);
  const toggle = (p: 'filter' | 'date') => setPanel(cur => (cur === p ? null : p));
  const activeFilters = [params.statusId, params.sourceId, params.assigneeId].filter(Boolean).length;
  const activeDates = [params.from, params.to].filter(Boolean).length;

  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-9 h-9 rounded-full bg-[#f5b800] flex items-center justify-center shrink-0"><Check className="w-5 h-5 text-white" strokeWidth={3} /></span>
        <h1 className="text-[26px] sm:text-[30px] font-medium text-[#3a3a3a] leading-tight">Lead &amp; Quote Management</h1>
      </div>

      <div className="relative flex items-center gap-1 sm:gap-2">
        {canCreate && (
          <button onClick={onAdd} title="Add New Lead" aria-label="Add New Lead" className="w-10 h-10 flex items-center justify-center border-2 border-[#f5b800] rounded-[3px] text-[#f5b800] hover:bg-[#fff8dc] transition-colors">
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          </button>
        )}
        {canEditLayout && (
          <button onClick={onEditLayout} title="Edit Page Layout" aria-label="Edit Page Layout" className={iconBtn}>
            <LayoutTemplate className="w-5 h-5" />
          </button>
        )}
        <button onClick={onRefresh} title="Refresh" aria-label="Refresh" className={iconBtn}><RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} /></button>
        <button onClick={() => toggle('filter')} title="Filter" aria-label="Filter" className={`${iconBtn} relative`}>
          <Filter className="w-5 h-5" fill="currentColor" />
          {activeFilters > 0 && <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#d9232b] text-white text-[10px] font-bold flex items-center justify-center">{activeFilters}</span>}
        </button>
        <button onClick={() => toggle('date')} title="Created date" aria-label="Created date" className={`${iconBtn} relative`}>
          <Calendar className="w-5 h-5" />
          {activeDates > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#d9232b]" />}
        </button>
        {canExport ? (
          <a href={exportHref} title="Download CSV" aria-label="Download CSV" className={iconBtn}><Download className="w-5 h-5" /></a>
        ) : (
          <span className={`${iconBtn} opacity-30 cursor-not-allowed`} title="You do not have permission to export"><Download className="w-5 h-5" /></span>
        )}
        <span className={`${iconBtn} opacity-30 cursor-not-allowed`} title="Import: coming soon" aria-disabled="true"><FileInput className="w-5 h-5" /></span>

        {panel === 'filter' && (
          <div className="absolute right-0 top-12 z-30 w-72 bg-white border border-gray-200 rounded-lg shadow-xl p-4 space-y-3">
            <div className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Filter leads</div>
            <label className="block text-[12px] text-gray-600">Lead Status
              <select className={`${field} mt-1`} value={params.statusId ?? ''} onChange={e => onParams({ status: e.target.value || undefined })}>
                <option value="">All</option>{options.leadStatuses.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </label>
            <label className="block text-[12px] text-gray-600">Source
              <select className={`${field} mt-1`} value={params.sourceId ?? ''} onChange={e => onParams({ source: e.target.value || undefined })}>
                <option value="">All</option>{options.sources.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </label>
            <label className="block text-[12px] text-gray-600">Task Assigned Person
              <select className={`${field} mt-1`} value={params.assigneeId ?? ''} onChange={e => onParams({ assignee: e.target.value || undefined })}>
                <option value="">All</option>{options.employees.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </label>
            {activeFilters > 0 && <button className="text-[12px] text-[#d9232b] font-semibold" onClick={() => onParams({ status: undefined, source: undefined, assignee: undefined })}>Clear filters</button>}
          </div>
        )}
        {panel === 'date' && (
          <div className="absolute right-0 top-12 z-30 w-72 bg-white border border-gray-200 rounded-lg shadow-xl p-4 space-y-3">
            <div className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Created date</div>
            <label className="block text-[12px] text-gray-600">From
              <input type="date" className={`${field} mt-1`} value={params.from ?? ''} max={params.to} onChange={e => onParams({ from: e.target.value || undefined })} />
            </label>
            <label className="block text-[12px] text-gray-600">To
              <input type="date" className={`${field} mt-1`} value={params.to ?? ''} min={params.from} onChange={e => onParams({ to: e.target.value || undefined })} />
            </label>
            {activeDates > 0 && <button className="text-[12px] text-[#d9232b] font-semibold" onClick={() => onParams({ from: undefined, to: undefined })}>Clear dates</button>}
          </div>
        )}
      </div>
    </div>
  );
}
