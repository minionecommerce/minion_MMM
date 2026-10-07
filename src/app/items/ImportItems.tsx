'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { callApi } from '@/lib/leads/client';
import { csvLine, parseCsv } from '@/lib/quotes/csv';
import {
  KEEP, MAX_FILE_BYTES, MAX_IMPORT_ROWS, SKIP, TARGETS, autoMapHeaders, buildItem, mappingProblem, planImport, rowValues, summarizePlan,
  type DuplicateMode, type Mapping, type PlanRow, type RowStatus,
} from '@/lib/quotes/item-import';
import type { ImportContext, PartResult } from '@/lib/quotes/item-import-server';
import { Button, Modal, Spinner, inputClass } from '../quotes/ui';

const PART = 250; // rows sent at a time
const SHOWN = 150; // rows listed in the preview

type Step = 'upload' | 'map' | 'preview' | 'running' | 'done';
type Filter = 'all' | RowStatus | 'warning';
export type Outcome = { line: number; name: string; externalId: string | null; status: 'created' | 'updated' | 'duplicate' | 'invalid' | 'failed'; reason: string };

const STATUS_LABEL: Record<RowStatus, string> = { new: 'Ready', update: 'Will be updated', duplicate: 'Already there', invalid: 'Not valid' };
const STATUS_COLOR: Record<string, string> = { new: '#2fa070', update: '#548df6', duplicate: '#7f8c8d', invalid: '#d9232b', created: '#2fa070', updated: '#548df6', failed: '#d9232b' };
const bytes = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1).replace(/\.0$/, '')} MB`);

// ---------------------------------------------------------------------------
// Import Items: upload the file, check which column goes where, preview what will happen to every row, import in parts, see what happened
// ---------------------------------------------------------------------------
// `preload` starts the window with a file that is already read (used to look at the later steps without going through the upload)
export type Preload = { step: Step; fileName: string; fileSize: number; headers: string[]; rows: string[][]; context: ImportContext; outcomes?: Outcome[] };

export default function ImportItems({ onClose, preload }: { onClose: () => void; preload?: Preload }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(preload?.step ?? 'upload');
  const [context, setContext] = useState<ImportContext | null>(preload?.context ?? null);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState(preload?.fileName ?? '');
  const [fileSize, setFileSize] = useState(preload?.fileSize ?? 0);
  const [headers, setHeaders] = useState<string[]>(preload?.headers ?? []);
  const [rows, setRows] = useState<string[][]>(preload?.rows ?? []);
  const [mapping, setMapping] = useState<Mapping>(() => (preload ? autoMapHeaders(preload.headers, preload.rows) : {}));
  const [showEmpty, setShowEmpty] = useState(false);
  const [mode, setMode] = useState<DuplicateMode>('skip');
  const [addTemplates, setAddTemplates] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [progress, setProgress] = useState({ done: 0, total: 0, note: '' });
  const [outcomes, setOutcomes] = useState<Outcome[]>(preload?.outcomes ?? []);
  const [templateNote, setTemplateNote] = useState('');
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const cancelled = useRef(false);

  // what the preview needs from the database: the taxes, the Task Templates, the items that are there
  const preloaded = !!preload;
  useEffect(() => {
    if (preloaded) return;
    let live = true;
    callApi<ImportContext>('/api/quotes/items/import', 'GET').then(c => { if (live) setContext(c); }).catch(e => { if (live) setError(e instanceof Error ? e.message : 'Could not get ready for the import'); });
    return () => { live = false; };
  }, [preloaded]);

  const readFile = async (f: File) => {
    setError('');
    if (!/\.csv$/i.test(f.name) && f.type !== 'text/csv' && f.type !== 'application/vnd.ms-excel') { setError('Choose a CSV file (a .csv file).'); return; }
    if (f.size > MAX_FILE_BYTES) { setError(`The file is ${bytes(f.size)}. The largest file is ${bytes(MAX_FILE_BYTES)}: split it and import the parts one by one.`); return; }
    const parsed = parseCsv(await f.text());
    if (parsed.length < 2) { setError('The file has no items. The first line must be the column names, the items come under it.'); return; }
    if (parsed.length - 1 > MAX_IMPORT_ROWS) { setError(`The file has ${parsed.length - 1} items. The most that can be imported at once is ${MAX_IMPORT_ROWS}: split the file and import the parts one by one.`); return; }
    // a column name that is there twice is made different so both are kept
    const seen = new Map<string, number>();
    const heads = parsed[0].map(h => { const name = h.trim() || 'Column'; const n = (seen.get(name) ?? 0) + 1; seen.set(name, n); return n === 1 ? name : `${name} (${n})`; });
    const body = parsed.slice(1);
    setFileName(f.name); setFileSize(f.size); setHeaders(heads); setRows(body);
    setMapping(autoMapHeaders(heads, body));
    setStep('map');
  };

  // ---------------- the preview ----------------
  const problem = mappingProblem(mapping);
  const lookups = useMemo(() => (context ? { taxes: context.taxes, templates: context.templates } : null), [context]);
  const built = useMemo(() => (lookups && !problem ? rows.map((r, i) => ({ line: i + 2, item: buildItem(rowValues(headers, r), mapping, lookups) })) : []), [rows, headers, mapping, lookups, problem]);
  const plan = useMemo(() => (context ? planImport(built, context.existing, mode) : []), [built, context, mode]);
  const summary = useMemo(() => summarizePlan(plan), [plan]);
  const unknownTemplates = useMemo(() => Array.from(new Set(built.flatMap(b => (b.item.unknownTemplate ? [b.item.unknownTemplate] : [])))), [built]);
  const warnings = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of built) for (const i of b.item.issues) if (i.level === 'warning') { const k = i.message.replace(/"[^"]*"/g, '"…"'); m.set(k, (m.get(k) ?? 0) + 1); }
    return Array.from(m.entries());
  }, [built]);
  const listed = useMemo(() => plan.filter(p => (filter === 'all' ? true : filter === 'warning' ? p.issues.some(i => i.level === 'warning') : p.status === filter)), [plan, filter]);

  // ---------------- the import ----------------
  const run = async () => {
    if (!context || problem) return;
    cancelled.current = false;
    setStep('running');
    setError('');
    const out: Outcome[] = [];
    const of = (p: PlanRow, status: Outcome['status'], reason = p.reason): Outcome => ({ line: p.line, name: p.name, externalId: p.externalId, status, reason });
    try {
      let note = '';
      if (addTemplates && unknownTemplates.length && context.canAddTemplates) {
        setProgress({ done: 0, total: plan.length, note: 'Adding the Task Templates to the Project template list…' });
        const r = await callApi<{ added: string[]; failed: string[] }>('/api/quotes/items/import', 'POST', { action: 'templates', names: unknownTemplates });
        note = `${r.added.length} Task Template${r.added.length === 1 ? '' : 's'} added to the Project template list${r.failed.length ? `; not added: ${r.failed.join(', ')}` : ''}.`;
      }
      setTemplateNote(note);
      // rows that will not be written are in the report as they are
      for (const p of plan) if (p.status === 'invalid') out.push(of(p, 'invalid')); else if (p.status === 'duplicate') out.push(of(p, 'duplicate'));
      const send = plan.filter(p => p.status === 'new' || p.status === 'update');
      const byLine = new Map(built.map(b => [b.line, b]));
      let done = plan.length - send.length;
      for (let at = 0; at < send.length; at += PART) {
        if (cancelled.current) { for (const p of send.slice(at)) out.push(of(p, 'failed', 'Stopped before this row was imported.')); break; }
        const part = send.slice(at, at + PART);
        setProgress({ done, total: plan.length, note: `Importing ${Math.min(at + PART, send.length)} of ${send.length}…` });
        const payload = part.map(p => ({ line: p.line, values: rowValues(headers, rows[p.line - 2]), updateId: p.status === 'update' ? p.matchedId : null }));
        try {
          const res = await callApi<{ results: PartResult[] }>('/api/quotes/items/import', 'POST', { action: 'rows', rows: payload, mapping, mode });
          for (const r of res.results) {
            const p = part.find(x => x.line === r.line)!;
            out.push({ line: r.line, name: r.name || p.name, externalId: byLine.get(r.line)?.item.externalId ?? null, status: r.status, reason: r.reason });
          }
        } catch (e) {
          for (const p of part) out.push(of(p, 'failed', e instanceof Error ? e.message : 'This part could not be imported.'));
        }
        done += part.length;
        setProgress({ done, total: plan.length, note: '' });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The import stopped.');
    }
    out.sort((a, b) => a.line - b.line);
    setOutcomes(out);
    setStep('done');
    router.refresh();
  };

  const count = (s: Outcome['status']) => outcomes.filter(o => o.status === s).length;
  const downloadReport = () => {
    const lines = [csvLine(['Line in the file', 'Item ID', 'Item Name', 'Result', 'Reason'])];
    for (const o of outcomes) if (o.status !== 'created') lines.push(csvLine([o.line, o.externalId ?? '', o.name, o.status, o.reason]));
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'item-import-report.csv'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  // ---------------- the screens ----------------
  const shown = headers.map((h, i) => ({ h, i, filled: rows.reduce((n, r) => n + ((r[i] ?? '').trim() ? 1 : 0), 0), sample: rows.map(r => (r[i] ?? '').trim()).find(Boolean) ?? '' }));
  const used = shown.filter(s => s.filled > 0);
  const empty = shown.filter(s => s.filled === 0);
  const placed = used.filter(s => mapping[s.h] && mapping[s.h] !== KEEP && mapping[s.h] !== SKIP).length;
  const kept = used.filter(s => mapping[s.h] === KEEP).length;
  const groups = Array.from(new Set(TARGETS.map(t => t.group)));
  const takenBy = (key: string) => Object.entries(mapping).find(([, k]) => k === key)?.[0];

  const mapRow = (s: (typeof shown)[number]) => (
    <tr key={s.h} className="border-t border-[#ebeaf2] align-top">
      <td className="px-3 py-2 font-medium">{s.h}</td>
      <td className="px-3 py-2 text-[#6d7189] max-w-[260px]"><div className="truncate" title={s.sample}>{s.sample || '—'}</div></td>
      <td className="px-3 py-2 text-right text-[#6d7189]">{s.filled}</td>
      <td className="px-3 py-2 w-[290px]">
        <select aria-label={`Where "${s.h}" goes`} value={mapping[s.h] ?? SKIP} onChange={e => setMapping(m => ({ ...m, [s.h]: e.target.value }))} className={inputClass(!!mapping[s.h] && mapping[s.h] !== KEEP && mapping[s.h] !== SKIP && takenBy(mapping[s.h]) !== s.h)}>
          <option value={KEEP}>Keep with the item (extra details)</option>
          <option value={SKIP}>Do not import</option>
          {groups.map(g => (
            <optgroup key={g} label={g}>
              {TARGETS.filter(t => t.group === g).map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </optgroup>
          ))}
        </select>
      </td>
    </tr>
  );

  const card = (label: string, n: number, color: string, hint = '') => (
    <div className="flex-1 min-w-[150px] rounded-[6px] border border-[#ebeaf2] px-3 py-2">
      <div className="text-[22px] font-semibold leading-[28px]" style={{ color }}>{n}</div>
      <div className="text-[12px] text-[#6d7189]">{label}</div>
      {hint && <div className="text-[11px] text-[#9ca0ab]">{hint}</div>}
    </div>
  );

  const busy = step === 'running';
  return (
    <Modal
      title="Import Items"
      onClose={() => { cancelled.current = true; onClose(); }}
      busy={busy}
      width={1040}
      footer={(
        <>
          {step === 'map' && (<><Button onClick={() => setStep('upload')}>Back</Button><Button kind="blue" onClick={() => setStep('preview')} disabled={!!problem || !context}>Next: Preview</Button></>)}
          {step === 'preview' && (<><Button onClick={() => setStep('map')}>Back</Button><Button kind="blue" onClick={() => void run()} disabled={summary.new + summary.update === 0}>Import {summary.new + summary.update} item{summary.new + summary.update === 1 ? '' : 's'}</Button></>)}
          {step === 'running' && <Button onClick={() => { cancelled.current = true; }}>Stop</Button>}
          {step === 'done' && (<><Button onClick={() => { setStep('upload'); setOutcomes([]); setHeaders([]); setRows([]); }}>Import another file</Button><Button kind="blue" onClick={onClose}>Close</Button></>)}
          {step === 'upload' && <Button onClick={onClose}>Cancel</Button>}
        </>
      )}
    >
      <div className="text-[13px] space-y-4" data-import-step={step}>
        {error && <p role="alert" className="rounded-[4px] border border-[#f3c2c4] bg-[#fdeeee] px-3 py-2 text-[#b42318]">{error}</p>}

        {step === 'upload' && (
          <>
            <p className="text-[#6d7189]">Upload the CSV of your items (for example the item export of Zoho Books). The first line is the column names. You will check which column goes where and see what will happen to every item before anything is imported.</p>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) void readFile(f); }}
              className={`rounded-[8px] border-2 border-dashed px-6 py-10 text-center ${dragging ? 'border-[#548df6] bg-[#f1f1fa]' : 'border-[#d7d5e1]'}`}
            >
              <FileSpreadsheet className="w-9 h-9 mx-auto text-[#9ca0ab]" aria-hidden />
              <p className="mt-2">Drag the CSV file here, or</p>
              <input ref={input} type="file" accept=".csv,text/csv" hidden aria-label="Choose the CSV file" onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void readFile(f); }} />
              <div className="mt-3"><Button kind="blue" onClick={() => input.current?.click()} disabled={!context && !error}>{!context && !error ? <Spinner className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />} Choose file</Button></div>
              <p className="mt-3 text-[12px] text-[#9ca0ab]">A .csv file up to {bytes(MAX_FILE_BYTES)} and {MAX_IMPORT_ROWS.toLocaleString('en-IN')} items.</p>
            </div>
            {context && <p className="text-[12px] text-[#6d7189]">{context.existing.length} item{context.existing.length === 1 ? ' is' : 's are'} in the Items module now. An item that is already there is not added twice.</p>}
          </>
        )}

        {step === 'map' && (
          <>
            <p><b>{fileName}</b> <span className="text-[#6d7189]">· {bytes(fileSize)} · {rows.length.toLocaleString('en-IN')} items · {headers.length} columns</span></p>
            <p className="text-[#6d7189]">Each column of the file is placed in the field of the Item Master it belongs to. Check it, and change what is not right. A column that has no field of its own is kept with the item, so nothing of the file is lost.</p>
            <div className="flex flex-wrap gap-3">
              {card('columns placed in a field', placed, '#2fa070')}
              {card('kept as extra details', kept, '#548df6', 'shown when the item is opened')}
              {card('empty columns', empty.length, '#7f8c8d', 'nothing in them')}
            </div>
            {problem && <p role="alert" className="text-[#d9232b]" data-mapping-problem>{problem}</p>}
            <div className="border border-[#ebeaf2] rounded-[6px] overflow-auto max-h-[360px] q-scroll">
              <table className="w-full">
                <thead className="bg-[#f9f9fb] text-[#6d7189] text-[11px] uppercase sticky top-0"><tr><th className="text-left px-3 h-[32px] font-medium">Column of the file</th><th className="text-left px-3 font-medium">Example</th><th className="text-right px-3 font-medium">Filled</th><th className="text-left px-3 font-medium">Goes to</th></tr></thead>
                <tbody>{used.map(mapRow)}{showEmpty && empty.map(mapRow)}</tbody>
              </table>
            </div>
            {empty.length > 0 && <button type="button" onClick={() => setShowEmpty(s => !s)} className="text-[#548df6] hover:underline">{showEmpty ? 'Hide' : 'Show'} the {empty.length} empty column{empty.length === 1 ? '' : 's'}</button>}
          </>
        )}

        {step === 'preview' && (
          <>
            <div className="flex flex-wrap gap-3" data-import-summary>
              {card('ready to import', summary.new, '#2fa070')}
              {card(mode === 'update' ? 'already there, will be updated' : 'already there, skipped', mode === 'update' ? summary.update : summary.duplicate, mode === 'update' ? '#548df6' : '#7f8c8d', 'duplicates')}
              {card('not valid', summary.invalid, '#d9232b', 'cannot be imported')}
              {card('with a note', summary.withWarnings, '#b7791f', 'imported anyway')}
            </div>
            <fieldset className="space-y-1.5">
              <legend className="font-medium mb-1">An item that is already in the Items module</legend>
              <label className="flex items-center gap-2"><input type="radio" className="q-radio" name="dup" checked={mode === 'skip'} onChange={() => setMode('skip')} /> Skip it (recommended: nothing you changed is overwritten)</label>
              <label className="flex items-center gap-2"><input type="radio" className="q-radio" name="dup" checked={mode === 'update'} onChange={() => setMode('update')} /> Update it with what the file says (what the file leaves empty stays as it is)</label>
              <p className="text-[12px] text-[#6d7189]">Same Item ID, or (when the row has no Item ID) the same name and SKU, means the same item. Items made by hand are matched by name and SKU.</p>
            </fieldset>
            {unknownTemplates.length > 0 && (
              <div className="rounded-[6px] border border-[#f5deb3] bg-[#fffaf0] px-3 py-2">
                <p className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 mt-0.5 text-[#b7791f] shrink-0" aria-hidden /> <span>{unknownTemplates.length} Task Template{unknownTemplates.length === 1 ? '' : 's'} of the file {unknownTemplates.length === 1 ? 'is' : 'are'} not in the Project template list: <i>{unknownTemplates.slice(0, 6).join(', ')}{unknownTemplates.length > 6 ? ', …' : ''}</i></span></p>
                {context?.canAddTemplates ? (
                  <label className="mt-2 flex items-center gap-2"><input type="checkbox" className="q-check" checked={addTemplates} onChange={e => setAddTemplates(e.target.checked)} /> Add {unknownTemplates.length === 1 ? 'it' : 'them'} to the Project template list so the items get their Task Template</label>
                ) : (
                  <p className="mt-1 text-[#6d7189]">Only a Super Admin can add Task Templates. The items are imported without a Task Template and the name is kept with each item.</p>
                )}
              </div>
            )}
            {warnings.length > 0 && <ul className="text-[12px] text-[#6d7189] list-disc pl-5">{warnings.map(([m, n]) => <li key={m}>{n} × {m}</li>)}</ul>}
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Show">
              {([['all', 'All', plan.length], ['new', 'Ready', summary.new], ['duplicate', 'Already there', summary.duplicate + summary.update], ['invalid', 'Not valid', summary.invalid], ['warning', 'With a note', summary.withWarnings]] as [Filter, string, number][]).map(([id, label, n]) => (
                <button key={id} type="button" role="tab" aria-selected={filter === id} onClick={() => setFilter(id === 'duplicate' && mode === 'update' ? 'update' : id)} className={`h-[28px] px-3 rounded-full border text-[12px] ${filter === id || (id === 'duplicate' && filter === 'update') ? 'bg-[#548df6] border-[#548df6] text-white' : 'border-[#d7d5e1] hover:bg-[#f1f1fa]'}`}>{label} ({n})</button>
              ))}
            </div>
            <div className="border border-[#ebeaf2] rounded-[6px] overflow-auto max-h-[300px] q-scroll">
              <table className="w-full">
                <thead className="bg-[#f9f9fb] text-[#6d7189] text-[11px] uppercase sticky top-0"><tr><th className="text-left px-3 h-[32px] font-medium w-[60px]">Line</th><th className="text-left px-3 font-medium">Item</th><th className="text-left px-3 font-medium w-[130px]">Result</th><th className="text-left px-3 font-medium">Note</th></tr></thead>
                <tbody>
                  {listed.slice(0, SHOWN).map(p => (
                    <tr key={p.line} className="border-t border-[#ebeaf2]" data-plan-row>
                      <td className="px-3 py-1.5 text-[#6d7189]">{p.line}</td>
                      <td className="px-3 py-1.5 max-w-[320px]"><div className="truncate" title={p.name}>{p.name || '—'}</div></td>
                      <td className="px-3 py-1.5 whitespace-nowrap" style={{ color: STATUS_COLOR[p.status] }}>{STATUS_LABEL[p.status]}</td>
                      <td className="px-3 py-1.5 text-[#6d7189]">{p.reason || p.issues.map(i => i.message).join(' ')}</td>
                    </tr>
                  ))}
                  {listed.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-[#6d7189]">Nothing to show here.</td></tr>}
                </tbody>
              </table>
            </div>
            {listed.length > SHOWN && <p className="text-[12px] text-[#6d7189]">The first {SHOWN} of {listed.length.toLocaleString('en-IN')} rows are listed.</p>}
          </>
        )}

        {step === 'running' && (
          <div className="py-8 text-center" data-import-progress>
            <Spinner className="w-6 h-6 mx-auto text-[#548df6]" />
            <p className="mt-3">{progress.note || 'Importing…'}</p>
            <div className="mt-3 h-[8px] max-w-[420px] mx-auto rounded-full bg-[#ebeaf2] overflow-hidden"><div className="h-full bg-[#548df6]" style={{ width: `${progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%` }} /></div>
            <p className="mt-1 text-[12px] text-[#6d7189]">{progress.done} of {progress.total} rows</p>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4" data-import-result>
            <p className="flex items-center gap-2 text-[15px] font-medium"><CheckCircle2 className="w-5 h-5 text-[#2fa070]" aria-hidden /> Import finished</p>
            <div className="flex flex-wrap gap-3">
              {card('items added', count('created'), '#2fa070')}
              {card('items updated', count('updated'), '#548df6')}
              {card('duplicates skipped', count('duplicate'), '#7f8c8d', 'already in the Items module / twice in the file')}
              {card('not valid', count('invalid'), '#d9232b')}
              {count('failed') > 0 && card('not imported', count('failed'), '#d9232b')}
            </div>
            {templateNote && <p className="text-[#6d7189]">{templateNote}</p>}
            <p className="text-[#6d7189]">Every item that was added is in the Items module now, and in Quote → Add Item.</p>
            {outcomes.some(o => o.status !== 'created') && (
              <>
                <div className="flex items-center justify-between"><p className="font-medium">Rows that were not added or that were skipped</p><Button kind="ghost" onClick={downloadReport}><Download className="w-3.5 h-3.5" /> Download the list</Button></div>
                <div className="border border-[#ebeaf2] rounded-[6px] overflow-auto max-h-[260px] q-scroll">
                  <table className="w-full">
                    <thead className="bg-[#f9f9fb] text-[#6d7189] text-[11px] uppercase sticky top-0"><tr><th className="text-left px-3 h-[32px] font-medium w-[60px]">Line</th><th className="text-left px-3 font-medium">Item</th><th className="text-left px-3 font-medium w-[120px]">Result</th><th className="text-left px-3 font-medium">Why</th></tr></thead>
                    <tbody>
                      {outcomes.filter(o => o.status !== 'created').slice(0, 300).map(o => (
                        <tr key={o.line} className="border-t border-[#ebeaf2]" data-outcome-row>
                          <td className="px-3 py-1.5 text-[#6d7189]">{o.line}</td>
                          <td className="px-3 py-1.5 max-w-[320px]"><div className="truncate" title={o.name}>{o.name || '—'}</div></td>
                          <td className="px-3 py-1.5" style={{ color: STATUS_COLOR[o.status] }}>{o.status === 'duplicate' ? 'Skipped' : o.status === 'invalid' ? 'Not valid' : o.status === 'updated' ? 'Updated' : 'Not imported'}</td>
                          <td className="px-3 py-1.5 text-[#6d7189]">{o.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
