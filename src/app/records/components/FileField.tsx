'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, Loader2, Paperclip, Upload, X } from 'lucide-react';
import { formatBytes } from '@/lib/leads/image-optimize';
import { MAX_FILE_MB, type FileDto } from '@/lib/records/types';
import { useToast } from '@/components/ui/Toast';
import { discardRecordFile, uploadRecordFile } from '../client';

type Uploading = { key: string; name: string };
const uploadKey = (name: string) => `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

// A File Upload field: pick files, they are sent to Storage straight away (so Save only has to attach them) and show as chips.
// `compact` is the small version used inside a table row.
export default function FileField({ slug, fieldKey, label, files, maxFiles, onChange, onBusy, disabled, compact, readOnly }: {
  slug: string;
  fieldKey: string;
  label: string;
  files: FileDto[];
  maxFiles: number;
  onChange: (files: FileDto[]) => void;
  onBusy?: (delta: number) => void; // +1 when an upload starts, -1 when it ends: Save waits for all of them
  disabled?: boolean;
  compact?: boolean;
  readOnly?: boolean;
}) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const fresh = useRef(new Set<string>()); // uploaded in this form and not saved yet: removing one throws it away
  const current = useRef(files);
  useEffect(() => { current.current = files; });
  const [uploading, setUploading] = useState<Uploading[]>([]);
  const room = maxFiles - files.length - uploading.length;

  const add = async (picked: File[]) => {
    const take = picked.slice(0, Math.max(0, room));
    if (picked.length > take.length) toast.error(`${label} can have at most ${maxFiles} file${maxFiles === 1 ? '' : 's'}`);
    for (const file of take) {
      const key = uploadKey(file.name);
      setUploading(u => [...u, { key, name: file.name }]);
      onBusy?.(1);
      try {
        const saved = await uploadRecordFile(slug, fieldKey, file);
        fresh.current.add(saved.id);
        onChange([...current.current, saved]);
        current.current = [...current.current, saved];
      } catch (e) {
        toast.error(e instanceof Error ? e.message : `${file.name}: the upload failed`);
      } finally {
        setUploading(u => u.filter(x => x.key !== key));
        onBusy?.(-1);
      }
    }
  };

  const remove = (file: FileDto) => {
    onChange(files.filter(f => f.id !== file.id));
    if (fresh.current.has(file.id)) { fresh.current.delete(file.id); void discardRecordFile(slug, file.id); }
  };

  const chips = (
    <ul className={compact ? 'space-y-1' : 'flex flex-wrap gap-2'}>
      {files.map(f => (
        <li key={f.id} className={`flex items-center gap-1.5 border border-gray-200 rounded bg-gray-50 ${compact ? 'px-1.5 py-0.5 text-[12px]' : 'px-2 py-1 text-[13px]'} max-w-full`}>
          <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden />
          {f.url ? (
            <a href={f.url} target="_blank" rel="noopener noreferrer" title={`${f.fileName} · ${formatBytes(f.size)}`} className="truncate text-[#1a56c4] hover:underline">{f.fileName}</a>
          ) : (
            <span className="truncate text-gray-800" title={`${f.fileName} · ${formatBytes(f.size)}`}>{f.fileName}</span>
          )}
          {!compact && <span className="text-gray-400 shrink-0">{formatBytes(f.size)}</span>}
          {!readOnly && !disabled && <button type="button" onClick={() => remove(f)} aria-label={`Remove ${f.fileName}`} className="text-gray-400 hover:text-[#d9232b] shrink-0"><X className="w-3.5 h-3.5" /></button>}
        </li>
      ))}
      {uploading.map(u => (
        <li key={u.key} className={`flex items-center gap-1.5 border border-dashed border-gray-300 rounded ${compact ? 'px-1.5 py-0.5 text-[12px]' : 'px-2 py-1 text-[13px]'} text-gray-500 max-w-full`}>
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden /><span className="truncate">Uploading {u.name}…</span>
        </li>
      ))}
    </ul>
  );

  if (readOnly) return files.length ? chips : <span className="text-gray-400">—</span>;

  return (
    <div className={compact ? 'space-y-1' : 'space-y-2'}>
      <input
        ref={input}
        type="file"
        multiple={maxFiles > 1}
        hidden
        aria-label={`Upload ${label}`}
        onChange={e => { const picked = Array.from(e.target.files ?? []); e.target.value = ''; void add(picked); }}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={disabled || room <= 0}
        className={compact
          ? 'inline-flex items-center gap-1.5 h-[34px] px-2.5 border border-gray-300 rounded bg-white text-[13px] text-gray-500 hover:border-gray-500 disabled:opacity-50'
          : 'inline-flex items-center gap-2 h-[36px] px-3 border border-dashed border-gray-400 rounded bg-white text-[14px] text-gray-800 hover:border-gray-600 disabled:opacity-50'}
      >
        {compact ? <Paperclip className="w-3.5 h-3.5" aria-hidden /> : <Upload className="w-4 h-4" aria-hidden />}
        {compact ? 'Choose file' : 'Upload File'}
      </button>
      {!compact && <p className="text-[12px] text-gray-500">You can upload {maxFiles === 1 ? 'a file' : `up to ${maxFiles} files`} of {MAX_FILE_MB}MB or lesser each.</p>}
      {(files.length > 0 || uploading.length > 0) && chips}
    </div>
  );
}
