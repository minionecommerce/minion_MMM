'use client';

import { Lock } from 'lucide-react';
import { NOT_YET_APPROVED } from '@/lib/records/registry';
import { lookupText, textLimit } from '@/lib/records/values';
import type { FileDto, LayoutField, LookupItem, RecordRefs } from '@/lib/records/types';
import { searchLookup } from '../client';
import FileField from './FileField';
import LookupSelect from './LookupSelect';

// What a field needs besides its own value: the lists to pick from and the names of what is already picked
export type FieldCtx = {
  slug: string;
  users: LookupItem[]; // the active users
  approvers: LookupItem[]; // active users who may approve
  refs: RecordRefs;
  picked: Record<string, string>; // text of what was just picked in this form (id -> text)
  canApprove: boolean;
  onPick: (id: string, text: string) => void;
  onBusy: (delta: number) => void;
};

export const controlClass = (invalid: boolean, required: boolean, extra = '') =>
  `w-full h-[38px] border rounded px-3 text-[14px] text-gray-900 bg-white focus:outline-none disabled:bg-gray-100 disabled:text-gray-500 ${invalid ? 'border-red-500' : 'border-gray-300 focus:border-[#f5b800]'} ${required ? 'border-l-[3px] border-l-[#e5484d]' : ''} ${extra}`;

// The text to show for a picked user / deal / vendor
export function pickedText(f: LayoutField, id: string, ctx: FieldCtx): string {
  if (ctx.picked[id]) return ctx.picked[id];
  if (f.type === 'USER' || f.type === 'APPROVER') {
    const known = ctx.users.some(u => u.id === id);
    const name = ctx.users.find(u => u.id === id)?.label ?? ctx.refs.users[id] ?? '';
    return known || !name ? name : `${name} (inactive)`;
  }
  return lookupText(f, id, ctx.refs);
}

// One field of a record, as an input: used in the form and, with `compact`, in the cells of a table.
export default function FieldInput({ field: f, value, onChange, error, ctx, compact, htmlId }: {
  field: LayoutField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  ctx: FieldCtx;
  compact?: boolean;
  htmlId: string;
}) {
  const invalid = !!error;
  const marked = f.required && !compact;
  const cls = controlClass(invalid, marked);
  const text = typeof value === 'string' ? value : value === null || value === undefined ? '' : String(value);
  const describe = invalid ? { 'aria-invalid': true, 'aria-describedby': `${htmlId}-error` } : {};

  if (f.type === 'AUTO' || f.readOnly) {
    return (
      <div id={htmlId} className="w-full h-[38px] border border-gray-200 rounded px-3 bg-gray-100 text-[14px] text-gray-700 flex items-center justify-between gap-2">
        <span className="truncate">{text}</span>
        {f.type !== 'AUTO' && <Lock className="w-4 h-4 text-gray-400 shrink-0" aria-label="Locked" />}
      </div>
    );
  }

  switch (f.type) {
    case 'TEXTAREA':
      return <textarea id={htmlId} value={text} onChange={e => onChange(e.target.value)} rows={compact ? 2 : 3} maxLength={textLimit(f)} placeholder={f.maxLength && f.maxLength >= 1000 ? `You can enter a maximum of ${f.maxLength} characters` : undefined} className={`${cls} h-auto py-2 resize-y min-h-[38px]`} {...describe} />;
    case 'NUMBER':
      return <input id={htmlId} type="number" inputMode="decimal" step={f.integer ? 1 : 'any'} min={f.min ?? undefined} value={text} onChange={e => onChange(e.target.value)} className={cls} {...describe} />;
    case 'CURRENCY':
      return (
        <div className="flex">
          {f.prefix && <span className="shrink-0 min-w-[48px] px-2.5 h-[38px] flex items-center justify-center border border-r-0 border-gray-300 rounded-l bg-gray-50 text-[13px] text-gray-600">{f.prefix}</span>}
          <input id={htmlId} type="number" inputMode="decimal" step="0.01" min={f.min ?? 0} value={text} onChange={e => onChange(e.target.value)} className={`${cls} ${f.prefix ? 'rounded-l-none' : ''}`} {...describe} />
        </div>
      );
    case 'DATE':
      return <input id={htmlId} type="date" min="1900-01-01" max="2100-12-31" value={text} onChange={e => onChange(e.target.value)} className={cls} {...describe} />;
    case 'DATETIME':
      return <input id={htmlId} type="datetime-local" value={text} onChange={e => onChange(e.target.value)} className={cls} {...describe} />;
    case 'EMAIL':
      return <input id={htmlId} type="email" value={text} onChange={e => onChange(e.target.value)} maxLength={200} className={cls} {...describe} />;
    case 'PHONE':
      return <input id={htmlId} type="tel" value={text} onChange={e => onChange(e.target.value)} maxLength={30} className={cls} {...describe} />;
    case 'URL':
      return <input id={htmlId} type="url" value={text} onChange={e => onChange(e.target.value)} maxLength={2000} placeholder="https://" className={cls} {...describe} />;
    case 'CHECKBOX':
      return (
        <label className="inline-flex items-center gap-2 h-[38px] text-[14px] text-gray-800 cursor-pointer">
          <input id={htmlId} type="checkbox" checked={value === true} onChange={e => onChange(e.target.checked)} className="w-4 h-4 accent-black" /> Yes
        </label>
      );
    case 'DROPDOWN':
      return (
        <select id={htmlId} value={f.options.some(o => o.id === text) ? text : ''} onChange={e => onChange(e.target.value)} className={cls} {...describe}>
          <option value="">-None-</option>
          {f.options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      );
    case 'USER':
      return (
        <LookupSelect
          htmlId={htmlId}
          value={text || null}
          shown={text ? pickedText(f, text, ctx) : ''}
          items={ctx.users}
          onChange={id => onChange(id ?? '')}
          placeholder="Click to select Name"
          ariaLabel={f.label}
          required={marked}
          invalid={invalid}
          emptyText="No active users found"
        />
      );
    case 'LOOKUP': {
      const kind = f.lookup === 'deal' ? 'deals' : f.lookup === 'materialVendor' ? 'materialVendors' : 'serviceVendors';
      return (
        <LookupSelect
          htmlId={htmlId}
          value={text || null}
          shown={text ? pickedText(f, text, ctx) : ''}
          search={q => searchLookup(ctx.slug, kind, q)}
          onChange={(id, item) => {
            if (id && item) ctx.onPick(id, item.sub ? `${item.label} - ${item.sub.split(' · ')[0]}` : item.label);
            onChange(id ?? '');
          }}
          placeholder={f.lookup === 'deal' ? 'Click to select Deals_ID' : 'Click to select Name'}
          ariaLabel={f.label}
          required={marked}
          invalid={invalid}
          emptyText={f.lookup === 'deal' ? 'No deals found' : 'No vendors found'}
        />
      );
    }
    case 'APPROVER': {
      const list = text && !ctx.approvers.some(a => a.id === text) ? [...ctx.approvers, { id: text, label: pickedText(f, text, ctx) || text }] : ctx.approvers;
      return (
        <select id={htmlId} value={text} disabled={!ctx.canApprove} onChange={e => onChange(e.target.value)} title={ctx.canApprove ? undefined : 'Only people who can approve may change this'} className={cls} {...describe}>
          <option value="">{NOT_YET_APPROVED}</option>
          {list.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
      );
    }
    case 'FILE':
      return (
        <FileField
          slug={ctx.slug}
          fieldKey={f.key}
          label={f.label}
          files={(value as FileDto[]) ?? []}
          maxFiles={f.maxFiles}
          onChange={onChange}
          onBusy={ctx.onBusy}
          compact={compact}
        />
      );
    default:
      return <input id={htmlId} type="text" value={text} onChange={e => onChange(e.target.value)} maxLength={textLimit(f)} className={cls} {...describe} />;
  }
}
