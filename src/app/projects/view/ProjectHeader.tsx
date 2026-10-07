'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, FileText, LayoutTemplate, ListChecks, MoreHorizontal } from 'lucide-react';
import { Badge, projectStatusTone, useProject } from './common';

// Projects > MP1
export function Breadcrumb({ code }: { code: string }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-gray-500">
      <Link href="/projects" className="hover:text-gray-900 hover:underline">Projects</Link>
      <ChevronRight className="w-3.5 h-3.5 text-gray-400" aria-hidden />
      <span className="text-gray-700">{code}</span>
    </nav>
  );
}

// The Project Status next to the title: a coloured pill that is also the dropdown to change it (the choices are the options of the Project Status
// field in Edit Page Layout). A person who may not edit sees the pill only.
export function StatusPill() {
  const { detail, layout, canEdit, save } = useProject();
  const field = layout.fields.find(f => f.key === 'status');
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  if (!field || !field.enabled) return null;

  const stored = String(detail.values.status ?? '');
  const shown = pending ?? stored;
  const label = field.options.find(o => o.id === shown)?.label ?? '';
  const tone = projectStatusTone(shown);

  if (!canEdit) return label ? <Badge tone={tone}><span className="mr-1.5 inline-block w-2 h-2 rounded-full bg-current" aria-hidden />{label}</Badge> : null;

  const change = async (next: string) => {
    if (!next || next === stored) return;
    setPending(next);
    setError('');
    const message = await save('', { status: next });
    setPending(null);
    if (message) setError(message);
  };

  return (
    <div className="relative">
      <label className={`relative inline-flex items-center rounded-full border ${tone}`}>
        <span className="sr-only">Project Status</span>
        <span className="pointer-events-none absolute left-3 inline-block w-2 h-2 rounded-full bg-current" aria-hidden />
        <select
          value={field.options.some(o => o.id === shown) ? shown : ''}
          onChange={e => void change(e.target.value)}
          aria-label="Project Status"
          className="appearance-none cursor-pointer bg-transparent h-[30px] pl-7 pr-8 text-[13px] font-semibold focus:outline-none rounded-full"
        >
          {!field.options.some(o => o.id === shown) && <option value="">-None-</option>}
          {field.options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 w-3.5 h-3.5" aria-hidden />
      </label>
      {error && <p role="alert" className="absolute left-0 top-full mt-1 z-20 whitespace-nowrap rounded bg-white border border-[#f5c2c7] px-2 py-1 text-[12px] text-[#d9232b] shadow">{error}</p>}
    </div>
  );
}

// The three dots next to Edit: the deal of the project, the tasks page, and (Super Admin) Edit Page Layout
export function MoreMenu({ dealNumber, canLayout, onLayout }: { dealNumber: string; canLayout: boolean; onLayout: () => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node | null)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', key);
    };
  }, [open]);

  const item = 'flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[14px] text-gray-800 hover:bg-gray-50';
  return (
    <div ref={root} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open} aria-label="More actions" className="inline-flex items-center justify-center w-[38px] h-[34px] rounded-md border border-gray-300 bg-white text-gray-700 hover:border-gray-500">
        <MoreHorizontal className="w-5 h-5" aria-hidden />
      </button>
      {open && (
        <div role="menu" aria-label="More actions" className="absolute right-0 top-full mt-1 z-30 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-xl">
          <Link role="menuitem" href={`/deals?filter=converted&q=${encodeURIComponent(dealNumber)}`} onClick={() => setOpen(false)} className={item}><FileText className="w-4 h-4 text-gray-500" aria-hidden />View Deal {dealNumber}</Link>
          <Link role="menuitem" href="/tasks?type=project" onClick={() => setOpen(false)} className={item}><ListChecks className="w-4 h-4 text-gray-500" aria-hidden />Open Tasks</Link>
          {canLayout && <button type="button" role="menuitem" onClick={() => { setOpen(false); onLayout(); }} className={item}><LayoutTemplate className="w-4 h-4 text-gray-500" aria-hidden />Edit Page Layout</button>}
        </div>
      )}
    </div>
  );
}

// The tab bar: Overview, Project Value, Vendors, Payments, Tasks, Procurement. Left and Right move between the tabs.
export function Tabs<T extends string>({ tabs, active, onChange }: { tabs: { id: T; label: string }[]; active: T; onChange: (id: T) => void }) {
  const move = (e: React.KeyboardEvent, i: number) => {
    const next = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(tabs[next].id);
    document.getElementById(`project-tab-${tabs[next].id}`)?.focus();
  };
  return (
    <div role="tablist" aria-label="Project" className="mt-5 flex gap-1 overflow-x-auto border-b border-gray-200">
      {tabs.map((t, i) => (
        <button
          key={t.id}
          id={`project-tab-${t.id}`}
          role="tab"
          type="button"
          aria-selected={active === t.id}
          aria-controls="project-panel"
          tabIndex={active === t.id ? 0 : -1}
          onClick={() => onChange(t.id)}
          onKeyDown={e => move(e, i)}
          className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-[14px] ${active === t.id ? 'border-black font-bold text-black' : 'border-transparent font-medium text-gray-500 hover:text-gray-900'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
