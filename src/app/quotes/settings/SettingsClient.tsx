'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { ApiError, callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import { ROUNDING_MODES, type CompanySettings, type DisplaySettings, type QuoteAbilities, type QuoteSettings, type RoundingMode, type TaxDef, type TemplateSettings, type WithholdingDef } from '@/lib/quotes/types';
import { CompanyFields, type CompanyImages } from '../CompanyFields';
import { NumberingModal } from '../modals';
import { Button, inputClass } from '../ui';

const TABS = [
  ['numbering', 'Quote Number'], ['taxes', 'Taxes'], ['tds', 'TDS'], ['tcs', 'TCS'], ['rounding', 'Round Off'], ['display', 'Amounts & Title'], ['company', 'Company & Bank'], ['templates', 'Messages & Validity'],
] as const;
type Tab = (typeof TABS)[number][0];

const lab = 'block text-[13px] text-[#22263b] mb-1';
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30);

function Card({ title, note, children, footer }: { title: string; note?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <section className="border border-[#ebeaf2] rounded-[8px] bg-white">
      <div className="px-5 py-3 border-b border-[#ebeaf2]"><h2 className="text-[15px] font-semibold">{title}</h2>{note && <p className="mt-0.5 text-[13px] text-[#6d7189]">{note}</p>}</div>
      <div className="px-5 py-4">{children}</div>
      {footer && <div className="px-5 py-3 border-t border-[#ebeaf2] flex items-center justify-end gap-2">{footer}</div>}
    </section>
  );
}

// Saves one group of the settings
function useSave(group: string, onSaved: (s: QuoteSettings) => void) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async (value: unknown) => {
    setBusy(true);
    setError('');
    try {
      const res = await callApi<{ settings: QuoteSettings }>('/api/quotes/settings', 'PUT', { group, value });
      toast.success('Saved');
      onSaved(res.settings);
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, save, clear: () => setError('') };
}

export default function SettingsClient({ settings: initial, images: initialImages, nextNumber, today, abilities }: {
  settings: QuoteSettings; images: CompanyImages; nextNumber: string; today: string; abilities: QuoteAbilities;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('numbering');
  const [settings, setSettings] = useState(initial);
  const [images, setImages] = useState(initialImages);
  const [numbering, setNumbering] = useState(false);
  const edit = abilities.settings;
  const saved = (s: QuoteSettings) => { setSettings(s); router.refresh(); };

  return (
    <div className="min-h-screen">
      <div className="min-h-[55px] px-[25px] py-2 flex items-center gap-3">
        <Link href="/quotes" aria-label="Back to quotes" className="w-8 h-8 rounded-full border border-[#d7d5e1] hover:bg-[#f1f1fa] flex items-center justify-center"><ArrowLeft className="w-4 h-4" /></Link>
        <h1 className="text-[18px] font-semibold text-[#222529]">Quote Settings</h1>
        {!edit && <span className="text-[13px] text-[#6d7189]">Only a Super Admin can change these settings.</span>}
      </div>

      <div className="px-[25px] pb-10 grid grid-cols-1 lg:grid-cols-[210px_minmax(0,1fr)] gap-6 max-w-[1100px]">
        <nav aria-label="Settings" className="flex lg:flex-col gap-1 overflow-x-auto">
          {TABS.map(([id, text]) => (
            <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined} className={`text-left px-3 h-[36px] rounded-[4px] text-[13px] whitespace-nowrap ${tab === id ? 'bg-[#f1f1fa] text-[#355bd4] font-medium' : 'hover:bg-[#f9f9fb] text-[#22263b]'}`}>{text}</button>
          ))}
        </nav>

        <div className="min-w-0">
          {tab === 'numbering' && (
            <Card title="Quote Number" note="How quote numbers are made. Nothing here is fixed in the program: change the format and the next quote follows it.">
              <dl className="grid grid-cols-[190px_minmax(0,1fr)] gap-y-2 text-[13px]">
                <dt className="text-[#6d7189]">Format</dt><dd className="font-mono text-[13px]">{settings.numbering.pattern}</dd>
                <dt className="text-[#6d7189]">Next quote number</dt><dd className="font-medium" data-next-number>{nextNumber}</dd>
                <dt className="text-[#6d7189]">New series</dt><dd>{settings.numbering.resetEachFy ? 'Every financial year' : 'Never (one series)'}</dd>
                <dt className="text-[#6d7189]">Financial year starts</dt><dd>{['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][settings.numbering.fyStartMonth - 1]}</dd>
                <dt className="text-[#6d7189]">Typing the number by hand</dt><dd>{settings.numbering.allowManual ? 'Allowed' : 'Not allowed'}</dd>
              </dl>
              <div className="mt-4"><Button kind="blue" onClick={() => setNumbering(true)}>{edit ? 'Change quote number preferences' : 'View preferences'}</Button></div>
            </Card>
          )}
          {tab === 'taxes' && <TaxesCard initial={settings.taxes} edit={edit} onSaved={saved} />}
          {tab === 'tds' && <WithholdingCard group="tds" title="TDS" note="The TDS rates a quote can deduct." initial={settings.tds} edit={edit} onSaved={saved} />}
          {tab === 'tcs' && <WithholdingCard group="tcs" title="TCS" note="The TCS rates a quote can add." initial={settings.tcs} edit={edit} onSaved={saved} />}
          {tab === 'rounding' && <RoundingCard initial={settings.rounding.mode} edit={edit} onSaved={saved} />}
          {tab === 'display' && <DisplayCard initial={settings.display} edit={edit} onSaved={saved} />}
          {tab === 'company' && <CompanyCard initial={settings.company} images={images} setImages={setImages} edit={edit} onSaved={saved} />}
          {tab === 'templates' && <TemplatesCard initial={settings.templates} edit={edit} onSaved={saved} />}
        </div>
      </div>

      {numbering && <NumberingModal settings={settings} canEdit={edit} day={today} onClose={() => setNumbering(false)} onSaved={s => { setNumbering(false); saved(s); }} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
export function TaxesCard({ initial, edit, onSaved }: { initial: TaxDef[]; edit: boolean; onSaved: (s: QuoteSettings) => void }) {
  const [rows, setRows] = useState<TaxDef[]>(initial);
  const { busy, error, save, clear } = useSave('taxes', onSaved);
  const set = (i: number, p: Partial<TaxDef>) => { setRows(r => r.map((x, k) => (k === i ? { ...x, ...p } : x))); clear(); };
  // only one tax is the default, and a tax that is switched off cannot be it
  const setDefault = (i: number, on: boolean) => { setRows(r => r.map((x, k) => ({ ...x, isDefault: k === i ? on : false }))); clear(); };
  const setActive = (i: number, on: boolean) => set(i, on ? { active: true } : { active: false, isDefault: false });
  const setPart = (i: number, j: number, p: Partial<{ name: string; rate: number }>) => set(i, { components: rows[i].components.map((c, k) => (k === j ? { ...c, ...p } : c)) });
  return (
    <Card title="Taxes" note="A tax can be split into parts: GST18 = CGST9 + SGST9. The parts must add up to the rate. The Default tax is what a new item row on a quote starts with. A tax that quotes use cannot be deleted; switch it off instead." footer={edit ? <Button kind="blue" onClick={() => save(rows)} busy={busy}>Save</Button> : undefined}>
      {error && <p role="alert" className="mb-3 text-[13px] text-[#d9232b]">{error}</p>}
      <div className="space-y-3">
        {rows.map((t, i) => (
          <div key={t.id} className="border border-[#ebeaf2] rounded-[6px] p-3" data-tax-row>
            <div className="flex flex-wrap items-end gap-3">
              <div><label className={lab}>Name</label><input value={t.name} disabled={!edit} onChange={e => set(i, { name: e.target.value })} maxLength={40} className={inputClass(false, 'w-[150px]')} /></div>
              <div><label className={lab}>Rate %</label><input value={t.rate} disabled={!edit} inputMode="decimal" onChange={e => { const n = Number(e.target.value); set(i, { rate: Number.isFinite(n) ? n : 0 }); }} className={inputClass(false, 'w-[90px]')} /></div>
              <label className="flex items-center gap-2 text-[13px] pb-1"><input type="checkbox" className="q-check" checked={t.active} disabled={!edit} onChange={e => setActive(i, e.target.checked)} /> Active</label>
              <label className="flex items-center gap-2 text-[13px] pb-1" title="A new item row on a quote starts with this tax"><input type="checkbox" className="q-check" checked={!!t.isDefault} disabled={!edit || !t.active} onChange={e => setDefault(i, e.target.checked)} data-tax-default /> Default</label>
              {edit && <button type="button" onClick={() => setRows(r => r.filter((_, k) => k !== i))} aria-label={`Delete ${t.name}`} className="ml-auto text-[#d9232b] hover:bg-[#fdeeee] rounded p-1.5"><Trash2 className="w-4 h-4" /></button>}
            </div>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <span className="text-[13px] text-[#6d7189] pb-[6px]">Parts:</span>
              {t.components.map((c, j) => (
                <div key={j} className="flex items-end gap-1.5">
                  <input value={c.name} aria-label="Part name" disabled={!edit} onChange={e => setPart(i, j, { name: e.target.value })} maxLength={30} className={inputClass(false, 'w-[110px]')} />
                  <input value={c.rate} aria-label="Part rate" disabled={!edit} inputMode="decimal" onChange={e => { const n = Number(e.target.value); setPart(i, j, { rate: Number.isFinite(n) ? n : 0 }); }} className={inputClass(false, 'w-[70px]')} />
                  <span className="text-[13px] pb-[6px]">%</span>
                  {edit && t.components.length > 1 && <button type="button" aria-label="Remove part" onClick={() => set(i, { components: t.components.filter((_, k) => k !== j) })} className="text-[#9ca0ab] hover:text-[#d9232b] pb-[5px]"><Trash2 className="w-3.5 h-3.5" /></button>}
                </div>
              ))}
              {edit && t.components.length < 4 && <button type="button" onClick={() => set(i, { components: [...t.components, { name: '', rate: 0 }] })} className="text-[13px] text-[#548df6] hover:underline pb-[6px]">+ part</button>}
            </div>
          </div>
        ))}
      </div>
      {edit && <div className="mt-3"><Button kind="ghost" onClick={() => setRows(r => [...r, { id: `tax_${Math.random().toString(36).slice(2, 8)}`, name: '', rate: 0, components: [{ name: '', rate: 0 }], active: true }])}><Plus className="w-3.5 h-3.5" /> Add a tax</Button></div>}
    </Card>
  );
}

function WithholdingCard({ group, title, note, initial, edit, onSaved }: { group: 'tds' | 'tcs'; title: string; note: string; initial: WithholdingDef[]; edit: boolean; onSaved: (s: QuoteSettings) => void }) {
  const [rows, setRows] = useState<WithholdingDef[]>(initial);
  const { busy, error, save, clear } = useSave(group, onSaved);
  const set = (i: number, p: Partial<WithholdingDef>) => { setRows(r => r.map((x, k) => (k === i ? { ...x, ...p } : x))); clear(); };
  return (
    <Card title={title} note={note} footer={edit ? <Button kind="blue" onClick={() => save(rows)} busy={busy}>Save</Button> : undefined}>
      {error && <p role="alert" className="mb-3 text-[13px] text-[#d9232b]">{error}</p>}
      <div className="space-y-2">
        {rows.map((t, i) => (
          <div key={t.id} className="flex flex-wrap items-center gap-3" data-withholding-row>
            <input value={t.name} aria-label="Name" disabled={!edit} onChange={e => set(i, { name: e.target.value })} maxLength={60} className={inputClass(false, 'flex-1 min-w-[220px]')} />
            <input value={t.rate} aria-label="Rate %" disabled={!edit} inputMode="decimal" onChange={e => { const n = Number(e.target.value); set(i, { rate: Number.isFinite(n) ? n : 0 }); }} className={inputClass(false, 'w-[80px]')} />
            <span className="text-[13px]">%</span>
            <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" className="q-check" checked={t.active} disabled={!edit} onChange={e => set(i, { active: e.target.checked })} /> Active</label>
            {edit && <button type="button" onClick={() => setRows(r => r.filter((_, k) => k !== i))} aria-label={`Delete ${t.name}`} className="text-[#d9232b] hover:bg-[#fdeeee] rounded p-1.5"><Trash2 className="w-4 h-4" /></button>}
          </div>
        ))}
        {rows.length === 0 && <p className="text-[13px] text-[#6d7189]">No {title} rates.</p>}
      </div>
      {edit && <div className="mt-3"><Button kind="ghost" onClick={() => setRows(r => [...r, { id: `${group}_${slug(String(Date.now()))}${Math.random().toString(36).slice(2, 5)}`, name: '', rate: 0, active: true }])}><Plus className="w-3.5 h-3.5" /> Add a rate</Button></div>}
    </Card>
  );
}

function RoundingCard({ initial, edit, onSaved }: { initial: RoundingMode; edit: boolean; onSaved: (s: QuoteSettings) => void }) {
  const [mode, setMode] = useState<RoundingMode>(initial);
  const { busy, error, save } = useSave('rounding', onSaved);
  return (
    <Card title="Round Off" note="How the total of a quote is rounded. The Round Off line shows the difference. A quote keeps the rounding it was saved with." footer={edit ? <Button kind="blue" onClick={() => save({ mode })} busy={busy}>Save</Button> : undefined}>
      {error && <p role="alert" className="mb-3 text-[13px] text-[#d9232b]">{error}</p>}
      <div className="space-y-2">
        {ROUNDING_MODES.map(m => (
          <label key={m.mode} className="flex items-center gap-2 text-[13px]"><input type="radio" name="rounding" className="q-radio" checked={mode === m.mode} disabled={!edit} onChange={() => setMode(m.mode)} /> {m.label}</label>
        ))}
      </div>
    </Card>
  );
}

function DisplayCard({ initial, edit, onSaved }: { initial: DisplaySettings; edit: boolean; onSaved: (s: QuoteSettings) => void }) {
  const [v, setV] = useState(initial);
  const { busy, error, save, clear } = useSave('display', onSaved);
  const set = <K extends keyof DisplaySettings>(k: K, x: DisplaySettings[K]) => { setV(c => ({ ...c, [k]: x })); clear(); };
  return (
    <Card title="Amounts & Title" note="How amounts are written and the title printed on the quote document." footer={edit ? <Button kind="blue" onClick={() => save(v)} busy={busy}>Save</Button> : undefined}>
      {error && <p role="alert" className="mb-3 text-[13px] text-[#d9232b]">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label htmlFor="ds-title" className={lab}>Title of the quote document</label><input id="ds-title" value={v.documentTitle} disabled={!edit} onChange={e => set('documentTitle', e.target.value)} maxLength={60} className={inputClass()} /></div>
        <div><label htmlFor="ds-symbol" className={lab}>Currency symbol</label><input id="ds-symbol" value={v.currencySymbol} disabled={!edit} onChange={e => set('currencySymbol', e.target.value)} maxLength={8} className={inputClass()} /></div>
        <div><label htmlFor="ds-group" className={lab}>Digits are grouped like</label><select id="ds-group" value={v.grouping} disabled={!edit} onChange={e => set('grouping', e.target.value as DisplaySettings['grouping'])} className={inputClass()}><option value="western">205,596.00</option><option value="indian">2,05,596.00</option></select></div>
        <div><label htmlFor="ds-words" className={lab}>Amount in words uses</label><select id="ds-words" value={v.wordsStyle} disabled={!edit} onChange={e => set('wordsStyle', e.target.value as DisplaySettings['wordsStyle'])} className={inputClass()}><option value="international">Thousand, Million</option><option value="indian">Thousand, Lakh, Crore</option></select></div>
        <div><label htmlFor="ds-cur" className={lab}>Currency name in words</label><input id="ds-cur" value={v.wordsCurrency} disabled={!edit} onChange={e => set('wordsCurrency', e.target.value)} maxLength={40} className={inputClass()} /></div>
      </div>
    </Card>
  );
}

function CompanyCard({ initial, images, setImages, edit, onSaved }: {
  initial: CompanySettings; images: CompanyImages; setImages: (i: CompanyImages) => void; edit: boolean; onSaved: (s: QuoteSettings) => void;
}) {
  const [v, setV] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const { busy, error, save, clear } = useSave('company', onSaved);
  const set = <K extends keyof CompanySettings>(k: K, x: CompanySettings[K]) => { setV(c => ({ ...c, [k]: x })); clear(); };

  return (
    <Card title="Company & Bank" note="Printed on every quote document. Leave the bank details empty to leave them off. The same details can be changed in Edit Page Layout (Quote document)." footer={edit ? <Button kind="blue" onClick={() => save(v)} busy={busy || uploading}>Save</Button> : undefined}>
      {error && <p role="alert" className="mb-3 text-[13px] text-[#d9232b]">{error}</p>}
      <CompanyFields value={v} onChange={set} images={images} onImages={setImages} edit={edit} onUploading={setUploading} />
    </Card>
  );
}

function TemplatesCard({ initial, edit, onSaved }: { initial: TemplateSettings; edit: boolean; onSaved: (s: QuoteSettings) => void }) {
  const [v, setV] = useState(initial);
  const { busy, error, save, clear } = useSave('templates', onSaved);
  const set = <K extends keyof TemplateSettings>(k: K, x: TemplateSettings[K]) => { setV(c => ({ ...c, [k]: x })); clear(); };
  return (
    <Card title="Messages & Validity" note="The message that opens when a quote is sent, and how long a quote or its link stays valid. In the texts you can use {NUMBER}, {CUSTOMER}, {COMPANY}, {TOTAL}, {EXPIRY} and {LINK}." footer={edit ? <Button kind="blue" onClick={() => save(v)} busy={busy}>Save</Button> : undefined}>
      {error && <p role="alert" className="mb-3 text-[13px] text-[#d9232b]">{error}</p>}
      <div className="space-y-4">
        <div><label htmlFor="tp-subject" className={lab}>E-mail subject</label><input id="tp-subject" value={v.emailSubject} disabled={!edit} onChange={e => set('emailSubject', e.target.value)} maxLength={200} className={inputClass()} /></div>
        <div><label htmlFor="tp-body" className={lab}>E-mail / WhatsApp message</label><textarea id="tp-body" value={v.emailBody} disabled={!edit} onChange={e => set('emailBody', e.target.value)} rows={9} maxLength={5000} className={`${inputClass()} h-auto py-2 leading-[18px]`} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label htmlFor="tp-share" className={lab}>A shared link works for (days)</label><input id="tp-share" type="number" min={1} max={365} value={v.shareValidDays} disabled={!edit} onChange={e => set('shareValidDays', Math.max(1, Math.min(365, Number(e.target.value) || 1)))} className={inputClass()} /></div>
          <div><label htmlFor="tp-valid" className={lab}>Expiry Date of a new quote (days after the quote date)</label><input id="tp-valid" type="number" min={1} max={3650} value={v.defaultValidDays ?? ''} placeholder="No default" disabled={!edit} onChange={e => set('defaultValidDays', e.target.value === '' ? null : Math.max(1, Math.min(3650, Number(e.target.value) || 1)))} className={inputClass()} /></div>
        </div>
      </div>
    </Card>
  );
}
