'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { LayoutField, LayoutSection } from '@/lib/records/types';
import { Badge, CellField, projectStatusTone, ReadValue, useProject } from './common';

const isLink = (v: unknown): v is string => typeof v === 'string' && /^https?:\/\//i.test(v);

// What a field shows when the Edit button is off: the value as text. The Site Location is the link to the map when a Site Location Link is saved.
function Shown({ field }: { field: LayoutField }) {
  const { detail } = useProject();
  const value = detail.values[field.key];
  switch (field.key) {
    case 'projectCode':
      return <span className="font-semibold text-[#111]">{detail.code}</span>;
    case 'dealId':
      return (
        <span>
          <Link href={`/deals?filter=converted&q=${encodeURIComponent(detail.dealNumber)}`} className="font-medium text-[#1a56c4] hover:underline">{detail.dealNumber}</Link>
          {detail.dealName && <span className="text-gray-500"> · {detail.dealName}</span>}
        </span>
      );
    case 'siteLocation': {
      const link = detail.values.siteLocationLink;
      const name = typeof value === 'string' ? value : '';
      if (!name && !isLink(link)) return <ReadValue field={field} value={value} />;
      return isLink(link)
        ? <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[#1a56c4] hover:underline">{name || 'Open location'}<ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden /></a>
        : <span>{name}</span>;
    }
    case 'status': {
      const option = field.options.find(o => o.id === value);
      return option ? <Badge tone={projectStatusTone(option.id)}>{option.label}</Badge> : <ReadValue field={field} value={value} />;
    }
    case 'progress': {
      if (typeof value !== 'number') return <ReadValue field={field} value={value} />;
      return (
        <span className="inline-flex items-center gap-2.5">
          <span>{value}%</span>
          <span className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-200" aria-hidden><span className="block h-full bg-[#3f7d20]" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></span>
        </span>
      );
    }
    default:
      return <ReadValue field={field} value={value} />;
  }
}

// A form section of the project: Project Information, and any section a Super Admin added in Edit Page Layout. It reads like a card of facts; the Edit
// button of the page turns it into inputs, and every field then saves when it is left or changed. The Project Code and the Deal Number are shown, not typed.
export default function FormSection({ section }: { section: LayoutSection }) {
  const { detail, layout, canEdit, editing, save } = useProject();
  const all = layout.fields.filter(f => f.section === section.id && f.enabled && f.type !== 'CALC');
  const edit = canEdit && editing;
  // as text, the Site Location Link is the link of the Site Location, not a line of its own
  const fields = edit ? all : all.filter(f => !(f.key === 'siteLocationLink' && all.some(x => x.key === 'siteLocation')));

  return (
    <section id={`sec-${section.id}`} aria-labelledby={`sec-title-${section.id}`} className="mt-7 first:mt-0 scroll-mt-4 rounded-xl border border-gray-200 bg-white px-5 py-5 sm:px-7">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 id={`sec-title-${section.id}`} className="text-[18px] font-bold text-[#1f2933] leading-tight">{section.label}</h2>
        {edit && <span className="text-[12px] text-gray-500">Each field is saved when you leave it. Click Done when you have finished.</span>}
      </div>
      {fields.length === 0 ? (
        <p className="text-[13px] text-gray-500">No fields in this section.</p>
      ) : edit ? (
        <div className="md:columns-2 md:gap-x-14">
          {fields.map(f => (
            <div key={f.key} className="mb-4 min-w-0 break-inside-avoid">
              <label htmlFor={`form-${f.key}`} className="mb-1 block text-[12px] font-semibold text-[#555]">{f.label}</label>
              {f.key === 'projectCode' ? (
                <div id={`form-${f.key}`} className="flex h-[38px] items-center rounded border border-gray-200 bg-gray-50 px-3 text-[14px] font-bold text-[#111]">{detail.code}</div>
              ) : f.key === 'dealId' ? (
                <div id={`form-${f.key}`} className="flex h-[38px] items-center gap-2 rounded border border-gray-200 bg-gray-50 px-3 text-[14px] text-gray-800">
                  <Link href={`/deals?filter=converted&q=${encodeURIComponent(detail.dealNumber)}`} className="font-semibold text-[#1a56c4] hover:underline">{detail.dealNumber}</Link>
                  {detail.dealName && <span className="truncate text-gray-500">· {detail.dealName}</span>}
                </div>
              ) : f.readOnly ? (
                <div className="flex min-h-[38px] items-center text-[14px] text-gray-900"><ReadValue field={f} value={detail.values[f.key]} /></div>
              ) : (
                <CellField field={f} value={detail.values[f.key]} htmlId={`form-${f.key}`} compact={false} onSave={payload => save('', { [f.key]: payload })} />
              )}
            </div>
          ))}
        </div>
      ) : (
        <dl className="md:columns-2 md:gap-x-14">
          {fields.map(f => (
            <div key={f.key} className="flex min-w-0 break-inside-avoid gap-4 py-[7px] text-[14px]">
              <dt className="w-[150px] shrink-0 text-gray-500">{f.label}</dt>
              <dd className="min-w-0 flex-1 break-words text-[#1f2933]"><Shown field={f} /></dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
