'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Search, X } from 'lucide-react';
import { searchLookup } from '@/app/records/client';
import type { LookupItem } from '@/lib/records/types';
import type { ProjectDetail } from '@/lib/projects/types';
import { errorText, primaryButton, lightButton } from './common';

type Kind = 'service' | 'material';
const TITLE: Record<Kind, string> = { service: 'Service Vendor', material: 'Material Vendor' };

// The vendors of one item: a Service Vendor tab (open first) and a Material Vendor tab, each with many choices. What is ticked is kept for this item only.
export default function VendorPicker({ itemName, service, material, refs, onClose, onSave }: {
  itemName: string;
  service: string[];
  material: string[];
  refs: ProjectDetail['refs'];
  onClose: () => void;
  onSave: (next: { serviceVendorIds: string[]; materialVendorIds: string[] }) => Promise<string | null>;
}) {
  const [tab, setTab] = useState<Kind>('service');
  const [chosen, setChosen] = useState<Record<Kind, string[]>>({ service, material });
  const [names, setNames] = useState<Record<string, string>>({}); // names of vendors picked in this window
  const [q, setQ] = useState('');
  const [found, setFound] = useState<LookupItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const list = await searchLookup('projects', tab === 'service' ? 'serviceVendors' : 'materialVendors', q);
        if (live) setFound(list);
      } catch (e) {
        if (live) setError(errorText(e));
      } finally {
        if (live) setBusy(false);
      }
    }, q ? 250 : 0);
    return () => { live = false; clearTimeout(t); };
  }, [q, tab]);

  const nameOf = (kind: Kind, id: string) => {
    const known = kind === 'service' ? refs.serviceVendors[id] : refs.materialVendors[id];
    return names[`${kind}:${id}`] ?? (known ? `${known.code} - ${known.name}` : id);
  };
  const flip = (item: LookupItem) => {
    setNames(n => ({ ...n, [`${tab}:${item.id}`]: item.sub ? `${item.label} - ${item.sub.split(' · ')[0]}` : item.label }));
    setChosen(c => ({ ...c, [tab]: c[tab].includes(item.id) ? c[tab].filter(x => x !== item.id) : [...c[tab], item.id] }));
  };
  const remove = (kind: Kind, id: string) => setChosen(c => ({ ...c, [kind]: c[kind].filter(x => x !== id) }));
  const picked = useMemo(() => new Set(chosen[tab]), [chosen, tab]);

  const submit = async () => {
    setSaving(true);
    setError('');
    const message = await onSave({ serviceVendorIds: chosen.service, materialVendorIds: chosen.material });
    if (message) { setError(message); setSaving(false); } else onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center bg-black/50 p-0 sm:p-4" onMouseDown={e => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="vp-title" onKeyDown={e => { if (e.key === 'Escape' && !saving) onClose(); }}
        className="bg-white w-full sm:max-w-[640px] max-h-screen sm:max-h-[90vh] flex flex-col sm:rounded-xl shadow-2xl">
        <div className="flex items-start justify-between gap-3 px-6 pt-5">
          <div className="min-w-0">
            <h2 id="vp-title" className="text-[20px] font-bold text-[#333]">Select Vendors</h2>
            <p className="text-[13px] text-gray-500 truncate" title={itemName}>For: {itemName}</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="text-gray-400 hover:text-black disabled:opacity-40"><X className="w-6 h-6" /></button>
        </div>

        <div role="tablist" className="flex gap-6 px-6 mt-3 border-b border-gray-200">
          {(['service', 'material'] as const).map(k => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setQ(''); }} className={`pb-2.5 -mb-px text-[14px] border-b-[3px] ${tab === k ? 'border-[#0d6efd] text-[#222] font-semibold' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              {TITLE[k]}{chosen[k].length > 0 && <span className="ml-1.5 inline-block min-w-[18px] px-1 rounded-full bg-[#0d6efd] text-white text-[11px] text-center">{chosen[k].length}</span>}
            </button>
          ))}
        </div>

        <div className="px-6 pt-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={`Search ${TITLE[tab].toLowerCase()}s...`} aria-label={`Search ${TITLE[tab]}`} className="w-full h-10 pl-9 pr-9 border border-gray-300 rounded text-[14px] focus:outline-none focus:border-[#0d6efd]" />
            {busy && <Loader2 className="w-4 h-4 animate-spin text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />}
          </div>
          {chosen[tab].length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={`Chosen ${TITLE[tab]}s`}>
              {chosen[tab].map(id => (
                <li key={id} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded bg-[#e7f1ff] text-[12px] text-[#084298]">
                  {nameOf(tab, id)}<button type="button" onClick={() => remove(tab, id)} aria-label={`Remove ${nameOf(tab, id)}`} className="hover:text-[#d9232b]"><X className="w-3.5 h-3.5" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ul role="listbox" aria-multiselectable="true" aria-label={`${TITLE[tab]}s`} className="mt-2 mx-6 mb-3 border border-gray-200 rounded overflow-y-auto min-h-[120px] max-h-[280px]">
          {!busy && found.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-gray-500">{q ? 'Nothing found' : `No ${TITLE[tab].toLowerCase()}s yet. Add them on the ${TITLE[tab]} page.`}</li>}
          {found.map(item => {
            const on = picked.has(item.id);
            return (
              <li key={item.id} role="option" aria-selected={on}>
                <button type="button" onClick={() => flip(item)} className={`w-full text-left px-3 py-2 flex items-center gap-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${on ? 'bg-[#f0f7ff]' : ''}`}>
                  <span className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${on ? 'bg-[#0d6efd] border-[#0d6efd] text-white' : 'border-gray-300'}`}>{on && <Check className="w-3.5 h-3.5" />}</span>
                  <span className="min-w-0"><span className="block text-[14px] text-gray-900 truncate">{item.label}</span>{item.sub && <span className="block text-[12px] text-gray-500 truncate">{item.sub}</span>}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {error && <p role="alert" className="px-6 pb-2 text-[13px] text-[#d9232b]">{error}</p>}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} disabled={saving} className={`${lightButton} h-[40px] px-5`}>Cancel</button>
          <button type="button" onClick={submit} disabled={saving} className={`${primaryButton} h-[40px] px-5`}>{saving && <Loader2 className="w-4 h-4 animate-spin" />}Save</button>
        </div>
      </div>
    </div>
  );
}
