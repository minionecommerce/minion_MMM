'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { callApi } from '@/lib/leads/client';
import { SECTION_LABELS, type DashboardLayout } from '@/lib/dashboard/types';

type Row = { key: string; visible: boolean };

const CARD_LABELS: Record<string, string> = {
  productSales: 'Total Product Sales', projects: 'Total Projects', projectValue: 'Total Project Value', quotes: 'Total Quotes', acceptedQuotes: 'Accepted Quotes',
  declinedQuotes: 'Declined Quotes', leadsAssigned: 'Lead Assigned', newLeads: 'New Leads', followUpLeads: 'Follow-Up Leads', closedLeads: 'Closed Leads',
  followUpDeals: 'Follow-Up Deals', closedDeals: 'Closed Deals', dealsConverted: 'Deals Converted to Projects', pendingTasks: 'Pending Tasks',
  completedTasks: 'Completed Tasks', siteVisitsToday: "Today's Site Visits",
};
const CHART_LABELS: Record<string, string> = { deal: 'Deal Status', lead: 'Lead Status', quote: 'Quote Status' };
const TODAY_LABELS: Record<string, string> = { leads: "Today's Leads", tasks: "Today's Tasks", siteVisits: "Today's Site Visits", deals: "Today's Deals" };

function List({ title, rows, labels, onChange, disabled }: { title: string; rows: Row[]; labels: Record<string, string>; onChange: (rows: Row[]) => void; disabled: boolean }) {
  const move = (i: number, d: -1 | 1) => { const next = rows.slice(); const j = i + d; if (j < 0 || j >= next.length) return; [next[i], next[j]] = [next[j], next[i]]; onChange(next); };
  const toggle = (i: number) => onChange(rows.map((r, n) => (n === i ? { ...r, visible: !r.visible } : r)));
  return (
    <fieldset className="mt-5" disabled={disabled}>
      <legend className="mb-1.5 text-[13px] font-semibold uppercase tracking-wide text-[#6B7280]">{title}</legend>
      <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
        {rows.map((r, i) => (
          <li key={r.key} className="flex items-center gap-2 px-3 py-2 text-[14px]">
            <span className={`min-w-0 flex-1 truncate ${r.visible ? 'text-[#111827]' : 'text-gray-400 line-through'}`}>{labels[r.key] ?? r.key}</span>
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${labels[r.key] ?? r.key} up`} className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label={`Move ${labels[r.key] ?? r.key} down`} className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
            <button type="button" onClick={() => toggle(i)} aria-pressed={r.visible} aria-label={`${r.visible ? 'Hide' : 'Show'} ${labels[r.key] ?? r.key}`} className="rounded p-1 text-gray-500 hover:bg-gray-100">{r.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

// Edit Page Layout of My Dashboard (Super Admin): the order of the sections and of the cards, charts and lists inside them, and which are shown.
// The layout is the same for everyone.
export default function LayoutEditor({ layout, onClose, onSaved }: { layout: DashboardLayout; onClose: () => void; onSaved: (layout: DashboardLayout) => void }) {
  const [draft, setDraft] = useState<DashboardLayout>(layout);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true);
    setError('');
    try { onSaved(await callApi<DashboardLayout>('/api/dashboard/layout', 'PUT', draft)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save the layout'); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/50 p-0 sm:items-center sm:p-4" onMouseDown={e => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="dl-title" onKeyDown={e => { if (e.key === 'Escape' && !saving) onClose(); }}
        className="flex max-h-screen w-full flex-col bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-[560px] sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 id="dl-title" className="text-[20px] font-bold text-[#111827]">Edit Page Layout</h2>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="text-gray-400 hover:text-black"><X className="h-6 w-6" /></button>
        </div>
        <div className="overflow-y-auto px-5 pb-5">
          <p className="mt-4 text-[13px] text-[#6B7280]">Move a section or a card up or down to change where it sits, and use the eye to show or hide it. This layout is the same for everyone.</p>
          <List title="Sections" rows={draft.sections} labels={SECTION_LABELS} disabled={saving} onChange={sections => setDraft({ ...draft, sections: sections as DashboardLayout['sections'] })} />
          <List title="Summary cards" rows={draft.cards} labels={CARD_LABELS} disabled={saving} onChange={cards => setDraft({ ...draft, cards: cards as DashboardLayout['cards'] })} />
          <List title="Status charts" rows={draft.charts} labels={CHART_LABELS} disabled={saving} onChange={charts => setDraft({ ...draft, charts: charts as DashboardLayout['charts'] })} />
          <List title="Today's activity" rows={draft.today} labels={TODAY_LABELS} disabled={saving} onChange={today => setDraft({ ...draft, today: today as DashboardLayout['today'] })} />
        </div>
        {error && <p role="alert" className="px-5 pb-2 text-[13px] text-[#B91C1C]">{error}</p>}
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button type="button" onClick={onClose} disabled={saving} className="h-10 rounded-md border border-gray-300 px-5 text-[14px] font-medium text-[#333] hover:bg-gray-50">Cancel</button>
          <button type="button" onClick={save} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#FACC15] px-5 text-[14px] font-semibold text-[#111827] hover:bg-[#EAB308] disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Save</button>
        </div>
      </div>
    </div>
  );
}
