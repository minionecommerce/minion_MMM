'use client';

import type { LayoutSection } from '@/lib/records/types';
import { buildColumns, moneyCell, RowField, Section, SectionTable, TotalsFooter, rupees, useProject } from './common';

const sum = (xs: unknown[]) => Math.round(xs.reduce<number>((total, x) => total + (typeof x === 'number' ? x : 0), 0) * 100) / 100;

// WORK COVERAGE: one row for each template used in Vendor Selection (never the same one twice).
//   Item Value = the items that have the template · Amount Spent = the Site Expenses with that Work Type · Profit Earned = Item Value - Amount Spent
export default function WorkCoverageSection({ section }: { section: LayoutSection }) {
  const { detail, layout } = useProject();
  const columns = buildColumns(layout, section.id);
  const rows = detail.workCoverage;

  return (
    <Section id={section.id} title={section.label}>
      <SectionTable
        columns={columns}
        rows={rows}
        empty="Choose a Template for the items in Vendor Selection and the templates appear here."
        cell={(f, row, i) => {
          switch (f.key) {
            case 'wcNo': return <span className="block text-center">{i + 1}</span>;
            case 'wcTemplate': return <span className="font-medium">{String(row.calc.wcTemplate)}</span>;
            case 'wcItemValue': return <span className="block text-right">{moneyCell(row.calc.wcItemValue)}</span>;
            case 'wcAmountSpent': return <span className="block text-right">{moneyCell(row.calc.wcAmountSpent)}</span>;
            case 'wcProfit': return <span className="block text-right">{moneyCell(row.calc.wcProfit, (row.calc.wcProfit as number) < 0 ? 'text-[#d9232b]' : '')}</span>;
            default: return <div className={f.type === 'CHECKBOX' ? 'flex justify-center' : ''}><RowField field={f} row={row} path={`/work-coverage/${row.id}`} /></div>;
          }
        }}
        footer={rows.length > 0 && (
          <TotalsFooter
            columns={columns}
            label="Total"
            totals={{
              wcItemValue: rupees(sum(rows.map(r => r.calc.wcItemValue))),
              wcAmountSpent: rupees(sum(rows.map(r => r.calc.wcAmountSpent))),
              wcProfit: rupees(sum(rows.map(r => r.calc.wcProfit))),
            }}
          />
        )}
      />
    </Section>
  );
}
