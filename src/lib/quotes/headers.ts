// What the columns of the quote list are called: the reference list says DATE, QUOTE NUMBER, REFERENCE#, CUSTOMER NAME, QUOTE STATUS, TOTAL, while the
// form fields are called Quote Date, Quote#, ... A column that was renamed in Edit Page Layout shows its new name. Used by the list page and the CSV export.

import { MODULES } from "@/lib/records/registry";

const LIST_HEADERS: Record<string, string> = { date: "Date", quoteNumber: "Quote Number", reference: "Reference#", customerId: "Customer Name", status: "Quote Status", amount: "Total" };

export function listHeader(key: string, label: string): string {
  const standard = MODULES.quote.fields.find(f => f.key === key)?.label;
  return LIST_HEADERS[key] && label === standard ? LIST_HEADERS[key] : label;
}
