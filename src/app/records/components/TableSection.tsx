'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowUp, Copy, GripVertical, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { MAX_ROWS, type LayoutField } from '@/lib/records/types';
import { newRowKey, toFormValue } from '../client';
import FieldInput, { type FieldCtx } from './FieldInput';

// One row of a table section (Price Detail, Remarks): `id` is set for a row that is already saved
export type RowState = { key: string; id?: string; values: Record<string, unknown> };
// Every change is an update function, so something that finishes later (a file upload) never writes over what was typed meanwhile
export type RowsUpdate = (update: (rows: RowState[]) => RowState[]) => void;

const WIDTH: Record<string, string> = {
  TEXT: 'min-w-[190px]', TEXTAREA: 'min-w-[240px]', DROPDOWN: 'min-w-[170px]', CURRENCY: 'min-w-[140px]', NUMBER: 'min-w-[130px]',
  FILE: 'min-w-[200px]', DATE: 'min-w-[150px]', CHECKBOX: 'min-w-[90px]', EMAIL: 'min-w-[200px]', PHONE: 'min-w-[170px]', URL: 'min-w-[200px]',
};

// `key` is given for the first row of a form, which is drawn on the server and again in the browser: it must be the same in both
export function newRow(fields: LayoutField[], initial: (f: LayoutField) => unknown, key: string = newRowKey()): RowState {
  return { key, values: Object.fromEntries(fields.map(f => [f.key, initial(f)])) };
}

// The rows of a table section as a grid of small inputs, with "+ Add row". Each row has a drag handle and a menu
// (move, duplicate, delete) like the reference screens.
export default function TableSection({ sectionId, fields, rows, onChange, errors, ctx, initial }: {
  sectionId: string;
  fields: LayoutField[]; // the enabled columns, in order
  rows: RowState[];
  onChange: RowsUpdate;
  errors: Record<string, string>; // `${rowKey}:${fieldKey}` -> message
  ctx: FieldCtx;
  initial: (f: LayoutField) => unknown;
}) {
  const [dragging, setDragging] = useState<string | null>(null); // the key of the row being dragged
  const [over, setOver] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ key: string; top: number; right: number } | null>(null);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const key = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', key);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('scroll', close, true); window.removeEventListener('resize', close); };
  }, [menu]);

  // Moves the row with this key to a position (drag and drop) or by a number of places (the menu)
  const shift = (key: string, place: (from: number, length: number) => number) => onChange(prev => {
    const from = prev.findIndex(r => r.key === key);
    const to = from < 0 ? -1 : place(from, prev.length);
    if (from < 0 || to < 0 || to >= prev.length || from === to) return prev;
    const next = [...prev];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    return next;
  });
  const setCell = (key: string, field: string, value: unknown) =>
    onChange(prev => prev.map(r => (r.key === key ? { ...r, values: { ...r.values, [field]: value } } : r)));
  const duplicate = (key: string) => onChange(prev => {
    const at = prev.findIndex(r => r.key === key);
    if (at < 0 || prev.length >= MAX_ROWS) return prev;
    // Files are not copied: they belong to the row they were uploaded for
    const values = Object.fromEntries(fields.map(f => [f.key, f.type === 'FILE' ? [] : prev[at].values[f.key]]));
    const next = [...prev];
    next.splice(at + 1, 0, { key: newRowKey(), values });
    return next;
  });
  const remove = (key: string) => onChange(prev => prev.filter(r => r.key !== key));
  const add = () => onChange(prev => (prev.length < MAX_ROWS ? [...prev, newRow(fields, initial)] : prev));

  const item = 'w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-100 text-left disabled:opacity-40 disabled:hover:bg-transparent';
  const menuIndex = menu ? rows.findIndex(r => r.key === menu.key) : -1;

  return (
    <div>
      <div className="border border-gray-200 rounded-lg overflow-x-auto bg-white">
        <table className="w-full border-collapse" data-table-section={sectionId}>
          <thead className="bg-[#f6f7f9]">
            <tr>
              <th className="w-[76px] border-b border-gray-200" aria-label="Row controls" />
              {fields.map(f => (
                <th key={f.key} scope="col" className={`${WIDTH[f.type] ?? 'min-w-[180px]'} px-2 py-2.5 text-left text-[13px] font-semibold text-[#333] border-b border-gray-200`}>
                  {f.label}{f.required && <span className="text-[#d9232b]"> *</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={fields.length + 1} className="px-3 py-6 text-center text-[13px] text-gray-500">No rows yet. Click <b>+ Add row</b>.</td></tr>
            )}
            {rows.map((row, i) => (
              <tr
                key={row.key}
                data-row
                onDragOver={e => { if (dragging !== null) { e.preventDefault(); setOver(row.key); } }}
                onDrop={e => { e.preventDefault(); if (dragging !== null) shift(dragging, () => i); setDragging(null); setOver(null); }}
                className={`align-top border-b border-gray-100 last:border-b-0 ${over === row.key && dragging !== null && dragging !== row.key ? 'bg-[#fff8dc]' : ''} ${dragging === row.key ? 'opacity-50' : ''}`}
              >
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1 h-[38px]">
                    <span
                      draggable
                      onDragStart={() => setDragging(row.key)}
                      onDragEnd={() => { setDragging(null); setOver(null); }}
                      className="w-5 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-grab active:cursor-grabbing"
                      title="Drag to reorder"
                      aria-hidden
                    >
                      <GripVertical className="w-4 h-4" />
                    </span>
                    <button
                      type="button"
                      aria-label={`Row ${i + 1} options`}
                      aria-haspopup="menu"
                      onClick={e => { const r = e.currentTarget.getBoundingClientRect(); setMenu(m => (m?.key === row.key ? null : { key: row.key, top: r.bottom + 4, right: window.innerWidth - r.right })); }}
                      className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-black"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                {fields.map(f => {
                  const err = errors[`${row.key}:${f.key}`];
                  return (
                    <td key={f.key} className="px-2 py-2">
                      <FieldInput
                        field={f}
                        value={row.values[f.key] ?? (row.id ? toFormValue(f, null) : initial(f))}
                        onChange={v => setCell(row.key, f.key, v)}
                        error={err}
                        ctx={ctx}
                        compact
                        htmlId={`row-${row.key}-${f.key}`}
                      />
                      {err && <p id={`row-${row.key}-${f.key}-error`} role="alert" className="mt-1 text-[12px] text-[#d9232b]">{err}</p>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={add} disabled={rows.length >= MAX_ROWS} className="mt-3 inline-flex items-center gap-1.5 px-3 h-[36px] rounded-md border border-[#2d4aa8] bg-[#eaf0ff] hover:bg-[#dde7ff] text-[13px] font-semibold text-[#1f3a8a] disabled:opacity-50">
        <Plus className="w-4 h-4" /> Add row
      </button>

      {menu && menuIndex >= 0 && createPortal(
        <>
          <div className="fixed inset-0 z-[70]" onClick={() => setMenu(null)} />
          <div role="menu" data-light-native style={{ top: menu.top, right: menu.right }} className="fixed z-[71] w-44 bg-white border border-gray-200 rounded-lg shadow-xl py-1">
            <button role="menuitem" className={item} disabled={menuIndex === 0} onClick={() => { shift(menu.key, from => from - 1); setMenu(null); }}><ArrowUp className="w-4 h-4" /> Move up</button>
            <button role="menuitem" className={item} disabled={menuIndex === rows.length - 1} onClick={() => { shift(menu.key, from => from + 1); setMenu(null); }}><ArrowDown className="w-4 h-4" /> Move down</button>
            <button role="menuitem" className={item} disabled={rows.length >= MAX_ROWS} onClick={() => { duplicate(menu.key); setMenu(null); }}><Copy className="w-4 h-4" /> Duplicate row</button>
            <button role="menuitem" className={`${item} text-[#d9232b] hover:bg-red-50`} onClick={() => { remove(menu.key); setMenu(null); }}><Trash2 className="w-4 h-4" /> Delete row</button>
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}
