'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Copy, Eye, FolderKanban, MoreVertical, Pencil, RotateCcw, Trash2, XCircle } from 'lucide-react';

export type DealActionHandlers = { onView: () => void; onEdit: () => void; onConvertToProject: () => void; onCloseDeal: () => void; onRevive: () => void; onDuplicate: () => void; onDelete: () => void };

// The Actions column of the Deals table: the Convert to Project icon (greyed out while the deal is closed) and the three dots with View,
// Edit, Close Deal (Revive Deal once the deal is closed), Duplicate and Delete. A deal that was converted is kept as it was: its icon is the
// link to its project (MP1) and the three dots only have View. The menu is drawn on top of the page (a portal), so the pinned Actions column
// and the rows below can never cover it, and it closes whenever the layout moves under it.
export default function DealActions({ canEdit, canCreate, canDelete, canConvert, isClosed, project, handlers }: {
  canEdit: boolean; canCreate: boolean; canDelete: boolean;
  canConvert: boolean; // deals.edit and projects.create
  isClosed: boolean;
  project: { id: string; code: string } | null; // set for a converted deal
  handlers: DealActionHandlers;
}) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const item = 'w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-100 text-left';
  const close = () => setPos(null);
  const run = (fn: () => void) => () => { close(); fn(); };
  const converted = project !== null;

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
      {converted ? (
        project.id && (
          <Link href={`/projects/${project.id}`} title={`Open project ${project.code}`} aria-label={`Open project ${project.code}`} className="h-8 px-2.5 rounded bg-[#0d6efd] hover:bg-[#0b5ed7] text-white flex items-center gap-1.5 text-[12px] font-semibold">
            <FolderKanban className="w-4 h-4" />{project.code}
          </Link>
        )
      ) : canConvert && (
        <button onClick={handlers.onConvertToProject} disabled={isClosed} title={isClosed ? 'Revive the deal to convert it to a project' : 'Convert to Project'} aria-label="Convert deal to project" className="w-8 h-8 rounded bg-[#0d6efd] hover:bg-[#0b5ed7] text-white flex items-center justify-center disabled:opacity-40 disabled:hover:bg-[#0d6efd] disabled:cursor-not-allowed">
          <FolderKanban className="w-[18px] h-[18px]" />
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
            {!converted && canEdit && <button role="menuitem" className={item} onClick={run(handlers.onEdit)}><Pencil className="w-4 h-4" /> Edit</button>}
            {!converted && canEdit && !isClosed && <button role="menuitem" className={item} onClick={run(handlers.onCloseDeal)}><XCircle className="w-4 h-4 text-[#dc3545]" /> Close Deal</button>}
            {!converted && canEdit && isClosed && <button role="menuitem" className={item} onClick={run(handlers.onRevive)}><RotateCcw className="w-4 h-4 text-[#16a34a]" /> Revive Deal</button>}
            {!converted && canCreate && <button role="menuitem" className={item} onClick={run(handlers.onDuplicate)}><Copy className="w-4 h-4" /> Duplicate</button>}
            {!converted && canDelete && <button role="menuitem" className={`${item} text-[#d9232b] hover:bg-red-50`} onClick={run(handlers.onDelete)}><Trash2 className="w-4 h-4" /> Delete</button>}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
