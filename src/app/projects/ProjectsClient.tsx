'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { PROJECT_DATE_TYPES, type ProjectFilterKey, type ProjectListParams, type ProjectSortKey } from '@/lib/projects/constants';
import type { ProjectListData } from '@/lib/projects/types';
import type { ModuleLayoutDto } from '@/lib/records/types';
import { formatRupees } from '@/lib/leads/format';
import LeadHeader from '@/app/leads/components/LeadHeader';
import LeadToolbar from '@/app/leads/components/LeadToolbar';
import LeadSummary from '@/app/leads/components/LeadSummary';
import LeadSearch from '@/app/leads/components/LeadSearch';
import { LayoutEditor } from '@/app/records/layout-editor/LayoutEditor';
import ProjectTable from './ProjectTable';

type FilterItem = { value: string; label: string };

// The Projects list: a row for each converted deal (Project Code / Deal No, name, site location, task person, contact, money, dates, completion).
// Same search, header sort / filter menus, calendar and paging in the address as the Leads and Deals pages. Total Value is the Project Value
// of every project that matches the search and filters, not only the page that is open.
export default function ProjectsClient({ data, params, lists, layout, extraColumns, abilities }: {
  data: ProjectListData;
  params: ProjectListParams;
  lists: { statuses: FilterItem[]; people: FilterItem[]; locations: FilterItem[] };
  layout: ModuleLayoutDto;
  extraColumns: { key: string; label: string }[];
  abilities: { export: boolean; layout: boolean };
}) {
  const router = useRouter();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.q ?? '');
  const [layoutOpen, setLayoutOpen] = useState(false);
  // While a reset is on its way, the search box's own delayed update must not put the old search/filters back in the address
  const resetting = useRef(false);

  const setParams = (updates: Record<string, string | undefined>, replace = false) => {
    const next = new URLSearchParams(search.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!('page' in updates)) next.delete('page');
    startTransition(() => (replace ? router.replace : router.push)(`/projects${next.toString() ? `?${next}` : ''}`));
  };

  // Live search: results update about 0.15s after each keystroke
  useEffect(() => {
    if (resetting.current || (params.q ?? '') === q.trim()) return;
    const t = setTimeout(() => setParams({ q: q.trim() || undefined }, true), 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const exportHref = `/api/projects/export${search.toString() ? `?${search}` : ''}`;

  const showAll = () => {
    resetting.current = true;
    setQ('');
    const next = new URLSearchParams();
    for (const k of ['sort', 'dir']) { const v = search.get(k); if (v) next.set(k, v); }
    startTransition(() => { router.push(`/projects${next.toString() ? `?${next}` : ''}`); router.refresh(); });
  };
  const clearAll = () => {
    resetting.current = true;
    setQ('');
    startTransition(() => { router.push('/projects'); router.refresh(); });
  };
  useEffect(() => { resetting.current = false; }, [data]);

  const onFilter = (next: Partial<Record<ProjectFilterKey, string[]>>) =>
    setParams(Object.fromEntries(Object.entries(next).map(([k, v]) => [`f_${k}`, v && v.length ? JSON.stringify(v) : undefined])));

  const group = (key: ProjectFilterKey, label: string, items: FilterItem[]) => ({ key, label, items, selected: params.cols[key] ?? [] });
  const filterGroups = {
    name: [group('status', 'Project Status', lists.statuses)],
    taskPerson: [group('taskPerson', 'Task Person', lists.people)],
    location: [group('location', 'Site Location', lists.locations)],
  };

  return (
    <div data-light-native className="w-full min-h-screen bg-white text-[#333] font-sans">
      <div className="px-4 sm:px-5 pt-6 pb-10 max-w-[2000px] mx-auto">
        <LeadHeader title="Project Management" />

        <div className="mt-6 flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-x-5 gap-y-3 pb-5 border-b-[3px] border-gray-200">
          <LeadSummary noun="Projects" total={data.total} showing={data.showing} onShowAll={showAll} />
          <div className="text-[14px] font-semibold text-[#333] lg:whitespace-nowrap">
            Total Value: <span className="inline-block px-2.5 py-0.5 rounded bg-[#e6f6ec] text-[#15803d] font-bold text-[14px]" data-total-value>{formatRupees(data.totalValue)}</span>
          </div>
          <LeadSearch value={q} onChange={setQ} placeholder="Search projects..." />
          <LeadToolbar
            className="self-end lg:self-auto lg:ml-auto"
            params={params}
            canCreate={false}
            canExport={abilities.export}
            canEditLayout={abilities.layout}
            refreshing={pending}
            onAdd={() => {}}
            onEditLayout={() => setLayoutOpen(true)}
            onRefresh={clearAll}
            onParams={setParams}
            exportHref={exportHref}
            dateTypes={PROJECT_DATE_TYPES}
            layoutLabel="Edit Page Layout"
            noun="projects"
            showImport={false}
          />
        </div>

        <div className="mt-4">
          <ProjectTable
            rows={data.rows}
            total={data.total}
            sort={params.sort}
            dir={params.dir}
            loading={pending}
            extraColumns={extraColumns}
            filterGroups={filterGroups}
            onSort={(k: ProjectSortKey, d) => setParams({ sort: k, dir: d })}
            onFilter={onFilter}
            onReset={clearAll}
          />
        </div>

        {data.pageCount > 1 && (
          <div className="mt-5 flex items-center justify-end gap-3 text-[13px] text-gray-600">
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Page {data.page} of {data.pageCount} · {data.pageSize} per page</span>
            <button disabled={data.page <= 1} onClick={() => setParams({ page: String(data.page - 1) })} aria-label="Previous page" className="w-9 h-9 border border-gray-300 rounded flex items-center justify-center disabled:opacity-40 hover:bg-gray-100"><ChevronLeft className="w-4 h-4" /></button>
            <button disabled={data.page >= data.pageCount} onClick={() => setParams({ page: String(data.page + 1) })} aria-label="Next page" className="w-9 h-9 border border-gray-300 rounded flex items-center justify-center disabled:opacity-40 hover:bg-gray-100"><ChevronRight className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {layoutOpen && abilities.layout && <LayoutEditor moduleId="project" initial={layout} onClose={changed => { setLayoutOpen(false); if (changed) router.refresh(); }} />}
    </div>
  );
}
