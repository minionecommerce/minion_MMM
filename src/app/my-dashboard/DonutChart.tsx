'use client';

import type { DashboardChart } from '@/lib/dashboard/types';

// One colour per status, the same in every chart that has it
const COLORS: Record<string, string> = {
  open: '#2563EB', follow_up: '#F59E0B', closed: '#16A34A', converted: '#7C3AED',
  draft: '#9CA3AF', sent: '#2563EB', accepted: '#16A34A', declined: '#DC2626', invoiced: '#7C3AED',
};
const FALLBACK = '#6B7280';

// A doughnut with the total in the middle and a legend with the count and the percentage of each status. No data: an empty ring and a line saying so.
export default function DonutChart({ chart }: { chart: DashboardChart }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const parts = chart.slices.filter(s => s.count > 0).map((s, i, all) => ({ ...s, offset: all.slice(0, i).reduce((sum, x) => sum + (x.count / chart.total) * C, 0) }));
  return (
    <section aria-labelledby={`chart-${chart.key}`} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 id={`chart-${chart.key}`} className="text-[15px] font-semibold text-[#111827]">{chart.title}</h3>
      <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <svg viewBox="0 0 140 140" className="h-[140px] w-[140px] shrink-0" role="img" aria-label={`${chart.title}: ${chart.total} in total`}>
          <circle cx="70" cy="70" r={R} fill="none" stroke="#F3F4F6" strokeWidth="18" />
          {parts.map(s => {
            const len = (s.count / chart.total) * C;
            return <circle key={s.key} cx="70" cy="70" r={R} fill="none" stroke={COLORS[s.key] ?? FALLBACK} strokeWidth="18" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-s.offset} transform="rotate(-90 70 70)"><title>{`${s.label}: ${s.count} (${s.pct}%)`}</title></circle>;
          })}
          <text x="70" y="68" textAnchor="middle" className="fill-[#111827] text-[22px] font-bold">{chart.total}</text>
          <text x="70" y="86" textAnchor="middle" className="fill-[#6B7280] text-[10px]">Total</text>
        </svg>
        <ul className="w-full min-w-0 space-y-1.5 text-[13px]">
          {chart.slices.map(s => (
            <li key={s.key} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLORS[s.key] ?? FALLBACK }} aria-hidden />
              <span className="min-w-0 flex-1 truncate text-[#374151]">{s.label}</span>
              <span className="font-semibold text-[#111827]">{s.count}</span>
              <span className="w-10 text-right text-[#6B7280]">{s.pct}%</span>
            </li>
          ))}
        </ul>
      </div>
      {chart.total === 0 && <p className="mt-2 text-[12px] text-[#6B7280]">Nothing in this period.</p>}
    </section>
  );
}
