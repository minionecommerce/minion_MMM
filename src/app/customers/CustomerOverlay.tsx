'use client';

import { useCallback, useEffect, useState } from 'react';
import { callApi } from '@/lib/leads/client';
import type { CustomerDto } from '@/lib/quotes/types';
import type { CustomerFormData } from '@/lib/customers/types';
import { Button, Spinner } from '../quotes/ui';
import CustomerForm from './CustomerForm';

// The Customer form in a window over the page it was opened from (the quote form): New Customer (no id) or Edit Customer. It asks for the layout and
// the customer when it opens, and again when Edit Page Layout was changed. It sits under Edit Page Layout (z-80) so that can open over it, and it does
// not close on a click outside or Escape: what was typed would be lost.
export default function CustomerOverlay({ customerId, onClose, onSaved }: {
  customerId: string | null;
  onClose: () => void;
  onSaved: (customer: CustomerDto, wasNew: boolean) => void;
}) {
  const [data, setData] = useState<CustomerFormData | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await callApi<CustomerFormData>(`/api/customers/form${customerId ? `?id=${encodeURIComponent(customerId)}` : ''}`, 'GET'));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open the customer form');
    }
  }, [customerId]);

  useEffect(() => {
    let live = true;
    void (async () => { if (live) await load(); })();
    return () => { live = false; };
  }, [load]);

  return (
    <div className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center bg-[rgba(34,38,59,0.45)] p-3 overflow-y-auto" data-customer-window>
      <div role="dialog" aria-modal="true" aria-label={customerId ? 'Edit Customer' : 'New Customer'} className="w-full max-w-[920px] my-auto">
        {data ? (
          <CustomerForm data={data} onSaved={onSaved} onCancel={onClose} onLayoutChanged={() => void load()} />
        ) : (
          <div className="bg-white rounded-[8px] shadow-[0_12px_40px_rgba(34,38,59,0.25)] px-6 py-10 text-center text-[13px] text-[#22263b]">
            {error ? (
              <>
                <p role="alert" className="text-[#d9232b]">{error}</p>
                <div className="mt-4"><Button onClick={onClose}>Close</Button></div>
              </>
            ) : (
              <p className="inline-flex items-center gap-2 text-[#6d7189]"><Spinner /> Opening the customer form…</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
