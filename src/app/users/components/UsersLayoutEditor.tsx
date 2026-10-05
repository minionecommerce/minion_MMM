'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlignLeft, Calendar, CheckSquare, ChevronDown, Hash, LayoutTemplate, Link2, Loader2, Mail, MoreHorizontal, Phone, Plus, SquareChevronDown, Trash2, Type, X,
  type LucideIcon,
} from 'lucide-react';
import { ApiError, callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import {
  COLUMN_FIELD, CUSTOM_FIELD_TYPES, USER_COLUMNS, USER_FIELD_LABEL_MAX, USER_FIELD_TYPE_LABEL,
  type FieldOption, type UserColumnId, type UserFieldDto, type UserFieldType, type UserLayout,
} from '@/lib/users/layout-shared';
import { Modal, ReorderList } from '@/app/leads/components/ReorderDialogs';
import LightConfirm from '@/app/leads/components/LightConfirm';
import PickListEditor, { DraftPickList, type PickItem } from './PickListEditor';

const ICONS: Record<UserFieldType, LucideIcon> = {
  TEXT: Type, TEXTAREA: AlignLeft, NUMBER: Hash, DATE: Calendar, EMAIL: Mail, PHONE: Phone, URL: Link2, CHECKBOX: CheckSquare, DROPDOWN: SquareChevronDown,
};
const box = 'w-full border border-gray-300 rounded px-3 h-[38px] text-[14px] text-gray-900 bg-white focus:outline-none focus:border-[#f5b800] disabled:bg-gray-100 disabled:text-gray-500';

type Department = { id: string; name: string };

// The "Edit Page Layout" button of the Users page (Super Admin only) and its window
export function UsersLayoutButton({ layout, departments }: { layout: UserLayout; departments: Department[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title="Edit Page Layout" className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#292B30] hover:bg-[#1a1b1e] text-[13px] font-semibold text-gray-200">
        <LayoutTemplate className="w-4 h-4" /> Edit Page Layout
      </button>
      {open && <UsersLayoutEditor layout={layout} departments={departments} onClose={changed => { setOpen(false); if (changed) router.refresh(); }} />}
    </>
  );
}

type Editing = { field: UserFieldDto | null; createType: UserFieldType | null };

function UsersLayoutEditor({ layout, departments: initialDepartments, onClose }: { layout: UserLayout; departments: Department[]; onClose: (changed: boolean) => void }) {
  const toast = useToast();
  const [fields, setFields] = useState(layout.fields);
  const [columns, setColumns] = useState(layout.columns);
  const [changed, setChanged] = useState(false);
  const [departments, setDepartments] = useState(initialDepartments); // kept current while the Department dropdown is edited
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [typeMenu, setTypeMenu] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [reorder, setReorder] = useState<'fields' | 'columns' | null>(null);
  const [removing, setRemoving] = useState<{ field: UserFieldDto; warning: string | null } | null>(null);
  const [busy, setBusy] = useState(false);

  // Close the card menu / type picker with a click elsewhere
  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-menu]')) { setMenuFor(null); setTypeMenu(false); }
    };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, []);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || editing || reorder || removing) return;
      // Escape closes an open menu first, and only then the window
      if (menuFor || typeMenu) { setMenuFor(null); setTypeMenu(false); return; }
      onClose(changed);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  const refreshFields = useCallback(async () => {
    const next = await callApi<UserLayout>('/api/users/layout', 'GET');
    setFields(next.fields);
    return next.fields;
  }, []);

  const labelOf = (id: UserColumnId) => {
    const fieldKey = COLUMN_FIELD[id];
    return (fieldKey && fields.find(f => f.key === fieldKey)?.label) || USER_COLUMNS.find(c => c.id === id)!.label;
  };

  // Delete a field added with New Field. Without a confirmation the server only deletes it when nobody has a value;
  // otherwise it answers with how many people do, and the Super Admin is asked again.
  const confirmDelete = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      await callApi(`/api/users/layout/fields/${removing.field.key}`, 'DELETE', removing.warning ? { confirm: true } : {});
      await refreshFields();
      setChanged(true);
      toast.success(`"${removing.field.label}" deleted`);
      setRemoving(null);
    } catch (e) {
      if (!removing.warning && e instanceof ApiError && e.status === 409) { setRemoving({ field: removing.field, warning: e.message }); setBusy(false); return; }
      toast.error(e instanceof Error ? e.message : 'Could not delete');
      setRemoving(null);
    } finally {
      setBusy(false);
    }
  };

  const reorderButtons = ([['fields', 'Reorder Form Fields'], ['columns', 'Reorder Page Columns']] as const);
  const newFieldMenu = (
    <div className="relative" data-menu>
      <button onClick={() => setTypeMenu(o => !o)} aria-haspopup="menu" aria-expanded={typeMenu} className="px-3 h-[36px] whitespace-nowrap rounded-md border-2 border-[#f5b800] hover:bg-[#fff8dc] bg-white text-[13px] font-semibold text-gray-900 inline-flex items-center gap-1.5">
        <Plus className="w-4 h-4" /> New Field <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {typeMenu && (
        <div role="menu" aria-label="Field type" className="absolute right-0 top-10 z-30 w-64 bg-white border border-gray-200 rounded-lg shadow-xl py-1">
          {CUSTOM_FIELD_TYPES.map(t => {
            const Icon = ICONS[t.type];
            return (
              <button key={t.type} role="menuitem" onClick={() => { setTypeMenu(false); setEditing({ field: null, createType: t.type }); }} className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50">
                <Icon className="w-4 h-4 text-gray-500 shrink-0" />
                <span><span className="block text-[14px] text-gray-900">{t.label}</span><span className="block text-[11px] text-gray-500">{t.hint}</span></span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div data-light-native className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center bg-black/50 p-0 sm:p-4 text-gray-900">
      <div role="dialog" aria-modal="true" aria-labelledby="users-layout-title" className="bg-white w-full sm:max-w-[1040px] max-h-screen sm:max-h-[94vh] sm:rounded-lg shadow-2xl flex flex-col">
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 id="users-layout-title" className="text-[19px] font-bold text-[#444]">Edit Page Layout</h2>
            <p className="text-[12px] text-gray-500 mt-0.5">User form fields. Use the three dots on a field to edit its properties, New Field to add one, or the Reorder buttons to change the order.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              {newFieldMenu}
              {reorderButtons.map(([k, label]) => (
                <button key={k} onClick={() => setReorder(k)} className="px-3 h-[36px] whitespace-nowrap rounded-md border border-gray-300 hover:border-gray-500 bg-white text-[13px] font-medium text-gray-800">{label}</button>
              ))}
            </div>
            <button onClick={() => onClose(changed)} aria-label="Close" className="text-gray-500 hover:text-black"><X className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="md:hidden flex flex-wrap gap-2 px-6 py-3 border-b border-gray-200 shrink-0">
          {newFieldMenu}
          {reorderButtons.map(([k, label]) => (
            <button key={k} onClick={() => setReorder(k)} className="px-3 h-[34px] rounded-md border border-gray-300 bg-white text-[13px] font-medium text-gray-800">{label}</button>
          ))}
        </div>

        <div className="overflow-y-auto px-6 py-5 bg-gray-50 flex-1">
          <div className="border border-dashed border-gray-300 rounded-lg bg-white p-4">
            <h3 className="text-[15px] font-bold text-[#333] mb-3">User Information</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fields.map(f => {
                const Icon = ICONS[f.type];
                return (
                  <li key={f.key} className={`relative flex items-center gap-3 border border-gray-200 rounded-md bg-white h-[46px] pl-3 pr-1.5 ${f.required ? 'border-l-[3px] border-l-[#e5484d]' : ''}`}>
                    <Icon className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />
                    <span className="flex-1 min-w-0 truncate text-[14px] text-gray-900" title={f.label}>{f.label}</span>
                    <span className="text-[11px] text-gray-400 shrink-0 hidden lg:block">{f.isSystem ? USER_FIELD_TYPE_LABEL[f.type] : `Custom · ${USER_FIELD_TYPE_LABEL[f.type]}`}</span>
                    <div className="relative shrink-0" data-menu>
                      <button onClick={() => setMenuFor(m => (m === f.key ? null : f.key))} aria-label={`Options for ${f.label}`} aria-haspopup="menu" aria-expanded={menuFor === f.key} className="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-black">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                      {menuFor === f.key && (
                        <div role="menu" className="absolute right-0 top-9 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-xl py-1">
                          <button role="menuitem" onClick={() => { setMenuFor(null); setEditing({ field: f, createType: null }); }} className="w-full text-left px-3 py-2 text-[14px] text-gray-800 hover:bg-gray-50">Edit Properties</button>
                          {!f.isSystem && (
                            <button role="menuitem" onClick={() => { setMenuFor(null); setRemoving({ field: f, warning: null }); }} className="w-full flex items-center gap-2 px-3 py-2 text-[14px] text-[#d9232b] hover:bg-red-50"><Trash2 className="w-4 h-4" /> Delete</button>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="text-[12px] text-gray-500 mt-4">
              <span className="inline-block w-[3px] h-3 bg-[#e5484d] align-middle mr-1.5" />Required field. Full Name and Email / Username are always required. Standard fields can be renamed and edited but not deleted.
            </p>
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-200 px-6 py-3 flex justify-end">
          <button onClick={() => onClose(changed)} className="px-6 h-[40px] rounded-md bg-black hover:bg-[#222] text-white text-[14px] font-medium">Close</button>
        </div>
      </div>

      {editing && (
        <FieldProperties
          key={editing.field?.key ?? `new-${editing.createType}`}
          field={editing.field}
          createType={editing.createType}
          departments={departments}
          onDepartments={setDepartments}
          onDirty={() => setChanged(true)}
          refreshFields={refreshFields}
          onClose={() => setEditing(null)}
          onSaved={next => { setFields(next); setChanged(true); }}
        />
      )}

      {reorder === 'fields' && (
        <Modal title="Reorder form fields" subtitle="The order of the fields on the Create User and Edit User form." onClose={() => setReorder(null)}>
          <ReorderList items={fields.map(f => ({ id: f.key, label: f.label }))} saveLabel="Save order" onSave={async ids => {
            try {
              await callApi('/api/users/layout/fields/order', 'PUT', { orderedKeys: ids });
              await refreshFields();
              setChanged(true);
              toast.success('Form field order saved');
              setReorder(null);
            } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save the order'); }
          }} />
        </Modal>
      )}
      {reorder === 'columns' && (
        <Modal title="Reorder user page columns" subtitle="The order of the columns on the Users page. Actions always stays last." onClose={() => setReorder(null)}>
          <ReorderList items={columns.map(id => ({ id, label: labelOf(id) }))} saveLabel="Save order" onSave={async ids => {
            try {
              await callApi('/api/users/layout/columns', 'PUT', { order: ids });
              setColumns(ids as UserColumnId[]);
              setChanged(true);
              toast.success('Column order saved');
              setReorder(null);
            } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save the order'); }
          }} />
        </Modal>
      )}

      {removing && (
        <LightConfirm title={removing.warning ? 'Field has data' : 'Delete field?'} confirmLabel="Delete" danger busy={busy} onCancel={() => setRemoving(null)} onConfirm={confirmDelete}>
          {removing.warning ? (
            <>
              <p>{removing.warning}</p>
              <p className="text-gray-500">The rest of each person&apos;s details is not changed. Are you sure you want to continue?</p>
            </>
          ) : (
            <p>“{removing.field.label}” will be removed from the Create User, Edit User and profile pages{removing.field.type === 'DROPDOWN' ? ', together with its options' : ''}.</p>
          )}
        </LightConfirm>
      )}
    </div>
  );
}

// "Edit Properties" for one field (or the properties of a New Field): label, required, default value and, for a dropdown, its options
function FieldProperties({ field: initial, createType, departments, onDepartments, onDirty, refreshFields, onClose, onSaved }: {
  field: UserFieldDto | null;
  createType: UserFieldType | null; // set when adding a new field
  departments: Department[];
  onDepartments: (departments: Department[]) => void;
  onDirty: () => void; // the options of a list were changed
  refreshFields: () => Promise<UserFieldDto[]>;
  onClose: () => void;
  onSaved: (fields: UserFieldDto[]) => void;
}) {
  const toast = useToast();
  const field = initial;
  const type: UserFieldType = field?.type ?? createType ?? 'TEXT';
  const creating = !field;
  const [label, setLabel] = useState(initial?.label ?? '');
  const [required, setRequired] = useState(initial?.required ?? false);
  const [defaultValue, setDefaultValue] = useState(initial?.defaultValue ?? '');
  const [options, setOptions] = useState<FieldOption[]>((initial?.options ?? []).filter(o => !o.locked)); // the choices of a custom dropdown, or the access levels (Super Admin is built in and never a default)
  const [draft, setDraft] = useState<PickItem[]>([]); // the options of a new dropdown: they are saved together with the field
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isDepartment = field?.key === 'departmentId';
  const isAccess = field?.key === 'access';
  const customList = !!field && !field.isSystem && type === 'DROPDOWN';
  const defaultable = field ? field.defaultable : true;
  const choices = isDepartment ? departments.map(d => ({ id: d.id, label: d.name })) : creating ? draft.map(o => ({ id: o.id, label: o.name })) : options;
  const onOptions = useCallback((list: { id: string; name: string; locked?: boolean }[]) => setOptions(list.filter(o => !o.locked).map(o => ({ id: o.id, label: o.name }))), []);

  // Escape closes only this window, not the layout window behind it
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, [onClose, saving]);

  const save = async () => {
    setError('');
    if (!label.trim()) { setError('Field label is required'); return; }
    if (!field && type === 'DROPDOWN' && draft.length === 0) { setError('Add at least one option for the dropdown.'); return; }
    setSaving(true);
    try {
      if (!field) {
        // A dropdown is created together with its options; the default is sent as its position in that list
        const defaultOption = draft.findIndex(o => o.id === defaultValue);
        const created = await callApi<{ field: UserFieldDto; fields: UserFieldDto[] }>('/api/users/layout/fields', 'POST', {
          label, type, required,
          ...(type === 'DROPDOWN' ? { options: draft.map(o => o.name), defaultOption: defaultOption >= 0 ? defaultOption : null } : defaultValue ? { defaultValue } : {}),
        });
        onSaved(created.fields);
        toast.success(`"${created.field.label}" added`);
        onClose();
        return;
      }
      // A default that points at a choice that no longer exists counts as none
      const chosen = (isDepartment || isAccess || customList) && !choices.some(c => c.id === defaultValue) ? '' : defaultValue;
      const { fields } = await callApi<{ fields: UserFieldDto[] }>(`/api/users/layout/fields/${field.key}`, 'PATCH', {
        label,
        ...(field.requiredLocked ? {} : { required }),
        ...(field.defaultable ? { defaultValue: chosen || null } : {}),
      });
      onSaved(fields);
      toast.success('Properties saved');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
      setSaving(false);
    }
  };

  const locked = !!field?.requiredLocked;
  const bind = { 'aria-label': 'Default value', value: defaultValue, className: box };

  return (
    <div className="fixed inset-0 z-[90] flex items-start sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div role="dialog" aria-modal="true" aria-label="Field properties" className="bg-white w-full sm:max-w-[600px] max-h-screen sm:max-h-[92vh] sm:rounded-lg shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-[18px] font-bold text-[#333]">{USER_FIELD_TYPE_LABEL[type]} Properties</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-500 hover:text-black"><X className="w-6 h-6" /></button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label htmlFor="uf-label" className="block text-[13px] font-medium text-gray-700 mb-1.5">Field Label <span className="text-[#d9232b]">*</span></label>
            <input id="uf-label" autoFocus value={label} onChange={e => setLabel(e.target.value)} maxLength={USER_FIELD_LABEL_MAX} className={box} />
          </div>

          <div>
            <label className={`flex items-center gap-2.5 text-[14px] ${locked ? 'text-gray-400' : 'text-gray-800 cursor-pointer'}`} title={locked ? 'Cannot edit this property for system defined field' : undefined}>
              <input type="checkbox" checked={required} disabled={locked} onChange={e => setRequired(e.target.checked)} className="w-4 h-4 accent-black" />
              Required
            </label>
            {locked && <p className="text-[12px] text-gray-500 mt-1 ml-6">Cannot edit this property for system defined field.</p>}
          </div>

          <div>
            <div className="block text-[13px] font-medium text-gray-700 mb-1.5">Default Value</div>
            {!defaultable ? (
              <p className="text-[13px] text-gray-500">A default value cannot be set for this field.</p>
            ) : type === 'CHECKBOX' ? (
              <label className="flex items-center gap-2.5 text-[14px] text-gray-800 cursor-pointer">
                <input type="checkbox" checked={defaultValue === 'true'} onChange={e => setDefaultValue(e.target.checked ? 'true' : '')} className="w-4 h-4 accent-black" /> Checked by default
              </label>
            ) : type === 'DROPDOWN' ? (
              <select {...bind} value={choices.some(c => c.id === defaultValue) ? defaultValue : ''} onChange={e => setDefaultValue(e.target.value)}>
                <option value="">None</option>
                {choices.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            ) : type === 'TEXTAREA' ? (
              <textarea {...bind} onChange={e => setDefaultValue(e.target.value)} rows={3} maxLength={5000} className={`${box} h-auto py-2`} />
            ) : (
              <input {...bind} onChange={e => setDefaultValue(e.target.value)} maxLength={500} type={type === 'NUMBER' ? 'number' : type === 'DATE' ? 'date' : type === 'EMAIL' ? 'email' : type === 'URL' ? 'url' : 'text'} step={type === 'NUMBER' ? 'any' : undefined} />
            )}
          </div>

          {type === 'DROPDOWN' && (
            <div>
              <div className="block text-[13px] font-medium text-gray-700 mb-1.5">{isAccess ? 'Access levels' : 'Dropdown Options'}</div>
              {isAccess ? (
                <>
                  <PickListEditor base="/api/users/layout/fields/access/options" kind="access" onLoaded={onOptions} onChanged={() => { onDirty(); void refreshFields(); }} />
                  <p className="text-[12px] text-gray-500 mt-2">
                    <b>Super Admin</b> always comes first: that person gets every permission and all Super Admin features (creating users, credentials, roles, Edit Page Layout). Every other access level gives the permissions of the role you pick for it; roles are set up in Users → Roles. Changes to the levels are saved straight away. Label and default are saved with Done.
                  </p>
                </>
              ) : isDepartment ? (
                <>
                  <PickListEditor base="/api/users/layout/departments" kind="department" onLoaded={onDepartments} onChanged={onDirty} />
                  <p className="text-[12px] text-gray-500 mt-2">These are the company&apos;s departments, so the Team page uses the same list. Changes to the options are saved straight away. Label, required and default are saved with Done.</p>
                </>
              ) : customList ? (
                <>
                  <PickListEditor base={`/api/users/layout/fields/${field.key}/options`} kind="option" onLoaded={onOptions} onChanged={() => { onDirty(); void refreshFields(); }} />
                  <p className="text-[12px] text-gray-500 mt-2">Changes to the options are saved straight away. Label, required and default are saved with Done.</p>
                </>
              ) : (
                <>
                  <DraftPickList items={draft} onChange={setDraft} />
                  <p className="text-[12px] text-gray-500 mt-2">Add the options people can choose from, then click <b>Create</b>. You can add, rename, reorder or remove options later with Edit Properties.</p>
                </>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          {error && <p role="alert" className="mr-auto text-[13px] text-[#d9232b]">{error}</p>}
          <button onClick={onClose} disabled={saving} className="px-5 h-[40px] rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 text-[14px] font-medium disabled:opacity-60">Cancel</button>
          <button onClick={save} disabled={saving} className="px-6 h-[40px] rounded-md bg-black hover:bg-[#222] text-white text-[14px] font-medium disabled:opacity-60 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}{creating ? 'Create' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
