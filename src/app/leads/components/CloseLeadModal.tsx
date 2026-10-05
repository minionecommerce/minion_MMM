'use client';

import { useRef, useState } from 'react';
import { CheckCircle2, Info, Loader2, Paperclip, StickyNote, X, XCircle } from 'lucide-react';
import { CLOSE_REASON_MAX, MAX_ATTACHMENT_MB, MAX_CLOSE_FILES } from '@/lib/leads/constants';
import { callApi } from '@/lib/leads/client';
import type { LeadRow } from '@/lib/leads/queries';
import { useToast } from '@/components/ui/Toast';
import QueueList from './QueueList';
import { putQueued, toUploadFile, useFileQueue, type SignedUpload, type SkippedFile } from './useFileQueue';

export type LeadClosed = { closedOn: { date: string; time: string }; files: number };

// A solid cloud with an arrow, drawn here so it can be filled like the rest of the popup
function CloudArrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <g fill="#ffc107"><circle cx="21" cy="38" r="10" /><circle cx="33" cy="27" r="13" /><circle cx="46" cy="37" r="10" /><rect x="21" y="38" width="25" height="10" /></g>
      <path d="M32 45V30M25 36.5 32 29.5l7 7" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// "Close Lead": opened from the Actions menu. A reason is required, files are optional. The lead's Status then says Closed.
// The Deals page uses it as "Close Deal" (apiBase '/api/deals', noun 'Deal').
export default function CloseLeadModal({ row, onClose, onSaved, apiBase = '/api/leads', noun = 'Lead' }: { row: LeadRow; onClose: () => void; onSaved: (result: LeadClosed) => void; apiBase?: string; noun?: string }) {
  const lower = noun.toLowerCase();
  const toast = useToast();
  // Photos are resized and compressed here, in the browser, as soon as they are picked
  const queue = useFileQueue({ max: MAX_CLOSE_FILES, onProblem: m => toast.error(m) });
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{ reason?: string; files?: string; form?: string }>({});
  const [busy, setBusy] = useState('');
  const [dragging, setDragging] = useState(false);
  const reasonBox = useRef<HTMLTextAreaElement>(null);
  const saving = !!busy;

  const add = (incoming: File[]) => {
    if (!incoming.length) return;
    setErrors(e => ({ ...e, files: undefined }));
    queue.add(incoming);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = reason.trim();
    const next: typeof errors = {};
    if (!text) next.reason = `Please provide a reason for closing this ${lower}`;
    if (queue.processing) next.files = 'Images are still being processed. Please wait a moment.';
    else if (queue.hasErrors) next.files = 'Remove the files marked in red, then try again.';
    setErrors(next);
    if (next.reason) reasonBox.current?.focus();
    if (next.reason || next.files) return;

    const sent = queue.items.filter(i => i.status === 'ready');
    try {
      setBusy('Closing…');
      const { closureId, uploads, skipped } = await callApi<{ closureId: string; uploads: SignedUpload[]; skipped: SkippedFile[] }>(`${apiBase}/${row.id}/close`, 'POST', {
        reason: text,
        files: sent.map(toUploadFile),
      });
      for (const s of skipped) toast.info(`${s.name} was added twice, so it was only attached once`);
      if (uploads.length) {
        setBusy('Uploading files…');
        await putQueued(sent, uploads, queue.patch);
        setBusy('Checking files…');
      }
      const closed = await callApi<LeadClosed>(`${apiBase}/${row.id}/close`, 'PUT', { closureId });
      for (const u of uploads) queue.patch(sent[u.index].key, { status: 'uploaded' });
      if (uploads.length) await new Promise(resolve => setTimeout(resolve, 700)); // let the ✓ Uploaded state be seen before the dialog closes
      onSaved(closed);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : `Could not close the ${lower}` });
      setBusy('');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center bg-black/50 p-0 sm:p-4" onMouseDown={e => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <form role="dialog" aria-modal="true" aria-labelledby="cl-title" onSubmit={submit} noValidate onKeyDown={e => { if (e.key === 'Escape' && !saving) onClose(); }}
        className="bg-white w-full sm:max-w-[700px] max-h-screen sm:max-h-[90vh] overflow-y-auto sm:rounded-xl shadow-2xl px-5 sm:px-[30px] py-6 sm:py-[30px]">
        <div className="flex items-center justify-between gap-3">
          <h2 id="cl-title" className="inline-flex items-center gap-2.5 text-[24px] font-bold text-[#333]"><XCircle className="w-7 h-7 text-[#dc3545]" fill="currentColor" stroke="white" aria-hidden="true" />Close {noun}</h2>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="text-gray-400 hover:text-black disabled:opacity-40"><X className="w-6 h-6" /></button>
        </div>

        <div className="mt-5 flex items-start gap-2 rounded px-4 py-3.5 bg-[#fff3cd] border-l-4 border-[#ffc107] text-[14px] text-[#856404]">
          <Info className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" stroke="#fff3cd" aria-hidden="true" />
          <p className="min-w-0 break-words"><strong>Customer:</strong> {row.customerName || 'N/A'} | <strong>{noun} ID:</strong> {row.code || 'N/A'}</p>
        </div>

        <div className="mt-5">
          <label htmlFor="cl-reason" className="flex items-center gap-1.5 mb-2 text-[14px] font-semibold text-[#333]">
            <StickyNote className="w-4 h-4 text-[#ffc107]" fill="currentColor" stroke="white" aria-hidden="true" />
            Reason for Closing <span className="text-[#dc3545]">*</span>
          </label>
          <textarea ref={reasonBox} id="cl-reason" autoFocus maxLength={CLOSE_REASON_MAX} value={reason} disabled={saving}
            onChange={e => { setReason(e.target.value); if (errors.reason) setErrors(x => ({ ...x, reason: undefined })); }}
            placeholder={`Enter the reason for closing this ${lower}...`} aria-invalid={errors.reason ? true : undefined} aria-describedby="cl-reason-help"
            className={`block w-full min-h-[120px] resize-y rounded-lg border-2 px-3 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#ffc107] disabled:bg-gray-50 ${errors.reason ? 'border-[#dc3545]' : 'border-gray-300'}`} />
          <small id="cl-reason-help" className="block mt-1 text-[12px] text-gray-500">Please provide a detailed reason for closing this {lower}</small>
          {errors.reason && <p role="alert" className="text-[12px] text-[#dc3545] mt-1">{errors.reason}</p>}
        </div>

        <div className="mt-5">
          <div className="flex items-center gap-1.5 mb-2 text-[14px] font-semibold text-[#333]"><Paperclip className="w-4 h-4 text-[#ffc107]" aria-hidden="true" />Upload Files (Optional)</div>
          <label htmlFor="cl-files"
            onDragOver={e => { e.preventDefault(); if (!saving) setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); if (!saving) add(Array.from(e.dataTransfer.files)); }}
            className={`block cursor-pointer rounded-lg border-2 border-dashed border-[#ffc107] px-6 py-9 text-center transition-colors focus-within:ring-2 focus-within:ring-[#ffc107]/50 ${dragging ? 'bg-[#fff8e1]' : 'bg-[#fffbf0]'} ${saving ? 'opacity-60 pointer-events-none' : ''}`}>
            <CloudArrow className="w-14 h-14 mx-auto" />
            <p className="mt-2 text-[16px] font-medium text-[#333]">Click to select files or drag and drop</p>
            <p className="mt-1 text-[14px] text-gray-500">Supports: Images, PDF, Excel, Word, and more</p>
            <input id="cl-files" type="file" multiple disabled={saving} onChange={e => { add(Array.from(e.target.files ?? [])); e.target.value = ''; }} className="sr-only" />
          </label>
          <p className="mt-1.5 text-[12px] text-gray-500">Up to {MAX_CLOSE_FILES} files, {MAX_ATTACHMENT_MB} MB each. Photos are resized and compressed to fit.</p>
          {errors.files && <p role="alert" className="text-[12px] text-[#dc3545] mt-1">{errors.files}</p>}
          {queue.items.length > 0 && (
            <div className="mt-3">
              <h3 className="text-[14px] font-semibold text-[#333]">Selected Files:</h3>
              <QueueList items={queue.items} onRemove={queue.remove} disabled={saving} className="mt-2 !grid-cols-1" />
            </div>
          )}
        </div>

        {errors.form && <p role="alert" className="mt-4 text-[13px] text-[#dc3545]">{errors.form}</p>}
        <div className="mt-6 pt-5 border-t-2 border-gray-200 flex items-center justify-end gap-2.5">
          {saving && <span className="mr-auto text-[13px] text-gray-500 flex items-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" />{busy}</span>}
          <button type="button" onClick={onClose} disabled={saving} className="inline-flex items-center gap-1.5 px-6 h-[44px] rounded-md bg-[#f5f5f5] hover:bg-[#ebebeb] border border-[#ddd] text-[#333] text-[14px] font-medium disabled:opacity-60"><X className="w-4 h-4" />Cancel</button>
          <button type="submit" disabled={saving || queue.processing || queue.hasErrors} className="inline-flex items-center gap-1.5 px-6 h-[44px] rounded-md bg-[#dc3545] hover:bg-[#c82333] text-white text-[14px] font-semibold disabled:opacity-60"><CheckCircle2 className="w-4 h-4" />Close {noun}</button>
        </div>
      </form>
    </div>
  );
}
