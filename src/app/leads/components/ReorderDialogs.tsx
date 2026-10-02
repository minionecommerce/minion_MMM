'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Loader2, X } from 'lucide-react';
import type { LeadFieldDto } from '@/lib/leads/layout-shared';
import { callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';

type Item = { id: string; label: string; hint?: string };

// A list you can reorder by dragging the handle or with the arrow buttons (so it works with a keyboard too).
function ReorderList({ items, saveLabel, onSave }: { items: Item[]; saveLabel: string; onSave: (orderedIds: string[]) => Promise<void> }) {
  const [order, setOrder] = useState(items);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const changed = order.some((o, i) => o.id !== items[i]?.id);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length || from === to) return;
    setOrder(cur => { const next = [...cur]; const [x] = next.splice(from, 1); next.splice(to, 0, x); return next; });
  };

  const save = async () => {
    setBusy(true);
    try { await onSave(order.map(o => o.id)); } finally { setBusy(false); }
  };

  return (
    <div>
      <ul className="border border-gray-200 rounded-md divide-y divide-gray-100 max-h-[52vh] overflow-y-auto bg-white">
        {order.map((it, i) => (
          <li
            key={it.id}
            draggable
            onDragStart={() => setDragging(i)}
            onDragOver={e => { e.preventDefault(); setOver(i); }}
            onDragEnd={() => { setDragging(null); setOver(null); }}
            onDrop={e => { e.preventDefault(); if (dragging !== null) move(dragging, i); setDragging(null); setOver(null); }}
            className={`flex items-center gap-2 px-2.5 h-[42px] ${over === i && dragging !== null && dragging !== i ? 'bg-[#fff8dc]' : ''} ${dragging === i ? 'opacity-50' : ''}`}
          >
            <GripVertical className="w-4 h-4 text-gray-400 cursor-grab shrink-0" aria-hidden />
            <span className="w-6 text-[12px] text-gray-400 tabular-nums shrink-0">{i + 1}</span>
            <span className="flex-1 min-w-0 truncate text-[14px] text-gray-900" title={it.label}>{it.label}</span>
            {it.hint && <span className="text-[11px] text-gray-400 shrink-0 hidden sm:block">{it.hint}</span>}
            <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0 || busy} aria-label={`Move ${it.label} up`} className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
            <button type="button" onClick={() => move(i, i + 1)} disabled={i === order.length - 1 || busy} aria-label={`Move ${it.label} down`} className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
          </li>
        ))}
        {order.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-gray-500">Nothing to reorder here.</li>}
      </ul>
      <div className="flex justify-end mt-4">
        <button type="button" onClick={save} disabled={!changed || busy} className="inline-flex items-center gap-2 px-5 h-[40px] rounded-md bg-[#f5b800] hover:bg-[#e0a800] text-black text-[14px] font-semibold disabled:opacity-50">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}{saveLabel}
        </button>
      </div>
    </div>
  );
}

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={title} className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div><h3 className="text-[18px] font-bold text-[#333]">{title}</h3><p className="text-[12px] text-gray-500 mt-0.5">{subtitle}</p></div>
          <button onClick={onClose} aria-label="Close" className="text-gray-500 hover:text-black"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// 1. Order of the fields on the Add / Edit Lead form
export function FormFieldsReorder({ fields, onSaved, onClose }: { fields: LeadFieldDto[]; onSaved: (fields: LeadFieldDto[]) => void; onClose: () => void }) {
  const toast = useToast();
  const items = fields.map(f => ({ id: f.id, label: f.label, hint: f.isSystem ? undefined : 'Custom' }));
  return (
    <Modal title="Reorder form fields" subtitle="The order of the fields on the Add Lead and Edit Lead form." onClose={onClose}>
      <ReorderList items={items} saveLabel="Save order" onSave={async ids => {
        try {
          await callApi('/api/leads/layout/fields/order', 'PUT', { orderedIds: ids });
          const { fields: next } = await callApi<{ fields: LeadFieldDto[] }>('/api/leads/layout', 'GET');
          toast.success('Form field order saved');
          onSaved(next);
          onClose();
        } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save the order'); }
      }} />
    </Modal>
  );
}

// 2. Order of the columns on the Leads page (the Actions column always stays last)
export function ColumnsReorder({ columns, onSaved, onClose }: { columns: { id: string; label: string }[]; onSaved: (order: string[]) => void; onClose: () => void }) {
  const toast = useToast();
  return (
    <Modal title="Reorder lead page columns" subtitle="The order of the columns on the Leads page. Actions always stays last." onClose={onClose}>
      <ReorderList items={columns} saveLabel="Save order" onSave={async ids => {
        try {
          await callApi('/api/leads/layout/columns', 'PUT', { order: ids });
          toast.success('Column order saved');
          onSaved(ids);
          onClose();
        } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save the order'); }
      }} />
    </Modal>
  );
}

type Option = { id: string; label: string; parentId: string | null; sortOrder: number };

// 3. Order of the options inside a dropdown
export function DropdownsReorder({ fields, onClose }: { fields: LeadFieldDto[]; onClose: () => void }) {
  const toast = useToast();
  const lists = fields.filter(f => f.type === 'DROPDOWN');
  const [fieldId, setFieldId] = useState(lists[0]?.id ?? '');
  const field = lists.find(f => f.id === fieldId);
  const parentField = field?.parentOptionType ? fields.find(f => f.optionType === field.parentOptionType) ?? null : null;
  const [parentId, setParentId] = useState('');
  const [data, setData] = useState<{ fieldId: string; options: Option[]; parents: Option[] } | null>(null);
  const [error, setError] = useState('');
  const options = data?.fieldId === fieldId ? data.options : null;
  const parents = data?.fieldId === fieldId ? data.parents : [];

  const load = async (id: string, parent: LeadFieldDto | null) => {
    setError('');
    try {
      const [own, up] = await Promise.all([
        callApi<{ options: Option[] }>(`/api/leads/layout/fields/${id}/options`, 'GET'),
        parent ? callApi<{ options: Option[] }>(`/api/leads/layout/fields/${parent.id}/options`, 'GET') : Promise.resolve({ options: [] as Option[] }),
      ]);
      setData({ fieldId: id, options: own.options, parents: up.options });
      setParentId(cur => (parent ? (up.options.some(p => p.id === cur) ? cur : up.options[0]?.id ?? '') : ''));
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load the options'); }
  };

  useEffect(() => {
    if (!fieldId) return;
    let live = true;
    (async () => { if (live) await load(fieldId, parentField); })();
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldId]);

  const shown = (options ?? []).filter(o => (parentField ? o.parentId === parentId : true)).sort((a, b) => a.sortOrder - b.sortOrder);
  const items = shown.map(o => ({ id: o.id, label: o.label }));

  return (
    <Modal title="Reorder dropdown options" subtitle="Choose a dropdown, then change the order its options are listed in." onClose={onClose}>
      <div className="space-y-3 mb-4">
        <label className="block text-[12px] font-semibold text-gray-600">Dropdown
          <select value={fieldId} onChange={e => setFieldId(e.target.value)} className="mt-1 w-full border border-gray-300 rounded px-2.5 h-[38px] text-[14px] font-normal text-gray-900 bg-white focus:outline-none focus:border-[#f5b800]">
            {lists.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </label>
        {parentField && (
          <label className="block text-[12px] font-semibold text-gray-600">Options under ({parentField.label})
            <select value={parentId} onChange={e => setParentId(e.target.value)} className="mt-1 w-full border border-gray-300 rounded px-2.5 h-[38px] text-[14px] font-normal text-gray-900 bg-white focus:outline-none focus:border-[#f5b800]">
              {parents.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>
        )}
      </div>
      {error && <p role="alert" className="text-[13px] text-[#d9232b]">{error}</p>}
      {!options && !error && <div className="py-8 flex justify-center text-gray-500"><Loader2 className="w-5 h-5 animate-spin" /></div>}
      {options && (
        <ReorderList key={`${fieldId}-${parentId}`} items={items} saveLabel="Save order" onSave={async ids => {
          try {
            await callApi(`/api/leads/layout/fields/${fieldId}/options/order`, 'PUT', { orderedIds: ids });
            toast.success(`${field?.label ?? 'Dropdown'} order saved`);
            await load(fieldId, parentField);
          } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save the order'); }
        }} />
      )}
    </Modal>
  );
}
