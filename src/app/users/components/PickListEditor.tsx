'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Crown, GripVertical, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import LightConfirm from '@/app/leads/components/LightConfirm';
import { DEPARTMENT_NAME_MAX, USER_OPTION_LABEL_MAX } from '@/lib/users/layout-shared';

// locked: the built-in Super Admin row of the Access field. roleId: the role an access level gives.
export type PickItem = { id: string; name: string; usage: number; locked?: boolean; roleId?: string | null };
type RoleChoice = { id: string; name: string };

// The lists this editor serves: the departments (shared with the Team page), the options of a dropdown added with New Field,
// and the access levels of the Access field
const KINDS = {
  department: {
    listKey: 'departments', singular: 'department', nameMax: DEPARTMENT_NAME_MAX, loadError: 'Could not load the departments',
    inUseTitle: 'Department is in use', unusedTitle: 'Delete department?',
    inUseText: 'This department is currently assigned to people. Deleting it will leave them without a department. Are you sure you want to continue?',
    inUseDetail: (name: string, n: number) => `“${name}” has ${n} ${n === 1 ? 'person' : 'people'}. Nothing else about them is changed.`,
    unusedText: (name: string) => `“${name}” has nobody in it. It will be removed from the list.`,
  },
  option: {
    listKey: 'options', singular: 'option', nameMax: USER_OPTION_LABEL_MAX, loadError: 'Could not load the options',
    inUseTitle: 'Option is in use', unusedTitle: 'Delete option?',
    inUseText: 'This option is currently chosen by people. Deleting it will clear this field for them. Are you sure you want to continue?',
    inUseDetail: (name: string, n: number) => `“${name}” is chosen by ${n} ${n === 1 ? 'person' : 'people'}. Nothing else about them is changed.`,
    unusedText: (name: string) => `“${name}” is not chosen by anyone. It will be removed from the list.`,
  },
  record: {
    listKey: 'options', singular: 'option', nameMax: USER_OPTION_LABEL_MAX, loadError: 'Could not load the options',
    inUseTitle: 'Option is in use', unusedTitle: 'Delete option?',
    inUseText: 'This option is currently chosen in existing records. Deleting it will clear this field in them. Are you sure you want to continue?',
    inUseDetail: (name: string, n: number) => `“${name}” is chosen in ${n} ${n === 1 ? 'record' : 'records'}. Nothing else in them is changed.`,
    unusedText: (name: string) => `“${name}” is not chosen in any record. It will be removed from the list.`,
  },
  access: {
    listKey: 'options', singular: 'access level', nameMax: USER_OPTION_LABEL_MAX, loadError: 'Could not load the access levels',
    inUseTitle: 'Access level is in use', unusedTitle: 'Delete access level?',
    inUseText: 'People have this access level. If you delete it they keep their current permissions, but no access level is shown for them until you pick one. Are you sure you want to continue?',
    inUseDetail: (name: string, n: number) => `“${name}” is set for ${n} ${n === 1 ? 'person' : 'people'}. Nothing else about them is changed.`,
    unusedText: (name: string) => `“${name}” is not set for anyone. It will be removed from the list.`,
  },
} as const;
type Kind = keyof typeof KINDS;

const box = 'border border-gray-300 rounded px-2.5 h-[34px] text-[13px] text-gray-900 bg-white focus:outline-none focus:border-[#f5b800]';
const ib = 'w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:text-black hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent';
const cap = (s: string) => `${s[0].toUpperCase()}${s.slice(1)}`;
const focusGrip = (id: string) => requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-pick-grip="${id}"]`)?.focus());

// The rows: add, rename, drag to reorder (or the arrow keys on the handle) and delete. What happens to the list is up to
// the wrapper below: it either saves every change straight away, or just keeps the list in memory.
// With `roles`, every row that is not locked also has a Role picker (the Access field's levels).
function PickListView({ kind, items, error, busy, confirmRemove, showUsage, roles, onAdd, onRename, onMove, onRemove, onRole }: {
  kind: Kind;
  items: PickItem[] | null;
  error: string;
  busy: boolean;
  confirmRemove: boolean; // a saved list asks before removing; a list that is still being drafted just removes
  showUsage: boolean;
  roles?: RoleChoice[];
  onAdd: (name: string) => Promise<boolean>; // true = added (the box is cleared)
  onRename: (item: PickItem, name: string) => Promise<boolean>; // true = renamed
  onMove: (movedId: string, targetId: string, keepFocus: boolean) => void;
  onRemove: (item: PickItem) => Promise<void>;
  onRole?: (item: PickItem, roleId: string) => void;
}) {
  const K = KINDS[kind];
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [removing, setRemoving] = useState<PickItem | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const add = async () => {
    if (!name.trim()) return;
    if (await onAdd(name)) setName('');
  };

  const rename = async (d: PickItem, next: string) => {
    if (next.trim() === d.name) { setEditing(null); return; }
    if (await onRename(d, next)) setEditing(null);
  };

  const confirmed = async () => {
    if (!removing) return;
    const target = removing;
    await onRemove(target);
    setRemoving(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} maxLength={K.nameMax} placeholder={`New ${K.singular}`} aria-label={`New ${K.singular}`} className={`${box} flex-1`} />
        <button type="button" onClick={add} disabled={busy || !name.trim()} className="inline-flex items-center justify-center gap-1.5 px-3 h-[34px] rounded bg-[#f5b800] hover:bg-[#e0a800] text-black text-[13px] font-semibold disabled:opacity-50">
          <Plus className="w-4 h-4" /> Add {K.singular}
        </button>
      </div>

      <div className="border border-gray-200 rounded-md bg-gray-50 max-h-72 overflow-y-auto">
        {error ? <p className="p-3 text-[13px] text-[#d9232b]">{error}</p>
          : items === null ? <div className="p-6 flex justify-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
          : items.length === 0 ? <p className="p-4 text-[13px] text-gray-500 text-center">No {K.singular}s yet. Add the first one above.</p>
          : (
            <ul className="divide-y divide-gray-200">
              {items.map((d, idx) => {
                if (d.locked) {
                  // The built-in Super Admin row: always first, cannot be renamed, moved or deleted
                  return (
                    <li key={d.id}>
                      <div className="flex items-center gap-2 px-2 py-1.5 bg-[#fffaf0]">
                        <span className="shrink-0 w-5 h-7 flex items-center justify-center text-[#f5b800]" aria-hidden><Crown className="w-4 h-4" /></span>
                        <span className="w-5 text-[12px] text-gray-400 tabular-nums shrink-0" aria-hidden>{idx + 1}</span>
                        <span className="flex-1 min-w-0 truncate text-[14px] font-semibold text-gray-900 px-1">{d.name}</span>
                        <span className="hidden sm:block text-[11px] text-gray-500 text-right shrink-0">Every permission + Super Admin features{showUsage ? ` · ${d.usage} ${d.usage === 1 ? 'person' : 'people'}` : ''}</span>
                      </div>
                    </li>
                  );
                }
                const isEditing = editing?.id === d.id;
                const dropHere = over === d.id && dragging !== null && dragging !== d.id;
                const grab = (to: number) => { const t = items[to]; if (t && !t.locked) onMove(d.id, t.id, true); };
                return (
                  <li key={d.id}>
                    <div
                      draggable={!isEditing && !busy}
                      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', d.id); setDragging(d.id); }}
                      onDragOver={e => { if (dragging !== null) { e.preventDefault(); setOver(d.id); } }}
                      onDragEnd={() => { setDragging(null); setOver(null); }}
                      onDrop={e => { e.preventDefault(); const from = dragging; setDragging(null); setOver(null); if (from) onMove(from, d.id, false); }}
                      className={`flex items-center gap-2 px-2 py-1.5 ${dropHere ? 'bg-[#fff8dc]' : 'bg-white'} ${dragging === d.id ? 'opacity-50' : ''}`}
                    >
                      <button
                        type="button"
                        data-pick-grip={d.id}
                        disabled={busy}
                        onKeyDown={e => { if (e.key === 'ArrowUp') { e.preventDefault(); grab(idx - 1); } else if (e.key === 'ArrowDown') { e.preventDefault(); grab(idx + 1); } }}
                        aria-label={`Reorder ${d.name}. Drag it, or press the up or down arrow key.`}
                        title="Drag to reorder"
                        className="shrink-0 w-5 h-7 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 cursor-grab active:cursor-grabbing disabled:opacity-40"
                      >
                        <GripVertical className="w-4 h-4" aria-hidden />
                      </button>
                      <span className="w-5 text-[12px] text-gray-400 tabular-nums shrink-0" aria-hidden>{idx + 1}</span>
                      {isEditing ? (
                        <form className="flex-1 flex items-center gap-1 min-w-0" onSubmit={e => { e.preventDefault(); rename(d, editing.name); }}>
                          <input autoFocus value={editing.name} onChange={e => setEditing({ id: d.id, name: e.target.value })} maxLength={K.nameMax} aria-label={`Name for ${d.name}`} className={`${box} flex-1 min-w-0`} />
                          <button type="submit" className={ib} disabled={busy || !editing.name.trim()} aria-label={`Save ${K.singular} name`}><Check className="w-4 h-4 text-green-600" /></button>
                          <button type="button" className={ib} onClick={() => setEditing(null)} aria-label="Cancel renaming"><X className="w-4 h-4" /></button>
                        </form>
                      ) : (
                        <>
                          <span className="flex-1 min-w-0 truncate text-[14px] text-gray-900 px-1">{d.name}</span>
                          {roles && onRole && (
                            <select
                              aria-label={`Role for ${d.name}`}
                              title="The permissions this access level gives"
                              value={d.roleId ?? ''}
                              disabled={busy}
                              onChange={e => onRole(d, e.target.value)}
                              className={`${box} w-36 sm:w-44 shrink-0 text-[12px]`}
                            >
                              {!d.roleId && <option value="">Pick a role…</option>}
                              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                          )}
                          {showUsage && <span className="hidden sm:block text-[11px] text-gray-400 w-20 text-right shrink-0">{d.usage ? `${d.usage} ${kind === 'record' ? (d.usage === 1 ? 'record' : 'records') : (d.usage === 1 ? 'person' : 'people')}` : 'Not in use'}</span>}
                          <button type="button" className={ib} disabled={busy} onClick={() => setEditing({ id: d.id, name: d.name })} aria-label={`Edit ${d.name}`} title="Change name"><Pencil className="w-3.5 h-3.5" /></button>
                          <button type="button" className={`${ib} hover:!text-[#d9232b]`} disabled={busy} onClick={() => (confirmRemove ? setRemoving(d) : void onRemove(d))} aria-label={`Delete ${d.name}`} title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
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
        <LightConfirm title={removing.usage > 0 ? K.inUseTitle : K.unusedTitle} confirmLabel="Delete" danger busy={busy} onCancel={() => setRemoving(null)} onConfirm={confirmed}>
          {removing.usage > 0 ? (
            <>
              <p>{K.inUseText}</p>
              <p className="text-gray-500">{K.inUseDetail(removing.name, removing.usage)}</p>
            </>
          ) : (
            <p>{K.unusedText(removing.name)}</p>
          )}
        </LightConfirm>
      )}
    </div>
  );
}

// A list that is saved on the server. Every change is saved straight away.
// `base` is the API address of the list: GET and POST on it, PATCH and DELETE on /:id, PUT on /order.
export default function PickListEditor({ base, kind, onLoaded, onChanged }: {
  base: string;
  kind: Kind;
  onLoaded?: (items: { id: string; name: string; locked?: boolean }[]) => void; // the current list (after every load)
  onChanged: () => void; // something was added, renamed, removed or reordered
}) {
  const K = KINDS[kind];
  const toast = useToast();
  const [items, setItems] = useState<PickItem[] | null>(null);
  const [roles, setRoles] = useState<RoleChoice[] | undefined>(undefined);
  const [pendingRole, setPendingRole] = useState<{ item: PickItem; role: RoleChoice } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await callApi<Record<string, unknown>>(base, 'GET');
      const list = (res[K.listKey] as PickItem[] | undefined) ?? [];
      setItems(list);
      if (kind === 'access') setRoles((res.roles as RoleChoice[] | undefined) ?? []);
      onLoaded?.(list.map(d => ({ id: d.id, name: d.name, locked: d.locked })));
    } catch (e) {
      setError(e instanceof Error ? e.message : K.loadError);
    }
  }, [base, onLoaded, K, kind]);

  useEffect(() => {
    let live = true;
    (async () => { if (live) await load(); })();
    return () => { live = false; };
  }, [load]);

  const act = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true);
    try {
      await fn();
      onChanged();
      await load();
      if (ok) toast.success(ok);
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
      await load();
      return false;
    } finally {
      setBusy(false);
    }
  };

  // The dragged one takes the place of the one it is dropped on (the built-in Super Admin row never takes part)
  const move = async (movedId: string, targetId: string, keepFocus: boolean) => {
    if (!items || movedId === targetId) return;
    const movable = items.filter(d => !d.locked);
    if (!movable.some(d => d.id === movedId) || !movable.some(d => d.id === targetId)) return;
    const ids = movable.map(d => d.id);
    const to = ids.indexOf(targetId);
    ids.splice(ids.indexOf(movedId), 1);
    ids.splice(to, 0, movedId);
    const reordered = [...items.filter(d => d.locked), ...ids.map(id => items.find(d => d.id === id)!)];
    setItems(reordered);
    onLoaded?.(reordered.map(d => ({ id: d.id, name: d.name, locked: d.locked }))); // lists that follow this one (the default value choices) change at once
    setBusy(true);
    try {
      await callApi(`${base}/order`, 'PUT', { orderedIds: ids });
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save the order');
    } finally {
      await load();
      setBusy(false);
      if (keepFocus) focusGrip(movedId);
    }
  };

  const remove = async (target: PickItem) => {
    setBusy(true);
    try {
      await callApi(`${base}/${target.id}`, 'DELETE', { confirm: true });
      toast.success(`Deleted "${target.name}"`);
      onChanged();
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete');
    } finally {
      setBusy(false);
    }
  };

  // Access levels: pick the role a level gives. When people are on the level they get the new role's permissions, so ask first.
  const changeRole = (item: PickItem, roleId: string) => {
    const role = roles?.find(r => r.id === roleId);
    if (!role || roleId === item.roleId) return;
    if (item.usage > 0) { setPendingRole({ item, role }); return; }
    void act(() => callApi(`${base}/${item.id}`, 'PATCH', { roleId }), `"${item.name}" now gives the role "${role.name}"`);
  };

  const confirmRole = async () => {
    if (!pendingRole) return;
    const { item, role } = pendingRole;
    setPendingRole(null);
    await act(() => callApi(`${base}/${item.id}`, 'PATCH', { roleId: role.id, confirm: true }), `"${item.name}" now gives the role "${role.name}"`);
  };

  return (
    <>
      <PickListView
        kind={kind} items={items} error={error} busy={busy} confirmRemove showUsage roles={roles}
        onAdd={name => act(() => callApi(base, 'POST', { name }), `Added "${name.trim()}"`)}
        onRename={(d, next) => act(() => callApi(`${base}/${d.id}`, 'PATCH', { name: next }), `${cap(K.singular)} renamed`)}
        onMove={move}
        onRemove={remove}
        onRole={changeRole}
      />
      {pendingRole && (
        <LightConfirm title="Change the role?" confirmLabel="Change role" busy={busy} onCancel={() => setPendingRole(null)} onConfirm={confirmRole}>
          <p>{pendingRole.item.usage} {pendingRole.item.usage === 1 ? 'person has' : 'people have'} the access level “{pendingRole.item.name}”. They will get the permissions of the role “{pendingRole.role.name}”.</p>
        </LightConfirm>
      )}
    </>
  );
}

// The options of a dropdown that has not been created yet: they are kept in memory and saved together with the field.
export function DraftPickList({ items, onChange }: { items: PickItem[]; onChange: (items: PickItem[]) => void }) {
  const toast = useToast();
  const counter = useRef(0);

  // The name as it will be stored, or null (with a message) when it cannot be used
  const clean = (raw: string, exceptId?: string): string | null => {
    const name = raw.replace(/\s+/g, ' ').trim();
    if (!name) return null;
    if (items.some(i => i.id !== exceptId && i.name.toLowerCase() === name.toLowerCase())) { toast.error(`"${name}" is already in the list.`); return null; }
    return name;
  };

  const onAdd = async (raw: string) => {
    if (items.length >= 200) { toast.error('A dropdown can have up to 200 options.'); return false; }
    const name = clean(raw);
    if (!name) return false;
    counter.current += 1;
    onChange([...items, { id: `draft_${counter.current}`, name, usage: 0 }]);
    return true;
  };

  const onRename = async (item: PickItem, raw: string) => {
    const name = clean(raw, item.id);
    if (!name) return false;
    onChange(items.map(i => (i.id === item.id ? { ...i, name } : i)));
    return true;
  };

  const onMove = (movedId: string, targetId: string, keepFocus: boolean) => {
    if (movedId === targetId) return;
    const next = [...items];
    const to = next.findIndex(i => i.id === targetId);
    const [moved] = next.splice(next.findIndex(i => i.id === movedId), 1);
    next.splice(to, 0, moved);
    onChange(next);
    if (keepFocus) focusGrip(movedId);
  };

  return (
    <PickListView
      kind="option" items={items} error="" busy={false} confirmRemove={false} showUsage={false}
      onAdd={onAdd} onRename={onRename} onMove={onMove}
      onRemove={async item => onChange(items.filter(i => i.id !== item.id))}
    />
  );
}
