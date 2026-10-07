'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, Info, Search } from 'lucide-react';
import { DEFAULT_PHONE_CODE, PHONE_CODES } from '@/lib/customers/constants';
import { joinPhone, splitPhone } from '@/lib/customers/format';
import { inputClass, useDismiss } from '../quotes/ui';

// The look of the Customer form (the Zoho Books "New Customer" screens): the same Inter / lavender lines / #548df6 as the quote form. These classes are
// defined here so the form looks the same wherever it is opened from.
export const CUSTOMER_CSS = `
.c-check{appearance:none;-webkit-appearance:none;width:15px;height:15px;border:1px solid #bfbfbf;border-radius:3px;background:#fff;display:inline-block;vertical-align:middle;cursor:pointer;position:relative;margin:0;flex-shrink:0}
.c-check:checked{background:#548df6;border-color:#548df6}
.c-check:checked::after{content:'';position:absolute;left:4px;top:1px;width:4px;height:8px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg)}
.c-check:focus-visible{outline:2px solid #548df6;outline-offset:1px}
.c-check:disabled{opacity:.5;cursor:not-allowed}
.c-radio{appearance:none;-webkit-appearance:none;width:16px;height:16px;border:1px solid #9ca0ab;border-radius:50%;background:#fff;display:inline-block;vertical-align:middle;cursor:pointer;position:relative;margin:0;flex-shrink:0}
.c-radio:checked{border-color:#548df6;background:radial-gradient(circle,#fff 0,#fff 28%,#548df6 32%)}
.c-radio:focus-visible{outline:2px solid #548df6;outline-offset:1px}
.q-scroll::-webkit-scrollbar{width:8px;height:8px}
.q-scroll::-webkit-scrollbar-thumb{background:#c9cbd6;border-radius:4px}
`;

// ---------------------------------------------------------------------------
// A row of the form: the label on the left, what goes with it on the right
// ---------------------------------------------------------------------------
export function InfoTip({ text }: { text: string }) {
  return <span title={text} className="inline-flex ml-1.5 align-middle text-[#6d7189] cursor-help"><Info className="w-[14px] h-[14px]" aria-label={text} /></span>;
}

export function CRow({ label, required, info, error, hint, id, labelWidth = 166, children }: {
  label: ReactNode; required?: boolean; info?: string; error?: string; hint?: ReactNode; id?: string; labelWidth?: number; children: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start gap-y-[5px] mb-[14px]" data-crow>
      <label htmlFor={id} style={{ '--lw': `${labelWidth}px` } as React.CSSProperties} className={`sm:shrink-0 sm:w-[var(--lw)] sm:pt-[7px] pr-3 text-[13px] leading-[19px] ${required ? 'text-[#d93b3b]' : 'text-[#22263b]'}`}>
        {label}{required && '*'}{info && <InfoTip text={info} />}
      </label>
      <div className="min-w-0 w-full sm:w-auto sm:flex-1">
        {children}
        {hint && <div className="mt-[6px] text-[12px] text-[#6d7189]">{hint}</div>}
        {error && <p role="alert" id={id ? `${id}-error` : undefined} className="mt-[6px] text-[12px] text-[#d9232b]">{error}</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Radio buttons and tick boxes
// ---------------------------------------------------------------------------
export function Radios({ name, value, options, onChange, disabled }: { name: string; value: string; options: { id: string; label: string }[]; onChange: (id: string) => void; disabled?: boolean }) {
  return (
    <div role="radiogroup" className="flex flex-wrap items-center gap-x-[30px] gap-y-2 min-h-[34px]">
      {options.map(o => (
        <label key={o.id} className="inline-flex items-center gap-[9px] text-[13px] text-[#22263b] cursor-pointer">
          <input type="radio" className="c-radio" name={name} checked={value === o.id} disabled={disabled} onChange={() => onChange(o.id)} />
          {o.label}
        </label>
      ))}
    </div>
  );
}

export function Tick({ id, checked, onChange, label, disabled }: { id?: string; checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label className="inline-flex items-center gap-[9px] text-[13px] text-[#22263b] cursor-pointer min-h-[34px]">
      <input id={id} type="checkbox" className="c-check" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

// ---------------------------------------------------------------------------
// A box with a fixed word in front of it: INR | amount
// ---------------------------------------------------------------------------
export function PrefixBox({ id, prefix, value, onChange, invalid }: { id?: string; prefix: string; value: string; onChange: (v: string) => void; invalid?: boolean }) {
  return (
    <div className="flex">
      <span className="shrink-0 min-w-[42px] px-2 h-[34px] flex items-center justify-center border border-r-0 border-[#d7d5e1] rounded-l-[4px] bg-[#f9f9fb] text-[13px] text-[#355bd4]">{prefix}</span>
      <input id={id} type="text" inputMode="decimal" value={value} onChange={e => onChange(e.target.value)} aria-invalid={invalid || undefined} className={inputClass(invalid, 'rounded-l-none')} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// A phone number with its country code: +91 | number. The value is the whole number (+919876543210).
// ---------------------------------------------------------------------------
export function PhoneBox({ id, value, onChange, placeholder, invalid, className = '' }: { id?: string; value: string; onChange: (v: string) => void; placeholder?: string; invalid?: boolean; className?: string }) {
  const parts = splitPhone(value);
  const [picked, setPicked] = useState(DEFAULT_PHONE_CODE); // the code chosen while there is no number yet
  const code = value ? parts.code : picked;
  const number = value ? parts.number : '';
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, box);

  const list = PHONE_CODES.filter(c => `${c.country} ${c.code}`.toLowerCase().includes(q.trim().toLowerCase()));
  const pick = (c: string) => { setPicked(c); setOpen(false); setQ(''); if (number) onChange(joinPhone(c, number)); };

  return (
    <div ref={box} className={`relative flex ${className}`}>
      <button type="button" onClick={() => setOpen(o => !o)} aria-label={`${placeholder ?? 'Phone'} country code`} aria-haspopup="listbox" aria-expanded={open}
        className={`shrink-0 w-[70px] h-[34px] px-2 flex items-center justify-between border rounded-l-[4px] bg-[#f9f9fb] text-[13px] text-[#22263b] ${open ? 'border-[#548df6]' : invalid ? 'border-[#e5484d]' : 'border-[#d7d5e1]'}`}>
        <span>{code}</span><ChevronDown className="w-3.5 h-3.5 text-[#6d7189]" aria-hidden />
      </button>
      <input id={id} type="tel" inputMode="tel" value={number} placeholder={placeholder} maxLength={20} onChange={e => onChange(joinPhone(code, e.target.value))}
        aria-invalid={invalid || undefined} className={inputClass(invalid, 'rounded-l-none -ml-px min-w-0')} />
      {open && (
        <div className="absolute left-0 top-[calc(100%+3px)] z-50 w-[250px] bg-white border border-[#d7d5e1] rounded-[4px] shadow-[0_6px_20px_rgba(34,38,59,0.14)]">
          <div className="p-2 border-b border-[#ebeaf2] relative">
            <Search className="w-4 h-4 text-[#9ca0ab] absolute left-4 top-1/2 -translate-y-1/2" aria-hidden />
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search" aria-label="Search country code" className="w-full h-[34px] pl-8 pr-2 border border-[#d7d5e1] rounded-[4px] text-[13px] focus:outline-none focus:border-[#548df6]" />
          </div>
          <ul role="listbox" className="q-scroll max-h-[220px] overflow-y-auto py-1">
            {list.length === 0 && <li className="px-3 py-2 text-[13px] text-[#6d7189]">Nothing found</li>}
            {list.map(c => (
              <li key={c.code + c.country} role="option" aria-selected={c.code === code}>
                <button type="button" onClick={() => pick(c.code)} className={`w-full text-left px-3 py-1.5 text-[13px] flex justify-between gap-3 hover:bg-[#548df6] hover:text-white ${c.code === code ? 'font-semibold' : ''}`}><span className="truncate">{c.country}</span><span className="shrink-0 opacity-80">{c.code}</span></button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
