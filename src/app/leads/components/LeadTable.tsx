'use client';

import { useRef, useState } from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import type { ColumnFilterKey, LeadSortKey } from '@/lib/leads/constants';
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

type FilterItem = { value: string; label: string };

function HeaderCell({ col, active, dir, filterItems, selected, onSort, onFilter, onReset }: {
  col: (typeof COLUMNS)[number];
  active: boolean;
  dir: 'asc' | 'desc';
  filterItems?: FilterItem[];
  selected: string[];
  onSort: (k: LeadSortKey, d: 'asc' | 'desc') => void;
  onFilter: (values: string[]) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [term, setTerm] = useState('');
  const [draft, setDraft] = useState<string[]>(selected);
  const btn = useRef<HTMLButtonElement>(null);
  const isActions = col.label === 'Actions';
  const filtered = selected.length > 0;

  const toggle = () => {
    if (!open && btn.current) {
      const r = btn.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.right - 256, window.innerWidth - 264)) });
      setDraft(selected);
      setTerm('');
    }
    setOpen(o => !o);
  };
  const close = () => setOpen(false);

  const items = filterItems ?? [];
  const shown = items.filter(i => i.label.toLowerCase().includes(term.trim().toLowerCase()));
  const allShownOn = shown.length > 0 && shown.every(i => draft.includes(i.value));
  const flip = (v: string) => setDraft(d => (d.includes(v) ? d.filter(x => x !== v) : [...d, v]));
  const toggleShown = () => setDraft(d => (allShownOn ? d.filter(v => !shown.some(i => i.value === v)) : [...new Set([...d, ...shown.map(i => i.value)])]));

  return (
    <th scope="col" className={`${col.width} relative px-3 py-3 text-left text-[13px] font-semibold text-[#333] align-middle ${isActions ? 'sticky right-0 z-20 bg-[#f3f4f6] shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.15)]' : ''}`} aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <div className="flex items-center justify-between gap-2">
        <span>{col.label}</span>
        {col.sort && (
          <button ref={btn} onClick={toggle} aria-label={`Sort or filter ${col.label}`} aria-haspopup="menu" aria-expanded={open} className={`w-5 h-5 rounded-sm flex items-center justify-center text-white ${active || filtered ? 'bg-[#f5b800]' : 'bg-[#6b7280] hover:bg-[#4b5563]'}`}>
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
        {isActions && (
          <button onClick={onReset} title="Reset search, filters and sorting" aria-label="Reset search, filters and sorting" className="w-6 h-6 rounded bg-[#f5b800] text-white flex items-center justify-center"><RotateCcw className="w-3.5 h-3.5" /></button>
        )}
      </div>
      {open && col.sort && (
        <>
          <div className="fixed inset-0 z-30" onClick={close} />
          <div role="menu" onKeyDown={e => { if (e.key === 'Escape') close(); }} style={{ top: pos.top, left: pos.left }} className="fixed z-40 w-64 bg-white border border-gray-200 rounded-lg shadow-xl py-1 font-normal">
            {(['asc', 'desc'] as const).map(d => (
              <button key={d} role="menuitem" className={`w-full text-left px-3 py-2 text-[13px] hover:bg-gray-100 ${active && dir === d ? 'text-[#b8860b] font-semibold' : 'text-gray-700'}`} onClick={() => { close(); onSort(col.sort!, d); }}>
                {d === 'asc' ? 'Sort A → Z / oldest' : 'Sort Z → A / newest'}
              </button>
            ))}
            {filterItems && (
              <div className="border-t border-gray-200 mt-1 pt-2 px-2">
                <input autoFocus value={term} onChange={e => setTerm(e.target.value)} placeholder={`Search ${col.label.toLowerCase()}...`} aria-label={`Search ${col.label}`} className="w-full h-8 px-2 border border-gray-300 rounded text-[13px] text-gray-800 focus:outline-none focus:border-[#f5b800]" />
                <label className="flex items-center gap-2 px-1 py-1.5 mt-1 text-[13px] text-gray-700 cursor-pointer border-b border-gray-100">
                  <input type="checkbox" checked={allShownOn} onChange={toggleShown} className="w-4 h-4 accent-[#f5b800]" />
                  <span className="font-semibold">{term.trim() ? 'Select all results' : 'Select all'}</span>
                </label>
                <ul className="max-h-52 overflow-y-auto">
                  {shown.map(i => (
                    <li key={i.value}>
                      <label className="flex items-start gap-2 px-1 py-1.5 text-[13px] text-gray-800 cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={draft.includes(i.value)} onChange={() => flip(i.value)} className="w-4 h-4 mt-0.5 accent-[#f5b800] shrink-0" />
                        <span className="break-words min-w-0">{i.label}</span>
                      </label>
                    </li>
                  ))}
                  {shown.length === 0 && <li className="px-1 py-3 text-[12px] text-gray-500">No matches</li>}
                </ul>
                <div className="flex items-center justify-between gap-2 py-2">
                  <button onClick={() => { close(); onFilter([]); }} disabled={!filtered && draft.length === 0} className="px-3 h-8 rounded text-[13px] text-gray-700 hover:bg-gray-100 disabled:opacity-40">Clear</button>
                  <button onClick={() => { close(); onFilter(draft); }} className="px-4 h-8 rounded bg-[#f5b800] text-black text-[13px] font-semibold hover:bg-[#e0a800]">Apply{draft.length ? ` (${draft.length})` : ''}</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </th>
  );
}

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">{title}</div>{children}</div>;
}

export default function LeadTable({ rows, sort, dir, abilities, loading, filterItems, selected, onSort, onFilter, onReset, handlersFor }: {
  rows: LeadRow[];
  sort?: LeadSortKey;
  dir: 'asc' | 'desc';
  abilities: Abilities;
  loading: boolean;
  filterItems: Record<ColumnFilterKey, FilterItem[]>;
  selected: Partial<Record<ColumnFilterKey, string[]>>;
  onSort: (k: LeadSortKey, d: 'asc' | 'desc') => void;
  onFilter: (k: ColumnFilterKey, values: string[]) => void;
  onReset: () => void;
  handlersFor: (row: LeadRow) => LeadActionHandlers;
}) {
  const activeSort = sort ?? 'lead';

  const anyFilter = Object.values(selected).some(v => v && v.length);
  if (rows.length === 0 && !anyFilter) {
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
              {COLUMNS.map(c => {
                const fk = c.sort && c.sort !== 'lead' ? (c.sort as ColumnFilterKey) : undefined;
                return <HeaderCell key={c.label} col={c} active={!!c.sort && c.sort === activeSort} dir={dir} filterItems={fk ? filterItems[fk] : undefined} selected={(fk && selected[fk]) || []} onSort={onSort} onFilter={v => fk && onFilter(fk, v)} onReset={onReset} />;
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={COLUMNS.length} className="py-16 text-center text-gray-500"><div className="text-[16px] font-semibold text-gray-700">No leads match these filters</div><div className="text-[13px] mt-1">Open a column filter to change it, or use the reset button in Actions.</div></td></tr>
            )}
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
