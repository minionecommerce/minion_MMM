'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { ColumnFilterKey, LeadFilterId, LeadFormOptions, LeadSortKey } from '@/lib/leads/constants';
import type { LeadListParams, LeadRow } from '@/lib/leads/queries';
import { callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import LeadHeader from './components/LeadHeader';
import LeadSummary from './components/LeadSummary';
import LeadSearch from './components/LeadSearch';
import LeadFilters from './components/LeadFilters';
import LeadTable from './components/LeadTable';
import AddLeadModal from './components/AddLeadModal';
import ViewLeadModal from './components/ViewLeadModal';
import PageLayoutEditor from './components/PageLayoutEditor';
import FollowUpModal from './components/FollowUpModal';

type Data = {
  rows: LeadRow[];
  summary: { total: number; showing: number; repeated: number };
  page: number;
  pageCount: number;
  pageSize: number;
};

type Dialog = { kind: 'add' } | { kind: 'edit'; row: LeadRow } | { kind: 'view'; row: LeadRow } | { kind: 'delete'; row: LeadRow } | { kind: 'duplicate'; row: LeadRow } | { kind: 'layout' } | { kind: 'followup'; row: LeadRow } | null;

export default function LeadsClient({ data, params, options, currentEmployeeId, abilities, storageReady }: {
  data: Data;
  params: LeadListParams;
  options: LeadFormOptions;
  currentEmployeeId: string | null;
  abilities: { create: boolean; edit: boolean; delete: boolean; export: boolean; layout: boolean };
  storageReady: boolean;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.q ?? '');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);
  // While a reset is on its way, the search box's own delayed update must not put the old search/filters back in the address
  const resetting = useRef(false);

  const setParams = (updates: Record<string, string | undefined>, replace = false) => {
    const next = new URLSearchParams(search.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!('page' in updates)) next.delete('page');
    startTransition(() => (replace ? router.replace : router.push)(`/leads${next.toString() ? `?${next}` : ''}`));
  };

  // Live search: results update about 0.15s after each keystroke (runs on the server, so only the matching page of rows is loaded)
  useEffect(() => {
    if (resetting.current || (params.q ?? '') === q.trim()) return;
    const t = setTimeout(() => setParams({ q: q.trim() || undefined }, true), 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const exportHref = `/api/leads/export${search.toString() ? `?${search}` : ''}`;

  const afterSave = (message: string) => {
    setDialog(null);
    toast.success(message);
    router.refresh();
  };

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try { await fn(); toast.success(ok); setDialog(null); router.refresh(); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Something went wrong'); }
    finally { setBusy(false); }
  };

  const handlersFor = (row: LeadRow) => ({
    onView: () => setDialog({ kind: 'view', row }),
    onEdit: () => setDialog({ kind: 'edit', row }),
    onDuplicate: () => setDialog({ kind: 'duplicate', row }),
    onDelete: () => setDialog({ kind: 'delete', row }),
  });

  const group = (key: ColumnFilterKey, label: string, items: { value: string; label: string }[]) => ({ key, label, items, selected: params.cols?.[key] ?? [] });
  const people = options.employees.map(e => ({ value: e.id, label: e.name }));
  const filterGroups = {
    customer: [group('customer', 'Customer details', options.customerNames.map(n => ({ value: n, label: n })))],
    requirement: [group('requirement', 'Requirements', options.exactRequirements.map(t => ({ value: t, label: t })))],
    assigned: [group('assigned', 'Task Assigned Person', people), group('leadPerson', 'Lead Person', people)],
    status: [group('status', 'Lead Status', options.leadStatuses.map(o => ({ value: o.id, label: o.label })))],
    source: [group('source', 'Source', options.sources.map(o => ({ value: o.id, label: o.label })))],
    category: [group('category', 'Categories', options.mainCategories.map(o => ({ value: o.id, label: o.label })))],
    location: [group('location', 'Location', options.locations.map(l => ({ value: l, label: l })))],
  };

  // Clears the search, every filter and the sorting, then reloads the list
  const clearAll = () => {
    resetting.current = true;
    setQ('');
    startTransition(() => { router.push('/leads'); router.refresh(); });
  };
  useEffect(() => { resetting.current = false; }, [data]);

  return (
    <div data-light-native className="w-full min-h-screen bg-white text-[#333] font-sans">
      <div className="px-4 sm:px-5 pt-6 pb-10 max-w-[2000px] mx-auto">
        <LeadHeader
          options={options}
          params={params}
          canCreate={abilities.create}
          canExport={abilities.export}
          canEditLayout={abilities.layout}
          refreshing={pending}
          onAdd={() => setDialog({ kind: 'add' })}
          onEditLayout={() => setDialog({ kind: 'layout' })}
          onRefresh={clearAll}
          onParams={setParams}
          exportHref={exportHref}
        />

        <div className="mt-6 flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-x-5 gap-y-3 pb-5 border-b-[3px] border-gray-200">
          <LeadSummary
            total={data.summary.total}
            showing={data.summary.showing}
            repeated={data.summary.repeated}
            repeatedActive={params.filter === 'repeated'}
            onRepeated={() => setParams({ filter: params.filter === 'repeated' ? undefined : 'repeated' })}
          />
          <LeadSearch value={q} onChange={setQ} />
          <LeadFilters active={params.filter} onChange={(id: LeadFilterId | undefined) => setParams({ filter: id })} />
        </div>

        <div className="mt-4">
          <LeadTable
            rows={data.rows}
            sort={params.sort}
            dir={params.dir === 'asc' ? 'asc' : 'desc'}
            abilities={abilities}
            loading={pending}
            columnOrder={options.columnOrder}
            filterGroups={filterGroups}
            onFilter={next => setParams(Object.fromEntries(Object.entries(next).map(([k, v]) => [`f_${k}`, v && v.length ? JSON.stringify(v) : undefined])))}
            onSort={(k: LeadSortKey, d) => setParams({ sort: k, dir: d })}
            onReset={clearAll}
            onFollowUp={row => setDialog({ kind: 'followup', row })}
            handlersFor={handlersFor}
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

      {dialog?.kind === 'add' && <AddLeadModal mode="create" lead={null} options={options} currentEmployeeId={currentEmployeeId} storageReady={storageReady} onClose={() => setDialog(null)} onSaved={afterSave} />}
      {dialog?.kind === 'edit' && <AddLeadModal mode="edit" lead={dialog.row} options={options} currentEmployeeId={currentEmployeeId} storageReady={storageReady} onClose={() => setDialog(null)} onSaved={afterSave} />}
      {dialog?.kind === 'layout' && abilities.layout && (
        <PageLayoutEditor initialFields={options.fields} columnOrder={options.columnOrder} onClose={changed => { setDialog(null); if (changed) router.refresh(); }} />
      )}
      {dialog?.kind === 'followup' && abilities.edit && (
        <FollowUpModal row={dialog.row} onClose={() => setDialog(null)} onSaved={() => afterSave(`Follow-up saved for ${dialog.row.code}`)} />
      )}
      {dialog?.kind === 'view' && <ViewLeadModal leadId={dialog.row.id} options={options} onClose={() => setDialog(null)} />}

      {(dialog?.kind === 'delete' || dialog?.kind === 'duplicate') && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm">
            <h3 id="confirm-title" className="text-[17px] font-bold text-[#333]">{dialog.kind === 'delete' ? 'Delete lead?' : 'Duplicate lead?'}</h3>
            <p className="text-[14px] text-gray-600 mt-2">
              {dialog.kind === 'delete'
                ? <>Lead <b>{dialog.row.code}</b> ({dialog.row.customerName}) will be removed from the list. Its Lead ID is never reused.</>
                : <>A new lead with a new Lead ID will be created from <b>{dialog.row.code}</b>. Files are not copied.</>}
            </p>
            <div className="flex justify-end gap-3 mt-5">
              <button disabled={busy} onClick={() => setDialog(null)} className="px-4 h-[38px] rounded-md bg-gray-200 text-gray-800 text-[14px] disabled:opacity-60">Cancel</button>
              {dialog.kind === 'delete' ? (
                <button disabled={busy} onClick={() => run(() => callApi(`/api/leads/${dialog.row.id}`, 'DELETE').then(() => {}), `Lead ${dialog.row.code} deleted`)} className="px-4 h-[38px] rounded-md bg-[#d9232b] text-white text-[14px] disabled:opacity-60">{busy ? 'Deleting…' : 'Delete'}</button>
              ) : (
                <button disabled={busy} onClick={() => run(async () => { await callApi(`/api/leads/${dialog.row.id}/duplicate`, 'POST'); }, 'Lead duplicated')} className="px-4 h-[38px] rounded-md bg-black text-white text-[14px] disabled:opacity-60">{busy ? 'Duplicating…' : 'Duplicate'}</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
