'use client';

import { useState } from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import type { LeadSortKey } from '@/lib/leads/constants';
import type { LeadRow } from '@/lib/leads/queries';
import LeadActions, { type LeadActionHandlers } from './LeadActions';
import { CategoryCell, CustomerDetailsCell, FollowUpCell, LeadIdCell, LeadStatusCell, LocationCell, RequirementsCell, SourceCell, StaffAssignmentCell, StatusCell } from './LeadCells';

type Abilities = { create: boolean; edit: boolean; delete: boolean };

const COLUMNS: { label: string; sort?: LeadSortKey; width: string }[] = [
  { label: 'Lead ID & Date', sort: 'lead', width: 'w-[150px]' },
  { label: 'Customer details', sort: 'customer', width: 'w-[190px]' },
  { label: 'Requirements', sort: 'requirement', width: 'w-[270px]' },
  { label: 'Staff Assignment', sort: 'assigned', width: 'w-[130px]' },
  { label: 'Lead Status', sort: 'status', width: 'w-[215px]' },
  { label: 'Follow-up', width: 'w-[115px]' },
  { label: 'Status', width: 'w-[140px]' },
  { label: 'Source', sort: 'source', width: 'w-[110px]' },
  { label: 'Categories', sort: 'category', width: 'w-[200px]' },
  { label: 'Location', sort: 'location', width: 'w-[210px]' },
  { label: 'Actions', width: 'w-[110px]' },
];

function HeaderCell({ col, active, dir, onSort, onReset }: { col: (typeof COLUMNS)[number]; active: boolean; dir: 'asc' | 'desc'; onSort: (k: LeadSortKey, d: 'asc' | 'desc') => void; onReset: () => void }) {
  const [open, setOpen] = useState(false);
  const isActions = col.label === 'Actions';
  return (
    <th scope="col" className={`${col.width} relative px-3 py-3 text-left text-[13px] font-semibold text-[#333] align-middle ${isActions ? 'sticky right-0 z-20 bg-[#f3f4f6] shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.15)]' : ''}`} aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <div className="flex items-center justify-between gap-2">
        <span>{col.label}</span>
        {col.sort && (
          <button onClick={() => setOpen(o => !o)} aria-label={`Sort by ${col.label}`} aria-haspopup="menu" aria-expanded={open} className={`w-5 h-5 rounded-sm flex items-center justify-center text-white ${active ? 'bg-[#f5b800]' : 'bg-[#6b7280] hover:bg-[#4b5563]'}`}>
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
        {isActions && (
          <button onClick={onReset} title="Reset search, filters and sorting" aria-label="Reset search, filters and sorting" className="w-6 h-6 rounded bg-[#f5b800] text-white flex items-center justify-center"><RotateCcw className="w-3.5 h-3.5" /></button>
        )}
      </div>
      {open && col.sort && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div role="menu" className="absolute right-2 top-10 z-40 w-40 bg-white border border-gray-200 rounded-lg shadow-xl py-1 font-normal">
            {(['asc', 'desc'] as const).map(d => (
              <button key={d} role="menuitem" className={`w-full text-left px-3 py-2 text-[13px] hover:bg-gray-100 ${active && dir === d ? 'text-[#b8860b] font-semibold' : 'text-gray-700'}`} onClick={() => { setOpen(false); onSort(col.sort!, d); }}>
                {d === 'asc' ? 'Sort A → Z / oldest' : 'Sort Z → A / newest'}
              </button>
            ))}
          </div>
        </>
      )}
    </th>
  );
}

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">{title}</div>{children}</div>;
}

export default function LeadTable({ rows, sort, dir, abilities, loading, onSort, onReset, handlersFor }: {
  rows: LeadRow[];
  sort?: LeadSortKey;
  dir: 'asc' | 'desc';
  abilities: Abilities;
  loading: boolean;
  onSort: (k: LeadSortKey, d: 'asc' | 'desc') => void;
  onReset: () => void;
  handlersFor: (row: LeadRow) => LeadActionHandlers;
}) {
  const activeSort = sort ?? 'lead';

  if (rows.length === 0) {
    return (
      <div className="py-20 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg">
        <div className="text-[16px] font-semibold text-gray-700">No leads found</div>
        <div className="text-[13px] mt-1">Try a different search or clear the filters{abilities.create ? ', or add a new lead with the + button' : ''}.</div>
      </div>
    );
  }

  return (
    <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-[1700px] w-full border-collapse">
          <thead className="bg-[#f3f4f6]">
            <tr>
              {COLUMNS.map(c => <HeaderCell key={c.label} col={c} active={!!c.sort && c.sort === activeSort} dir={dir} onSort={onSort} onReset={onReset} />)}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className="border-b border-gray-200 align-middle hover:bg-[#fafafa]">
                <td className="px-3 py-5 align-middle"><LeadIdCell row={row} /></td>
                <td className="px-3 py-5 align-middle"><CustomerDetailsCell row={row} /></td>
                <td className="px-3 py-5 align-top"><RequirementsCell row={row} /></td>
                <td className="px-3 py-5 align-middle"><StaffAssignmentCell row={row} /></td>
                <td className="px-3 py-5 align-middle"><LeadStatusCell row={row} canEdit={abilities.edit} /></td>
                <td className="px-3 py-5 align-middle"><FollowUpCell /></td>
                <td className="px-3 py-5 align-middle"><StatusCell rate={row.conventionalRate} /></td>
                <td className="px-3 py-5 align-middle"><SourceCell row={row} /></td>
                <td className="px-3 py-5 align-middle"><CategoryCell row={row} /></td>
                <td className="px-3 py-5 align-middle"><LocationCell row={row} /></td>
                <td className="px-3 py-5 align-middle sticky right-0 z-10 bg-white shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.15)]"><LeadActions canEdit={abilities.edit} canCreate={abilities.create} canDelete={abilities.delete} handlers={handlersFor(row)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tablet / phone cards */}
      <div className="lg:hidden space-y-4">
        {rows.map(row => (
          <article key={row.id} className="border border-gray-200 rounded-lg p-4 space-y-4 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <LeadIdCell row={row} />
              <LeadActions canEdit={abilities.edit} canCreate={abilities.create} canDelete={abilities.delete} handlers={handlersFor(row)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CardSection title="Customer details"><CustomerDetailsCell row={row} /></CardSection>
              <CardSection title="Staff Assignment"><StaffAssignmentCell row={row} /></CardSection>
              <CardSection title="Requirements"><RequirementsCell row={row} /></CardSection>
              <CardSection title="Lead Status"><LeadStatusCell row={row} canEdit={abilities.edit} /></CardSection>
              <CardSection title="Categories"><CategoryCell row={row} /></CardSection>
              <CardSection title="Location"><LocationCell row={row} /></CardSection>
              <CardSection title="Source"><SourceCell row={row} /></CardSection>
              <div className="flex gap-6"><CardSection title="Follow-up"><FollowUpCell /></CardSection><CardSection title="Status"><StatusCell rate={row.conventionalRate} /></CardSection></div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
