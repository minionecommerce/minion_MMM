'use client';

import type { ReactNode } from 'react';
import type { LayoutSection } from '@/lib/records/types';
import { CellField, rupees, Section, useProject } from './common';

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : null);
const chipGreen = 'bg-[#dcfce7] text-[#166534]';
const chipBlue = 'bg-[#dbeafe] text-[#1e40af]';

// One tile of the summary: a small label over a big number. `hint` is the working-out, shown when the pointer rests on the tile.
function Tile({ label, labelClass, tileClass, hint, children }: { label: string; labelClass?: string; tileClass?: string; hint?: string; children: ReactNode }) {
  return (
    <div title={hint} className={`rounded-lg px-4 py-3 ${tileClass ?? 'bg-[#f4f5f7]'}`}>
      <div className={`text-[12px] font-medium ${labelClass ?? 'text-gray-500'}`}>{label}</div>
      <div className="mt-1 flex min-h-[30px] flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

// Financial Summary: the numbers are worked out from the accepted quotes, the Payment Collection Records (PCR) and the Pre-Payment Records (PPR)
// of the deal every time the page is opened or anything on it changes. Exclusions and Incentive % are typed.
export default function SummarySection({ section }: { section: LayoutSection }) {
  const { detail, layout, canEdit, save } = useProject();
  const m = detail.money;
  const fields = layout.fields.filter(f => f.section === section.id && f.enabled);

  type Worked = { value: string; tone?: string; chip?: { text: string; cls: string }; tile?: string; labelClass?: string; hint?: string };
  const worked = (key: string): Worked | null => {
    switch (key) {
      case 'projectValue':
        return { value: rupees(m.projectValue), hint: 'The Total Quote Value of the accepted quotes' };
      case 'collectedAmount': {
        const p = pct(m.collected, m.projectValue);
        return { value: rupees(m.collected), chip: p !== null ? { text: `${p}%`, cls: chipGreen } : undefined, hint: 'The Payment Collection Records of the deal' };
      }
      case 'balanceAmount':
        return m.balance > 0
          ? { value: rupees(m.balance), tone: 'text-[#d9232b]', tile: 'bg-[#fdecec]', labelClass: 'text-[#c0392b]', hint: 'Project Value - Collected Amount' }
          : { value: rupees(m.balance), hint: 'Project Value - Collected Amount' };
      case 'expensesTotal': {
        const p = m.expensesOfValuePct !== null ? Math.round(m.expensesOfValuePct) : null;
        return {
          value: rupees(m.expenses),
          tone: 'text-[#1a56c4]',
          chip: p !== null ? { text: `${p}%`, cls: chipBlue } : undefined,
          hint: [
            'The Pre-Payment Records of the deal',
            m.expensesOfValuePct !== null ? `${m.expensesOfValuePct}% of the project value` : '',
            m.expensesOfCollectedPct !== null ? `${m.expensesOfCollectedPct}% of what was collected` : '',
          ].filter(Boolean).join(' · '),
        };
      }
      case 'profitValue':
        return { value: rupees(m.profit), tone: m.profit < 0 ? 'text-[#d9232b]' : undefined, hint: m.profitPct !== null ? `Project Value - Expenses · ${m.profitPct}% of the project value` : 'Project Value - Expenses' };
      case 'profitAfterExclusions':
        return { value: rupees(m.profitAfterExclusions), tone: m.profitAfterExclusions < 0 ? 'text-[#d9232b]' : undefined, hint: `${rupees(m.profit)} - ${rupees(m.exclusions)}` };
      case 'incentiveAmount':
        return { value: rupees(m.incentiveAmount), hint: `${m.incentivePercent}% of ${rupees(Math.max(0, m.profitAfterExclusions))}` };
      default:
        return null;
    }
  };

  return (
    <Section id={section.id} title={section.label}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" data-financial-summary>
        {fields.map(f => {
          const w = worked(f.key);
          if (w) {
            return (
              <Tile key={f.key} label={f.label} labelClass={w.labelClass} tileClass={w.tile} hint={w.hint}>
                <span className={`text-[20px] font-bold leading-none ${w.tone ?? 'text-[#111]'}`} data-money={f.key}>{w.value}</span>
                {w.chip && <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${w.chip.cls}`}>{w.chip.text}</span>}
              </Tile>
            );
          }
          // Exclusions and Incentive %: typed here
          const typed = detail.values[f.key];
          const shown = f.key === 'incentivePercent' ? (typeof typed === 'number' ? `${typed}%` : '—') : rupees(typed);
          return (
            <Tile key={f.key} label={f.label} tileClass={f.key === 'incentivePercent' ? 'bg-[#eef5ff]' : undefined}>
              {canEdit && !f.readOnly
                ? <div className="w-full max-w-[220px]"><CellField field={f} value={typed} htmlId={`sum-${f.key}`} compact={false} onSave={payload => save('', { [f.key]: payload })} /></div>
                : <span className="text-[20px] font-bold leading-none text-[#111]">{shown}</span>}
            </Tile>
          );
        })}
      </div>
    </Section>
  );
}
