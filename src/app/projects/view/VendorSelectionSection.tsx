'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import type { LayoutSection } from '@/lib/records/types';
import type { ProjectRow } from '@/lib/projects/types';
import { buildColumns, errorText, RowField, Section, SectionTable, useProject } from './common';
import VendorPicker from './VendorPicker';

// VENDOR SELECTION: the items of every accepted quote (Quote 1: 1, 2, 3 ... Quote 2: ...). Each item has its own Template and its own vendors; the
// vendors chosen here are the ones the two Involvement tables below are made from.
export default function VendorSelectionSection({ section }: { section: LayoutSection }) {
  const { detail, layout, canEdit, call, fail } = useProject();
  const [picking, setPicking] = useState<ProjectRow | null>(null);
  const columns = buildColumns(layout, section.id);
  const rows = detail.selection.groups.flatMap(g => g.rows);
  const quoteNo = new Map(detail.selection.groups.map((g, i) => [g.quoteId, { n: i + 1, number: g.quoteNumber }]));

  // "Service: 2 selected / Material: 1 selected": the names are in the tooltip and in the window that opens
  const vendors = (row: ProjectRow) => {
    const v = row.calc.vsVendors as { service: string[]; material: string[] };
    const names = [
      v.service.length ? `Service: ${v.service.map(id => detail.refs.serviceVendors[id]?.name ?? id).join(', ')}` : '',
      v.material.length ? `Material: ${v.material.map(id => detail.refs.materialVendors[id]?.name ?? id).join(', ')}` : '',
    ].filter(Boolean).join('\n');
    return (
      <button
        type="button"
        disabled={!canEdit}
        onClick={() => setPicking(row)}
        title={names || undefined}
        aria-label={`Choose vendors for ${String(row.calc.vsItem)}`}
        className={`flex w-full min-w-[200px] items-center justify-between gap-3 rounded px-2 py-1 text-left ${canEdit ? 'hover:bg-gray-50' : ''}`}
      >
        <span className="space-y-0.5">
          {v.service.length > 0 && <span className="block text-[13px] text-[#1a56c4]">Service: {v.service.length} selected</span>}
          {v.material.length > 0 && <span className="block text-[13px] text-[#1a56c4]">Material: {v.material.length} selected</span>}
          {v.service.length + v.material.length === 0 && <span className="text-[13px] text-gray-400">{canEdit ? 'Select vendors' : '—'}</span>}
        </span>
        {canEdit && <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />}
      </button>
    );
  };

  return (
    <Section id={section.id} title={section.label}>
      <SectionTable
        columns={columns}
        rows={rows}
        empty="The items of the accepted quotes of this deal appear here."
        groupHeader={(row, i, all) => {
          const q = quoteNo.get(String(row.meta.quoteId));
          return i === 0 || all[i - 1].meta.quoteId !== row.meta.quoteId
            ? <span>Quote {q?.n} - <Link href={`/quotes/${String(row.meta.quoteId)}`} className="text-[#1a56c4] hover:underline">{q?.number}</Link></span>
            : null;
        }}
        cell={(f, row) => {
          switch (f.key) {
            case 'vsNo': return <span className="block text-center">{String(row.calc.vsNo)}</span>;
            case 'vsItem': return <span className="break-words">{String(row.calc.vsItem)}</span>;
            case 'vsVendors': return vendors(row);
            default: return <RowField field={f} row={row} path={`/items/${row.id}`} />;
          }
        }}
      />
      {picking && (
        <VendorPicker
          itemName={String(picking.calc.vsItem)}
          service={(picking.calc.vsVendors as { service: string[] }).service}
          material={(picking.calc.vsVendors as { material: string[] }).material}
          refs={detail.refs}
          onClose={() => setPicking(null)}
          onSave={async next => {
            try { await call(`/items/${picking.id}`, 'PUT', next); return null; } catch (e) { fail(e); return errorText(e); }
          }}
        />
      )}
    </Section>
  );
}
