// Helpers shared by the Projects services: permissions, loading a project, reading and checking the values of a layout's fields.
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac/effective";
import type { Action } from "@/lib/rbac/catalog";
import { ServiceError } from "@/lib/users/service";
import { isId } from "@/lib/records/values";
import type { LayoutField } from "@/lib/records/types";

// Reading and checking the values of a layout's fields is shared with the Customers service
export { changes, dayDate, dayOf, dec, decOr0, fieldValue, has, isObject, mergeCustom, splitValues, type Split } from "@/lib/records/split";

export type Db = Prisma.TransactionClient | typeof prisma;
export const TX = { maxWait: 10_000, timeout: 20_000 };

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------
export function need(ctx: AuthContext, action: Action) {
  if (!hasPermission(ctx.permissions, "projects", action)) throw new ServiceError(403, `You do not have permission to ${action} projects.`);
}

export const notFound = () => new ServiceError(404, "Project not found");

// ---------------------------------------------------------------------------
// A project of the module (it has a project code) that is not removed
// ---------------------------------------------------------------------------
export const PROJECT_SELECT = {
  id: true, projectCode: true, projectSeq: true, name: true, dealId: true, leadId: true, customerId: true, managerId: true,
  siteLocation: true, siteLocationLink: true, productOrService: true, startDate: true, expectedEndDate: true, priorCompletionDate: true,
  actualStartDate: true, completedDate: true, status: true, progress: true, exclusions: true, incentivePercent: true, customFields: true,
  convertedAt: true, createdAt: true, updatedAt: true,
} satisfies Prisma.ProjectSelect;
export type ProjectRecord = Prisma.ProjectGetPayload<{ select: typeof PROJECT_SELECT }> & { projectCode: string; dealId: string };

export async function loadProject(id: string, db: Db = prisma): Promise<ProjectRecord> {
  if (!isId(id)) throw notFound();
  const p = await db.project.findFirst({ where: { id, deletedAt: null, projectCode: { not: null }, dealId: { not: null } }, select: PROJECT_SELECT });
  if (!p || !p.projectCode || !p.dealId) throw notFound();
  return p as ProjectRecord;
}

// One project at a time while its rows are renumbered or its vendor rows are made (held until the transaction ends)
export async function lockProject(tx: Prisma.TransactionClient, projectId: string) {
  await tx.$queryRaw`SELECT "id" FROM "Project" WHERE "id" = ${projectId} FOR UPDATE`;
}

// ---------------------------------------------------------------------------
// The activity log of the deal and the project
// ---------------------------------------------------------------------------
export async function audit(db: Db, ctx: AuthContext, project: { id: string; dealId: string | null }, action: string, oldValue?: unknown, newValue?: unknown) {
  await db.cRMAuditLog.create({
    data: {
      entityType: "Project",
      entityId: project.id,
      action,
      performedById: ctx.employeeId,
      ...(project.dealId ? { dealId: project.dealId } : {}),
      oldValue: oldValue === undefined ? null : JSON.stringify(oldValue),
      newValue: newValue === undefined ? null : JSON.stringify(newValue),
    },
  });
}

export const sectionFields = (layoutFields: LayoutField[], sectionId: string) => layoutFields.filter(f => f.section === sectionId);
