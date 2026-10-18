'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CalendarDays, Loader2, SlidersHorizontal } from 'lucide-react';
import { callApi } from '@/lib/leads/client';
import { formatRupees } from '@/lib/leads/format';
import { PERIOD_MODES, type PeriodMode } from '@/lib/dashboard/period';
import { SECTION_LABELS, type DashboardCard, type DashboardLayout, type DashboardMetrics, type QuickActions as QuickData, type TodaySection } from '@/lib/dashboard/types';
import type { ConvertField } from '../deals/components/ConvertProjectModal';
import DonutChart from './DonutChart';
import LayoutEditor from './LayoutEditor';
import QuickActions from './QuickActions';

const MODE_LABEL: Record<PeriodMode, string> = { total: 'Total', today: 'Today', monthly: 'Monthly' };
const SCOPE_NOTE = { period: '', current: 'Current', today: 'Today' } as const;
const input = 'h-9 rounded-md border border-gray-300 bg-white px-2.5 text-[13px] text-[#111827] focus:border-[#EAB308] focus:outline-none focus:ring-1 focus:ring-[#EAB308]';

// My Dashboard: the signed-in person's own numbers for Total / Today / Monthly or a Start Date to Due Date. Every number comes from the server for the
// chosen period; this component only asks for it again when the filter changes.
export default function MyDashboardClient({ initial, layout: initialLayout, quickActions, canEditLayout, convertFields }: {
  initial: DashboardMetrics;
  layout: DashboardLayout;
  quickActions: QuickData | null;
  canEditLayout: boolean;
  convertFields: ConvertField[];
}) {
  const [data, setData] = useState(initial);
  const [layout, setLayout] = useState(initialLayout);
  const [quick, setQuick] = useState(quickActions);
  const [mode, setMode] = useState<PeriodMode>(initial.period.mode === 'custom' ? 'today' : initial.period.mode);
  const [month, setMonth] = useState(initial.period.month ?? initial.period.from?.slice(0, 7) ?? '');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const latest = useRef(0); // only the newest answer may change the screen

  const load = useCallback(async (next: { mode: PeriodMode; month: string; from: string; to: string }) => {
    const id = ++latest.current;
    setLoading(true);
    setError('');
    const q = new URLSearchParams({ mode: next.mode });
    if (next.mode === 'monthly' && next.month) q.set('month', next.month);
    if (next.from) q.set('from', next.from);
    if (next.to) q.set('to', next.to);
    try {
      const res = await callApi<DashboardMetrics>(`/api/dashboard?${q}`, 'GET');
      if (id === latest.current) setData(res);
    } catch (e) {
      if (id === latest.current) setError(e instanceof Error ? e.message : 'Could not load the dashboard. Please try again.');
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }, []);

  const pick = (m: PeriodMode) => { setMode(m); setFrom(''); setTo(''); load({ mode: m, month, from: '', to: '' }); };
  const pickMonth = (value: string) => { setMonth(value); if (value) load({ mode: 'monthly', month: value, from: '', to: '' }); };
  const pickDates = (f: string, t: string) => { setFrom(f); setTo(t); load({ mode, month, from: f, to: t }); };
  const custom = data.period.mode === 'custom';

  const cards = useMemo(() => {
    const by = new Map(data.cards.map(c => [c.key, c]));
    return layout.cards.filter(c => c.visible).flatMap(c => by.get(c.key) ?? []);
  }, [data.cards, layout.cards]);
  const charts = useMemo(() => { const by = new Map(data.charts.map(c => [c.key, c])); return layout.charts.filter(c => c.visible).flatMap(c => by.get(c.key) ?? []); }, [data.charts, layout.charts]);
  const lists = useMemo(() => { const by = new Map(data.today.map(c => [c.key, c])); return layout.today.filter(c => c.visible).flatMap(c => by.get(c.key) ?? []); }, [data.today, layout.today]);
  const firstName = data.userName.split(/\s+/)[0];

  const render: Record<string, () => React.ReactNode> = {
    cards: () => cards.length === 0 ? null : (
      <section aria-label="Summary" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {cards.map(c => <Card key={c.key} card={c} />)}
      </section>
    ),
    charts: () => charts.length === 0 ? null : <section aria-label="Status charts" className="grid grid-cols-1 gap-3 lg:grid-cols-3">{charts.map(c => <DonutChart key={c.key} chart={c} />)}</section>,
    today: () => lists.length === 0 ? null : <section aria-label="Today's activity" className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">{lists.map(l => <TodayList key={l.key} section={l} />)}</section>,
    attendance: () => !data.attendance ? null : (
      <section aria-labelledby="att-title" className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 id="att-title" className="text-[16px] font-semibold text-[#111827]">Attendance Overview</h2>
        <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-[#F0FDF4] py-3"><dd className="text-[24px] font-bold text-[#15803D]">{data.attendance.present}</dd><dt className="text-[12px] text-[#6B7280]">Present</dt></div>
          <div className="rounded-lg bg-[#FEF2F2] py-3"><dd className="text-[24px] font-bold text-[#B91C1C]">{data.attendance.absent}</dd><dt className="text-[12px] text-[#6B7280]">Absent</dt></div>
          <div className="rounded-lg bg-[#FFFBEB] py-3"><dd className="text-[24px] font-bold text-[#92400E]">{data.attendance.pct === null ? '—' : `${data.attendance.pct}%`}</dd><dt className="text-[12px] text-[#6B7280]">Attendance</dt></div>
        </dl>
        <p className="mt-2 text-[12px] text-[#6B7280]">{data.attendance.workingDays === 0 ? 'No working day has been marked in this period.' : 'Attendance % counts working days.'} <Link href="/attendance" className="text-[#1a56c4] hover:underline">Open Attendance</Link></p>
      </section>
    ),
    quickActions: () => !quick ? null : <QuickActions data={quick} convertFields={convertFields} onChange={setQuick} />,
  };

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-5 sm:px-6 sm:py-6">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-[#111827]">Hello {firstName}</h1>
          <p className="mt-0.5 text-[13px] text-[#6B7280]">Your own work · {data.period.label}</p>
        </div>
        {canEditLayout && (
          <button type="button" onClick={() => setEditing(true)} className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-[13px] font-medium text-[#111827] hover:bg-gray-50"><SlidersHorizontal className="h-4 w-4" />Edit Page Layout</button>
        )}
      </header>

      <div className="mb-5 flex flex-wrap items-end gap-x-4 gap-y-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <div role="group" aria-label="Period" className="inline-flex overflow-hidden rounded-md border border-gray-300">
          {PERIOD_MODES.map(m => (
            <button key={m} type="button" onClick={() => pick(m)} aria-pressed={!custom && mode === m} disabled={loading && false}
              className={`h-9 px-4 text-[13px] font-medium ${!custom && mode === m ? 'bg-[#FACC15] text-[#111827]' : 'bg-white text-[#374151] hover:bg-gray-50'}`}>{MODE_LABEL[m]}</button>
          ))}
        </div>
        {mode === 'monthly' && !custom && (
          <label className="flex flex-col text-[12px] text-[#6B7280]">Month<input type="month" value={month} onChange={e => pickMonth(e.target.value)} className={input} /></label>
        )}
        <label className="flex flex-col text-[12px] text-[#6B7280]">Start Date<input type="date" value={from} max={to || undefined} onChange={e => pickDates(e.target.value, to)} className={input} /></label>
        <label className="flex flex-col text-[12px] text-[#6B7280]">Due Date<input type="date" value={to} min={from || undefined} onChange={e => pickDates(from, e.target.value)} className={input} /></label>
        {custom && <button type="button" onClick={() => pick(mode)} className="h-9 rounded-md px-3 text-[13px] text-[#1a56c4] hover:underline">Clear dates</button>}
        <span className="ml-auto flex items-center gap-1.5 text-[12px] text-[#6B7280]" aria-live="polite">
          {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Updating…</> : <><CalendarDays className="h-3.5 w-3.5" />{data.period.label}</>}
        </span>
      </div>

      {error && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-2.5 text-[13px] text-[#B91C1C]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><span className="flex-1">{error}</span>
          <button type="button" onClick={() => load({ mode, month, from, to })} className="font-semibold underline">Try again</button>
        </div>
      )}
      {!data.linked && (
        <p className="mb-4 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-4 py-2.5 text-[13px] text-[#92400E]">Your account is not linked to an employee record, so lead, deal, task and site visit numbers cannot be shown. Ask an administrator to link it.</p>
      )}

      <div className={`space-y-5 transition-opacity ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
        {layout.sections.filter(s => s.visible).map(s => {
          const node = render[s.key]?.();
          return node ? <div key={s.key}>{node}</div> : null;
        })}
        {data.cards.length === 0 && data.today.length === 0 && !data.attendance && !quick?.available.length && (
          <p className="rounded-xl border border-gray-200 bg-white p-6 text-center text-[14px] text-[#6B7280]">There is nothing to show yet. Ask an administrator for access to Leads, Deals, Quotes, Projects or Tasks.</p>
        )}
      </div>
      <p className="sr-only">{Object.values(SECTION_LABELS).join(', ')}</p>
      {editing && <LayoutEditor layout={layout} onClose={() => setEditing(false)} onSaved={l => { setLayout(l); setEditing(false); }} />}
    </main>
  );
}

function Card({ card }: { card: DashboardCard }) {
  const value = card.format === 'money' ? formatRupees(card.value) : String(card.value);
  const note = SCOPE_NOTE[card.scope];
  const body = (
    <>
      <span className="text-[12px] font-medium text-[#6B7280]">{card.label}{note && <span className="ml-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gray-500">{note}</span>}</span>
      <span className="mt-1.5 block text-[26px] font-bold leading-tight text-[#111827]">{value}</span>
    </>
  );
  const cls = 'block rounded-xl border border-gray-200 bg-white p-4 shadow-sm';
  return card.href ? <Link href={card.href} className={`${cls} transition hover:border-[#FACC15] hover:bg-[#FFFBEB] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FACC15]`}>{body}</Link> : <div className={cls}>{body}</div>;
}

function TodayList({ section }: { section: TodaySection }) {
  return (
    <section aria-labelledby={`today-${section.key}`} className="flex min-h-[180px] flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 id={`today-${section.key}`} className="text-[15px] font-semibold text-[#111827]">{section.title}</h3>
        <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[12px] font-semibold text-[#92400E]">{section.total}</span>
      </div>
      {section.items.length === 0 ? <p className="mt-3 text-[13px] text-[#6B7280]">Nothing today.</p> : (
        <ul className="mt-2 flex-1 divide-y divide-gray-100">
          {section.items.map(i => (
            <li key={i.id}>
              <Link href={i.href} className="block rounded px-1 py-2 hover:bg-[#FFFBEB]">
                <span className="block truncate text-[13px] font-medium text-[#111827]">{i.title}</span>
                <span className="block truncate text-[12px] text-[#6B7280]">{[i.sub, i.meta].filter(Boolean).join(' · ')}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {section.total > section.items.length && <Link href={section.href} className="mt-2 text-[12px] text-[#1a56c4] hover:underline">View all {section.total}</Link>}
    </section>
  );
}
