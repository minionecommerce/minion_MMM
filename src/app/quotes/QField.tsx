'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, FileText, Search, Upload, X } from 'lucide-react';
import { formatBytes } from '@/lib/leads/image-optimize';
import { MAX_FILE_MB, type FileDto, type LayoutField, type LookupItem, type RecordRefs } from '@/lib/records/types';
import { lookupText, textLimit } from '@/lib/records/values';
import { useToast } from '@/components/ui/Toast';
import { discardRecordFile, searchLookup, uploadRecordFile, type LookupKind } from '../records/client';
import { Combo, DateBox, Menu, MenuItem, Spinner, inputClass } from './ui';

export const SLUG = 'quotes';

// What a field needs besides its own value: the lists to pick from and the names of what is already picked
export type QCtx = {
  users: LookupItem[];
  refs: RecordRefs;
  picked: Record<string, string>; // text of what was just picked in this form (id -> text)
  onPick: (id: string, text: string) => void;
  onBusy: (delta: number) => void;
  lookupExtra?: Record<string, string>; // customerId: only the deals and projects of the customer
  onLookup?: (f: LayoutField, id: string | null, item: LookupItem | null) => void; // a lookup field was changed
};

const uploadKey = (name: string) => `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const KIND: Record<string, LookupKind> = { deal: 'deals', materialVendor: 'materialVendors', serviceVendor: 'serviceVendors', customer: 'customers', project: 'projects' };
const PLACEHOLDER: Record<string, string> = { deal: 'Click to select Deal_Name', customer: 'Select or add a customer', project: 'Select a project' };
const EMPTY: Record<string, string> = { deal: 'No deals found', customer: 'No customers found', project: 'No projects found' };

export function shownFor(f: LayoutField, id: string, ctx: QCtx): string {
  if (ctx.picked[id]) return ctx.picked[id];
  if (f.type === 'USER') return ctx.users.find(u => u.id === id)?.label ?? ctx.refs.users[id] ?? '';
  return lookupText(f, id, ctx.refs);
}

// A File Upload field in the style of the quote form: a dashed Upload File button, a line about the limits, the files as chips
export function QFiles({ fieldKey, label, files, maxFiles, onChange, onBusy, disabled }: {
  fieldKey: string; label: string; files: FileDto[]; maxFiles: number; onChange: (files: FileDto[]) => void; onBusy?: (delta: number) => void; disabled?: boolean;
}) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const fresh = useRef(new Set<string>()); // uploaded in this form and not saved yet: removing one throws it away
  const current = useRef(files);
  useEffect(() => { current.current = files; });
  const [uploading, setUploading] = useState<string[]>([]);
  const room = maxFiles - files.length - uploading.length;

  const add = async (picked: File[]) => {
    const take = picked.slice(0, Math.max(0, room));
    if (picked.length > take.length) toast.error(`${label} can have at most ${maxFiles} file${maxFiles === 1 ? '' : 's'}`);
    for (const file of take) {
      const key = uploadKey(file.name);
      setUploading(u => [...u, key]);
      onBusy?.(1);
      try {
        const saved = await uploadRecordFile(SLUG, fieldKey, file);
        fresh.current.add(saved.id);
        current.current = [...current.current, saved];
        onChange(current.current);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : `${file.name}: the upload failed`);
      } finally {
        setUploading(u => u.filter(x => x !== key));
        onBusy?.(-1);
      }
    }
  };
  const remove = (file: FileDto) => {
    onChange(files.filter(f => f.id !== file.id));
    if (fresh.current.has(file.id)) { fresh.current.delete(file.id); void discardRecordFile(SLUG, file.id); }
  };

  return (
    <div>
      <input ref={input} type="file" multiple={maxFiles > 1} hidden aria-label={`Upload ${label}`} onChange={e => { const picked = Array.from(e.target.files ?? []); e.target.value = ''; void add(picked); }} />
      <div className="inline-flex h-[32px] rounded-[4px] border border-dashed border-[#9ca0ab] bg-white text-[13px] text-[#22263b]">
        <button type="button" onClick={() => input.current?.click()} disabled={disabled || room <= 0} className="inline-flex items-center gap-1.5 px-3 hover:bg-[#f1f1fa] rounded-l-[4px] disabled:opacity-50 disabled:cursor-not-allowed"><Upload className="w-3.5 h-3.5" aria-hidden /> Upload File</button>
        <Menu width={190} trigger={({ toggle }) => (
          <button type="button" onClick={toggle} aria-label="More ways to attach" aria-haspopup="menu" disabled={disabled || room <= 0} className="h-full w-7 flex items-center justify-center border-l border-dashed border-[#9ca0ab] hover:bg-[#f1f1fa] rounded-r-[4px] disabled:opacity-50"><ChevronDown className="w-3.5 h-3.5" /></button>
        )}>
          {close => <MenuItem onClick={() => { close(); input.current?.click(); }}>From this computer</MenuItem>}
        </Menu>
      </div>
      <p className="mt-2 text-[12px] text-[#6d7189]">You can upload a maximum of {maxFiles} file{maxFiles === 1 ? '' : 's'}, {MAX_FILE_MB}MB each</p>
      {(files.length > 0 || uploading.length > 0) && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {files.map(f => (
            <li key={f.id} className="flex items-center gap-1.5 border border-[#ebeaf2] rounded-[4px] bg-white px-2 py-1 text-[13px] max-w-full">
              <FileText className="w-3.5 h-3.5 text-[#9ca0ab] shrink-0" aria-hidden />
              {f.url ? <a href={f.url} target="_blank" rel="noopener noreferrer" title={`${f.fileName} · ${formatBytes(f.size)}`} className="truncate text-[#355bd4] hover:underline">{f.fileName}</a> : <span className="truncate" title={f.fileName}>{f.fileName}</span>}
              <span className="text-[#9ca0ab] shrink-0">{formatBytes(f.size)}</span>
              {!disabled && <button type="button" onClick={() => remove(f)} aria-label={`Remove ${f.fileName}`} className="text-[#9ca0ab] hover:text-[#d9232b] shrink-0"><X className="w-3.5 h-3.5" /></button>}
            </li>
          ))}
          {uploading.map(u => <li key={u} className="flex items-center gap-1.5 border border-dashed border-[#d7d5e1] rounded-[4px] px-2 py-1 text-[13px] text-[#6d7189]"><Spinner className="w-3.5 h-3.5" /> Uploading…</li>)}
        </ul>
      )}
    </div>
  );
}

// One field of the quote as an input. `compact` is the version inside a row of the item table.
export default function QField({ f, value, onChange, error, ctx, id, compact, inlineLabel, rows = 1 }: {
  f: LayoutField; value: unknown; onChange: (value: unknown) => void; error?: string; ctx: QCtx; id: string; compact?: boolean; inlineLabel?: boolean; rows?: number;
}) {
  const invalid = !!error;
  const text = typeof value === 'string' ? value : value === null || value === undefined ? '' : String(value);
  const describe = invalid ? { 'aria-invalid': true, 'aria-describedby': `${id}-error` } : {};
  const cls = inputClass(invalid, compact ? 'h-[32px]' : '');

  if (f.type === 'AUTO' || f.readOnly) {
    return <div id={id} className="w-full h-[34px] border border-[#ebeaf2] rounded-[4px] px-2 bg-[#f9f9fb] text-[13px] text-[#6d7189] flex items-center truncate">{text}</div>;
  }
  switch (f.type) {
    case 'TEXTAREA':
      return <textarea id={id} value={text} onChange={e => onChange(e.target.value)} rows={compact ? 2 : rows} maxLength={textLimit(f)} placeholder={f.maxLength && f.maxLength >= 1000 ? `You can enter a maximum of ${f.maxLength} characters` : undefined} className={`${inputClass(invalid)} h-auto min-h-[34px] py-[5px] resize-y`} {...describe} />;
    case 'NUMBER':
      return <input id={id} type="text" inputMode="decimal" value={text} onChange={e => onChange(e.target.value)} className={cls} {...describe} />;
    case 'CURRENCY':
      return (
        <div className="flex">
          {f.prefix && <span className="shrink-0 min-w-[40px] px-2 h-[34px] flex items-center justify-center border border-r-0 border-[#d7d5e1] rounded-l-[4px] bg-[#f9f9fb] text-[13px] text-[#6d7189]">{f.prefix}</span>}
          <input id={id} type="text" inputMode="decimal" value={text} onChange={e => onChange(e.target.value)} className={`${cls} ${f.prefix ? 'rounded-l-none' : ''}`} {...describe} />
        </div>
      );
    case 'DATE':
      return <DateBox id={id} value={text} onChange={onChange} invalid={invalid} />;
    case 'DATETIME':
      return <input id={id} type="datetime-local" value={text} onChange={e => onChange(e.target.value)} className={cls} {...describe} />;
    case 'EMAIL':
      return <input id={id} type="email" value={text} onChange={e => onChange(e.target.value)} maxLength={200} className={cls} {...describe} />;
    case 'PHONE':
      return <input id={id} type="tel" value={text} onChange={e => onChange(e.target.value)} maxLength={30} className={cls} {...describe} />;
    case 'URL':
      return <input id={id} type="url" value={text} onChange={e => onChange(e.target.value)} maxLength={2000} placeholder="https://" className={cls} {...describe} />;
    case 'CHECKBOX':
      return (
        <label className="inline-flex items-center gap-2 text-[13px] cursor-pointer min-h-[34px]">
          <input id={id} type="checkbox" className="q-check" checked={value === true} onChange={e => onChange(e.target.checked)} />
          {inlineLabel ? f.label : 'Yes'}
        </label>
      );
    case 'DROPDOWN':
      return (
        <div className="relative">
          <select id={id} value={f.options.some(o => o.id === text) ? text : ''} onChange={e => onChange(e.target.value)} className={`${cls} appearance-none pr-6`} {...describe}>
            <option value="">-None-</option>
            {f.options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-[#6d7189] pointer-events-none" aria-hidden />
        </div>
      );
    case 'USER':
      return <Combo htmlId={id} value={text || null} shown={text ? shownFor(f, text, ctx) : ''} items={ctx.users} clearable onChange={pickedId => onChange(pickedId ?? '')} placeholder="Select a person" ariaLabel={f.label} invalid={invalid} emptyText="No active users found" />;
    case 'LOOKUP': {
      const lookup = f.lookup ?? '';
      const kind = KIND[lookup];
      if (!kind) return <input id={id} type="text" value={text} onChange={e => onChange(e.target.value)} className={cls} />;
      return (
        <Combo
          htmlId={id}
          value={text || null}
          shown={text ? shownFor(f, text, ctx) : ''}
          search={q => searchLookup(SLUG, kind, q, ctx.lookupExtra)}
          onChange={(pickedId, item) => {
            if (pickedId && item) ctx.onPick(pickedId, item.sub && lookup !== 'customer' && lookup !== 'project' ? `${item.label} - ${item.sub.split(' · ')[0]}` : item.label);
            onChange(pickedId ?? '');
            ctx.onLookup?.(f, pickedId, item);
          }}
          placeholder={PLACEHOLDER[lookup] ?? 'Click to select'}
          ariaLabel={f.label}
          invalid={invalid}
          clearable
          emptyText={EMPTY[lookup] ?? 'Nothing found'}
          icon={lookup === 'deal' ? <Search className="w-3.5 h-3.5 text-[#9ca0ab] shrink-0" aria-hidden /> : undefined}
        />
      );
    }
    case 'FILE':
      return <QFiles fieldKey={f.key} label={f.label} files={(value as FileDto[]) ?? []} maxFiles={f.maxFiles} onChange={onChange} onBusy={ctx.onBusy} />;
    default:
      return <input id={id} type="text" value={text} onChange={e => onChange(e.target.value)} maxLength={textLimit(f)} className={cls} {...describe} />;
  }
}
