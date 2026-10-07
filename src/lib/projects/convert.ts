// Deals -> Convert to Project. The deal stays in the CRM (it only moves to the Converted Deals filter and can never be deleted); a project with the
// next code (MP1, MP2 ...) is made from it, and from then on its numbers come from the quotes, payment records and tasks of the deal.
import { Prisma } from "@prisma/client";
import { ZodError, type ZodIssue } from "zod";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac/effective";
import { ServiceError } from "@/lib/users/service";
import { DEAL_NUMBER_PREFIX } from "@/lib/leads/constants";
import { getLayout } from "@/lib/records/layout";
import { nextSeq } from "@/lib/records/service";
import { PROJECT_STATUS_DEFAULT } from "@/lib/records/registry";
import { cleanValue, isEmptyValue } from "@/lib/records/values";
import type { LayoutField } from "@/lib/records/types";
import { projectCodeFor } from "./calc";
import { dayDate, TX } from "./common";
import type { ConvertInput } from "./types";

const issue = (key: string, message: string): ZodIssue => ({ code: "custom", path: [key], message });

// The popup's seven fields, checked against the Project layout: a field the Super Admin hid is not asked for, one made mandatory is
export const CONVERT_FIELDS = ["productOrService", "name", "siteLocation", "siteLocationLink", "startDate", "expectedEndDate", "priorCompletionDate"] as const;

export function checkConvertInput(fields: LayoutField[], input: ConvertInput): Record<(typeof CONVERT_FIELDS)[number], string | null> {
  const issues: ZodIssue[] = [];
  const out = {} as Record<(typeof CONVERT_FIELDS)[number], string | null>;
  for (const key of CONVERT_FIELDS) {
    const f = fields.find(x => x.key === key);
    const raw = input[key];
    if (!f || (!f.enabled && !f.requiredLocked)) { out[key] = null; continue; }
    const res = cleanValue(f, raw);
    if ("error" in res) { issues.push(issue(key, res.error)); continue; }
    if (f.required && isEmptyValue(res.value)) { issues.push(issue(key, `${f.label} is required`)); continue; }
    out[key] = typeof res.value === "string" ? res.value : null;
  }
  const start = out.startDate;
  if (start && out.expectedEndDate && out.expectedEndDate < start) issues.push(issue("expectedEndDate", "The Project Completion Date cannot be before the Project Start Date"));
  if (start && out.priorCompletionDate && out.priorCompletionDate < start) issues.push(issue("priorCompletionDate", "The Prior Completion Date cannot be before the Project Start Date"));
  if (issues.length) throw new ZodError(issues);
  return out;
}

export async function convertDealToProject(ctx: AuthContext, dealId: string, input: ConvertInput) {
  if (!hasPermission(ctx.permissions, "deals", "edit")) throw new ServiceError(403, "You do not have permission to edit deals.");
  if (!hasPermission(ctx.permissions, "projects", "create")) throw new ServiceError(403, "You do not have permission to create projects.");

  const deal = await prisma.deal.findFirst({
    where: { id: dealId, dealNumber: { startsWith: DEAL_NUMBER_PREFIX }, deletedAt: null, lead: { deletedAt: null, convertedAt: { not: null } } },
    select: {
      id: true, dealNumber: true, title: true, customerId: true, leadId: true, projectConvertedAt: true,
      lead: { select: { closedAt: true, salesExecutiveId: true, leadPersonId: true } },
    },
  });
  if (!deal) throw new ServiceError(404, "Deal not found");
  if (deal.projectConvertedAt) throw new ServiceError(409, `Deal ${deal.dealNumber} is already converted to a project.`);
  if (deal.lead.closedAt) throw new ServiceError(409, `Deal ${deal.dealNumber} is closed. Revive it first, then convert it to a project.`);

  const layout = await getLayout("project");
  const checked = checkConvertInput(layout.fields, input);
  if (!checked.name) throw new ZodError([issue("name", "Project Name is required")]);
  const productOrService = checked.productOrService ?? null;

  // The project's manager is the person who has the deal (its Task Person); the person converting it when the deal has none
  const managerId = deal.lead.salesExecutiveId ?? deal.lead.leadPersonId ?? ctx.employeeId;
  if (!managerId) throw new ServiceError(400, "This deal has no Task Person and your account is not linked to an employee, so there is nobody to look after the project.");

  const statusField = layout.fields.find(f => f.key === "status");
  const status = statusField?.defaultValue && statusField.options.some(o => o.id === statusField.defaultValue) ? statusField.defaultValue : statusField?.options[0]?.id ?? PROJECT_STATUS_DEFAULT;

  try {
    return await prisma.$transaction(async tx => {
      // Two people converting the same deal: the second one finds it converted
      const locked = await tx.$queryRaw<{ projectConvertedAt: Date | null }[]>`SELECT "projectConvertedAt" FROM "Deal" WHERE "id" = ${deal.id} FOR UPDATE`;
      if (locked[0]?.projectConvertedAt) throw new ServiceError(409, `Deal ${deal.dealNumber} is already converted to a project.`);

      const seq = await nextSeq(tx, "project"); // taken last, so the counter row is locked for as short a time as possible
      const code = projectCodeFor(seq);
      const now = new Date();
      const project = await tx.project.create({
        data: {
          name: checked.name!,
          customerId: deal.customerId,
          leadId: deal.leadId,
          dealId: deal.id,
          managerId,
          status,
          startDate: dayDate(checked.startDate),
          expectedEndDate: dayDate(checked.expectedEndDate),
          priorCompletionDate: dayDate(checked.priorCompletionDate),
          productOrService,
          siteLocation: checked.siteLocation,
          siteLocationLink: checked.siteLocationLink,
          projectSeq: seq,
          projectCode: code,
          convertedAt: now,
          createdById: ctx.userId,
          updatedById: ctx.userId,
        },
        select: { id: true },
      });
      await tx.deal.update({ where: { id: deal.id }, data: { projectConvertedAt: now } });
      const log = (entityType: string, entityId: string, action: string, newValue: Record<string, unknown>) =>
        tx.cRMAuditLog.create({ data: { entityType, entityId, action, performedById: ctx.employeeId, dealId: deal.id, newValue: JSON.stringify(newValue) } });
      await log("Project", project.id, "Converted from Deal", { projectCode: code, dealNumber: deal.dealNumber, name: checked.name });
      await log("Deal", deal.id, "Converted to Project", { projectCode: code, projectId: project.id });
      return { projectId: project.id, code, dealNumber: deal.dealNumber ?? "" };
    }, TX);
  } catch (err) {
    // Project.leadId is unique: a lead that already has a project (an older one) cannot get a second
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") throw new ServiceError(409, "A project already exists for this deal.");
    throw err;
  }
}
