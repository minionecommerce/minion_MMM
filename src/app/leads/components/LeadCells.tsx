'use client';

import { useState } from 'react';
import { Calendar, ChevronUp, Clock, List, MapPin, Pencil, Phone, Tag, User } from 'lucide-react';
import { isHttpUrl, formatRupees } from '@/lib/leads/format';
import type { LeadRow } from '@/lib/leads/queries';
import { callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';

const label = 'text-[10px] font-semibold uppercase tracking-wide text-gray-500';
const box = 'w-full border border-gray-300 rounded px-2 py-0.5 text-[12px] text-gray-800 bg-white min-h-[26px] flex items-center';

export function LeadIdCell({ row }: { row: LeadRow }) {
  const badge = row.productOrServiceLabel ? row.productOrServiceLabel.trim()[0].toUpperCase() : '•';
  return (
    <div className="flex items-start gap-2.5">
      <span title={row.productOrServiceLabel ?? 'Product or Service not set'} className="w-6 h-6 rounded-full bg-[#f5b800] text-white text-[12px] font-bold flex items-center justify-center shrink-0">{badge}</span>
      <div className="space-y-0.5">
        <div className="text-[#d9232b] font-semibold text-[13px]">{row.code}</div>
        <div className="flex items-center gap-1.5 text-[12px] text-gray-600"><Calendar className="w-3.5 h-3.5 text-gray-500" fill="currentColor" />{row.date}</div>
        <div className="flex items-center gap-1.5 text-[12px] text-gray-600"><Clock className="w-3.5 h-3.5 text-gray-500" fill="currentColor" stroke="white" />{row.time}</div>
      </div>
    </div>
  );
}

export function CustomerDetailsCell({ row }: { row: LeadRow }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5 font-semibold text-[13px] text-[#333]"><User className="w-3.5 h-3.5 text-[#d9232b] shrink-0" fill="currentColor" />{row.customerName}</div>
      <div className="flex items-center gap-1.5 text-[12px] text-gray-600"><Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />{row.contactNumber || '—'}</div>
      <div className="flex items-center gap-1.5 text-[11px] text-gray-500"><Tag className="w-3 h-3 shrink-0" fill="currentColor" />{row.leadTypeLabel ?? 'Standard'}</div>
    </div>
  );
}

export function RequirementsCell({ row }: { row: LeadRow }) {
  return (
    <div className="space-y-1.5 max-w-[260px]">
      <div className="text-[13px] text-[#333] break-words line-clamp-3" title={row.exactRequirement ?? undefined}>{row.exactRequirement || '—'}</div>
      <div className="bg-gray-100 border border-gray-200 rounded px-2.5 py-1 text-[12px] text-gray-700">
        Amount: <span className="text-[#16a34a] font-bold ml-1">{formatRupees(row.amount)}</span>
      </div>
    </div>
  );
}

export function StaffAssignmentCell({ row }: { row: LeadRow }) {
  return (
    <div className="space-y-1.5">
      <div title="Task Assigned Person" className="flex items-center gap-1.5 text-[13px] font-semibold text-[#333]">
        <User className="w-3.5 h-3.5 text-[#d9232b] shrink-0" fill="currentColor" /><span className="sr-only">Task Assigned Person: </span>{row.taskPerson?.name ?? '—'}
      </div>
      <div title="Lead Person" className="flex items-center gap-1.5 text-[12px] text-gray-600">
        <List className="w-3.5 h-3.5 shrink-0" /><span className="sr-only">Lead Person: </span>{row.leadPerson?.name ?? '—'}
      </div>
    </div>
  );
}

// Lead Status box + inline notes ("Click to add notes")
export function LeadStatusCell({ row, canEdit }: { row: LeadRow; canEdit: boolean }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(row.notes ?? '');
  const [saved, setSaved] = useState<string | null>(row.notes);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await callApi(`/api/leads/${row.id}/notes`, 'PATCH', { notes: value.trim() || null });
      setSaved(value.trim() || null);
      setEditing(false);
      toast.success('Notes saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save notes');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-1 w-full max-w-[230px]">
      <div className={box} title="Lead Status">{row.leadStatus?.label ?? '—'}</div>
      {editing ? (
        <div className="bg-gray-100 rounded p-2 space-y-2">
          <textarea autoFocus rows={3} maxLength={5000} value={value} onChange={e => setValue(e.target.value)} aria-label="Lead notes" className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px] focus:outline-none focus:border-[#f5b800]" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setValue(saved ?? ''); setEditing(false); }} className="px-2.5 py-1 text-[11px] rounded bg-gray-300 text-gray-800">Cancel</button>
            <button onClick={save} disabled={busy} className="px-2.5 py-1 text-[11px] rounded bg-black text-white disabled:opacity-60">{busy ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => setEditing(true)}
          className={`w-full bg-gray-100 rounded px-2.5 py-1.5 text-left text-[12px] flex items-start justify-between gap-2 ${canEdit ? 'hover:bg-gray-200 cursor-pointer' : 'cursor-default'}`}
        >
          <span className={`whitespace-pre-line break-words ${saved ? 'text-gray-700' : 'text-gray-500'}`}>{saved ?? 'Click to add notes'}</span>
          {canEdit && <Pencil className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />}
        </button>
      )}
    </div>
  );
}

// Follow-up column: the green arrow opens "Upload Follow-up Proof"; the number is how many follow-ups were done
export function FollowUpCell({ row, canEdit, onUpload }: { row: LeadRow; canEdit: boolean; onUpload: () => void }) {
  const when = (v: { date: string; time: string } | null) => (v ? <span className="text-gray-600">{v.date}<br />{v.time}</span> : <span className="text-gray-500">N/A</span>);
  return (
    <div className="flex flex-col items-center gap-1 text-[11px] text-gray-600 w-[120px]">
      <button type="button" onClick={onUpload} disabled={!canEdit} title={canEdit ? 'Upload follow-up proof' : 'You cannot add follow-ups'} aria-label={`Upload follow-up proof for ${row.code}`}
        className={`w-5 h-5 rounded-sm bg-[#16a34a] flex items-center justify-center ${canEdit ? 'hover:bg-[#15803d] cursor-pointer' : 'opacity-60 cursor-default'}`}>
        <ChevronUp className="w-4 h-4 text-white" strokeWidth={3} />
      </button>
      <span className="flex items-center gap-1 text-[#d9232b] font-semibold" title="Follow-ups done"><Phone className="w-3.5 h-3.5" fill="currentColor" />{row.followUpCount}</span>
      <div className="space-y-0.5 text-left">
        <div className="flex gap-1"><span className="text-[#d9232b]">●</span><span>Last: {when(row.lastFollowUp)}</span></div>
        <div className="flex gap-1"><span className="text-[#16a34a]">●</span><span>Next: {when(row.nextFollowUp)}</span></div>
      </div>
    </div>
  );
}

// Static for now: status workflow comes later. RATE is the real Conventional Rate.
export function StatusCell({ rate }: { rate: number | null }) {
  const pct = Math.max(0, Math.min(100, rate ?? 0));
  return (
    <div className="w-[150px] space-y-1">
      <div><div className={label}>Status:</div><div className="text-[15px] text-[#333] leading-tight">Open</div></div>
      <div>
        <div className={label}>Rate:</div>
        <div className="h-2 rounded bg-gray-200 overflow-hidden mt-1" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-[#f5b800]" style={{ width: `${pct}%` }} /></div>
        <div className={`${box} mt-1 py-0`}>{pct}%</div>
      </div>
    </div>
  );
}

export function SourceCell({ row }: { row: LeadRow }) {
  return (
    <div className="space-y-1 text-[12px]">
      <div className="text-gray-700">{row.sourceLabel ?? '—'}</div>
      {row.modeOfCustomerLabel && <div className="text-gray-500" title="Mode of Customer">({row.modeOfCustomerLabel})</div>}
    </div>
  );
}

export function CategoryCell({ row }: { row: LeadRow }) {
  return (
    <div className="space-y-0.5 max-w-[220px]">
      <div className="text-[13px] text-[#d9232b]">{row.mainCategoryLabel ?? '—'}</div>
      <div className="text-[13px] font-semibold text-[#333]">{row.categoryLabel}</div>
      <div className="text-[12px] italic text-gray-500">{row.subcategoryLabel}</div>
    </div>
  );
}

export function LocationCell({ row }: { row: LeadRow }) {
  const link = row.locationLink && isHttpUrl(row.locationLink) ? row.locationLink : null;
  return (
    <div className="space-y-0.5 w-full max-w-[220px]">
      <div className={label}>Location:</div>
      <div className="flex items-center gap-1.5">
        <div className={box}>{row.location ?? 'N/A'}</div>
        {link && <a href={link} target="_blank" rel="noopener noreferrer" title="Open location link" className="text-[#2f80ed] shrink-0"><MapPin className="w-4 h-4" /></a>}
      </div>
      <div className={label}>Exact:</div>
      <div className={box}>{row.exactLocation || 'N/A'}</div>
    </div>
  );
}
