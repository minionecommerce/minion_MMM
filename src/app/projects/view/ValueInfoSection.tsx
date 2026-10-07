'use client';

import Link from 'next/link';
import { Info } from 'lucide-react';
import type { LayoutSection } from '@/lib/records/types';
import { buildColumns, moneyCell, RowField, Section, SectionTable, TotalsFooter, rupees, useProject } from './common';

const sum = (xs: unknown[]) => Math.round(xs.reduce<number>((total, x) => total + (typeof x === 'number' ? x : 0), 0) * 100) / 100;

// PROJECT VALUE INFORMATION: every accepted quote of the deal, found by itself. Exclusions are typed per quote; Total Quote Value = Quote Value - Exclusions.
// The sum of the totals is the Project Value.
export default function ValueInfoSection({ section }: { section: LayoutSection }) {
  const { detail, layout } = useProject();
  const columns = buildColumns(layout, section.id);
  const rows = detail.valueInfo.rows;

  return (
    <Section id={section.id} title={section.label}>
      <SectionTable
        columns={columns}
        rows={rows}
        empty="No accepted quote yet. Mark a quote of this deal as Accepted and it appears here."
        cell={(f, row, i) => {
          switch (f.key) {
            case 'viNo': return <span className="block text-center">{i + 1}</span>;
            case 'viQuoteNo': return <Link href={String(row.meta.href)} className="text-[#1a56c4] hover:underline whitespace-nowrap">{String(row.calc.viQuoteNo)}</Link>;
            case 'viQuoteDate': return <span className="whitespace-nowrap">{String(row.calc.viQuoteDate)}</span>;
            case 'viReference': return <span className="break-words">{String(row.calc.viReference) || <span className="text-gray-300">—</span>}</span>;
            case 'viQuoteValue': return <span className="block text-right">{moneyCell(row.calc.viQuoteValue)}</span>;
            case 'viTotal': return <span className="block text-right">{moneyCell(row.calc.viTotal)}</span>;
            default: return <RowField field={f} row={row} path={`/quote-lines/${row.id}`} />;
          }
        }}
        footer={rows.length > 0 && (
          <TotalsFooter
            columns={columns}
            label="Total Quote Value"
            totals={{
              viQuoteValue: rupees(sum(rows.map(r => r.calc.viQuoteValue))),
              quoteExclusion: rupees(sum(rows.map(r => r.values.quoteExclusion))),
              viTotal: rupees(detail.valueInfo.total),
            }}
          />
        )}
      />
      <div className="mt-4 flex items-start gap-3 rounded-lg bg-[#eaf3ff] px-4 py-3 text-[13px] text-[#1e3a8a]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2563eb]" aria-hidden />
        <p>Only accepted quotes are listed here. The total quote value is used as the Project Value.</p>
      </div>
    </Section>
  );
}
