'use client';

import { Briefcase, Home, LogIn, LogOut, MapPin, MapPinOff, type LucideIcon } from 'lucide-react';
import { DAY_KIND_LABELS, type AttendanceAction, type GridDay, type Overview, type Whereabouts } from '@/lib/attendance/types';
import { formatDayLong, formatDayShort, formatHm, formatShift, formatShort } from '@/lib/attendance/time';
import { HISTORY_DOT } from './meta';
import { Card } from './ui';

const WHERE_LABEL: Record<Whereabouts, string> = {
  NOT_STARTED: 'Not checked in yet',
  OFFICE: 'In the office',
  OUT: 'Out of the office',
  SITE: 'At a site',
  DONE: 'Checked out for the day',
};

const NOTE: Record<GridDay['kind'], string> = {
  PRESENT: '',
  ABSENT: 'No attendance was recorded on this day.',
  LEAVE: 'You were on leave on this day.',
  NOT_MARKED: 'Nothing is recorded for this day.',
  WEEKLY_OFF: 'Weekly off. No attendance is expected on this day.',
};

function Pill({ tone, children }: { tone: 'amber' | 'green'; children: React.ReactNode }) {
  return (
    <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone === 'amber' ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#DCFCE7] text-[#166534]'}`}>
      {children}
    </span>
  );
}

// The right-hand panel: the selected day. For today it holds the buttons; for any other day it is a read-only record.
export default function DayPanel({
  overview,
  day,
  canMark,
  onAction,
  onToday,
}: {
  overview: Overview;
  day: GridDay;
  canMark: boolean;
  onAction: (action: AttendanceAction) => void;
  onToday: () => void;
}) {
  const isToday = day.day === overview.today;
  const detail = day.detail;
  const where = overview.me.whereabouts;
  const allowed = (a: AttendanceAction) => isToday && canMark && overview.me.allowed.includes(a);
  // The hint on a button that cannot be pressed
  const whyNot = (action: AttendanceAction) => {
    if (!isToday) return 'Only available for today';
    if (!canMark) return 'You have view-only access to Attendance';
    if (where === 'DONE') return 'You have checked out for the day';
    if (action === 'CHECK_IN') return 'You have already checked in today';
    if (where === 'NOT_STARTED') return 'Check In first';
    if (action === 'OFFICE_OUT') return where === 'OUT' ? 'You are already out of the office' : 'You are at a site: mark Site Out first';
    if (action === 'OFFICE_IN') return where === 'OFFICE' ? 'You are already in the office' : 'You are at a site: mark Site Out first';
    if (action === 'SITE_IN') return where === 'SITE' ? 'You are already at a site' : 'Mark Office Out first';
    if (action === 'SITE_OUT') return 'You are not at a site';
    return 'Not available right now';
  };

  const expectedStart = detail?.expectedStart ?? overview.schedule.startLabel;
  const expectedEnd = detail?.expectedEnd ?? overview.schedule.endLabel;
  const expectedMin = detail ? detail.expectedMin : overview.schedule.weeklyOff.includes(day.weekday) ? 0 : overview.schedule.dailyMin;
  const weeklyOff = overview.schedule.weeklyOff.includes(day.weekday);

  const mainButton = (action: 'CHECK_IN' | 'CHECK_OUT', tone: string, Icon: LucideIcon, label: string) => (
    <button
      type="button"
      disabled={!allowed(action)}
      onClick={() => onAction(action)}
      title={allowed(action) ? undefined : whyNot(action)}
      className={`flex h-12 items-center justify-center gap-2 rounded-lg text-[15px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${tone}`}
    >
      <Icon className="h-5 w-5" aria-hidden />
      {label}
    </button>
  );

  const moveButton = (action: AttendanceAction, Icon: LucideIcon, label: string, iconTone = 'text-[#111827]') => (
    <button
      type="button"
      disabled={!allowed(action)}
      onClick={() => onAction(action)}
      title={allowed(action) ? undefined : whyNot(action)}
      className="flex h-12 items-center justify-center gap-2.5 rounded-lg bg-[#F3F4F6] text-[14px] font-medium text-[#111827] transition-colors hover:bg-[#E5E7EB] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#F3F4F6]"
    >
      <Icon className={`h-[18px] w-[18px] ${iconTone}`} aria-hidden />
      {label}
    </button>
  );

  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-[16px] font-semibold text-[#111827]">
          {isToday ? `Today - ${formatDayLong(day.day)}` : formatDayLong(day.day)}
        </h2>
        {!isToday && (
          <button type="button" onClick={onToday} className="text-[13px] font-semibold text-[#2563EB] hover:underline">
            Back to today
          </button>
        )}
      </div>
      <p className="mt-1 text-[13px] text-[#6B7280]">
        {isToday ? WHERE_LABEL[where] : detail?.missingCheckOut ? 'Check Out was not recorded' : DAY_KIND_LABELS[day.kind]}
        {isToday && !canMark && ' - view only'}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {mainButton('CHECK_IN', 'bg-[#16A34A] hover:bg-[#15803D]', LogIn, 'Check In')}
        {mainButton('CHECK_OUT', 'bg-[#EF4444] hover:bg-[#DC2626]', LogOut, 'Check Out')}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#F3F4F6] p-3">
          <div className="text-[12px] text-[#4B5563]">Check In Time</div>
          <div className={`mt-0.5 text-[20px] font-bold tabular-nums ${detail?.checkIn ? 'text-[#16A34A]' : 'text-[#9CA3AF]'}`}>{detail?.checkIn ?? '--:--'}</div>
          {!weeklyOff && <div className="text-[11px] text-[#6B7280]">Expected {expectedStart}</div>}
          {detail && detail.lateMin > 0 && <Pill tone="amber">Late by {formatShort(detail.lateMin)}</Pill>}
        </div>
        <div className="rounded-xl bg-[#F3F4F6] p-3">
          <div className="text-[12px] text-[#4B5563]">Check Out Time</div>
          <div className={`mt-0.5 text-[20px] font-bold tabular-nums ${detail?.checkOut ? 'text-[#DC2626]' : 'text-[#9CA3AF]'}`}>{detail?.checkOut ?? '--:--'}</div>
          {!weeklyOff && <div className="text-[11px] text-[#6B7280]">Expected {expectedEnd}</div>}
          {detail && detail.earlyMin > 0 && <Pill tone="amber">Early by {formatShort(detail.earlyMin)}</Pill>}
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-[#F3F4F6] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[14px] font-semibold text-[#111827]">Shift Hours</span>
          <span className="text-[15px] font-bold tabular-nums text-[#111827]">{detail?.shiftMin != null ? formatShift(detail.shiftMin) : '--'}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center justify-between gap-x-3 text-[11px] text-[#6B7280]">
          <span>{weeklyOff ? 'No office hours on a weekly off' : `Expected ${formatShift(expectedMin)}`}</span>
          {detail && detail.overtimeMin > 0 && <Pill tone="green">Overtime {formatHm(detail.overtimeMin)}</Pill>}
        </div>
      </div>

      {detail?.missingCheckOut && (
        <p className="mt-3 rounded-lg bg-[#FEF3C7] px-3 py-2 text-[12px] text-[#92400E]">Check Out was not recorded for this day, so its hours are not counted.</p>
      )}
      {!detail && !isToday && NOTE[day.kind] && <p className="mt-3 text-[13px] text-[#6B7280]">{NOTE[day.kind]}</p>}

      <h3 className="mt-6 text-[15px] font-semibold text-[#111827]">Office / Site Movement</h3>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {moveButton('OFFICE_OUT', Briefcase, 'Office Out')}
        {moveButton('OFFICE_IN', Home, 'Office In')}
        {moveButton('SITE_IN', MapPin, 'Site In')}
        {moveButton('SITE_OUT', MapPinOff, 'Site Out', 'text-[#DC2626]')}
      </div>
      {isToday && canMark && where === 'NOT_STARTED' && <p className="mt-2 text-[12px] text-[#6B7280]">Check In to use Office and Site movement.</p>}

      <h3 className="mt-6 text-[15px] font-semibold text-[#111827]">Movement History ({isToday ? 'Today' : formatDayShort(day.day)})</h3>
      {detail && detail.history.length > 0 ? (
        <ol className="mt-3 divide-y divide-[#F3F4F6] overflow-hidden rounded-xl bg-[#F9FAFB]">
          {detail.history.map(h => (
            <li key={h.key} className="flex items-baseline gap-2.5 px-3 py-2 text-[13px]">
              <span className={`relative top-[-1px] h-2 w-2 shrink-0 rounded-full ${HISTORY_DOT[h.type]}`} aria-hidden />
              <span className="w-[82px] shrink-0 font-medium text-[#111827]">{h.label}</span>
              <span className="w-[66px] shrink-0 tabular-nums text-[#374151]">{h.time}</span>
              <span className="min-w-0 break-words text-[#6B7280]">{h.detail ? `(${h.detail})` : ''}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-[13px] text-[#6B7280]">{isToday ? 'Nothing recorded yet today.' : 'Nothing recorded for this day.'}</p>
      )}
    </Card>
  );
}
