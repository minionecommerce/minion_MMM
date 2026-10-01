'use client';

import { useEffect, useMemo, useRef } from 'react';
import { ClipboardPaste, FileText, Info, X } from 'lucide-react';
import { ALLOWED_ATTACHMENT_TYPES, ATTACHMENT_ACCEPT, MAX_ATTACHMENTS_PER_LEAD, MAX_ATTACHMENT_BYTES } from '@/lib/leads/constants';

export type ExistingFile = { id: string; fileName: string; mimeType: string; size: number; url: string | null };

const mb = (n: number) => (n / (1024 * 1024)).toFixed(n < 1024 * 1024 ? 2 : 1) + ' MB';

// Returns an error message, or null when the file can be attached
export function checkFile(file: File): string | null {
  if (!(file.type in ALLOWED_ATTACHMENT_TYPES)) return `${file.name}: only JPEG, PNG, WebP and PDF files are allowed`;
  if (file.size > MAX_ATTACHMENT_BYTES) return `${file.name}: larger than 10 MB`;
  if (file.size === 0) return `${file.name}: file is empty`;
  return null;
}

export default function FileUpload({ files, existing, removedIds, onAdd, onRemove, onRemoveExisting, onError, disabled }: {
  files: File[];
  existing: ExistingFile[];
  removedIds: string[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  onRemoveExisting: (id: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map(f => (f.type.startsWith('image/') ? URL.createObjectURL(f) : null)), [files]);
  useEffect(() => () => previews.forEach(u => u && URL.revokeObjectURL(u)), [previews]);

  const keptExisting = existing.filter(e => !removedIds.includes(e.id));
  const room = MAX_ATTACHMENTS_PER_LEAD - files.length - keptExisting.length;

  const accept = (incoming: File[]) => {
    const good: File[] = [];
    for (const f of incoming) {
      const problem = checkFile(f);
      if (problem) { onError(problem); continue; }
      if (good.length >= room) { onError(`A lead can have at most ${MAX_ATTACHMENTS_PER_LEAD} files`); break; }
      good.push(f);
    }
    if (good.length) onAdd(good);
  };

  const pasteFromClipboard = async () => {
    try {
      const items = await navigator.clipboard.read();
      const found: File[] = [];
      for (const item of items) {
        const type = item.types.find(t => t.startsWith('image/'));
        if (type) found.push(new File([await item.getType(type)], `pasted-${Date.now()}-${found.length}.${ALLOWED_ATTACHMENT_TYPES[type] ?? 'png'}`, { type }));
      }
      if (found.length) accept(found); else onError('No image found on the clipboard');
    } catch {
      onError('Your browser blocked clipboard access. Click in the form and press Ctrl+V (Cmd+V on Mac) instead.');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-stretch gap-3">
        <input
          ref={input}
          type="file"
          multiple
          accept={ATTACHMENT_ACCEPT}
          disabled={disabled || room <= 0}
          aria-label="Upload files"
          onChange={e => { accept(Array.from(e.target.files ?? [])); e.target.value = ''; }}
          className="flex-1 min-w-0 border-2 border-gray-200 rounded-md px-2 py-2 text-[14px] text-gray-700 file:mr-2 file:rounded file:border file:border-gray-400 file:bg-gray-100 file:px-2 file:py-1 file:text-[14px]"
        />
        <button type="button" onClick={pasteFromClipboard} disabled={disabled || room <= 0} title="Paste image from clipboard" aria-label="Paste image from clipboard" className="w-12 rounded-md bg-[#5b4bdb] hover:bg-[#4c3dc4] text-white flex items-center justify-center disabled:opacity-50">
          <ClipboardPaste className="w-5 h-5" />
        </button>
      </div>
      <p className="flex items-center gap-1.5 text-[12px] italic text-gray-500"><Info className="w-3.5 h-3.5 shrink-0" fill="currentColor" stroke="white" />Tip: Click the paste icon or use Ctrl+V (or Cmd+V on Mac) to paste images. JPEG, PNG, WebP or PDF, up to 10 MB each, {MAX_ATTACHMENTS_PER_LEAD} files per lead.</p>

      {(keptExisting.length > 0 || files.length > 0) && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {keptExisting.map(f => (
            <li key={f.id} className="flex items-center gap-2 border border-gray-200 rounded-md p-2 bg-gray-50">
              {f.url && f.mimeType.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.url} alt="" className="w-10 h-10 rounded object-cover" />
              ) : <FileText className="w-10 h-10 text-gray-400 p-2" />}
              <div className="min-w-0 flex-1 text-[12px]"><div className="truncate text-gray-800">{f.fileName}</div><div className="text-gray-500">{mb(f.size)} · saved</div></div>
              <button type="button" onClick={() => onRemoveExisting(f.id)} aria-label={`Remove ${f.fileName}`} className="text-gray-500 hover:text-[#d9232b]"><X className="w-4 h-4" /></button>
            </li>
          ))}
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2 border border-gray-200 rounded-md p-2">
              {previews[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previews[i]!} alt="" className="w-10 h-10 rounded object-cover" />
              ) : <FileText className="w-10 h-10 text-gray-400 p-2" />}
              <div className="min-w-0 flex-1 text-[12px]"><div className="truncate text-gray-800">{f.name}</div><div className="text-gray-500">{mb(f.size)}</div></div>
              <button type="button" onClick={() => onRemove(i)} aria-label={`Remove ${f.name}`} className="text-gray-500 hover:text-[#d9232b]"><X className="w-4 h-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
