'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import { formatFy, renderNumber, validatePattern } from '@/lib/quotes/numbering';
import { FY_FORMATS, type CustomerDto, type NumberingSettings, type QuoteSettings } from '@/lib/quotes/types';
import { Button, Modal, Spinner, inputClass } from './ui';

const label = 'block text-[13px] text-[#22263b] mb-1';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ---------------------------------------------------------------------------
// Search customers (the blue button next to Customer Name)
// ---------------------------------------------------------------------------
export function CustomerSearchModal({ onClose, onPick, onNew }: { onClose: () => void; onPick: (c: CustomerDto) => void; onNew?: (name: string) => void }) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<{ id: string; customer: CustomerDto }[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const res = await callApi<{ items: { id: string; customer: CustomerDto }[] }>(`/api/quotes/customers?q=${encodeURIComponent(q)}`, 'GET');
        if (live) { setItems(res.items); setError(''); }
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : 'Could not load the customers');
      } finally {
        if (live) setBusy(false);
      }
    }, q ? 250 : 0);
    return () => { live = false; clearTimeout(t); };
  }, [q]);
  return (
    <Modal title="Search Customer" onClose={onClose} width={760} footer={onNew ? <Button kind="ghost" onClick={() => onNew(q.trim())}>+ Add New Customer</Button> : undefined}>
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 text-[#9ca0ab] absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden />
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Name, phone, email or customer code" aria-label="Search customers" className={inputClass(false, 'pl-8')} />
        {busy && <Spinner className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca0ab]" />}
      </div>
      {error && <p className="text-[13px] text-[#d9232b]">{error}</p>}
      <div className="border border-[#ebeaf2] rounded-[4px] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-[#f9f9fb] text-[#6d7189] text-[12px] uppercase"><tr><th className="text-left px-3 h-[34px] font-medium">Name</th><th className="text-left px-3 font-medium">Customer No</th><th className="text-left px-3 font-medium">Phone</th><th className="text-left px-3 font-medium">Email</th><th className="text-left px-3 font-medium">GSTIN</th></tr></thead>
          <tbody>
            {items.map(i => (
              <tr key={i.id} onClick={() => onPick(i.customer)} className="h-[34px] border-t border-[#ebeaf2] cursor-pointer hover:bg-[#f1f1fa]">
                <td className="px-3 text-[#355bd4]">{i.customer.name}</td><td className="px-3 whitespace-nowrap">{i.customer.code ?? ''}</td><td className="px-3">{i.customer.phone ?? ''}</td><td className="px-3 truncate max-w-[200px]">{i.customer.email ?? ''}</td><td className="px-3">{i.customer.gstin ?? ''}</td>
              </tr>
            ))}
            {!busy && items.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-[#6d7189]">No customers found</td></tr>}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Quote number preferences (the gear next to Quote#): the format, the financial year, the next number
// ---------------------------------------------------------------------------
export function NumberingModal({ settings, canEdit, day, onClose, onSaved }: {
  settings: QuoteSettings; canEdit: boolean; day: string; onClose: () => void; onSaved: (settings: QuoteSettings) => void;
}) {
  const toast = useToast();
  const [n, setN] = useState<NumberingSettings>(settings.numbering);
  const [next, setNext] = useState<string>('');
  const [firstNext, setFirstNext] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // What the next quote of this day would be called with the saved settings
  useEffect(() => {
    let live = true;
    callApi<{ next: number }>(`/api/quotes/settings/numbering?date=${day}`, 'GET').then(r => { if (live) { setNext(String(r.next)); setFirstNext(r.next); } }).catch(() => undefined);
    return () => { live = false; };
  }, [day]);

  const problem = validatePattern(n.pattern);
  const nextNumber = Number(next);
  const preview = useMemo(() => {
    if (problem || !Number.isInteger(nextNumber) || nextNumber < 1) return '';
    try { return renderNumber(n, day, nextNumber); } catch { return ''; }
  }, [n, day, nextNumber, problem]);
  const set = <K extends keyof NumberingSettings>(k: K, v: NumberingSettings[K]) => { setN(cur => ({ ...cur, [k]: v })); setError(''); };

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const changed = JSON.stringify(n) !== JSON.stringify(settings.numbering);
      let latest = settings;
      if (changed) latest = (await callApi<{ settings: QuoteSettings }>('/api/quotes/settings', 'PUT', { group: 'numbering', value: n })).settings;
      if (next !== '' && Number.isInteger(nextNumber) && (changed || nextNumber !== firstNext)) {
        await callApi('/api/quotes/settings/numbering', 'PUT', { next: nextNumber, date: day });
      }
      toast.success('Quote number preferences saved');
      onSaved(latest);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  const ro = !canEdit;
  return (
    <Modal title="Configure Quote Number Preferences" onClose={onClose} busy={busy} width={600} footer={(
      <>
        <Button onClick={onClose} disabled={busy}>{ro ? 'Close' : 'Cancel'}</Button>
        {!ro && <Button kind="blue" onClick={save} busy={busy} disabled={!!problem}>Save</Button>}
      </>
    )}>
      <div className="space-y-3 text-[13px]">
        {ro && <p className="rounded-[4px] bg-[#f9f9fb] border border-[#ebeaf2] px-3 py-2 text-[#6d7189]">Only a Super Admin can change how quotes are numbered.</p>}
        {error && <p role="alert" className="text-[#d9232b]">{error}</p>}
        <div>
          <label htmlFor="nm-pattern" className={label}>Quote number format</label>
          <input id="nm-pattern" value={n.pattern} onChange={e => set('pattern', e.target.value)} disabled={ro} maxLength={60} className={inputClass(!!problem)} />
          {problem ? <p className="mt-1 text-[#d9232b]">{problem}</p> : <p className="mt-1 text-[#6d7189]">Use <b>{'{FY}'}</b> for the financial year, <b>{'{SEQ}'}</b> for the running number, and <b>{'{YYYY}'}</b> <b>{'{YY}'}</b> <b>{'{MM}'}</b> for the year or month of the quote date. Example: QT/MSHS/{'{FY}'}/A/{'{SEQ}'}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="nm-fy" className={label}>Financial year looks like</label>
            <select id="nm-fy" value={n.fyFormat} onChange={e => set('fyFormat', e.target.value as NumberingSettings['fyFormat'])} disabled={ro} className={inputClass()}>
              {FY_FORMATS.map(f => <option key={f} value={f}>{formatFy(2026, 2027, f)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="nm-month" className={label}>Financial year starts in</label>
            <select id="nm-month" value={n.fyStartMonth} onChange={e => set('fyStartMonth', Number(e.target.value))} disabled={ro} className={inputClass()}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="nm-pad" className={label}>Digits in the running number</label>
            <input id="nm-pad" type="number" min={0} max={12} value={n.padding} onChange={e => set('padding', Math.max(0, Math.min(12, Number(e.target.value) || 0)))} disabled={ro} className={inputClass()} />
            <p className="mt-1 text-[#6d7189]">0 = no zeros in front (723). 5 = 00723.</p>
          </div>
          <div>
            <label htmlFor="nm-start" className={label}>First number of a new series</label>
            <input id="nm-start" type="number" min={1} value={n.startNumber} onChange={e => set('startNumber', Math.max(1, Number(e.target.value) || 1))} disabled={ro} className={inputClass()} />
          </div>
        </div>
        <label className="flex items-center gap-2"><input type="checkbox" className="q-check" checked={n.resetEachFy} onChange={e => set('resetEachFy', e.target.checked)} disabled={ro} /> Start a new series every financial year</label>
        <label className="flex items-center gap-2"><input type="checkbox" className="q-check" checked={n.allowManual} onChange={e => set('allowManual', e.target.checked)} disabled={ro} /> Allow typing the quote number on the form</label>
        <div className="rounded-[6px] bg-[#f9f9fb] border border-[#ebeaf2] p-3">
          <label htmlFor="nm-next" className={label}>Next quote number (running number)</label>
          <div className="flex items-center gap-3">
            <input id="nm-next" type="number" min={1} value={next} onChange={e => { setNext(e.target.value); setError(''); }} disabled={ro} className={inputClass(false, 'max-w-[140px]')} />
            <span className="text-[#6d7189]">The next quote will be</span>
            <span className="font-semibold text-[#22263b]">{preview || '—'}</span>
          </div>
          <p className="mt-1 text-[#6d7189]">It has to be higher than every number already used in this series. Deleted quotes keep their numbers.</p>
        </div>
      </div>
    </Modal>
  );
}
