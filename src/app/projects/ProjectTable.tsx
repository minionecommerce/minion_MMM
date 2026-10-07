'use client';

import Link from 'next/link';
import { ExternalLink, MapPin, User } from 'lucide-react';
import type { ProjectFilterKey, ProjectSortKey } from '@/lib/projects/constants';
import type { ProjectListRow } from '@/lib/projects/types';
import { formatRupees } from '@/lib/leads/format';
import { formatDay } from '@/lib/records/values';
import HeaderCell, { type FilterGroup, type HeaderColumn } from '@/app/leads/components/HeaderCell';
import { CustomerDetailsCell } from '@/app/leads/components/LeadCells';

type Column = HeaderColumn<ProjectSortKey> & { id: string };
const COLUMNS: Column[] = [
  { id: 'code', label: 'Project Code / Deal No', sort: 'code', width: 'w-[170px]' },
  { id: 'name', label: 'Project Name', sort: 'name', width: 'w-[230px]' },
  { id: 'location', label: 'Site Location', sort: 'location', width: 'w-[170px]' },
  { id: 'taskPerson', label: 'Task Person', filter: 'taskPerson', width: 'w-[150px]' },
  { id: 'contact', label: 'Contact Details', width: 'w-[210px]' },
  { id: 'value', label: 'Project Value', width: 'w-[140px]' },
  { id: 'collected', label: 'Collected Amount', width: 'w-[150px]' },
  { id: 'balance', label: 'Balance Amount', width: 'w-[150px]' },
  { id: 'start', label: 'Project Start Date | Actual Start Date', sort: 'start', width: 'w-[210px]' },
  { id: 'validity', label: 'Project Validity | Completed Date', sort: 'validity', width: 'w-[210px]' },
  { id: 'prior', label: 'Prior Completion Date', sort: 'prior', width: 'w-[150px]' },
  { id: 'progress', label: 'Completion %', sort: 'progress', width: 'w-[130px]' },
];

const day = (d: string | null) => (d ? formatDay(d) : '—');
const money = (n: number) => (n === 0 ? <span className="text-gray-400">—</span> : formatRupees(n));

// Two dates in one cell, each with its name
function TwoDates({ first, second, a, b }: { first: string | null; second: string | null; a: string; b: string }) {
  return (
    <div className="space-y-1.5 text-[13px] text-[#333]">
      <div><div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{a}</div>{day(first)}</div>
      <div><div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{b}</div>{day(second)}</div>
    </div>
  );
}

// The Site Location is the name of the place; with a map link saved it opens that link
function SiteLocation({ row }: { row: ProjectListRow }) {
  if (!row.siteLocation) return <span className="text-gray-400">—</span>;
  if (!row.siteLocationLink) return <span className="flex items-start gap-1.5 text-[13px] text-[#333]"><MapPin className="w-3.5 h-3.5 mt-0.5 text-gray-500 shrink-0" />{row.siteLocation}</span>;
  return (
    <a href={row.siteLocationLink} target="_blank" rel="noopener noreferrer" title="Open the site location" className="inline-flex items-start gap-1.5 text-[13px] text-[#1a56c4] hover:underline break-words">
      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />{row.siteLocation}<ExternalLink className="w-3 h-3 mt-1 shrink-0 opacity-60" aria-hidden />
    </a>
  );
}

// Project Code / Deal No in one cell: MP1 / DL36. The code (and the cell) open the project.
function CodeCell({ row }: { row: ProjectListRow }) {
  return (
    <Link href={`/projects/${row.id}`} className="block min-w-0 group" title={`Open project ${row.code}`}>
      <span className="text-[#d9232b] font-bold text-[14px] group-hover:underline">{row.code}</span>
      <span className="text-gray-500 text-[13px]"> / {row.dealNumber || '—'}</span>
    </Link>
  );
}

function NameCell({ row }: { row: ProjectListRow }) {
  return (
    <div className="min-w-0">
      <Link href={`/projects/${row.id}`} className="text-[13px] font-semibold text-[#333] hover:underline break-words">{row.name}</Link>
      {row.statusLabel && <div className="mt-1"><span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-[11px] text-gray-600">{row.statusLabel}</span></div>}
    </div>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div className="w-[96px]">
      <div className="text-[13px] font-semibold text-[#333]">{value}%</div>
      <div className="mt-1 h-1.5 rounded-full bg-gray-200 overflow-hidden"><div className="h-full rounded-full bg-[#16a34a]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
    </div>
  );
}

function Cell({ id, row, extra }: { id: string; row: ProjectListRow; extra?: string }) {
  switch (id) {
    case 'code': return <CodeCell row={row} />;
    case 'name': return <NameCell row={row} />;
    case 'location': return <SiteLocation row={row} />;
    case 'taskPerson': return <span className="flex items-center gap-1.5 text-[13px] text-[#333]">{row.taskPerson ? <><User className="w-3.5 h-3.5 text-[#d9232b] shrink-0" fill="currentColor" />{row.taskPerson}</> : <span className="text-gray-400">—</span>}</span>;
    case 'contact': return <CustomerDetailsCell row={row.contact} />;
    case 'value': return <span className="text-[13px] font-semibold text-[#333]">{money(row.projectValue)}</span>;
    case 'collected': return <span className="text-[13px] text-[#15803d] font-semibold">{money(row.collected)}</span>;
    case 'balance': return <span className="text-[13px] text-[#b45309] font-semibold">{row.projectValue === 0 && row.collected === 0 ? <span className="text-gray-400">—</span> : formatRupees(row.balance)}</span>;
    case 'start': return <TwoDates first={row.startDate} second={row.actualStartDate} a="Project Start Date" b="Actual Start Date" />;
    case 'validity': return <TwoDates first={row.expectedEndDate} second={row.completedDate} a="Project Validity" b="Completed Date" />;
    case 'prior': return <span className="text-[13px] text-[#333]">{day(row.priorCompletionDate)}</span>;
    case 'progress': return <Progress value={row.progress} />;
    default: return <span className="text-[13px] text-[#333] break-words">{extra || '—'}</span>;
  }
}

export default function ProjectTable({ rows, total, sort, dir, loading, extraColumns, filterGroups, onSort, onFilter, onReset }: {
  rows: ProjectListRow[];
  total: number; // all projects, whatever the search and filters
  sort?: ProjectSortKey;
  dir: 'asc' | 'desc';
  loading: boolean;
  extraColumns: { key: string; label: string }[];
  filterGroups: Record<string, FilterGroup<ProjectFilterKey>[]>; // by column: its sort key, or its filter name
  onSort: (k: ProjectSortKey, d: 'asc' | 'desc') => void;
  onFilter: (next: Partial<Record<ProjectFilterKey, string[]>>) => void;
  onReset: () => void;
}) {
  const activeSort = sort ?? 'code';
  const columns: Column[] = [...COLUMNS, ...extraColumns.map(c => ({ id: `custom:${c.key}`, label: c.label, width: 'w-[160px]' })), { id: 'actions', label: 'Actions', width: 'w-[70px]' }];

  if (total === 0) {
    return (
      <div className="py-20 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg">
        <div className="text-[16px] font-semibold text-gray-700">No projects yet</div>
        <div className="text-[13px] mt-1">Convert a deal from the Deals page (the blue icon in Actions) and its project will appear here.</div>
      </div>
    );
  }

  return (
    <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-[1900px] w-full border-collapse">
          <thead className="bg-[#f3f4f6]">
            <tr>
              {columns.map(c => (
                <HeaderCell key={c.id} col={c} active={!!c.sort && c.sort === activeSort} dir={dir} groups={filterGroups[c.filter ?? c.sort ?? ''] ?? []} onSort={onSort} onFilter={onFilter} onReset={onReset} />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={columns.length} className="py-16 text-center text-gray-500"><div className="text-[16px] font-semibold text-gray-700">No projects match these filters</div><div className="text-[13px] mt-1">Open a column filter to change it, or use the reset button in Actions.</div></td></tr>
            )}
            {rows.map(row => (
              <tr key={row.id} className="border-b border-gray-200 align-middle hover:bg-[#fafafa]">
                {columns.map(c => (
                  c.id === 'actions'
                    ? <td key={c.id} className="px-3 py-3 align-middle sticky right-0 z-10 bg-white shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.15)]"><Link href={`/projects/${row.id}`} className="inline-flex items-center h-8 px-3 rounded bg-[#0d6efd] hover:bg-[#0b5ed7] text-white text-[12px] font-semibold">Open</Link></td>
                    : <td key={c.id} className="px-3 py-3 align-middle"><Cell id={c.id.startsWith('custom:') ? 'custom' : c.id} row={row} extra={c.id.startsWith('custom:') ? row.custom[c.id.slice(7)] : undefined} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden space-y-4">
        {rows.length === 0 && <div className="py-12 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg"><div className="text-[16px] font-semibold text-gray-700">No projects match these filters</div></div>}
        {rows.map(row => (
          <article key={row.id} className="border border-gray-200 rounded-lg p-4 space-y-4 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-3"><CodeCell row={row} /><NameCell row={row} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
              <div><div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Site Location</div><SiteLocation row={row} /></div>
              <div><div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Task Person</div><Cell id="taskPerson" row={row} /></div>
              <div><div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Contact Details</div><Cell id="contact" row={row} /></div>
              <div><div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Money</div>
                <div>Project Value: <b>{money(row.projectValue)}</b></div><div>Collected: <b className="text-[#15803d]">{money(row.collected)}</b></div><div>Balance: <b className="text-[#b45309]">{formatRupees(row.balance)}</b></div></div>
              <TwoDates first={row.startDate} second={row.actualStartDate} a="Project Start Date" b="Actual Start Date" />
              <TwoDates first={row.expectedEndDate} second={row.completedDate} a="Project Validity" b="Completed Date" />
              <div><div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Completion %</div><Progress value={row.progress} /></div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
