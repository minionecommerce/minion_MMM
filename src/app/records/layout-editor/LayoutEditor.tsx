'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlignLeft, BadgeCheck, Calendar, CalendarClock, CheckSquare, ChevronDown, CircleDollarSign, EyeOff, FileUp, Hash, LayoutTemplate, Link2, Lock,
  Calculator, Mail, MoreHorizontal, Phone, Plus, Search, SquareChevronDown, Table2, Trash2, Type, UserRound, X, type LucideIcon,
} from 'lucide-react';
import { ApiError, callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import {
  CUSTOM_FIELD_TYPES, FIELD_TYPE_LABEL, SECTION_LABEL_MAX, TABLE_COLUMN_TYPES,
  type CustomFieldType, type FieldType, type LayoutField, type ModuleLayoutDto,
} from '@/lib/records/types';
import { MODULES } from '@/lib/records/registry';
import type { ModuleId } from '@/lib/records/types';
import { Modal, ReorderList } from '@/app/leads/components/ReorderDialogs';
import LightConfirm from '@/app/leads/components/LightConfirm';
import DocumentEditor from '@/app/quotes/DocumentEditor';
import { api } from '../client';
import FieldProperties from './FieldProperties';

const ICONS: Record<FieldType, LucideIcon> = {
  TEXT: Type, TEXTAREA: AlignLeft, NUMBER: Hash, CURRENCY: CircleDollarSign, DATE: Calendar, DATETIME: CalendarClock, EMAIL: Mail, PHONE: Phone, URL: Link2,
  CHECKBOX: CheckSquare, DROPDOWN: SquareChevronDown, USER: UserRound, FILE: FileUp, AUTO: Lock, LOOKUP: Search, APPROVER: BadgeCheck, CALC: Calculator,
};
const field = 'w-full border border-gray-300 rounded px-3 h-[38px] text-[14px] text-gray-900 bg-white focus:outline-none focus:border-[#f5b800]';

// The "Edit Page Layout" button of a module (Super Admin only) and its window. `variant` is the icon of the list page's toolbar
// or the labelled button of a form page.
export function LayoutButton({ moduleId, layout, variant = 'icon' }: { moduleId: ModuleId; layout: ModuleLayoutDto; variant?: 'icon' | 'text' }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      {variant === 'icon' ? (
        <button type="button" onClick={() => setOpen(true)} title="Edit Page Layout" aria-label="Edit Page Layout" className="w-10 h-10 flex items-center justify-center text-gray-800 hover:text-black hover:bg-gray-100 rounded transition-colors">
          <LayoutTemplate className="w-5 h-5" />
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} title="Edit Page Layout" aria-label="Edit Page Layout" className="inline-flex items-center gap-2 px-3 h-[38px] rounded-md border border-gray-300 hover:border-gray-500 bg-white text-[13px] font-medium text-gray-800">
          <LayoutTemplate className="w-4 h-4" /> Edit Page Layout
        </button>
      )}
      {open && <LayoutEditor moduleId={moduleId} initial={layout} onClose={changed => { setOpen(false); if (changed) router.refresh(); }} />}
    </>
  );
}

type Editing = { field: LayoutField | null; createType: CustomFieldType | null; section: string | null };
type SectionDialog = { mode: 'create' } | { mode: 'rename'; id: string; label: string };

export function LayoutEditor({ moduleId, initial, onClose }: { moduleId: ModuleId; initial: ModuleLayoutDto; onClose: (changed: boolean) => void }) {
  const toast = useToast();
  const def = MODULES[moduleId];
  const slug = def.slug;
  const [layout, setLayout] = useState(initial);
  const [changed, setChanged] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null); // a field key, or "section:<id>" / "new:<section id>"
  const [typeMenu, setTypeMenu] = useState<string | null>(null); // "top" or the section the new field is for
  const [editing, setEditing] = useState<Editing | null>(null);
  const [reorder, setReorder] = useState<'fields' | 'columns' | 'sections' | null>(null);
  const [reorderSection, setReorderSection] = useState(initial.sections.find(s => s.kind === 'FORM')!.id);
  const [removing, setRemoving] = useState<{ field: LayoutField; warning: string | null } | null>(null);
  const [removingSection, setRemovingSection] = useState<{ id: string; label: string; count: number } | null>(null);
  const [sectionDialog, setSectionDialog] = useState<SectionDialog | null>(null);
  const [docOpen, setDocOpen] = useState(false); // the Quote document window (quotes only)
  const [busy, setBusy] = useState(false);

  // Close the card menu / type picker with a click elsewhere
  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-menu]')) { setMenuFor(null); setTypeMenu(null); }
    };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, []);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || editing || reorder || removing || removingSection || sectionDialog || docOpen) return;
      if (menuFor || typeMenu) { setMenuFor(null); setTypeMenu(null); return; } // Escape closes an open menu first, and only then the window
      onClose(changed);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  const refresh = useCallback(async () => {
    const next = await callApi<ModuleLayoutDto>(api(slug, '/layout'), 'GET');
    setLayout(next);
    return next;
  }, [slug]);

  const applied = (next: ModuleLayoutDto) => { setLayout(next); setChanged(true); };
  const labelOf = (key: string) => layout.fields.find(f => f.key === key)?.label ?? key;

  const call = async <T,>(fn: () => Promise<T>, ok?: string): Promise<T | undefined> => {
    setBusy(true);
    try {
      const res = await fn();
      if (ok) toast.success(ok);
      return res;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
      return undefined;
    } finally {
      setBusy(false);
    }
  };

  const toggleShown = (f: LayoutField) =>
    call(async () => {
      const res = await callApi<{ layout: ModuleLayoutDto }>(api(slug, `/layout/fields/${f.key}`), 'PATCH', { enabled: !f.enabled });
      applied(res.layout);
    }, f.enabled ? `"${f.label}" is hidden` : `"${f.label}" is shown`);

  // Delete a field added with New Field. Without a confirmation the server only deletes it when no record has a value;
  // otherwise it answers with how many do, and the Super Admin is asked again.
  const confirmDelete = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      const res = await callApi<{ layout: ModuleLayoutDto }>(api(slug, `/layout/fields/${removing.field.key}`), 'DELETE', removing.warning ? { confirm: true } : {});
      applied(res.layout);
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

  const confirmDeleteSection = async () => {
    if (!removingSection) return;
    const res = await call(() => callApi<{ layout: ModuleLayoutDto }>(api(slug, `/layout/sections/${removingSection.id}`), 'DELETE'), `"${removingSection.label}" deleted`);
    if (res) applied(res.layout);
    setRemovingSection(null);
  };

  const submitSection = async (text: string) => {
    if (!sectionDialog) return;
    const res = await call(
      () => sectionDialog.mode === 'create'
        ? callApi<{ layout: ModuleLayoutDto }>(api(slug, '/layout/sections'), 'POST', { label: text })
        : callApi<{ layout: ModuleLayoutDto }>(api(slug, `/layout/sections/${sectionDialog.id}`), 'PATCH', { label: text }),
      sectionDialog.mode === 'create' ? `Section "${text.trim()}" added` : 'Section renamed',
    );
    if (res) { applied(res.layout); setSectionDialog(null); }
  };

  const typeButton = (scope: string, sectionId: string | null, tableOnly: boolean, label: string, compact = false) => (
    <div className="relative" data-menu>
      <button
        onClick={() => setTypeMenu(t => (t === scope ? null : scope))}
        aria-haspopup="menu"
        aria-expanded={typeMenu === scope}
        className={compact
          ? 'px-2.5 h-[30px] whitespace-nowrap rounded-md border border-gray-300 hover:border-gray-500 bg-white text-[12px] font-medium text-gray-800 inline-flex items-center gap-1'
          : 'px-3 h-[36px] whitespace-nowrap rounded-md border-2 border-[#f5b800] hover:bg-[#fff8dc] bg-white text-[13px] font-semibold text-gray-900 inline-flex items-center gap-1.5'}
      >
        <Plus className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} /> {label} <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {typeMenu === scope && (
        <div role="menu" aria-label="Field type" className="absolute right-0 top-full mt-1 z-30 w-64 max-h-[60vh] overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl py-1">
          {CUSTOM_FIELD_TYPES.filter(t => (!tableOnly || TABLE_COLUMN_TYPES.has(t.type)) && (t.type !== 'LOOKUP' || def.allowLookupFields)).map(t => {
            const Icon = ICONS[t.type];
            return (
              <button key={t.type} role="menuitem" onClick={() => { setTypeMenu(null); setEditing({ field: null, createType: t.type, section: sectionId }); }} className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50">
                <Icon className="w-4 h-4 text-gray-500 shrink-0" />
                <span><span className="block text-[14px] text-gray-900">{t.label}</span><span className="block text-[11px] text-gray-500">{t.hint}</span></span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const toolbar = (
    <>
      {typeButton('top', null, false, 'New Field')}
      <button onClick={() => setSectionDialog({ mode: 'create' })} className="px-3 h-[36px] whitespace-nowrap rounded-md border border-gray-300 hover:border-gray-500 bg-white text-[13px] font-medium text-gray-800">New Section</button>
      <button onClick={() => setReorder('fields')} className="px-3 h-[36px] whitespace-nowrap rounded-md border border-gray-300 hover:border-gray-500 bg-white text-[13px] font-medium text-gray-800">Reorder Form Fields</button>
      <button onClick={() => setReorder('sections')} className="px-3 h-[36px] whitespace-nowrap rounded-md border border-gray-300 hover:border-gray-500 bg-white text-[13px] font-medium text-gray-800">Reorder Sections</button>
      <button onClick={() => setReorder('columns')} className="px-3 h-[36px] whitespace-nowrap rounded-md border border-gray-300 hover:border-gray-500 bg-white text-[13px] font-medium text-gray-800">Reorder Page Columns</button>
    </>
  );

  return (
    <div data-light-native className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center bg-black/50 p-0 sm:p-4 text-gray-900">
      <div role="dialog" aria-modal="true" aria-labelledby="records-layout-title" className="bg-white w-full sm:max-w-[1100px] max-h-screen sm:max-h-[94vh] sm:rounded-lg shadow-2xl flex flex-col">
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 id="records-layout-title" className="text-[19px] font-bold text-[#444]">Edit Page Layout <span className="text-gray-400 font-medium">· {def.label}</span></h2>
            <p className="text-[12px] text-gray-500 mt-0.5">The fields, sections and list columns of {def.plural.toLowerCase()}. This layout belongs to this page only. Use the three dots on a field to edit it, or New Field to add one.</p>
          </div>
          <button onClick={() => onClose(changed)} aria-label="Close" className="text-gray-500 hover:text-black shrink-0"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-gray-200 shrink-0">{toolbar}</div>

        <div className="overflow-y-auto px-6 py-5 bg-gray-50 flex-1 space-y-5">
          {moduleId === 'quote' && (
            <div className="border border-dashed border-gray-300 rounded-lg bg-white p-4" data-quote-document-panel>
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-bold text-[#333]">Quote document <span className="font-normal text-gray-500">· print, PDF and shared link</span></h3>
                  <p className="text-[13px] text-gray-600 mt-0.5">What is printed around the items of every quote: the company block, logo, title, the rows under them (# · Quote Date · Place Of Supply · Task Person), bank details and signature.</p>
                </div>
                <button onClick={() => setDocOpen(true)} className="px-3 h-[36px] whitespace-nowrap rounded-md border-2 border-[#f5b800] hover:bg-[#fff8dc] bg-white text-[13px] font-semibold text-gray-900">Edit Quote Document</button>
              </div>
            </div>
          )}
          {layout.sections.map(section => {
            const fields = layout.fields.filter(f => f.section === section.id);
            const isTable = section.kind === 'TABLE';
            const isFixed = section.kind === 'FIXED';
            return (
              <div key={section.id} className="border border-dashed border-gray-300 rounded-lg bg-white p-4" data-layout-section={section.id}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-[15px] font-bold text-[#333] truncate">{section.label}</h3>
                  {isTable && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-[11px] text-gray-600 shrink-0"><Table2 className="w-3 h-3" /> Table</span>}
                  {isFixed && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-[11px] text-gray-600 shrink-0"><Calculator className="w-3 h-3" /> Placed by the screens</span>}
                  <div className="ml-auto flex items-center gap-2">
                    {!isFixed && typeButton(`new:${section.id}`, section.id, isTable, isTable ? 'Add column' : 'Add field', true)}
                    <div className="relative" data-menu>
                      <button onClick={() => setMenuFor(m => (m === `section:${section.id}` ? null : `section:${section.id}`))} aria-label={`Options for section ${section.label}`} aria-haspopup="menu" aria-expanded={menuFor === `section:${section.id}`} className="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-black">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                      {menuFor === `section:${section.id}` && (
                        <div role="menu" className="absolute right-0 top-9 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-xl py-1">
                          <button role="menuitem" onClick={() => { setMenuFor(null); setSectionDialog({ mode: 'rename', id: section.id, label: section.label }); }} className="w-full text-left px-3 py-2 text-[14px] text-gray-800 hover:bg-gray-50">Rename Section</button>
                          {!section.isSystem && (
                            <button role="menuitem" onClick={() => { setMenuFor(null); setRemovingSection({ id: section.id, label: section.label, count: fields.length }); }} className="w-full flex items-center gap-2 px-3 py-2 text-[14px] text-[#d9232b] hover:bg-red-50"><Trash2 className="w-4 h-4" /> Delete Section</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {fields.length === 0 ? (
                  <p className="text-[13px] text-gray-500 py-3">No fields in this section yet.</p>
                ) : (
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {fields.map(f => {
                      const Icon = ICONS[f.type];
                      return (
                        <li key={f.key} data-layout-field={f.key} className={`relative flex items-center gap-3 border border-gray-200 rounded-md h-[46px] pl-3 pr-1.5 ${f.enabled ? 'bg-white' : 'bg-gray-50'} ${f.required ? 'border-l-[3px] border-l-[#e5484d]' : ''}`}>
                          <Icon className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />
                          <span className={`flex-1 min-w-0 truncate text-[14px] ${f.enabled ? 'text-gray-900' : 'text-gray-400'}`} title={f.label}>{f.label}</span>
                          {!f.enabled && <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 shrink-0"><EyeOff className="w-3.5 h-3.5" /> Hidden</span>}
                          {f.inList && <span className="text-[11px] text-[#8a6500] bg-[#fff8dc] rounded px-1.5 py-0.5 shrink-0 hidden sm:block">In list</span>}
                          <span className="text-[11px] text-gray-400 shrink-0 hidden lg:block">{f.isSystem ? FIELD_TYPE_LABEL[f.type] : `Custom · ${FIELD_TYPE_LABEL[f.type]}`}</span>
                          <div className="relative shrink-0" data-menu>
                            <button onClick={() => setMenuFor(m => (m === f.key ? null : f.key))} aria-label={`Options for ${f.label}`} aria-haspopup="menu" aria-expanded={menuFor === f.key} className="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-black">
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                            {menuFor === f.key && (
                              <div role="menu" className="absolute right-0 top-9 z-20 w-52 bg-white border border-gray-200 rounded-lg shadow-xl py-1">
                                <button role="menuitem" onClick={() => { setMenuFor(null); setEditing({ field: f, createType: null, section: null }); }} className="w-full text-left px-3 py-2 text-[14px] text-gray-800 hover:bg-gray-50">Edit Properties</button>
                                {!f.requiredLocked && (
                                  <button role="menuitem" disabled={busy} onClick={() => { setMenuFor(null); void toggleShown(f); }} className="w-full text-left px-3 py-2 text-[14px] text-gray-800 hover:bg-gray-50">{f.enabled ? 'Hide on the form' : 'Show on the form'}</button>
                                )}
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
                )}
              </div>
            );
          })}
          <p className="text-[12px] text-gray-500">
            <span className="inline-block w-[3px] h-3 bg-[#e5484d] align-middle mr-1.5" />Mandatory field. Standard fields can be renamed, hidden, made mandatory or optional, and moved, but not deleted. Hidden fields keep their data. Fields added with New Field can also be deleted.
          </p>
        </div>

        <div className="shrink-0 border-t border-gray-200 px-6 py-3 flex justify-end">
          <button onClick={() => onClose(changed)} className="px-6 h-[40px] rounded-md bg-black hover:bg-[#222] text-white text-[14px] font-medium">Close</button>
        </div>
      </div>

      {editing && (
        <FieldProperties
          key={editing.field?.key ?? `new-${editing.createType}-${editing.section}`}
          slug={slug}
          layout={layout}
          field={editing.field}
          createType={editing.createType}
          createSection={editing.section}
          onDirty={() => { setChanged(true); void refresh(); }}
          onClose={() => setEditing(null)}
          onSaved={applied}
        />
      )}

      {reorder === 'fields' && (
        <Modal title="Reorder form fields" subtitle={`The order of the fields of one section of the ${def.label} form.`} onClose={() => setReorder(null)}>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5" htmlFor="reorder-section">Section</label>
          <select id="reorder-section" value={reorderSection} onChange={e => setReorderSection(e.target.value)} className={`${field} mb-3`}>
            {layout.sections.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <ReorderList key={reorderSection} items={layout.fields.filter(f => f.section === reorderSection).map(f => ({ id: f.key, label: f.label, hint: f.enabled ? undefined : 'Hidden' }))} saveLabel="Save order" onSave={async ids => {
            const res = await call(() => callApi<{ layout: ModuleLayoutDto }>(api(slug, '/layout/fields/order'), 'PUT', { section: reorderSection, orderedKeys: ids }), 'Form field order saved');
            if (res) { applied(res.layout); setReorder(null); }
          }} />
        </Modal>
      )}
      {reorder === 'columns' && (
        <Modal title="Reorder page columns" subtitle={`The order of the columns of the ${def.plural} page. The ID comes first and Actions always stays last. Choose which fields are columns with Edit Properties.`} onClose={() => setReorder(null)}>
          <ReorderList items={layout.columns.map(k => ({ id: k, label: labelOf(k) }))} saveLabel="Save order" onSave={async ids => {
            const res = await call(() => callApi<{ layout: ModuleLayoutDto }>(api(slug, '/layout/columns'), 'PUT', { order: ids }), 'Column order saved');
            if (res) { applied(res.layout); setReorder(null); }
          }} />
        </Modal>
      )}
      {reorder === 'sections' && (
        <Modal title="Reorder sections" subtitle={`The order of the sections on the ${def.label} form.`} onClose={() => setReorder(null)}>
          <ReorderList items={layout.sections.map(s => ({ id: s.id, label: s.label, hint: s.kind === 'TABLE' ? 'Table' : s.kind === 'FIXED' ? 'Fixed' : undefined }))} saveLabel="Save order" onSave={async ids => {
            const res = await call(() => callApi<{ layout: ModuleLayoutDto }>(api(slug, '/layout/sections/order'), 'PUT', { orderedIds: ids }), 'Section order saved');
            if (res) { applied(res.layout); setReorder(null); }
          }} />
        </Modal>
      )}

      {sectionDialog && <SectionNameDialog dialog={sectionDialog} busy={busy} onSubmit={submitSection} onClose={() => setSectionDialog(null)} />}

      {docOpen && <DocumentEditor onClose={() => setDocOpen(false)} onSaved={() => setChanged(true)} />}

      {removing && (
        <LightConfirm title={removing.warning ? 'Field has data' : 'Delete field?'} confirmLabel="Delete" danger busy={busy} onCancel={() => setRemoving(null)} onConfirm={confirmDelete}>
          {removing.warning ? (
            <>
              <p>{removing.warning}</p>
              <p className="text-gray-500">The rest of each record is not changed. Are you sure you want to continue?</p>
            </>
          ) : (
            <p>“{removing.field.label}” will be removed from the {def.label} form, record and list{removing.field.type === 'DROPDOWN' ? ', together with its options' : ''}.</p>
          )}
        </LightConfirm>
      )}
      {removingSection && (
        <LightConfirm title="Delete section?" confirmLabel="Delete" danger busy={busy} onCancel={() => setRemovingSection(null)} onConfirm={confirmDeleteSection}>
          <p>“{removingSection.label}” will be removed.{removingSection.count > 0 ? ` Its ${removingSection.count} field${removingSection.count === 1 ? '' : 's'} move${removingSection.count === 1 ? 's' : ''} to the first section; nothing is deleted.` : ''}</p>
        </LightConfirm>
      )}
    </div>
  );
}

function SectionNameDialog({ dialog, busy, onSubmit, onClose }: { dialog: SectionDialog; busy: boolean; onSubmit: (label: string) => void; onClose: () => void }) {
  const [label, setLabel] = useState(dialog.mode === 'rename' ? dialog.label : '');
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
      <form role="dialog" aria-modal="true" aria-label={dialog.mode === 'create' ? 'New section' : 'Rename section'} onSubmit={e => { e.preventDefault(); if (label.trim()) onSubmit(label); }} className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm">
        <h3 className="text-[17px] font-bold text-[#333]">{dialog.mode === 'create' ? 'New Section' : 'Rename Section'}</h3>
        <label htmlFor="section-name" className="block text-[13px] font-medium text-gray-700 mt-4 mb-1.5">Section name</label>
        <input id="section-name" autoFocus value={label} onChange={e => setLabel(e.target.value)} maxLength={SECTION_LABEL_MAX} className={field} />
        <div className="flex justify-end gap-3 mt-5">
          <button type="button" disabled={busy} onClick={onClose} className="px-4 h-[38px] rounded-md bg-gray-200 text-gray-800 text-[14px] disabled:opacity-60">Cancel</button>
          <button type="submit" disabled={busy || !label.trim()} className="px-4 h-[38px] rounded-md bg-black text-white text-[14px] font-medium disabled:opacity-60">{dialog.mode === 'create' ? 'Create' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}
