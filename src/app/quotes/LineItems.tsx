'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, GripVertical, ImageIcon, MoreHorizontal, Plus, Search, X } from 'lucide-react';
import { callApi } from '@/lib/leads/client';
import type { LayoutField } from '@/lib/records/types';
import { formatAmount, formatMoney } from '@/lib/quotes/format';
import type { ItemDto, QuoteSettings } from '@/lib/quotes/types';
import QField, { type QCtx } from './QField';
import { Button, Menu, MenuItem, MenuRule, Modal, Spinner, inputClass, useDismiss } from './ui';
import { ItemModal } from './modals';
import { blankLine, isBlankLine, lineFromItem, newKey, type LineState } from './form-state';

const cell = 'w-full h-[34px] px-[8px] text-[13px] bg-transparent border border-transparent rounded-[4px] hover:border-[#d7d5e1] focus:border-[#548df6] focus:bg-white focus:outline-none';

// ---------------------------------------------------------------------------
// "Type or click to select an item": a box that lists the items of the catalogue under it
// ---------------------------------------------------------------------------
function ItemPicker({ id, value, invalid, onType, onPick, canAdd, onAddNew, display }: {
  id: string; value: string; invalid?: boolean; onType: (text: string) => void; onPick: (item: ItemDto) => void; canAdd: boolean; onAddNew: (name: string) => void; display: QuoteSettings['display'];
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [items, setItems] = useState<ItemDto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState(0);
  const [box, setBox] = useState<{ left: number; top: number; width: number } | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, wrap);

  // The list is placed on the screen (not inside the table) so the table never clips it
  const place = useCallback(() => {
    const r = input.current?.getBoundingClientRect();
    if (r) setBox({ left: r.left, top: r.bottom + 2, width: Math.max(r.width + 40, 380) });
  }, []);
  useEffect(() => {
    if (!open) return;
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => { window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place); };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    let live = true;
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const res = await callApi<{ items: ItemDto[] }>(`/api/quotes/items?picker=1&limit=100&q=${encodeURIComponent(typed)}`, 'GET');
        if (live) { setItems(res.items); setActive(0); setError(''); }
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : 'Could not load the items');
      } finally {
        if (live) setBusy(false);
      }
    }, typed ? 250 : 0);
    return () => { live = false; clearTimeout(t); };
  }, [typed, open]);

  const pick = (item: ItemDto) => { onPick(item); setOpen(false); setTyped(''); };

  return (
    <div ref={wrap} className="relative">
      <input
        ref={input}
        id={id}
        value={value}
        placeholder="Type or click to select an item."
        autoComplete="off"
        aria-label="Item details"
        aria-invalid={invalid || undefined}
        onFocus={() => { setTyped(''); setOpen(true); }}
        onBlur={e => { if (!wrap.current?.contains(e.relatedTarget as Node | null)) setOpen(false); }}
        onClick={() => { if (!open) { setTyped(''); setOpen(true); } }}
        onChange={e => { onType(e.target.value); setTyped(e.target.value); if (!open) setOpen(true); }}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(items.length - 1, a + 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
          else if (e.key === 'Enter' && open && items[active] && typed) { e.preventDefault(); pick(items[active]); }
          else if (e.key === 'Escape') setOpen(false);
        }}
        className={`w-full h-[34px] px-[10px] text-[13px] bg-white border rounded-[4px] placeholder:text-[#9ca0ab] focus:outline-none ${invalid ? 'border-[#e5484d]' : open ? 'border-[#548df6]' : 'border-[#d7d5e1] hover:border-[#9ca0ab]'}`}
      />
      {open && box && (
        <div style={{ position: 'fixed', left: box.left, top: box.top, width: box.width }} className="z-[60] bg-white border border-[#d7d5e1] rounded-[4px] shadow-[0_8px_24px_rgba(34,38,59,0.18)]">
          <ul role="listbox" aria-label="Items" className="max-h-[290px] overflow-y-auto q-scroll py-1">
            {busy && items.length === 0 && <li className="px-3 py-3 text-[13px] text-[#6d7189] flex items-center gap-2"><Spinner className="w-3.5 h-3.5" /> Loading items…</li>}
            {error && <li className="px-3 py-2 text-[13px] text-[#d9232b]">{error}</li>}
            {!busy && !error && items.length === 0 && <li className="px-3 py-3 text-[13px] text-[#6d7189]">{typed ? 'No item matches. Keep typing to use it as a one-off item.' : 'The catalogue has no items yet.'}</li>}
            {items.map((item, i) => (
              <li key={item.id} role="option" aria-selected={i === active} className={i > 0 && i !== active && i - 1 !== active ? 'border-t border-[#ebeaf2] mx-2' : ''}>
                <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => pick(item)} onMouseEnter={() => setActive(i)} className={`w-full text-left px-3 py-[7px] ${i === active ? 'bg-[#548df6] text-white' : ''}`}>
                  <span className={`block text-[13px] truncate ${i === active ? '' : 'text-[#22263b]'}`}>{item.name}</span>
                  <span className={`block text-[12px] ${i === active ? 'text-white/90' : 'text-[#6d7189]'}`}>Rate: {formatMoney(item.rate, display.currencySymbol, display.grouping)}</span>
                </button>
              </li>
            ))}
          </ul>
          {canAdd && (
            <div className="border-t border-[#ebeaf2]">
              <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => { setOpen(false); onAddNew(typed.trim()); }} className="w-full flex items-center gap-2 px-3 h-[32px] text-[13px] text-[#548df6] hover:bg-[#f1f1fa]"><Plus className="w-3.5 h-3.5" /> Add New Item</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Items in Bulk: tick items of the catalogue, add them all at once
// ---------------------------------------------------------------------------
function BulkModal({ display, onClose, onAdd }: { display: QuoteSettings['display']; onClose: () => void; onAdd: (items: ItemDto[]) => void }) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<ItemDto[]>([]);
  const [picked, setPicked] = useState<Map<string, ItemDto>>(new Map());
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const res = await callApi<{ items: ItemDto[] }>(`/api/quotes/items?picker=1&limit=200&q=${encodeURIComponent(q)}`, 'GET');
        if (live) { setItems(res.items); setError(''); }
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : 'Could not load the items');
      } finally {
        if (live) setBusy(false);
      }
    }, q ? 250 : 0);
    return () => { live = false; clearTimeout(t); };
  }, [q]);
  const toggle = (item: ItemDto) => setPicked(m => { const n = new Map(m); if (n.has(item.id)) n.delete(item.id); else n.set(item.id, item); return n; });
  return (
    <Modal title="Add Items in Bulk" onClose={onClose} width={640} footer={(
      <>
        <span className="mr-auto text-[13px] text-[#6d7189]">{picked.size} selected</span>
        <Button onClick={onClose}>Cancel</Button>
        <Button kind="blue" disabled={picked.size === 0} onClick={() => onAdd(Array.from(picked.values()))}>Add {picked.size || ''} Item{picked.size === 1 ? '' : 's'}</Button>
      </>
    )}>
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 text-[#9ca0ab] absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden />
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search items" aria-label="Search items" className={inputClass(false, 'pl-8')} />
        {busy && <Spinner className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca0ab]" />}
      </div>
      {error && <p className="text-[13px] text-[#d9232b]">{error}</p>}
      <ul className="border border-[#ebeaf2] rounded-[4px] divide-y divide-[#ebeaf2] max-h-[340px] overflow-y-auto q-scroll">
        {items.map(item => (
          <li key={item.id}>
            <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#f1f1fa]">
              <input type="checkbox" className="q-check" checked={picked.has(item.id)} onChange={() => toggle(item)} />
              <span className="min-w-0 flex-1"><span className="block text-[13px] truncate">{item.name}</span>{item.description && <span className="block text-[12px] text-[#6d7189] truncate">{item.description}</span>}</span>
              <span className="text-[13px] text-[#6d7189] whitespace-nowrap">{formatMoney(item.rate, display.currencySymbol, display.grouping)}</span>
            </label>
          </li>
        ))}
        {!busy && items.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-[#6d7189]">No items found</li>}
      </ul>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// The Item Table of the quote form
// ---------------------------------------------------------------------------
export default function LineItems({ title, lines, setLines, columns, settings, amounts, errors, ctx, canAddItem, aside, below }: {
  title: string;
  aside?: React.ReactNode; // beside the Add buttons (the calculation panel)
  below?: React.ReactNode; // at the bottom of the column of the Add buttons (the customer notes)
  lines: LineState[];
  setLines: (update: (cur: LineState[]) => LineState[]) => void;
  columns: LayoutField[]; // the enabled columns of the item table in the order of the layout
  settings: QuoteSettings;
  amounts: number[];
  errors: Record<string, string>;
  ctx: QCtx;
  canAddItem: boolean;
}) {
  const [bulk, setBulk] = useState(false);
  const [newItemFor, setNewItemFor] = useState<{ key: string; name: string } | null>(null);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const display = settings.display;

  const col = (key: string) => columns.find(c => c.key === key);
  const custom = columns.filter(c => !c.isSystem);
  const hsn = col('hsn'); const unit = col('unit'); const qty = col('quantity'); const rate = col('rate'); const tax = col('taxId'); const amount = col('lineAmount');
  const colCount = 2 + (hsn ? 1 : 0) + (unit ? 1 : 0) + (qty ? 1 : 0) + (rate ? 1 : 0) + (tax ? 1 : 0) + custom.length + (amount ? 1 : 0);

  const patch = (key: string, p: Partial<LineState>) => setLines(cur => cur.map(l => (l.key === key ? { ...l, ...p } : l)));
  const remove = (key: string) => setLines(cur => { const next = cur.filter(l => l.key !== key); return next.length ? next : [blankLine()]; });
  const insert = (index: number, line: LineState = blankLine()) => setLines(cur => [...cur.slice(0, index), line, ...cur.slice(index)]);
  const move = (from: string, to: string) => setLines(cur => {
    const a = cur.findIndex(l => l.key === from); const b = cur.findIndex(l => l.key === to);
    if (a < 0 || b < 0 || a === b) return cur;
    const next = cur.slice(); const [item] = next.splice(a, 1); next.splice(b, 0, item);
    return next;
  });
  const clone = (l: LineState, index: number) => insert(index + 1, { ...l, key: newKey(), id: undefined });
  const addMany = (items: ItemDto[]) => setLines(cur => {
    const keep = cur.length && isBlankLine(cur[cur.length - 1]) ? cur.slice(0, -1) : cur;
    return [...keep, ...items.map(i => lineFromItem(i))];
  });
  const taxOptions = (current: string) => settings.taxes.filter(t => t.active || t.id === current);
  const headerCls = 'text-left px-[10px] h-[44px] text-[12px] font-medium uppercase text-[#6d7189] whitespace-nowrap';

  return (
    <div>
      <div className="mr-[8px] ml-[30px] lg:mr-[125px] lg:ml-[20px] overflow-x-auto lg:overflow-visible pr-[78px] lg:pr-0">
        <div className="border border-[#ebeaf2] rounded-[6px] min-w-[780px] lg:min-w-0">
          <div className="h-[47px] px-[15px] flex items-center justify-between bg-[#f9f9fb] border-b border-[#ebeaf2] rounded-t-[6px]">
            <h2 className="text-[14px] font-semibold text-black">{title}</h2>
            <Menu align="right" width={190} trigger={({ toggle }) => (
              <button type="button" onClick={toggle} aria-haspopup="menu" className="inline-flex items-center gap-1.5 text-[13px] text-[#548df6] hover:underline"><CheckCircle2 className="w-4 h-4" /> Bulk Actions</button>
            )}>
              {close => (
                <>
                  <MenuItem onClick={() => { close(); setBulk(true); }}>Add Items in Bulk</MenuItem>
                  <MenuItem onClick={() => { close(); setLines(cur => cur.filter(l => !isBlankLine(l)).length ? cur.filter(l => !isBlankLine(l)) : [blankLine()]); }}>Remove empty rows</MenuItem>
                  <MenuRule />
                  <MenuItem danger onClick={() => { close(); setLines(() => [blankLine()]); }}>Clear all rows</MenuItem>
                </>
              )}
            </Menu>
          </div>
          <table className="w-full border-collapse" style={{ tableLayout: 'auto' }} data-item-table>
            <thead>
              <tr className="border-b border-[#ebeaf2]">
                <th className={`${headerCls} w-auto min-w-[260px]`}>{col('name')?.label ?? 'Item Details'}</th>
                {hsn && <th className={`${headerCls} w-[110px]`}>{hsn.label}</th>}
                {unit && <th className={`${headerCls} w-[80px]`}>{unit.label}</th>}
                {custom.map(c => <th key={c.key} className={`${headerCls} w-[130px]`}>{c.label}</th>)}
                {qty && <th className={`${headerCls} w-[140px] text-right`}>{qty.label}</th>}
                {rate && <th className={`${headerCls} w-[150px] text-right border-l border-[#ebeaf2]`}>{rate.label}</th>}
                {tax && <th className={`${headerCls} w-[180px] border-l border-[#ebeaf2]`}>{tax.label}</th>}
                {amount && <th className={`${headerCls} w-[140px] text-right border-l border-[#ebeaf2]`}>{amount.label}</th>}
                <th className="w-0 p-0" aria-hidden />
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const err = (k: string) => errors[`lines.${i}.${k}`];
                const rowErr = errors[`lines.${i}`];
                return (
                  <tr
                    key={l.key}
                    data-line-row
                    draggable={armed === l.key}
                    onDragStart={e => { setDragKey(l.key); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', l.key); } catch { /* some browsers refuse */ } }}
                    onDragOver={e => { if (dragKey) { e.preventDefault(); setOverKey(l.key); } }}
                    onDrop={e => { e.preventDefault(); if (dragKey) move(dragKey, l.key); setDragKey(null); setOverKey(null); setArmed(null); }}
                    onDragEnd={() => { setDragKey(null); setOverKey(null); setArmed(null); }}
                    className={`align-top border-b border-[#ebeaf2] last:border-b-0 ${overKey === l.key && dragKey !== l.key ? 'bg-[#f1f1fa]' : ''} ${dragKey === l.key ? 'opacity-50' : ''}`}
                  >
                    <td className="relative px-[10px] py-[10px]">
                      <button type="button" aria-label="Drag to move this row" onMouseDown={() => setArmed(l.key)} onMouseUp={() => setArmed(null)} className="absolute -left-[22px] top-[20px] w-[16px] h-[22px] flex items-center justify-center text-[#c9cbd6] hover:text-[#6d7189] cursor-grab"><GripVertical className="w-4 h-4" /></button>
                      <div className="flex items-start gap-2">
                        <div className="w-[34px] h-[34px] shrink-0 rounded-[4px] border border-[#ebeaf2] bg-[#f9f9fb] flex items-center justify-center text-[#c9cbd6]" aria-hidden><ImageIcon className="w-5 h-5" /></div>
                        <div className="flex-1 min-w-0">
                          <ItemPicker
                            id={`line-${i}-name`}
                            value={l.name}
                            invalid={!!err('name') || !!rowErr}
                            display={display}
                            canAdd={canAddItem}
                            onType={text => patch(l.key, { name: text, itemId: null })}
                            onPick={item => patch(l.key, { ...lineFromItem(item, l), quantity: l.quantity || '1' })}
                            onAddNew={name => setNewItemFor({ key: l.key, name })}
                          />
                          {(l.showDesc || l.description) && (
                            <textarea value={l.description} onChange={e => patch(l.key, { description: e.target.value })} rows={2} maxLength={2000} aria-label="Item description" placeholder="Add a description to your item" className={`${inputClass(!!err('description'))} h-auto mt-1 py-1 resize-y`} />
                          )}
                          {(err('name') || rowErr) && <p role="alert" className="mt-1 text-[12px] text-[#d9232b]">{err('name') ?? rowErr}</p>}
                        </div>
                      </div>
                    </td>
                    {hsn && <td className="px-[4px] py-[8px]"><input value={l.hsn} onChange={e => patch(l.key, { hsn: e.target.value })} maxLength={20} aria-label="HSN/SAC" className={`${cell} ${err('hsn') ? '!border-[#e5484d]' : ''}`} /></td>}
                    {unit && <td className="px-[4px] py-[8px]"><input value={l.unit} onChange={e => patch(l.key, { unit: e.target.value })} maxLength={20} aria-label="Unit" className={`${cell} ${err('unit') ? '!border-[#e5484d]' : ''}`} /></td>}
                    {custom.map(c => (
                      <td key={c.key} className="px-[4px] py-[8px]">
                        <QField f={c} compact id={`line-${i}-${c.key}`} value={l.custom[c.key] ?? (c.type === 'FILE' ? [] : '')} onChange={v => patch(l.key, { custom: { ...l.custom, [c.key]: v } })} error={errors[`lines.${i}.custom.${c.key}`]} ctx={ctx} />
                      </td>
                    ))}
                    {qty && (
                      <td className="px-[4px] py-[8px]">
                        <input value={l.quantity} onChange={e => patch(l.key, { quantity: e.target.value })} inputMode="decimal" aria-label="Quantity" aria-invalid={!!err('quantity') || undefined} className={`${cell} text-right text-[#2e3dba] ${err('quantity') ? '!border-[#e5484d]' : ''}`} />
                        {err('quantity') && <p role="alert" className="text-[12px] text-[#d9232b] text-right">{err('quantity')}</p>}
                      </td>
                    )}
                    {rate && (
                      <td className="px-[4px] py-[8px] border-l border-[#ebeaf2]">
                        <input value={l.rate} onChange={e => patch(l.key, { rate: e.target.value })} inputMode="decimal" placeholder="0.00" aria-label="Rate" aria-invalid={!!err('rate') || undefined} className={`${cell} text-right ${err('rate') ? '!border-[#e5484d]' : ''}`} />
                        {err('rate') && <p role="alert" className="text-[12px] text-[#d9232b] text-right">{err('rate')}</p>}
                      </td>
                    )}
                    {tax && (
                      <td className="px-[4px] py-[8px] border-l border-[#ebeaf2]">
                        <div className="relative">
                          <select value={l.taxId} onChange={e => patch(l.key, { taxId: e.target.value })} aria-label="Tax" className={`w-full h-[34px] pl-[10px] pr-8 text-[13px] rounded-[4px] border appearance-none bg-[#f9f9fb] focus:outline-none focus:border-[#548df6] ${err('taxId') ? 'border-[#e5484d]' : 'border-transparent hover:border-[#d7d5e1]'} ${l.taxId ? 'text-[#22263b]' : 'text-[#9ca0ab]'}`}>
                            <option value="">Select a Tax</option>
                            {taxOptions(l.taxId).map(t => <option key={t.id} value={t.id}>{t.name} [{t.rate}%]</option>)}
                          </select>
                          <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6d7189] pointer-events-none" aria-hidden />
                        </div>
                      </td>
                    )}
                    {amount && <td className="relative px-[10px] py-[10px] border-l border-[#ebeaf2] text-right text-[13px] font-semibold text-black pt-[18px]" data-line-amount>{formatAmount(amounts[i] ?? 0, display.grouping)}</td>}
                    <td className="relative w-0 p-0">
                      <div className="absolute left-[14px] top-[14px] flex items-center gap-[8px]">
                        <Menu align="left" width={190} trigger={({ toggle }) => (
                          <button type="button" onClick={toggle} aria-label="Row options" aria-haspopup="menu" className="w-[26px] h-[26px] rounded-full border border-[#d7d5e1] bg-white flex items-center justify-center text-[#6d7189] hover:bg-[#f1f1fa]"><MoreHorizontal className="w-4 h-4" /></button>
                        )}>
                          {close => (
                            <>
                              <MenuItem onClick={() => { close(); patch(l.key, { showDesc: true }); }}>Add description</MenuItem>
                              <MenuItem onClick={() => { close(); clone(l, i); }}>Clone</MenuItem>
                              <MenuItem onClick={() => { close(); insert(i); }}>Insert new row above</MenuItem>
                              <MenuItem onClick={() => { close(); insert(i + 1); }}>Insert new row below</MenuItem>
                            </>
                          )}
                        </Menu>
                        <button type="button" onClick={() => remove(l.key)} aria-label="Remove this row" className="w-[26px] h-[26px] rounded-full border border-[#f3c2c4] bg-white flex items-center justify-center text-[#e5484d] hover:bg-[#fdeeee]"><X className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot><tr><td colSpan={colCount} className="p-0 h-0" /></tr></tfoot>
          </table>
        </div>
      </div>

      <div className="mt-[20px] ml-[20px] mr-[20px] lg:mr-[125px] flex flex-col lg:flex-row lg:items-stretch justify-between gap-[30px]">
      <div className="min-w-0 flex-1 flex flex-col justify-between gap-6">
      <div className="flex items-center gap-[12px]">
        <div className="inline-flex h-[32px] rounded-[4px] bg-[#f1f1fa] text-[13px] font-medium text-[#548df6]">
          <button type="button" onClick={() => setLines(cur => [...cur, blankLine()])} className="inline-flex items-center gap-[8px] px-[12px] hover:bg-[#e8e8f6] rounded-l-[4px]"><Plus className="w-4 h-4 rounded-full bg-[#548df6] text-white p-[2px]" /> Add New Row</button>
          <Menu align="left" width={170} trigger={({ toggle }) => (
            <button type="button" onClick={toggle} aria-label="More ways to add rows" aria-haspopup="menu" className="h-full w-9 flex items-center justify-center border-l border-white hover:bg-[#e8e8f6] rounded-r-[4px]"><ChevronDown className="w-4 h-4" /></button>
          )}>
            {close => <MenuItem onClick={() => { close(); setLines(cur => [...cur, blankLine(), blankLine(), blankLine(), blankLine(), blankLine()]); }}>Add 5 new rows</MenuItem>}
          </Menu>
        </div>
        <button type="button" onClick={() => setBulk(true)} className="inline-flex items-center gap-[8px] h-[32px] px-[12px] rounded-[4px] bg-[#f1f1fa] hover:bg-[#e8e8f6] text-[13px] font-medium text-[#548df6]"><Plus className="w-4 h-4 rounded-full bg-[#548df6] text-white p-[2px]" /> Add Items in Bulk</button>
      </div>
      {below}
      </div>
      {aside && <div className="w-full lg:w-[520px] lg:mr-[9px] shrink-0">{aside}</div>}
      </div>

      {bulk && <BulkModal display={display} onClose={() => setBulk(false)} onAdd={items => { addMany(items); setBulk(false); }} />}
      {newItemFor && (
        <ItemModal
          item={undefined}
          taxes={settings.taxes}
          onClose={() => setNewItemFor(null)}
          initialName={newItemFor.name}
          onSaved={item => { patch(newItemFor.key, lineFromItem(item, lines.find(l => l.key === newItemFor.key) ?? blankLine())); setNewItemFor(null); }}
        />
      )}
    </div>
  );
}
