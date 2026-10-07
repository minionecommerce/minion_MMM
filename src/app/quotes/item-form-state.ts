// The state of the New Item form and the rules that check it, without any screen: what a new item starts as, what an item opens as, which fields are wrong,
// and what is sent to the server. The server checks the same things again; this is what lets the form say so before it sends.

import {
  DEFAULT_DIM_UNIT, DEFAULT_TAX_PREFERENCE, DEFAULT_VALUATION, DEFAULT_WEIGHT_UNIT, INVENTORY_ACCOUNTS, MAX_DIMENSION, hasInventory, isTaxCode, isTaxable, taxCodeField, unitGroupOf,
  type Identifier, type ItemKind,
} from '@/lib/quotes/item-constants';
import type { ItemDetailDto } from '@/lib/quotes/types';

export type ItemFormState = {
  name: string; kind: ItemKind; category: string; hsn: string; taxPreference: string;
  unitMode: 'unit' | 'group'; unit: string; unitGroup: string; sku: string; identifiers: Identifier[];
  description: string; rate: string; taxId: string;
  trackInventory: boolean; inventoryTracking: string; inventoryAccount: string; valuationMethod: string; reorderPoint: string;
  returnable: boolean; dimLength: string; dimWidth: string; dimHeight: string; dimUnit: string; weight: string; weightUnit: string;
  taskTemplateId: string; taskTemplateName: string; isActive: boolean;
};

const str = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n));

// A new item: Goods, Taxable with the default tax, stock tracked (as the reference form starts) with the first account and FIFO already chosen, cm and kg
export function blankItemForm(name = '', defaultTax = ''): ItemFormState {
  return {
    name, kind: 'Goods', category: '', hsn: '', taxPreference: DEFAULT_TAX_PREFERENCE, unitMode: 'unit', unit: '', unitGroup: '', sku: '', identifiers: [],
    description: '', rate: '', taxId: defaultTax, trackInventory: true, inventoryTracking: 'none', inventoryAccount: INVENTORY_ACCOUNTS[0], valuationMethod: DEFAULT_VALUATION, reorderPoint: '',
    returnable: true, dimLength: '', dimWidth: '', dimHeight: '', dimUnit: DEFAULT_DIM_UNIT, weight: '', weightUnit: DEFAULT_WEIGHT_UNIT,
    taskTemplateId: '', taskTemplateName: '', isActive: true,
  };
}

// An item that is opened to be changed
export function itemFormOf(i: ItemDetailDto): ItemFormState {
  return {
    name: i.name, kind: i.kind, category: i.category, hsn: i.hsn, taxPreference: i.taxPreference, unitMode: i.unitGroup ? 'group' : 'unit', unit: i.unit, unitGroup: i.unitGroup ?? '',
    sku: i.sku, identifiers: i.identifiers.map(x => ({ ...x })), description: i.description, rate: String(i.rate), taxId: i.taxId ?? '',
    trackInventory: i.trackInventory, inventoryTracking: i.inventoryTracking, inventoryAccount: i.inventoryAccount, valuationMethod: i.valuationMethod, reorderPoint: str(i.reorderPoint),
    returnable: i.returnable, dimLength: str(i.dimLength), dimWidth: str(i.dimWidth), dimHeight: str(i.dimHeight), dimUnit: i.dimUnit, weight: str(i.weight), weightUnit: i.weightUnit,
    taskTemplateId: i.taskTemplateId ?? '', taskTemplateName: i.taskTemplateName, isActive: i.isActive,
  };
}

// What is wrong, by the id of the field (it-<key>): the first one found is where the form scrolls to
export function checkItemForm(f: ItemFormState): Record<string, string> {
  const found: Record<string, string> = {};
  const code = taxCodeField(f.kind);
  if (!f.name.trim()) found.name = 'Name is required';
  if (!f.hsn.trim()) found.hsn = `${code} is required`;
  else if (!isTaxCode(f.hsn.trim())) found.hsn = `${code} must be 2 to 8 digits`;
  const amount = (value: string, key: string, what: string, max: number, places: number, required = false) => {
    const t = value.trim().replace(/,/g, '');
    if (!t) { if (required) found[key] = `${what} is required`; return; }
    const n = Number(t);
    if (!/^\d+(\.\d+)?$/.test(t) || !Number.isFinite(n) || n > max || Math.round(n * 10 ** places) / 10 ** places !== n) found[key] = `${what} must be a number from 0 to ${max.toLocaleString('en-IN')} with ${places} decimals at most`;
  };
  amount(f.rate, 'rate', 'Selling Price', 99_999_999.99, 2, true);
  if (!f.taskTemplateId) found.taskTemplateId = 'Task Template is required';
  if (hasInventory(f.kind)) {
    if (f.trackInventory) {
      if (!f.inventoryAccount.trim()) found.inventoryAccount = 'Inventory Account is required';
      amount(f.reorderPoint, 'reorderPoint', 'Reorder Point', 99_999_999_999.99, 2);
    }
    amount(f.dimLength, 'dimLength', 'The length', MAX_DIMENSION, 3);
    amount(f.dimWidth, 'dimLength', 'The width', MAX_DIMENSION, 3);
    amount(f.dimHeight, 'dimLength', 'The height', MAX_DIMENSION, 3);
    amount(f.weight, 'weight', 'The weight', MAX_DIMENSION, 3);
  }
  return found;
}

// What the form sends: Goods send the stock, returns, size and weight too; a Service does not; a tax only goes with a taxable item; a unit group sends its first unit
export function itemBodyOf(f: ItemFormState, pictures: { front: string[]; rear: string[]; other: string[] }) {
  const goods = hasInventory(f.kind);
  const group = f.unitMode === 'group' ? unitGroupOf(f.unitGroup) : null;
  return {
    name: f.name, kind: f.kind, category: f.category, hsn: f.hsn.trim(), taxPreference: f.taxPreference, description: f.description,
    unit: group ? group.units[0] : f.unitMode === 'group' ? '' : f.unit, unitGroup: group ? group.id : null,
    sku: f.sku, identifiers: f.identifiers.filter(i => i.value.trim()), rate: f.rate.trim() === '' ? undefined : f.rate.trim().replace(/,/g, ''),
    taxId: isTaxable(f.taxPreference) && f.taxId ? f.taxId : null, taskTemplateId: f.taskTemplateId, isActive: f.isActive,
    ...(goods ? {
      trackInventory: f.trackInventory, inventoryTracking: f.inventoryTracking, inventoryAccount: f.inventoryAccount, valuationMethod: f.valuationMethod, reorderPoint: f.reorderPoint,
      returnable: f.returnable, dimLength: f.dimLength, dimWidth: f.dimWidth, dimHeight: f.dimHeight, dimUnit: f.dimUnit, weight: f.weight, weightUnit: f.weightUnit,
    } : {}),
    files: pictures,
  };
}
