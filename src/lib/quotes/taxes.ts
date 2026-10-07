// The tax a new item row of a quote starts with: the one marked Default in Quote Settings → Taxes (GST18, 18%, to begin with). Pure: the quote form and the
// New Item form use it. A default that has been switched off is not offered, and with no default a new row starts without a tax.

import type { TaxDef } from "./types";

export const defaultTaxId = (taxes: readonly TaxDef[]): string => taxes.find(t => t.isDefault && t.active)?.id ?? "";
