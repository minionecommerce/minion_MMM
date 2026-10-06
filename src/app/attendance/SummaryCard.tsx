'use client';

import type { Overview } from '@/lib/attendance/types';
import { Card } from './ui';

// Attendance % (present / (present + absent) on working days), then Present, Absent and Leave days of the month
export default function SummaryCard({ overview }: { overview: Overview }) {
  const s = overview.summary;
  const stats: { label: string; value: string; tone: string; edge: string }[] = [
    { label: 'Attendance', value: s.attendancePct === null ? '--' : `${s.attendancePct}%`, tone: s.attendancePct === null ? 'text-[#9CA3AF]' : 'text-[#16A34A]', edge: 'border-[#E5E7EB]' },
    { label: 'Present', value: String(s.present), tone: 'text-[#2563EB]', edge: 'border-[#E5E7EB]' },
    { label: 'Absent', value: String(s.absent), tone: 'text-[#DC2626]', edge: s.absent > 0 ? 'border-[#FCA5A5]' : 'border-[#E5E7EB]' },
    { label: 'Leave', value: String(s.leave), tone: 'text-[#D97706]', edge: 'border-[#E5E7EB]' },
  ];

  return (
    <Card title="Attendance Summary" action={<span className="text-[13px] text-[#6B7280]">{overview.monthLabel}</span>}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(x => (
          <div key={x.label} className={`rounded-xl border bg-white px-3 py-3 text-center ${x.edge}`}>
            <div className={`text-[26px] font-bold leading-none tabular-nums ${x.tone}`}>{x.value}</div>
            <div className="mt-1.5 text-[12px] text-[#6B7280]">{x.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
