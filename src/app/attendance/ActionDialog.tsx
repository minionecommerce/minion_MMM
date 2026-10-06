'use client';

import { useId, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { MAX_PURPOSE_TEXT, type AttendanceAction, type Purpose, type SiteVisitCodeOption } from '@/lib/attendance/types';
import { ACTION_META, NEEDS_PURPOSE } from './meta';
import { Modal, SelectBox } from './ui';

// The confirmation popup of every action. Office Out and Site In also ask where (a Site Visit Code, or Other with a few words).
export default function ActionDialog({
  action,
  codes,
  busy,
  error,
  onCancel,
  onSubmit,
}: {
  action: AttendanceAction;
  codes: SiteVisitCodeOption[];
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (purpose?: Purpose) => void;
}) {
  const meta = ACTION_META[action];
  const asksWhere = NEEDS_PURPOSE.includes(action);
  const titleId = useId();
  const [kind, setKind] = useState<'CODE' | 'OTHER'>(codes.length ? 'CODE' : 'OTHER');
  const [code, setCode] = useState(codes[0]?.code ?? '');
  const [text, setText] = useState('');
  const [missing, setMissing] = useState(false);

  function save() {
    if (!asksWhere) return onSubmit();
    if (kind === 'CODE') return onSubmit({ kind: 'CODE', code });
    const typed = text.trim();
    if (!typed) return setMissing(true);
    onSubmit({ kind: 'OTHER', text: typed });
  }

  const choice = (value: 'CODE' | 'OTHER', label: string) => (
    <label
      className={`flex h-11 cursor-pointer items-center gap-2.5 rounded-lg border px-3 text-[14px] ${
        kind === value ? 'border-[#2563EB] bg-[#EFF6FF] text-[#111827]' : 'border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F9FAFB]'
      }`}
    >
      <input type="radio" name={`${titleId}-kind`} checked={kind === value} onChange={() => setKind(value)} className="h-4 w-4 accent-[#2563EB]" />
      {label}
    </label>
  );

  return (
    <Modal title={meta.title} titleId={titleId} onClose={onCancel} busy={busy}>
      <form
        onSubmit={e => {
          e.preventDefault();
          save();
        }}
        className="px-6 pb-6 pt-4"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className={`grid h-14 w-14 place-items-center rounded-full ${meta.soft}`}>
            <meta.Icon className={`h-6 w-6 ${meta.strong}`} aria-hidden />
          </span>
          <p className="max-w-[300px] text-[14px] font-medium leading-snug text-[#111827]">{meta.ask}</p>
        </div>

        {asksWhere && (
          <div className="mt-5 space-y-4">
            <fieldset>
              <legend className="mb-2 text-[13px] font-medium text-[#111827]">Select Option</legend>
              <div className="grid grid-cols-2 gap-3">
                {choice('CODE', 'Site Visit Code')}
                {choice('OTHER', 'Other')}
              </div>
            </fieldset>

            {kind === 'CODE' ? (
              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#111827]">Site Visit Code</label>
                <SelectBox value={code} onChange={setCode} label="Site Visit Code">
                  {codes.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </SelectBox>
              </div>
            ) : (
              <div>
                <label htmlFor={`${titleId}-other`} className="mb-2 block text-[13px] font-medium text-[#111827]">Purpose / Location</label>
                <input
                  id={`${titleId}-other`}
                  value={text}
                  maxLength={MAX_PURPOSE_TEXT}
                  onChange={e => {
                    setText(e.target.value);
                    setMissing(false);
                  }}
                  placeholder="e.g. Client Meeting"
                  aria-invalid={missing}
                  className={`h-10 w-full rounded-lg border bg-white px-3 text-[13px] text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:ring-2 ${
                    missing ? 'border-[#DC2626] focus:ring-[#DC2626]/20' : 'border-[#D1D5DB] focus:border-[#2563EB] focus:ring-[#2563EB]/20'
                  }`}
                />
                {missing && <p className="mt-1.5 text-[12px] text-[#DC2626]">Enter the purpose or location.</p>}
              </div>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-[#FEF2F2] px-3 py-2 text-[13px] text-[#B91C1C]">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={busy} className="h-10 rounded-lg bg-[#F3F4F6] px-5 text-[14px] font-semibold text-[#374151] hover:bg-[#E5E7EB] disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="flex h-10 min-w-[88px] items-center justify-center gap-2 rounded-lg bg-[#FACC15] px-5 text-[14px] font-semibold text-[#111827] hover:bg-[#EAB308] disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {asksWhere ? 'Save' : 'Confirm'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
