'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, MoreVertical, Pencil, Trash2 } from 'lucide-react';

export type RecordActionHandlers = { onView: () => void; onEdit: () => void; onDelete: () => void };

// The Actions column of a record list: the Edit icon (View when the person cannot edit) and the three dots with View, Edit and Delete.
// The menu is drawn on top of the page (a portal) so the pinned Actions column and the rows below can never cover it.
export default function RecordActions({ canEdit, canDelete, handlers }: { canEdit: boolean; canDelete: boolean; handlers: RecordActionHandlers }) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const item = 'w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-100 text-left';
  const close = () => setPos(null);
  const run = (fn: () => void) => () => { close(); fn(); };

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
      {canEdit ? (
        <button onClick={handlers.onEdit} title="Edit" aria-label="Edit" className="w-8 h-8 rounded bg-[#f5b800] hover:bg-[#e0a800] text-black flex items-center justify-center"><Pencil className="w-4 h-4" /></button>
      ) : (
        <button onClick={handlers.onView} title="View" aria-label="View" className="w-8 h-8 rounded bg-[#f5b800] hover:bg-[#e0a800] text-black flex items-center justify-center"><Eye className="w-4 h-4" /></button>
      )}
      <button ref={trigger} onClick={toggle} title="More" aria-label="More actions" aria-haspopup="menu" aria-expanded={!!pos} className="w-8 h-8 rounded bg-[#5b6068] hover:bg-[#444] text-white flex items-center justify-center">
        <MoreVertical className="w-4 h-4" />
      </button>
      {pos && createPortal(
        <>
          <div className="fixed inset-0 z-[70]" onClick={close} />
          <div role="menu" data-light-native style={{ top: pos.top, right: pos.right }} className="fixed z-[71] w-40 bg-white border border-gray-200 rounded-lg shadow-xl py-1">
            <button role="menuitem" className={item} onClick={run(handlers.onView)}><Eye className="w-4 h-4" /> View</button>
            {canEdit && <button role="menuitem" className={item} onClick={run(handlers.onEdit)}><Pencil className="w-4 h-4" /> Edit</button>}
            {canDelete && <button role="menuitem" className={`${item} text-[#d9232b] hover:bg-red-50`} onClick={run(handlers.onDelete)}><Trash2 className="w-4 h-4" /> Delete</button>}
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}
