'use client';

import { useCallback, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { CONVENTIONAL_RATES } from '@/lib/leads/constants';
import { FIELD_LABEL_MAX, FIELD_TYPE_LABEL, type FieldType, type LeadFieldDto } from '@/lib/leads/layout-shared';
import { callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import OptionsEditor from './OptionsEditor';

const box = 'w-full border border-gray-300 rounded px-3 h-[38px] text-[14px] text-gray-900 bg-white focus:outline-none focus:border-[#f5b800] disabled:bg-gray-100 disabled:text-gray-500';

// "Edit Properties" for one field: label, required, default value and (for pick lists) the options
export default function FieldProperties({ field: initial, createType, onClose, onChanged, allFields }: {
  field: LeadFieldDto | null;
  createType: FieldType | null; // set when adding a new field
  allFields: LeadFieldDto[];
  onClose: () => void;
  onChanged: (fields: LeadFieldDto[]) => void;
}) {
  const toast = useToast();
  const [field, setField] = useState<LeadFieldDto | null>(initial); // becomes set after a pick list is created
  const type: FieldType = field?.type ?? createType ?? 'TEXT';
  const [label, setLabel] = useState(initial?.label ?? '');
  const [required, setRequired] = useState(initial?.required ?? false);
  const [defaultValue, setDefaultValue] = useState(initial?.defaultValue ?? '');
  const [options, setOptions] = useState<{ id: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const creating = !field;
  const defaultable = field ? field.defaultable : type !== 'DROPDOWN' && type !== 'FILE';
  const parentField = field?.parentOptionType ? allFields.find(f => f.optionType === field.parentOptionType) ?? null : null;
  const onOptions = useCallback((o: { id: string; label: string }[]) => setOptions(o), []);

  const refresh = async () => {
    const { fields } = await callApi<{ fields: LeadFieldDto[] }>('/api/leads/layout', 'GET');
    onChanged(fields);
    return fields;
  };

  const save = async () => {
    setError('');
    if (!label.trim()) { setError('Field label is required'); return; }
    setSaving(true);
    try {
      if (creating) {
        const body = { label, type, required, ...(type !== 'DROPDOWN' && defaultValue ? { defaultValue } : {}) };
        const { field: created } = await callApi<{ field: LeadFieldDto }>('/api/leads/layout/fields', 'POST', body);
        await refresh();
        if (type === 'DROPDOWN') {
          // A pick list needs a saved field before options can be added: keep the window open on it
          setField(created);
          toast.success('Field created. Now add its options.');
        } else {
          toast.success(`"${created.label}" added`);
          onClose();
        }
      } else {
        await callApi(`/api/leads/layout/fields/${field.id}`, 'PATCH', {
          label,
          ...(field.requiredLocked ? {} : { required }),
          ...(field.defaultable ? { defaultValue: defaultValue || null } : {}),
        });
        await refresh();
        toast.success('Properties saved');
        onClose();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const locked = !!field?.requiredLocked;

  return (
    <div className="fixed inset-0 z-[90] flex items-start sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div role="dialog" aria-modal="true" aria-label="Field properties" className="bg-white w-full sm:max-w-[600px] max-h-screen sm:max-h-[92vh] sm:rounded-lg shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-[18px] font-bold text-[#333]">{FIELD_TYPE_LABEL[type]} Properties</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-500 hover:text-black"><X className="w-6 h-6" /></button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label htmlFor="fp-label" className="block text-[13px] font-medium text-gray-700 mb-1.5">Field Label <span className="text-[#d9232b]">*</span></label>
            <input id="fp-label" autoFocus value={label} onChange={e => setLabel(e.target.value)} maxLength={FIELD_LABEL_MAX} className={box} />
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
              <p className="text-[13px] text-gray-500">{type === 'DROPDOWN' && creating ? 'Add the options first, then choose a default.' : 'A default value cannot be set for this field.'}</p>
            ) : type === 'CHECKBOX' ? (
              <label className="flex items-center gap-2.5 text-[14px] text-gray-800 cursor-pointer">
                <input type="checkbox" checked={defaultValue === 'true'} onChange={e => setDefaultValue(e.target.checked ? 'true' : '')} className="w-4 h-4 accent-black" /> Checked by default
              </label>
            ) : type === 'DROPDOWN' ? (
              <select aria-label="Default value" value={defaultValue} onChange={e => setDefaultValue(e.target.value)} className={box}>
                <option value="">None</option>
                {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            ) : type === 'RATE' ? (
              <select aria-label="Default value" value={defaultValue} onChange={e => setDefaultValue(e.target.value)} className={box}>
                <option value="">None</option>
                {CONVENTIONAL_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            ) : type === 'TEXTAREA' ? (
              <textarea aria-label="Default value" value={defaultValue} onChange={e => setDefaultValue(e.target.value)} rows={3} maxLength={5000} className={`${box} h-auto py-2`} />
            ) : (
              <input aria-label="Default value" value={defaultValue} onChange={e => setDefaultValue(e.target.value)} maxLength={500}
                type={type === 'NUMBER' ? 'number' : type === 'DATE' ? 'date' : type === 'EMAIL' ? 'email' : 'text'} step={type === 'NUMBER' ? 'any' : undefined} className={box} />
            )}
          </div>

          {type === 'DROPDOWN' && (
            <div>
              <div className="block text-[13px] font-medium text-gray-700 mb-1.5">Pick List Options</div>
              {field ? (
                <>
                  <OptionsEditor field={field} parentField={parentField} onChanged={onOptions} />
                  <p className="text-[12px] text-gray-500 mt-2">Changes to the options are saved straight away. Label, required and default are saved with Done.</p>
                </>
              ) : (
                <p className="text-[13px] text-gray-500 bg-gray-50 border border-gray-200 rounded p-3">Click <b>Create</b> first. You can add the options right after.</p>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          {error && <p role="alert" className="mr-auto text-[13px] text-[#d9232b]">{error}</p>}
          <button onClick={onClose} disabled={saving} className="px-5 h-[40px] rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 text-[14px] font-medium disabled:opacity-60">Cancel</button>
          <button onClick={save} disabled={saving} className="px-6 h-[40px] rounded-md bg-black hover:bg-[#222] text-white text-[14px] font-medium disabled:opacity-60 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}{creating && type === 'DROPDOWN' ? 'Create' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
