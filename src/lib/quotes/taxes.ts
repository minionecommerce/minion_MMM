// The tax a new item row of a quote starts with: the one marked Default in Quote Settings → Taxes (GST18, 18%, to begin with). Pure: the quote form and the
// New Item form use it. A default that has been switched off is not offered, and with no default a new row starts without a tax.

import type { TaxDef } from "./types";

export const defaultTaxId = (taxes: readonly TaxDef[]): string => taxes.find(t => t.isDefault && t.active)?.id ?? "";

// A tax charged between two states is one IGST part (IGST18); the taxes charged inside a state are split (GST18 = CGST9 + SGST9)
export const isInterStateTax = (t: TaxDef): boolean => t.components.length === 1 && /^IGST/i.test(t.components[0].name);

// The Inter State Tax Rate that goes with an Intra State one: the IGST tax of the same rate (IGST18 for GST18), or none
export function interTaxFor(taxes: readonly TaxDef[], intraId: string): string {
  const intra = taxes.find(t => t.id === intraId);
  if (!intra) return "";
  return taxes.find(t => t.active && t.id !== intra.id && t.rate === intra.rate && isInterStateTax(t))?.id ?? "";
}

// Is a quote for a customer in another state? Place of Supply is a GST state code (33 = Tamil Nadu); the company's own state is in Quote Settings.
// Without both it is taken as the same state.
export const isInterState = (placeOfSupply: unknown, companyState: string): boolean =>
  typeof placeOfSupply === "string" && !!placeOfSupply.trim() && !!companyState.trim() && placeOfSupply.trim() !== companyState.trim();
