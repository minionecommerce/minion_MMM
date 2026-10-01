import { withAuthRoute } from "@/lib/api";
import { hasPermission } from "@/lib/rbac/effective";
import { ServiceError } from "@/lib/users/service";
import { listLeadsForExport, parseListParams } from "@/lib/leads/queries";

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
    const rows = await listLeadsForExport(params);
    const header = ["Lead ID", "Date", "Time", "Customer", "Contact Number", "Lead Type", "Requirement", "Exact Requirement", "Amount", "Task Assigned Person", "Lead Person", "Lead Status", "Conventional Rate %", "Source", "Mode of Customer", "Main Category", "Category", "Subcategory", "Location", "Exact Location", "Location Link", "Notes"];
    const lines = [header.map(cell).join(",")];
    for (const r of rows) {
      lines.push([r.code, r.date, r.time, r.customerName, r.contactNumber, r.leadTypeLabel, r.requirementLabel, r.exactRequirement, r.amount, r.taskPerson?.name, r.leadPerson?.name, r.leadStatus?.label, r.conventionalRate, r.sourceLabel, r.modeOfCustomerLabel, r.mainCategoryLabel, r.categoryLabel, r.subcategoryLabel, r.location, r.exactLocation, r.locationLink, r.notes].map(cell).join(","));
    }
    return new Response("﻿" + lines.join("\r\n"), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"` },
    });
  });
}
