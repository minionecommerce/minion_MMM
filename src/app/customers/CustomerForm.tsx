'use client';

import { useState, type ReactNode } from 'react';
import { ArrowDown, LayoutTemplate, Mail, Settings, X } from 'lucide-react';
import { ApiError, callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import { cleanValue } from '@/lib/records/values';
import type { FileDto, LayoutField } from '@/lib/records/types';
import type { CustomerDto } from '@/lib/quotes/types';
import { GST_STATES } from '@/lib/records/registry';
import { DEFAULT_COUNTRY, HOME_STATE_CODE } from '@/lib/customers/constants';
import { displayNameChoices } from '@/lib/customers/format';
import { GST_DEPENDENT, GST_TREATMENTS, gstRules, validateGstin } from '@/lib/customers/gst';
import type { CustomerFormData } from '@/lib/customers/types';
import { LayoutEditor } from '../records/layout-editor/LayoutEditor';
import MultiSelect from '../records/components/MultiSelect';
import { initialValue, isBlankValue, toFormValue, toPayloadValue, type FormValues } from '../records/client';
import { QFiles } from '../quotes/QField';
import { Button, Combo, DateBox, inputClass } from '../quotes/ui';
import { CRow, CUSTOMER_CSS, PhoneBox, PrefixBox, Radios, Tick } from './controls';
import { CustomerNumberModal, DuplicateModal } from './dialogs';

const SLUG = 'customers';
const SIDES = ['Attention', 'Country', 'Street1', 'Street2', 'City', 'State', 'PinCode', 'Phone', 'Fax'];
const INDIA_STATES = GST_STATES.map(([, name]) => name);

// What the screens say when the pointer rests on the (i) next to a label
const INFO: Record<string, string> = {
  customerType: 'Choose Business for a company or an organisation, Individual for a person.',
  name: 'The name shown on quotes and other documents. Pick one of the names made from the contact and company, or type your own.',
  email: 'Quotes and reminders are sent to this address.',
  language: 'The language the customer prefers for what is sent to them.',
  pan: 'The Permanent Account Number of the customer. For a registered business it is part of the GSTIN.',
  accountsReceivable: 'The account the money this customer owes is kept in.',
  creditLimit: 'The most this customer may owe at one time.',
  portalEnabled: 'Lets the customer sign in to a portal to see their quotes and payments.',
};
// Fields that sit in one row of the form with their own label (the first field of the group decides where the row is)
const GROUPS: Record<string, { id: string; label: string; info?: string }> = {
  salutation: { id: 'contact', label: 'Primary Contact', info: 'The person you deal with at this customer.' },
  firstName: { id: 'contact', label: 'Primary Contact' },
  lastName: { id: 'contact', label: 'Primary Contact' },
  workPhone: { id: 'phones', label: 'Phone', info: 'The numbers the customer can be called on.' },
  phone: { id: 'phones', label: 'Phone' },
  commEmail: { id: 'channels', label: 'Communication Channels' },
  commWhatsapp: { id: 'channels', label: 'Communication Channels' },
  billStreet1: { id: 'billAddress', label: 'Address' },
  billStreet2: { id: 'billAddress', label: 'Address' },
  shipStreet1: { id: 'shipAddress', label: 'Address' },
  shipStreet2: { id: 'shipAddress', label: 'Address' },
};
type Row = { id: string; label: string; info?: string; fields: LayoutField[] };

function rowsOf(fields: LayoutField[]): Row[] {
  const rows: Row[] = [];
  for (const f of fields) {
    const g = GROUPS[f.key];
    if (!g) { rows.push({ id: f.key, label: f.label, info: INFO[f.key], fields: [f] }); continue; }
    const row = rows.find(r => r.id === g.id);
    if (row) row.fields.push(f); else rows.push({ id: g.id, label: g.label, info: g.info, fields: [f] });
  }
  return rows;
}

type Props = {
  data: CustomerFormData;
  onSaved: (customer: CustomerDto, wasNew: boolean) => void;
  onCancel: () => void;
  onLayoutChanged: () => void; // Edit Page Layout was changed: the window asks for the layout again
  initialTab?: string; // the tab that is open first (the first tab when left out)
};

export default function CustomerForm({ data, onSaved, onCancel, onLayoutChanged, initialTab = '' }: Props) {
  const { layout, record, users, nextCode, abilities } = data;
  const toast = useToast();
  const editing = !!record;
  const [values, setValues] = useState<FormValues>(() => {
    const v: FormValues = {};
    for (const f of layout.fields) v[f.key] = record ? toFormValue(f, record.values[f.key]) : initialValue(f, null, nextCode);
    return v;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState('');
  const [tabId, setTabId] = useState(initialTab);
  const [uploads, setUploads] = useState(0);
  const [saving, setSaving] = useState(false);
  const [gstinMsg, setGstinMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [dup, setDup] = useState<{ message: string; hard: boolean; existing: CustomerDto } | null>(null);
  const [numbering, setNumbering] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(false);

  const fieldOf = (key: string) => layout.fields.find(f => f.key === key);
  const valueOf = (f: LayoutField): unknown => (f.key in values ? values[f.key] : toFormValue(f, null));
  const text = (key: string): string => { const v = values[key]; return typeof v === 'string' ? v : v == null ? '' : String(v); };
  const rules = gstRules(text('gstTreatment'));
  const shown = (f: LayoutField) => f.enabled && (!GST_DEPENDENT[f.key] || GST_DEPENDENT[f.key](rules));
  const fieldsIn = (sectionId: string) => layout.fields.filter(f => f.section === sectionId && shown(f));
  const mustHave = (f: LayoutField) => (f.key === 'gstin' ? f.required || rules.gstin === 'required' : f.required);

  const patch = (change: FormValues) => {
    setValues(cur => ({ ...cur, ...change }));
    setErrors(cur => {
      const keys = Object.keys(change).filter(k => cur[k]);
      if (!keys.length) return cur;
      const next = { ...cur };
      for (const k of keys) delete next[k];
      return next;
    });
  };
  const set = (key: string, v: unknown) => patch({ [key]: v });

  // ---------------------------------------------------------------------------
  // What the GST Treatment changes
  // ---------------------------------------------------------------------------
  const onTreatment = (id: string) => {
    const r = gstRules(id);
    const change: FormValues = { gstTreatment: id };
    for (const key of Object.keys(GST_DEPENDENT)) if (!GST_DEPENDENT[key](r)) change[key] = '';
    // a Consumer buys in the home state and pays tax; the others start as Taxable
    if (id === 'consumer') { change.placeOfSupply = HOME_STATE_CODE; change.taxPreference = 'taxable'; }
    else if (r.tax && !text('taxPreference')) change.taxPreference = 'taxable';
    patch(change);
    setGstinMsg(null);
  };

  // The shape, the state and the check character of the GSTIN; the PAN and the place of supply follow from it
  const validate = () => {
    const result = validateGstin(text('gstin'));
    if (!result.ok) { setGstinMsg({ ok: false, text: result.error }); return; }
    const change: FormValues = { gstin: result.gstin };
    if (fieldOf('pan')?.enabled && shown(fieldOf('pan')!)) change.pan = result.pan;
    const place = fieldOf('placeOfSupply');
    if (place?.enabled && place.options.some(o => o.id === result.stateCode)) change.placeOfSupply = result.stateCode;
    patch(change);
    const state = GST_STATES.find(([code]) => code === result.stateCode)?.[1];
    setGstinMsg({ ok: true, text: `The GSTIN is valid${state ? ` (${state})` : ''}. The business names are not fetched: type them in.` });
  };

  const copyBilling = () => {
    const change: FormValues = {};
    for (const s of SIDES) {
      const to = fieldOf(`ship${s}`);
      if (to?.enabled) change[to.key] = values[`bill${s}`] ?? toFormValue(to, null);
    }
    patch(change);
  };

  // ---------------------------------------------------------------------------
  // Checking and saving
  // ---------------------------------------------------------------------------
  const editable = (f: LayoutField) => shown(f) && f.type !== 'AUTO' && f.type !== 'CALC' && !f.readOnly && f.type !== 'APPROVER';

  const check = () => {
    const found: Record<string, string> = {};
    for (const f of layout.fields) {
      if (!editable(f)) continue;
      const v = valueOf(f);
      const res = cleanValue({ ...f, required: mustHave(f) }, toPayloadValue(f, v));
      if ('error' in res) found[f.key] = res.error;
      else if (mustHave(f) && isBlankValue(f, v)) found[f.key] = `${f.label} is required`;
    }
    if (!found.gstin && rules.gstin !== 'none' && text('gstin')) {
      const r = validateGstin(text('gstin'));
      if (!r.ok) found.gstin = r.error;
    }
    return found;
  };

  const goToError = (found: Record<string, string>) => {
    const key = Object.keys(found)[0];
    if (!key) return;
    const f = fieldOf(key);
    if (f && f.section !== 'info') setTabId(f.section === 'billing' || f.section === 'shipping' ? 'address' : f.section);
    requestAnimationFrame(() => {
      const el = document.getElementById(`cf-${key}`);
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el?.focus({ preventScroll: true });
    });
  };

  const submit = async (force = false) => {
    if (saving || uploads > 0) return;
    setBanner('');
    const found = check();
    setErrors(found);
    if (Object.keys(found).length) { setBanner('Please fix the highlighted fields.'); goToError(found); return; }
    const out: Record<string, unknown> = {};
    for (const f of layout.fields) if (editable(f)) out[f.key] = toPayloadValue(f, valueOf(f));
    setSaving(true);
    try {
      const res = editing
        ? await callApi<{ customer: CustomerDto }>(`/api/customers/${record!.id}`, 'PUT', { values: out, ...(force ? { force: true } : {}) })
        : await callApi<{ customer: CustomerDto }>('/api/customers', 'POST', { values: out, ...(force ? { force: true } : {}) });
      toast.success(editing ? `${res.customer.name} saved` : `${res.customer.name} added`);
      onSaved(res.customer, !editing);
    } catch (e) {
      const body = e instanceof ApiError ? (e.body as unknown as { code?: string; hard?: boolean; existing?: CustomerDto } | undefined) : undefined;
      if (body?.code === 'DUPLICATE' && body.existing) {
        setDup({ message: (e as Error).message, hard: !!body.hard, existing: body.existing });
      } else {
        const mapped: Record<string, string> = {};
        if (e instanceof ApiError && e.details?.length) for (const d of e.details) { const p = d.path.split('.'); if (p[0] === 'values' && p[1]) mapped[p[1]] = d.message; }
        setErrors(mapped);
        setBanner(Object.keys(mapped).length ? 'Please fix the highlighted fields.' : e instanceof Error ? e.message : 'Could not save the customer');
        if (Object.keys(mapped).length) goToError(mapped);
      }
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // The controls
  // ---------------------------------------------------------------------------
  const err = (key: string) => errors[key];
  const textBox = (f: LayoutField, extra = '', type = 'text') => (
    <input id={`cf-${f.key}`} type={type} value={text(f.key)} onChange={e => set(f.key, e.target.value)} maxLength={f.maxLength ?? 500} aria-invalid={!!err(f.key) || undefined} className={inputClass(!!err(f.key), extra)} />
  );
  const optionItems = (f: LayoutField) => f.options.map(o => ({ id: o.id, label: o.label }));
  const dropdown = (f: LayoutField, placeholder: string, opts: { searchable?: boolean; clearable?: boolean } = {}) => (
    <Combo htmlId={`cf-${f.key}`} value={text(f.key) || null} shown={f.options.find(o => o.id === text(f.key))?.label ?? text(f.key)} items={optionItems(f)} searchable={opts.searchable ?? f.options.length > 7}
      clearable={opts.clearable} onChange={id => set(f.key, id ?? '')} placeholder={placeholder} ariaLabel={f.label} invalid={!!err(f.key)} />
  );

  const single = (f: LayoutField, W: number): ReactNode => {
    const id = `cf-${f.key}`;
    const box = (node: ReactNode, extra = '') => <div style={{ width: W }} className={`max-w-full ${extra}`}>{node}</div>;
    switch (f.key) {
      case 'customerType':
        return <Radios name="customerType" value={text('customerType')} options={f.options} onChange={v => set('customerType', v)} />;
      case 'name':
        return box(
          <Combo htmlId={id} value={text('name') || null} shown={text('name')} items={displayNameChoices(values).map(c => ({ id: c, label: c }))} creatable onChange={v => set('name', v ?? '')}
            placeholder="Select or type to add" ariaLabel={f.label} invalid={!!err('name')} emptyText="Type a name to add it" />,
        );
      case 'email':
        return box(<><Mail className="w-3.5 h-3.5 text-[#6d7189] absolute left-[10px] top-[10px]" aria-hidden />{textBox(f, 'pl-[30px]', 'email')}</>, 'relative');
      case 'customerCode':
        return box(
          <>
            <div id={id} className="w-full h-[34px] border border-[#d7d5e1] rounded-[4px] px-[10px] pr-8 bg-white text-[13px] flex items-center truncate">{record?.code ?? nextCode}</div>
            <button type="button" onClick={() => setNumbering(true)} aria-label="Configure customer number preferences" title="Configure customer number preferences" className="absolute right-0 top-0 h-[34px] w-8 flex items-center justify-center text-[#548df6] hover:bg-[#f1f1fa] rounded-r-[4px]"><Settings className="w-3.5 h-3.5" /></button>
          </>,
          'relative',
        );
      case 'language':
        return box(dropdown(f, 'Select a language'));
      case 'gstTreatment':
        return box(
          <Combo htmlId={id} value={text('gstTreatment') || null} shown={f.options.find(o => o.id === text('gstTreatment'))?.label ?? ''} items={f.options.map(o => ({ id: o.id, label: o.label, sub: GST_TREATMENTS.find(t => t.id === o.id)?.hint ?? null }))}
            onChange={v => onTreatment(v ?? '')} placeholder="Select a GST treatment" ariaLabel={f.label} invalid={!!err(f.key)} />,
        );
      case 'gstin':
        return box(
          <>
            <input id={id} value={text('gstin')} onChange={e => { set('gstin', e.target.value.toUpperCase()); setGstinMsg(null); }} maxLength={15} aria-invalid={!!err('gstin') || undefined} className={inputClass(!!err('gstin'))} />
            <button type="button" onClick={validate} className="mt-[6px] text-[13px] text-[#548df6] hover:text-[#355bd4]">Validate</button>
            {gstinMsg && <p className={`mt-[4px] text-[12px] ${gstinMsg.ok ? 'text-[#2fa070]' : 'text-[#d9232b]'}`}>{gstinMsg.text}</p>}
          </>,
        );
      case 'placeOfSupply':
        return box(dropdown(f, '', { searchable: true }));
      case 'pan':
        return box(textBox(f));
      case 'taxPreference':
        return <Radios name="taxPreference" value={text('taxPreference')} options={f.options} onChange={v => set('taxPreference', v)} />;
      case 'currency':
        return box(dropdown(f, 'Select a currency', { searchable: true }));
      case 'accountsReceivable':
        return box(dropdown(f, 'Select an account'));
      case 'openingBalance':
      case 'creditLimit':
        return box(<PrefixBox id={id} prefix={f.prefix ?? 'INR'} value={text(f.key)} onChange={v => set(f.key, v)} invalid={!!err(f.key)} />);
      case 'paymentTerms':
        return box(dropdown(f, 'Select payment terms'));
      case 'portalEnabled':
        return <Tick id={id} checked={values.portalEnabled === true} onChange={v => set('portalEnabled', v)} label="Allow portal access for this customer" />;
      case 'remarks':
        return <textarea id={id} value={text('remarks')} onChange={e => set('remarks', e.target.value)} rows={7} maxLength={f.maxLength ?? 5000} placeholder="Notes about this customer, for your team only" className={`${inputClass(!!err('remarks'))} h-auto py-[6px] resize-y w-full max-w-[640px]`} />;
      case 'billCountry': case 'shipCountry':
        return box(dropdown(f, 'Select', { searchable: true }));
      case 'billState': case 'shipState': {
        const side = f.key.slice(0, 4);
        const india = (text(`${side}Country`) || DEFAULT_COUNTRY) === 'India';
        return box(
          <Combo htmlId={id} value={text(f.key) || null} shown={text(f.key)} items={india ? INDIA_STATES.map(st => ({ id: st, label: st })) : []} creatable onChange={v => set(f.key, v ?? '')}
            placeholder="Select or type to add" ariaLabel={f.label} invalid={!!err(f.key)} emptyText="Type a name to add it" />,
        );
      }
      case 'billPhone': case 'shipPhone':
        return box(<PhoneBox id={id} value={text(f.key)} onChange={v => set(f.key, v)} invalid={!!err(f.key)} />);
      default:
        return box(generic(f));
    }
  };

  // A field that has no place of its own in the Zoho form (one added in Edit Page Layout): an input of its type
  const generic = (f: LayoutField): ReactNode => {
    const id = `cf-${f.key}`;
    const invalid = !!err(f.key);
    switch (f.type) {
      case 'TEXTAREA':
        return <textarea id={id} value={text(f.key)} onChange={e => set(f.key, e.target.value)} rows={3} maxLength={f.maxLength ?? 5000} className={`${inputClass(invalid)} h-auto py-[5px] resize-y`} />;
      case 'NUMBER':
        return <input id={id} type="text" inputMode="decimal" value={text(f.key)} onChange={e => set(f.key, e.target.value)} className={inputClass(invalid)} />;
      case 'CURRENCY':
        return <PrefixBox id={id} prefix={f.prefix ?? f.currency} value={text(f.key)} onChange={v => set(f.key, v)} invalid={invalid} />;
      case 'DATE':
        return <DateBox id={id} value={text(f.key)} onChange={v => set(f.key, v)} invalid={invalid} />;
      case 'DATETIME':
        return <input id={id} type="datetime-local" value={text(f.key)} onChange={e => set(f.key, e.target.value)} className={inputClass(invalid)} />;
      case 'EMAIL':
        return <input id={id} type="email" value={text(f.key)} onChange={e => set(f.key, e.target.value)} maxLength={200} className={inputClass(invalid)} />;
      case 'PHONE':
        return <PhoneBox id={id} value={text(f.key)} onChange={v => set(f.key, v)} invalid={invalid} />;
      case 'URL':
        return <input id={id} type="url" value={text(f.key)} onChange={e => set(f.key, e.target.value)} maxLength={2000} placeholder="https://" className={inputClass(invalid)} />;
      case 'CHECKBOX':
        return <Tick id={id} checked={values[f.key] === true} onChange={v => set(f.key, v)} label={f.label} />;
      case 'DROPDOWN':
        return dropdown(f, 'Select', { searchable: f.options.length > 7, clearable: true });
      case 'MULTISELECT':
        return <MultiSelect htmlId={id} label={f.label} options={f.options} value={Array.isArray(values[f.key]) ? (values[f.key] as string[]) : []} onChange={v => set(f.key, v)} className={inputClass(invalid)} />;
      case 'USER':
        return <Combo htmlId={id} value={text(f.key) || null} shown={users.find(u => u.id === text(f.key))?.label ?? ''} items={users} clearable onChange={v => set(f.key, v ?? '')} placeholder="Select a person" ariaLabel={f.label} invalid={invalid} />;
      case 'FILE':
        return <QFiles slug={SLUG} fieldKey={f.key} label={f.label} files={(valueOf(f) as FileDto[] | undefined) ?? []} maxFiles={f.maxFiles} onChange={v => set(f.key, v)} onBusy={d => setUploads(n => n + d)} />;
      default:
        return textBox(f);
    }
  };

  // One row of a section: a group of fields (Primary Contact, Phone ...) or a single field
  const controlOf = (row: Row, W: number): ReactNode => {
    const fields = row.fields;
    switch (row.id) {
      case 'contact': {
        const sal = fields.find(f => f.key === 'salutation');
        const first = fields.find(f => f.key === 'firstName');
        const last = fields.find(f => f.key === 'lastName');
        return (
          <div className="flex flex-wrap sm:flex-nowrap gap-[10px] max-w-full">
            {sal && <div style={{ width: 146 }} className="max-w-full">{dropdown(sal, 'Salutation', { searchable: false })}</div>}
            {first && <div style={{ width: 155 }} className="max-w-full"><input id="cf-firstName" value={text('firstName')} onChange={e => set('firstName', e.target.value)} placeholder="First Name" maxLength={100} className={inputClass(!!err('firstName'))} /></div>}
            {last && <div style={{ width: 157 }} className="max-w-full"><input id="cf-lastName" value={text('lastName')} onChange={e => set('lastName', e.target.value)} placeholder="Last Name" maxLength={100} className={inputClass(!!err('lastName'))} /></div>}
          </div>
        );
      }
      case 'phones':
        return (
          <div className="flex flex-wrap gap-x-[30px] gap-y-[10px]">
            {fields.map(f => <div key={f.key} className="w-[191px] max-w-full"><PhoneBox id={`cf-${f.key}`} value={text(f.key)} onChange={v => set(f.key, v)} placeholder={f.label} invalid={!!err(f.key)} /></div>)}
          </div>
        );
      case 'channels':
        return <div className="flex flex-wrap gap-x-[30px]">{fields.map(f => <Tick key={f.key} id={`cf-${f.key}`} checked={values[f.key] === true} onChange={v => set(f.key, v)} label={f.label} />)}</div>;
      case 'billAddress':
      case 'shipAddress':
        return (
          <div style={{ width: W }} className="space-y-[10px] max-w-full">
            {fields.map(f => <textarea key={f.key} id={`cf-${f.key}`} value={text(f.key)} onChange={e => set(f.key, e.target.value)} rows={2} maxLength={f.maxLength ?? 500} placeholder={f.label} className={`${inputClass(!!err(f.key))} h-[62px] py-[5px] resize-y`} />)}
          </div>
        );
      default:
        return single(fields[0], W);
    }
  };

  const rowErrors = (row: Row) => row.fields.map(f => err(f.key)).find(Boolean);

  const renderRows = (fields: LayoutField[], labelWidth: number, narrow = false): ReactNode => rowsOf(fields).map(row => (
    <CRow key={row.id} label={row.label} required={row.fields.some(mustHave)} info={row.info} error={rowErrors(row)} id={`cf-${row.fields[0].key}`} labelWidth={labelWidth}>
      {controlOf(row, narrow ? 194 : 302)}
    </CRow>
  ));

  // ---------------------------------------------------------------------------
  // The tabs: every section but the top one; Billing and Shipping Address are one tab (Address)
  // ---------------------------------------------------------------------------
  type Tab = { id: string; label: string; sections: string[] };
  const tabs: Tab[] = [];
  for (const s of layout.sections.filter(x => x.kind === 'FORM' && x.id !== 'info')) {
    if (!fieldsIn(s.id).length) continue;
    if (s.id === 'billing' || s.id === 'shipping') {
      const t = tabs.find(x => x.id === 'address');
      if (t) t.sections.push(s.id); else tabs.push({ id: 'address', label: 'Address', sections: [s.id] });
    } else tabs.push({ id: s.id, label: s.label, sections: [s.id] });
  }
  const active = tabs.find(t => t.id === tabId) ?? tabs[0];
  const sectionLabel = (id: string) => layout.sections.find(s => s.id === id)?.label ?? id;

  const body = (
    <>
      <div className="pt-[6px]">{renderRows(fieldsIn('info'), 166)}</div>
      {tabs.length > 0 && (
        <>
          <div role="tablist" aria-label="Customer details" className="mt-[6px] flex flex-wrap gap-x-[36px] border-b border-[#ebeaf2]">
            {tabs.map(t => (
              <button key={t.id} role="tab" type="button" aria-selected={active?.id === t.id} onClick={() => setTabId(t.id)}
                className={`relative pb-[10px] pt-[6px] text-[13px] ${active?.id === t.id ? 'font-semibold text-[#22263b]' : 'text-[#22263b] hover:text-[#548df6]'}`}>
                {t.label}
                {active?.id === t.id && <span className="absolute left-0 right-0 -bottom-px h-[3px] rounded-full bg-[#548df6]" aria-hidden />}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="pt-[22px]">
            {active && active.id === 'address' ? (
              <div className="flex flex-col lg:flex-row gap-x-[60px] gap-y-6">
                {active.sections.map(sid => (
                  <div key={sid} className="min-w-0">
                    <div className="flex items-baseline gap-2 mb-[18px]">
                      <h3 className="text-[16px] font-semibold text-[#22263b]">{sectionLabel(sid)}</h3>
                      {sid === 'shipping' && fieldsIn('billing').length > 0 && (
                        <span className="text-[13px] text-[#22263b]">( <button type="button" onClick={copyBilling} className="inline-flex items-center gap-1 text-[#548df6] hover:text-[#355bd4]"><ArrowDown className="w-3.5 h-3.5" aria-hidden />Copy billing address</button> )</span>
                      )}
                    </div>
                    {renderRows(fieldsIn(sid), 129, true)}
                  </div>
                ))}
              </div>
            ) : active ? renderRows(active.sections.flatMap(fieldsIn), 166) : null}
          </div>
        </>
      )}
    </>
  );

  return (
    <div className="flex flex-col max-h-[calc(100vh-24px)] bg-white rounded-[8px] shadow-[0_12px_40px_rgba(34,38,59,0.25)] text-[#22263b]">
      <style dangerouslySetInnerHTML={{ __html: CUSTOMER_CSS }} />
      <div className="flex items-center justify-between gap-3 px-6 h-[52px] shrink-0 border-b border-[#ebeaf2]">
        <h2 className="text-[17px] font-semibold">{editing ? 'Edit Customer' : 'New Customer'}</h2>
        <div className="flex items-center gap-2">
          {abilities.layout && (
            <button type="button" onClick={() => setLayoutOpen(true)} title="Edit Page Layout" aria-label="Edit Page Layout" className="inline-flex items-center gap-1.5 h-[30px] px-2.5 rounded-[4px] border border-[#d7d5e1] text-[12px] hover:bg-[#f1f1fa]"><LayoutTemplate className="w-3.5 h-3.5" aria-hidden />Edit Page Layout</button>
          )}
          <button type="button" onClick={onCancel} disabled={saving} aria-label="Close" className="w-7 h-7 flex items-center justify-center rounded text-[#e5484d] hover:bg-[#fdeeee]"><X className="w-5 h-5" /></button>
        </div>
      </div>
      <div className="q-scroll overflow-y-auto px-6 py-[18px] min-h-[200px]">{body}</div>
      <div className="flex flex-wrap items-center gap-2 px-6 py-3 shrink-0 border-t border-[#ebeaf2]">
        <Button kind="blue" onClick={() => void submit()} busy={saving} disabled={uploads > 0}>Save</Button>
        <Button onClick={onCancel} disabled={saving}>Cancel</Button>
        {uploads > 0 && <span className="text-[12px] text-[#6d7189]">Uploading files…</span>}
        {banner && <span role="alert" className="text-[13px] text-[#d9232b] ml-2">{banner}</span>}
      </div>
      {dup && <DuplicateModal dup={dup} busy={saving} onUse={() => onSaved(dup.existing, false)} onForce={() => { setDup(null); void submit(true); }} onClose={() => setDup(null)} />}
      {numbering && <CustomerNumberModal canEdit={abilities.layout} onClose={() => setNumbering(false)} />}
      {layoutOpen && <LayoutEditor moduleId="customer" initial={layout} onClose={changed => { setLayoutOpen(false); if (changed) onLayoutChanged(); }} />}
    </div>
  );
}
