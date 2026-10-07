'use client';

import { useEffect, useState } from 'react';
import { callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import type { CustomerDto } from '@/lib/quotes/types';
import { Button, Modal, inputClass } from '../quotes/ui';

// The same mobile number or email is never added twice: the customer that has it is shown, and can be used instead. The same name only asks first.
export function DuplicateModal({ dup, busy, onUse, onForce, onClose }: {
  dup: { message: string; hard: boolean; existing: CustomerDto };
  busy: boolean;
  onUse: () => void;
  onForce: () => void;
  onClose: () => void;
}) {
  const c = dup.existing;
  return (
    <Modal title="Customer already exists" onClose={onClose} width={480} busy={busy} footer={(
      <>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        {!dup.hard && <Button onClick={onForce} busy={busy}>Add as a new customer</Button>}
        <Button kind="blue" onClick={onUse}>Use this customer</Button>
      </>
    )}>
      <div role="alert" className="text-[13px]">
        <p>{dup.message}</p>
        <div className="mt-3 rounded-[4px] border border-[#ebeaf2] bg-[#f9f9fb] px-3 py-2">
          <p className="font-semibold text-[#22263b]">{c.name}{c.code ? <span className="ml-2 font-normal text-[#6d7189]">{c.code}</span> : null}</p>
          <p className="text-[#6d7189]">{[c.phone, c.email].filter(Boolean).join(' · ') || 'No phone or email saved'}</p>
        </div>
      </div>
    </Modal>
  );
}

// The gear next to Customer Number: how the numbers look and which one the next customer gets
export function CustomerNumberModal({ canEdit, onClose }: { canEdit: boolean; onClose: () => void }) {
  const toast = useToast();
  const [info, setInfo] = useState<{ prefix: string; digits: number; next: string; highest: number } | null>(null);
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    callApi<{ prefix: string; digits: number; next: string; highest: number }>('/api/customers/numbering', 'GET')
      .then(r => { if (live) { setInfo(r); setNext(String(Number(r.next.slice(r.prefix.length)) || 1)); } })
      .catch(e => { if (live) setError(e instanceof Error ? e.message : 'Could not load the numbering'); });
    return () => { live = false; };
  }, []);

  const preview = info && /^\d+$/.test(next) ? `${info.prefix}${next.padStart(info.digits, '0')}` : '';
  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const r = await callApi<{ next: string }>('/api/customers/numbering', 'PUT', { next: Number(next) });
      toast.success(`The next customer will be ${r.next}`);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Configure Customer Number Preferences" onClose={onClose} busy={busy} width={520} footer={(
      <>
        <Button onClick={onClose} disabled={busy}>{canEdit ? 'Cancel' : 'Close'}</Button>
        {canEdit && <Button kind="blue" onClick={save} busy={busy} disabled={!preview}>Save</Button>}
      </>
    )}>
      <div className="space-y-3 text-[13px]">
        {!canEdit && <p className="rounded-[4px] bg-[#f9f9fb] border border-[#ebeaf2] px-3 py-2 text-[#6d7189]">Only a Super Admin can change the customer number.</p>}
        {error && <p role="alert" className="text-[#d9232b]">{error}</p>}
        {info && (
          <>
            <p className="text-[#6d7189]">Every customer gets a number of its own: <b className="text-[#22263b]">{info.prefix}</b> and {info.digits} digits, like <b className="text-[#22263b]">{info.prefix}{'1'.padStart(info.digits, '0')}</b>. It never changes and is never used twice.</p>
            <div className="rounded-[6px] bg-[#f9f9fb] border border-[#ebeaf2] p-3">
              <label htmlFor="cn-next" className="block mb-1">Next customer number (running number)</label>
              <div className="flex items-center gap-3">
                <input id="cn-next" inputMode="numeric" value={next} onChange={e => { setNext(e.target.value.replace(/\D/g, '').slice(0, 8)); setError(''); }} disabled={!canEdit} className={inputClass(false, 'max-w-[140px]')} />
                <span className="text-[#6d7189]">The next customer will be</span>
                <span className="font-semibold">{preview || '—'}</span>
              </div>
              <p className="mt-1 text-[#6d7189]">It has to be higher than every number already used{info.highest ? ` (the highest is ${info.prefix}${String(info.highest).padStart(info.digits, '0')})` : ''}.</p>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
