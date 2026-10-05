'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Eye, MoreVertical, Pencil, RotateCcw, Trash2, XCircle } from 'lucide-react';
import ConvertIcon from './ConvertIcon';

export type LeadActionHandlers = { onView: () => void; onEdit: () => void; onConvert: () => void; onCloseLead: () => void; onReopen: () => void; onDuplicate: () => void; onDelete: () => void };

// canClose / canReopen: the person may edit leads and this lead is open / closed
// canConvert: the person may edit leads and create deals; convertBlocked is why this lead cannot be converted right now (or null)
export default function LeadActions({ canEdit, canCreate, canDelete, canConvert, convertBlocked, canClose, canReopen, handlers }: { canEdit: boolean; canCreate: boolean; canDelete: boolean; canConvert: boolean; convertBlocked: string | null; canClose: boolean; canReopen: boolean; handlers: LeadActionHandlers }) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const item = 'w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-100 text-left';
  const close = () => setPos(null);
  const run = (fn: () => void) => () => { close(); fn(); };

  // The menu is drawn on top of the page (a portal), so the pinned Actions column and the
  // rows below can never cover it. Close it whenever the layout moves under it.
  useEffect(() => {
    if (!pos) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('scroll', close, true); window.removeEventListener('resize', close); };
  }, [pos]);

  const toggle = () => {
    if (pos) return close();
    const r = trigger.current!.getBoundingClientRect();
    setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
  };

  return (
    <div className="flex items-center gap-2">
      {canConvert && (
        <button onClick={handlers.onConvert} disabled={!!convertBlocked} title={convertBlocked ?? 'Convert to deal'} aria-label="Convert lead to deal" className="w-8 h-8 rounded bg-[#f5b800] hover:bg-[#e0a800] text-white flex items-center justify-center disabled:opacity-40 disabled:hover:bg-[#f5b800] disabled:cursor-not-allowed">
          <ConvertIcon />
        </button>
      )}
      <button ref={trigger} onClick={toggle} title="More" aria-label="More actions" aria-haspopup="menu" aria-expanded={!!pos} className="w-8 h-8 rounded bg-[#5b6068] hover:bg-[#444] text-white flex items-center justify-center">
        <MoreVertical className="w-4 h-4" />
      </button>
      {pos && createPortal(
        <>
          <div className="fixed inset-0 z-[70]" onClick={close} />
          <div role="menu" data-light-native style={{ top: pos.top, right: pos.right }} className="fixed z-[71] w-44 bg-white border border-gray-200 rounded-lg shadow-xl py-1">
            <button role="menuitem" className={item} onClick={run(handlers.onView)}><Eye className="w-4 h-4" /> View</button>
            {canEdit && <button role="menuitem" className={item} onClick={run(handlers.onEdit)}><Pencil className="w-4 h-4" /> Edit</button>}
            {canClose && <button role="menuitem" className={item} onClick={run(handlers.onCloseLead)}><XCircle className="w-4 h-4 text-[#dc3545]" /> Close Lead</button>}
            {canReopen && <button role="menuitem" className={item} onClick={run(handlers.onReopen)}><RotateCcw className="w-4 h-4 text-[#16a34a]" /> Reopen Lead</button>}
            {canCreate && <button role="menuitem" className={item} onClick={run(handlers.onDuplicate)}><Copy className="w-4 h-4" /> Duplicate</button>}
            {canDelete && <button role="menuitem" className={`${item} text-[#d9232b] hover:bg-red-50`} onClick={run(handlers.onDelete)}><Trash2 className="w-4 h-4" /> Delete</button>}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
