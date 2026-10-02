import { withAuthRoute } from "@/lib/api";
import { hasPermission } from "@/lib/rbac/effective";
import { ServiceError } from "@/lib/users/service";
import { getFormOptions, listLeadsForExport, parseListParams } from "@/lib/leads/queries";
import { displayCustomValue } from "@/lib/leads/layout-shared";

// Spreadsheets run text that starts with = + - @ as a formula. Neutralise it.
function cell(value: unknown) {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

// GET /api/leads/export — CSV of the current filters (up to 10,000 rows). Requires leads.export.
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => {
    if (!hasPermission(ctx.permissions, "leads", "export")) throw new ServiceError(403, "You do not have permission to export leads.");
    const params = parseListParams(Object.fromEntries(new URL(request.url).searchParams));
    const [rows, options] = await Promise.all([listLeadsForExport(params), getFormOptions()]);
    const customFields = options.fields.filter(f => !f.isSystem);
    const optionLabel = (key: string) => (id: string) => (options.customOptions[key] ?? []).find(o => o.id === id)?.label;
    const header = ["Lead ID", "Date", "Time", "Customer", "Contact Number", "Lead Type", "Exact Requirement", "Amount", "Task Assigned Person", "Lead Person", "Lead Status", "Conventional Rate %", "Source", "Mode of Customer", "Main Category", "Category", "Subcategory", "Location", "Exact Location", "Location Link", "Notes", ...customFields.map(f => f.label)];
    const lines = [header.map(cell).join(",")];
    for (const r of rows) {
      lines.push([r.code, r.date, r.time, r.customerName, r.contactNumber, r.leadTypeLabel, r.exactRequirement, r.amount, r.taskPerson?.name, r.leadPerson?.name, r.leadStatus?.label, r.conventionalRate, r.sourceLabel, r.modeOfCustomerLabel, r.mainCategoryLabel, r.categoryLabel, r.subcategoryLabel, r.location, r.exactLocation, r.locationLink, r.notes, ...customFields.map(f => { const v = displayCustomValue(f, r.customFields?.[f.key], optionLabel(f.key)); return v === "—" ? "" : v; })].map(cell).join(","));
    }
    return new Response("﻿" + lines.join("\r\n"), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"` },
    });
  });
}
