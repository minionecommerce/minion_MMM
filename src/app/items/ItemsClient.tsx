'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ChevronsUpDown, ArrowDown, ArrowUp, Download, MoreHorizontal, Package, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import { callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import { formatMoney } from '@/lib/quotes/format';
import type { ItemListParams, ItemSort } from '@/lib/quotes/catalog';
import type { DisplaySettings, ItemDto, QuoteAbilities, TaxDef } from '@/lib/quotes/types';
import ItemOverlay from '../quotes/ItemOverlay';
import { itemImageSrc } from '../quotes/item-client';
import { Button, Menu, MenuItem, Modal } from '../quotes/ui';
import ImportItems from './ImportItems';

type Data = { rows: ItemDto[]; total: number; showing: number; page: number; pageCount: number; pageSize: number };
type Params = ItemListParams & { active: 'all' | 'active' | 'inactive' };
const EXPORT_URL = '/api/quotes/items/export'; // a file download, not a page

const query = (p: Params, patch: Partial<Params>) => {
  const m = { ...p, ...patch };
  const sp = new URLSearchParams();
  if (m.q) sp.set('q', m.q);
  if (m.active !== 'all') sp.set('active', m.active);
  if (m.kind) sp.set('kind', m.kind);
  if (m.sort) { sp.set('sort', m.sort); if (m.dir === 'desc') sp.set('dir', 'desc'); }
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
  const [importing, setImporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const go = (patch: Partial<Params>) => router.push(`/items${query(params, { page: 1, ...patch })}`);
  const taxName = (id: string | null) => taxes.find(t => t.id === id)?.name ?? '';

  useEffect(() => {
    if ((term.trim() || '') === (params.q ?? '')) return;
    const t = setTimeout(() => router.replace(`/items${query(params, { q: term.trim() || undefined, page: 1 })}`), 350);
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

  // A click on a heading sorts by it (ascending, then descending)
  const sortBy = (key: ItemSort) => go({ sort: key, dir: params.sort === key && (params.dir ?? 'asc') === 'asc' ? 'desc' : 'asc' });
  const sorted = (key: ItemSort) => (params.sort ?? 'name') === key;
  const head = (key: ItemSort, label: string, extra = '') => (
    <th className={`${extra} font-medium`} aria-sort={sorted(key) ? ((params.dir ?? 'asc') === 'asc' ? 'ascending' : 'descending') : undefined}>
      <button type="button" onClick={() => sortBy(key)} className={`inline-flex items-center gap-1 uppercase hover:text-[#22263b] ${sorted(key) ? 'text-[#22263b]' : ''}`} data-sort={key}>
        {label}
        {sorted(key) ? ((params.dir ?? 'asc') === 'asc' ? <ArrowUp className="w-3 h-3" aria-hidden /> : <ArrowDown className="w-3 h-3" aria-hidden />) : <ChevronsUpDown className="w-3 h-3 text-[#c9cbd6]" aria-hidden />}
      </button>
    </th>
  );

  const filtered = !!params.q || params.active !== 'all' || !!params.kind;
  const first = data.showing === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const last = Math.min(data.showing, data.page * data.pageSize);
  const select = 'h-[30px] px-2 text-[12.5px] border border-[#d7d5e1] rounded-[4px] bg-white';

  return (
    <div className="min-h-screen flex flex-col">
      <div className="min-h-[55px] px-[25px] py-2 flex flex-wrap items-center gap-3">
        <h1 className="text-[18px] font-semibold text-[#222529]" data-items-title>Items</h1>
        <span className="text-[12px] text-[#6d7189]">{data.total.toLocaleString('en-IN')} in all</span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9ca0ab] absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden />
            <input value={term} onChange={e => setTerm(e.target.value)} placeholder="Search name, SKU, HSN/SAC, brand, Item ID" aria-label="Search items" className="w-[290px] h-[30px] pl-8 pr-2 text-[12.5px] border border-[#d7d5e1] rounded-[4px] focus:outline-none focus:border-[#548df6]" />
          </div>
          <select value={params.active} onChange={e => go({ active: e.target.value as Params['active'] })} aria-label="Status" className={select}>
            <option value="all">All items</option><option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
          <select value={params.kind ?? ''} onChange={e => go({ kind: (e.target.value || undefined) as Params['kind'] })} aria-label="Type" className={select}>
            <option value="">Goods and Services</option><option value="Goods">Goods</option><option value="Service">Services</option>
          </select>
          {abilities.create && <button type="button" onClick={() => setEditing('new')} className="inline-flex items-center gap-1.5 h-[32px] px-[11px] rounded-[4px] bg-[#548df6] hover:bg-[#4a82ea] text-white text-[13px] font-medium" data-add-item><Plus className="w-4 h-4" /> Add Item</button>}
          {((abilities.create && abilities.edit) || abilities.export) && (
            <Menu align="right" width={210} trigger={({ toggle }) => (
              <button type="button" onClick={toggle} aria-label="More" aria-haspopup="menu" className="w-[32px] h-[32px] rounded-[4px] border border-[#d7d5e1] hover:bg-[#f1f1fa] flex items-center justify-center" data-items-more><MoreHorizontal className="w-4 h-4" /></button>
            )}>
              {close => (
                <>
                  {abilities.create && abilities.edit && <MenuItem icon={<Upload className="w-3.5 h-3.5" />} onClick={() => { close(); setImporting(true); }}>Import Items</MenuItem>}
                  {abilities.export && <a href={EXPORT_URL} download onClick={close} role="menuitem" className="w-full flex items-center gap-2 text-left px-3 h-[32px] hover:bg-[#f1f1fa]"><span className="w-4 flex items-center justify-center text-[#6d7189]"><Download className="w-3.5 h-3.5" /></span> Export Items</a>}
                </>
              )}
            </Menu>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-x-auto q-scroll">
        <table className="w-full min-w-[1100px] border-collapse">
          <thead>
            <tr className="h-[36px] bg-[#f9f9fb] border-y border-[#ebeaf2] text-[11px] tracking-[0.2px] text-[#6d7189]">
              {head('name', 'Name', 'text-left pl-[25px] pr-[15px]')}
              {head('category', 'Category', 'text-left px-[15px]')}
              {head('hsn', 'HSN/SAC', 'text-left px-[15px]')}
              {head('unit', 'Unit', 'text-left px-[15px]')}
              {head('rate', 'Rate', 'text-right px-[15px]')}
              <th className="text-left px-[15px] font-medium uppercase">Tax</th>
              {head('kind', 'Type', 'text-left px-[15px]')}
              <th className="text-left px-[15px] font-medium uppercase">Task Template</th>
              {head('status', 'Status', 'text-left px-[15px]')}
              <th className="w-[90px]" />
            </tr>
          </thead>
          <tbody>
            {data.rows.map(i => (
              <tr key={i.id} className="h-[46px] border-b border-[#ebeaf2] text-[13px] text-black hover:bg-[#fafafc]" data-item-row>
                <td className="pl-[25px] pr-[15px] max-w-[420px]">
                  <div className="flex items-center gap-[10px]">
                    {i.imageFileId && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={itemImageSrc(i.imageFileId)} alt="" className="w-[30px] h-[30px] shrink-0 rounded-[4px] object-cover border border-[#ebeaf2]" />
                    )}
                    <div className="min-w-0">
                      {abilities.edit
                        ? <button type="button" onClick={() => setEditing(i)} className="block max-w-full truncate text-left font-medium text-[#355bd4] hover:underline" title={i.name}>{i.name}</button>
                        : <div className="truncate font-medium" title={i.name}>{i.name}</div>}
                      {(i.description || i.sku) && <div className="truncate text-[12px] text-[#6d7189]" title={i.description}>{[i.sku && `SKU ${i.sku}`, i.description].filter(Boolean).join(' · ')}</div>}
                    </div>
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
              <tr><td colSpan={10} className="py-16 text-center text-[#6d7189]"><Package className="w-8 h-8 mx-auto text-[#c9cbd6] mb-2" aria-hidden /><p className="text-[14px]">{filtered ? 'No items match.' : 'There are no items yet.'}</p>{!filtered && abilities.create && <p className="mt-1 text-[13px]">Add an item, or import a CSV file with the three dots.</p>}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="h-[44px] px-[25px] flex items-center justify-between text-[12px] text-[#6d7189] border-t border-[#ebeaf2] bg-white">
        <span>{data.showing === 0 ? 'No items' : `${first.toLocaleString('en-IN')}–${last.toLocaleString('en-IN')} of ${data.showing.toLocaleString('en-IN')}`}</span>
        <div className="flex items-center gap-1">
          <button type="button" disabled={data.page <= 1} onClick={() => router.push(`/items${query(params, { page: data.page - 1 })}`)} aria-label="Previous page" className="w-7 h-7 flex items-center justify-center rounded border border-[#d7d5e1] hover:bg-[#f1f1fa] disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
          <span className="px-2">Page {data.page} of {data.pageCount}</span>
          <button type="button" disabled={data.page >= data.pageCount} onClick={() => router.push(`/items${query(params, { page: data.page + 1 })}`)} aria-label="Next page" className="w-7 h-7 flex items-center justify-center rounded border border-[#d7d5e1] hover:bg-[#f1f1fa] disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {editing && <ItemOverlay itemId={editing === 'new' ? null : editing.id} taxes={taxes} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); router.refresh(); }} />}
      {importing && <ImportItems onClose={() => { setImporting(false); router.refresh(); }} />}
      {removing && (
        <Modal title="Delete item?" onClose={() => !busy && setRemoving(null)} busy={busy} width={440} footer={<><Button onClick={() => setRemoving(null)} disabled={busy}>Cancel</Button><Button kind="danger" onClick={remove} busy={busy}>Delete</Button></>}>
          <p className="text-[13px]">&ldquo;{removing.name}&rdquo; will be removed from the Items module and from the item list of a quote. Quotes that already use it keep their own copy of its name and rate.</p>
        </Modal>
      )}
    </div>
  );
}
