'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { ApiError, callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import { formatFy, renderNumber, validatePattern } from '@/lib/quotes/numbering';
import { FY_FORMATS, type CustomerDto, type ItemDto, type NumberingSettings, type QuoteSettings, type TaxDef } from '@/lib/quotes/types';
import { Button, Modal, Spinner, inputClass } from './ui';

const label = 'block text-[13px] text-[#22263b] mb-1';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CUSTOMER_TYPES = ['Individual', 'Company', 'Builder', 'Architect', 'Interior Designer', 'Contractor'];

// ---------------------------------------------------------------------------
// New customer (from the quote form). The same phone or email is refused; the same name asks first.
// ---------------------------------------------------------------------------
type Dup = { message: string; hard: boolean; existing: CustomerDto };

export function CustomerModal({ initialName = '', onClose, onCreated }: { initialName?: string; onClose: () => void; onCreated: (c: CustomerDto) => void }) {
  const [form, setForm] = useState({ name: initialName, phone: '', email: '', gstin: '', customerType: 'Individual', address: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dup, setDup] = useState<Dup | null>(null);
  const set = (k: keyof typeof form, v: string) => { setForm(f => ({ ...f, [k]: v })); setDup(null); setError(''); };

  const save = async (force = false) => {
    if (!form.name.trim()) { setError('The customer name is required.'); return; }
    setBusy(true);
    setError('');
    try {
      const res = await callApi<{ customer: CustomerDto }>('/api/quotes/customers', 'POST', { ...form, ...(force ? { force: true } : {}) });
      onCreated(res.customer);
    } catch (e) {
      const body = e instanceof ApiError ? (e.body as unknown as { code?: string; hard?: boolean; existing?: CustomerDto } | undefined) : undefined;
      if (body?.code === 'DUPLICATE' && body.existing) setDup({ message: (e as Error).message, hard: !!body.hard, existing: body.existing });
      else setError(e instanceof Error ? e.message : 'Could not save the customer');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="New Customer" onClose={onClose} busy={busy} width={560} footer={(
      <>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button kind="blue" onClick={() => save(false)} busy={busy}>Save</Button>
      </>
    )}>
      <form onSubmit={e => { e.preventDefault(); void save(false); }} className="space-y-3">
        {error && <p role="alert" className="text-[13px] text-[#d9232b]">{error}</p>}
        {dup && (
          <div role="alert" className="rounded-[4px] border border-[#f3c97a] bg-[#fff8e6] px-3 py-2 text-[13px]">
            <p>{dup.message}</p>
            <p className="mt-1 text-[#6d7189]">{dup.existing.name}{dup.existing.phone ? ` · ${dup.existing.phone}` : ''}{dup.existing.email ? ` · ${dup.existing.email}` : ''}</p>
            <div className="mt-2 flex gap-2">
              <Button kind="blue" onClick={() => onCreated(dup.existing)}>Use this customer</Button>
              {!dup.hard && <Button onClick={() => save(true)} busy={busy}>Add as a new customer</Button>}
            </div>
          </div>
        )}
        <div>
          <label htmlFor="nc-name" className={`${label} text-[#d93b3b]`}>Customer Name*</label>
          <input id="nc-name" autoFocus value={form.name} onChange={e => set('name', e.target.value)} maxLength={200} className={inputClass()} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label htmlFor="nc-phone" className={label}>Phone</label><input id="nc-phone" value={form.phone} onChange={e => set('phone', e.target.value)} maxLength={30} inputMode="tel" className={inputClass()} /></div>
          <div><label htmlFor="nc-email" className={label}>Email</label><input id="nc-email" type="email" value={form.email} onChange={e => set('email', e.target.value)} maxLength={200} className={inputClass()} /></div>
          <div><label htmlFor="nc-gstin" className={label}>GSTIN</label><input id="nc-gstin" value={form.gstin} onChange={e => set('gstin', e.target.value.toUpperCase())} maxLength={20} className={inputClass()} /></div>
          <div>
            <label htmlFor="nc-type" className={label}>Customer Type</label>
            <select id="nc-type" value={form.customerType} onChange={e => set('customerType', e.target.value)} className={inputClass()}>{CUSTOMER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
          </div>
        </div>
        <div><label htmlFor="nc-address" className={label}>Billing Address</label><textarea id="nc-address" value={form.address} onChange={e => set('address', e.target.value)} maxLength={1000} rows={3} className={`${inputClass()} h-auto py-1.5`} /></div>
        <button type="submit" hidden aria-hidden />
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Search customers (the blue button next to Customer Name)
// ---------------------------------------------------------------------------
export function CustomerSearchModal({ onClose, onPick, onNew }: { onClose: () => void; onPick: (c: CustomerDto) => void; onNew: (name: string) => void }) {
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
    <Modal title="Search Customer" onClose={onClose} width={720} footer={<Button kind="ghost" onClick={() => onNew(q.trim())}>+ New Customer</Button>}>
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 text-[#9ca0ab] absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden />
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Name, phone, email or customer code" aria-label="Search customers" className={inputClass(false, 'pl-8')} />
        {busy && <Spinner className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca0ab]" />}
      </div>
      {error && <p className="text-[13px] text-[#d9232b]">{error}</p>}
      <div className="border border-[#ebeaf2] rounded-[4px] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-[#f9f9fb] text-[#6d7189] text-[12px] uppercase"><tr><th className="text-left px-3 h-[34px] font-medium">Name</th><th className="text-left px-3 font-medium">Phone</th><th className="text-left px-3 font-medium">Email</th><th className="text-left px-3 font-medium">GSTIN</th></tr></thead>
          <tbody>
            {items.map(i => (
              <tr key={i.id} onClick={() => onPick(i.customer)} className="h-[34px] border-t border-[#ebeaf2] cursor-pointer hover:bg-[#f1f1fa]">
                <td className="px-3 text-[#355bd4]">{i.customer.name}</td><td className="px-3">{i.customer.phone ?? ''}</td><td className="px-3 truncate max-w-[200px]">{i.customer.email ?? ''}</td><td className="px-3">{i.customer.gstin ?? ''}</td>
              </tr>
            ))}
            {!busy && items.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-[#6d7189]">No customers found</td></tr>}
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

// ---------------------------------------------------------------------------
// An item of the catalogue
// ---------------------------------------------------------------------------
export function ItemModal({ item, taxes, onClose, onSaved, initialName = '' }: { item?: ItemDto; taxes: TaxDef[]; onClose: () => void; onSaved: (item: ItemDto) => void; initialName?: string }) {
  const [form, setForm] = useState({ name: item?.name ?? initialName, description: item?.description ?? '', hsn: item?.hsn ?? '', unit: item?.unit ?? '', rate: item ? String(item.rate) : '', taxId: item?.taxId ?? '', kind: item?.kind ?? 'Goods', isActive: item?.isActive ?? true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof form, v: string | boolean) => { setForm(f => ({ ...f, [k]: v })); setError(''); };
  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const body = { ...form, rate: form.rate === '' ? 0 : Number(form.rate), taxId: form.taxId || null };
      const res = item ? await callApi<{ item: ItemDto }>(`/api/quotes/items/${item.id}`, 'PUT', body) : await callApi<{ item: ItemDto }>('/api/quotes/items', 'POST', body);
      onSaved(res.item);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the item');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={item ? 'Edit Item' : 'New Item'} onClose={onClose} busy={busy} width={560} footer={(
      <>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button kind="blue" onClick={save} busy={busy}>Save</Button>
      </>
    )}>
      <form onSubmit={e => { e.preventDefault(); void save(); }} className="space-y-3">
        {error && <p role="alert" className="text-[13px] text-[#d9232b]">{error}</p>}
        <div><label htmlFor="it-name" className={`${label} text-[#d93b3b]`}>Name*</label><input id="it-name" autoFocus value={form.name} onChange={e => set('name', e.target.value)} maxLength={500} className={inputClass()} /></div>
        <div><label htmlFor="it-desc" className={label}>Description</label><textarea id="it-desc" value={form.description} onChange={e => set('description', e.target.value)} maxLength={2000} rows={2} className={`${inputClass()} h-auto py-1.5`} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label htmlFor="it-rate" className={label}>Rate</label><input id="it-rate" inputMode="decimal" value={form.rate} onChange={e => set('rate', e.target.value)} className={inputClass()} /></div>
          <div>
            <label htmlFor="it-tax" className={label}>Tax</label>
            <select id="it-tax" value={form.taxId} onChange={e => set('taxId', e.target.value)} className={inputClass()}>
              <option value="">No tax</option>
              {taxes.filter(t => t.active || t.id === item?.taxId).map(t => <option key={t.id} value={t.id}>{t.name} [{t.rate}%]</option>)}
            </select>
          </div>
          <div><label htmlFor="it-hsn" className={label}>HSN/SAC</label><input id="it-hsn" value={form.hsn} onChange={e => set('hsn', e.target.value)} maxLength={20} className={inputClass()} /></div>
          <div><label htmlFor="it-unit" className={label}>Unit</label><input id="it-unit" value={form.unit} onChange={e => set('unit', e.target.value)} maxLength={20} placeholder="nos" className={inputClass()} /></div>
          <div>
            <label htmlFor="it-kind" className={label}>Type</label>
            <select id="it-kind" value={form.kind} onChange={e => set('kind', e.target.value)} className={inputClass()}><option value="Goods">Goods</option><option value="Service">Service</option></select>
          </div>
          <label className="flex items-end gap-2 pb-1 text-[13px]"><input type="checkbox" className="q-check" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} /> Active</label>
        </div>
        <button type="submit" hidden aria-hidden />
      </form>
    </Modal>
  );
}
