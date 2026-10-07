'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, IndianRupee, Loader2, X } from 'lucide-react';
import { callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import type { ProjectDetail, ProjectRow, VendorPayment } from '@/lib/projects/types';
import { errorText, lightButton, primaryButton, rupees } from './common';

const shell = 'fixed inset-0 z-[80] flex items-start sm:items-center justify-center bg-black/50 p-0 sm:p-4';

// The Payment icon of a Service Vendor row: an amount, OK or Cancel. OK makes a Pre-Payment Record (the deal, the vendor and its template filled in),
// which is also on the Pre-Payment Records page; the Given Amount and Balance of the row follow from it.
export function PaymentPopup({ vendorName, row, templates, onClose, send }: {
  vendorName: string;
  row: ProjectRow;
  templates: Record<string, string>;
  onClose: () => void;
  send: (body: { amount: number; templateId: string | null }) => Promise<{ detail: ProjectDetail; code: string }>;
}) {
  const toast = useToast();
  const own = (row.meta.templateIds as string[]) ?? [];
  const [amount, setAmount] = useState('');
  const [templateId, setTemplateId] = useState<string>(own[0] ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const n = Number(amount.replace(/,/g, '').trim());
    if (!amount.trim() || !Number.isFinite(n) || n <= 0) { setError('Enter an amount more than 0'); return; }
    if (Number(n.toFixed(2)) !== n) { setError('At most 2 decimal places'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await send({ amount: n, templateId: templateId || null });
      toast.success(`Pre-Payment ${res.code} created`);
      onClose();
    } catch (err) {
      setError(errorText(err));
      setSaving(false);
    }
  };

  return (
    <div className={shell} onMouseDown={e => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <form role="dialog" aria-modal="true" aria-labelledby="pay-title" onSubmit={submit} noValidate onKeyDown={e => { if (e.key === 'Escape' && !saving) onClose(); }}
        className="bg-white w-full sm:max-w-[420px] sm:rounded-xl shadow-2xl p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="pay-title" className="text-[19px] font-bold text-[#333] inline-flex items-center gap-2"><IndianRupee className="w-5 h-5 text-[#0d6efd]" aria-hidden />Payment</h2>
            <p className="text-[13px] text-gray-500 truncate" title={vendorName}>{vendorName}</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="text-gray-400 hover:text-black disabled:opacity-40"><X className="w-5 h-5" /></button>
        </div>

        <label htmlFor="pay-amount" className="block mt-4 mb-1.5 text-[14px] font-semibold text-[#333]">Amount</label>
        <div className="flex">
          <span className="px-3 h-[42px] flex items-center border border-r-0 border-gray-300 rounded-l bg-gray-50 text-[14px] text-gray-600">₹</span>
          <input id="pay-amount" autoFocus inputMode="decimal" value={amount} disabled={saving} autoComplete="off" onChange={e => { setAmount(e.target.value.replace(/[^\d.,]/g, '')); setError(''); }}
            aria-invalid={error ? true : undefined} className={`flex-1 min-w-0 h-[42px] px-3 border rounded-r text-[15px] focus:outline-none focus:border-[#0d6efd] ${error ? 'border-[#dc3545]' : 'border-gray-300'}`} />
        </div>

        <div className="mt-4 text-[13px] text-gray-600">
          <span className="font-semibold text-[#333]">Template: </span>
          {own.length > 1 ? (
            <select value={templateId} disabled={saving} onChange={e => setTemplateId(e.target.value)} aria-label="Template" className="ml-1 h-8 border border-gray-300 rounded px-2 text-[13px]">
              {own.map(id => <option key={id} value={id}>{templates[id] ?? id}</option>)}
            </select>
          ) : own.length === 1 ? templates[own[0]] ?? own[0] : <span className="text-gray-400">none (no template was chosen for this vendor&apos;s items)</span>}
        </div>
        <p className="mt-1 text-[12px] text-gray-500">The record is made for this deal and vendor, with the next PPR number.</p>

        {error && <p role="alert" className="mt-3 text-[13px] text-[#d9232b]">{error}</p>}
        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} disabled={saving} className={`${lightButton} h-[40px] px-5`}>Cancel</button>
          <button type="submit" disabled={saving} className={`${primaryButton} h-[40px] px-6`}>{saving && <Loader2 className="w-4 h-4 animate-spin" />}OK</button>
        </div>
      </form>
    </div>
  );
}

// The History icon: every payment made to the vendor for this deal, newest first
export function HistoryPopup({ projectId, kind, row, vendorName, onClose }: { projectId: string; kind: 'service' | 'material'; row: ProjectRow; vendorName: string; onClose: () => void }) {
  const [data, setData] = useState<{ vendor: string; payments: VendorPayment[]; total: number } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    callApi<{ vendor: string; payments: VendorPayment[]; total: number }>(`/api/projects/${projectId}/vendors/${kind}/${row.id}/payments`, 'GET')
      .then(d => { if (live) setData(d); })
      .catch(e => { if (live) setError(errorText(e)); });
    return () => { live = false; };
  }, [projectId, kind, row.id]);

  return (
    <div className={shell} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="hist-title" onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
        className="bg-white w-full sm:max-w-[640px] max-h-screen sm:max-h-[88vh] flex flex-col sm:rounded-xl shadow-2xl">
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-3 border-b border-gray-200">
          <div className="min-w-0">
            <h2 id="hist-title" className="text-[19px] font-bold text-[#333] inline-flex items-center gap-2"><History className="w-5 h-5 text-[#0d6efd]" aria-hidden />Payment History</h2>
            <p className="text-[13px] text-gray-500 truncate" title={vendorName}>{data?.vendor || vendorName}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-black"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto px-6 py-4">
          {error && <p role="alert" className="text-[13px] text-[#d9232b]">{error}</p>}
          {!error && !data && <p className="text-[13px] text-gray-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading…</p>}
          {data && data.payments.length === 0 && <p className="text-[13px] text-gray-500">Nothing has been paid to this vendor for this deal yet.</p>}
          {data && data.payments.length > 0 && (
            <table className="w-full border-collapse text-[13px]">
              <thead><tr className="bg-[#f3f4f6]">{['PPR No', 'Date', 'Status', 'Remarks', 'Amount'].map(h => <th key={h} className="border border-gray-300 px-2 py-1.5 text-left font-semibold">{h}</th>)}</tr></thead>
              <tbody>
                {data.payments.map(p => (
                  <tr key={p.id} className={p.counted ? '' : 'text-gray-400 line-through'}>
                    <td className="border border-gray-300 px-2 py-1.5"><Link href={`/pre-payments/${p.id}`} className="text-[#1a56c4] hover:underline">{p.code}</Link></td>
                    <td className="border border-gray-300 px-2 py-1.5 whitespace-nowrap">{p.date ?? '—'}</td>
                    <td className="border border-gray-300 px-2 py-1.5">{p.status}{!p.counted && <span className="no-underline"> (not counted)</span>}</td>
                    <td className="border border-gray-300 px-2 py-1.5 break-words max-w-[220px]">{p.remarks || '—'}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-right font-semibold whitespace-nowrap">{rupees(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="bg-[#f9fafb]"><td colSpan={4} className="border border-gray-300 px-2 py-1.5 text-right font-semibold">Given Amount</td><td className="border border-gray-300 px-2 py-1.5 text-right font-bold">{rupees(data.total)}</td></tr></tfoot>
            </table>
          )}
        </div>
        <div className="px-6 py-3 border-t border-gray-200 flex justify-end"><button type="button" onClick={onClose} className={`${lightButton} h-[38px] px-5`}>Close</button></div>
      </div>
    </div>
  );
}
