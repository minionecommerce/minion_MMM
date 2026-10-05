'use client';

import { useRef, useState } from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';

// A column of a list table. `sort` is the key it sorts by; `filter` names its tick-box filter when that differs (a column that can be filtered but not sorted)
export type HeaderColumn<S extends string = string> = { label: string; sort?: S; filter?: string; width: string };

// Header cell shared by the Leads and Deals tables: the column name and, when the column can be sorted or filtered, a menu with
// "Sort A → Z / Z → A" and tick-box filters (several groups for a column like Staff Assignment). The Actions column gets the reset button.
type FilterItem = { value: string; label: string };
export type FilterGroup<F extends string = string> = { key: F; label: string; items: FilterItem[]; selected: string[] };
type Draft<F extends string> = Partial<Record<F, string[]>>;

export default function HeaderCell<S extends string, F extends string>({ col, active, dir, groups, onSort, onFilter, onReset }: {
  col: HeaderColumn<S>;
  active: boolean;
  dir: 'asc' | 'desc';
  groups: FilterGroup<F>[];
  onSort: (k: S, d: 'asc' | 'desc') => void;
  onFilter: (next: Draft<F>) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [term, setTerm] = useState('');
  const [draft, setDraft] = useState<Draft<F>>({});
  const [expanded, setExpanded] = useState<F | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const isActions = col.label === 'Actions';
  const filtered = groups.some(g => g.selected.length > 0);
  const multi = groups.length > 1; // e.g. Staff Assignment: Task Assigned Person + Lead Person
  const hasMenu = !!col.sort || groups.length > 0; // Status can be filtered but not sorted

  const toggle = () => {
    if (!open && btn.current) {
      const r = btn.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.right - 256, window.innerWidth - 264)) });
      setDraft(Object.fromEntries(groups.map(g => [g.key, g.selected])) as Draft<F>);
      setTerm('');
      setExpanded(null);
    }
    setOpen(o => !o);
  };
  const close = () => setOpen(false);

  const chosen = (g: FilterGroup<F>) => draft[g.key] ?? [];
  const shownOf = (g: FilterGroup<F>) => g.items.filter(i => i.label.toLowerCase().includes(term.trim().toLowerCase()));
  const flip = (g: FilterGroup<F>, v: string) => setDraft(d => { const cur = d[g.key] ?? []; return { ...d, [g.key]: cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v] }; });
  const selectShown = (g: FilterGroup<F>) => setDraft(d => ({ ...d, [g.key]: [...new Set([...(d[g.key] ?? []), ...shownOf(g).map(i => i.value)])] }));
  const toggleShown = (g: FilterGroup<F>) => {
    const shown = shownOf(g);
    const all = shown.length > 0 && shown.every(i => chosen(g).includes(i.value));
    setDraft(d => ({ ...d, [g.key]: all ? (d[g.key] ?? []).filter(v => !shown.some(i => i.value === v)) : [...new Set([...(d[g.key] ?? []), ...shown.map(i => i.value)])] }));
  };
  const clearGroup = (g: FilterGroup<F>) => setDraft(d => ({ ...d, [g.key]: [] }));
  const total = groups.reduce((n, g) => n + chosen(g).length, 0);

  const list = (g: FilterGroup<F>) => {
    const shown = shownOf(g);
    return (
      <>
        <input autoFocus={!multi} value={term} onChange={e => setTerm(e.target.value)} placeholder={`Search ${g.label.toLowerCase()}...`} aria-label={`Search ${g.label}`} className="w-full h-8 px-2 border border-gray-300 rounded text-[13px] text-gray-800 focus:outline-none focus:border-[#f5b800]" />
        {!multi && (
          <label className="flex items-center gap-2 px-1 py-1.5 mt-1 text-[13px] text-gray-700 cursor-pointer border-b border-gray-100">
            <input type="checkbox" checked={shown.length > 0 && shown.every(i => chosen(g).includes(i.value))} onChange={() => toggleShown(g)} className="w-4 h-4 accent-[#f5b800]" />
            <span className="font-semibold">{term.trim() ? 'Select all results' : 'Select all'}</span>
          </label>
        )}
        <ul className="max-h-52 overflow-y-auto">
          {shown.map(i => (
            <li key={i.value}>
              <label className="flex items-start gap-2 px-1 py-1.5 text-[13px] text-gray-800 cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={chosen(g).includes(i.value)} onChange={() => flip(g, i.value)} className="w-4 h-4 mt-0.5 accent-[#f5b800] shrink-0" />
                <span className="break-words min-w-0">{i.label}</span>
              </label>
            </li>
          ))}
          {shown.length === 0 && <li className="px-1 py-3 text-[12px] text-gray-500">No matches</li>}
        </ul>
      </>
    );
  };

  return (
    <th scope="col" className={`${col.width} relative px-3 py-3 text-left text-[13px] font-semibold text-[#333] align-middle ${isActions ? 'sticky right-0 z-20 bg-[#f3f4f6] shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.15)]' : ''}`} aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <div className="flex items-center justify-between gap-2">
        <span>{col.label}</span>
        {hasMenu && (
          <button ref={btn} onClick={toggle} aria-label={`${col.sort ? 'Sort or filter' : 'Filter'} ${col.label}`} aria-haspopup="menu" aria-expanded={open} className={`w-5 h-5 rounded-sm flex items-center justify-center text-white ${active || filtered ? 'bg-[#f5b800]' : 'bg-[#6b7280] hover:bg-[#4b5563]'}`}>
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
        {isActions && (
          <button onClick={onReset} title="Reset search, filters and sorting" aria-label="Reset search, filters and sorting" className="w-6 h-6 rounded bg-[#f5b800] text-white flex items-center justify-center"><RotateCcw className="w-3.5 h-3.5" /></button>
        )}
      </div>
      {open && hasMenu && (
        <>
          <div className="fixed inset-0 z-30" onClick={close} />
          <div role="menu" onKeyDown={e => { if (e.key === 'Escape') close(); }} style={{ top: pos.top, left: pos.left }} className="fixed z-40 w-64 bg-white border border-gray-200 rounded-lg shadow-xl py-1 font-normal">
            {!multi && col.sort && (['asc', 'desc'] as const).map(d => (
              <button key={d} role="menuitem" className={`w-full text-left px-3 py-2 text-[13px] hover:bg-gray-100 ${active && dir === d ? 'text-[#b8860b] font-semibold' : 'text-gray-700'}`} onClick={() => { close(); onSort(col.sort!, d); }}>
                {d === 'asc' ? 'Sort A → Z / oldest' : 'Sort Z → A / newest'}
              </button>
            ))}
            {groups.length > 0 && (
              <div className={`${multi || !col.sort ? '' : 'border-t border-gray-200 mt-1 '}pt-2 px-2`}>
                {multi ? (
                  <div className="space-y-1">
                    {groups.map(g => {
                      const isOpen = expanded === g.key;
                      return (
                        <div key={g.key} className="border border-gray-200 rounded">
                          <div className="flex items-center gap-1.5 px-2 py-1.5">
                            <button type="button" aria-expanded={isOpen} onClick={() => { setExpanded(isOpen ? null : g.key); setTerm(''); }} className="flex-1 min-w-0 text-left text-[13px] font-semibold text-gray-800">
                              {g.label}{chosen(g).length > 0 && <span className="ml-1 text-[#b8860b]">({chosen(g).length})</span>}
                            </button>
                            <button type="button" onClick={() => selectShown(g)} className="px-1.5 h-5 rounded-sm bg-[#f5b800] text-black text-[10px] font-semibold leading-none">Select All</button>
                            <button type="button" onClick={() => clearGroup(g)} className="px-1.5 h-5 rounded-sm bg-[#d9232b] text-white text-[10px] font-semibold leading-none">Clear</button>
                            <button type="button" aria-label={isOpen ? `Collapse ${g.label}` : `Expand ${g.label}`} onClick={() => { setExpanded(isOpen ? null : g.key); setTerm(''); }} className="text-gray-500 shrink-0"><ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? '' : '-rotate-90'}`} /></button>
                          </div>
                          {isOpen && <div className="px-2 pb-2">{list(g)}</div>}
                        </div>
                      );
                    })}
                  </div>
                ) : list(groups[0])}
                <div className="flex items-center justify-between gap-2 py-2">
                  <button onClick={() => { close(); onFilter(Object.fromEntries(groups.map(g => [g.key, []])) as unknown as Draft<F>); }} disabled={!filtered && total === 0} className="px-3 h-8 rounded text-[13px] text-gray-700 hover:bg-gray-100 disabled:opacity-40">Clear</button>
                  <button onClick={() => { close(); onFilter(draft); }} className="px-4 h-8 rounded bg-[#f5b800] text-black text-[13px] font-semibold hover:bg-[#e0a800]">Apply{total ? ` (${total})` : ''}</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </th>
  );
}
