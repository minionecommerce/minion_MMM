'use client';

import Link from 'next/link';
import { FileText, Plus } from 'lucide-react';
import type { FileDto, LayoutSection } from '@/lib/records/types';
import type { ProjectRow } from '@/lib/projects/types';
import { buildColumns, moneyCell, primaryButton, Section, SectionTable, TotalFooter, rupees, useProject } from './common';

function Files({ files }: { files: FileDto[] }) {
  if (!files.length) return <span className="text-gray-300">—</span>;
  return (
    <span className="flex flex-wrap justify-center gap-1.5">
      {files.map(f => f.url
        ? <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" title={f.fileName} aria-label={f.fileName} className="text-[#1a56c4] hover:text-[#0b3d91]"><FileText className="h-5 w-5" aria-hidden /></a>
        : <span key={f.id} title={f.fileName} className="text-gray-500"><FileText className="h-5 w-5" aria-hidden /></span>)}
    </span>
  );
}

const text = (v: unknown) => (typeof v === 'string' && v ? <span className="break-words whitespace-pre-wrap">{v}</span> : <span className="text-gray-300">—</span>);

// The rows of Payment Collection and Site Expenses are Payment Collection Records / Pre-Payment Records of the deal: the same records as on their
// own pages, with the same numbers. A rejected or cancelled one stays in the list (struck through) but is not counted.
function RecordsTable({ section, rows, total, totalLabel, keys, createHref, createLabel, canCreate, empty }: {
  section: LayoutSection;
  rows: ProjectRow[];
  total: number;
  totalLabel: string;
  keys: { no: string; code: string; amount: string; attachment: string }; // the keys of the section's own columns
  createHref: string;
  createLabel: string;
  canCreate: boolean;
  empty: string;
}) {
  const { layout } = useProject();
  const columns = buildColumns(layout, section.id);
  return (
    <Section
      id={section.id}
      title={section.label}
      actions={canCreate && <Link href={createHref} className={primaryButton}><Plus className="w-4 h-4" />{createLabel}</Link>}
    >
      <SectionTable
        columns={columns}
        rows={rows}
        empty={empty}
        rowClass={row => (row.meta.counted ? '' : 'text-gray-400 line-through')}
        cell={(f, row, i) => {
          if (f.key === keys.no) return <span className="block text-center">{i + 1}</span>;
          if (f.key === keys.code) return <Link href={String(row.meta.href)} className="text-[#1a56c4] hover:underline whitespace-nowrap">{String(row.calc[f.key])}</Link>;
          if (f.key === keys.amount) return <span className="block text-right">{moneyCell(row.calc[f.key])}{!row.meta.counted && <span className="block text-[10px] text-gray-400 no-underline">not counted</span>}</span>;
          if (f.key === keys.attachment) return <Files files={(row.calc[f.key] as FileDto[]) ?? []} />;
          if (f.key.endsWith('Date')) return <span className="whitespace-nowrap">{text(row.calc[f.key])}</span>;
          return text(row.calc[f.key]);
        }}
        footer={rows.length > 0 && <TotalFooter columns={columns} totalKey={keys.amount} label={totalLabel} value={rupees(total)} />}
      />
    </Section>
  );
}

// PAYMENT COLLECTION: the PCRs of the deal. Create PCR opens the Payment Collection form with the deal already chosen (it cannot be changed there).
// Their total is the Collected Amount; Project Value - Collected Amount is the Balance Amount.
export function PaymentsSection({ section }: { section: LayoutSection }) {
  const { detail } = useProject();
  if (!detail.payments) return null;
  return (
    <RecordsTable
      section={section}
      rows={detail.payments.rows}
      total={detail.payments.total}
      totalLabel="Total Collected Amount"
      keys={{ no: 'pcNo', code: 'pcCode', amount: 'pcAmount', attachment: 'pcAttachment' }}
      createHref={`/payment-collections/new?projectId=${detail.id}`}
      createLabel="Create PCR"
      canCreate={detail.abilities.pcrCreate}
      empty="No payment has been collected for this deal yet."
    />
  );
}

// SITE EXPENSES: the PPRs of the deal. Create PPR opens the Pre-Payment form with the deal already chosen. Their total is the Expenses of the project;
// the Work Type of each decides which template's Amount Spent it adds to.
export function ExpensesSection({ section }: { section: LayoutSection }) {
  const { detail } = useProject();
  if (!detail.expenses) return null;
  return (
    <RecordsTable
      section={section}
      rows={detail.expenses.rows}
      total={detail.expenses.total}
      totalLabel="Total Expenses"
      keys={{ no: 'seNo', code: 'seCode', amount: 'seAmount', attachment: 'seAttachment' }}
      createHref={`/pre-payments/new?projectId=${detail.id}`}
      createLabel="Create PPR"
      canCreate={detail.abilities.pprCreate}
      empty="No pre-payment record has been made for this deal yet."
    />
  );
}
