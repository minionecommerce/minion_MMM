'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Loader2, Search, X } from 'lucide-react';
import type { LookupItem } from '@/lib/records/types';

// "Click to select ..." field. It opens a search box over a list: the list is either given (the active users) or searched on the
// server as you type (deals, vendors). Selecting writes the id; the text shown is the label of what is selected.
export default function LookupSelect({ htmlId, value, shown, items, search, onChange, placeholder, disabled, invalid, required, ariaLabel, emptyText = 'Nothing found' }: {
  htmlId?: string;
  value: string | null;
  shown: string; // the text of the selected record (it may not be in the list: an inactive person, ...)
  items?: LookupItem[]; // a ready list, searched here
  search?: (q: string) => Promise<LookupItem[]>; // or searched on the server
  onChange: (id: string | null, item: LookupItem | null) => void;
  placeholder: string;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  ariaLabel: string;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [found, setFound] = useState<LookupItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  // A list that is given is filtered here; a searched one is asked for after a short pause
  const filtered = items ? items.filter(i => `${i.label} ${i.sub ?? ''}`.toLowerCase().includes(q.trim().toLowerCase())) : found;
  const results = items ? filtered : found;

  useEffect(() => {
    if (!open || !search) return;
    let live = true;
    const t = setTimeout(async () => {
      setBusy(true);
      setError('');
      try {
        const list = await search(q);
        if (live) { setFound(list); setActive(0); }
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : 'Could not load the list');
      } finally {
        if (live) setBusy(false);
      }
    }, q ? 250 : 0);
    return () => { live = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, open]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  const openList = () => {
    if (disabled) return;
    setQ('');
    setActive(0);
    setOpen(true);
    requestAnimationFrame(() => input.current?.focus());
  };
  const pick = (item: LookupItem) => { onChange(item.id, item); setOpen(false); };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(results.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[active]) pick(results[active]); }
  };

  return (
    <div ref={box} className="relative">
      <div className={`flex items-stretch border rounded bg-white ${disabled ? 'bg-gray-100' : ''} ${invalid ? 'border-red-500' : 'border-gray-300 focus-within:border-[#f5b800]'} ${required ? 'border-l-[3px] border-l-[#e5484d]' : ''}`}>
        <button id={htmlId} type="button" onClick={openList} disabled={disabled} aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} className="flex-1 min-w-0 h-[36px] px-3 flex items-center gap-2 text-left text-[14px] disabled:cursor-not-allowed">
          {!value && <Search className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />}
          <span className={`truncate ${value ? 'text-gray-900' : 'text-gray-400'}`}>{value ? shown || value : placeholder}</span>
        </button>
        {value && !disabled && (
          <button type="button" onClick={() => onChange(null, null)} aria-label={`Clear ${ariaLabel}`} className="w-8 flex items-center justify-center text-gray-400 hover:text-[#d9232b]"><X className="w-4 h-4" /></button>
        )}
        <span className="w-7 flex items-center justify-center text-gray-400 pointer-events-none"><ChevronDown className="w-4 h-4" /></span>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-40 bg-white border border-gray-200 rounded-lg shadow-xl" onKeyDown={onKey}>
          <div className="p-2 border-b border-gray-100 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" aria-hidden />
            <input ref={input} value={q} onChange={e => setQ(e.target.value)} placeholder="Search..." aria-label={`Search ${ariaLabel}`} aria-controls={listId} className="w-full h-9 pl-8 pr-8 border border-gray-300 rounded text-[14px] text-gray-900 focus:outline-none focus:border-[#f5b800]" />
            {busy && <Loader2 className="w-4 h-4 animate-spin text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />}
          </div>
          <ul id={listId} role="listbox" aria-label={ariaLabel} className="max-h-64 overflow-y-auto py-1">
            {error && <li className="px-3 py-3 text-[13px] text-[#d9232b]">{error}</li>}
            {!error && results.length === 0 && !busy && <li className="px-3 py-3 text-[13px] text-gray-500">{emptyText}</li>}
            {results.map((item, i) => (
              <li key={item.id} role="option" aria-selected={item.id === value}>
                <button type="button" onClick={() => pick(item)} onMouseEnter={() => setActive(i)} className={`w-full text-left px-3 py-2 flex items-start gap-2 ${i === active ? 'bg-[#fff8dc]' : ''} ${item.id === value ? 'font-semibold' : ''}`}>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] text-gray-900 truncate">{item.label}</span>
                    {item.sub && <span className="block text-[12px] text-gray-500 truncate">{item.sub}</span>}
                  </span>
                  {item.tag && <span className="shrink-0 mt-0.5 px-1.5 py-0.5 rounded bg-gray-100 text-[11px] text-gray-600">{item.tag}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
