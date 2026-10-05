'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, GripVertical, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { LeadFieldDto } from '@/lib/leads/layout-shared';
import { OPTION_LABEL_MAX } from '@/lib/leads/layout-shared';
import { callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import LightConfirm from './LightConfirm';

type Option = { id: string; label: string; parentId: string | null; sortOrder: number; usage?: number };

const box = 'border border-gray-300 rounded px-2.5 h-[34px] text-[13px] text-gray-900 bg-white focus:outline-none focus:border-[#f5b800]';
const ib = 'w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:text-black hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent';

// The siblings of one list take the new order; each keeps the slot (position and sort value) the previous one held
function applyOrder(list: Option[], ids: string[]): Option[] {
  const slot = new Set(ids);
  const byId = new Map(list.map(o => [o.id, o]));
  const sorts = list.filter(o => slot.has(o.id)).map(o => o.sortOrder).sort((a, b) => a - b);
  let n = 0;
  return list.map(o => {
    if (!slot.has(o.id)) return o;
    const next = { ...byId.get(ids[n])!, sortOrder: sorts[n] };
    n += 1;
    return next;
  });
}

// Add / rename / reorder / delete the options of a pick-list field. Every change is saved straight away.
export default function OptionsEditor({ field, parentField, onChanged, noun = 'lead' }: {
  field: LeadFieldDto;
  parentField: LeadFieldDto | null; // for levelled lists (Category under Main Category)
  onChanged: (options: Option[]) => void;
  noun?: string; // what the options are used by: 'lead' (default) or 'deal'
}) {
  const toast = useToast();
  const [options, setOptions] = useState<Option[] | null>(null);
  const [parents, setParents] = useState<Option[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState('');
  const [parentId, setParentId] = useState('');
  const [editing, setEditing] = useState<{ id: string; label: string } | null>(null);
  const [removing, setRemoving] = useState<{ option: Option; usage: number } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const [own, up] = await Promise.all([
        callApi<{ options: Option[] }>(`/api/leads/layout/fields/${field.id}/options`, 'GET'),
        parentField ? callApi<{ options: Option[] }>(`/api/leads/layout/fields/${parentField.id}/options`, 'GET') : Promise.resolve({ options: [] as Option[] }),
      ]);
      setOptions(own.options);
      setParents(up.options);
      onChanged(own.options);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the options');
    }
  }, [field.id, parentField, onChanged]);

  useEffect(() => {
    let live = true;
    (async () => { if (live) await load(); })();
    return () => { live = false; };
  }, [load]);

  const act = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true);
    try {
      await fn();
      await load();
      if (ok) toast.success(ok);
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = async () => {
    if (!label.trim()) return;
    const done = await act(() => callApi(`/api/leads/layout/fields/${field.id}/options`, 'POST', { label, ...(parentField ? { parentId } : {}) }), `Added "${label.trim()}"`);
    if (done) setLabel('');
  };

  const rename = async (o: Option, next: string) => {
    if (next.trim() === o.label) { setEditing(null); return; }
    const done = await act(() => callApi(`/api/leads/layout/options/${o.id}`, 'PATCH', { label: next }), 'Option renamed');
    if (done) setEditing(null);
  };

  // Drag a row (or press the arrow keys on its handle) to a new place among the options of the same list; saved straight away
  const reorder = async (moved: Option, target: Option, keepFocus = false) => {
    if (!options || moved.id === target.id || moved.parentId !== target.parentId) return;
    const ids = options.filter(x => x.parentId === moved.parentId).sort((a, b) => a.sortOrder - b.sortOrder).map(x => x.id);
    const to = ids.indexOf(target.id);
    ids.splice(ids.indexOf(moved.id), 1);
    ids.splice(to, 0, moved.id); // the dragged option takes the place of the one it is dropped on
    setOptions(cur => (cur ? applyOrder(cur, ids) : cur));
    setBusy(true);
    try {
      await callApi(`/api/leads/layout/fields/${field.id}/options/order`, 'PUT', { orderedIds: ids });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save the order');
    } finally {
      await load();
      setBusy(false);
      if (keepFocus) requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-grip="${moved.id}"]`)?.focus());
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      await callApi(`/api/leads/layout/options/${removing.option.id}`, 'DELETE', { confirm: true });
      toast.success(`Deleted "${removing.option.label}"`);
      setRemoving(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete');
      setRemoving(null);
    } finally {
      setBusy(false);
    }
  };

  const rows = useMemo(() => {
    if (!options) return [];
    if (!parentField) return options.map(o => ({ o, heading: null as string | null }));
    const order = new Map(parents.map((p, i) => [p.id, i]));
    return [...options]
      .sort((a, b) => (order.get(a.parentId ?? '') ?? 999) - (order.get(b.parentId ?? '') ?? 999) || a.sortOrder - b.sortOrder)
      .map((o, i, arr) => ({ o, heading: i === 0 || arr[i - 1].parentId !== o.parentId ? (parents.find(p => p.id === o.parentId)?.label ?? '—') : null }));
  }, [options, parents, parentField]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        {parentField && (
          <select value={parentId} onChange={e => setParentId(e.target.value)} aria-label={`Belongs to (${parentField.label})`} className={`${box} sm:w-52`}>
            <option value="">Belongs to… ({parentField.label})</option>
            {parents.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        )}
        <input value={label} onChange={e => setLabel(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} maxLength={OPTION_LABEL_MAX} placeholder="New option" aria-label="New option" className={`${box} flex-1`} />
        <button type="button" onClick={add} disabled={busy || !label.trim() || (!!parentField && !parentId)} className="inline-flex items-center justify-center gap-1.5 px-3 h-[34px] rounded bg-[#f5b800] hover:bg-[#e0a800] text-black text-[13px] font-semibold disabled:opacity-50">
          <Plus className="w-4 h-4" /> Add option
        </button>
      </div>

      <div className="border border-gray-200 rounded-md bg-gray-50 max-h-64 overflow-y-auto">
        {error ? <p className="p-3 text-[13px] text-[#d9232b]">{error}</p>
          : options === null ? <div className="p-6 flex justify-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
          : options.length === 0 ? <p className="p-4 text-[13px] text-gray-500 text-center">No options yet. Add the first one above.</p>
          : (
            <ul className="divide-y divide-gray-200">
              {rows.map(({ o, heading }) => {
                const siblings = options.filter(x => x.parentId === o.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
                const idx = siblings.findIndex(x => x.id === o.id);
                const isEditing = editing?.id === o.id;
                const dropHere = over === o.id && dragging !== null && dragging !== o.id;
                const grab = (to: number) => { const t = siblings[to]; if (t) reorder(o, t, true); };
                return (
                  <li key={o.id}>
                    {heading && <div className="px-3 py-1 bg-gray-100 text-[11px] font-bold tracking-wide text-gray-500">{heading}</div>}
                    <div
                      draggable={!isEditing && !busy}
                      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', o.id); setDragging(o.id); }}
                      onDragOver={e => { if (dragging === null) return; const from = options.find(x => x.id === dragging); if (from && from.parentId === o.parentId) { e.preventDefault(); setOver(o.id); } }}
                      onDragEnd={() => { setDragging(null); setOver(null); }}
                      onDrop={e => { e.preventDefault(); const from = options.find(x => x.id === dragging); setDragging(null); setOver(null); if (from) reorder(from, o); }}
                      className={`flex items-center gap-2 px-2 py-1.5 ${dropHere ? 'bg-[#fff8dc]' : 'bg-white'} ${dragging === o.id ? 'opacity-50' : ''}`}
                    >
                      <button
                        type="button"
                        data-grip={o.id}
                        disabled={busy}
                        onKeyDown={e => { if (e.key === 'ArrowUp') { e.preventDefault(); grab(idx - 1); } else if (e.key === 'ArrowDown') { e.preventDefault(); grab(idx + 1); } }}
                        aria-label={`Reorder ${o.label}. Drag it, or press the up or down arrow key.`}
                        title="Drag to reorder"
                        className="shrink-0 w-5 h-7 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 cursor-grab active:cursor-grabbing disabled:opacity-40"
                      >
                        <GripVertical className="w-4 h-4" aria-hidden />
                      </button>
                      <span className="w-5 text-[12px] text-gray-400 tabular-nums shrink-0" aria-hidden>{idx + 1}</span>
                      {isEditing ? (
                        <form className="flex-1 flex items-center gap-1 min-w-0" onSubmit={e => { e.preventDefault(); rename(o, editing.label); }}>
                          <input autoFocus value={editing.label} onChange={e => setEditing({ id: o.id, label: e.target.value })} maxLength={OPTION_LABEL_MAX} aria-label={`Label for ${o.label}`} className={`${box} flex-1 min-w-0`} />
                          <button type="submit" className={ib} disabled={busy || !editing.label.trim()} aria-label="Save option label"><Check className="w-4 h-4 text-green-600" /></button>
                          <button type="button" className={ib} onClick={() => setEditing(null)} aria-label="Cancel renaming"><X className="w-4 h-4" /></button>
                        </form>
                      ) : (
                        <>
                          <span className="flex-1 min-w-0 truncate text-[14px] text-gray-900 px-1">{o.label}</span>
                          <span className="hidden sm:block text-[11px] text-gray-400 w-24 text-right shrink-0">{o.usage ? `Used by ${o.usage} ${noun}${o.usage === 1 ? '' : 's'}` : 'Not in use'}</span>
                          <button type="button" className={ib} disabled={busy} onClick={() => setEditing({ id: o.id, label: o.label })} aria-label={`Edit ${o.label}`} title="Change label"><Pencil className="w-3.5 h-3.5" /></button>
                          <button type="button" className={`${ib} hover:!text-[#d9232b]`} disabled={busy} onClick={() => setRemoving({ option: o, usage: o.usage ?? 0 })} aria-label={`Delete ${o.label}`} title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
      </div>

      {removing && (
        <LightConfirm title={removing.usage > 0 ? 'Option is in use' : 'Delete option?'} confirmLabel="Delete" danger busy={busy} onCancel={() => setRemoving(null)} onConfirm={confirmRemove}>
          {removing.usage > 0 ? (
            <>
              <p>This option is currently being used by existing records. Deleting it may affect existing data. Are you sure you want to continue?</p>
              <p className="text-gray-500">“{removing.option.label}” is used by {removing.usage} {noun}{removing.usage === 1 ? '' : 's'}. This field will be cleared on those {noun}s; the rest of each {noun} is not changed.</p>
            </>
          ) : (
            <p>“{removing.option.label}” is not used by any {noun}. It will be removed from the list.</p>
          )}
        </LightConfirm>
      )}
    </div>
  );
}
