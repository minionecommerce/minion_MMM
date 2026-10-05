import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { ServiceError } from "./service";
import { buildLayout, getDepartmentOrder, mutateStored, readStored, sortDepartments } from "./layout";
import { DEPARTMENT_NAME_MAX } from "./layout-shared";

// The choices of the Department pick list in Users → Edit Page Layout. They are the company's departments (the same
// ones the Team page uses). Super Admin only. The order is kept in the layout setting, so the Department table itself
// is not changed.

export type DepartmentDto = { id: string; name: string; usage: number }; // usage = people in the department

function assertSuperAdmin(ctx: AuthContext) {
  if (!ctx.isSuperAdmin) throw new ServiceError(403, "Only a Super Admin can edit the page layout.");
}

function cleanName(raw: string) {
  const name = raw.replace(/\s+/g, " ").trim();
  if (!name) throw new ServiceError(400, "Department name is required.");
  if (name.length > DEPARTMENT_NAME_MAX) throw new ServiceError(400, `Department name must be ${DEPARTMENT_NAME_MAX} characters or fewer.`);
  return name;
}

async function assertNameFree(name: string, exceptId?: string) {
  const clash = await prisma.department.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { id: true },
  });
  if (clash) throw new ServiceError(409, `A department called "${name}" already exists.`);
}

export async function listDepartmentOptions(ctx: AuthContext): Promise<DepartmentDto[]> {
  assertSuperAdmin(ctx);
  const [rows, saved] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, _count: { select: { employees: true } } } }),
    getDepartmentOrder(),
  ]);
  return sortDepartments(rows, saved).map(r => ({ id: r.id, name: r.name, usage: r._count.employees }));
}

export async function createDepartmentOption(ctx: AuthContext, rawName: string) {
  assertSuperAdmin(ctx);
  const name = cleanName(rawName);
  await assertNameFree(name);
  const created = await prisma.$transaction(async tx => {
    const dept = await tx.department.create({ data: { name }, select: { id: true, name: true } });
    // Goes to the end of the list, also when the order has been set before
    await mutateStored(tx, stored => (Array.isArray(stored.departmentOrder) && stored.departmentOrder.length ? { ...stored, departmentOrder: [...stored.departmentOrder, dept.id] } : stored));
    await writeAudit({ action: "DEPARTMENT_CREATED", actorUserId: ctx.userId, newValue: { id: dept.id, name } }, tx);
    return dept;
  });
  return created;
}

export async function renameDepartmentOption(ctx: AuthContext, id: string, rawName: string) {
  assertSuperAdmin(ctx);
  const name = cleanName(rawName);
  const dept = await prisma.department.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!dept) throw new ServiceError(404, "That department does not exist.");
  if (dept.name === name) return;
  await assertNameFree(name, id);
  await prisma.$transaction(async tx => {
    await tx.department.update({ where: { id }, data: { name } });
    // Employees also keep the department name as plain text (older records and the Team page); keep it in step
    await tx.employee.updateMany({ where: { departmentId: id }, data: { department: name } });
    await writeAudit({ action: "DEPARTMENT_RENAMED", actorUserId: ctx.userId, oldValue: { id, name: dept.name }, newValue: { id, name } }, tx);
  });
}

// A department with people in it is only removed after the Super Admin confirmed it; those people are left with no department
export async function deleteDepartmentOption(ctx: AuthContext, id: string, confirm: boolean) {
  assertSuperAdmin(ctx);
  const dept = await prisma.department.findUnique({ where: { id }, select: { id: true, name: true, _count: { select: { employees: true } } } });
  if (!dept) throw new ServiceError(404, "That department does not exist.");
  // If Department is a required field, the last department cannot go: the Create User / Edit User forms could not be saved
  const required = buildLayout(await readStored()).fields.find(f => f.key === "departmentId")?.required;
  if (required && (await prisma.department.count()) <= 1) {
    throw new ServiceError(400, "Department is a required field, so it needs at least one department. Make it optional first, or add another department before deleting this one.");
  }
  const usage = dept._count.employees;
  if (usage > 0 && !confirm) {
    throw new ServiceError(409, `${usage} ${usage === 1 ? "person is" : "people are"} in "${dept.name}". Confirm to remove the department from them.`);
  }
  await prisma.$transaction(async tx => {
    await tx.employee.updateMany({ where: { departmentId: id }, data: { departmentId: null, department: null } });
    await tx.department.delete({ where: { id } });
    await mutateStored(tx, stored => {
      const fields = { ...(stored.fields ?? {}) };
      const own = fields.departmentId;
      if (own && own.defaultValue === id) {
        const { defaultValue: _gone, ...rest } = own; // the default pointed at this department
        void _gone;
        if (Object.keys(rest).length) fields.departmentId = rest;
        else delete fields.departmentId;
      }
      return { ...stored, fields, ...(Array.isArray(stored.departmentOrder) ? { departmentOrder: stored.departmentOrder.filter(x => x !== id) } : {}) };
    });
    await writeAudit({ action: "DEPARTMENT_DELETED", actorUserId: ctx.userId, oldValue: { id, name: dept.name, people: usage } }, tx);
  });
  return { deleted: true, usage };
}

export async function reorderDepartmentOptions(ctx: AuthContext, orderedIds: string[]) {
  assertSuperAdmin(ctx);
  if (new Set(orderedIds).size !== orderedIds.length) throw new ServiceError(400, "Duplicate departments in the new order.");
  const all = await prisma.department.findMany({ select: { id: true } });
  if (orderedIds.length !== all.length || !orderedIds.every(id => all.some(d => d.id === id))) {
    throw new ServiceError(400, "The new order must list every department exactly once.");
  }
  await prisma.$transaction(async tx => {
    await mutateStored(tx, stored => ({ ...stored, departmentOrder: orderedIds }));
    await writeAudit({ action: "DEPARTMENTS_REORDERED", actorUserId: ctx.userId, newValue: { order: orderedIds } }, tx);
  });
  return { ok: true };
}
