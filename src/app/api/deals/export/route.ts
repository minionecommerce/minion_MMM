import { withAuthRoute } from "@/lib/api";
import { hasPermission } from "@/lib/rbac/effective";
import { ServiceError } from "@/lib/users/service";
import { getFormOptions } from "@/lib/leads/queries";
import { displayCustomValue } from "@/lib/leads/layout-shared";
import { listDealsForExport, parseDealParams } from "@/lib/deals/queries";

// Spreadsheets run text that starts with = + - @ as a formula. Neutralise it.
function cell(value: unknown) {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

// GET /api/deals/export — CSV of the current filters (up to 10,000 rows). Requires deals.export.
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => {
    if (!hasPermission(ctx.permissions, "deals", "export")) throw new ServiceError(403, "You do not have permission to export deals.");
    const params = parseDealParams(Object.fromEntries(new URL(request.url).searchParams));
    const [rows, options] = await Promise.all([listDealsForExport(params), getFormOptions()]);
    const customFields = options.fields.filter(f => !f.isSystem);
    const optionLabel = (key: string) => (id: string) => (options.customOptions[key] ?? []).find(o => o.id === id)?.label;
    const header = ["Deal ID", "Lead ID", "Deal Name", "Deal Created", "Lead Created", "Customer", "Contact Number", "Lead Type", "Exact Requirement", "Amount (Deal Value)", "Deal Validity", "Task Assigned Person", "Lead Person", "Deal Status", "Status", "Follow-ups", "Conventional Rate %", "Source", "Mode of Customer", "Main Category", "Category", "Subcategory", "Location", "Exact Location", "Location Link", "Notes", ...customFields.map(f => f.label)];
    const lines = [header.map(cell).join(",")];
    for (const r of rows) {
      lines.push([r.code, r.leadCode, r.deal.name, r.deal.created, r.deal.leadCreated, r.customerName, r.contactNumber, r.leadTypeLabel, r.exactRequirement, r.amount, r.deal.validity, r.taskPerson?.name, r.leadPerson?.name, r.deal.status?.label, r.status, r.followUpCount, r.conventionalRate, r.sourceLabel, r.modeOfCustomerLabel, r.mainCategoryLabel, r.categoryLabel, r.subcategoryLabel, r.location, r.exactLocation, r.locationLink, r.notes, ...customFields.map(f => { const v = displayCustomValue(f, r.customFields?.[f.key], optionLabel(f.key)); return v === "—" ? "" : v; })].map(cell).join(","));
    }
    return new Response("﻿" + lines.join("\r\n"), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="deals-${new Date().toISOString().slice(0, 10)}.csv"` },
    });
  });
}
