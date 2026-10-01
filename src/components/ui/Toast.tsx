'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
type Toast = { id: number; kind: ToastKind; message: string };

const ToastContext = createContext<(kind: ToastKind, message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts(t => t.filter(x => x.id !== id)), []);
  const show = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, kind, message }]);
    setTimeout(() => dismiss(id), kind === 'error' ? 7000 : 4000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 w-[min(92vw,380px)]" role="status" aria-live="polite">
        {toasts.map(t => {
          const Icon = t.kind === 'success' ? CheckCircle2 : t.kind === 'error' ? AlertCircle : Info;
          const color = t.kind === 'success' ? 'text-green-400 border-green-500/30' : t.kind === 'error' ? 'text-red-400 border-red-500/30' : 'text-blue-400 border-blue-500/30';
          return (
            <div key={t.id} className={`flex items-start gap-3 bg-[#1a1b1e] border ${color} rounded-lg px-4 py-3 shadow-2xl`}>
              <Icon className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-[13px] text-gray-200 flex-1">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-gray-500 hover:text-white" aria-label="Dismiss">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  return {
    success: (m: string) => show('success', m),
    error: (m: string) => show('error', m),
    info: (m: string) => show('info', m),
  };
}
