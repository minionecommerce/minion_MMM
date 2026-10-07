// The rules of the Projects module that are plain arithmetic: project codes, the money of a project, Work Coverage, vendor balances and
// durations. No database and no browser code here, so the server (which is the one that decides) and the tests use exactly the same functions.
// Money is added up in paise (whole numbers) so the numbers on the page always add up exactly; every result is given back in rupees.

const num = (n: unknown): number => (typeof n === "number" && Number.isFinite(n) ? n : 0);
export const toPaise = (n: unknown): number => Math.round(num(n) * 100);
export const toRupees = (paise: number): number => paise / 100;
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

// ---------------------------------------------------------------------------
// Codes: MP1, MP1M1, MP1S1
// ---------------------------------------------------------------------------
export const PROJECT_CODE_PREFIX = "MP";
export const projectCodeFor = (seq: number) => `${PROJECT_CODE_PREFIX}${seq}`;
export const materialCodeFor = (projectCode: string, seq: number) => `${projectCode}M${seq}`;
export const serviceCodeFor = (projectCode: string, seq: number) => `${projectCode}S${seq}`;

// ---------------------------------------------------------------------------
// Which payment records count as money. A rejected or cancelled record is not money that was paid or collected.
// (The statuses are the option ids Pre-Payment and Payment Collection start with; renaming an option keeps its id.)
// ---------------------------------------------------------------------------
export const EXCLUDED_PAYMENT_STATUSES: readonly string[] = ["rejected", "cancelled"];
export const countsAsMoney = (paymentStatus: string | null | undefined) => !paymentStatus || !EXCLUDED_PAYMENT_STATUSES.includes(paymentStatus);

export function totalOf(amounts: (number | null | undefined)[]): number {
  return toRupees(sum(amounts.map(toPaise)));
}

// ---------------------------------------------------------------------------
// PROJECT VALUE INFORMATION: every accepted quote of the deal, its Exclusions, and the Total Quote Value (quote value - exclusions)
// ---------------------------------------------------------------------------
export type QuoteIn = { id: string; amount: number; exclusion: number | null };
export type QuoteLineOut = { id: string; quoteValue: number; exclusion: number; total: number };

export function valueInformation(quotes: QuoteIn[]): { lines: QuoteLineOut[]; total: number } {
  let all = 0;
  const lines = quotes.map(q => {
    const value = toPaise(q.amount);
    const exclusion = Math.max(0, toPaise(q.exclusion));
    const total = Math.max(0, value - exclusion); // an Exclusion bigger than the quote (the quote was lowered later) cannot make a quote count less than nothing
    all += total;
    return { id: q.id, quoteValue: toRupees(value), exclusion: toRupees(exclusion), total: toRupees(total) };
  });
  return { lines, total: toRupees(all) };
}

// What may be typed as the Exclusions of a quote: an amount from 0 up to the quote value. Returns the problem, or null.
export function checkQuoteExclusion(exclusion: number, quoteValue: number): string | null {
  if (!Number.isFinite(exclusion) || exclusion < 0) return "Exclusions cannot be less than 0";
  if (Number(exclusion.toFixed(2)) !== exclusion) return "Exclusions can have at most 2 decimal places";
  if (toPaise(exclusion) > toPaise(quoteValue)) return "Exclusions cannot be more than the Quote Value";
  return null;
}

// ---------------------------------------------------------------------------
// FINANCIAL SUMMARY
//   Balance Amount        = Project Value - Collected Amount
//   Profit Value          = Project Value - Expenses
//   Profit After Exclusions = Profit Value - Exclusions
//   Incentive Amount      = Profit After Exclusions x Incentive %   (nothing is paid out of a loss)
// ---------------------------------------------------------------------------
export type FinancialsIn = { projectValue: number; collected: number; expenses: number; exclusions: number | null; incentivePercent: number | null };
export type FinancialsOut = {
  projectValue: number;
  collected: number;
  balance: number;
  expenses: number;
  profit: number;
  exclusions: number;
  profitAfterExclusions: number;
  incentivePercent: number;
  incentiveAmount: number;
  expensesOfCollectedPct: number | null; // Expenses as a share of what was collected (the first percentage under Expenses)
  expensesOfValuePct: number | null; // Expenses as a share of the Project Value (the second one)
  profitPct: number | null; // Profit Value as a share of the Project Value
};

const pct = (part: number, whole: number): number | null => (whole > 0 ? Math.round((part / whole) * 100) : null);

export function financials(i: FinancialsIn): FinancialsOut {
  const value = toPaise(i.projectValue);
  const collected = toPaise(i.collected);
  const expenses = toPaise(i.expenses);
  const exclusions = toPaise(i.exclusions);
  const profit = value - expenses;
  const after = profit - exclusions;
  const incentivePercent = Math.max(0, num(i.incentivePercent));
  const incentive = after > 0 ? Math.round((after * Math.round(incentivePercent * 1000)) / 100_000) : 0;
  return {
    projectValue: toRupees(value),
    collected: toRupees(collected),
    balance: toRupees(value - collected),
    expenses: toRupees(expenses),
    profit: toRupees(profit),
    exclusions: toRupees(exclusions),
    profitAfterExclusions: toRupees(after),
    incentivePercent,
    incentiveAmount: toRupees(incentive),
    expensesOfCollectedPct: pct(expenses, collected),
    expensesOfValuePct: pct(expenses, value),
    profitPct: value > 0 ? Math.round((profit / value) * 100) : null,
  };
}

// ---------------------------------------------------------------------------
// VENDOR SELECTION: what was chosen for the items, and what follows from it
// ---------------------------------------------------------------------------
export type SelectionIn = { quoteItemId: string; templateId: string | null; serviceVendorIds: string[]; materialVendorIds: string[] };
const uniq = <T>(xs: T[]) => Array.from(new Set(xs));

// The vendors chosen anywhere in the project, once each, in the order the items come (Vendor Selection -> the two Involvement tables)
export function selectedVendors(selections: SelectionIn[], itemOrder: string[]): { service: string[]; material: string[] } {
  const rank = new Map(itemOrder.map((id, i) => [id, i]));
  const live = selections.filter(s => rank.has(s.quoteItemId)).sort((a, b) => rank.get(a.quoteItemId)! - rank.get(b.quoteItemId)!);
  return { service: uniq(live.flatMap(s => s.serviceVendorIds)), material: uniq(live.flatMap(s => s.materialVendorIds)) };
}

// The templates a vendor was chosen for, once each, in item order (the first one is the vendor's "relevant template" for a payment)
export function templatesOfVendor(selections: SelectionIn[], itemOrder: string[], kind: "service" | "material", vendorId: string): string[] {
  const rank = new Map(itemOrder.map((id, i) => [id, i]));
  return uniq(
    selections
      .filter(s => rank.has(s.quoteItemId) && !!s.templateId && (kind === "service" ? s.serviceVendorIds : s.materialVendorIds).includes(vendorId))
      .sort((a, b) => rank.get(a.quoteItemId)! - rank.get(b.quoteItemId)!)
      .map(s => s.templateId as string),
  );
}

// ---------------------------------------------------------------------------
// WORK COVERAGE: one row per template used in Vendor Selection (never twice)
//   Item Value    = the value of every item that has the template
//   Amount Spent  = the Site Expenses (PPRs) whose Work Type is the template
//   Profit Earned = Item Value - Amount Spent
// ---------------------------------------------------------------------------
export type ItemIn = { id: string; templateId: string | null; amount: number };
export type WorkCoverageRow = { templateId: string; itemValue: number; amountSpent: number; profit: number; completed: boolean };

export function workCoverage(items: ItemIn[], spentByTemplate: Record<string, number>, completed: Record<string, boolean>): WorkCoverageRow[] {
  const values = new Map<string, number>();
  for (const item of items) {
    if (!item.templateId) continue;
    values.set(item.templateId, (values.get(item.templateId) ?? 0) + toPaise(item.amount));
  }
  return Array.from(values, ([templateId, itemValue]) => {
    const spent = toPaise(spentByTemplate[templateId]);
    return { templateId, itemValue: toRupees(itemValue), amountSpent: toRupees(spent), profit: toRupees(itemValue - spent), completed: completed[templateId] === true };
  });
}

// ---------------------------------------------------------------------------
// VENDOR INVOLVEMENT
//   Balance Amount = Quoted Value - Given Amount
//   Credit Value   = Given Amount - Quoted Value, when more was given than quoted (Material Vendor only)
// With no Quoted Value typed yet there is nothing to compare with: no balance and no credit.
// ---------------------------------------------------------------------------
export function vendorBalance(quoted: number | null | undefined, given: number): { balance: number | null; credit: number } {
  if (quoted === null || quoted === undefined) return { balance: null, credit: 0 };
  const q = toPaise(quoted);
  const g = toPaise(given);
  return { balance: toRupees(q - g), credit: g > q ? toRupees(g - q) : 0 };
}

// ---------------------------------------------------------------------------
// Durations (Service Vendor Involvement): the days from the Start Date to the Completion Date, and from the Started Date to the Completed Date
// ---------------------------------------------------------------------------
const DAY_MS = 24 * 60 * 60 * 1000;
const dayNumber = (day: string) => Date.parse(`${day}T00:00:00Z`);

// Whole calendar days from one day (YYYY-MM-DD) to another; null when a day is missing or the end is before the start
export function daysBetween(from: string | null | undefined, to: string | null | undefined): number | null {
  if (!from || !to) return null;
  const a = dayNumber(from);
  const b = dayNumber(to);
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  return Math.round((b - a) / DAY_MS);
}

const days = (n: number) => `${n} ${n === 1 ? "Day" : "Days"}`;

// "10 Days / 12 Days" (planned / actual), or just the one that is known
export function durationText(planned: number | null, actual: number | null): string {
  if (planned !== null && actual !== null) return `${days(planned)} / ${days(actual)}`;
  if (planned !== null) return days(planned);
  if (actual !== null) return days(actual);
  return "";
}
