'use client';

import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { formatDealStamp } from '@/lib/leads/format';
import { MODULES, NOT_YET_APPROVED } from '@/lib/records/registry';
import { displayValue } from '@/lib/records/values';
import type { Abilities, FileDto, LayoutField, ModuleId, ModuleLayoutDto, RecordDto, RecordRefs } from '@/lib/records/types';
import { LayoutButton } from './layout-editor/LayoutEditor';
import FileField from './components/FileField';
import { TwoColumns } from './components/RecordForm';

const VENDOR_PAGE = { materialVendor: '/material-vendors', serviceVendor: '/service-vendors' } as const;

function Value({ f, raw, refs, slug, approvedAt }: { f: LayoutField; raw: unknown; refs: RecordRefs; slug: string; approvedAt?: string | null }) {
  if (f.type === 'FILE') return <FileField slug={slug} fieldKey={f.key} label={f.label} files={(raw as FileDto[]) ?? []} maxFiles={f.maxFiles} onChange={() => {}} readOnly />;
  const text = displayValue(f, raw, refs);
  if (!text) return <span className="text-gray-300">—</span>;
  if (f.type === 'APPROVER' && text === NOT_YET_APPROVED) return <span className="text-gray-400 italic">{text}</span>;
  if (f.type === 'APPROVER' && approvedAt) return <span>{text}<span className="ml-2 text-[12px] text-gray-500">on {formatDealStamp(new Date(approvedAt))}</span></span>;
  if (f.type === 'LOOKUP' && f.lookup) {
    const id = String(raw);
    const href = f.lookup === 'deal' ? `/deals?q=${encodeURIComponent(refs.deals[id]?.code ?? '')}` : `${VENDOR_PAGE[f.lookup]}/${id}`;
    return <Link href={href} className="text-[#1a56c4] hover:underline break-words">{text}</Link>;
  }
  if (f.type === 'URL') return <a href={String(raw)} target="_blank" rel="noopener noreferrer" className="text-[#1a56c4] hover:underline break-all">{text}</a>;
  if (f.type === 'EMAIL') return <a href={`mailto:${String(raw)}`} className="text-[#1a56c4] hover:underline break-all">{text}</a>;
  if (f.type === 'PHONE') return <a href={`tel:${String(raw)}`} className="text-[#1a56c4] hover:underline">{text}</a>;
  return <span className="whitespace-pre-wrap break-words">{text}</span>;
}

// The page of one record: the fields and tables of the module's layout, read-only
export default function RecordView({ moduleId, layout, record, refs, abilities }: {
  moduleId: ModuleId;
  layout: ModuleLayoutDto;
  record: RecordDto;
  refs: RecordRefs;
  abilities: Abilities;
}) {
  const def = MODULES[moduleId];
  const kinds = new Map(layout.sections.map(s => [s.id, s.kind]));
  const nameField = layout.fields.find(f => f.key === def.nameKey && f.key !== 'code');
  const name = nameField ? displayValue(nameField, record.values[nameField.key], refs) : '';

  return (
    <div data-light-native className="min-h-screen bg-white text-[#333]">
      <div className="px-4 sm:px-6 pt-6 pb-4 border-b border-gray-200 flex flex-wrap items-center gap-3">
        <Link href={`/${def.slug}`} aria-label={`Back to ${def.plural}`} className="w-9 h-9 rounded-full border border-gray-300 hover:bg-gray-100 flex items-center justify-center text-gray-700"><ArrowLeft className="w-4 h-4" /></Link>
        <div className="min-w-0">
          <h1 className="text-[22px] sm:text-[26px] font-semibold text-[#222] leading-tight"><span data-record-code>{record.code}</span>{name && <span className="text-gray-500 font-normal"> · {name}</span>}</h1>
          <p className="text-[13px] text-gray-500">{def.label}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {abilities.layout && <LayoutButton moduleId={moduleId} layout={layout} variant="text" />}
          {abilities.edit && (
            <Link href={`/${def.slug}/${record.id}/edit`} className="inline-flex items-center gap-2 px-4 h-[38px] rounded-md bg-[#f5b800] hover:bg-[#e0a800] text-black text-[14px] font-semibold"><Pencil className="w-4 h-4" /> Edit</Link>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 space-y-8 max-w-[1500px] mx-auto">
        {layout.sections.map(section => {
          const fields = layout.fields.filter(f => f.section === section.id && f.enabled);
          if (fields.length === 0) return null;
          if (kinds.get(section.id) === 'TABLE') {
            const rows = record.rows[section.id] ?? [];
            return (
              <section key={section.id}>
                <h2 className="text-[16px] font-bold text-[#222] mb-3">{section.label}</h2>
                <div className="border border-gray-200 rounded-lg overflow-x-auto">
                  <table className="w-full border-collapse" data-table-section={section.id}>
                    <thead className="bg-[#f6f7f9]">
                      <tr>{fields.map(f => <th key={f.key} scope="col" className="px-3 py-2.5 text-left text-[13px] font-semibold text-[#333] border-b border-gray-200 whitespace-nowrap">{f.label}</th>)}</tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 && <tr><td colSpan={fields.length} className="px-3 py-6 text-center text-[13px] text-gray-500">No rows.</td></tr>}
                      {rows.map(r => (
                        <tr key={r.id} className="align-top border-b border-gray-100 last:border-b-0" data-row>
                          {fields.map(f => <td key={f.key} className="px-3 py-2.5 text-[14px] text-gray-800"><Value f={f} raw={r.values[f.key]} refs={refs} slug={def.slug} /></td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          }
          return (
            <section key={section.id}>
              <h2 className="text-[16px] font-bold text-[#222] mb-4">{section.label}</h2>
              <TwoColumns
                items={fields}
                render={f => (
                  <div key={f.key} className="grid grid-cols-1 sm:grid-cols-[170px_minmax(0,1fr)] gap-x-4 gap-y-1 items-start" data-field={f.key}>
                    <div className="sm:text-right text-[14px] text-gray-500 leading-snug">{f.label}</div>
                    <div className="text-[14px] text-gray-900 min-w-0"><Value f={f} raw={record.values[f.key]} refs={refs} slug={def.slug} approvedAt={record.approvedAt} /></div>
                  </div>
                )}
              />
            </section>
          );
        })}
        <p className="text-[12px] text-gray-400">Created {formatDealStamp(new Date(record.createdAt))} · Last changed {formatDealStamp(new Date(record.updatedAt))}</p>
      </div>
    </div>
  );
}
