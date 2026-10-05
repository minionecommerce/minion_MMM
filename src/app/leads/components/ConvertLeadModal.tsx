'use client';

import { useRef, useState } from 'react';
import { CalendarDays, Info, Loader2, Tag, X } from 'lucide-react';
import { DEAL_CLOSING_MAX_YEARS, DEAL_NAME_MAX, DEAL_VALUE_MAX } from '@/lib/leads/constants';
import { callApi } from '@/lib/leads/client';
import { defaultClosingDay, formatRupees, isRealDay, todayDay } from '@/lib/leads/format';
import type { LeadRow } from '@/lib/leads/queries';
import ConvertIcon from './ConvertIcon';

export type LeadConverted = { dealId: string; dealNumber: string; leadCode: string | null };

// The furthest Closing Date accepted (the same rule the server applies)
function latestClosingDay(today: string) {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + DEAL_CLOSING_MAX_YEARS);
  return d.toISOString().slice(0, 10);
}

// "Convert": opened from the Convert icon in Actions. Deal Name, Closing Date and Deal Value are all required. Cancel changes nothing.
export default function ConvertLeadModal({ row, onClose, onSaved }: { row: LeadRow; onClose: () => void; onSaved: (result: LeadConverted) => void }) {
  const [name, setName] = useState('');
  const [date, setDate] = useState(() => defaultClosingDay()); // two weeks from today; the Monday after if that is a Sunday
  const [value, setValue] = useState('');
  const [errors, setErrors] = useState<{ name?: string; date?: string; value?: string; form?: string }>({});
  const [saving, setSaving] = useState(false);
  const nameBox = useRef<HTMLInputElement>(null);
  const dateBox = useRef<HTMLInputElement>(null);
  const valueBox = useRef<HTMLInputElement>(null);
  const today = todayDay();
  const latest = latestClosingDay(today);

  const amount = Number(value.replace(/,/g, '').trim());
  const showsAmount = value.trim() !== '' && Number.isFinite(amount) && amount > 0 && amount <= DEAL_VALUE_MAX;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Deal Name is required';
    if (!date) next.date = 'Closing Date is required';
    else if (!isRealDay(date)) next.date = 'Enter a valid Closing Date';
    else if (date < today) next.date = 'Closing Date cannot be in the past';
    else if (date > latest) next.date = `Closing Date must be within ${DEAL_CLOSING_MAX_YEARS} years`;
    const text = value.replace(/,/g, '').trim();
    if (!text) next.value = 'Deal Value is required';
    else if (!/^\d*\.?\d+$|^\d+\.$/.test(text)) next.value = 'Enter a valid Deal Value';
    else if (!(amount > 0)) next.value = 'Deal Value must be more than 0';
    else if (amount > DEAL_VALUE_MAX) next.value = 'Deal Value is too large';
    setErrors(next);
    if (next.name || next.date || next.value) {
      (next.name ? nameBox : next.date ? dateBox : valueBox).current?.focus();
      return;
    }

    setSaving(true);
    try {
      const result = await callApi<LeadConverted>(`/api/leads/${row.id}/convert`, 'POST', { dealName: name.trim(), closingDate: date, dealValue: amount });
      onSaved(result);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Could not convert the lead' });
      setSaving(false);
    }
  };

  const field = (error?: string) => `block w-full h-[46px] rounded-lg border-2 px-3 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#f5b800] disabled:bg-gray-50 ${error ? 'border-[#dc3545]' : 'border-gray-300'}`;
  const labelClass = 'flex items-center gap-1.5 mb-2 text-[14px] font-semibold text-[#333]';

  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center bg-black/50 p-0 sm:p-4" onMouseDown={e => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <form role="dialog" aria-modal="true" aria-labelledby="cv-title" onSubmit={submit} noValidate onKeyDown={e => { if (e.key === 'Escape' && !saving) onClose(); }}
        className="bg-white w-full sm:max-w-[560px] max-h-screen sm:max-h-[90vh] overflow-y-auto sm:rounded-xl shadow-2xl px-5 sm:px-[30px] py-6 sm:py-[30px]">
        <div className="flex items-center justify-between gap-3">
          <h2 id="cv-title" className="inline-flex items-center gap-2.5 text-[24px] font-bold text-[#333]">
            <span className="w-9 h-9 rounded-md bg-[#f5b800] text-white flex items-center justify-center shrink-0"><ConvertIcon className="w-5 h-5" /></span>
            Convert Lead to Deal
          </h2>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="text-gray-400 hover:text-black disabled:opacity-40"><X className="w-6 h-6" /></button>
        </div>

        <div className="mt-5 flex items-start gap-2 rounded px-4 py-3.5 bg-[#fff3cd] border-l-4 border-[#ffc107] text-[14px] text-[#856404]">
          <Info className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" stroke="#fff3cd" aria-hidden="true" />
          <p className="min-w-0 break-words"><strong>Customer:</strong> {row.customerName || 'N/A'} | <strong>Lead ID:</strong> {row.code || 'N/A'}</p>
        </div>

        <div className="mt-5">
          <label htmlFor="cv-name" className={labelClass}><Tag className="w-4 h-4 text-[#f5b800]" fill="currentColor" aria-hidden="true" />Deal Name <span className="text-[#dc3545]">*</span></label>
          <input ref={nameBox} id="cv-name" autoFocus maxLength={DEAL_NAME_MAX} value={name} disabled={saving} autoComplete="off"
            onChange={e => { setName(e.target.value); if (errors.name) setErrors(x => ({ ...x, name: undefined })); }}
            placeholder="e.g. ABC Interior Project" aria-invalid={errors.name ? true : undefined} className={field(errors.name)} />
          {errors.name && <p role="alert" className="text-[12px] text-[#dc3545] mt-1">{errors.name}</p>}
        </div>

        <div className="mt-5">
          <label htmlFor="cv-date" className={labelClass}><CalendarDays className="w-4 h-4 text-[#f5b800]" aria-hidden="true" />Closing Date <span className="text-[#dc3545]">*</span></label>
          <input ref={dateBox} id="cv-date" type="date" min={today} max={latest} value={date} disabled={saving}
            onChange={e => { setDate(e.target.value); if (errors.date) setErrors(x => ({ ...x, date: undefined })); }}
            aria-invalid={errors.date ? true : undefined} aria-describedby="cv-date-help" className={field(errors.date)} />
          <small id="cv-date-help" className="block mt-1 text-[12px] text-gray-500">Starts two weeks from today (a Sunday moves to the Monday). You can change it.</small>
          {errors.date && <p role="alert" className="text-[12px] text-[#dc3545] mt-0.5">{errors.date}</p>}
        </div>

        <div className="mt-5">
          <label htmlFor="cv-value" className={labelClass}><span className="w-4 text-center text-[16px] leading-none font-bold text-[#f5b800]" aria-hidden="true">₹</span>Deal Value <span className="text-[#dc3545]">*</span></label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-gray-500 pointer-events-none" aria-hidden="true">₹</span>
            <input ref={valueBox} id="cv-value" inputMode="decimal" maxLength={20} value={value} disabled={saving} autoComplete="off"
              onChange={e => { setValue(e.target.value.replace(/[^\d.,]/g, '')); if (errors.value) setErrors(x => ({ ...x, value: undefined })); }}
              placeholder="e.g. 5,00,000" aria-invalid={errors.value ? true : undefined} aria-describedby="cv-value-help" className={`${field(errors.value)} pl-7`} />
          </div>
          <small id="cv-value-help" className="block mt-1 text-[12px] text-gray-500 min-h-[18px]">{showsAmount ? <>This becomes the deal&apos;s Amount: <b className="text-[#16a34a]">{formatRupees(amount)}</b></> : 'This becomes the deal’s Amount'}</small>
          {errors.value && <p role="alert" className="text-[12px] text-[#dc3545] mt-0.5">{errors.value}</p>}
        </div>

        {errors.form && <p role="alert" className="mt-4 text-[13px] text-[#dc3545]">{errors.form}</p>}
        <div className="mt-6 pt-5 border-t-2 border-gray-200 flex items-center justify-end gap-2.5">
          {saving && <span className="mr-auto text-[13px] text-gray-500 flex items-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" />Converting…</span>}
          <button type="button" onClick={onClose} disabled={saving} className="inline-flex items-center gap-1.5 px-6 h-[44px] rounded-md bg-[#f5f5f5] hover:bg-[#ebebeb] border border-[#ddd] text-[#333] text-[14px] font-medium disabled:opacity-60"><X className="w-4 h-4" />Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-6 h-[44px] rounded-md bg-[#f5b800] hover:bg-[#e0a800] text-black text-[14px] font-semibold disabled:opacity-60"><ConvertIcon className="w-4 h-4" />Convert</button>
        </div>
      </form>
    </div>
  );
}
