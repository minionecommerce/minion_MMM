'use client';

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { ChevronDown, X } from 'lucide-react';

// A white card with an optional title row
export function Card({ title, action, children, className = '' }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="text-[16px] font-semibold text-[#111827]">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

// Weekly | Monthly: the chosen one is yellow
export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-9 px-4 text-[13px] font-semibold transition-colors ${value === o.value ? 'bg-[#FACC15] text-[#111827]' : 'text-[#374151] hover:bg-[#F3F4F6]'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// A dropdown: the browser's own select (keyboard and phone friendly), drawn like the rest of the page
export function SelectBox({ value, onChange, label, children, className = '' }: { value: string; onChange: (v: string) => void; label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <select
        aria-label={label}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-10 w-full appearance-none rounded-lg border border-[#D1D5DB] bg-white pl-3 pr-9 text-[13px] text-[#111827] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" aria-hidden />
    </div>
  );
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

// A popup: Escape and the dark backdrop close it (not while it is saving), Tab stays inside, focus returns to where it came from
export function Modal({ title, titleId, onClose, busy = false, children }: { title: string; titleId: string; onClose: () => void; busy?: boolean; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  function keepFocusInside(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Tab') return;
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === e.currentTarget)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={busy ? undefined : onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={keepFocusInside}
        className="relative max-h-[92vh] w-full max-w-[460px] overflow-y-auto rounded-2xl bg-white shadow-2xl outline-none"
      >
        <div className="flex items-center justify-between px-6 pt-5">
          <h2 id={titleId} className="text-[18px] font-semibold text-[#111827]">{title}</h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="rounded-md p-1 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
