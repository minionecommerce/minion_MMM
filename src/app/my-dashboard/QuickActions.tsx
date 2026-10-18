'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Banknote, Check, CreditCard, EllipsisVertical, FileText, FolderPlus, ListTodo, Loader2, Package, Plus, Search, Store, UserPlus, Users, Wrench, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ApiError, callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import type { DealRow } from '@/lib/deals/queries';
import type { QuickActionDef, QuickActions as Data } from '@/lib/dashboard/types';
import ConvertProjectModal, { type ConvertField } from '../deals/components/ConvertProjectModal';

const ICONS: Record<string, LucideIcon> = { lead: UserPlus, quote: FileText, material: Package, service: Wrench, ppr: CreditCard, pcr: Banknote, task: ListTodo, project: FolderPlus, vendor: Store, user: Users };

// Quick Actions: a tile for each action the person chose. The three-dot menu lists the actions they may use (and only those) to tick or untick.
// A tile opens the real create page or popup; "New Project" opens the Convert to Project popup here, after picking a deal.
export default function QuickActions({ data, convertFields, onChange }: { data: Data; convertFields: ConvertField[]; onChange: (next: Data) => void }) {
  const toast = useToast();
  const [menu, setMenu] = useState(false);
  const [up, setUp] = useState(false); // open upwards when there is no room below the button
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const away = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node | null)) setMenu(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', key); };
  }, [menu]);

  const chosen = data.available.filter(a => data.selected.includes(a.id));

  const toggle = async (id: string) => {
    if (saving) return;
    const selected = data.selected.includes(id) ? data.selected.filter(x => x !== id) : [...data.selected, id];
    const before = data;
    onChange({ ...data, selected });
    setSaving(true);
    try { onChange(await callApi<Data>('/api/dashboard/quick-actions', 'PUT', { selected })); }
    catch (e) { onChange(before); toast.error(e instanceof ApiError || e instanceof Error ? e.message : 'Could not save your quick actions'); }
    finally { setSaving(false); }
  };

  const tile = 'flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3 text-center text-[13px] font-medium text-[#111827] shadow-sm transition hover:border-[#FACC15] hover:bg-[#FFFBEB] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FACC15]';
  const body = (a: QuickActionDef) => { const Icon = ICONS[a.icon] ?? Plus; return <><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FEF3C7] text-[#92400E]"><Icon className="h-5 w-5" aria-hidden /></span><span>{a.label}</span></>; };

  return (
    <section aria-labelledby="qa-title" className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 id="qa-title" className="text-[16px] font-semibold text-[#111827]">Quick Actions</h2>
        <div ref={root} className="relative">
          <button type="button" onClick={e => { setUp(window.innerHeight - e.currentTarget.getBoundingClientRect().bottom < 380); setMenu(m => !m); }} aria-haspopup="menu" aria-expanded={menu} aria-label="Choose quick actions" title="Choose quick actions" className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"><EllipsisVertical className="h-5 w-5" /></button>
          {menu && (
            <div role="menu" aria-label="Quick actions you can use" className={`absolute right-0 z-30 ${up ? 'bottom-full mb-1' : 'mt-1'} w-[260px] max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white py-1 shadow-xl`}>
              <p className="px-3 py-2 text-[12px] text-[#6B7280]">Tick the actions you want on your dashboard.</p>
              {data.available.length === 0 && <p className="px-3 py-3 text-[13px] text-[#6B7280]">You do not have access to any create action.</p>}
              <ul className="max-h-[320px] overflow-y-auto">
                {data.available.map(a => {
                  const on = data.selected.includes(a.id);
                  return (
                    <li key={a.id}>
                      <button type="button" role="menuitemcheckbox" aria-checked={on} onClick={() => toggle(a.id)} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[14px] hover:bg-gray-50">
                        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? 'border-[#EAB308] bg-[#FACC15] text-[#111827]' : 'border-gray-400'}`}>{on && <Check className="h-3 w-3" />}</span>
                        <span className="flex-1">{a.label}</span>
                        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
      {chosen.length === 0 ? (
        <p className="mt-3 text-[13px] text-[#6B7280]">{data.available.length === 0 ? 'You do not have access to any create action.' : 'No quick action chosen. Use the three dots to add some.'}</p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {chosen.map(a => (
            <li key={a.id}>
              {a.href.startsWith('dialog:') ? <button type="button" onClick={() => setPicking(true)} title={a.hint} className={`${tile} w-full`}>{body(a)}</button>
                : <Link href={a.href} title={a.hint} className={tile}>{body(a)}</Link>}
            </li>
          ))}
        </ul>
      )}
      {picking && <NewProject convertFields={convertFields} onClose={() => setPicking(false)} />}
    </section>
  );
}

// New Project: choose the deal, then the Convert to Project popup of the Deals page (the same one) opens for it
function NewProject({ convertFields, onClose }: { convertFields: ConvertField[]; onClose: () => void }) {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chosen, setChosen] = useState<DealRow | null>(null);
  const latest = useRef(0);

  useEffect(() => {
    const id = ++latest.current;
    const t = setTimeout(() => {
      callApi<{ deals: DealRow[] }>(`/api/deals/convertible?q=${encodeURIComponent(q.trim())}`, 'GET')
        .then(r => { if (id === latest.current) { setDeals(r.deals); setError(''); } })
        .catch(e => { if (id === latest.current) setError(e instanceof Error ? e.message : 'Could not load the deals'); })
        .finally(() => { if (id === latest.current) setLoading(false); });
    }, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [q]);

  if (chosen) {
    return <ConvertProjectModal row={chosen} fields={convertFields} onClose={onClose} onSaved={r => { toast.success(`Deal ${r.dealNumber} converted to project ${r.code}`); onClose(); window.location.assign(`/projects/${r.projectId}`); }} />;
  }
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/50 p-0 sm:items-center sm:p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="np-title" onKeyDown={e => { if (e.key === 'Escape') onClose(); }} className="flex max-h-screen w-full flex-col bg-white shadow-2xl sm:max-h-[85vh] sm:max-w-[520px] sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 id="np-title" className="text-[20px] font-bold text-[#111827]">New Project</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-black"><X className="h-6 w-6" /></button>
        </div>
        <div className="px-5 pt-4">
          <p className="text-[13px] text-[#6B7280]">A project is made from a deal. Choose the deal to convert.</p>
          <div className="mt-3 flex items-center gap-2 rounded-lg border-2 border-gray-300 px-3 focus-within:border-[#0d6efd]">
            <Search className="h-4 w-4 text-gray-400" aria-hidden />
            <input autoFocus value={q} onChange={e => { setLoading(true); setQ(e.target.value); }} placeholder="Search by deal, customer or number" aria-label="Search deals" className="h-[42px] w-full text-[14px] focus:outline-none" />
          </div>
        </div>
        <ul className="mt-2 min-h-[120px] flex-1 overflow-y-auto px-2 pb-3">
          {loading && <li className="flex items-center gap-2 px-3 py-4 text-[13px] text-gray-500"><Loader2 className="h-4 w-4 animate-spin" />Loading deals…</li>}
          {!loading && error && <li role="alert" className="px-3 py-4 text-[13px] text-[#B91C1C]">{error}</li>}
          {!loading && !error && deals.length === 0 && <li className="px-3 py-4 text-[13px] text-gray-500">No deal found that can be converted.</li>}
          {!loading && !error && deals.map(d => (
            <li key={d.id}>
              <button type="button" onClick={() => setChosen(d)} className="flex w-full flex-col rounded-lg px-3 py-2.5 text-left hover:bg-[#FFFBEB]">
                <span className="text-[14px] font-medium text-[#111827]">{d.deal.name}</span>
                <span className="text-[12px] text-[#6B7280]">{d.code} · {d.customerName || 'No customer name'}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
