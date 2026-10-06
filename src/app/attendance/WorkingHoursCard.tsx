'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { GridDay, HoursSummary, Overview } from '@/lib/attendance/types';
import { addDays, formatHm, formatWeekRange, WEEKDAYS_SHORT } from '@/lib/attendance/time';
import { Card, Segmented, SelectBox } from './ui';

type Mode = 'weekly' | 'monthly';
type Metric = 'total' | 'overtime' | 'office';

const METRICS: { value: Metric; label: string }[] = [
  { value: 'total', label: 'Total Work Hours' },
  { value: 'overtime', label: 'Overtime' },
  { value: 'office', label: 'Office Hours' },
];

const valueOf = (g: GridDay, metric: Metric) => (metric === 'total' ? g.workedMin : metric === 'overtime' ? g.overtimeMin : g.officeMin);

// The top of the chart: the smallest of these that holds the tallest bar, so the four gaps are whole 30 min / 1 h / 2 h ... steps
const TOPS = [120, 240, 480, 720, 960, 1200, 1440];
const topFor = (max: number) => TOPS.find(t => t >= max) ?? 1440;
const tickLabel = (min: number) => (min % 60 === 0 ? `${min / 60}h` : min < 60 ? `${min}m` : `${Math.floor(min / 60)}h ${min % 60}m`);

// What the Monthly view shows for each choice of the dropdown (Total Work Hours is the first design: total, overtime, average, expected)
function monthlyStats(metric: Metric, h: HoursSummary): { boxed: [string, string][]; plain: [string, string][] } {
  const avg = (min: number, days: number) => formatHm(days ? Math.round(min / days) : 0);
  if (metric === 'overtime') {
    return {
      boxed: [['Overtime Hours', formatHm(h.overtimeMin)], ['Days with Overtime', String(h.overtimeDays)]],
      plain: [['Average Overtime per day', avg(h.overtimeMin, h.overtimeDays)], ['Total Working Hours', formatHm(h.totalMin)]],
    };
  }
  if (metric === 'office') {
    return {
      boxed: [['Office Hours', formatHm(h.officeMin)], ['Out of Office (Site / Other)', formatHm(h.outMin)]],
      plain: [['Average Office Hours per day', avg(h.officeMin, h.daysWorked)], ['Total Working Hours', formatHm(h.totalMin)]],
    };
  }
  return {
    boxed: [['Total Working Hours', formatHm(h.totalMin)], ['Overtime Hours', formatHm(h.overtimeMin)]],
    plain: [['Average per day', formatHm(h.avgMin)], ['Expected Hours (This Month)', formatHm(h.expectedMin)]],
  };
}

function WeekChart({ days, metric, weeklyOff }: { days: GridDay[]; metric: Metric; weeklyOff: number[] }) {
  // Sunday (the weekly off) only appears when something was worked on it
  const shown = days.filter(g => !(weeklyOff.includes(g.weekday) && valueOf(g, metric) === 0));
  const top = topFor(Math.max(0, ...shown.map(g => valueOf(g, metric))));
  const ticks = [0, 1, 2, 3, 4].map(i => (top / 4) * i);
  const summary = shown.map(g => `${WEEKDAYS_SHORT[g.weekday]} ${valueOf(g, metric) ? formatHm(valueOf(g, metric)) : 'none'}`).join(', ');

  return (
    <div className="flex" role="img" aria-label={`${METRICS.find(m => m.value === metric)?.label} by day: ${summary}`}>
      <div className="relative mr-2 h-[200px] w-9 shrink-0">
        {ticks.map(t => (
          <span key={t} className="absolute right-0 translate-y-1/2 text-[11px] tabular-nums text-[#6B7280]" style={{ bottom: `${(t / top) * 100}%` }}>
            {tickLabel(t)}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative h-[200px]">
          {ticks.map(t => (
            <div key={t} className="absolute inset-x-0 border-t border-dashed border-[#E5E7EB]" style={{ bottom: `${(t / top) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-2 px-1">
            {shown.map(g => (
              <div key={g.day} className="flex h-full flex-1 items-end justify-center">
                <div className="w-full max-w-[34px] rounded-t-md bg-[#3B82F6]" style={{ height: `${(valueOf(g, metric) / top) * 100}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 flex gap-2 px-1">
          {shown.map(g => (
            <div key={g.day} className="min-w-0 flex-1 text-center">
              <div className="text-[12px] text-[#6B7280]">{WEEKDAYS_SHORT[g.weekday]}</div>
              <div className="text-[12px] font-medium tabular-nums text-[#111827]">{valueOf(g, metric) ? formatHm(valueOf(g, metric)) : '-'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Working Hours: Weekly (a bar chart of one week of the calendar) or Monthly (the month's totals); the dropdown picks what is measured
export default function WorkingHoursCard({
  overview,
  weekStart,
  onWeek,
}: {
  overview: Overview;
  weekStart: string; // the Sunday that starts the week shown
  onWeek: (start: string) => void;
}) {
  const [mode, setMode] = useState<Mode>('weekly');
  const [metric, setMetric] = useState<Metric>('total');

  const days = overview.grid.filter(g => g.day >= weekStart && g.day <= addDays(weekStart, 6));
  const first = overview.grid[0]?.day ?? weekStart;
  const last = overview.grid[overview.grid.length - 1]?.day ?? weekStart;
  const prev = addDays(weekStart, -7);
  const next = addDays(weekStart, 7);
  const weekTotal = days.reduce((sum, g) => sum + valueOf(g, metric), 0);
  const monthly = monthlyStats(metric, overview.hours);

  return (
    <Card title="Working Hours">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Working hours view"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
          ]}
        />
        <SelectBox value={metric} onChange={v => setMetric(v as Metric)} label="Hours to show" className="w-[170px]">
          {METRICS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </SelectBox>
      </div>

      {mode === 'weekly' ? (
        <div className="mt-4">
          <div className="mb-4 flex items-center justify-center gap-3">
            <button type="button" onClick={() => onWeek(prev)} disabled={prev < first} aria-label="Previous week" className="grid h-8 w-8 place-items-center rounded-lg text-[#4B5563] hover:bg-[#F3F4F6] disabled:opacity-30 disabled:hover:bg-transparent">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[170px] text-center text-[13px] font-medium text-[#374151]" aria-live="polite">{formatWeekRange(weekStart, addDays(weekStart, 6))}</span>
            <button type="button" onClick={() => onWeek(next)} disabled={next > last} aria-label="Next week" className="grid h-8 w-8 place-items-center rounded-lg text-[#4B5563] hover:bg-[#F3F4F6] disabled:opacity-30 disabled:hover:bg-transparent">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <WeekChart days={days} metric={metric} weeklyOff={overview.schedule.weeklyOff} />
          <p className="mt-3 text-center text-[12px] text-[#6B7280]">
            Week total: <span className="font-semibold text-[#111827]">{formatHm(weekTotal)}</span>
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <p className="mb-3 text-[13px] text-[#6B7280]">{overview.monthLabel}</p>
          <div className="grid grid-cols-2 gap-3">
            {monthly.boxed.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">
                <div className="text-[12px] text-[#6B7280]">{label}</div>
                <div className="mt-1 text-[22px] font-bold tabular-nums text-[#111827]">{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 px-1">
            {monthly.plain.map(([label, value]) => (
              <div key={label}>
                <div className="text-[12px] text-[#6B7280]">{label}</div>
                <div className="mt-0.5 text-[18px] font-bold tabular-nums text-[#111827]">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
