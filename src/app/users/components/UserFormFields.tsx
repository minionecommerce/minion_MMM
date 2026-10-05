'use client';

import type { UserFieldDto, UserFieldKey } from '@/lib/users/layout-shared';

export const inputClass = 'w-full bg-[#0D0D0F] border border-[#292B30] rounded-lg px-4 py-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none disabled:opacity-50';
export const labelClass = 'block text-[12px] font-semibold text-gray-400 mb-1.5';

export type UserFormValues = Record<UserFieldKey, string>;

// The user details fields in the order, with the labels and required marks set in Users → Edit Page Layout, including
// the fields added with New Field (their text is in `custom`; a checkbox is "true" when ticked).
// Rendered as grid cells: place it inside a grid.
export default function UserFormFields({ fields, values, custom, departments, onChange, idPrefix, disabledKeys = [], hints = {} }: {
  fields: UserFieldDto[];
  values: UserFormValues;
  custom: Record<string, string>;
  departments: { id: string; name: string }[];
  onChange: (field: UserFieldDto, value: string) => void;
  idPrefix: string;
  disabledKeys?: string[]; // fields that are shown but cannot be changed (e.g. your own Access)
  hints?: Record<string, string>; // a short note under a field, by field key
}) {
  return (
    <>
      {fields.map(f => {
        const id = `${idPrefix}-${f.key}`;
        const value = f.isSystem ? values[f.key as UserFieldKey] : custom[f.key] ?? '';
        const common = { id, required: f.required, className: inputClass, disabled: disabledKeys.includes(f.key) };
        const set = (v: string) => onChange(f, v);

        if (f.type === 'CHECKBOX') {
          return (
            <div key={f.key} className="flex items-end pb-2.5">
              <label htmlFor={id} className="flex items-center gap-3 cursor-pointer text-[13px] font-semibold text-gray-300">
                <input id={id} type="checkbox" checked={value === 'true'} onChange={e => set(e.target.checked ? 'true' : '')} className="w-4 h-4 accent-yellow-400" />
                {f.label}{f.required ? ' *' : ''}
              </label>
            </div>
          );
        }

        let input: React.ReactNode;
        if (f.key === 'departmentId' || f.type === 'DROPDOWN') {
          const choices = f.key === 'departmentId' ? departments.map(d => ({ id: d.id, label: d.name })) : f.options ?? [];
          input = (
            <select {...common} value={value} onChange={e => set(e.target.value)}>
              <option value="">— None —</option>
              {choices.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          );
        } else if (f.type === 'TEXTAREA') {
          input = <textarea {...common} value={value} rows={3} maxLength={5000} onChange={e => set(e.target.value)} />;
        } else {
          const type = f.type === 'EMAIL' ? 'email' : f.type === 'NUMBER' ? 'number' : f.type === 'DATE' ? 'date' : f.type === 'URL' ? 'url' : f.type === 'PHONE' ? 'tel' : 'text';
          input = (
            <input
              {...common}
              value={value}
              type={type}
              step={f.type === 'NUMBER' ? 'any' : undefined}
              autoComplete={f.type === 'EMAIL' ? 'off' : undefined}
              minLength={f.key === 'fullName' ? 2 : undefined}
              placeholder={f.key === 'employeeCode' ? 'e.g. MIN-0012' : f.type === 'URL' ? 'https://' : undefined}
              onChange={e => set(e.target.value)}
            />
          );
        }
        return (
          <div key={f.key} className={f.type === 'TEXTAREA' ? 'sm:col-span-2' : undefined}>
            <label htmlFor={id} className={labelClass}>{f.label}{f.required ? ' *' : ''}</label>
            {input}
            {f.key === 'email' && <p className="text-[11px] text-gray-500 mt-1">Used to sign in.</p>}
            {hints[f.key] && <p className="text-[11px] text-gray-500 mt-1">{hints[f.key]}</p>}
          </div>
        );
      })}
    </>
  );
}
