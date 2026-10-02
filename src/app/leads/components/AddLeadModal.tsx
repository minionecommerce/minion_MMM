'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RefreshCw, X } from 'lucide-react';
import { CONVENTIONAL_RATES, type LeadFormOptions } from '@/lib/leads/constants';
import { isHttpUrl, normalizePhone } from '@/lib/leads/format';
import type { LeadRow } from '@/lib/leads/queries';
import { ApiError, callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import FileUpload, { type ExistingFile } from './FileUpload';
import type { LeadFieldDto } from '@/lib/leads/layout-shared';

type Values = {
  customerName: string; contactNumber: string; taskAssignedPersonId: string; productOrServiceId: string;
  requirementId: string; exactRequirement: string; modeOfCustomerId: string; sourceId: string;
  location: string; exactLocation: string; locationLink: string;
  mainCategoryId: string; categoryId: string; subcategoryId: string;
  leadPersonId: string; leadStatusId: string; amount: string; conventionalRate: string;
  notes: string; leadTypeId: string; dailyTask: boolean;
};
type Errors = Partial<Record<keyof Values, string>>;

// Which fields are required, their labels and defaults come from Edit Page Layout (options.fields)
type CustomValues = Record<string, string | boolean>;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const input = 'w-full border-2 rounded-md px-3 h-[42px] text-[14px] text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-[#f5b800] disabled:bg-gray-100';
const area = 'w-full border-2 rounded-md px-3 py-2 text-[14px] text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-[#f5b800] resize-y';
const ok = 'border-gray-200';
const bad = 'border-[#d9232b]';

function withDefaults(base: Values, fields: LeadFieldDto[]): Values {
  const out: Values = { ...base };
  for (const f of fields) {
    if (!f.isSystem || !f.defaultable || f.defaultValue === null || !(f.key in out)) continue;
    if (f.key === 'dailyTask') out.dailyTask = f.defaultValue === 'true';
    else (out as Record<string, string | boolean>)[f.key] = f.defaultValue;
  }
  return out;
}

function initialCustom(lead: LeadRow | null, fields: LeadFieldDto[]): CustomValues {
  const out: CustomValues = {};
  for (const f of fields) {
    if (f.isSystem) continue;
    const stored = lead?.customFields?.[f.key];
    if (f.type === 'CHECKBOX') out[f.key] = lead ? stored === true : f.defaultValue === 'true';
    else out[f.key] = lead ? (stored === undefined || stored === null ? '' : String(stored)) : (f.defaultValue ?? '');
  }
  return out;
}

function initialValues(lead: LeadRow | null, options: LeadFormOptions, employeeId: string | null): Values {
  const me = employeeId && options.employees.some(e => e.id === employeeId) ? employeeId : '';
  const standard = options.leadTypes.find(t => t.label.toLowerCase() === 'standard')?.id ?? options.leadTypes[0]?.id ?? '';
  if (!lead) {
    return withDefaults({ customerName: '', contactNumber: '', taskAssignedPersonId: me, productOrServiceId: '', requirementId: '', exactRequirement: '', modeOfCustomerId: '', sourceId: '', location: '', exactLocation: '', locationLink: '', mainCategoryId: '', categoryId: '', subcategoryId: '', leadPersonId: me, leadStatusId: '', amount: '', conventionalRate: '0', notes: '', leadTypeId: standard, dailyTask: false }, options.fields);
  }
  return {
    customerName: lead.customerName === '—' ? '' : lead.customerName, contactNumber: lead.contactNumber, taskAssignedPersonId: lead.ids.taskAssignedPersonId ?? '',
    productOrServiceId: lead.ids.productOrServiceId ?? '', requirementId: lead.ids.requirementId ?? '', exactRequirement: lead.exactRequirement ?? '',
    modeOfCustomerId: lead.ids.modeOfCustomerId ?? '', sourceId: lead.ids.sourceId ?? '', location: lead.location ?? '', exactLocation: lead.exactLocation ?? '',
    locationLink: lead.locationLink ?? '', mainCategoryId: lead.ids.mainCategoryId ?? '', categoryId: lead.ids.categoryId ?? '', subcategoryId: lead.ids.subcategoryId ?? '',
    leadPersonId: lead.ids.leadPersonId ?? '', leadStatusId: lead.ids.leadStatusId ?? '', amount: lead.amount !== null ? String(lead.amount) : '',
    conventionalRate: String(lead.conventionalRate ?? 0), notes: lead.notes ?? '', leadTypeId: lead.ids.leadTypeId ?? standard, dailyTask: lead.dailyTask,
  };
}

function Field({ label, required, error, children, className = '' }: { label: string; required?: boolean; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-[15px] font-medium text-[#6b6b6b] mb-1.5">{label}{required && ' *'}</label>
      {children}
      {error && <p role="alert" className="text-[12px] text-[#d9232b] mt-1">{error}</p>}
    </div>
  );
}

// One custom field (added in Edit Page Layout)
function CustomField({ field, value, error, options, onChange }: {
  field: LeadFieldDto; value: string | boolean; error?: string; options: { id: string; label: string }[]; onChange: (v: string | boolean) => void;
}) {
  const cls = `${input} ${error ? bad : ok}`;
  const common = { 'aria-invalid': error ? true : undefined, 'aria-label': field.label } as const;
  const text = typeof value === 'string' ? value : '';
  if (field.type === 'CHECKBOX') {
    return (
      <div className="sm:col-span-2">
        <label className="flex items-center gap-2.5 text-[16px] text-[#555] cursor-pointer select-none">
          <input type="checkbox" checked={value === true} onChange={e => onChange(e.target.checked)} className="w-[18px] h-[18px] accent-black" />
          {field.label}{field.required && ' *'}
        </label>
        {error && <p role="alert" className="text-[12px] text-[#d9232b] mt-1">{error}</p>}
      </div>
    );
  }
  return (
    <Field label={field.label} required={field.required} error={error} className={field.type === 'TEXTAREA' ? 'sm:col-span-2' : ''}>
      {field.type === 'TEXTAREA' ? (
        <textarea className={`${area} ${error ? bad : ok}`} rows={3} value={text} onChange={e => onChange(e.target.value)} maxLength={5000} {...common} />
      ) : field.type === 'DROPDOWN' ? (
        <select className={cls} value={text} onChange={e => onChange(e.target.value)} {...common}>
          <option value="">Select {field.label}</option>
          {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      ) : (
        <input className={cls} value={text} onChange={e => onChange(e.target.value)} maxLength={500} {...common}
          type={field.type === 'NUMBER' ? 'number' : field.type === 'DATE' ? 'date' : field.type === 'EMAIL' ? 'email' : 'text'}
          step={field.type === 'NUMBER' ? 'any' : undefined}
          inputMode={field.type === 'PHONE' ? 'tel' : field.type === 'URL' ? 'url' : field.type === 'NUMBER' ? 'decimal' : undefined} />
      )}
    </Field>
  );
}

export default function AddLeadModal({ mode, lead, options: initialOptions, currentEmployeeId, storageReady, onClose, onSaved }: {
  mode: 'create' | 'edit';
  lead: LeadRow | null;
  options: LeadFormOptions;
  currentEmployeeId: string | null;
  storageReady: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const toast = useToast();
  const [options, setOptions] = useState(initialOptions);
  const start = useMemo(() => initialValues(lead, initialOptions, currentEmployeeId), [lead, initialOptions, currentEmployeeId]);
  const [v, setV] = useState<Values>(start);
  const startCustom = useMemo(() => initialCustom(lead, initialOptions.fields), [lead, initialOptions]);
  const [custom, setCustom] = useState<CustomValues>(startCustom);
  const [customErrors, setCustomErrors] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [existing, setExisting] = useState<ExistingFile[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [phase, setPhase] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const body = useRef<HTMLDivElement>(null);

  const fieldMap = useMemo(() => new Map(options.fields.map(f => [f.key, f])), [options.fields]);
  const L = (key: string, fallback: string) => fieldMap.get(key)?.label ?? fallback;
  const R = (key: string) => !!fieldMap.get(key)?.required;
  const customFields = useMemo(() => options.fields.filter(f => !f.isSystem), [options.fields]);

  const set = <K extends keyof Values>(k: K, value: Values[K]) => {
    setV(cur => ({ ...cur, [k]: value }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }));
  };

  // Edit: load the files that are already attached
  useEffect(() => {
    if (mode !== 'edit' || !lead) return;
    let live = true;
    callApi<{ attachments: ExistingFile[] }>(`/api/leads/${lead.id}`, 'GET').then(d => live && setExisting(d.attachments)).catch(() => {});
    return () => { live = false; };
  }, [mode, lead]);

  const dirty = JSON.stringify(v) !== JSON.stringify(start) || JSON.stringify(custom) !== JSON.stringify(startCustom) || files.length > 0 || removed.length > 0;
  const tryClose = () => { if (saving) return; if (dirty) setConfirmDiscard(true); else onClose(); };

  // Esc closes; Ctrl/Cmd+V pastes images
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape' && !confirmDiscard) tryClose(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  const onPaste = (e: React.ClipboardEvent) => {
    const imgs = Array.from(e.clipboardData.files).filter(f => f.type.startsWith('image/'));
    if (!imgs.length) return;
    e.preventDefault();
    setFiles(cur => [...cur, ...imgs.map((f, i) => new File([f], f.name && f.name !== 'image.png' ? f.name : `pasted-${Date.now()}-${i}.png`, { type: f.type }))].slice(0, 10));
  };

  const categories = useMemo(() => options.categories.filter(c => c.parentId === v.mainCategoryId), [options, v.mainCategoryId]);
  const subcategories = useMemo(() => options.subcategories.filter(c => c.parentId === v.categoryId), [options, v.categoryId]);

  const refreshOptions = async () => {
    setRefreshing(true);
    try { setOptions(await callApi<LeadFormOptions>('/api/leads/options', 'GET')); toast.success('Categories refreshed'); }
    catch { toast.error('Could not refresh categories'); }
    finally { setRefreshing(false); }
  };

  const validate = (): Errors => {
    const e: Errors = {};
    for (const f of options.fields) {
      if (!f.isSystem || !f.required || f.key === 'dailyTask' || f.key === 'conventionalRate' || !(f.key in v)) continue;
      if (!String(v[f.key as keyof Values]).trim()) e[f.key as keyof Values] = `${f.label} is required`;
    }
    if (!e.contactNumber && !normalizePhone(v.contactNumber)) e.contactNumber = 'Enter a valid contact number (7–15 digits)';
    if (!e.customerName && v.customerName.trim().length < 2) e.customerName = `${L('customerName', 'Customer Name')} is required`;
    if (v.locationLink.trim() && !isHttpUrl(v.locationLink.trim())) e.locationLink = 'Enter a valid http(s) link';
    if (v.amount.trim() && (!Number.isFinite(Number(v.amount)) || Number(v.amount) < 0)) e.amount = `${L('amount', 'Amount')} must be a positive number`;
    return e;
  };

  const validateCustom = (): Record<string, string> => {
    const e: Record<string, string> = {};
    for (const f of customFields) {
      const val = custom[f.key];
      const text = typeof val === 'string' ? val.trim() : '';
      if (f.type === 'CHECKBOX') { if (f.required && val !== true) e[f.key] = `${f.label} is required`; continue; }
      if (!text) { if (f.required) e[f.key] = `${f.label} is required`; continue; }
      if (f.type === 'NUMBER' && !Number.isFinite(Number(text))) e[f.key] = `${f.label} must be a number`;
      else if (f.type === 'EMAIL' && !EMAIL_RE.test(text)) e[f.key] = `${f.label} must be a valid email address`;
      else if (f.type === 'URL' && !isHttpUrl(text)) e[f.key] = 'Enter a valid http(s) link';
      else if (f.type === 'PHONE' && !normalizePhone(text)) e[f.key] = 'Enter a valid phone number (7–15 digits)';
    }
    return e;
  };

  const payload = () => ({
    customerName: v.customerName.trim(), contactNumber: v.contactNumber.trim(),
    taskAssignedPersonId: v.taskAssignedPersonId || null, productOrServiceId: v.productOrServiceId || null,
    requirementId: v.requirementId || null, exactRequirement: v.exactRequirement.trim() || null,
    modeOfCustomerId: v.modeOfCustomerId || null, sourceId: v.sourceId || null,
    location: v.location.trim() || null, exactLocation: v.exactLocation.trim() || null, locationLink: v.locationLink.trim() || null,
    mainCategoryId: v.mainCategoryId || null, categoryId: v.categoryId || null, subcategoryId: v.subcategoryId || null,
    leadPersonId: v.leadPersonId || null, leadStatusId: v.leadStatusId || null,
    amount: v.amount.trim() ? Number(v.amount) : null, conventionalRate: Number(v.conventionalRate || 0),
    notes: v.notes.trim() || null, leadTypeId: v.leadTypeId || null, dailyTask: v.dailyTask,
    customFields: Object.fromEntries(customFields.map(f => {
      const val = custom[f.key];
      if (f.type === 'CHECKBOX') return [f.key, val === true];
      const text = typeof val === 'string' ? val.trim() : '';
      return [f.key, !text ? null : f.type === 'NUMBER' ? Number(text) : text];
    })),
  });

  const uploadFiles = async (leadId: string) => {
    setPhase('Uploading files…');
    const { uploads } = await callApi<{ uploads: { id: string; name: string; uploadUrl: string }[] }>(`/api/leads/${leadId}/attachments`, 'POST', {
      files: files.map(f => ({ name: f.name, type: f.type, size: f.size })),
    });
    for (let i = 0; i < uploads.length; i++) {
      const form = new FormData();
      form.append('cacheControl', '3600');
      form.append('', files[i]);
      const res = await fetch(uploads[i].uploadUrl, { method: 'PUT', body: form, headers: { 'x-upsert': 'false' } });
      if (!res.ok) throw new Error(`Upload of ${files[i].name} failed (${res.status})`);
    }
    const { results } = await callApi<{ results: { ok: boolean; reason?: string }[] }>(`/api/leads/${leadId}/attachments`, 'PUT', { ids: uploads.map(u => u.id) });
    const failed = results.filter(r => !r.ok);
    if (failed.length) throw new Error(failed[0].reason ?? 'A file could not be verified');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const found = validate();
    const foundCustom = validateCustom();
    setErrors(found);
    setCustomErrors(foundCustom);
    if (Object.keys(found).length || Object.keys(foundCustom).length) {
      body.current?.querySelector('[aria-invalid="true"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    if (files.length && !storageReady) { setFormError('File storage is not configured yet, so files cannot be attached. Remove the files, or ask your administrator to set it up.'); return; }

    setSaving(true);
    setPhase('Saving lead…');
    let leadId = lead?.id ?? '';
    let code = lead?.code ?? '';
    try {
      if (mode === 'create') {
        const res = await callApi<{ lead: { id: string; code: string } }>('/api/leads', 'POST', payload());
        leadId = res.lead.id; code = res.lead.code;
      } else {
        await callApi(`/api/leads/${leadId}`, 'PUT', payload());
      }
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        const fieldErrors: Errors = {};
        const customFieldErrors: Record<string, string> = {};
        for (const d of err.details) {
          if (d.path.startsWith('customFields.')) customFieldErrors[d.path.slice('customFields.'.length)] = d.message;
          else if (d.path) fieldErrors[d.path as keyof Values] = d.message;
        }
        setErrors(fieldErrors);
        setCustomErrors(customFieldErrors);
      }
      setFormError(err instanceof Error ? err.message : 'Could not save the lead');
      setSaving(false); setPhase('');
      return;
    }

    // The lead is saved. File problems from here on must not make the user save again (that would duplicate the lead).
    let warning = '';
    try {
      for (const id of removed) await callApi(`/api/leads/${leadId}/attachments/${id}`, 'DELETE');
      if (files.length) await uploadFiles(leadId);
    } catch (err) {
      warning = err instanceof Error ? err.message : 'Some files could not be uploaded';
    }
    setSaving(false); setPhase('');
    if (warning) toast.error(`${code} saved, but a file problem occurred: ${warning}. Open the lead and use Edit to attach the files again.`);
    onSaved(mode === 'create' ? `Lead ${code} created` : `Lead ${code} updated`);
  };

  const ring = (k: keyof Values) => (errors[k] ? bad : ok);
  const inv = (k: keyof Values) => (errors[k] ? true : undefined);

  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center bg-black/50 p-0 sm:p-4" onPaste={onPaste}>
      <div role="dialog" aria-modal="true" aria-labelledby="lead-modal-title" className="bg-white w-full sm:max-w-[820px] max-h-screen sm:max-h-[94vh] sm:rounded-lg shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 id="lead-modal-title" className="text-[19px] font-bold text-[#444]">{mode === 'create' ? 'Add New Lead' : `Edit Lead ${lead?.code ?? ''}`}</h2>
          <button onClick={tryClose} aria-label="Close" className="text-gray-500 hover:text-black"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={save} noValidate className="flex flex-col min-h-0 flex-1">
          <div ref={body} className="overflow-y-auto px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5 flex-1">
            <Field label={L('customerName', 'Customer Name')} required={R('customerName')} error={errors.customerName}>
              <input className={`${input} ${ring('customerName')}`} aria-invalid={inv('customerName')} value={v.customerName} onChange={e => set('customerName', e.target.value)} placeholder="Enter customer name" maxLength={120} autoFocus />
            </Field>
            <Field label={L('contactNumber', 'Contact Number')} required={R('contactNumber')} error={errors.contactNumber}>
              <input className={`${input} ${ring('contactNumber')}`} aria-invalid={inv('contactNumber')} value={v.contactNumber} onChange={e => set('contactNumber', e.target.value)} placeholder="Enter contact number" inputMode="tel" maxLength={30} />
            </Field>

            <Field label={L('taskAssignedPersonId', 'Task Assigned Person')} required={R('taskAssignedPersonId')} error={errors.taskAssignedPersonId}>
              <select className={`${input} ${ring('taskAssignedPersonId')}`} aria-invalid={inv('taskAssignedPersonId')} value={v.taskAssignedPersonId} onChange={e => set('taskAssignedPersonId', e.target.value)}>
                <option value="">Select Person</option>
                {options.employees.map(o => <option key={o.id} value={o.id}>{o.name}{o.designation ? ` (${o.designation})` : ''}</option>)}
              </select>
            </Field>
            <Field label={L('productOrServiceId', 'Product or Service')} required={R('productOrServiceId')} error={errors.productOrServiceId}>
              <select className={`${input} ${ring('productOrServiceId')}`} aria-invalid={inv('productOrServiceId')} value={v.productOrServiceId} onChange={e => set('productOrServiceId', e.target.value)}>
                <option value="">Select Type</option>
                {options.productOrService.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </Field>

            <div className="space-y-3">
              <input className={`${input} ${ring('exactRequirement')}`} aria-invalid={inv('exactRequirement')} aria-label={L('exactRequirement', 'Exact Requirement')} placeholder={`${L('exactRequirement', 'Exact Requirement')}${R('exactRequirement') ? ' *' : ''}`} value={v.exactRequirement} onChange={e => set('exactRequirement', e.target.value)} maxLength={300} />
              {errors.exactRequirement && <p role="alert" className="text-[12px] text-[#d9232b] -mt-2">{errors.exactRequirement}</p>}
            </div>
            <div className="space-y-5">
              <Field label={L('modeOfCustomerId', 'Mode of Customer')} required={R('modeOfCustomerId')} error={errors.modeOfCustomerId}>
                <select className={`${input} ${ring('modeOfCustomerId')}`} aria-invalid={inv('modeOfCustomerId')} value={v.modeOfCustomerId} onChange={e => set('modeOfCustomerId', e.target.value)}>
                  <option value="">Select Mode of Customer</option>
                  {options.modesOfCustomer.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </Field>
              <Field label={L('sourceId', 'Source')} required={R('sourceId')} error={errors.sourceId}>
                <select className={`${input} ${ring('sourceId')}`} aria-invalid={inv('sourceId')} value={v.sourceId} onChange={e => set('sourceId', e.target.value)}>
                  <option value="">Select Source</option>
                  {options.sources.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </Field>
            </div>

            <Field label={L('location', 'Location')} required={R('location')} error={errors.location}>
              <input className={`${input} ${ring('location')}`} aria-invalid={inv('location')} value={v.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Chennai, Tamil Nadu, India" maxLength={200} />
            </Field>
            <Field label={L('exactLocation', 'Exact Location')} required={R('exactLocation')} error={errors.exactLocation}>
              <input className={`${input} ${ring('exactLocation')}`} aria-invalid={inv('exactLocation')} value={v.exactLocation} onChange={e => set('exactLocation', e.target.value)} placeholder="Enter exact location" maxLength={300} />
            </Field>

            <Field label={L('locationLink', 'Location Link')} required={R('locationLink')} error={errors.locationLink}>
              <input className={`${input} ${ring('locationLink')}`} aria-invalid={inv('locationLink')} value={v.locationLink} onChange={e => set('locationLink', e.target.value)} placeholder="Enter Google Maps link or location URL" inputMode="url" maxLength={2000} />
            </Field>
            <Field label={L('mainCategoryId', 'Main Category')} required={R('mainCategoryId')} error={errors.mainCategoryId}>
              <div className="flex gap-2">
                <select className={`${input} ${ring('mainCategoryId')}`} aria-invalid={inv('mainCategoryId')} value={v.mainCategoryId} onChange={e => { setErrors(x => ({ ...x, mainCategoryId: undefined })); setV(c => ({ ...c, mainCategoryId: e.target.value, categoryId: '', subcategoryId: '' })); }}>
                  <option value="">Select Main Category</option>
                  {options.mainCategories.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
                <button type="button" onClick={refreshOptions} title="Reload categories" aria-label="Reload categories" className="w-10 h-[42px] shrink-0 rounded-md bg-[#dc3545] hover:bg-[#c82333] text-white flex items-center justify-center">
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </Field>

            <Field label={L('categoryId', 'Category')} required={R('categoryId')} error={errors.categoryId}>
              <select className={`${input} ${ring('categoryId')}`} aria-invalid={inv('categoryId')} value={v.categoryId} onChange={e => setV(c => ({ ...c, categoryId: e.target.value, subcategoryId: '' }))} disabled={!v.mainCategoryId}>
                <option value="">Select Category</option>
                {categories.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </Field>
            <Field label={L('subcategoryId', 'Subcategory')} required={R('subcategoryId')} error={errors.subcategoryId}>
              <select className={`${input} ${ring('subcategoryId')}`} aria-invalid={inv('subcategoryId')} value={v.subcategoryId} onChange={e => set('subcategoryId', e.target.value)} disabled={!v.categoryId}>
                <option value="">Select Subcategory</option>
                {subcategories.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </Field>

            <Field label={L('leadPersonId', 'Lead Person')} required={R('leadPersonId')} error={errors.leadPersonId}>
              <select className={`${input} ${ring('leadPersonId')}`} aria-invalid={inv('leadPersonId')} value={v.leadPersonId} onChange={e => set('leadPersonId', e.target.value)}>
                <option value="">Select Person</option>
                {options.employees.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </Field>
            <Field label={L('leadStatusId', 'Lead Status')} required={R('leadStatusId')} error={errors.leadStatusId}>
              <select className={`${input} ${ring('leadStatusId')}`} aria-invalid={inv('leadStatusId')} value={v.leadStatusId} onChange={e => set('leadStatusId', e.target.value)}>
                <option value="">Select Lead Status</option>
                {options.leadStatuses.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </Field>

            <Field label={L('amount', 'Amount')} required={R('amount')} error={errors.amount}>
              <input className={`${input} ${ring('amount')}`} aria-invalid={inv('amount')} type="number" min={0} step="0.01" inputMode="decimal" value={v.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" />
            </Field>
            <Field label={L('conventionalRate', 'Conventional Rate')} required={R('conventionalRate')}>
              <select className={`${input} ${ok}`} value={v.conventionalRate} onChange={e => set('conventionalRate', e.target.value)}>
                {CONVENTIONAL_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </Field>

            <Field label={L('notes', 'Notes')} required={R('notes')} error={errors.notes}>
              <textarea className={`${area} ${ring('notes')}`} aria-invalid={inv('notes')} rows={4} value={v.notes} onChange={e => set('notes', e.target.value)} maxLength={5000} />
            </Field>
            <Field label={L('leadTypeId', 'Type Of Lead')} required={R('leadTypeId')} error={errors.leadTypeId}>
              <select className={`${input} ${ring('leadTypeId')}`} aria-invalid={inv('leadTypeId')} value={v.leadTypeId} onChange={e => set('leadTypeId', e.target.value)}>
                <option value="">Select Type Of Lead</option>
                {options.leadTypes.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </Field>

            {customFields.map(f => (
              <CustomField key={f.key} field={f} value={custom[f.key]} error={customErrors[f.key]} options={options.customOptions[f.key] ?? []}
                onChange={val => { setCustom(c => ({ ...c, [f.key]: val })); if (customErrors[f.key]) setCustomErrors(x => ({ ...x, [f.key]: '' })); }} />
            ))}

            <Field label={L('attachments', 'Upload Files')} className="sm:col-span-2">
              <FileUpload files={files} existing={existing} removedIds={removed} disabled={saving}
                onAdd={f => setFiles(cur => [...cur, ...f])} onRemove={i => setFiles(cur => cur.filter((_, j) => j !== i))}
                onRemoveExisting={id => setRemoved(cur => [...cur, id])} onError={m => toast.error(m)} />
              {!storageReady && <p className="text-[12px] text-amber-700 mt-1">File storage is not configured yet; files cannot be attached until it is.</p>}
            </Field>

            <label className="sm:col-span-2 flex items-center gap-2.5 text-[16px] text-[#555] cursor-pointer select-none pt-1">
              <input type="checkbox" checked={v.dailyTask} onChange={e => set('dailyTask', e.target.checked)} className="w-[18px] h-[18px] accent-black" />
              {L('dailyTask', 'Daily Task Settings')}
            </label>
          </div>

          <div className="shrink-0 border-t border-gray-200 px-6 py-4 flex flex-wrap items-center justify-end gap-3 bg-white">
            {formError && <p role="alert" className="mr-auto text-[13px] text-[#d9232b] max-w-[60%]">{formError}</p>}
            {saving && <span className="text-[13px] text-gray-500 flex items-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" />{phase}</span>}
            <button type="button" onClick={tryClose} disabled={saving} className="px-5 h-[42px] rounded-md bg-[#444] hover:bg-[#333] text-white text-[15px] font-medium disabled:opacity-60">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 h-[42px] rounded-md bg-black hover:bg-[#222] text-white text-[15px] font-medium disabled:opacity-60">Save Lead</button>
          </div>
        </form>
      </div>

      {confirmDiscard && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
          <div role="alertdialog" aria-modal="true" aria-labelledby="discard-title" className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm">
            <h3 id="discard-title" className="text-[17px] font-bold text-[#333]">Discard changes?</h3>
            <p className="text-[14px] text-gray-600 mt-2">You have unsaved changes. If you close now they will be lost.</p>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setConfirmDiscard(false)} className="px-4 h-[38px] rounded-md bg-gray-200 text-gray-800 text-[14px]">Keep editing</button>
              <button onClick={onClose} className="px-4 h-[38px] rounded-md bg-[#d9232b] text-white text-[14px]">Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
