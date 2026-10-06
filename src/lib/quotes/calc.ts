// The totals of a quote. One function, used by the form (live) and the server (which is the one that decides what is saved).
// Sequence: Item Subtotal -> Discount -> Tax -> Shipping -> TDS/TCS -> Adjustment -> Round Off -> Total.
// Everything is worked out in paise (whole numbers), each step rounded half up, so the amounts add up exactly as they are printed.

import type { CalcIn, CalcLineIn, CalcLineOut, CalcOut, RoundingMode, TaxLineOut } from "./types";

const num = (n: unknown): number => (typeof n === "number" && Number.isFinite(n) ? n : 0);
const paise = (n: unknown): number => Math.round(num(n) * 100);
const milli = (n: unknown): number => Math.round(num(n) * 1000); // percentages keep three decimals
const rupees = (p: number): number => p / 100;
const share = (base: number, rateMilli: number): number => Math.round((base * rateMilli) / 100_000); // base x rate% (rate in thousandths)

// quantity x rate, in paise
function lineAmount(l: CalcLineIn): number {
  return Math.round((paise(l.quantity) * paise(l.rate)) / 100);
}

function roundTo(total: number, mode: RoundingMode): number {
  switch (mode) {
    case "nearest": return Math.round(total / 100) * 100;
    case "up": return Math.ceil(total / 100) * 100;
    case "down": return Math.floor(total / 100) * 100;
    default: return total;
  }
}

export function calcTotals(input: CalcIn): CalcOut {
  const dMilli = Math.max(0, Math.min(100_000, milli(input.discountPercent)));
  const taxTotals = new Map<string, TaxLineOut & { cents: number }>();

  let subTotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  const lines: (CalcLineOut & { cents: { amount: number; discount: number; taxable: number; tax: number } })[] = [];

  for (const l of input.lines) {
    const amount = lineAmount(l);
    const discount = share(amount, dMilli);
    const taxable = amount - discount;
    let tax = 0;
    if (l.tax) {
      const parts = l.tax.components.length ? l.tax.components : [{ name: l.tax.name, rate: l.tax.rate }];
      for (const c of parts) {
        const part = share(taxable, milli(c.rate));
        tax += part;
        const key = `${c.name}|${c.rate}`;
        const prev = taxTotals.get(key);
        if (prev) prev.cents += part;
        else taxTotals.set(key, { name: c.name, rate: c.rate, amount: 0, cents: part });
      }
    }
    subTotal += amount;
    discountTotal += discount;
    taxTotal += tax;
    lines.push({ amount: rupees(amount), discount: rupees(discount), taxable: rupees(taxable), tax: rupees(tax), cents: { amount, discount, taxable, tax } });
  }

  const taxable = subTotal - discountTotal;
  const shipping = paise(input.shipping);
  let withholding = 0;
  if (input.withholding) {
    // TDS is deducted on the value of the goods and services (before tax); TCS is collected on everything that is charged (with tax and shipping)
    const base = input.withholding.kind === "TDS" ? taxable : taxable + taxTotal + shipping;
    const amount = share(base, milli(input.withholding.rate));
    withholding = input.withholding.kind === "TDS" ? -amount : amount;
  }
  const adjustment = paise(input.adjustment);
  const before = taxable + taxTotal + shipping + withholding + adjustment;
  const total = roundTo(before, input.rounding);

  return {
    lines: lines.map(({ amount, discount, taxable: t, tax }) => ({ amount, discount, taxable: t, tax })),
    subTotal: rupees(subTotal),
    discountAmount: rupees(discountTotal),
    taxableTotal: rupees(taxable),
    taxTotal: rupees(taxTotal),
    taxes: Array.from(taxTotals.values()).map(t => ({ name: t.name, rate: t.rate, amount: rupees(t.cents) })),
    shipping: rupees(shipping),
    withholdingAmount: rupees(withholding),
    adjustment: rupees(adjustment),
    roundOff: rupees(total - before),
    total: rupees(total),
  };
}
