'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, FileText, Info, Loader2, Search, X } from 'lucide-react';
import type { DealQuote } from '@/lib/projects/types';

export const rupees = (n: number | null | undefined) => (typeof n === 'number' ? '₹' + new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) : '—');
const dayText = (d: string) => (d ? d.split('-').reverse().join('-') : '—');
const statusClass = (s: string) => (s === 'Accepted' ? 'bg-[#dcfce7] text-[#166534]' : s === 'Rejected' || s === 'Declined' ? 'bg-[#fee2e2] text-[#991b1b]' : 'bg-gray-100 text-gray-600');

// Searchable, multi-select list of the quotes of one deal. Each option shows the Quote Number and the Quote Value. The (i) beside it opens the details of
// the quotes (QuoteDetailsPopup) without leaving the Convert to Project popup.
export default function QuotePicker({ quotes, loading, error, value, onChange, disabled, invalid }: {
  quotes: DealQuote[];
  loading: boolean;
  error: string;
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [info, setInfo] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node | null)) setOpen(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? quotes.filter(x => x.quoteNumber.toLowerCase().includes(t) || String(x.value).includes(t.replace(/[,₹\s]/g, '')) || x.reference.toLowerCase().includes(t) || x.status.toLowerCase().includes(t)) : quotes;
  }, [quotes, q]);
  const chosen = quotes.filter(x => value.includes(x.id));
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);

  return (
    <div className="flex items-start gap-2">
      <div ref={root} className="relative min-w-0 flex-1" onKeyDown={e => { if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); } }}>
        <button type="button" id="cp-quotes" disabled={disabled || loading} onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}
          className={`flex w-full min-h-[44px] items-center justify-between gap-2 rounded-lg border-2 bg-white px-3 py-1.5 text-left text-[14px] focus:outline-none focus:border-[#0d6efd] disabled:bg-gray-50 ${invalid ? 'border-[#dc3545]' : 'border-gray-300'}`}>
          <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
            {loading ? <span className="flex items-center gap-1.5 text-gray-400"><Loader2 className="h-4 w-4 animate-spin" />Loading quotes…</span>
              : chosen.length === 0 ? <span className="text-gray-400">{quotes.length ? 'Select quotes' : 'No quotes for this deal'}</span>
              : chosen.map(c => (
                <span key={c.id} className="inline-flex items-center gap-1 rounded bg-[#e7f1ff] px-2 py-0.5 text-[13px] text-[#084298]">
                  {c.quoteNumber} · {rupees(c.value)}
                  <span role="button" tabIndex={0} aria-label={`Remove ${c.quoteNumber}`} onClick={e => { e.stopPropagation(); toggle(c.id); }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggle(c.id); } }} className="cursor-pointer text-[#084298]/70 hover:text-[#084298]"><X className="h-3 w-3" /></span>
                </span>
              ))}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
        </button>
        {open && (
          <div className="absolute left-0 right-0 z-20 mt-1 rounded-lg border border-gray-300 bg-white shadow-xl">
            <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2">
              <Search className="h-4 w-4 text-gray-400" aria-hidden />
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search by quote number or value" aria-label="Search quotes" className="w-full text-[14px] focus:outline-none" />
            </div>
            <ul role="listbox" aria-multiselectable="true" className="max-h-[220px] overflow-y-auto py-1">
              {shown.length === 0 && <li className="px-3 py-3 text-[13px] text-gray-500">{quotes.length ? 'No quote matches your search.' : 'This deal has no quotes yet.'}</li>}
              {shown.map(x => {
                const on = value.includes(x.id);
                return (
                  <li key={x.id} role="option" aria-selected={on}>
                    <button type="button" onClick={() => toggle(x.id)} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[14px] hover:bg-[#f3f7ff]">
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? 'border-[#0d6efd] bg-[#0d6efd] text-white' : 'border-gray-400'}`}>{on && <Check className="h-3 w-3" />}</span>
                      <span className="min-w-0 flex-1"><span className="font-medium text-[#333]">{x.quoteNumber || 'Quote'}</span><span className="text-gray-500"> · {rupees(x.value)}</span></span>
                      <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${statusClass(x.status)}`}>{x.status}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {error && <p role="alert" className="mt-1 text-[12px] text-[#dc3545]">{error}</p>}
      </div>
      <button type="button" onClick={() => setInfo(true)} disabled={loading || quotes.length === 0} title="View quote details" aria-label="View quote details"
        className="mt-[7px] flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-[#0d6efd] text-[#0d6efd] hover:bg-[#e7f1ff] disabled:opacity-40"><Info className="h-4 w-4" /></button>
      {info && <QuoteDetailsPopup quotes={quotes} selected={value} onClose={() => setInfo(false)} />}
    </div>
  );
}

// The details of the deal's quotes: number, date, reference, items with description, quantity, rate and amount, and the total value
function QuoteDetailsPopup({ quotes, selected, onClose }: { quotes: DealQuote[]; selected: string[]; onClose: () => void }) {
  const [onlyChosen, setOnlyChosen] = useState(selected.length > 0);
  const list = onlyChosen ? quotes.filter(x => selected.includes(x.id)) : quotes;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-0 sm:p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="qd-title" onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}
        className="flex max-h-screen w-full flex-col bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-[860px] sm:rounded-xl">
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <h3 id="qd-title" className="inline-flex items-center gap-2 text-[20px] font-bold text-[#333]"><FileText className="h-5 w-5 text-[#0d6efd]" />Quote details</h3>
          <div className="flex items-center gap-3">
            {selected.length > 0 && (
              <label className="flex items-center gap-1.5 text-[13px] text-gray-600"><input type="checkbox" checked={onlyChosen} onChange={e => setOnlyChosen(e.target.checked)} />Chosen quotes only</label>
            )}
            <button type="button" autoFocus onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-black"><X className="h-6 w-6" /></button>
          </div>
        </div>
        <div className="overflow-y-auto px-5 py-4 space-y-5">
          {list.length === 0 && <p className="text-[14px] text-gray-500">No quote to show.</p>}
          {list.map(x => (
            <section key={x.id} className="rounded-lg border border-gray-200">
              <header className="flex flex-wrap items-center gap-x-5 gap-y-1 bg-[#f8fafc] px-4 py-3 text-[13px]">
                <span className="text-[15px] font-semibold text-[#333]">{x.quoteNumber || 'Quote'}</span>
                <span className="text-gray-600">Date: <b>{dayText(x.date)}</b></span>
                <span className="text-gray-600">Reference: <b>{x.reference || '—'}</b></span>
                <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${statusClass(x.status)}`}>{x.status}</span>
              </header>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-[13px]">
                  <thead><tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="px-4 py-2 font-medium">#</th><th className="px-2 py-2 font-medium">Item</th><th className="px-2 py-2 font-medium">Description</th>
                    <th className="px-2 py-2 text-right font-medium">Qty</th><th className="px-2 py-2 text-right font-medium">Rate</th><th className="px-4 py-2 text-right font-medium">Amount</th>
                  </tr></thead>
                  <tbody>
                    {x.items.length === 0 && <tr><td colSpan={6} className="px-4 py-3 text-gray-500">This quote has no items.</td></tr>}
                    {x.items.map((it, i) => (
                      <tr key={it.id} className="border-b border-gray-100 align-top">
                        <td className="px-4 py-2">{i + 1}</td>
                        <td className="px-2 py-2">{it.name || '—'}<span className="ml-1.5 rounded bg-gray-100 px-1 text-[10px] text-gray-500">{it.kind}</span></td>
                        <td className="px-2 py-2 break-words text-gray-600">{it.description || '—'}</td>
                        <td className="px-2 py-2 text-right whitespace-nowrap">{it.quantity} {it.unit}</td>
                        <td className="px-2 py-2 text-right whitespace-nowrap">{rupees(it.rate)}</td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">{rupees(it.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <footer className="flex justify-end px-4 py-2.5 text-[14px]"><span className="text-gray-600">Total value:&nbsp;</span><b>{rupees(x.value)}</b></footer>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
