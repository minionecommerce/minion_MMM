'use client';

import { useMemo, useRef, useState } from 'react';
import { Camera, Loader2, Upload, X } from 'lucide-react';
import { FOLLOWUP_ATTACHMENT_ACCEPT, FOLLOWUP_ATTACHMENT_TYPES, FOLLOWUP_NOTES_MAX, MAX_ATTACHMENT_BYTES, MAX_FOLLOWUP_FILES } from '@/lib/leads/constants';
import { callApi } from '@/lib/leads/client';
import type { LeadRow } from '@/lib/leads/queries';

const field = 'w-full border border-gray-300 rounded-lg px-3 h-[42px] text-[14px] text-gray-900 bg-white focus:outline-none focus:border-[#f5b800]';
const mb = (n: number) => (n / (1024 * 1024)).toFixed(n < 1024 * 1024 ? 2 : 1) + ' MB';

// Extension fallback: some browsers report CSV/Excel files with an empty or generic type
const EXT_TYPE: Record<string, string> = { csv: 'text/csv', xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
function typeOf(file: File) {
  if (file.type in FOLLOWUP_ATTACHMENT_TYPES) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXT_TYPE[ext] ?? file.type;
}

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export type FollowUpSaved = { count: number; last: { date: string; time: string }; next: { date: string; time: string } | null };

// "Upload Follow-up Proof": opened from the green arrow in the Follow-up column
export default function FollowUpModal({ row, onClose, onSaved }: { row: LeadRow; onClose: () => void; onSaved: (result: FollowUpSaved) => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [nextDate, setNextDate] = useState(tomorrow());
  const [nextTime, setNextTime] = useState('18:00');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ files?: string; notes?: string; form?: string }>({});
  const [busy, setBusy] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const saving = !!busy;
  const valid = useMemo(() => files.every(f => typeOf(f) in FOLLOWUP_ATTACHMENT_TYPES), [files]);

  const add = (incoming: File[]) => {
    const next = [...files];
    let problem = '';
    for (const f of incoming) {
      if (!(typeOf(f) in FOLLOWUP_ATTACHMENT_TYPES)) { problem = `${f.name}: only images, PDF, CSV, XLS or XLSX files are allowed`; continue; }
      if (f.size === 0) { problem = `${f.name}: file is empty`; continue; }
      if (f.size > MAX_ATTACHMENT_BYTES) { problem = `${f.name}: larger than 10 MB`; continue; }
      if (next.length >= MAX_FOLLOWUP_FILES) { problem = `At most ${MAX_FOLLOWUP_FILES} files`; break; }
      next.push(f);
    }
    setFiles(next);
    setErrors(e => ({ ...e, files: problem || undefined }));
    if (input.current) input.current.value = '';
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!files.length) next.files = 'Select at least one file';
    if (!notes.trim()) next.notes = 'Follow-up notes are required';
    setErrors(next);
    if (next.files || next.notes) return;
    try {
      setBusy('Saving…');
      const { followUpId, uploads } = await callApi<{ followUpId: string; uploads: { id: string; name: string; uploadUrl: string }[] }>(`/api/leads/${row.id}/follow-ups`, 'POST', {
        notes: notes.trim(),
        nextDate: nextDate || null,
        nextTime: nextDate ? nextTime || null : null,
        files: files.map(f => ({ name: f.name, type: typeOf(f), size: f.size })),
      });
      setBusy('Uploading files…');
      for (let i = 0; i < uploads.length; i++) {
        const form = new FormData();
        form.append('cacheControl', '3600');
        form.append('', new File([files[i]], files[i].name, { type: typeOf(files[i]) }));
        const res = await fetch(uploads[i].uploadUrl, { method: 'PUT', body: form, headers: { 'x-upsert': 'false' } });
        if (!res.ok) throw new Error(`Upload of ${files[i].name} failed (${res.status})`);
      }
      setBusy('Checking files…');
      onSaved(await callApi<FollowUpSaved>(`/api/leads/${row.id}/follow-ups`, 'PUT', { followUpId }));
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Could not save the follow-up' });
      setBusy('');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center bg-black/50 p-0 sm:p-4" onMouseDown={e => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <form role="dialog" aria-modal="true" aria-labelledby="fu-title" onSubmit={submit} noValidate onKeyDown={e => { if (e.key === 'Escape' && !saving) onClose(); }}
        className="bg-white w-full sm:max-w-[560px] max-h-screen sm:max-h-[94vh] overflow-y-auto sm:rounded-xl shadow-2xl px-6 py-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 text-center">
            <h2 id="fu-title" className="inline-flex items-center gap-2.5 text-[22px] font-bold text-[#333]"><Camera className="w-6 h-6 text-[#43a047]" fill="currentColor" stroke="white" />Upload Follow-up Proof</h2>
            <p className="text-[14px] text-gray-500 mt-2">Upload one or more files as proof for this follow-up (PDF, CSV, XLSX, or Image files)</p>
            <p className="text-[12px] text-gray-400 mt-1">Lead {row.code} · {row.customerName}</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="text-gray-500 hover:text-black disabled:opacity-40"><X className="w-6 h-6" /></button>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="fu-files" className="block text-[15px] font-semibold text-[#333] mb-1.5">Select Files <span className="text-[#d9232b]">*</span></label>
            <input ref={input} id="fu-files" type="file" multiple accept={FOLLOWUP_ATTACHMENT_ACCEPT} disabled={saving} onChange={e => add(Array.from(e.target.files ?? []))}
              className={`w-full border-2 border-dashed rounded-xl p-2 text-[14px] ${errors.files ? 'border-[#d9232b]' : 'border-gray-300'}`} />
            <p className="text-[12px] text-gray-500 mt-1.5">You can select multiple files (images, PDF, CSV, XLSX, XLS), up to 10 MB each. Select again to add more.</p>
            {errors.files && <p role="alert" className="text-[12px] text-[#d9232b] mt-1">{errors.files}</p>}
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center gap-2 text-[13px] bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5">
                    <span className="flex-1 min-w-0 truncate" title={f.name}>{f.name}</span>
                    <span className="text-gray-400 shrink-0">{mb(f.size)}</span>
                    <button type="button" disabled={saving} onClick={() => setFiles(cur => cur.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`} className="text-gray-500 hover:text-[#d9232b] disabled:opacity-40"><X className="w-4 h-4" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label htmlFor="fu-date" className="block text-[15px] font-semibold text-[#333] mb-1.5">Next Follow-up Date</label>
            <input id="fu-date" type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} disabled={saving} className={field} />
          </div>
          <div>
            <label htmlFor="fu-time" className="block text-[15px] font-semibold text-[#333] mb-1.5">Next Follow-up Time</label>
            <input id="fu-time" type="time" value={nextTime} onChange={e => setNextTime(e.target.value)} disabled={saving || !nextDate} className={`${field} disabled:bg-gray-50`} />
          </div>
          <div>
            <label htmlFor="fu-notes" className="block text-[15px] font-semibold text-[#333] mb-1.5">Follow-up Notes <span className="text-[#d9232b]">*</span></label>
            <textarea id="fu-notes" rows={4} maxLength={FOLLOWUP_NOTES_MAX} value={notes} onChange={e => { setNotes(e.target.value); if (errors.notes) setErrors(x => ({ ...x, notes: undefined })); }} disabled={saving}
              placeholder="Add any notes about this follow-up..." aria-invalid={errors.notes ? true : undefined}
              className={`w-full border rounded-lg px-3 py-2 text-[14px] text-gray-900 focus:outline-none focus:border-[#f5b800] ${errors.notes ? 'border-[#d9232b]' : 'border-gray-300'}`} />
            {errors.notes && <p role="alert" className="text-[12px] text-[#d9232b] mt-1">{errors.notes}</p>}
          </div>
        </div>

        {errors.form && <p role="alert" className="mt-4 text-[13px] text-[#d9232b]">{errors.form}</p>}
        <div className="mt-6 flex items-center justify-end gap-3">
          {saving && <span className="mr-auto text-[13px] text-gray-500 flex items-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" />{busy}</span>}
          <button type="button" onClick={onClose} disabled={saving} className="px-5 h-[42px] rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-[14px] font-medium disabled:opacity-60">Cancel</button>
          <button type="submit" disabled={saving || !valid} className="inline-flex items-center gap-2 px-5 h-[42px] rounded-lg bg-[#4caf50] hover:bg-[#43a047] text-white text-[14px] font-semibold disabled:opacity-60"><Upload className="w-4 h-4" />Upload &amp; Increment</button>
        </div>
      </form>
    </div>
  );
}
