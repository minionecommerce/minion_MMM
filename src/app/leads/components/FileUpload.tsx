'use client';

import { useRef } from 'react';
import { ClipboardPaste, FileText, Info, X } from 'lucide-react';
import { MAX_ATTACHMENT_MB, MAX_ATTACHMENTS_PER_LEAD, MAX_ORIGINAL_IMAGE_BYTES, PASTED_IMAGE_EXTENSIONS } from '@/lib/leads/constants';
import { formatBytes } from '@/lib/leads/image-optimize';
import QueueList from './QueueList';
import type { QueuedFile } from './useFileQueue';

// thumbUrl/width/height exist for images uploaded after image optimization; older files only have `url`
export type ExistingFile = { id: string; fileName: string; mimeType: string; size: number; url: string | null; thumbUrl?: string | null; width?: number | null; height?: number | null };

export default function FileUpload({ items, existing, removedIds, room, onAdd, onRemove, onRemoveExisting, onError, disabled }: {
  items: QueuedFile[];
  existing: ExistingFile[];
  removedIds: string[];
  room: number; // how many more files may still be added
  onAdd: (files: File[]) => void;
  onRemove: (key: string) => void;
  onRemoveExisting: (id: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const keptExisting = existing.filter(e => !removedIds.includes(e.id));

  const pasteFromClipboard = async () => {
    try {
      const clip = await navigator.clipboard.read();
      const found: File[] = [];
      for (const item of clip) {
        const type = item.types.find(t => t.startsWith('image/'));
        if (type) found.push(new File([await item.getType(type)], `pasted-${Date.now()}-${found.length}.${PASTED_IMAGE_EXTENSIONS[type] ?? 'png'}`, { type }));
      }
      if (found.length) onAdd(found); else onError('No image found on the clipboard');
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
          disabled={disabled || room <= 0}
          aria-label="Upload files"
          onChange={e => { onAdd(Array.from(e.target.files ?? [])); e.target.value = ''; }}
          className="flex-1 min-w-0 border-2 border-gray-200 rounded-md px-2 py-2 text-[14px] text-gray-700 file:mr-2 file:rounded file:border file:border-gray-400 file:bg-gray-100 file:px-2 file:py-1 file:text-[14px]"
        />
        <button type="button" onClick={pasteFromClipboard} disabled={disabled || room <= 0} title="Paste image from clipboard" aria-label="Paste image from clipboard" className="w-12 rounded-md bg-[#5b4bdb] hover:bg-[#4c3dc4] text-white flex items-center justify-center disabled:opacity-50">
          <ClipboardPaste className="w-5 h-5" />
        </button>
      </div>
      <p className="flex items-center gap-1.5 text-[12px] italic text-gray-500"><Info className="w-3.5 h-3.5 shrink-0" fill="currentColor" stroke="white" />Tip: Click the paste icon or use Ctrl+V (or Cmd+V on Mac) to paste images. Photos (JPEG, PNG, WebP, up to {formatBytes(MAX_ORIGINAL_IMAGE_BYTES)}) are resized and compressed to fit {MAX_ATTACHMENT_MB} MB. Any other file type, up to {MAX_ATTACHMENT_MB} MB each, {MAX_ATTACHMENTS_PER_LEAD} files per lead.</p>

      {keptExisting.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {keptExisting.map(f => (
            <li key={f.id} className="flex items-center gap-2 border border-gray-200 rounded-md p-2 bg-gray-50">
              {(f.thumbUrl || f.url) && f.mimeType.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={(f.thumbUrl || f.url)!} alt="" width={40} height={40} loading="lazy" decoding="async" className="w-10 h-10 rounded object-cover" />
              ) : <FileText className="w-10 h-10 text-gray-400 p-2" />}
              <div className="min-w-0 flex-1 text-[12px]"><div className="truncate text-gray-800">{f.fileName}</div><div className="text-gray-500">{formatBytes(f.size)} · saved</div></div>
              <button type="button" onClick={() => onRemoveExisting(f.id)} aria-label={`Remove ${f.fileName}`} className="text-gray-500 hover:text-[#d9232b]"><X className="w-4 h-4" /></button>
            </li>
          ))}
        </ul>
      )}
      <QueueList items={items} onRemove={onRemove} disabled={disabled} className="pt-1" />
    </div>
  );
}
