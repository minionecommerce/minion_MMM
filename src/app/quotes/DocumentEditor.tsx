'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import { HEADER_NAMES, type CompanySettings, type HeaderRow, type QuoteAbilities, type QuoteSettings } from '@/lib/quotes/types';
import { CompanyFields, type CompanyImages } from './CompanyFields';
import { Button, Modal, Spinner, inputClass } from './ui';

// "Quote document" of Edit Page Layout: everything that is printed around the items of a quote (company block, logo, title, the rows under
// them, bank details, signature) in one window. It changes the same settings as Quote Settings > Company & Bank / Amounts & Title.
const lab = 'block text-[13px] text-[#22263b] mb-1';
const SAMPLE: Record<HeaderRow['key'], string> = {
  number: 'QT/MSHS/26-27/A/725', date: '06/10/2026', expiry: '31/10/2026', reference: 'REF-102', place: 'Tamil Nadu (33)', person: 'Team member', project: 'Villa interiors', deal: 'DL12 - Villa',
};

type Loaded = { settings: QuoteSettings; images: CompanyImages; abilities: QuoteAbilities };

export default function DocumentEditor({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState('');

  useEffect(() => {
    let alive = true;
    callApi<Loaded>('/api/quotes/settings', 'GET')
      .then(res => { if (alive) setLoaded(res); })
      .catch(e => { if (alive) setFailed(e instanceof Error ? e.message : 'Could not load the document settings'); });
    return () => { alive = false; };
  }, []);

  if (!loaded) {
    return (
      <Modal title="Quote document" onClose={onClose} width={760} footer={<Button onClick={onClose}>Close</Button>}>
        {failed ? <p role="alert" className="text-[13px] text-[#d9232b]">{failed}</p> : <div className="py-10 flex justify-center text-[#6d7189]"><Spinner className="w-5 h-5" /></div>}
      </Modal>
    );
  }
  return <DocumentForm initial={loaded} onClose={onClose} onSaved={onSaved} />;
}

function DocumentForm({ initial, onClose, onSaved }: { initial: Loaded; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const edit = initial.abilities.settings;
  const [company, setCompany] = useState<CompanySettings>(initial.settings.company);
  const [images, setImages] = useState<CompanyImages>(initial.images);
  const [title, setTitle] = useState(initial.settings.display.documentTitle);
  const [rows, setRows] = useState<HeaderRow[]>(initial.settings.document.header);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const setField = <K extends keyof CompanySettings>(k: K, v: CompanySettings[K]) => { setCompany(c => ({ ...c, [k]: v })); setError(''); };
  const setRow = (i: number, patch: Partial<HeaderRow>) => { setRows(r => r.map((x, k) => (k === i ? { ...x, ...patch } : x))); setError(''); };
  const move = (i: number, d: -1 | 1) => setRows(r => {
    const j = i + d;
    if (j < 0 || j >= r.length) return r;
    const next = [...r];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  const blankLabel = rows.some(r => !r.label.trim());
  const blankTitle = !title.trim();

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const was = initial.settings;
      if (JSON.stringify(company) !== JSON.stringify(was.company)) await callApi('/api/quotes/settings', 'PUT', { group: 'company', value: company });
      if (title.trim() !== was.display.documentTitle) await callApi('/api/quotes/settings', 'PUT', { group: 'display', value: { ...was.display, documentTitle: title } });
      if (JSON.stringify(rows) !== JSON.stringify(was.document.header)) await callApi('/api/quotes/settings', 'PUT', { group: 'document', value: { header: rows } });
      toast.success('Quote document saved');
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  const left = rows.filter(r => r.show && r.column === 'left');
  const right = rows.filter(r => r.show && r.column === 'right');
  const heading = 'text-[14px] font-semibold text-[#22263b] mb-2';

  return (
    <Modal
      title="Quote document"
      onClose={onClose}
      busy={busy}
      width={780}
      footer={edit ? (
        <>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button kind="blue" onClick={save} busy={busy || uploading} disabled={blankLabel || blankTitle}>Save</Button>
        </>
      ) : <Button onClick={onClose}>Close</Button>}
    >
      <p className="text-[13px] text-[#6d7189] mb-4">Everything printed around the items of a quote: on the quote page, in the PDF and on the link a customer opens. A change applies to all quotes.{!edit && ' Only a Super Admin can change it.'}</p>
      {error && <p role="alert" className="mb-3 text-[13px] text-[#d9232b]">{error}</p>}

      <section className="mb-5">
        <h3 className={heading}>Company block <span className="font-normal text-[#6d7189]">(top left, beside the logo)</span></h3>
        <CompanyFields value={company} onChange={setField} images={images} onImages={setImages} edit={edit} parts={['details']} idPrefix="de" />
      </section>

      <section className="mb-5 border-t border-[#ebeaf2] pt-4">
        <h3 className={heading}>Logo and signature</h3>
        <CompanyFields value={company} onChange={setField} images={images} onImages={setImages} edit={edit} parts={['pictures']} idPrefix="dp" onUploading={setUploading} />
        <p className="mt-2 text-[12px] text-[#6d7189]">The logo is printed beside the company block and, faintly, behind the top of the page. The signature or seal is printed above &quot;Authorized Signature&quot;.</p>
      </section>

      <section className="mb-5 border-t border-[#ebeaf2] pt-4">
        <h3 className={heading}>Title</h3>
        <label htmlFor="de-title" className={lab}>Title of the quote document (top right)</label>
        <input id="de-title" value={title} disabled={!edit} maxLength={60} onChange={e => { setTitle(e.target.value); setError(''); }} aria-invalid={blankTitle} className={inputClass(blankTitle, 'max-w-[320px]')} />
      </section>

      <section className="mb-5 border-t border-[#ebeaf2] pt-4">
        <h3 className={heading}>Details under the company block</h3>
        <p className="text-[12px] text-[#6d7189] mb-3">Choose what is printed, how it is called, and in which column. A row that has no value on a quote is left out. Fields added with New Field print after these, in the right column.</p>
        <div className="border border-[#ebeaf2] rounded-[6px] overflow-hidden">
          <div className="hidden sm:grid grid-cols-[48px_130px_minmax(0,1fr)_100px_64px] gap-2 px-3 h-[32px] items-center bg-[#f9f9fb] text-[12px] text-[#6d7189]">
            <span>Print</span><span>Row</span><span>Printed label</span><span>Column</span><span>Order</span>
          </div>
          {rows.map((r, i) => {
            const fixed = r.key === 'number' || r.key === 'date';
            return (
              <div key={r.key} data-header-row={r.key} className="grid grid-cols-[48px_minmax(0,1fr)_92px_64px] sm:grid-cols-[48px_130px_minmax(0,1fr)_100px_64px] gap-2 px-3 py-1.5 items-center border-t border-[#ebeaf2] first:border-t-0">
                <label className="flex items-center"><input type="checkbox" className="q-check" checked={r.show} disabled={!edit || fixed} onChange={e => setRow(i, { show: e.target.checked })} aria-label={`Print ${HEADER_NAMES[r.key]}`} /></label>
                <span className="text-[13px] truncate" title={HEADER_NAMES[r.key]}>{HEADER_NAMES[r.key]}</span>
                <input value={r.label} disabled={!edit} maxLength={40} onChange={e => setRow(i, { label: e.target.value })} aria-label={`Printed label of ${HEADER_NAMES[r.key]}`} aria-invalid={!r.label.trim()} className={`${inputClass(!r.label.trim())} col-span-2 sm:col-span-1`} />
                <select value={r.column} disabled={!edit} onChange={e => setRow(i, { column: e.target.value as 'left' | 'right' })} aria-label={`Column of ${HEADER_NAMES[r.key]}`} className={inputClass()}>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
                <span className="flex items-center gap-1 justify-end sm:justify-start">
                  <button type="button" disabled={!edit || i === 0} onClick={() => move(i, -1)} aria-label={`Move ${HEADER_NAMES[r.key]} up`} className="w-7 h-7 rounded border border-[#d7d5e1] flex items-center justify-center hover:bg-[#f1f1fa] disabled:opacity-40 disabled:hover:bg-transparent"><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button type="button" disabled={!edit || i === rows.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${HEADER_NAMES[r.key]} down`} className="w-7 h-7 rounded border border-[#d7d5e1] flex items-center justify-center hover:bg-[#f1f1fa] disabled:opacity-40 disabled:hover:bg-transparent"><ArrowDown className="w-3.5 h-3.5" /></button>
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 text-[12px] text-[#6d7189]">How it prints (sample values):</div>
        <div data-header-preview className="mt-1 grid grid-cols-2 border border-[#9e9e9e] text-[#222]" style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: 11 }}>
          {[left, right].map((col, n) => (
            <div key={n} className={`px-2 py-1 min-h-[44px] ${n === 0 ? 'border-r border-[#9e9e9e]' : ''}`}>
              {col.map(r => (
                <div key={r.key} className="flex leading-[19px]"><span className="shrink-0 w-[120px] text-[#333]">{r.label}</span><span className="font-bold min-w-0 truncate">: {SAMPLE[r.key]}</span></div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[#ebeaf2] pt-4">
        <h3 className={heading}>Bank details <span className="font-normal text-[#6d7189]">(printed under the notes; leave empty to leave them off)</span></h3>
        <CompanyFields value={company} onChange={setField} images={images} onImages={setImages} edit={edit} parts={['bank']} idPrefix="db" bankTitle={false} />
      </section>
    </Modal>
  );
}
