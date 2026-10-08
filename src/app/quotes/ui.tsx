'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Calendar, ChevronDown, Loader2, Search, X } from 'lucide-react';
import type { LookupItem } from '@/lib/records/types';

// The look of the Quotes screens (taken from the Zoho Books reference screens): Inter, 1px lavender lines, #548df6 as the one accent colour.
export const COLOR = { primary: '#548df6', band: '#f9f9fb', line: '#ebeaf2', input: '#d7d5e1', head: '#6d7189', text: '#22263b', link: '#355bd4', lav: '#f1f1fa', red: '#e5484d', muted: '#9ca0ab' };

export const STATUS_COLOR: Record<string, string> = { Draft: '#7f8c8d', Sent: '#408dfb', Accepted: '#2fa070', Declined: '#e5484d', Invoiced: '#2fa070' };

export function StatusText({ status, className = '', size }: { status: string; className?: string; size?: number }) {
  return <span className={`uppercase text-[12px] tracking-[0.1px] ${className}`} style={{ color: STATUS_COLOR[status] ?? COLOR.head, ...(size ? { fontSize: size } : {}) }}>{status}</span>;
}

export const inputClass = (invalid?: boolean, extra = '') =>
  `w-full h-[34px] px-[10px] text-[13px] text-[#22263b] bg-white border rounded-[4px] placeholder:text-[#9ca0ab] focus:outline-none focus:border-[#548df6] disabled:bg-[#f9f9fb] disabled:text-[#9ca0ab] disabled:cursor-not-allowed ${invalid ? 'border-[#e5484d]' : 'border-[#d7d5e1]'} ${extra}`;

export function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden />;
}

// Closes on a click elsewhere or Escape
export function useDismiss(open: boolean, close: () => void, ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open, close, ref]);
}

// A button with a menu under it
export function Menu({ trigger, children, align = 'left', width = 220, className = '' }: {
  trigger: (state: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'left' | 'right';
  width?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, ref);
  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      {trigger({ open, toggle: () => setOpen(o => !o) })}
      {open && (
        <div role="menu" style={{ width, [align]: 0 }} className="absolute top-full mt-1 z-50 bg-white border border-[#ebeaf2] rounded-[6px] shadow-[0_6px_20px_rgba(34,38,59,0.14)] py-1 text-[13px] text-[#22263b]">
          {children(close)}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ children, onClick, danger, disabled, icon }: { children: ReactNode; onClick?: () => void; danger?: boolean; disabled?: boolean; icon?: ReactNode }) {
  return (
    <button type="button" role="menuitem" disabled={disabled} onClick={onClick} className={`w-full flex items-center gap-2 text-left px-3 h-[32px] hover:bg-[#f1f1fa] disabled:opacity-45 disabled:hover:bg-transparent ${danger ? 'text-[#d9232b]' : ''}`}>
      {icon && <span className="w-4 flex items-center justify-center text-[#6d7189]">{icon}</span>}{children}
    </button>
  );
}

export const MenuRule = () => <div className="my-1 border-t border-[#ebeaf2]" role="separator" />;

// A window in the middle of the screen
export function Modal({ title, onClose, children, footer, width = 520, busy }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; width?: number; busy?: boolean }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose, busy]);
  const id = useId();
  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-[rgba(34,38,59,0.45)] p-3 overflow-y-auto" onMouseDown={e => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby={id} style={{ maxWidth: width }} className="w-full bg-white rounded-[8px] shadow-[0_12px_40px_rgba(34,38,59,0.25)] my-auto text-[#22263b]">
        <div className="flex items-center justify-between gap-3 px-5 h-[52px] border-b border-[#ebeaf2]">
          <h2 id={id} className="text-[16px] font-semibold">{title}</h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="w-7 h-7 flex items-center justify-center rounded text-[#e5484d] hover:bg-[#fdeeee]"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-5 py-4 max-h-[calc(100vh-170px)] overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-[#ebeaf2] flex flex-wrap items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

// Buttons: the blue one is the action, the grey one is the rest
export function Button({ children, onClick, type = 'button', kind = 'grey', disabled, busy, className = '', title }: {
  children: ReactNode; onClick?: () => void; type?: 'button' | 'submit'; kind?: 'blue' | 'grey' | 'danger' | 'ghost'; disabled?: boolean; busy?: boolean; className?: string; title?: string;
}) {
  const look = kind === 'blue' ? 'bg-[#548df6] hover:bg-[#4a82ea] text-white border-[#548df6]'
    : kind === 'danger' ? 'bg-[#e5484d] hover:bg-[#d23d42] text-white border-[#e5484d]'
    : kind === 'ghost' ? 'bg-white hover:bg-[#f1f1fa] text-[#22263b] border-[#d7d5e1]'
    : 'bg-[#f5f5f5] hover:bg-[#ececec] text-[#22263b] border-[#ddd]';
  return (
    <button type={type} title={title} onClick={onClick} disabled={disabled || busy} className={`inline-flex items-center justify-center gap-1.5 h-[32px] px-[11px] rounded-[4px] border text-[13px] font-medium whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed ${look} ${className}`}>
      {busy && <Spinner className="w-3.5 h-3.5" />}{children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// A picker: a box that opens a search box over a list. The list is given, or asked for from the server as you type.
// ---------------------------------------------------------------------------
export type ComboItem = LookupItem & { data?: unknown };

export function Combo({ htmlId, value, shown, items, search, onChange, placeholder, disabled, invalid, clearable, ariaLabel, emptyText = 'Nothing found', footer, icon, optionLabel, className = '', searchable = true, creatable, roomy }: {
  htmlId?: string;
  value: string | null;
  shown: string;
  items?: ComboItem[];
  search?: (q: string) => Promise<ComboItem[]>;
  onChange: (id: string | null, item: ComboItem | null) => void;
  placeholder: string;
  disabled?: boolean;
  invalid?: boolean;
  clearable?: boolean;
  ariaLabel: string;
  emptyText?: string;
  footer?: (close: () => void) => ReactNode;
  icon?: ReactNode;
  optionLabel?: (item: ComboItem, active: boolean) => ReactNode;
  className?: string;
  searchable?: boolean; // false: a short list without the search box (a salutation, a language)
  creatable?: boolean; // what was typed that is not in the list can be added: "Select or type to add"
  roomy?: boolean; // taller, rounded rows (the customer list)
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [found, setFound] = useState<ComboItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const listId = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, box);

  const matches = items ? items.filter(i => `${i.label} ${i.sub ?? ''}`.toLowerCase().includes(q.trim().toLowerCase())) : found;
  const typed = q.trim();
  const addable = !!creatable && typed !== '' && !matches.some(i => i.label.toLowerCase() === typed.toLowerCase());
  const results: ComboItem[] = addable ? [{ id: typed, label: typed, data: { __new: '1' } }, ...matches] : matches;

  useEffect(() => {
    if (!open || !search) return;
    let live = true;
    const t = setTimeout(async () => {
      setBusy(true);
      setError('');
      try {
        const list = await search(q);
        if (live) { setFound(list); setActive(0); }
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : 'Could not load the list');
      } finally {
        if (live) setBusy(false);
      }
    }, q ? 250 : 0);
    return () => { live = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, open]);

  const openList = () => {
    if (disabled) return;
    setQ('');
    setActive(0);
    setOpen(true);
    requestAnimationFrame(() => (input.current ?? panel.current)?.focus());
  };
  const pick = (item: ComboItem) => { onChange(item.id, item); setOpen(false); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(results.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[active]) pick(results[active]); }
  };

  return (
    <div ref={box} className={`relative ${className}`}>
      <div className={`flex items-stretch h-[34px] border rounded-[4px] ${disabled ? 'bg-[#f9f9fb]' : 'bg-white'} ${invalid ? 'border-[#e5484d]' : open ? 'border-[#548df6]' : 'border-[#d7d5e1]'}`}>
        <button id={htmlId} type="button" onClick={openList} disabled={disabled} aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} className="flex-1 min-w-0 px-[10px] flex items-center gap-1.5 text-left text-[13px] disabled:cursor-not-allowed">
          {icon}
          <span className={`truncate ${value ? 'text-[#22263b]' : 'text-[#9ca0ab]'}`}>{value ? shown || value : placeholder}</span>
        </button>
        {value && clearable && !disabled && (
          <button type="button" onClick={() => onChange(null, null)} aria-label={`Clear ${ariaLabel}`} className="w-7 flex items-center justify-center text-[#e5484d] hover:bg-[#fdeeee]"><X className="w-4 h-4" /></button>
        )}
        <span className={`w-8 flex items-center justify-center pointer-events-none ${open ? 'text-[#548df6]' : 'text-[#6d7189]'}`}><ChevronDown className={`w-4 h-4 ${open ? 'rotate-180' : ''}`} /></span>
      </div>
      {open && (
        <div ref={panel} tabIndex={-1} className="absolute left-0 min-w-full top-[calc(100%+3px)] z-50 bg-white border border-[#d7d5e1] rounded-[4px] shadow-[0_6px_20px_rgba(34,38,59,0.14)] focus:outline-none" onKeyDown={onKey}>
          {searchable && (
            <div className="p-2 border-b border-[#ebeaf2] relative">
              <Search className="w-4 h-4 text-[#9ca0ab] absolute left-4 top-1/2 -translate-y-1/2" aria-hidden />
              <input ref={input} value={q} onChange={e => setQ(e.target.value)} placeholder="Search" aria-label={`Search ${ariaLabel}`} aria-controls={listId} className="w-full h-[34px] pl-8 pr-8 border border-[#d7d5e1] rounded-[4px] text-[13px] text-[#22263b] focus:outline-none focus:border-[#548df6]" />
              {busy && <Spinner className="w-3.5 h-3.5 text-[#9ca0ab] absolute right-4 top-1/2 -translate-y-1/2" />}
            </div>
          )}
          <ul id={listId} role="listbox" aria-label={ariaLabel} className={`q-scroll max-h-[240px] overflow-y-auto py-1 ${roomy ? 'px-1.5' : ''}`}>
            {error && <li className="px-3 py-2 text-[13px] text-[#d9232b]">{error}</li>}
            {!error && results.length === 0 && !busy && <li className="px-3 py-2 text-[13px] text-[#6d7189]">{emptyText}</li>}
            {results.map((item, i) => (
              <li key={item.id} role="option" aria-selected={item.id === value}>
                <button type="button" onClick={() => pick(item)} onMouseEnter={() => setActive(i)} className={`w-full text-left px-3 flex items-start gap-2 ${roomy ? 'py-2 rounded-[6px]' : 'py-1.5'} ${i === active ? 'bg-[#548df6] text-white' : ''}`}>
                  <span className="min-w-0 flex-1">
                    {(item.data as { __new?: string } | undefined)?.__new ? (
                      <span className="block text-[13px] truncate">+ Add &ldquo;{item.label}&rdquo;</span>
                    ) : optionLabel ? optionLabel(item, i === active) : (
                      <>
                        <span className={`block text-[13px] truncate ${item.id === value && i !== active ? 'font-semibold' : ''}`}>{item.label}</span>
                        {item.sub && <span className={`block text-[12px] truncate ${i === active ? 'text-white/85' : 'text-[#6d7189]'}`}>{item.sub}</span>}
                      </>
                    )}
                  </span>
                  {item.tag && <span className={`shrink-0 mt-0.5 px-1.5 rounded text-[11px] ${i === active ? 'bg-white/25' : 'bg-[#f1f1fa] text-[#6d7189]'}`}>{item.tag}</span>}
                </button>
              </li>
            ))}
          </ul>
          {footer && <div className="border-t border-[#ebeaf2]">{footer(close)}</div>}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// A date typed as dd/MM/yyyy, or picked. The value is YYYY-MM-DD (or "").
// ---------------------------------------------------------------------------
const toText = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');
function parseDay(text: string): string | null {
  const m = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/.exec(text.trim());
  if (!m) return null;
  const d = Number(m[1]); const mo = Number(m[2]); const y = Number(m[3]);
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d || y < 1900 || y > 2100) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function DateBox({ id, value, onChange, invalid, disabled, placeholder = 'dd/MM/yyyy', className = '' }: {
  id?: string; value: string; onChange: (iso: string) => void; invalid?: boolean; disabled?: boolean; placeholder?: string; className?: string;
}) {
  const [text, setText] = useState(toText(value));
  const lastSent = useRef(value);
  const native = useRef<HTMLInputElement>(null);
  // The value changed from outside (a default, a reset): show it
  useEffect(() => {
    if (value !== lastSent.current) { lastSent.current = value; setText(toText(value)); }
  }, [value]);

  const type = (raw: string) => {
    // digits get their slashes by themselves: 05102026 -> 05/10/2026
    const digits = raw.replace(/[^\d]/g, '').slice(0, 8);
    const typed = /[/.\-]/.test(raw) ? raw.slice(0, 10) : digits.length > 4 ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}` : digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    setText(typed);
    const iso = typed.trim() === '' ? '' : parseDay(typed);
    const next = iso ?? '';
    lastSent.current = next;
    onChange(next);
  };
  const bad = text.trim() !== '' && parseDay(text) === null;
  return (
    <div className={`relative ${className}`}>
      <input id={id} type="text" inputMode="numeric" autoComplete="off" value={text} disabled={disabled} placeholder={placeholder} onChange={e => type(e.target.value)} aria-invalid={invalid || bad || undefined} className={inputClass(invalid || bad, 'pr-9')} />
      <button type="button" tabIndex={-1} disabled={disabled} aria-label="Pick a date" onClick={() => { try { native.current?.showPicker(); } catch { native.current?.focus(); } }} className="absolute right-0 top-0 h-[34px] w-9 flex items-center justify-center text-[#9ca0ab] hover:text-[#548df6] disabled:opacity-50"><Calendar className="w-4 h-4" /></button>
      <input ref={native} type="date" tabIndex={-1} aria-hidden value={value} min="1900-01-01" max="2100-12-31" onChange={e => { setText(toText(e.target.value)); lastSent.current = e.target.value; onChange(e.target.value); }} className="absolute right-0 bottom-0 w-0 h-0 opacity-0 pointer-events-none" />
    </div>
  );
}

// A label and what goes with it, in a row of the form
export function FormRow({ label, required, error, hint, info, children, id, wide }: { label: ReactNode; required?: boolean; error?: string; hint?: ReactNode; info?: string; children: ReactNode; id?: string; wide?: boolean }) {
  return (
    <div className={`flex flex-col sm:flex-row items-start gap-0 ${wide ? '' : ''}`}>
      <label htmlFor={id} className={`sm:w-[180px] shrink-0 pt-0 pb-[4px] sm:pb-0 sm:pt-[8px] text-[13px] leading-[18px] ${required ? 'text-[#d93b3b]' : 'text-[#22263b]'}`}>
        {label}{required && '*'}
        {info && <span title={info} className="inline-flex ml-1.5 align-middle w-3.5 h-3.5 rounded-full bg-[#7f8497] text-white text-[9px] font-bold items-center justify-center cursor-help">i</span>}
      </label>
      <div className="min-w-0 w-full sm:w-auto flex-1">
        {children}
        {hint && <p className="mt-[6px] text-[12px] text-[#6d7189]">{hint}</p>}
        {error && <p role="alert" id={id ? `${id}-error` : undefined} className="mt-[6px] text-[12px] text-[#d9232b]">{error}</p>}
      </div>
    </div>
  );
}
