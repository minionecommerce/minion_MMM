'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlignLeft, ArrowDown, ArrowUp, Calendar, CheckSquare, Hash, Link2, Mail, MoreHorizontal, Paperclip, Percent, Phone, SquareChevronDown, Trash2, Type, User, X,
  type LucideIcon,
} from 'lucide-react';
import { LEAD_COLUMNS, type LeadColumnId } from '@/lib/leads/constants';
import { FIELD_TYPE_LABEL, type FieldType, type LeadFieldDto } from '@/lib/leads/layout-shared';
import { ApiError, callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import FieldProperties from './FieldProperties';
import LightConfirm from './LightConfirm';
import { ColumnsReorder, DropdownsReorder, FormFieldsReorder } from './ReorderDialogs';

const ICONS: Record<FieldType, LucideIcon> = {
  TEXT: Type, TEXTAREA: AlignLeft, NUMBER: Hash, DATE: Calendar, EMAIL: Mail, PHONE: Phone, URL: Link2,
  CHECKBOX: CheckSquare, DROPDOWN: SquareChevronDown, PERSON: User, RATE: Percent, FILE: Paperclip,
};

// Super Admin only: every field on the Add New Lead form, with its properties
export default function PageLayoutEditor({ initialFields, columnOrder, onClose }: { initialFields: LeadFieldDto[]; columnOrder: LeadColumnId[]; onClose: (changed: boolean) => void }) {
  const toast = useToast();
  const [fields, setFields] = useState(initialFields);
  const [changed, setChanged] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [reorder, setReorder] = useState<'fields' | 'columns' | 'dropdowns' | null>(null);
  const [columns, setColumns] = useState<LeadColumnId[]>(columnOrder);
  const [editing, setEditing] = useState<{ field: LeadFieldDto | null; createType: FieldType | null } | null>(null);
  const [removing, setRemoving] = useState<{ field: LeadFieldDto; usage: number | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Close the card menu / type picker with a click elsewhere
  useEffect(() => {
    const away = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('[data-menu]')) setMenuFor(null);
    };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, []);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || editing || removing || reorder) return;
      // Escape closes an open menu first, and only then the window
      if (menuFor) { setMenuFor(null); return; }
      onClose(changed);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  const update = (next: LeadFieldDto[]) => { setFields(next); setChanged(true); };
  const custom = fields.filter(f => !f.isSystem);

  const move = async (f: LeadFieldDto, dir: -1 | 1) => {
    const i = custom.findIndex(c => c.id === f.id);
    const j = i + dir;
    if (j < 0 || j >= custom.length) return;
    const ids = custom.map(c => c.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    setMenuFor(null);
    try {
      await callApi('/api/leads/layout/fields/order', 'PUT', { orderedIds: ids });
      const { fields: next } = await callApi<{ fields: LeadFieldDto[] }>('/api/leads/layout', 'GET');
      update(next);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not reorder'); }
  };

  const askDelete = (f: LeadFieldDto) => { setMenuFor(null); setRemoving({ field: f, usage: null }); };

  const confirmDelete = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      // First try without confirmation: the server tells us if any lead has a value
      if (removing.usage === null) {
        try { await callApi(`/api/leads/layout/fields/${removing.field.id}`, 'DELETE', {}); }
        catch (e) {
          if (e instanceof ApiError && e.status === 409 && e.body?.code === 'IN_USE') { setRemoving({ field: removing.field, usage: e.body.usage ?? 0 }); setBusy(false); return; }
          throw e;
        }
      } else {
        await callApi(`/api/leads/layout/fields/${removing.field.id}`, 'DELETE', { confirm: true });
      }
      const { fields: next } = await callApi<{ fields: LeadFieldDto[] }>('/api/leads/layout', 'GET');
      update(next);
      toast.success(`"${removing.field.label}" deleted`);
      setRemoving(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete');
      setRemoving(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div ref={root} role="dialog" aria-modal="true" aria-labelledby="layout-title" className="bg-white w-full sm:max-w-[1040px] max-h-screen sm:max-h-[94vh] sm:rounded-lg shadow-2xl flex flex-col">
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 id="layout-title" className="text-[19px] font-bold text-[#444]">Edit Page Layout</h2>
            <p className="text-[12px] text-gray-500 mt-0.5">Lead form fields. Use the three dots on a field to edit its properties, or the Reorder buttons to change the order.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              {([['fields', 'Reorder Form Fields'], ['columns', 'Reorder Page Columns'], ['dropdowns', 'Reorder Dropdowns']] as const).map(([k, label]) => (
                <button key={k} onClick={() => setReorder(k)} className="px-3 h-[36px] whitespace-nowrap rounded-md border border-gray-300 hover:border-gray-500 bg-white text-[13px] font-medium text-gray-800">{label}</button>
              ))}
            </div>
            <button onClick={() => onClose(changed)} aria-label="Close" className="text-gray-500 hover:text-black"><X className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="md:hidden flex flex-wrap gap-2 px-6 py-3 border-b border-gray-200 shrink-0">
          {([['fields', 'Reorder Form Fields'], ['columns', 'Reorder Page Columns'], ['dropdowns', 'Reorder Dropdowns']] as const).map(([k, label]) => (
            <button key={k} onClick={() => setReorder(k)} className="px-3 h-[34px] rounded-md border border-gray-300 bg-white text-[13px] font-medium text-gray-800">{label}</button>
          ))}
        </div>

        <div className="overflow-y-auto px-6 py-5 bg-gray-50 flex-1">
          <div className="border border-dashed border-gray-300 rounded-lg bg-white p-4">
            <h3 className="text-[15px] font-bold text-[#333] mb-3">Lead Information</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fields.map(f => {
                const Icon = ICONS[f.type];
                const ci = custom.findIndex(c => c.id === f.id);
                return (
                  <li key={f.id} className={`relative flex items-center gap-3 border border-gray-200 rounded-md bg-white h-[46px] pl-3 pr-1.5 ${f.required ? 'border-l-[3px] border-l-[#e5484d]' : ''}`}>
                    <Icon className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />
                    <span className="flex-1 min-w-0 truncate text-[14px] text-gray-900" title={f.label}>{f.label}</span>
                    <span className="text-[11px] text-gray-400 shrink-0 hidden lg:block">{f.isSystem ? FIELD_TYPE_LABEL[f.type] : `Custom · ${FIELD_TYPE_LABEL[f.type]}`}</span>
                    <div className="relative shrink-0" data-menu>
                      <button onClick={() => setMenuFor(m => (m === f.id ? null : f.id))} aria-label={`Options for ${f.label}`} aria-haspopup="menu" aria-expanded={menuFor === f.id} className="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-black">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                      {menuFor === f.id && (
                        <div role="menu" className="absolute right-0 top-9 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-xl py-1">
                          <button role="menuitem" onClick={() => { setMenuFor(null); setEditing({ field: f, createType: null }); }} className="w-full text-left px-3 py-2 text-[14px] text-gray-800 hover:bg-gray-50">Edit Properties</button>
                          {!f.isSystem && (
                            <>
                              <button role="menuitem" disabled={ci <= 0} onClick={() => move(f, -1)} className="w-full flex items-center gap-2 px-3 py-2 text-[14px] text-gray-800 hover:bg-gray-50 disabled:opacity-40"><ArrowUp className="w-4 h-4" /> Move up</button>
                              <button role="menuitem" disabled={ci === custom.length - 1} onClick={() => move(f, 1)} className="w-full flex items-center gap-2 px-3 py-2 text-[14px] text-gray-800 hover:bg-gray-50 disabled:opacity-40"><ArrowDown className="w-4 h-4" /> Move down</button>
                              <button role="menuitem" onClick={() => askDelete(f)} className="w-full flex items-center gap-2 px-3 py-2 text-[14px] text-[#d9232b] hover:bg-red-50"><Trash2 className="w-4 h-4" /> Delete</button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="text-[12px] text-gray-500 mt-4">
              <span className="inline-block w-[3px] h-3 bg-[#e5484d] align-middle mr-1.5" />Required field. System fields can be renamed and edited but not deleted.
            </p>
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-200 px-6 py-3 flex justify-end">
          <button onClick={() => onClose(changed)} className="px-6 h-[40px] rounded-md bg-black hover:bg-[#222] text-white text-[14px] font-medium">Close</button>
        </div>
      </div>

      {editing && (
        <FieldProperties
          key={editing.field?.id ?? `new-${editing.createType}`}
          field={editing.field}
          createType={editing.createType}
          allFields={fields}
          onClose={() => setEditing(null)}
          onChanged={next => update(next)}
        />
      )}

      {reorder === 'fields' && <FormFieldsReorder fields={fields} onSaved={next => update(next)} onClose={() => setReorder(null)} />}
      {reorder === 'columns' && (
        <ColumnsReorder columns={columns.map(id => ({ id, label: LEAD_COLUMNS.find(c => c.id === id)?.label ?? id }))} onSaved={order => { setColumns(order as LeadColumnId[]); setChanged(true); }} onClose={() => setReorder(null)} />
      )}
      {reorder === 'dropdowns' && <DropdownsReorder fields={fields} onClose={() => { setReorder(null); setChanged(true); }} />}

      {removing && (
        <LightConfirm title={removing.usage ? 'Field has data' : 'Delete field?'} confirmLabel="Delete" danger busy={busy} onCancel={() => setRemoving(null)} onConfirm={confirmDelete}>
          {removing.usage ? (
            <>
              <p>“{removing.field.label}” has a value on {removing.usage} lead{removing.usage === 1 ? '' : 's'}. Deleting the field removes those values. The rest of each lead is not changed.</p>
              <p className="text-gray-500">Are you sure you want to continue?</p>
            </>
          ) : (
            <p>“{removing.field.label}” will be removed from the lead form{removing.field.type === 'DROPDOWN' ? ', together with its options' : ''}.</p>
          )}
        </LightConfirm>
      )}
    </div>
  );
}
