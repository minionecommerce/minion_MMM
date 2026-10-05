'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Eye, FileText, Loader2, X } from 'lucide-react';
import { callApi } from '@/lib/leads/client';
import type { LeadRow } from '@/lib/leads/queries';
import type { ExistingFile } from './FileUpload';

type When = { date: string; time: string };
type FollowUpItem = { id: string; number: number; notes: string; doneOn: When; next: When | null; files: ExistingFile[] };

const mb = (n: number) => (n / (1024 * 1024)).toFixed(n < 1024 * 1024 ? 2 : 1) + ' MB';

// 1 -> "1st", 2 -> "2nd", 11 -> "11th", 23 -> "23rd"
function ordinal(n: number) {
  const tens = n % 100;
  const suffix = tens >= 11 && tens <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
}

// Shows one follow-up's proof files. Images, PDFs, video and audio open right here; every other format
// (Excel, Word, CSV, ...) gets an Open / Download button because browsers cannot render those.
function FilePreview({ title, files, onClose }: { title: string; files: ExistingFile[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  // A file can be missing from storage (for example deleted in the Supabase dashboard) while its record remains
  const [missing, setMissing] = useState<Record<string, true>>({});
  const file = files[index];
  const many = files.length > 1;
  const markMissing = () => setMissing(m => ({ ...m, [file.id]: true }));

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') setIndex(i => (i > 0 ? i - 1 : i));
      else if (e.key === 'ArrowRight') setIndex(i => (i < files.length - 1 ? i + 1 : i));
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose, files.length]);

  const type = file.mimeType;
  const kind = type.startsWith('image/') ? 'image' : type === 'application/pdf' ? 'pdf' : type.startsWith('video/') ? 'video' : type.startsWith('audio/') ? 'audio' : 'other';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-0 sm:p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={`${title} files`} className="bg-white w-full sm:max-w-[920px] max-h-screen sm:max-h-[94vh] sm:rounded-xl shadow-2xl flex flex-col">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-200 shrink-0">
          <div className="min-w-0 flex-1">
            <h3 className="text-[16px] font-bold text-[#333] truncate" title={file.fileName}>{file.fileName}</h3>
            <p className="text-[12px] text-gray-500">{title}{many ? ` · File ${index + 1} of ${files.length}` : ''} · {mb(file.size)}</p>
          </div>
          {file.url && <a href={file.url} target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex items-center gap-1.5 text-[13px] text-[#2f80ed] hover:underline"><ExternalLink className="w-4 h-4" />Open in new tab</a>}
          <button type="button" onClick={onClose} aria-label="Close preview" className="shrink-0 text-gray-500 hover:text-black"><X className="w-6 h-6" /></button>
        </div>

        <div className="relative flex-1 min-h-[260px] overflow-auto bg-gray-50 flex items-center justify-center p-3">
          {!file.url || missing[file.id] ? (
            <div className="text-center py-8 px-4">
              <FileText className="w-14 h-14 text-gray-300 mx-auto" />
              <p className="mt-3 text-[14px] text-gray-800">This file is not available.</p>
              <p className="text-[12px] text-gray-500 mt-1">It was saved with this follow-up, but it is no longer in storage (it may have been deleted).</p>
            </div>
          ) : kind === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={file.id} src={file.url} alt={file.fileName} onError={markMissing} className="max-h-[70vh] max-w-full object-contain" />
          ) : kind === 'pdf' ? (
            <iframe key={file.id} src={file.url} title={file.fileName} className="w-full h-[70vh] bg-white border-0" />
          ) : kind === 'video' ? (
            <video key={file.id} src={file.url} controls onError={markMissing} className="max-h-[70vh] max-w-full" />
          ) : kind === 'audio' ? (
            <audio key={file.id} src={file.url} controls onError={markMissing} className="w-full max-w-md" />
          ) : (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-400 mx-auto" />
              <p className="mt-3 text-[14px] text-gray-800 break-all">{file.fileName}</p>
              <p className="text-[12px] text-gray-500 mt-1">This file type can&apos;t be shown in the browser.</p>
              <a href={file.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 px-5 h-[40px] rounded-lg bg-[#d9232b] hover:bg-[#b81c23] text-white text-[14px] font-semibold"><ExternalLink className="w-4 h-4" />Open / Download</a>
            </div>
          )}
          {many && (
            <>
              <button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)} aria-label="Previous file" className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-700 hover:bg-white disabled:opacity-30"><ChevronLeft className="w-5 h-5" /></button>
              <button type="button" disabled={index === files.length - 1} onClick={() => setIndex(index + 1)} aria-label="Next file" className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-700 hover:bg-white disabled:opacity-30"><ChevronRight className="w-5 h-5" /></button>
            </>
          )}
        </div>

        {many && (
          <ul className="flex gap-2 overflow-x-auto px-5 py-3 border-t border-gray-200 shrink-0">
            {files.map((f, i) => (
              <li key={f.id} className="shrink-0">
                <button type="button" onClick={() => setIndex(i)} aria-current={i === index} title={f.fileName}
                  className={`max-w-[220px] flex items-center gap-1.5 px-2 h-9 rounded-md text-[12px] border ${i === index ? 'border-[#d9232b] text-[#d9232b] bg-red-50 font-semibold' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  {f.thumbUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.thumbUrl} alt="" width={24} height={24} loading="lazy" decoding="async" className="w-6 h-6 rounded object-cover shrink-0" />
                  )}
                  <span className="truncate">{f.fileName}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Plays one follow-up recording right in the table. Nothing is downloaded until Play is pressed.
function AudioPlayer({ file }: { file: ExistingFile }) {
  const [failed, setFailed] = useState(false);
  if (!file.url || failed) {
    return (
      <div className="w-[210px] text-[12px] text-gray-500">
        <div className="truncate" title={file.fileName}>{file.fileName}</div>
        {file.url
          ? <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-[#2f80ed] hover:underline">This browser can&apos;t play it. Open / Download</a>
          : 'Not available: it is no longer in storage'}
      </div>
    );
  }
  return (
    <div className="w-[210px]">
      <audio controls preload="none" src={file.url} onError={() => setFailed(true)} aria-label={`Play ${file.fileName}`} className="w-full h-9" />
      <div className="text-[11px] text-gray-500 truncate" title={file.fileName}>{file.fileName} · {mb(file.size)}</div>
    </div>
  );
}

const isAudioFile = (f: ExistingFile) => f.mimeType.startsWith('audio/');

// "Follow-up Files (N)": opened by clicking the follow-up count in the Follow-up column
export default function FollowUpFilesModal({ row, onClose, apiBase = '/api/leads', noun = 'Lead' }: { row: LeadRow; onClose: () => void; apiBase?: string; noun?: string }) {
  const [items, setItems] = useState<FollowUpItem[] | null>(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<FollowUpItem | null>(null);

  useEffect(() => {
    let live = true;
    callApi<{ followUps: FollowUpItem[] }>(`${apiBase}/${row.id}/follow-ups`, 'GET').then(d => live && setItems(d.followUps)).catch(e => live && setError(e.message));
    return () => { live = false; };
  }, [apiBase, row.id]);

  // While a preview is open it owns the Escape key
  useEffect(() => {
    if (preview) return;
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose, preview]);

  const th = 'px-4 py-3 text-[14px] font-semibold text-[#444] whitespace-nowrap';
  return (
    <>
      <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center bg-black/50 p-0 sm:p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div role="dialog" aria-modal="true" aria-labelledby="ffm-title" className="bg-white w-full sm:max-w-[1000px] max-h-screen sm:max-h-[92vh] sm:rounded-2xl shadow-2xl flex flex-col">
          <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 shrink-0">
            <div>
              <h2 id="ffm-title" className="text-[24px] font-bold text-[#333]">Follow-up Files ({items?.length ?? row.followUpCount})</h2>
              <p className="text-[12px] text-gray-400 mt-1">{noun} {row.code} · {row.customerName}</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="text-gray-500 hover:text-black"><X className="w-6 h-6" /></button>
          </div>

          <div className="px-6 overflow-y-auto">
            {!items && !error && <div className="py-12 flex justify-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin" /></div>}
            {error && <p role="alert" className="py-6 text-[14px] text-[#d9232b]">{error}</p>}
            {items && items.length === 0 && <p className="py-10 text-center text-[14px] text-gray-500">No follow-ups have been added yet.</p>}
            {items && items.length > 0 && (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr><th className={th}>Follow-up</th><th className={th}>Date &amp; Time</th><th className={th}>Notes</th><th className={th}>Next Follow-up</th><th className={`${th} text-center`}>File</th><th className={th}>Audio</th></tr>
                  </thead>
                  <tbody>
                    {items.map(f => {
                      const proof = f.files.filter(x => !isAudioFile(x));
                      const audio = f.files.filter(isAudioFile);
                      return (
                      <tr key={f.id} className="border-b border-gray-200 last:border-b-0 align-middle">
                        <td className="px-4 py-3.5 text-[15px] font-bold text-[#d9232b] whitespace-nowrap">{ordinal(f.number)} Follow</td>
                        <td className="px-4 py-3.5 text-[14px] text-gray-700 whitespace-nowrap">{f.doneOn.date}<br />{f.doneOn.time}</td>
                        <td className="px-4 py-3.5 text-[14px] text-gray-700 min-w-[140px] max-w-[260px] whitespace-pre-line break-words">{f.notes}</td>
                        <td className="px-4 py-3.5 text-[14px] text-gray-700 whitespace-nowrap">
                          {f.next ? <span className="flex gap-1.5"><span className="text-[#16a34a]">●</span><span>{f.next.date}<br />{f.next.time}</span></span> : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {proof.length ? (
                            <button type="button" onClick={() => setPreview({ ...f, files: proof })} aria-label={`Preview files of the ${ordinal(f.number)} follow-up`}
                              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md bg-[#d9232b] hover:bg-[#b81c23] text-white text-[12px] font-semibold">
                              <Eye className="w-3.5 h-3.5" />Preview{proof.length > 1 ? ` (${proof.length})` : ''}
                            </button>
                          ) : <span className="text-[13px] text-gray-400">No file</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          {audio.length ? <div className="space-y-2">{audio.map(a => <AudioPlayer key={a.id} file={a} />)}</div> : <span className="text-[13px] text-gray-400">No audio</span>}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="px-6 py-5 shrink-0">
            <button type="button" onClick={onClose} className="px-6 h-[40px] rounded-lg bg-[#f5b800] hover:bg-[#e0a800] text-[#1f1f1f] text-[14px] font-semibold">Close</button>
          </div>
        </div>
      </div>
      {preview && <FilePreview title={`${ordinal(preview.number)} follow-up`} files={preview.files} onClose={() => setPreview(null)} />}
    </>
  );
}
