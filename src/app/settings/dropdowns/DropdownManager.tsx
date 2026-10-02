'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Loader2, Pencil, Plus, Search, Star, Trash2, X } from 'lucide-react';
import { DROPDOWN_GROUPS, DROPDOWN_LISTS, getListDef, type DropdownListDef, type DropdownOptionDto } from '@/lib/dropdowns/registry';
import { refreshDropdown } from '@/lib/dropdowns/useDropdown';
import { callApi, ApiError } from '@/lib/leads/client';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

type Pending =
  | { kind: 'delete'; option: DropdownOptionDto; usage: number }
  | { kind: 'rename'; option: DropdownOptionDto; label: string; usage: number };

const inputClass = 'bg-[#0D0D0F] border border-[#292B30] rounded-lg px-3 py-2 text-[13px] text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none';
const iconBtn = 'p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#1a1b1e] disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed';

export default function DropdownManager({ counts }: { counts: Record<string, number> }) {
  const toast = useToast();
  const [listKey, setListKey] = useState(DROPDOWN_LISTS[0].key);
  const [filter, setFilter] = useState('');
  const [options, setOptions] = useState<DropdownOptionDto[] | null>(null);
  const [parents, setParents] = useState<DropdownOptionDto[]>([]);
  const [loadError, setLoadError] = useState('');
  const [counted, setCounted] = useState(counts);
  const [busy, setBusy] = useState(false);

  const def = getListDef(listKey) as DropdownListDef;
  const [newLabel, setNewLabel] = useState('');
  const [newParent, setNewParent] = useState('');
  const [editing, setEditing] = useState<{ id: string; label: string } | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);

  const load = useCallback(async (key: string) => {
    setLoadError('');
    try {
      const d = getListDef(key)!;
      const [own, parent] = await Promise.all([
        callApi<{ options: DropdownOptionDto[] }>(`/api/dropdowns/${key}?usage=1`, 'GET'),
        d.parentKey ? callApi<{ options: DropdownOptionDto[] }>(`/api/dropdowns/${d.parentKey}`, 'GET') : Promise.resolve({ options: [] }),
      ]);
      setOptions(own.options);
      setParents(parent.options);
      setCounted(c => ({ ...c, [key]: own.options.length }));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load options.');
    }
  }, []);

  useEffect(() => {
    // Loading starts when the chosen list changes; the screen shows a spinner while `options` is empty.
    let cancelled = false;
    (async () => {
      if (!cancelled) await load(listKey);
    })();
    return () => {
      cancelled = true;
    };
  }, [listKey, load]);

  const choose = (key: string) => {
    if (key === listKey) return;
    setOptions(null);
    setEditing(null);
    setNewLabel('');
    setNewParent('');
    setListKey(key);
  };

  const run = async (fn: () => Promise<unknown>, okMessage: string) => {
    setBusy(true);
    try {
      await fn();
      refreshDropdown(listKey);
      await load(listKey);
      if (okMessage) toast.success(okMessage);
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  // ---- add ----
  const add = async () => {
    if (!newLabel.trim()) return;
    const ok = await run(() => callApi(`/api/dropdowns/${listKey}`, 'POST', { label: newLabel, ...(def.parentKey ? { parentId: newParent } : {}) }), `Added "${newLabel.trim()}"`);
    if (ok) setNewLabel('');
  };

  // ---- rename ----
  const saveRename = async (option: DropdownOptionDto, label: string, applyToExistingRecords = false) => {
    setBusy(true);
    try {
      await callApi(`/api/dropdowns/options/${option.id}`, 'PATCH', { label, ...(applyToExistingRecords ? { applyToExistingRecords: true } : {}) });
      refreshDropdown(listKey);
      await load(listKey);
      setEditing(null);
      setPending(null);
      toast.success('Label updated');
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && /Renaming will update/.test(e.message)) {
        setPending({ kind: 'rename', option, label, usage: Number(/used by (\d+)/.exec(e.message)?.[1] ?? option.usage ?? 0) });
      } else {
        toast.error(e instanceof Error ? e.message : 'Could not rename.');
      }
    } finally {
      setBusy(false);
    }
  };

  // ---- default ----
  const toggleDefault = (o: DropdownOptionDto) => run(() => callApi(`/api/dropdowns/options/${o.id}`, 'PATCH', { isDefault: !o.isDefault }), o.isDefault ? 'Default removed' : `"${o.label}" is now the default`);

  // ---- delete ----
  const confirmDelete = async (option: DropdownOptionDto) => {
    setBusy(true);
    try {
      await callApi(`/api/dropdowns/options/${option.id}`, 'DELETE', { confirm: true });
      refreshDropdown(listKey);
      await load(listKey);
      setPending(null);
      toast.success(`Deleted "${option.label}"`);
    } catch (e) {
      setPending(null);
      toast.error(e instanceof Error ? e.message : 'Could not delete.');
    } finally {
      setBusy(false);
    }
  };

  // ---- reorder (within the same parent for levelled lists) ----
  const move = (o: DropdownOptionDto, dir: -1 | 1) => {
    if (!options) return;
    const siblings = options.filter(x => x.parentId === o.parentId);
    const i = siblings.findIndex(x => x.id === o.id);
    const j = i + dir;
    if (j < 0 || j >= siblings.length) return;
    const ids = siblings.map(x => x.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    run(() => callApi(`/api/dropdowns/${listKey}/order`, 'PUT', { orderedIds: ids }), '');
  };

  const parentLabel = (id: string | null) => parents.find(p => p.id === id)?.label ?? '—';

  // Levelled lists are shown grouped under their parent
  const rows = useMemo(() => {
    if (!options) return [];
    if (!def.parentKey) return options.map(o => ({ o, heading: null as string | null }));
    const order = new Map(parents.map((p, i) => [p.id, i]));
    return [...options]
      .sort((a, b) => (order.get(a.parentId ?? '') ?? 999) - (order.get(b.parentId ?? '') ?? 999) || a.sortOrder - b.sortOrder)
      .map((o, idx, arr) => ({ o, heading: idx === 0 || arr[idx - 1].parentId !== o.parentId ? parentLabel(o.parentId) : null }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, parents, def.parentKey]);

  const shownLists = DROPDOWN_LISTS.filter(l => l.label.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
      {/* Lists */}
      <aside className="bg-[#151619] border border-[#292B30] rounded-xl p-3 h-fit lg:sticky lg:top-6">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Find a dropdown…" aria-label="Find a dropdown" className={`${inputClass} w-full pl-9`} />
        </div>
        <div className="max-h-[60vh] overflow-y-auto space-y-3">
          {DROPDOWN_GROUPS.map(g => {
            const items = shownLists.filter(l => l.group === g);
            if (!items.length) return null;
            return (
              <div key={g}>
                <div className="text-[10px] font-bold tracking-widest text-gray-500 px-2 mb-1">{g.toUpperCase()}</div>
                {items.map(l => (
                  <button
                    key={l.key}
                    onClick={() => choose(l.key)}
                    aria-current={l.key === listKey ? 'true' : undefined}
                    className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors ${l.key === listKey ? 'bg-yellow-400/10 text-yellow-400' : 'text-gray-300 hover:bg-[#1a1b1e]'}`}
                  >
                    <span className="truncate">{l.label}</span>
                    <span className="text-[11px] text-gray-500 font-medium">{counted[l.key] ?? 0}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Editor */}
      <section className="bg-[#151619] border border-[#292B30] rounded-xl overflow-hidden min-w-0">
        <div className="p-5 border-b border-[#292B30]">
          <h2 className="text-[18px] font-bold">{def.label}</h2>
          <p className="text-[12px] text-gray-400 mt-0.5">{def.description}</p>
          <p className="text-[12px] text-gray-500 mt-2">
            {def.storage === 'text'
              ? 'Existing records keep the text they already have if you delete an option. Renaming updates those records to the new label.'
              : 'Leads link to these options. Deleting an option that leads use clears that field on those leads, and the change is recorded in the audit log.'}
            {def.multi ? ' This is a multi-select field.' : ''}
          </p>

          <form
            className="flex flex-col sm:flex-row gap-2 mt-4"
            onSubmit={e => {
              e.preventDefault();
              add();
            }}
          >
            {def.parentKey && (
              <select value={newParent} onChange={e => setNewParent(e.target.value)} aria-label={`Belongs to (${getListDef(def.parentKey)?.label})`} className={inputClass} required>
                <option value="">Belongs to… ({getListDef(def.parentKey)?.label})</option>
                {parents.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            )}
            <input value={newLabel} onChange={e => setNewLabel(e.target.value)} maxLength={100} placeholder="New option label" aria-label="New option label" className={`${inputClass} flex-1`} />
            <button type="submit" disabled={busy || !newLabel.trim() || (!!def.parentKey && !newParent)} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black text-[13px] font-bold disabled:opacity-50">
              <Plus className="w-4 h-4" /> Add option
            </button>
          </form>
        </div>

        {loadError ? (
          <div className="p-6 text-[13px] text-red-400">{loadError}</div>
        ) : options === null ? (
          <div className="p-10 flex justify-center text-gray-500"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : options.length === 0 ? (
          <div className="p-10 text-center text-[13px] text-gray-500">No options yet. Add the first one above.</div>
        ) : (
          <ul className="divide-y divide-[#1e2025]">
            {rows.map(({ o, heading }) => {
              const siblings = options.filter(x => x.parentId === o.parentId);
              const idx = siblings.findIndex(x => x.id === o.id);
              const isEditing = editing?.id === o.id;
              return (
                <li key={o.id}>
                  {heading && <div className="px-5 py-2 bg-[#111113] text-[11px] font-bold tracking-wide text-gray-400">{heading}</div>}
                  <div className="flex items-center gap-2 px-3 sm:px-5 py-2.5">
                    <div className="flex flex-col">
                      <button className={iconBtn} disabled={busy || idx === 0} onClick={() => move(o, -1)} aria-label={`Move ${o.label} up`}><ArrowUp className="w-3.5 h-3.5" /></button>
                      <button className={iconBtn} disabled={busy || idx === siblings.length - 1} onClick={() => move(o, 1)} aria-label={`Move ${o.label} down`}><ArrowDown className="w-3.5 h-3.5" /></button>
                    </div>

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <form
                          className="flex items-center gap-2"
                          onSubmit={e => {
                            e.preventDefault();
                            if (editing.label.trim() === o.label) setEditing(null);
                            else saveRename(o, editing.label);
                          }}
                        >
                          <input autoFocus value={editing.label} maxLength={100} onChange={e => setEditing({ id: o.id, label: e.target.value })} aria-label={`Label for ${o.label}`} className={`${inputClass} flex-1 min-w-0`} />
                          <button type="submit" disabled={busy || !editing.label.trim()} className={iconBtn} aria-label="Save label"><Check className="w-4 h-4 text-green-400" /></button>
                          <button type="button" onClick={() => setEditing(null)} className={iconBtn} aria-label="Cancel editing"><X className="w-4 h-4" /></button>
                        </form>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-semibold truncate">{o.label}</span>
                          {o.isDefault && <span className="text-[10px] font-bold tracking-wide text-yellow-400 bg-yellow-400/10 rounded px-1.5 py-0.5">DEFAULT</span>}
                        </div>
                      )}
                    </div>

                    <span className="hidden sm:block text-[12px] text-gray-500 w-32 text-right shrink-0">
                      {o.usage ? `Used by ${o.usage} record${o.usage === 1 ? '' : 's'}` : 'Not in use'}
                    </span>

                    {!def.parentKey && (
                      <button className={iconBtn} disabled={busy} onClick={() => toggleDefault(o)} aria-label={o.isDefault ? `Remove default from ${o.label}` : `Make ${o.label} the default`} aria-pressed={o.isDefault} title={o.isDefault ? 'Remove default' : 'Set as default'}>
                        <Star className={`w-4 h-4 ${o.isDefault ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </button>
                    )}
                    <button className={iconBtn} disabled={busy} onClick={() => setEditing({ id: o.id, label: o.label })} aria-label={`Edit ${o.label}`} title="Change label"><Pencil className="w-4 h-4" /></button>
                    <button className={`${iconBtn} hover:!text-red-400`} disabled={busy} onClick={() => setPending({ kind: 'delete', option: o, usage: o.usage ?? 0 })} aria-label={`Delete ${o.label}`} title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={pending?.kind === 'delete'}
        danger
        busy={busy}
        title={pending?.kind === 'delete' && pending.usage > 0 ? 'Option is in use' : 'Delete option?'}
        confirmLabel="Delete"
        message={
          pending?.kind === 'delete' ? (
            pending.usage > 0 ? (
              <>
                <p>This option is currently being used by existing records. Deleting it may affect existing data. Are you sure you want to continue?</p>
                <p className="mt-2 text-gray-500">
                  “{pending.option.label}” is used by {pending.usage} record{pending.usage === 1 ? '' : 's'}.{' '}
                  {def.storage === 'reference' ? 'That field will be cleared on those leads.' : 'Those records keep their current text.'}
                </p>
              </>
            ) : (
              <p>“{pending.option.label}” is not used by any record. It will be removed from the dropdown.</p>
            )
          ) : null
        }
        onCancel={() => setPending(null)}
        onConfirm={() => pending?.kind === 'delete' && confirmDelete(pending.option)}
      />

      <ConfirmDialog
        open={pending?.kind === 'rename'}
        busy={busy}
        title="Rename and update existing records?"
        confirmLabel="Rename"
        message={
          pending?.kind === 'rename' ? (
            <p>
              “{pending.option.label}” is used by {pending.usage} existing record{pending.usage === 1 ? '' : 's'}. Renaming it to “{pending.label}” will update those records to the new label.
            </p>
          ) : null
        }
        onCancel={() => setPending(null)}
        onConfirm={() => pending?.kind === 'rename' && saveRename(pending.option, pending.label, true)}
      />
    </div>
  );
}
