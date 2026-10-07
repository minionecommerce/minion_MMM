'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FieldOption } from '@/lib/records/types';

type Place = { left: number; width: number; top?: number; bottom?: number };

// Several choices out of the options of a field (a Multi-select field of Edit Page Layout). The list opens under the button and is fixed to
// the window, so the scroll box of a table does not cut it off. The ticks are kept here while the list is open; the choices are handed
// to onChange once, when it closes (a click elsewhere, Escape, Tab, scrolling), so one change is one save.
export default function MultiSelect({ htmlId, label, options, value, onChange, className, describe }: {
  htmlId: string;
  label: string;
  options: FieldOption[];
  value: string[]; // the ids that are chosen
  onChange: (value: string[]) => void; // the ids that are chosen now, in the order of the options
  className: string; // the look of the closed control: the same as the other inputs
  describe?: { 'aria-invalid'?: boolean; 'aria-describedby'?: string };
}) {
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);
  const [ticked, setTicked] = useState<string[]>(value);
  const root = useRef<HTMLDivElement>(null);

  // What the record holds now is what the closed control shows
  const held = value.join('|');
  const [seen, setSeen] = useState(held);
  if (seen !== held && !open) {
    setSeen(held);
    setTicked(value);
  }

  const inOrder = useCallback((ids: string[]) => options.filter(o => ids.includes(o.id)).map(o => o.id), [options]);
  const names = options.filter(o => (open ? ticked : value).includes(o.id)).map(o => o.label);

  const finish = useCallback(() => {
    setOpen(false);
    const next = inOrder(ticked);
    if (next.join('|') !== value.join('|')) onChange(next);
  }, [inOrder, ticked, value, onChange]);

  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => { if (!root.current?.contains(e.target as Node | null)) finish(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); finish(); } };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', key, true);
    window.addEventListener('scroll', away, true); // the page moves under a list that is fixed to the window
    window.addEventListener('resize', finish);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', key, true);
      window.removeEventListener('scroll', away, true);
      window.removeEventListener('resize', finish);
    };
  }, [open, finish]);

  const openList = (button: HTMLElement) => {
    const r = button.getBoundingClientRect();
    const width = Math.max(r.width, 220);
    const left = Math.min(r.left, Math.max(8, window.innerWidth - width - 8));
    const below = window.innerHeight - r.bottom;
    setPlace(below < 230 && r.top > below ? { left, width, bottom: window.innerHeight - r.top + 4 } : { left, width, top: r.bottom + 4 });
    setTicked(value);
    setOpen(true);
  };

  const toggle = (id: string) => setTicked(inOrder(ticked.includes(id) ? ticked.filter(x => x !== id) : [...ticked, id]));

  return (
    <div ref={root} onBlur={e => { if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) finish(); }}>
      <button
        type="button"
        id={htmlId}
        onClick={e => (open ? finish() : openList(e.currentTarget))}
        onKeyDown={e => { if (e.key === 'Enter') e.stopPropagation(); }}
        aria-haspopup="true"
        aria-expanded={open}
        title={names.join(', ') || undefined}
        className={`${className} flex items-center justify-between gap-2 text-left`}
        {...describe}
      >
        <span className={`truncate ${names.length ? '' : 'text-gray-400'}`}>{names.length ? names.join(', ') : '-None-'}</span>
        <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" aria-hidden />
      </button>
      {open && place && (
        <div
          role="group"
          aria-label={label}
          onMouseDown={e => e.preventDefault()}
          style={{ position: 'fixed', left: place.left, width: place.width, top: place.top, bottom: place.bottom }}
          className="z-[100] max-h-[220px] overflow-y-auto rounded border border-gray-300 bg-white shadow-lg py-1"
        >
          {options.length === 0 && <p className="px-3 py-2 text-[13px] text-gray-500">No options yet. A Super Admin adds them in Edit Page Layout.</p>}
          {options.map(o => (
            <label key={o.id} className="flex items-center gap-2.5 px-3 py-1.5 text-[14px] text-gray-800 hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={ticked.includes(o.id)} onChange={() => toggle(o.id)} className="w-4 h-4 accent-black shrink-0" />
              <span className="min-w-0 break-words">{o.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
