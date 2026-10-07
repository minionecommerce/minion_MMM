'use client';

import { useState } from 'react';
import { CalendarDays, FolderKanban, Info, Link2, Loader2, MapPin, Tag, X } from 'lucide-react';
import { ApiError, callApi } from '@/lib/leads/client';
import { todayDay } from '@/lib/leads/format';
import type { DealRow } from '@/lib/deals/queries';
import type { FieldOption } from '@/lib/records/types';

// What the popup needs to know about each of its fields from the Project layout (Project -> Edit Page Layout): the name, whether it is
// mandatory, whether it is shown, and the choices of Product / Service
export type ConvertField = { key: string; label: string; required: boolean; enabled: boolean; options: FieldOption[] };
export type ProjectConverted = { projectId: string; code: string; dealNumber: string };

const control = (error?: string) => `block w-full h-[44px] rounded-lg border-2 px-3 text-[14px] placeholder:text-gray-400 focus:outline-none focus:border-[#0d6efd] disabled:bg-gray-50 ${error ? 'border-[#dc3545]' : 'border-gray-300'}`;
const labelClass = 'flex items-center gap-1.5 mb-1.5 text-[14px] font-semibold text-[#333]';

// "Convert to Project": opened from the blue icon in Actions. Confirm makes the project (MP1, MP2 ...); the deal is kept and moves to the Converted
// Deals filter. Product / Service starts as the deal's own value, shown lighter; it can still be changed.
export default function ConvertProjectModal({ row, fields, onClose, onSaved }: { row: DealRow; fields: ConvertField[]; onClose: () => void; onSaved: (result: ProjectConverted) => void }) {
  const field = (key: string) => fields.find(f => f.key === key);
  const shown = (key: string) => key === 'name' || !!field(key)?.enabled;
  const labelOf = (key: string, fallback: string) => field(key)?.label ?? fallback;
  const requiredOf = (key: string) => key === 'name' || !!field(key)?.required;

  const original = row.ids.productOrServiceId ?? '';
  const productOptions = field('productOrService')?.options ?? [];
  const [productOrService, setProductOrService] = useState(productOptions.some(o => o.id === original) ? original : '');
  const [touched, setTouched] = useState(false); // false: Product / Service still shows the deal's own value (lighter)
  const [name, setName] = useState(row.deal.name);
  const [siteLocation, setSiteLocation] = useState(row.location ?? '');
  const [siteLocationLink, setSiteLocationLink] = useState(row.locationLink ?? '');
  const [startDate, setStartDate] = useState(() => todayDay());
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [priorCompletionDate, setPriorCompletionDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const clear = (key: string) => setErrors(e => (e[key] ? { ...e, [key]: '' } : e));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const found: Record<string, string> = {};
    const need = (key: string, value: string, fallback: string) => { if (shown(key) && requiredOf(key) && !value.trim()) found[key] = `${labelOf(key, fallback)} is required`; };
    need('name', name, 'Project Name');
    need('productOrService', productOrService, 'Product / Service');
    need('siteLocation', siteLocation, 'Site Location');
    need('siteLocationLink', siteLocationLink, 'Site Location Link');
    need('startDate', startDate, 'Project Start Date');
    need('expectedEndDate', expectedEndDate, 'Project Completion Date');
    need('priorCompletionDate', priorCompletionDate, 'Prior Completion Date');
    if (siteLocationLink.trim() && !/^https?:\/\//i.test(siteLocationLink.trim())) found.siteLocationLink = 'Enter a valid link that starts with http:// or https://';
    if (startDate && expectedEndDate && expectedEndDate < startDate) found.expectedEndDate = 'The Completion Date cannot be before the Start Date';
    if (startDate && priorCompletionDate && priorCompletionDate < startDate) found.priorCompletionDate = 'The Prior Completion Date cannot be before the Start Date';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const result = await callApi<ProjectConverted>(`/api/deals/${row.id}/convert-to-project`, 'POST', {
        productOrService: shown('productOrService') ? productOrService || null : null,
        name: name.trim(),
        siteLocation: shown('siteLocation') ? siteLocation.trim() || null : null,
        siteLocationLink: shown('siteLocationLink') ? siteLocationLink.trim() || null : null,
        startDate: shown('startDate') ? startDate || null : null,
        expectedEndDate: shown('expectedEndDate') ? expectedEndDate || null : null,
        priorCompletionDate: shown('priorCompletionDate') ? priorCompletionDate || null : null,
      });
      onSaved(result);
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) setErrors({ ...Object.fromEntries(err.details.map(d => [d.path, d.message])), form: err.message });
      else setErrors({ form: err instanceof Error ? err.message : 'Could not convert the deal' });
      setSaving(false);
    }
  };

  const err = (key: string) => errors[key] && <p role="alert" className="text-[12px] text-[#dc3545] mt-1">{errors[key]}</p>;
  const star = (key: string) => requiredOf(key) && <span className="text-[#dc3545]">*</span>;

  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center bg-black/50 p-0 sm:p-4" onMouseDown={e => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <form role="dialog" aria-modal="true" aria-labelledby="cp-title" onSubmit={submit} noValidate onKeyDown={e => { if (e.key === 'Escape' && !saving) onClose(); }}
        className="bg-white w-full sm:max-w-[600px] max-h-screen sm:max-h-[92vh] overflow-y-auto sm:rounded-xl shadow-2xl px-5 sm:px-[30px] py-6 sm:py-[28px]">
        <div className="flex items-center justify-between gap-3">
          <h2 id="cp-title" className="inline-flex items-center gap-2.5 text-[24px] font-bold text-[#333]">
            <span className="w-9 h-9 rounded-md bg-[#0d6efd] text-white flex items-center justify-center shrink-0"><FolderKanban className="w-5 h-5" /></span>
            Convert to Project
          </h2>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="text-gray-400 hover:text-black disabled:opacity-40"><X className="w-6 h-6" /></button>
        </div>

        <div className="mt-5 flex items-start gap-2 rounded px-4 py-3.5 bg-[#e7f1ff] border-l-4 border-[#0d6efd] text-[14px] text-[#084298]">
          <Info className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" stroke="#e7f1ff" aria-hidden="true" />
          <p className="min-w-0 break-words"><strong>Deal:</strong> {row.code} · {row.deal.name} | <strong>Customer:</strong> {row.customerName || 'N/A'}<br /><span className="text-[13px]">The deal is kept. It moves to <b>Converted Deals</b> and a new project is made with the next Project Code.</span></p>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
          {shown('productOrService') && (
            <div className="sm:col-span-2">
              <label htmlFor="cp-pos" className={labelClass}><Tag className="w-4 h-4 text-[#0d6efd]" aria-hidden="true" />{labelOf('productOrService', 'Product / Service')} {star('productOrService')}</label>
              <select id="cp-pos" value={productOrService} disabled={saving} onChange={e => { setProductOrService(e.target.value); setTouched(true); clear('productOrService'); }}
                aria-describedby="cp-pos-help" className={`${control(errors.productOrService)} cursor-pointer ${touched || !productOrService ? 'text-gray-900' : 'text-gray-400'}`}>
                <option value="">-None-</option>
                {productOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              <small id="cp-pos-help" className="block mt-1 text-[12px] text-gray-500">{touched || !productOrService ? 'You can change it.' : 'Taken from the deal (shown lighter). You can change it.'}</small>
              {err('productOrService')}
            </div>
          )}

          <div className="sm:col-span-2">
            <label htmlFor="cp-name" className={labelClass}><FolderKanban className="w-4 h-4 text-[#0d6efd]" aria-hidden="true" />{labelOf('name', 'Project Name')} {star('name')}</label>
            <input id="cp-name" autoFocus maxLength={200} value={name} disabled={saving} autoComplete="off" onChange={e => { setName(e.target.value); clear('name'); }} aria-invalid={errors.name ? true : undefined} className={control(errors.name)} />
            {err('name')}
          </div>

          {shown('siteLocation') && (
            <div>
              <label htmlFor="cp-loc" className={labelClass}><MapPin className="w-4 h-4 text-[#0d6efd]" aria-hidden="true" />{labelOf('siteLocation', 'Site Location')} {star('siteLocation')}</label>
              <input id="cp-loc" maxLength={500} value={siteLocation} disabled={saving} autoComplete="off" placeholder="e.g. Porur" onChange={e => { setSiteLocation(e.target.value); clear('siteLocation'); }} className={control(errors.siteLocation)} />
              {err('siteLocation')}
            </div>
          )}
          {shown('siteLocationLink') && (
            <div>
              <label htmlFor="cp-link" className={labelClass}><Link2 className="w-4 h-4 text-[#0d6efd]" aria-hidden="true" />{labelOf('siteLocationLink', 'Site Location Link')} {star('siteLocationLink')}</label>
              <input id="cp-link" type="url" maxLength={2000} value={siteLocationLink} disabled={saving} autoComplete="off" placeholder="https://maps.google.com/..." onChange={e => { setSiteLocationLink(e.target.value); clear('siteLocationLink'); }} className={control(errors.siteLocationLink)} />
              {err('siteLocationLink')}
            </div>
          )}

          {shown('startDate') && (
            <div>
              <label htmlFor="cp-start" className={labelClass}><CalendarDays className="w-4 h-4 text-[#0d6efd]" aria-hidden="true" />{labelOf('startDate', 'Project Start Date')} {star('startDate')}</label>
              <input id="cp-start" type="date" value={startDate} min="1900-01-01" max="2100-12-31" disabled={saving} onChange={e => { setStartDate(e.target.value); clear('startDate'); clear('expectedEndDate'); clear('priorCompletionDate'); }} className={control(errors.startDate)} />
              {err('startDate')}
            </div>
          )}
          {shown('expectedEndDate') && (
            <div>
              <label htmlFor="cp-end" className={labelClass}><CalendarDays className="w-4 h-4 text-[#0d6efd]" aria-hidden="true" />{labelOf('expectedEndDate', 'Project Completion Date')} {star('expectedEndDate')}</label>
              <input id="cp-end" type="date" value={expectedEndDate} min={startDate || '1900-01-01'} max="2100-12-31" disabled={saving} onChange={e => { setExpectedEndDate(e.target.value); clear('expectedEndDate'); }} className={control(errors.expectedEndDate)} />
              {err('expectedEndDate')}
            </div>
          )}
          {shown('priorCompletionDate') && (
            <div>
              <label htmlFor="cp-prior" className={labelClass}><CalendarDays className="w-4 h-4 text-[#0d6efd]" aria-hidden="true" />{labelOf('priorCompletionDate', 'Prior Completion Date')} {star('priorCompletionDate')}</label>
              <input id="cp-prior" type="date" value={priorCompletionDate} min={startDate || '1900-01-01'} max="2100-12-31" disabled={saving} onChange={e => { setPriorCompletionDate(e.target.value); clear('priorCompletionDate'); }} className={control(errors.priorCompletionDate)} />
              {err('priorCompletionDate')}
            </div>
          )}
        </div>

        {errors.form && <p role="alert" className="mt-4 text-[13px] text-[#dc3545]">{errors.form}</p>}
        <div className="mt-6 pt-5 border-t-2 border-gray-200 flex items-center justify-end gap-2.5">
          {saving && <span className="mr-auto text-[13px] text-gray-500 flex items-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" />Converting…</span>}
          <button type="button" onClick={onClose} disabled={saving} className="inline-flex items-center gap-1.5 px-6 h-[44px] rounded-md bg-[#f5f5f5] hover:bg-[#ebebeb] border border-[#ddd] text-[#333] text-[14px] font-medium disabled:opacity-60"><X className="w-4 h-4" />Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-6 h-[44px] rounded-md bg-[#0d6efd] hover:bg-[#0b5ed7] text-white text-[14px] font-semibold disabled:opacity-60"><FolderKanban className="w-4 h-4" />Confirm</button>
        </div>
      </form>
    </div>
  );
}
