import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { loadAuthState } from "@/lib/auth";
import { permissionKey } from "@/lib/rbac/catalog";
import { getDepartmentOrder, sortDepartments } from "./layout";

export const PAGE_SIZE = 20;

export type UserListParams = {
  q?: string;
  access?: string; // "super_admin" or the id of an access level
  status?: string;
  sort?: "name" | "email" | "createdAt" | "lastLoginAt" | "status";
  dir?: "asc" | "desc";
  page?: number;
};

export async function listUsers(params: UserListParams) {
  const page = Math.max(1, params.page || 1);
  const where: Prisma.UserWhereInput = { deletedAt: null };
  if (params.q) {
    const q = params.q.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { employee: { employeeCode: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (params.access === "super_admin") where.isSuperAdmin = true;
  else if (params.access) {
    where.isSuperAdmin = false;
    where.accessId = params.access;
  }
  if (params.status) where.status = params.status;

  const dir = params.dir === "asc" ? "asc" : "desc";
  const orderBy: Prisma.UserOrderByWithRelationInput =
    params.sort === "name" ? { name: dir } :
    params.sort === "email" ? { email: dir } :
    params.sort === "status" ? { status: dir } :
    params.sort === "lastLoginAt" ? { lastLoginAt: { sort: dir, nulls: "last" } } :
    { createdAt: dir };

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        isAdmin: true,
        isSuperAdmin: true,
        accessId: true,
        lastLoginAt: true,
        createdAt: true,
        role: { select: { id: true, name: true, _count: { select: { permissions: true } } } },
        employee: {
          select: {
            employeeCode: true,
            designation: true,
            department: true,
            departmentRef: { select: { name: true } },
            _count: { select: { permissionOverrides: true } },
          },
        },
      },
    }),
  ]);

  const users = rows.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    status: u.status,
    isAdmin: u.isAdmin,
    isSuperAdmin: u.isSuperAdmin,
    accessId: u.accessId,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    roleId: u.role?.id ?? null,
    roleName: u.role?.name ?? null,
    employeeCode: u.employee?.employeeCode ?? null,
    designation: u.employee?.designation ?? null,
    department: u.employee?.departmentRef?.name || u.employee?.department || null,
    overrideCount: u.employee?._count.permissionOverrides ?? 0,
  }));

  return { users, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getUserProfile(id: string) {
  const u = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      status: true,
      isAdmin: true,
      mustChangePassword: true,
      lastLoginAt: true,
      lockedUntil: true,
      passwordChangedAt: true,
      createdAt: true,
      deletedAt: true,
      isSuperAdmin: true,
      accessId: true,
      role: { select: { id: true, name: true } },
      employee: {
        select: {
          id: true,
          employeeCode: true,
          designation: true,
          contactNumber: true,
          department: true,
          departmentId: true,
          departmentRef: { select: { name: true } },
          joiningDate: true,
          customFields: true,
          permissionOverrides: { select: { effect: true, permission: { select: { module: true, action: true, isLegacy: true } } } },
        },
      },
    },
  });
  if (!u || u.deletedAt) return null;

  const [state, activity, rolePerms] = await Promise.all([
    loadAuthState(u.id),
    prisma.securityAuditLog.findMany({
      where: { OR: [{ targetUserId: u.id }, { actorUserId: u.id }] },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, action: true, actorUserId: true, targetUserId: true, createdAt: true, ip: true },
    }),
    u.role
      ? prisma.rolePermission.findMany({ where: { roleId: u.role.id, effect: "ALLOW", permission: { isLegacy: false } }, select: { permission: { select: { module: true, action: true } } } })
      : Promise.resolve([]),
  ]);

  const actorIds = Array.from(new Set(activity.map(a => a.actorUserId).filter((x): x is string => !!x)));
  const actors = await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } });
  const actorName = new Map(actors.map(a => [a.id, a.name]));

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    status: u.status,
    isAdmin: u.isAdmin,
    isSuperAdmin: u.isSuperAdmin,
    accessId: u.accessId,
    mustChangePassword: u.mustChangePassword,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    lockedUntil: u.lockedUntil && u.lockedUntil > new Date() ? u.lockedUntil.toISOString() : null,
    passwordChangedAt: u.passwordChangedAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    roleId: u.role?.id ?? null,
    roleName: u.role?.name ?? null,
    employeeId: u.employee?.id ?? null,
    employeeCode: u.employee?.employeeCode ?? null,
    designation: u.employee?.designation ?? null,
    phone: u.employee?.contactNumber ?? null,
    departmentId: u.employee?.departmentId ?? null,
    department: u.employee?.departmentRef?.name || u.employee?.department || null,
    joiningDate: u.employee?.joiningDate?.toISOString() ?? null,
    customFields: ((u.employee?.customFields ?? {}) as Record<string, string | number | boolean>),
    effectivePermissions: state?.permissions ?? [],
    rolePermissions: rolePerms.map(r => permissionKey(r.permission.module, r.permission.action)),
    overrides: (u.employee?.permissionOverrides ?? [])
      .filter(o => !o.permission.isLegacy)
      .map(o => ({ module: o.permission.module, action: o.permission.action, effect: o.effect as "ALLOW" | "DENY" })),
    activity: activity.map(a => ({
      id: a.id,
      action: a.action,
      createdAt: a.createdAt.toISOString(),
      ip: a.ip,
      actorName: a.actorUserId ? actorName.get(a.actorUserId) ?? "Unknown" : "System",
      selfInitiated: a.actorUserId === u.id,
    })),
  };
}

export type UserProfile = NonNullable<Awaited<ReturnType<typeof getUserProfile>>>;

export async function listRolesWithPermissions() {
  const roles = await prisma.role.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      isSystem: true,
      _count: { select: { users: { where: { deletedAt: null } } } },
      permissions: { where: { effect: "ALLOW", permission: { isLegacy: false } }, select: { permission: { select: { module: true, action: true } } } },
    },
  });
  return roles.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    isActive: r.isActive,
    isSystem: r.isSystem,
    userCount: r._count.users,
    permissions: r.permissions.map(p => permissionKey(p.permission.module, p.permission.action)),
  }));
}

export type RoleSummary = Awaited<ReturnType<typeof listRolesWithPermissions>>[number];

// In the order a Super Admin set in Users → Edit Page Layout (by name until then)
export async function listDepartments() {
  const [rows, saved] = await Promise.all([prisma.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }), getDepartmentOrder()]);
  return sortDepartments(rows, saved);
}

export async function listAuditLog(params: { action?: string; page?: number }) {
  const page = Math.max(1, params.page || 1);
  const where: Prisma.SecurityAuditLogWhereInput = params.action ? { action: params.action } : {};
  const [total, rows] = await Promise.all([
    prisma.securityAuditLog.count({ where }),
    prisma.securityAuditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 50, take: 50 }),
  ]);
  const ids = Array.from(new Set(rows.flatMap(r => [r.actorUserId, r.targetUserId]).filter((x): x is string => !!x)));
  const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
  const name = new Map(users.map(u => [u.id, u.name]));
  return {
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / 50)),
    entries: rows.map(r => ({
      id: r.id,
      action: r.action,
      createdAt: r.createdAt.toISOString(),
      actor: r.actorUserId ? name.get(r.actorUserId) ?? r.actorUserId : "—",
      target: r.targetUserId ? name.get(r.targetUserId) ?? r.targetUserId : "—",
      ip: r.ip,
      userAgent: r.userAgent,
      oldValue: r.oldValue,
      newValue: r.newValue,
      metadata: r.metadata,
    })),
  };
}
