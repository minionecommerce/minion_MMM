'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Package, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import { callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import { formatMoney } from '@/lib/quotes/format';
import type { DisplaySettings, ItemDto, QuoteAbilities, TaxDef } from '@/lib/quotes/types';
import ItemOverlay from '../ItemOverlay';
import { itemImageSrc } from '../item-client';
import { Button, Modal } from '../ui';

type Data = { rows: ItemDto[]; total: number; showing: number; page: number; pageCount: number; pageSize: number };
type Params = { q?: string; page: number; active: 'all' | 'active' | 'inactive' };
type Imported = { created: number; updated: number; skipped: number; notes: string[] };
const EXPORT_URL = '/api/quotes/items/export'; // a file download, not a page

const q = (p: Params, patch: Partial<Params>) => {
  const m = { ...p, ...patch };
  const sp = new URLSearchParams();
  if (m.q) sp.set('q', m.q);
  if (m.active !== 'all') sp.set('active', m.active);
  if (m.page > 1) sp.set('page', String(m.page));
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export default function ItemsClient({ data, params, taxes, display, abilities }: { data: Data; params: Params; taxes: TaxDef[]; display: DisplaySettings; abilities: QuoteAbilities }) {
  const router = useRouter();
  const toast = useToast();
  const [term, setTerm] = useState(params.q ?? '');
  const [editing, setEditing] = useState<ItemDto | 'new' | null>(null);
  const [removing, setRemoving] = useState<ItemDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [imported, setImported] = useState<Imported | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const go = (patch: Partial<Params>) => router.push(`/quotes/items${q(params, { page: 1, ...patch })}`);
  const taxName = (id: string | null) => taxes.find(t => t.id === id)?.name ?? '';

  useEffect(() => {
    if ((term.trim() || '') === (params.q ?? '')) return;
    const t = setTimeout(() => router.replace(`/quotes/items${q(params, { q: term.trim() || undefined, page: 1 })}`), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  const remove = async () => {
    if (!removing) return;
    setBusy(true);
    try { await callApi(`/api/quotes/items/${removing.id}`, 'DELETE'); toast.success(`${removing.name} deleted`); setRemoving(null); router.refresh(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not delete the item'); }
    finally { setBusy(false); }
  };

  const importFile = async (f: File) => {
    if (f.size > 4_000_000) { toast.error('The file is larger than 4 MB'); return; }
    setBusy(true);
    try {
      const csv = await f.text();
      setImported(await callApi<Imported>('/api/quotes/items/import', 'POST', { csv }));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not import the file');
    } finally {
      setBusy(false);
    }
  };

  const first = data.showing === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const last = Math.min(data.showing, data.page * data.pageSize);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="min-h-[55px] px-[25px] py-2 flex flex-wrap items-center gap-3">
        <Link href="/quotes" aria-label="Back to quotes" className="w-8 h-8 rounded-full border border-[#d7d5e1] hover:bg-[#f1f1fa] flex items-center justify-center"><ArrowLeft className="w-4 h-4" /></Link>
        <h1 className="text-[18px] font-semibold text-[#222529]">Items</h1>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9ca0ab] absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden />
            <input value={term} onChange={e => setTerm(e.target.value)} placeholder="Search items" aria-label="Search items" className="w-[220px] h-[30px] pl-8 pr-2 text-[12.5px] border border-[#d7d5e1] rounded-[4px] focus:outline-none focus:border-[#548df6]" />
          </div>
          <select value={params.active} onChange={e => go({ active: e.target.value as Params['active'] })} aria-label="Show" className="h-[30px] px-2 text-[12.5px] border border-[#d7d5e1] rounded-[4px] bg-white">
            <option value="all">All items</option><option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
          {abilities.export && <a href={EXPORT_URL} download className="inline-flex items-center gap-1.5 h-[30px] px-3 rounded-[4px] border border-[#d7d5e1] text-[12.5px] hover:bg-[#f1f1fa]"><Download className="w-3.5 h-3.5" /> Export</a>}
          {abilities.create && abilities.edit && (
            <>
              <input ref={file} type="file" accept=".csv,text/csv" hidden aria-label="Import items from a CSV file" onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void importFile(f); }} />
              <Button kind="ghost" onClick={() => file.current?.click()} busy={busy} className="!h-[30px]"><Upload className="w-3.5 h-3.5" /> Import</Button>
            </>
          )}
          {abilities.create && <button type="button" onClick={() => setEditing('new')} className="inline-flex items-center gap-1.5 h-[32px] px-[11px] rounded-[4px] bg-[#548df6] hover:bg-[#4a82ea] text-white text-[13px] font-medium"><Plus className="w-4 h-4" /> New</button>}
        </div>
      </div>

      <div className="flex-1 overflow-x-auto q-scroll">
        <table className="w-full min-w-[1100px] border-collapse">
          <thead>
            <tr className="h-[36px] bg-[#f9f9fb] border-y border-[#ebeaf2] text-[11px] font-medium uppercase tracking-[0.2px] text-[#6d7189]">
              <th className="text-left pl-[25px] pr-[15px] font-medium">Name</th>
              <th className="text-left px-[15px] font-medium">Category</th>
              <th className="text-left px-[15px] font-medium">HSN/SAC</th>
              <th className="text-left px-[15px] font-medium">Unit</th>
              <th className="text-right px-[15px] font-medium">Rate</th>
              <th className="text-left px-[15px] font-medium">Tax</th>
              <th className="text-left px-[15px] font-medium">Type</th>
              <th className="text-left px-[15px] font-medium">Task Template</th>
              <th className="text-left px-[15px] font-medium">Status</th>
              <th className="w-[90px]" />
            </tr>
          </thead>
          <tbody>
            {data.rows.map(i => (
              <tr key={i.id} className="h-[46px] border-b border-[#ebeaf2] text-[13px] text-[#333]" data-item-row>
                <td className="pl-[25px] pr-[15px] max-w-[420px]">
                  <div className="flex items-center gap-[10px]">
                    {i.imageFileId && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={itemImageSrc(i.imageFileId)} alt="" className="w-[30px] h-[30px] shrink-0 rounded-[4px] object-cover border border-[#ebeaf2]" />
                    )}
                    <div className="min-w-0"><div className="truncate font-medium" title={i.name}>{i.name}</div>{(i.description || i.sku) && <div className="truncate text-[12px] text-[#6d7189]" title={i.description}>{[i.sku && `SKU ${i.sku}`, i.description].filter(Boolean).join(' · ')}</div>}</div>
                  </div>
                </td>
                <td className="px-[15px]">{i.category}</td>
                <td className="px-[15px]">{i.hsn}</td>
                <td className="px-[15px]">{i.unit}</td>
                <td className="px-[15px] text-right whitespace-nowrap">{formatMoney(i.rate, display.currencySymbol, display.grouping)}</td>
                <td className="px-[15px]">{taxName(i.taxId)}</td>
                <td className="px-[15px]">{i.kind}</td>
                <td className="px-[15px]">{i.taskTemplateName}</td>
                <td className="px-[15px]"><span className="uppercase text-[12px]" style={{ color: i.isActive ? '#2fa070' : '#7f8c8d' }}>{i.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="px-[15px] text-right whitespace-nowrap">
                  {abilities.edit && <button type="button" onClick={() => setEditing(i)} aria-label={`Edit ${i.name}`} className="w-7 h-7 rounded hover:bg-[#f1f1fa] text-[#575a6f]"><Pencil className="w-3.5 h-3.5 mx-auto" /></button>}
                  {abilities.delete && <button type="button" onClick={() => setRemoving(i)} aria-label={`Delete ${i.name}`} className="w-7 h-7 rounded hover:bg-[#fdeeee] text-[#d9232b]"><Trash2 className="w-3.5 h-3.5 mx-auto" /></button>}
                </td>
              </tr>
            ))}
            {data.rows.length === 0 && (
              <tr><td colSpan={10} className="py-16 text-center text-[#6d7189]"><Package className="w-8 h-8 mx-auto text-[#c9cbd6] mb-2" aria-hidden /><p className="text-[14px]">{params.q || params.active !== 'all' ? 'No items match.' : 'There are no items yet. Add one, or import a CSV file.'}</p></td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="h-[44px] px-[25px] flex items-center justify-between text-[12px] text-[#6d7189] border-t border-[#ebeaf2] bg-white">
        <span>{data.showing === 0 ? 'No items' : `${first}–${last} of ${data.showing}`}</span>
        <div className="flex items-center gap-1">
          <button type="button" disabled={data.page <= 1} onClick={() => router.push(`/quotes/items${q(params, { page: data.page - 1 })}`)} aria-label="Previous page" className="w-7 h-7 flex items-center justify-center rounded border border-[#d7d5e1] hover:bg-[#f1f1fa] disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
          <span className="px-2">Page {data.page} of {data.pageCount}</span>
          <button type="button" disabled={data.page >= data.pageCount} onClick={() => router.push(`/quotes/items${q(params, { page: data.page + 1 })}`)} aria-label="Next page" className="w-7 h-7 flex items-center justify-center rounded border border-[#d7d5e1] hover:bg-[#f1f1fa] disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {editing && <ItemOverlay itemId={editing === 'new' ? null : editing.id} taxes={taxes} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); router.refresh(); }} />}
      {removing && (
        <Modal title="Delete item?" onClose={() => !busy && setRemoving(null)} busy={busy} width={440} footer={<><Button onClick={() => setRemoving(null)} disabled={busy}>Cancel</Button><Button kind="danger" onClick={remove} busy={busy}>Delete</Button></>}>
          <p className="text-[13px]">&ldquo;{removing.name}&rdquo; will be removed from the catalogue. Quotes that already use it keep their own copy of its name and rate.</p>
        </Modal>
      )}
      {imported && (
        <Modal title="Import finished" onClose={() => setImported(null)} width={520} footer={<Button kind="blue" onClick={() => setImported(null)}>OK</Button>}>
          <p className="text-[13px]">{imported.created} added, {imported.updated} updated, {imported.skipped} skipped.</p>
          {imported.notes.length > 0 && <ul className="mt-3 text-[12px] text-[#6d7189] list-disc pl-5 space-y-1 max-h-[240px] overflow-y-auto">{imported.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
        </Modal>
      )}
    </div>
  );
}
