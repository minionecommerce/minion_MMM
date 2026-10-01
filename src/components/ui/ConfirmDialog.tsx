'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90]" onClick={busy ? undefined : onCancel} />
      <div className="fixed inset-0 z-[91] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className="w-full max-w-md bg-[#151619] border border-[#292B30] rounded-xl shadow-2xl p-6">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${danger ? 'bg-red-500/10' : 'bg-yellow-400/10'}`}>
              <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-400' : 'text-yellow-400'}`} />
            </div>
            <div className="flex-1">
              <h2 id="confirm-title" className="text-[16px] font-bold text-white">{title}</h2>
              <div className="text-[13px] text-gray-400 mt-1.5">{message}</div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onCancel} disabled={busy} className="px-4 py-2 rounded-lg border border-[#292B30] text-[13px] font-semibold text-gray-300 hover:bg-[#1a1b1e] disabled:opacity-50">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={busy}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold disabled:opacity-50 ${danger ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-yellow-400 hover:bg-yellow-300 text-black'}`}
            >
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
