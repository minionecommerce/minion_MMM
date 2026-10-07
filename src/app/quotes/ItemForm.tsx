'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, CircleHelp, Plus, Search, X } from 'lucide-react';
import { ApiError, callApi } from '@/lib/leads/client';
import { useToast } from '@/components/ui/Toast';
import {
  DIM_UNITS, IDENTIFIER_TYPES, INVENTORY_TRACKING, MAX_IDENTIFIERS, TAX_PREFERENCES, UNIT_GROUPS, VALUATION_METHODS, WEIGHT_UNITS,
  digitsOnly, hasFulfilment, hasInventory, isTaxable, taxCodeField, unitGroupOf, type Identifier, type ItemKind,
} from '@/lib/quotes/item-constants';
import type { ItemDetailDto, TaxDef } from '@/lib/quotes/types';
import { CUSTOMER_CSS, PrefixBox, Radios, Tick } from '../customers/controls';
import { searchLookup } from '../records/client';
import { Button, Combo, Spinner, inputClass, type ComboItem } from './ui';
import ItemImageCard, { picCount, type Pic, type Pics } from './ItemImages';
import { discardItemImage, itemImageSrc, searchItemOptions } from './item-client';
import { defaultTaxId } from '@/lib/quotes/taxes';
import { blankItemForm, checkItemForm, itemBodyOf, itemFormOf, type ItemFormState } from './item-form-state';

type Form = ItemFormState;

const picsOf = (files: { id: string; fileName: string; size: number }[]): Pic[] => files.map(f => ({ id: f.id, fileName: f.fileName, size: f.size, src: itemImageSrc(f.id), fresh: false }));

// ---------------------------------------------------------------------------
// Pieces of the form
// ---------------------------------------------------------------------------
function Help({ text }: { text: string }) {
  return <span title={text} className="inline-flex ml-[6px] align-middle text-[#7f8497] cursor-help"><CircleHelp className="w-[15px] h-[15px]" aria-label={text} /></span>;
}

// A row of the form: the label on the left, what goes with it on the right
function Row({ label, required, tip, dotted, error, id, width = 174, children }: {
  label: string; required?: boolean; tip?: string; dotted?: boolean; error?: string; id?: string; width?: number; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start gap-y-[5px] mb-[14px]" data-row>
      <label htmlFor={id} style={{ '--lw': `${width}px` } as React.CSSProperties} className={`sm:shrink-0 sm:w-[var(--lw)] sm:pt-[7px] pr-3 text-[13px] leading-[19px] ${required ? 'text-[#d93b3b]' : 'text-[#22263b]'}`}>
        <span className={dotted ? 'border-b border-dotted border-current pb-px' : ''}>{label}{required && '*'}</span>{tip && <Help text={tip} />}
      </label>
      <div className="min-w-0 w-full sm:w-auto sm:flex-1">
        {children}
        {error && <p role="alert" id={id ? `${id}-error` : undefined} className="mt-[6px] text-[12px] text-[#d9232b]">{error}</p>}
      </div>
    </div>
  );
}

// "Item Details", "Item Description" ...: a line above and a heading
function Section({ title, children, first, check }: { title: string; children: React.ReactNode; first?: boolean; check?: React.ReactNode }) {
  return (
    <section className={`px-[16px] ${first ? 'pt-[24px]' : 'pt-[26px] border-t border-[#ebeaf2]'} pb-[14px]`} data-section={title}>
      <h2 className="flex items-center gap-[8px] text-[18px] leading-[26px] text-[#22263b] mb-[16px]">{check}{title}</h2>
      {children}
    </section>
  );
}

// The two choices of Item Type: the chosen one has a blue line and a blue tick; the other is grey
function TypeCard({ label, chosen, disabled, title, onClick }: { label: string; chosen: boolean; disabled?: boolean; title?: string; onClick?: () => void }) {
  return (
    <button type="button" role="radio" aria-checked={chosen} aria-disabled={disabled || undefined} disabled={disabled} title={title} onClick={onClick}
      className={`h-[38px] px-[12px] inline-flex items-center gap-[8px] rounded-[6px] text-[13px] ${chosen ? 'border border-[#548df6] bg-white font-semibold text-[#22263b]' : 'border border-transparent bg-[#efeff3] text-[#4b5068]'} ${disabled ? 'cursor-not-allowed' : ''}`}>
      <CheckCircle2 className={`w-[18px] h-[18px] ${chosen ? 'text-[#548df6]' : 'text-[#b9bccb]'}`} strokeWidth={2.2} aria-hidden />
      {label}
    </button>
  );
}

// A box with a small drop-down in front of it or behind it: "Unit | [unit]", "[cm] | kg"
function Segment({ value, onChange, options, label, side = 'left', width }: { value: string; onChange: (v: string) => void; options: { id: string; label: string }[]; label: string; side?: 'left' | 'right'; width: number }) {
  return (
    <div className={`relative shrink-0 h-[34px] bg-[#f1f1f5] border border-[#d7d5e1] ${side === 'left' ? 'rounded-l-[4px]' : 'rounded-r-[4px] -ml-px'}`} style={{ width }}>
      <select value={value} onChange={e => onChange(e.target.value)} aria-label={label} className="absolute inset-0 w-full h-full appearance-none bg-transparent pl-[10px] pr-[22px] text-[13px] text-[#22263b] focus:outline-none focus:ring-1 focus:ring-[#548df6] rounded-[inherit]">
        {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
      <ChevronDown className="w-3.5 h-3.5 absolute right-[6px] top-1/2 -translate-y-1/2 text-[#6d7189] pointer-events-none" aria-hidden />
    </div>
  );
}

const numberBox = (value: string, onChange: (v: string) => void, id: string, label: string, invalid?: boolean, extra = '') => (
  <input id={id} type="text" inputMode="decimal" value={value} onChange={e => onChange(e.target.value)} aria-label={label} aria-invalid={invalid || undefined} className={inputClass(invalid, extra)} />
);

// ---------------------------------------------------------------------------
// The New Item / Edit Item form
// ---------------------------------------------------------------------------
export default function ItemForm({ item, initialName = '', taxes, onSaved, onCancel }: {
  item?: ItemDetailDto | null;
  initialName?: string;
  taxes: TaxDef[];
  onSaved: (item: ItemDetailDto) => void;
  onCancel: () => void;
}) {
  const toast = useToast();
  const [f, setF] = useState<Form>(() => (item ? itemFormOf(item) : blankItemForm(initialName, defaultTaxId(taxes))));
  const [pics, setPics] = useState<Pics>(() => ({ front: picsOf(item?.images.front ?? []), rear: picsOf(item?.images.rear ?? []), other: picsOf(item?.images.other ?? []) }));
  const [uploads, setUploads] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState('');
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setF(cur => ({ ...cur, [key]: value }));
    setErrors(cur => { if (!cur[key]) return cur; const { [key]: _gone, ...rest } = cur; void _gone; return rest; });
  };

  const goods = hasInventory(f.kind);
  const taxable = isTaxable(f.taxPreference);
  const codeLabel = taxCodeField(f.kind);
  const taxItems = useMemo<ComboItem[]>(() => taxes.filter(t => t.active || t.id === item?.taxId).map(t => ({ id: t.id, label: `${t.name} [${t.rate}%]` })), [taxes, item?.taxId]);
  const taxShown = taxItems.find(t => t.id === f.taxId)?.label ?? '';
  const group = f.unitMode === 'group' ? unitGroupOf(f.unitGroup) : null;

  const save = async () => {
    if (busy || uploads > 0) return;
    setBanner('');
    const found = checkItemForm(f);
    setErrors(found);
    if (Object.keys(found).length) {
      setBanner('Please fix the highlighted fields.');
      requestAnimationFrame(() => {
        const key = Object.keys(found)[0];
        const el = document.getElementById(`it-${key}`);
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        el?.focus({ preventScroll: true });
      });
      return;
    }
    setBusy(true);
    try {
      const body = itemBodyOf(f, { front: pics.front.map(p => p.id), rear: pics.rear.map(p => p.id), other: pics.other.map(p => p.id) });
      const res = item
        ? await callApi<{ item: ItemDetailDto }>(`/api/quotes/items/${item.id}`, 'PUT', body)
        : await callApi<{ item: ItemDetailDto }>('/api/quotes/items', 'POST', body);
      toast.success(item ? `${res.item.name} saved` : `${res.item.name} added`);
      onSaved(res.item);
    } catch (e) {
      if (e instanceof ApiError && e.details?.length) setBanner(e.details.map(d => d.message).join(' · '));
      else setBanner(e instanceof Error ? e.message : 'Could not save the item');
      setBusy(false);
    }
  };

  const cancel = () => {
    // pictures that were uploaded here and never saved are thrown away
    for (const p of [...pics.front, ...pics.rear, ...pics.other]) if (p.fresh) { URL.revokeObjectURL(p.src); void discardItemImage(p.id); }
    onCancel();
  };

  const idLine = (i: number, patch: Partial<Identifier>) => set('identifiers', f.identifiers.map((x, k) => (k === i ? { ...x, ...patch } : x)));

  return (
    <div className="min-h-full flex flex-col bg-white text-[#22263b]" data-item-form>
      <style dangerouslySetInnerHTML={{ __html: CUSTOMER_CSS }} />
      <div className="h-[54px] px-[12px] flex items-center justify-between shrink-0 bg-white">
        <h1 className="text-[20px] font-normal text-black">{item ? 'Edit Item' : 'New Item'}</h1>
        <button type="button" onClick={cancel} aria-label="Close" className="w-8 h-8 rounded flex items-center justify-center text-[#7f8497] hover:bg-[#f1f1fa]"><X className="w-[22px] h-[22px]" /></button>
      </div>

      {/* Not a <form>: this window opens inside the quote form, and a form inside a form would let the Save button save the quote as well */}
      <div
        // Enter in a one-line box must not save a long form by accident
        onKeyDown={e => { const t = e.target as HTMLElement; if (e.key === 'Enter' && t.tagName === 'INPUT') e.preventDefault(); }}
        className="flex-1 flex flex-col"
        data-item-body
      >
        <div className="flex-1 pb-[30px]">
          {banner && (
            <div role="alert" className="mx-[16px] mb-3 flex items-start gap-2 rounded-[4px] border border-[#f3c2c4] bg-[#fdeeee] px-3 py-2 text-[13px] text-[#b42318]">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{banner}</span>
            </div>
          )}

          {/* ---- Name, Type, Category, HSN / SAC, Tax Preference, and the pictures ---- */}
          <div className="bg-[#f9f9fb] border-y border-[#eeeeee] px-[12px] pt-[21px] pb-[20px]" data-section="basic">
            <div className="flex flex-col lg:flex-row gap-x-[12px] gap-y-[18px]">
              <div className="lg:w-[620px] shrink-0">
                <Row label="Name" required id="it-name" width={148} error={errors.name}>
                  <input id="it-name" autoFocus={!initialName && !item} value={f.name} onChange={e => set('name', e.target.value)} maxLength={200} aria-invalid={!!errors.name || undefined} className={inputClass(!!errors.name, 'max-w-[417px]')} />
                </Row>
                <Row label="Type" tip="Choose Goods for things you supply, or Service for work you do." width={148}>
                  <Radios name="it-kind" value={f.kind} options={[{ id: 'Goods', label: 'Goods' }, { id: 'Service', label: 'Service' }]} onChange={v => set('kind', v as ItemKind)} />
                </Row>
                <Row label="Category" id="it-category" width={148}>
                  <Combo htmlId="it-category" className="max-w-[317px]" value={f.category || null} shown={f.category} search={q => searchItemOptions('categories', q)} creatable clearable
                    placeholder="Select a category" ariaLabel="Category" emptyText="No categories yet. Type one to add it." onChange={id => set('category', id ?? '')} />
                </Row>
                <Row label={codeLabel} required id="it-hsn" width={148} error={errors.hsn}>
                  {/* A plain box for the number, not a list: numbers only (letters, spaces and dashes never get in, a pasted "8536 50 90" becomes 85365090) */}
                  <input id="it-hsn" type="text" inputMode="numeric" autoComplete="off" spellCheck={false} value={f.hsn} onChange={e => set('hsn', digitsOnly(e.target.value))}
                    placeholder="Numbers only" aria-label={codeLabel} aria-invalid={!!errors.hsn || undefined} aria-describedby={errors.hsn ? 'it-hsn-error' : undefined} className={inputClass(!!errors.hsn, 'max-w-[317px]')} />
                </Row>
                <Row label="Tax Preference" required id="it-taxPreference" width={148}>
                  <Combo htmlId="it-taxPreference" className="max-w-[317px]" value={f.taxPreference} shown={TAX_PREFERENCES.find(t => t.id === f.taxPreference)?.label ?? ''} items={TAX_PREFERENCES} searchable={false}
                    placeholder="Select a tax preference" ariaLabel="Tax Preference" onChange={id => { if (id) { setF(cur => ({ ...cur, taxPreference: id, taxId: isTaxable(id) ? cur.taxId : '' })); } }} />
                </Row>
              </div>
              <ItemImageCard pics={pics} onChange={setPics} onBusy={d => setUploads(n => n + d)} />
            </div>
          </div>

          {/* ---- Item Details ---- */}
          <Section title="Item Details" first>
            <Row label="Item Type">
              <div role="radiogroup" aria-label="Item Type" className="flex flex-wrap gap-[10px]">
                <TypeCard label="Single Item" chosen />
                <TypeCard label="Contains Variants" chosen={false} disabled title="Items with variants are not available yet" />
              </div>
            </Row>
            <div className="flex flex-col lg:flex-row lg:gap-x-[56px]">
              <div className="lg:w-[493px] shrink-0">
                <Row label="Unit" tip="What the item is sold in, for example nos, sqft or kg. A unit group is a family of units: choosing one uses its first unit." id="it-unit">
                  <div className="flex max-w-[318px]">
                    <Segment value={f.unitMode} onChange={v => setF(cur => ({ ...cur, unitMode: v as 'unit' | 'group' }))} label="Unit or unit group" width={f.unitMode === 'unit' ? 62 : 104} options={[{ id: 'unit', label: 'Unit' }, { id: 'group', label: 'Unit Group' }]} />
                    {f.unitMode === 'unit' ? (
                      <Combo htmlId="it-unit" className="flex-1 min-w-0 -ml-px [&>div:first-child]:rounded-l-none" value={f.unit || null} shown={f.unit} search={q => searchItemOptions('units', q)} creatable clearable
                        placeholder="Select or type to add" ariaLabel="Unit" onChange={id => set('unit', id ?? '')} />
                    ) : (
                      <Combo htmlId="it-unit" className="flex-1 min-w-0 -ml-px [&>div:first-child]:rounded-l-none" value={f.unitGroup || null} shown={group ? `${group.label} (${group.units.slice(0, 3).join(', ')} ...)` : ''}
                        items={UNIT_GROUPS.map(g => ({ id: g.id, label: g.label, sub: g.units.join(', ') }))} searchable={false} clearable placeholder="Select a unit group" ariaLabel="Unit group" onChange={id => set('unitGroup', id ?? '')} />
                    )}
                  </div>
                  {group && <p className="mt-[6px] text-[12px] text-[#6d7189]">The item is sold in {group.units[0]}.</p>}
                </Row>
              </div>
              <div className="lg:w-[468px]">
                <Row label="SKU" tip="Stock Keeping Unit: a code that tells this item apart from the others. No two items can have the same SKU." id="it-sku" width={167}>
                  <input id="it-sku" value={f.sku} onChange={e => set('sku', e.target.value)} maxLength={100} className={inputClass(false, 'max-w-[301px]')} />
                </Row>
              </div>
            </div>
            {f.identifiers.length > 0 && (
              <div className="mb-[10px] space-y-[10px]" data-identifiers>
                {f.identifiers.map((idn, i) => (
                  <div key={i} className="flex items-center gap-[10px] sm:pl-[174px]">
                    <select value={idn.type} onChange={e => idLine(i, { type: e.target.value })} aria-label="Identifier type" className={inputClass(false, '!w-[140px]')}>
                      {IDENTIFIER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input value={idn.value} onChange={e => idLine(i, { value: e.target.value })} maxLength={100} aria-label={`${idn.type} number`} placeholder={idn.type} className={inputClass(false, '!w-[200px]')} />
                    <button type="button" onClick={() => set('identifiers', f.identifiers.filter((_, k) => k !== i))} aria-label={`Remove the ${idn.type} identifier`} className="text-[#e5484d] hover:bg-[#fdeeee] rounded p-1"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={() => set('identifiers', [...f.identifiers, { type: IDENTIFIER_TYPES[0], value: '' }])} disabled={f.identifiers.length >= MAX_IDENTIFIERS}
              className="inline-flex items-center gap-[7px] text-[13px] text-[#548df6] hover:underline disabled:opacity-50"><Plus className="w-[15px] h-[15px] rounded-full bg-[#548df6] text-white p-[2px]" aria-hidden /> Add Identifier</button>
            {item && (
              <div className="mt-[14px]"><Row label="Status"><Tick id="it-isActive" checked={f.isActive} onChange={v => set('isActive', v)} label="Active (it can be picked on a quote)" /></Row></div>
            )}
          </Section>

          {/* ---- Item Description ---- */}
          <Section title="Item Description">
            <Row label="Description" id="it-description" error={errors.description}>
              <textarea id="it-description" value={f.description} onChange={e => set('description', e.target.value)} maxLength={2000} rows={3} className={`${inputClass(!!errors.description)} !h-[74px] py-[6px] max-w-[319px] resize-y`} />
            </Row>
          </Section>

          {/* ---- Sales Information ---- */}
          <Section title="Sales Information" check={<input type="checkbox" className="c-check" checked disabled readOnly aria-label="Sales Information" title="Every item can be sold" />}>
            <Row label="Selling Price" required id="it-rate" error={errors.rate}>
              <div className="max-w-[318px]"><PrefixBox id="it-rate" prefix="INR" value={f.rate} onChange={v => set('rate', v)} invalid={!!errors.rate} /></div>
            </Row>
            {taxable && (
              <Row label="Tax" id="it-taxId" tip="The tax a quote line starts with when this item is picked. It can be changed on the quote.">
                <Combo htmlId="it-taxId" className="max-w-[318px]" value={f.taxId || null} shown={taxShown} items={taxItems} searchable={false} clearable placeholder="Select a tax" ariaLabel="Tax" onChange={id => set('taxId', id ?? '')} />
              </Row>
            )}
          </Section>

          {/* ---- Inventory (Goods) ---- */}
          {goods && (
            <section className="px-[16px] pt-[26px] border-t border-[#ebeaf2] pb-[14px]" data-section="Inventory">
              <div className="flex items-center gap-[8px] text-[16px] leading-[24px] text-[#22263b]">
                <Tick id="it-trackInventory" checked={f.trackInventory} onChange={v => set('trackInventory', v)} label="Track Inventory for this item" />
                <Help text="Keep count of how many of this item you have in stock." />
              </div>
              <p className="mt-[4px] mb-[18px] text-[12px] text-[#6d7189] pl-[24px]">You cannot enable/disable inventory tracking once you&apos;ve created transactions for this item</p>
              {f.trackInventory && (
                <div data-inventory>
                  <Row label="Inventory Tracking">
                    <Radios name="it-tracking" value={f.inventoryTracking} options={INVENTORY_TRACKING} onChange={v => set('inventoryTracking', v)} />
                  </Row>
                  <div className="flex flex-col lg:flex-row lg:gap-x-[56px]">
                    <div className="lg:w-[493px] shrink-0">
                      <Row label="Inventory Account" required dotted id="it-inventoryAccount" error={errors.inventoryAccount}>
                        <Combo htmlId="it-inventoryAccount" className="max-w-[318px]" value={f.inventoryAccount || null} shown={f.inventoryAccount} search={q => searchItemOptions('accounts', q)} creatable invalid={!!errors.inventoryAccount}
                          placeholder="Select an account" ariaLabel="Inventory Account" onChange={id => set('inventoryAccount', id ?? '')} />
                      </Row>
                    </div>
                    <div className="lg:w-[468px]">
                      <Row label="Inventory Valuation Method" required dotted width={167} id="it-valuationMethod">
                        <Combo htmlId="it-valuationMethod" className="max-w-[301px]" value={f.valuationMethod} shown={VALUATION_METHODS.find(m => m.id === f.valuationMethod)?.label ?? ''} items={VALUATION_METHODS} searchable={false}
                          placeholder="Select a method" ariaLabel="Inventory Valuation Method" onChange={id => { if (id) set('valuationMethod', id); }} />
                      </Row>
                    </div>
                  </div>
                  <Row label="Reorder Point" dotted id="it-reorderPoint" error={errors.reorderPoint}>
                    <div className="max-w-[318px]">{numberBox(f.reorderPoint, v => set('reorderPoint', v), 'it-reorderPoint', 'Reorder Point', !!errors.reorderPoint)}</div>
                  </Row>
                </div>
              )}
            </section>
          )}

          {/* ---- Cancellation and Returns (Goods) ---- */}
          {goods && (
            <Section title="Cancellation and Returns">
              <Row label="Returnable Item" tip="Mark Yes if a customer can return this item.">
                <Radios name="it-returnable" value={f.returnable ? 'yes' : 'no'} options={[{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }]} onChange={v => set('returnable', v === 'yes')} />
              </Row>
            </Section>
          )}

          {/* ---- Fulfilment Details (Goods) ---- */}
          {goods && hasFulfilment(f.kind) && (
            <Section title="Fulfilment Details">
              <div className="flex flex-col lg:flex-row lg:gap-x-[56px]">
                <div className="lg:w-[493px] shrink-0">
                  <Row label="Dimensions" id="it-dimLength" error={errors.dimLength}>
                    <div className="flex max-w-[318px]">
                      <div className="flex flex-1 min-w-0 items-center border border-r-0 border-[#d7d5e1] rounded-l-[4px] h-[34px] bg-white focus-within:border-[#548df6]">
                        <input id="it-dimLength" value={f.dimLength} onChange={e => set('dimLength', e.target.value)} inputMode="decimal" aria-label="Length" className="w-full min-w-0 h-full px-[8px] text-[13px] text-center bg-transparent focus:outline-none" />
                        <span className="text-[#9ca0ab] text-[12px]" aria-hidden>x</span>
                        <input value={f.dimWidth} onChange={e => set('dimWidth', e.target.value)} inputMode="decimal" aria-label="Width" className="w-full min-w-0 h-full px-[8px] text-[13px] text-center bg-transparent focus:outline-none" />
                        <span className="text-[#9ca0ab] text-[12px]" aria-hidden>x</span>
                        <input value={f.dimHeight} onChange={e => set('dimHeight', e.target.value)} inputMode="decimal" aria-label="Height" className="w-full min-w-0 h-full px-[8px] text-[13px] text-center bg-transparent focus:outline-none" />
                      </div>
                      <Segment value={f.dimUnit} onChange={v => set('dimUnit', v)} label="Unit of the dimensions" side="right" width={58} options={DIM_UNITS.map(u => ({ id: u, label: u }))} />
                    </div>
                    <p className="mt-[6px] text-[12px] text-[#6d7189]">(Length X Width X Height)</p>
                  </Row>
                </div>
                <div className="lg:w-[468px]">
                  <Row label="Weight" width={167} id="it-weight" error={errors.weight}>
                    <div className="flex max-w-[301px]">
                      {numberBox(f.weight, v => set('weight', v), 'it-weight', 'Weight', !!errors.weight, 'rounded-r-none')}
                      <Segment value={f.weightUnit} onChange={v => set('weightUnit', v)} label="Unit of the weight" side="right" width={58} options={WEIGHT_UNITS.map(u => ({ id: u, label: u }))} />
                    </div>
                  </Row>
                </div>
              </div>
            </Section>
          )}

          {/* ---- Additional Information ---- */}
          <Section title="Additional Information">
            <Row label="Task Template" required id="it-taskTemplateId" error={errors.taskTemplateId}>
              <Combo htmlId="it-taskTemplateId" className="max-w-[318px]" value={f.taskTemplateId || null} shown={f.taskTemplateName} search={q => searchLookup('quotes', 'templates', q)} invalid={!!errors.taskTemplateId}
                icon={<Search className="w-3.5 h-3.5 text-[#9ca0ab] shrink-0" aria-hidden />} placeholder="Click to select Name" ariaLabel="Task Template" emptyText="No task templates found" clearable
                onChange={(id, picked) => setF(cur => ({ ...cur, taskTemplateId: id ?? '', taskTemplateName: picked?.label ?? '' }))} />
            </Row>
          </Section>
        </div>

        <div className="sticky bottom-0 z-20 bg-white border-t border-[#eeeeee] shadow-[0_-2px_6px_rgba(34,38,59,0.05)] px-[12px] py-[12px] flex flex-wrap items-center gap-[10px]">
          <Button kind="blue" onClick={() => void save()} busy={busy} disabled={uploads > 0}>Save</Button>
          <Button onClick={cancel} disabled={busy}>Cancel</Button>
          {uploads > 0 && <span className="text-[13px] text-[#6d7189] inline-flex items-center gap-2"><Spinner className="w-3.5 h-3.5" /> Uploading pictures…</span>}
          {picCount(pics) > 0 && uploads === 0 && <span className="text-[12px] text-[#9ca0ab]">{picCount(pics)} picture{picCount(pics) === 1 ? '' : 's'}</span>}
        </div>
      </div>
    </div>
  );
}
