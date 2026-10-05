'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { ApiError, callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import {
  CURRENCY_CODES, FIELD_LABEL_MAX, FIELD_TYPE_LABEL, TABLE_COLUMN_TYPES,
  type CustomFieldType, type FieldOption, type FieldType, type LayoutField, type LayoutSection, type LookupItem, type ModuleLayoutDto,
} from '@/lib/records/types';
import PickListEditor, { DraftPickList, type PickItem } from '@/app/users/components/PickListEditor';
import { api } from '../client';

const box = 'w-full border border-gray-300 rounded px-3 h-[38px] text-[14px] text-gray-900 bg-white focus:outline-none focus:border-[#f5b800] disabled:bg-gray-100 disabled:text-gray-500';
const help = 'text-[12px] text-gray-500 mt-1';

// The properties of one field: "Edit Properties" of a field, or the properties of a New Field. Dropdown options are saved straight
// away (like in Users → Edit Page Layout); everything else is saved with Done / Create.
export default function FieldProperties({ slug, layout, field: initial, createType, createSection, onDirty, onSaved, onClose }: {
  slug: string;
  layout: ModuleLayoutDto;
  field: LayoutField | null;
  createType: CustomFieldType | null;
  createSection: string | null;
  onDirty: () => void; // dropdown options were changed
  onSaved: (layout: ModuleLayoutDto) => void;
  onClose: () => void;
}) {
  const toast = useToast();
  const creating = !initial;
  const type: FieldType = initial?.type ?? createType ?? 'TEXT';
  const [label, setLabel] = useState(initial?.label ?? '');
  const [newType, setNewType] = useState<FieldType>(type);
  const effectiveType = newType;
  const [required, setRequired] = useState(initial?.required ?? false);
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [inList, setInList] = useState(initial?.inList ?? false);
  const [section, setSection] = useState(initial?.section ?? createSection ?? layout.sections.find(s => s.kind === 'FORM')!.id);
  const [defaultValue, setDefaultValue] = useState(initial?.defaultValue ?? '');
  const [currency, setCurrency] = useState(initial?.currency ?? 'INR');
  const [maxFiles, setMaxFiles] = useState(initial?.maxFiles ?? 3);
  const [options, setOptions] = useState<FieldOption[]>(initial?.options ?? []);
  const [draft, setDraft] = useState<PickItem[]>([]); // the options of a new dropdown: saved together with the field
  const [users, setUsers] = useState<LookupItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const targetSection: LayoutSection | undefined = layout.sections.find(s => s.id === section);
  const inTable = targetSection?.kind === 'TABLE';
  const locked = !!initial?.requiredLocked;
  const defaultable = initial ? initial.defaultable : effectiveType !== 'FILE';
  const listable = initial ? initial.listable : !inTable && effectiveType !== 'FILE';
  const moveable = creating || (!!initial && layout.sections.find(s => s.id === initial.section)?.kind === 'FORM');
  const choices = creating ? draft.map(o => ({ id: o.id, label: o.name })) : options;
  const onOptions = useCallback((list: { id: string; name: string }[]) => setOptions(list.map(o => ({ id: o.id, label: o.name }))), []);

  // Escape closes only this window, not the layout window behind it
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, [onClose, saving]);

  // A User Lookup can start with a chosen person
  useEffect(() => {
    if (effectiveType !== 'USER') return;
    let live = true;
    callApi<{ items: LookupItem[] }>(api(slug, '/lookups?kind=users'), 'GET').then(r => { if (live) setUsers(r.items); }).catch(() => {});
    return () => { live = false; };
  }, [slug, effectiveType]);

  const save = async () => {
    setError('');
    if (!label.trim()) { setError('Field label is required'); return; }
    if (creating && effectiveType === 'DROPDOWN' && draft.length === 0) { setError('Add at least one option for the dropdown.'); return; }
    setSaving(true);
    try {
      if (creating) {
        const defaultOption = draft.findIndex(o => o.id === defaultValue);
        const res = await callApi<{ field: LayoutField; layout: ModuleLayoutDto }>(api(slug, '/layout/fields'), 'POST', {
          label, type: effectiveType, section, required, inList: listable && inList,
          ...(effectiveType === 'DROPDOWN' ? { options: draft.map(o => o.name), defaultOption: defaultOption >= 0 ? defaultOption : null } : defaultValue ? { defaultValue } : {}),
          ...(effectiveType === 'CURRENCY' ? { currency } : {}),
          ...(effectiveType === 'FILE' ? { maxFiles } : {}),
        });
        onSaved(res.layout);
        toast.success(`"${res.field.label}" added`);
        onClose();
        return;
      }
      // A default that points at a choice that no longer exists counts as none
      const chosen = effectiveType === 'DROPDOWN' && !choices.some(c => c.id === defaultValue) ? '' : defaultValue;
      const res = await callApi<{ layout: ModuleLayoutDto }>(api(slug, `/layout/fields/${initial!.key}`), 'PATCH', {
        label,
        ...(locked ? {} : { required, enabled }),
        ...(defaultable ? { defaultValue: chosen || null } : {}),
        ...(moveable && section !== initial!.section ? { section } : {}),
        ...(effectiveType !== initial!.type ? { type: effectiveType } : {}),
        ...(effectiveType === 'CURRENCY' ? { currency } : {}),
        ...(effectiveType === 'FILE' ? { maxFiles } : {}),
        ...(listable && inList !== initial!.inList ? { inList } : {}),
      });
      onSaved(res.layout);
      toast.success('Properties saved');
      onClose();
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : 'Could not save');
      setSaving(false);
    }
  };

  const bind = { 'aria-label': 'Default value', value: defaultValue, className: box };

  return (
    <div className="fixed inset-0 z-[90] flex items-start sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div role="dialog" aria-modal="true" aria-label="Field properties" className="bg-white w-full sm:max-w-[620px] max-h-screen sm:max-h-[92vh] sm:rounded-lg shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-[18px] font-bold text-[#333]">{FIELD_TYPE_LABEL[effectiveType]} Properties</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-500 hover:text-black"><X className="w-6 h-6" /></button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label htmlFor="rf-label" className="block text-[13px] font-medium text-gray-700 mb-1.5">Field Label <span className="text-[#d9232b]">*</span></label>
            <input id="rf-label" autoFocus value={label} onChange={e => setLabel(e.target.value)} maxLength={FIELD_LABEL_MAX} className={box} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rf-type" className="block text-[13px] font-medium text-gray-700 mb-1.5">Field Type</label>
              {initial && initial.typeChoices.length > 1 ? (
                <select id="rf-type" value={newType} onChange={e => { setNewType(e.target.value as FieldType); setDefaultValue(''); }} className={box}>
                  {initial.typeChoices.map(t => <option key={t} value={t}>{FIELD_TYPE_LABEL[t]}</option>)}
                </select>
              ) : (
                <div id="rf-type" className={`${box} flex items-center bg-gray-50 text-gray-700`}>{FIELD_TYPE_LABEL[effectiveType]}</div>
              )}
              {initial && !initial.isSystem && initial.typeChoices.length <= 1 && <p className={help}>This type cannot be changed.</p>}
              {initial?.isSystem && <p className={help}>Standard field: its type is fixed.</p>}
            </div>
            <div>
              <label htmlFor="rf-section" className="block text-[13px] font-medium text-gray-700 mb-1.5">Section</label>
              {moveable ? (
                <select id="rf-section" value={section} onChange={e => setSection(e.target.value)} className={box}>
                  {layout.sections.map(s => (
                    <option key={s.id} value={s.id} disabled={s.kind === 'TABLE' && (!creating || !TABLE_COLUMN_TYPES.has(effectiveType))}>
                      {s.label}{s.kind === 'TABLE' ? ' (table column)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div id="rf-section" className={`${box} flex items-center bg-gray-50 text-gray-700`}>{targetSection?.label}</div>
              )}
              {!moveable && <p className={help}>A table column stays in its table.</p>}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className={`flex items-center gap-2.5 text-[14px] ${locked ? 'text-gray-400' : 'text-gray-800 cursor-pointer'}`} title={locked ? 'Cannot edit this property for system defined field' : undefined}>
                <input type="checkbox" checked={required} disabled={locked} onChange={e => setRequired(e.target.checked)} className="w-4 h-4 accent-black" />
                Mandatory
              </label>
              {locked && <p className="text-[12px] text-gray-500 mt-1 ml-6">Cannot edit this property for system defined field.</p>}
              {type === 'APPROVER' && <p className="text-[12px] text-gray-500 mt-1 ml-6">“Not Yet Approved” counts as an answer, so a new record can always be saved. Only people who may approve can pick someone else.</p>}
            </div>
            {!creating && (
              <div>
                <label className={`flex items-center gap-2.5 text-[14px] ${locked ? 'text-gray-400' : 'text-gray-800 cursor-pointer'}`}>
                  <input type="checkbox" checked={enabled} disabled={locked} onChange={e => setEnabled(e.target.checked)} className="w-4 h-4 accent-black" />
                  Show on the form and the record
                </label>
                <p className="text-[12px] text-gray-500 mt-1 ml-6">{locked ? 'This field is needed to save a record, so it is always shown.' : 'Switch off to hide the field. Its data is kept.'}</p>
              </div>
            )}
            {listable && (
              <label className="flex items-center gap-2.5 text-[14px] text-gray-800 cursor-pointer">
                <input type="checkbox" checked={inList} onChange={e => setInList(e.target.checked)} className="w-4 h-4 accent-black" />
                Show as a column on the list page
              </label>
            )}
          </div>

          {effectiveType === 'CURRENCY' && (
            <div>
              <label htmlFor="rf-currency" className="block text-[13px] font-medium text-gray-700 mb-1.5">Currency</label>
              <select id="rf-currency" value={currency} onChange={e => setCurrency(e.target.value)} className={box}>
                {CURRENCY_CODES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <p className={help}>Shown in front of the amounts of this field. It applies to every record.</p>
            </div>
          )}

          {effectiveType === 'FILE' && (
            <div>
              <label htmlFor="rf-files" className="block text-[13px] font-medium text-gray-700 mb-1.5">Most files in this field</label>
              <input id="rf-files" type="number" min={1} max={10} value={maxFiles} onChange={e => setMaxFiles(Math.max(1, Math.min(10, Number(e.target.value) || 1)))} className={`${box} w-28`} />
              <p className={help}>Each file can be up to 10 MB.</p>
            </div>
          )}

          <div>
            <div className="block text-[13px] font-medium text-gray-700 mb-1.5">Default Value</div>
            {!defaultable ? (
              <p className="text-[13px] text-gray-500">{initial?.readOnly ? `This field is filled in by the system${initial.defaultValue ? ` (${initial.defaultValue})` : ''}.` : 'A default value cannot be set for this field.'}</p>
            ) : effectiveType === 'CHECKBOX' ? (
              <label className="flex items-center gap-2.5 text-[14px] text-gray-800 cursor-pointer">
                <input type="checkbox" checked={defaultValue === 'true'} onChange={e => setDefaultValue(e.target.checked ? 'true' : '')} className="w-4 h-4 accent-black" /> Checked by default
              </label>
            ) : effectiveType === 'DROPDOWN' ? (
              <select {...bind} value={choices.some(c => c.id === defaultValue) ? defaultValue : ''} onChange={e => setDefaultValue(e.target.value)}>
                <option value="">None</option>
                {choices.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            ) : effectiveType === 'DATE' ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <select aria-label="Default date" value={defaultValue === '@today' ? '@today' : defaultValue ? 'fixed' : ''} onChange={e => setDefaultValue(e.target.value === '@today' ? '@today' : e.target.value === 'fixed' ? '2026-01-01' : '')} className={`${box} sm:w-48`}>
                  <option value="">None</option>
                  <option value="@today">Today</option>
                  <option value="fixed">A fixed date</option>
                </select>
                {defaultValue && defaultValue !== '@today' && <input type="date" aria-label="Fixed default date" value={defaultValue} onChange={e => setDefaultValue(e.target.value)} className={`${box} sm:w-48`} />}
              </div>
            ) : effectiveType === 'DATETIME' ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <select aria-label="Default date and time" value={defaultValue === '@now' ? '@now' : defaultValue ? 'fixed' : ''} onChange={e => setDefaultValue(e.target.value === '@now' ? '@now' : e.target.value === 'fixed' ? '2026-01-01T09:00' : '')} className={`${box} sm:w-48`}>
                  <option value="">None</option>
                  <option value="@now">Now</option>
                  <option value="fixed">A fixed date and time</option>
                </select>
                {defaultValue && defaultValue !== '@now' && <input type="datetime-local" aria-label="Fixed default date and time" value={defaultValue} onChange={e => setDefaultValue(e.target.value)} className={`${box} sm:w-60`} />}
              </div>
            ) : effectiveType === 'USER' ? (
              <select {...bind} onChange={e => setDefaultValue(e.target.value)}>
                <option value="">None</option>
                <option value="@me">The person creating the record</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
              </select>
            ) : effectiveType === 'TEXTAREA' ? (
              <textarea {...bind} onChange={e => setDefaultValue(e.target.value)} rows={3} maxLength={5000} className={`${box} h-auto py-2`} />
            ) : (
              <input {...bind} onChange={e => setDefaultValue(e.target.value)} maxLength={500} type={effectiveType === 'NUMBER' || effectiveType === 'CURRENCY' ? 'number' : effectiveType === 'EMAIL' ? 'email' : effectiveType === 'URL' ? 'url' : 'text'} step={effectiveType === 'NUMBER' || effectiveType === 'CURRENCY' ? 'any' : undefined} />
            )}
          </div>

          {effectiveType === 'DROPDOWN' && (
            <div>
              <div className="block text-[13px] font-medium text-gray-700 mb-1.5">Dropdown Options</div>
              {creating ? (
                <>
                  <DraftPickList items={draft} onChange={setDraft} />
                  <p className="text-[12px] text-gray-500 mt-2">Add the options people can choose from, then click <b>Create</b>. You can add, rename, reorder or remove options later with Edit Properties.</p>
                </>
              ) : (
                <>
                  <PickListEditor base={api(slug, `/layout/fields/${initial!.key}/options`)} kind="record" onLoaded={onOptions} onChanged={onDirty} />
                  <p className="text-[12px] text-gray-500 mt-2">Changes to the options are saved straight away. The other properties are saved with Done.</p>
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
