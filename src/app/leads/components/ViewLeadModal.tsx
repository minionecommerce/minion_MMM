'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, FileText, Loader2, X, XCircle } from 'lucide-react';
import { formatRupees, isHttpUrl } from '@/lib/leads/format';
import type { LeadRow } from '@/lib/leads/queries';
import { callApi } from '@/lib/leads/client';
import type { ExistingFile } from './FileUpload';
import type { LeadFormOptions } from '@/lib/leads/constants';
import { displayCustomValue } from '@/lib/leads/layout-shared';
import ConvertIcon from './ConvertIcon';

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</dt><dd className="text-[14px] text-gray-900 mt-0.5 break-words whitespace-pre-line">{children || '—'}</dd></div>;
}

// endpoint: where the details come from. The Deals page opens a deal's original lead through /api/deals/:id (it needs deals.view, not leads.view).
// title: what the heading says until the details arrive (the Deals page passes "Deal DL1").
export default function ViewLeadModal({ leadId, endpoint, title, options, onClose }: { leadId: string; endpoint?: string; title?: string; options: Pick<LeadFormOptions, 'fields' | 'customOptions'>; onClose: () => void }) {
  type FollowUpItem = { id: string; notes: string; doneOn: string; next: string | null; files: ExistingFile[] };
  type ClosureItem = { reason: string; closedOn: string; closedBy: string | null; files: ExistingFile[] };
  type DealItem = { id: string; number: string; name: string; value: number; validity: string | null; createdOn: string; status: string | null };
  type Detail = { lead: LeadRow; deal: DealItem | null; closure: ClosureItem | null; attachments: ExistingFile[]; followUps: FollowUpItem[] };
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    callApi<Detail>(endpoint ?? `/api/leads/${leadId}`, 'GET').then(d => live && setData(d)).catch(e => live && setError(e.message));
    return () => { live = false; };
  }, [leadId, endpoint]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);

  const l = data?.lead;
  const deal = data?.deal ?? null;
  // Labels are editable in Edit Page Layout, so the panel uses the same names as the form
  const name = (key: string, fallback: string) => options.fields.find(f => f.key === key)?.label ?? fallback;
  const customFields = options.fields.filter(f => !f.isSystem);
  const link = l?.locationLink && isHttpUrl(l.locationLink) ? l.locationLink : null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div role="dialog" aria-modal="true" aria-label="Lead details" className="bg-white w-full sm:max-w-[760px] max-h-screen sm:max-h-[92vh] sm:rounded-lg shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-[19px] font-bold text-[#444]">{deal ? `Deal ${deal.number}` : l ? `Lead ${l.code}` : title ?? 'Lead'}</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-500 hover:text-black"><X className="w-6 h-6" /></button>
        </div>
        <div className="overflow-y-auto px-6 py-5">
          {!data && !error && <div className="py-12 flex justify-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin" /></div>}
          {error && <p role="alert" className="text-[#d9232b] text-[14px]">{error}</p>}
          {l && (
            <div className="space-y-6">
              {deal && (
                <section aria-label="Deal details" className="rounded-md border border-[#16a34a]/30 bg-[#f0fdf4] px-4 py-3">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-[#15803d]"><ConvertIcon className="w-4 h-4" />Converted from lead {l.code} on {deal.createdOn}</div>
                  <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <Item label="Deal Number">{deal.number}</Item>
                    <Item label="Lead Number">{l.code}</Item>
                    <Item label="Deal Name">{deal.name}</Item>
                    <Item label="Amount (Deal Value)">{formatRupees(deal.value)}</Item>
                    <Item label="Deal Validity">{deal.validity}</Item>
                    <Item label="Deal Status">{deal.status}</Item>
                  </dl>
                </section>
              )}
              {deal && <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Original lead</div>}
              {data!.closure && (
                <section aria-label="Why this lead was closed" className="rounded-md border border-[#dc3545]/30 bg-[#fdf2f3] px-4 py-3">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-[#b02a37]"><XCircle className="w-4 h-4 shrink-0" fill="currentColor" stroke="white" aria-hidden="true" />Closed {data!.closure.closedOn}{data!.closure.closedBy ? ` by ${data!.closure.closedBy}` : ''}</div>
                  <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Reason for closing</div>
                  <p className="text-[14px] text-gray-900 mt-0.5 whitespace-pre-line break-words">{data!.closure.reason}</p>
                  {data!.closure.files.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {data!.closure.files.map(a => (
                        <li key={a.id}>{a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] text-[#2f80ed] hover:underline"><FileText className="w-3.5 h-3.5" />{a.fileName}</a> : <span className="text-[12px] text-gray-500">{a.fileName}</span>}</li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <Item label="Created">{`${l.date}  ${l.time}`}</Item>
                <Item label={name('leadStatusId', 'Lead Status')}>{l.leadStatus?.label}</Item>
                <Item label={name('customerName', 'Customer Name')}>{l.customerName}</Item>
                <Item label={name('contactNumber', 'Contact Number')}>{l.contactNumber}</Item>
                <Item label={name('taskAssignedPersonId', 'Task Assigned Person')}>{l.taskPerson ? `${l.taskPerson.name}${l.taskPerson.designation ? ` (${l.taskPerson.designation})` : ''}` : null}</Item>
                <Item label={name('leadPersonId', 'Lead Person')}>{l.leadPerson?.name}</Item>
                <Item label={name('productOrServiceId', 'Product or Service')}>{l.productOrServiceLabel}</Item>
                <Item label={name('modeOfCustomerId', 'Mode of Customer')}>{l.modeOfCustomerLabel}</Item>
                <Item label={name('sourceId', 'Source')}>{l.sourceLabel}</Item>
                <div className="sm:col-span-2"><Item label={name('exactRequirement', 'Exact Requirement')}>{l.exactRequirement}</Item></div>
                <Item label={name('mainCategoryId', 'Main Category')}>{l.mainCategoryLabel}</Item>
                <Item label={name('subcategoryId', 'Subcategory')}>{l.subcategoryLabel}</Item>
                <Item label={name('leadTypeId', 'Type Of Lead')}>{l.leadTypeLabel}</Item>
                <Item label={name('location', 'Location')}>{l.location}</Item>
                <Item label={name('exactLocation', 'Exact Location')}>{l.exactLocation}</Item>
                <Item label={name('locationLink', 'Location Link')}>{link ? <a href={link} target="_blank" rel="noopener noreferrer" className="text-[#2f80ed] inline-flex items-center gap-1 break-all">{link}<ExternalLink className="w-3.5 h-3.5 shrink-0" /></a> : null}</Item>
                <Item label={deal ? `${name('amount', 'Amount')} (at lead stage)` : name('amount', 'Amount')}>{formatRupees(l.amount)}</Item>
                <Item label={name('conventionalRate', 'Conventional Rate')}>{`${l.conventionalRate ?? 0}%`}</Item>
                <Item label={name('dailyTask', 'Daily Task Settings')}>{l.dailyTask ? 'Yes' : 'No'}</Item>
                <div className="sm:col-span-2"><Item label={name('notes', 'Notes')}>{l.notes}</Item></div>
                {customFields.map(f => (
                  <div key={f.key} className={f.type === 'TEXTAREA' ? 'sm:col-span-2' : ''}>
                    <Item label={f.label}>{displayCustomValue(f, l.customFields?.[f.key], id => (options.customOptions[f.key] ?? []).find(o => o.id === id)?.label)}</Item>
                  </div>
                ))}
              </dl>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">Files ({data!.attachments.length})</div>
                {data!.attachments.length === 0 ? <p className="text-[13px] text-gray-500">No files attached.</p> : (
                  <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {data!.attachments.map(f => (
                      <li key={f.id} className="border border-gray-200 rounded-md overflow-hidden">
                        {f.url ? (
                          <a href={f.url} target="_blank" rel="noopener noreferrer" className="block">
                            {f.mimeType.startsWith('image/') ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={f.thumbUrl || f.url} alt={f.fileName} width={f.width ?? undefined} height={f.height ?? undefined} loading="lazy" decoding="async" className="w-full h-28 object-cover" />
                            ) : <div className="h-28 flex items-center justify-center bg-gray-50"><FileText className="w-10 h-10 text-gray-400" /></div>}
                            <div className="px-2 py-1.5 text-[12px] text-gray-700 truncate">{f.fileName}</div>
                          </a>
                        ) : <div className="px-2 py-3 text-[12px] text-gray-500">{f.fileName} (link unavailable)</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">Follow-ups ({data!.followUps.length})</div>
                {data!.followUps.length === 0 ? <p className="text-[13px] text-gray-500">No follow-ups yet.</p> : (
                  <ul className="space-y-3">
                    {data!.followUps.map(f => (
                      <li key={f.id} className="border border-gray-200 rounded-md px-3 py-2.5">
                        <div className="text-[12px] text-gray-500">Done {f.doneOn}{f.next ? ` · Next due ${f.next}` : ''}</div>
                        <p className="text-[14px] text-gray-900 mt-1 whitespace-pre-line break-words">{f.notes}</p>
                        {f.files.length > 0 && (
                          <ul className="mt-2 flex flex-wrap gap-2">
                            {f.files.map(a => (
                              <li key={a.id}>{a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] text-[#2f80ed] hover:underline"><FileText className="w-3.5 h-3.5" />{a.fileName}</a> : <span className="text-[12px] text-gray-500">{a.fileName}</span>}</li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
