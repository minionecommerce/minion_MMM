'use client';

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { DAY_KIND_LABELS, type DayKind, type GridDay, type Overview } from '@/lib/attendance/types';
import { formatDayLong, monthLabel, WEEKDAYS_SHORT } from '@/lib/attendance/time';
import { Card } from './ui';

const DOT: Record<DayKind, string> = {
  PRESENT: 'bg-[#16A34A]',
  ABSENT: 'bg-[#DC2626]',
  LEAVE: 'bg-[#FACC15]',
  NOT_MARKED: 'bg-[#9CA3AF]',
  WEEKLY_OFF: 'bg-[#F9A8D4]',
};

const LEGEND: DayKind[] = ['PRESENT', 'ABSENT', 'LEAVE', 'NOT_MARKED', 'WEEKLY_OFF'];

function weeks(grid: GridDay[]) {
  const rows: GridDay[][] = [];
  for (let i = 0; i < grid.length; i += 7) rows.push(grid.slice(i, i + 7));
  return rows;
}

// The month at a glance: Sunday to Saturday, the weekly off tinted pink, a dot under each day for how it went
export default function CalendarCard({
  overview,
  month,
  selected,
  loading,
  onMonth,
  onSelect,
}: {
  overview: Overview;
  month: string; // the month the header shows (the grid follows as soon as its data arrives)
  selected: string;
  loading: boolean;
  onMonth: (delta: number) => void;
  onSelect: (day: string) => void;
}) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-center gap-4">
        <button type="button" onClick={() => onMonth(-1)} aria-label="Previous month" className="grid h-9 w-9 place-items-center rounded-lg text-[#4B5563] hover:bg-[#F3F4F6]">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="flex min-w-[170px] items-center justify-center gap-2 text-center text-[16px] font-semibold text-[#111827]" aria-live="polite">
          {monthLabel(month)}
          {loading && <Loader2 className="h-4 w-4 animate-spin text-[#9CA3AF]" aria-label="Loading" />}
        </h2>
        <button type="button" onClick={() => onMonth(1)} aria-label="Next month" className="grid h-9 w-9 place-items-center rounded-lg text-[#4B5563] hover:bg-[#F3F4F6]">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div role="grid" aria-label={`Attendance calendar, ${overview.monthLabel}`} aria-busy={loading} className={`transition-opacity ${loading ? 'opacity-60' : ''}`}>
        <div role="row" className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAYS_SHORT.map(d => (
            <div key={d} role="columnheader" className="py-1 text-center text-[12px] font-semibold text-[#374151]">{d}</div>
          ))}
        </div>
        {weeks(overview.grid).map(row => (
          <div key={row[0].day} role="row" className="grid grid-cols-7 gap-1">
            {row.map(g => {
              const off = overview.schedule.weeklyOff.includes(g.weekday);
              const isSelected = g.day === selected;
              const showDot = g.inMonth && g.kind !== 'WEEKLY_OFF' && !(g.kind === 'NOT_MARKED' && g.day > overview.today);
              return (
                <div key={g.day} role="gridcell" aria-selected={isSelected}>
                  <button
                    type="button"
                    disabled={!g.inMonth}
                    onClick={() => onSelect(g.day)}
                    aria-label={`${formatDayLong(g.day)}, ${DAY_KIND_LABELS[g.kind]}`}
                    aria-current={g.day === overview.today ? 'date' : undefined}
                    className={`flex h-[52px] w-full flex-col items-center justify-center rounded-lg text-[14px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                      !g.inMonth
                        ? `cursor-default text-[#C4C9D1] ${off ? 'bg-[#FDF3F3]' : ''}`
                        : off
                          ? 'bg-[#FDE8E8] font-semibold text-[#DC2626]'
                          : 'text-[#111827] hover:bg-[#F3F4F6]'
                    } ${g.day === overview.today && !isSelected && g.inMonth ? 'ring-1 ring-inset ring-[#2563EB]/50' : ''}`}
                  >
                    <span className={`grid h-8 w-8 place-items-center rounded-full ${isSelected ? 'bg-[#2563EB] font-semibold text-white' : ''}`}>{Number(g.day.slice(8))}</span>
                    <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${showDot ? DOT[g.kind] : ''}`} aria-hidden />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <ul className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[12px] text-[#4B5563]">
        {LEGEND.map(k => (
          <li key={k} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${DOT[k]}`} aria-hidden />
            {DAY_KIND_LABELS[k]}
          </li>
        ))}
      </ul>
    </Card>
  );
}
