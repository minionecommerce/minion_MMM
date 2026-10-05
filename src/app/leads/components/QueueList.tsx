'use client';

import { CheckCircle2, FileText, Loader2, Music, X } from 'lucide-react';
import { formatBytes, savings } from '@/lib/leads/image-optimize';
import type { QueuedFile } from './useFileQueue';

function Status({ f }: { f: QueuedFile }) {
  if (f.status === 'processing') {
    return <span className="flex items-center gap-1 text-gray-500"><Loader2 className="w-3 h-3 animate-spin" />{f.type.startsWith('image/') ? 'Processing image…' : 'Checking file…'}</span>;
  }
  if (f.status === 'uploading') return <span className="flex items-center gap-1 text-gray-500"><Loader2 className="w-3 h-3 animate-spin" />Uploading…</span>;
  if (f.status === 'uploaded') return <span className="flex items-center gap-1 text-[#16a34a]"><CheckCircle2 className="w-3.5 h-3.5" />Uploaded</span>;
  if (f.status === 'error') return <span role="alert" className="text-[#d9232b]">{f.error}</span>;
  const saved = f.kind === 'image' ? savings(f.originalSize, f.size) : null;
  return <span className="text-gray-500">Ready · {formatBytes(f.size)}{saved ? ` (${saved} from ${formatBytes(f.originalSize)})` : ''}</span>;
}

// One row per picked file, with its own status, so nothing looks frozen while images are processed or uploaded
export default function QueueList({ items, onRemove, disabled, className = '' }: { items: QueuedFile[]; onRemove: (key: string) => void; disabled?: boolean; className?: string }) {
  if (!items.length) return null;
  return (
    <ul className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${className}`}>
      {items.map(f => (
        <li key={f.key} className={`flex items-center gap-2 border rounded-md p-2 ${f.status === 'error' ? 'border-[#d9232b]/40 bg-red-50' : 'border-gray-200'}`}>
          {f.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.previewUrl} alt="" width={40} height={40} className="w-10 h-10 rounded object-cover shrink-0" />
          ) : f.kind === 'audio' || f.audio ? <Music className="w-10 h-10 text-[#d9232b] p-2 shrink-0" /> : <FileText className="w-10 h-10 text-gray-400 p-2 shrink-0" />}
          <div className="min-w-0 flex-1 text-[12px]">
            <div className="truncate text-gray-800" title={f.name}>{f.name}</div>
            <Status f={f} />
          </div>
          <button type="button" onClick={() => onRemove(f.key)} disabled={disabled || f.status === 'uploading'} aria-label={`Remove ${f.name}`} className="text-gray-500 hover:text-[#d9232b] disabled:opacity-40 shrink-0"><X className="w-4 h-4" /></button>
        </li>
      ))}
    </ul>
  );
}
