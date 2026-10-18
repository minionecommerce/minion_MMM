'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Boxes, ChevronLeft, ChevronRight, Download, Loader2, Plus, RefreshCw, Wrench, X } from 'lucide-react';
import { ApiError, callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import { VENDOR_KINDS, vendorApi, vendorHref, type VendorKindId, type VendorListData, type VendorListParams, type VendorRow, type VendorSort } from '@/lib/vendors/params';
import LeadHeader from '@/app/leads/components/LeadHeader';
import LeadSummary from '@/app/leads/components/LeadSummary';
import LeadSearch from '@/app/leads/components/LeadSearch';
import HeaderCell, { type FilterGroup, type HeaderColumn } from '@/app/leads/components/HeaderCell';
import LightConfirm from '@/app/leads/components/LightConfirm';
import RecordActions from '@/app/records/components/RecordActions';

const iconBtn = 'w-10 h-10 flex items-center justify-center text-gray-800 hover:text-black hover:bg-gray-100 rounded transition-colors';
const KIND_LABEL: Record<VendorKindId, string> = { material: 'Material', service: 'Service' };
const KIND_BADGE: Record<VendorKindId, string> = { material: 'bg-[#e8f0fe] text-[#1a56c4]', service: 'bg-[#e6f6ec] text-[#1b7a3d]' };
const CREATE: { kind: VendorKindId; label: string; hint: string; href: string; Icon: typeof Boxes }[] = [
  { kind: 'material', label: 'Material Vendor', hint: 'Supplies materials and products', href: '/material-vendors/new', Icon: Boxes },
  { kind: 'service', label: 'Service Vendor', hint: 'Provides labour and services', href: '/service-vendors/new', Icon: Wrench },
];

type Deleting = { row: VendorRow; warning: string | null } | null;

// Vendors: Material and Service Vendors in one list. One ID series (V1, V2 ...), a Vendor Type column and filter. Opening or editing a
// row goes to that vendor's own page, which keeps all of its details (price rows, remarks ...).
export default function VendorsClient({ data, params, abilities, autoCreate }: {
  data: VendorListData;
  params: VendorListParams;
  abilities: { create: boolean; edit: boolean; delete: boolean; export: boolean };
  autoCreate: boolean;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.q ?? '');
  const [choosing, setChoosing] = useState(autoCreate && abilities.create);
  const [deleting, setDeleting] = useState<Deleting>(null);
  const [busy, setBusy] = useState(false);
  const resetting = useRef(false);

  const setParams = (updates: Record<string, string | undefined>, replace = false) => {
    const next = new URLSearchParams(search.toString());
    next.delete('create');
    for (const [k, v] of Object.entries(updates)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!('page' in updates)) next.delete('page');
    startTransition(() => (replace ? router.replace : router.push)(`/vendors${next.toString() ? `?${next}` : ''}`));
  };

  useEffect(() => {
    if (resetting.current || (params.q ?? '') === q.trim()) return;
    const t = setTimeout(() => setParams({ q: q.trim() || undefined }, true), 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  useEffect(() => { resetting.current = false; }, [data]);

  const clearAll = () => { resetting.current = true; setQ(''); startTransition(() => { router.push('/vendors'); router.refresh(); }); };
  const showAll = () => { resetting.current = true; setQ(''); startTransition(() => { router.push('/vendors'); router.refresh(); }); };
  const exportHref = `/api/vendors/export${search.toString() ? `?${search}` : ''}`;

  const sort = params.sort ?? 'code';
  const columns: (HeaderColumn<VendorSort> & { id: string })[] = [
    { id: 'code', label: 'Vendor ID', sort: 'code', width: 'w-[130px]' },
    { id: 'type', label: 'Vendor Type', sort: 'type', filter: 'type', width: 'w-[150px]' },
    { id: 'name', label: 'Vendor Name', sort: 'name', width: 'w-[260px]' },
    { id: 'phone', label: 'Phone', width: 'w-[150px]' },
    { id: 'city', label: 'City', sort: 'city', width: 'w-[160px]' },
    { id: 'subtype', label: 'Business Type', width: 'w-[160px]' },
    { id: 'person', label: 'Task Person', width: 'w-[175px]' },
    { id: 'actions', label: 'Actions', width: 'w-[110px]' },
  ];
  const typeGroup: FilterGroup[] = [{ key: 'type', label: 'Vendor Type', items: VENDOR_KINDS.map(k => ({ value: k.id, label: k.label })), selected: params.types }];

  const handlersFor = (row: VendorRow) => ({
    onView: () => router.push(vendorHref(row.kind, row.id)),
    onEdit: () => router.push(vendorHref(row.kind, row.id, '/edit')),
    onDelete: () => setDeleting({ row, warning: null }),
  });

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await callApi(vendorApi(deleting.row.kind, deleting.row.id), 'DELETE', deleting.warning ? { confirm: true } : {});
      toast.success(`${deleting.row.code} deleted`);
      setDeleting(null);
      router.refresh();
    } catch (e) {
      if (!deleting.warning && e instanceof ApiError && e.status === 409) setDeleting({ ...deleting, warning: e.message });
      else { toast.error(e instanceof Error ? e.message : 'Could not delete'); setDeleting(null); }
    } finally {
      setBusy(false);
    }
  };

  const dash = (v: string | null) => (v ? <span>{v}</span> : <span className="text-gray-300">—</span>);
  const badge = (k: VendorKindId) => <span className={`inline-flex px-2 py-0.5 rounded-full text-[12px] font-semibold ${KIND_BADGE[k]}`}>{KIND_LABEL[k]}</span>;

  return (
    <div data-light-native className="w-full min-h-screen bg-white text-[#333] font-sans">
      <div className="px-4 sm:px-5 pt-6 pb-10 max-w-[2000px] mx-auto">
        <div className="flex flex-wrap items-center gap-3">
          <LeadHeader title="Vendor Management" />
          {abilities.create && (
            <button type="button" onClick={() => setChoosing(true)} className="ml-auto inline-flex items-center gap-2 px-4 h-[42px] rounded-md bg-[#f5b800] hover:bg-[#e0a800] text-black text-[14px] font-semibold">
              <Plus className="w-5 h-5" strokeWidth={2.5} /> Create Vendor
            </button>
          )}
        </div>

        <div className="mt-6 flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-x-5 gap-y-3 pb-5 border-b-[3px] border-gray-200">
          <LeadSummary noun="Vendors" total={data.total} showing={data.showing} onShowAll={showAll} />
          <LeadSearch value={q} onChange={setQ} placeholder="Search vendors..." />
          <div className="flex items-center gap-1 sm:gap-2 self-end lg:self-auto lg:ml-auto">
            <button onClick={clearAll} title="Refresh" aria-label="Refresh" className={iconBtn}><RefreshCw className={`w-5 h-5 ${pending ? 'animate-spin' : ''}`} /></button>
            {abilities.export ? (
              <a href={exportHref} title="Download CSV" aria-label="Download CSV" className={iconBtn}><Download className="w-5 h-5" /></a>
            ) : (
              <span className={`${iconBtn} opacity-30 cursor-not-allowed`} title="You do not have permission to export"><Download className="w-5 h-5" /></span>
            )}
          </div>
        </div>

        <div className="mt-4">
          {data.total === 0 ? (
            <div className="py-20 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg">
              <div className="text-[16px] font-semibold text-gray-700">No vendors yet</div>
              <div className="text-[13px] mt-1">{abilities.create ? 'Click “Create Vendor” to add the first one.' : 'Nothing has been added yet.'}</div>
            </div>
          ) : (
            <div className={pending ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full border-collapse" style={{ minWidth: 1200 }}>
                  <thead className="bg-[#f3f4f6]">
                    <tr>
                      {columns.map(c => (
                        <HeaderCell key={c.id} col={c} active={!!c.sort && c.sort === sort} dir={params.dir} groups={c.filter ? typeGroup : []} onSort={(k, d) => setParams({ sort: k, dir: d })}
                          onFilter={next => setParams({ type: next.type && next.type.length ? next.type.join(',') : undefined })} onReset={clearAll} />
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.length === 0 && (
                      <tr><td colSpan={columns.length} className="py-16 text-center text-gray-500"><div className="text-[16px] font-semibold text-gray-700">No vendors match this search</div><div className="text-[13px] mt-1">Change the search or the Vendor Type filter, or use the reset button in Actions.</div></td></tr>
                    )}
                    {data.rows.map(row => (
                      <tr key={`${row.kind}-${row.id}`} className="border-b border-gray-200 align-middle hover:bg-[#fafafa]" data-record={row.code}>
                        <td className="px-3 py-2.5"><Link href={vendorHref(row.kind, row.id)} className="font-semibold text-[#1a56c4] hover:underline">{row.code}</Link></td>
                        <td className="px-3 py-2.5">{badge(row.kind)}</td>
                        <td className="px-3 py-2.5 text-[14px] text-gray-800"><div className="max-w-[300px] truncate" title={row.name}>{row.name}</div></td>
                        <td className="px-3 py-2.5 text-[14px] text-gray-800">{dash(row.phone)}</td>
                        <td className="px-3 py-2.5 text-[14px] text-gray-800">{dash(row.city)}</td>
                        <td className="px-3 py-2.5 text-[14px] text-gray-800">{dash(row.subtype)}</td>
                        <td className="px-3 py-2.5 text-[14px] text-gray-800">{dash(row.person)}</td>
                        <td className="px-3 py-2.5 sticky right-0 z-10 bg-white shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.15)]">
                          <RecordActions canEdit={abilities.edit} canDelete={abilities.delete} handlers={handlersFor(row)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden space-y-4">
                {data.rows.length === 0 && <div className="py-12 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg"><div className="text-[16px] font-semibold text-gray-700">No vendors match this search</div></div>}
                {data.rows.map(row => (
                  <article key={`${row.kind}-${row.id}`} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-0.5">Vendor ID</div>
                        <Link href={vendorHref(row.kind, row.id)} className="font-semibold text-[#1a56c4] hover:underline">{row.code}</Link> <span className="ml-1">{badge(row.kind)}</span>
                      </div>
                      <RecordActions canEdit={abilities.edit} canDelete={abilities.delete} handlers={handlersFor(row)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[14px] text-gray-800">
                      {([['Vendor Name', row.name], ['Phone', row.phone], ['City', row.city], ['Business Type', row.subtype], ['Task Person', row.person]] as [string, string | null][]).map(([label, v]) => (
                        <div key={label} className="min-w-0"><div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-0.5">{label}</div><div className="break-words">{dash(v)}</div></div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
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

      {choosing && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setChoosing(false); }}>
          <div role="dialog" aria-modal="true" aria-label="Create Vendor" onKeyDown={e => { if (e.key === 'Escape') setChoosing(false); }} className="w-full max-w-[520px] bg-white rounded-xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-[20px] font-bold text-[#111827]">Create Vendor</h2>
              <button type="button" onClick={() => setChoosing(false)} aria-label="Close" className="text-gray-400 hover:text-black"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-5">
              <p className="text-[14px] text-gray-600 mb-4">What kind of vendor is it? It gets the next Vendor ID in the V1, V2 ... series.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CREATE.map(c => (
                  <button key={c.kind} type="button" onClick={() => router.push(c.href)} className="text-left border border-gray-300 hover:border-[#f5b800] hover:bg-[#fff8dc] rounded-lg p-4 flex items-start gap-3">
                    <c.Icon className="w-6 h-6 text-gray-700 shrink-0 mt-0.5" />
                    <span><span className="block text-[15px] font-semibold text-gray-900">{c.label}</span><span className="block text-[13px] text-gray-500">{c.hint}</span></span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <LightConfirm title={deleting.warning ? 'In use' : 'Delete vendor?'} confirmLabel={deleting.warning ? 'Delete anyway' : 'Delete'} danger busy={busy} onCancel={() => setDeleting(null)} onConfirm={confirmDelete}>
          {deleting.warning ? (
            <>
              <p>{deleting.warning}</p>
              <p className="text-gray-500">Those records keep showing it, but it will no longer be offered when adding new ones. Are you sure you want to continue?</p>
            </>
          ) : (
            <p><b>{deleting.row.code}</b> ({deleting.row.name}) will be removed from the list. Its ID is never used again.</p>
          )}
        </LightConfirm>
      )}
    </div>
  );
}
