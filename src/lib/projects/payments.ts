// Money records made from a project: the Payment icon of a Service Vendor (a Pre-Payment Record with the deal, vendor and template filled in),
// the payment history of a vendor, and Create PPR / Create PCR in the Site Expenses and Payment Collection sections (the deal is fixed).
import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac/effective";
import { ServiceError } from "@/lib/users/service";
import { formatDay, isId, defaultFor } from "@/lib/records/values";
import { todayDay } from "@/lib/leads/format";
import { getLayout } from "@/lib/records/layout";
import { createRecord } from "@/lib/records/service";
import type { LayoutField, ModuleLayoutDto } from "@/lib/records/types";
import { countsAsMoney, templatesOfVendor, totalOf, type SelectionIn } from "./calc";
import { dec, loadProject, need } from "./common";
import { getProjectDetail } from "./detail";
import type { ProjectDetail, VendorPayment } from "./types";

const AMOUNT_MAX = 9_999_999_999.99;

// ---------------------------------------------------------------------------
// The record form's own defaults, so a record made from here starts the way one made on the record page does
// ---------------------------------------------------------------------------
function startingValues(layout: ModuleLayoutDto, me: { id: string }, given: Record<string, unknown>, prefer: Record<string, string> = {}): Record<string, unknown> {
  const values: Record<string, unknown> = { ...given };
  for (const f of layout.fields) {
    if (layout.sections.find(s => s.id === f.section)?.kind !== "FORM" || !f.enabled) continue;
    if (f.type === "AUTO" || f.type === "APPROVER" || f.type === "FILE" || f.type === "CALC" || f.type === "LOOKUP" || f.readOnly) continue;
    if (values[f.key] !== undefined) continue;
    let v = defaultFor(f, me);
    // a mandatory dropdown without a default starts with the option that fits (Service Payment ...), else the first one
    if ((v === null || v === undefined) && f.type === "DROPDOWN" && f.required) v = f.options.find(o => o.id === prefer[f.key])?.id ?? f.options[0]?.id ?? null;
    if (v !== null && v !== undefined) values[f.key] = v;
  }
  return values;
}

// What the record page needs to say when a mandatory field cannot be filled from here
function explain(err: unknown, layout: ModuleLayoutDto): never {
  if (err instanceof ZodError) {
    const labels = err.issues.map(i => layout.fields.find(f => f.key === String(i.path[1]))?.label ?? i.message);
    throw new ServiceError(400, `The record form has mandatory fields that cannot be filled from here (${Array.from(new Set(labels)).join(", ")}). Create it from the Payment Records page instead.`);
  }
  throw err;
}

// ---------------------------------------------------------------------------
// The Payment icon of a Service Vendor row: Amount, OK -> a new Pre-Payment Record
// ---------------------------------------------------------------------------
export async function createServiceVendorPayment(ctx: AuthContext, projectId: string, rowId: string, input: { amount: number; templateId?: string | null }): Promise<{ detail: ProjectDetail; code: string }> {
  need(ctx, "edit");
  if (!hasPermission(ctx.permissions, "ppr", "create")) throw new ServiceError(403, "You do not have permission to create pre-payment records.");
  const project = await loadProject(projectId);
  if (!isId(rowId)) throw new ServiceError(404, "Row not found");
  const amount = input.amount;
  if (!Number.isFinite(amount) || amount <= 0) throw new ServiceError(400, "Enter an amount more than 0.");
  if (amount > AMOUNT_MAX || Number(amount.toFixed(2)) !== amount) throw new ServiceError(400, "Enter a valid amount (at most 2 decimal places).");

  const row = await prisma.projectServiceVendor.findFirst({ where: { id: rowId, projectId: project.id } });
  if (!row) throw new ServiceError(404, "That row no longer exists. Reload the page.");
  const vendor = await prisma.serviceVendor.findFirst({ where: { id: row.serviceVendorId, deletedAt: null }, select: { code: true, name: true } });
  if (!vendor) throw new ServiceError(409, "That Service Vendor was deleted, so nothing can be paid to it from here.");

  // The template: the one this vendor was chosen for (the first, when it was chosen for items of several), unless the popup chose another
  const [projectLayout, pprLayout, selections, items] = await Promise.all([
    getLayout("project"),
    getLayout("prePayment"),
    prisma.projectItemSelection.findMany({ where: { projectId: project.id } }),
    prisma.quoteItem.findMany({ where: { quote: { dealId: project.dealId, status: "Accepted", deletedAt: null } }, orderBy: [{ quote: { date: "asc" } }, { sortOrder: "asc" }], select: { id: true } }),
  ]);
  const templateField = projectLayout.fields.find(f => f.key === "templateId");
  const selectionsIn: SelectionIn[] = selections.map(s => ({ quoteItemId: s.quoteItemId, templateId: s.templateId, serviceVendorIds: s.serviceVendorIds, materialVendorIds: s.materialVendorIds }));
  const own = templatesOfVendor(selectionsIn, items.map(i => i.id), "service", row.serviceVendorId);
  let templateId: string | null = input.templateId ?? (own.length ? own[0] : null);
  if (templateId && !templateField?.options.some(o => o.id === templateId)) throw new ServiceError(400, "That template is not one of the project templates.");
  if (templateId && !pprLayout.fields.find(f => f.key === "workTypeId")?.enabled) templateId = null; // the Work Type field was hidden in the Pre-Payment layout
  const templateLabel = templateId ? templateField?.options.find(o => o.id === templateId)?.label : null;

  const given: Record<string, unknown> = {
    dealId: project.dealId,
    serviceVendorId: row.serviceVendorId,
    amount,
    taskPersonId: ctx.userId,
    date: todayDay(),
    remarks: `Payment to ${vendor.code} - ${vendor.name} from project ${project.projectCode}${templateLabel ? ` (${templateLabel})` : ""}`,
    ...(templateId ? { workTypeId: templateId } : {}),
  };
  const values = startingValues(pprLayout, { id: ctx.userId }, given, { paymentType: "service_payment" });
  let created: { id: string; code: string };
  try {
    created = await createRecord(ctx, "prePayment", { values });
  } catch (err) {
    explain(err, pprLayout);
  }
  return { detail: await getProjectDetail(ctx, projectId), code: created.code };
}

// ---------------------------------------------------------------------------
// The History icon: every payment to a vendor for this deal
// ---------------------------------------------------------------------------
export async function vendorPayments(ctx: AuthContext, projectId: string, kind: "service" | "material", rowId: string): Promise<{ vendor: string; payments: VendorPayment[]; total: number }> {
  need(ctx, "view");
  if (!hasPermission(ctx.permissions, "ppr", "view")) throw new ServiceError(403, "You do not have permission to view pre-payment records.");
  const project = await loadProject(projectId);
  if (!isId(rowId)) throw new ServiceError(404, "Row not found");
  const vendorId = kind === "service"
    ? (await prisma.projectServiceVendor.findFirst({ where: { id: rowId, projectId: project.id }, select: { serviceVendorId: true } }))?.serviceVendorId
    : (await prisma.projectMaterialVendor.findFirst({ where: { id: rowId, projectId: project.id }, select: { materialVendorId: true } }))?.materialVendorId;
  if (!vendorId) throw new ServiceError(404, "That row no longer exists. Reload the page.");
  const [layout, rows, vendor] = await Promise.all([
    getLayout("prePayment"),
    prisma.prePayment.findMany({
      where: { dealId: project.dealId, deletedAt: null, ...(kind === "service" ? { serviceVendorId: vendorId } : { materialVendorId: vendorId }) },
      orderBy: [{ date: "desc" }, { seq: "desc" }],
      select: { id: true, code: true, date: true, paymentStatus: true, remarks: true, amount: true },
    }),
    kind === "service"
      ? prisma.serviceVendor.findUnique({ where: { id: vendorId }, select: { code: true, name: true } })
      : prisma.materialVendor.findUnique({ where: { id: vendorId }, select: { code: true, companyName: true } }),
  ]);
  const statusField: LayoutField | undefined = layout.fields.find(f => f.key === "paymentStatus");
  const payments = rows.map<VendorPayment>(p => ({
    id: p.id,
    code: p.code,
    date: p.date ? formatDay(p.date.toISOString().slice(0, 10)) : null,
    amount: dec(p.amount) ?? 0,
    status: statusField?.options.find(o => o.id === p.paymentStatus)?.label ?? "",
    remarks: p.remarks ?? "",
    counted: countsAsMoney(p.paymentStatus),
  }));
  const name = vendor ? `${vendor.code} - ${"name" in vendor ? vendor.name : vendor.companyName}` : "";
  return { vendor: name, payments, total: totalOf(payments.filter(p => p.counted).map(p => p.amount)) };
}

// ---------------------------------------------------------------------------
// Create PPR / Create PCR inside the project: the record form posts here, and the deal is always the project's deal
// ---------------------------------------------------------------------------
export async function createProjectRecord(ctx: AuthContext, projectId: string, kind: "prePayment" | "paymentCollection", body: { values?: unknown; rows?: unknown }) {
  need(ctx, "view");
  const project = await loadProject(projectId);
  const values = typeof body.values === "object" && body.values !== null && !Array.isArray(body.values) ? { ...(body.values as Record<string, unknown>) } : {};
  values.dealId = project.dealId; // whatever the page sent: the deal of a record made inside a project cannot be changed
  return createRecord(ctx, kind, { ...body, values });
}
