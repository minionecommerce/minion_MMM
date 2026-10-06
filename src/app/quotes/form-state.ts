// The state of the quote form: the item rows and the calculation panel as typed (text), and the totals they work out to.
// The server works the totals out again from what is sent; this is only what the form shows while you type.

import { calcTotals } from '@/lib/quotes/calc';
import type { CalcOut, ItemDto, LineDto, LineInput, QuoteDto, QuoteSettings, TaxInfo } from '@/lib/quotes/types';

export type LineState = {
  key: string; // stable while the form is open
  id?: string; // the saved row
  itemId: string | null;
  name: string;
  description: string;
  hsn: string;
  unit: string;
  quantity: string;
  rate: string;
  taxId: string;
  custom: Record<string, unknown>;
  showDesc: boolean;
};

export type CalcState = { discount: string; shipping: string; wKind: 'TDS' | 'TCS'; wTaxId: string; adjLabel: string; adjustment: string };

let counter = 0;
export const newKey = () => `l_${Date.now().toString(36)}_${(counter++).toString(36)}`;

export const blankLine = (): LineState => ({ key: newKey(), itemId: null, name: '', description: '', hsn: '', unit: '', quantity: '1', rate: '', taxId: '', custom: {}, showDesc: false });

export const isBlankLine = (l: LineState) => !l.name.trim() && !l.description.trim() && !l.itemId && !(Number(l.rate) > 0) && !l.hsn.trim() && Object.keys(l.custom).length === 0;

export function lineFromItem(item: ItemDto, base: LineState = blankLine()): LineState {
  return { ...base, itemId: item.id, name: item.name, description: item.description, hsn: item.hsn, unit: item.unit, rate: String(item.rate), taxId: item.taxId ?? '', showDesc: !!item.description };
}

export function lineFromDto(l: LineDto): LineState {
  return {
    key: newKey(), id: l.id, itemId: l.itemId, name: l.name, description: l.description, hsn: l.hsn, unit: l.unit, quantity: String(l.quantity), rate: String(l.rate),
    taxId: l.taxId ?? '', custom: l.custom ?? {}, showDesc: !!l.description,
  };
}

export const emptyCalc = (): CalcState => ({ discount: '', shipping: '', wKind: 'TDS', wTaxId: '', adjLabel: 'Adjustment', adjustment: '' });

export function calcFromDto(c: QuoteDto['calc']): CalcState {
  return {
    discount: c.discountPercent ? String(c.discountPercent) : '', shipping: c.shippingCharges ? String(c.shippingCharges) : '', wKind: c.withholding?.kind ?? 'TDS', wTaxId: c.withholding?.taxId ?? '',
    adjLabel: c.adjustmentLabel || 'Adjustment', adjustment: c.adjustment ? String(c.adjustment) : '',
  };
}

export function toNumber(s: string | number): number {
  if (typeof s === 'number') return Number.isFinite(s) ? s : 0;
  const n = Number(String(s).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

export function taxInfo(settings: QuoteSettings, id: string): TaxInfo | null {
  const t = settings.taxes.find(x => x.id === id);
  return t ? { id: t.id, name: t.name, rate: t.rate, components: t.components } : null;
}

export function computeTotals(lines: LineState[], calc: CalcState, settings: QuoteSettings): CalcOut {
  const list = calc.wKind === 'TDS' ? settings.tds : settings.tcs;
  const w = calc.wTaxId ? list.find(x => x.id === calc.wTaxId) : undefined;
  return calcTotals({
    lines: lines.map(l => ({ quantity: toNumber(l.quantity), rate: toNumber(l.rate), tax: l.taxId ? taxInfo(settings, l.taxId) : null })),
    discountPercent: Math.min(100, Math.max(0, toNumber(calc.discount))),
    shipping: toNumber(calc.shipping),
    withholding: w ? { kind: calc.wKind, id: w.id, name: w.name, rate: w.rate } : null,
    adjustment: toNumber(calc.adjustment),
    rounding: settings.rounding.mode,
  });
}

// A number as typed: a number when it is one, otherwise the text itself (so the server explains what is wrong instead of reading it as 0)
export function numberOrText(s: string, empty: number): number | string {
  const t = s.replace(/,/g, '').trim();
  if (t === '') return empty;
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : s;
}

// What the API takes for a row
export function lineToInput(l: LineState): LineInput {
  return {
    ...(l.id ? { id: l.id } : {}), itemId: l.itemId, name: l.name, description: l.description, hsn: l.hsn, unit: l.unit,
    quantity: numberOrText(l.quantity, 1) as number, rate: numberOrText(l.rate, 0) as number, taxId: l.taxId || null, custom: l.custom,
  };
}
