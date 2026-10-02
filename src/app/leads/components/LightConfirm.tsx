'use client';

import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

// Confirmation dialog in the Leads page style (Cancel | action)
export default function LightConfirm({ title, children, confirmLabel, danger, busy, onConfirm, onCancel }: {
  title: string; children: ReactNode; confirmLabel: string; danger?: boolean; busy?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 p-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby="light-confirm-title" className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md">
        <h3 id="light-confirm-title" className="text-[17px] font-bold text-[#333]">{title}</h3>
        <div className="text-[14px] text-gray-600 mt-2 space-y-2">{children}</div>
        <div className="flex justify-end gap-3 mt-5">
          <button disabled={busy} onClick={onCancel} className="px-4 h-[38px] rounded-md bg-gray-200 text-gray-800 text-[14px] disabled:opacity-60">Cancel</button>
          <button disabled={busy} onClick={onConfirm} className={`px-4 h-[38px] rounded-md text-white text-[14px] font-medium disabled:opacity-60 flex items-center gap-2 ${danger ? 'bg-[#d9232b] hover:bg-[#b81d24]' : 'bg-black hover:bg-[#222]'}`}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}{confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
