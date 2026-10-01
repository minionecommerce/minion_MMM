import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { BCRYPT_ROUNDS, loadAuthState, type AuthContext } from "@/lib/auth";
import { hasPermission, withImpliedView } from "@/lib/rbac/effective";
import { ALL_PERMISSIONS, isAction, isModuleKey, permissionKey } from "@/lib/rbac/catalog";
import { generateStrongPassword, passwordProblems } from "@/lib/password-policy";
import { SAFE_USER_SELECT } from "@/lib/safe-select";

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------
export class ServiceError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ServiceError";
  }
}
const forbidden = (msg: string) => new ServiceError(403, msg);
const badRequest = (msg: string) => new ServiceError(400, msg);
const notFound = (msg = "User not found") => new ServiceError(404, msg);

export const USER_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export type OverrideInput = { module: string; action: string; effect: "ALLOW" | "DENY" };

// ---------------------------------------------------------------------------
// Guards (all privilege-escalation rules live here)
// ---------------------------------------------------------------------------
type Target = {
  id: string;
  isAdmin: boolean;
  status: string;
  deletedAt: Date | null;
  role: { isSuperAdmin: boolean } | null;
};

function isPrivileged(t: Target) {
  return t.isAdmin || !!t.role?.isSuperAdmin;
}

function assertNotSelf(actor: AuthContext, targetId: string, what: string) {
  if (actor.userId === targetId) throw forbidden(`You cannot ${what} your own account.`);
}

// You may only manage accounts that are not more powerful than you; otherwise a
// password reset or email change would let you take over a stronger account.
async function assertCanManage(actor: AuthContext, target: Target) {
  if (target.deletedAt) throw notFound();
  if (actor.isSuperAdmin) return;
  if (isPrivileged(target)) throw forbidden("Only a Super Admin can manage administrator accounts.");
  if (actor.permissions.includes(ALL_PERMISSIONS)) return;
  const targetState = await loadAuthState(target.id);
  const stronger = (targetState?.permissions ?? []).filter(k => {
    const [m, a] = k.split(".");
    return !hasPermission(actor.permissions, m, a);
  });
  if (stronger.length) throw forbidden("This user has permissions you do not have, so you cannot manage their account.");
}

// You can only hand out permissions you hold yourself
function assertGrantCeiling(actor: AuthContext, keys: string[]) {
  if (actor.permissions.includes(ALL_PERMISSIONS)) return;
  const missing = keys.filter(k => {
    const [m, a] = k.split(".");
    return !hasPermission(actor.permissions, m, a);
  });
  if (missing.length) throw forbidden(`You cannot grant permissions you do not have: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "…" : ""}`);
}

async function loadRoleForAssignment(actor: AuthContext, roleId: string) {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: {
      id: true,
      name: true,
      isActive: true,
      isSuperAdmin: true,
      permissions: { where: { effect: "ALLOW", permission: { isLegacy: false } }, select: { permission: { select: { module: true, action: true } } } },
    },
  });
  if (!role) throw badRequest("Selected role does not exist.");
  if (!role.isActive) throw badRequest("Selected role is inactive.");
  if (role.isSuperAdmin && !actor.isSuperAdmin) throw forbidden("Only a Super Admin can assign the Super Admin role.");
  assertGrantCeiling(actor, role.permissions.map(p => permissionKey(p.permission.module, p.permission.action)));
  return role;
}

async function assertNotLastSuperAdmin(target: Target) {
  if (!target.role?.isSuperAdmin || target.status !== "ACTIVE") return;
  const others = await prisma.user.count({
    where: { id: { not: target.id }, status: "ACTIVE", deletedAt: null, role: { isSuperAdmin: true, isActive: true } },
  });
  if (others === 0) throw forbidden("This is the last active Super Admin. Assign another Super Admin first.");
}

function validateOverrides(overrides: OverrideInput[]) {
  const seen = new Set<string>();
  for (const o of overrides) {
    if (!isModuleKey(o.module) || !isAction(o.action) || (o.effect !== "ALLOW" && o.effect !== "DENY")) {
      throw badRequest(`Invalid permission: ${o.module}.${o.action}`);
    }
    const key = permissionKey(o.module, o.action);
    if (seen.has(key)) throw badRequest(`Duplicate permission: ${key}`);
    seen.add(key);
  }
  // Granting edit/create/... implies view
  const allowKeys = withImpliedView(overrides.filter(o => o.effect === "ALLOW").map(o => permissionKey(o.module, o.action)));
  return { allowKeys, overrides };
}

function assertStrongPassword(password: string) {
  const problems = passwordProblems(password);
  if (problems.length) throw badRequest(`Password does not meet requirements: ${problems.join(", ")}.`);
}

async function permissionIdMap() {
  const rows = await prisma.permission.findMany({ where: { isLegacy: false }, select: { id: true, module: true, action: true } });
  return new Map(rows.map(r => [permissionKey(r.module, r.action), r.id]));
}

async function replaceOverrides(tx: Prisma.TransactionClient, employeeId: string, overrides: OverrideInput[], actorEmployeeId: string | null) {
  const ids = await permissionIdMap();
  await tx.employeePermissionOverride.deleteMany({ where: { employeeId } });
  // When ALLOW-ing a non-view action, also allow view explicitly
  const rows = new Map<string, "ALLOW" | "DENY">();
  for (const o of overrides) rows.set(permissionKey(o.module, o.action), o.effect);
  for (const o of overrides) {
    if (o.effect === "ALLOW" && o.action !== "view") {
      const viewKey = permissionKey(o.module, "view");
      if (!rows.has(viewKey)) rows.set(viewKey, "ALLOW");
    }
  }
  for (const [key, effect] of rows) {
    const permissionId = ids.get(key);
    if (!permissionId) throw new ServiceError(500, `Permission ${key} is missing. Run the permission sync.`);
    await tx.employeePermissionOverride.create({
      data: { employeeId, permissionId, effect, scope: "ALL", createdById: actorEmployeeId },
    });
  }
}

const targetSelect = {
  id: true,
  name: true,
  email: true,
  status: true,
  isAdmin: true,
  deletedAt: true,
  roleId: true,
  role: { select: { id: true, name: true, isSuperAdmin: true } },
  employee: {
    select: {
      id: true,
      employeeCode: true,
      designation: true,
      contactNumber: true,
      departmentId: true,
      permissionOverrides: { select: { effect: true, permission: { select: { module: true, action: true, isLegacy: true } } } },
    },
  },
} satisfies Prisma.UserSelect;

async function loadTarget(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: targetSelect });
  if (!user || user.deletedAt) throw notFound();
  return user;
}

function overridesOf(user: Awaited<ReturnType<typeof loadTarget>>) {
  return (user.employee?.permissionOverrides ?? [])
    .filter(o => !o.permission.isLegacy)
    .map(o => ({ module: o.permission.module, action: o.permission.action, effect: o.effect }));
}

async function ensureEmailFree(email: string, exceptUserId?: string) {
  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, ...(exceptUserId ? { id: { not: exceptUserId } } : {}) },
    select: { id: true },
  });
  if (existing) throw new ServiceError(409, "A user with this email already exists.");
}

async function ensureEmployeeCodeFree(code: string, exceptEmployeeId?: string) {
  const existing = await prisma.employee.findFirst({
    where: { employeeCode: { equals: code, mode: "insensitive" }, ...(exceptEmployeeId ? { id: { not: exceptEmployeeId } } : {}) },
    select: { id: true },
  });
  if (existing) throw new ServiceError(409, "This Employee ID is already in use.");
}

// ---------------------------------------------------------------------------
// Create user
// ---------------------------------------------------------------------------
export type CreateUserInput = {
  employeeId?: string | null; // link to an existing employee that has no login yet
  fullName: string;
  employeeCode?: string | null;
  email: string;
  phone?: string | null;
  departmentId?: string | null;
  designation?: string | null;
  roleId: string;
  isAdmin?: boolean;
  overrides?: OverrideInput[];
  password: string;
};

export async function createUser(actor: AuthContext, input: CreateUserInput) {
  if (!hasPermission(actor.permissions, "users", "create")) throw forbidden("You do not have permission to create users.");
  if (input.isAdmin && !actor.isSuperAdmin) throw forbidden("Only a Super Admin can grant Full Administrator Access.");

  const email = input.email.trim().toLowerCase();
  const role = await loadRoleForAssignment(actor, input.roleId);
  const { allowKeys, overrides } = validateOverrides(input.overrides ?? []);
  assertGrantCeiling(actor, allowKeys);
  if (overrides.length && !hasPermission(actor.permissions, "users", "edit")) {
    throw forbidden("You need Users → Edit permission to set user-specific permissions.");
  }
  assertStrongPassword(input.password);
  if (input.employeeCode) await ensureEmployeeCodeFree(input.employeeCode, input.employeeId ?? undefined);
  if (input.departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: input.departmentId }, select: { id: true } });
    if (!dept) throw badRequest("Selected department does not exist.");
  }

  let existingEmployee: { id: string; userId: string; user: { password: string | null; status: string; deletedAt: Date | null } } | null = null;
  if (input.employeeId) {
    existingEmployee = await prisma.employee.findUnique({
      where: { id: input.employeeId },
      select: { id: true, userId: true, user: { select: { password: true, status: true, deletedAt: true } } },
    });
    if (!existingEmployee) throw badRequest("Selected employee does not exist.");
    if (existingEmployee.user.password && !existingEmployee.user.deletedAt) throw new ServiceError(409, "This employee already has a login account.");
    await ensureEmailFree(email, existingEmployee.userId);
  } else {
    await ensureEmailFree(email);
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const now = new Date();

  const user = await prisma.$transaction(async tx => {
    const userData = {
      name: input.fullName.trim(),
      email,
      password: passwordHash,
      roleId: role.id,
      isAdmin: !!input.isAdmin,
      status: "ACTIVE",
      mustChangePassword: false,
      passwordChangedAt: now,
      failedLoginCount: 0,
      lockedUntil: null,
      deletedAt: null,
      createdById: actor.userId,
    };
    const employeeData = {
      employeeCode: input.employeeCode?.trim() || null,
      contactNumber: input.phone?.trim() || null,
      designation: input.designation?.trim() || null,
      departmentId: input.departmentId || null,
    };

    let userId: string;
    let employeeId: string;
    if (existingEmployee) {
      await tx.user.update({ where: { id: existingEmployee.userId }, data: userData });
      await tx.employee.update({ where: { id: existingEmployee.id }, data: employeeData });
      userId = existingEmployee.userId;
      employeeId = existingEmployee.id;
    } else {
      const created = await tx.user.create({ data: { ...userData, employee: { create: { ...employeeData, joiningDate: now } } }, select: { id: true, employee: { select: { id: true } } } });
      userId = created.id;
      employeeId = created.employee!.id;
    }

    await replaceOverrides(tx, employeeId, overrides, actor.employeeId);

    await writeAudit({
      action: "USER_CREATED",
      actorUserId: actor.userId,
      targetUserId: userId,
      newValue: {
        name: userData.name,
        email,
        role: role.name,
        isAdmin: userData.isAdmin,
        employeeCode: employeeData.employeeCode,
        linkedExistingEmployee: !!existingEmployee,
        overrides: overrides.map(o => `${o.effect} ${o.module}.${o.action}`),
      },
    }, tx);

    return tx.user.findUniqueOrThrow({ where: { id: userId }, select: SAFE_USER_SELECT });
  });

  return user;
}

// ---------------------------------------------------------------------------
// Update user details / role / admin flag
// ---------------------------------------------------------------------------
export type UpdateUserInput = {
  fullName?: string;
  email?: string;
  employeeCode?: string | null;
  phone?: string | null;
  departmentId?: string | null;
  designation?: string | null;
  roleId?: string;
  isAdmin?: boolean;
};

export async function updateUser(actor: AuthContext, id: string, input: UpdateUserInput) {
  if (!hasPermission(actor.permissions, "users", "edit")) throw forbidden("You do not have permission to edit users.");
  const target = await loadTarget(id);
  await assertCanManage(actor, target);

  const changingRole = input.roleId !== undefined && input.roleId !== target.roleId;
  const changingAdmin = input.isAdmin !== undefined && input.isAdmin !== target.isAdmin;
  if (changingRole || changingAdmin) assertNotSelf(actor, id, "change the role or administrator access of");
  if (changingAdmin && !actor.isSuperAdmin) throw forbidden("Only a Super Admin can change Full Administrator Access.");

  let newRole: Awaited<ReturnType<typeof loadRoleForAssignment>> | null = null;
  if (changingRole) {
    newRole = await loadRoleForAssignment(actor, input.roleId!);
    if (target.role?.isSuperAdmin && !newRole.isSuperAdmin) await assertNotLastSuperAdmin(target);
  }

  const email = input.email?.trim().toLowerCase();
  if (email && email !== target.email?.toLowerCase()) await ensureEmailFree(email, id);
  if (input.employeeCode) await ensureEmployeeCodeFree(input.employeeCode, target.employee?.id);
  if (input.departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: input.departmentId }, select: { id: true } });
    if (!dept) throw badRequest("Selected department does not exist.");
  }

  const before = {
    name: target.name,
    email: target.email,
    role: target.role?.name ?? null,
    isAdmin: target.isAdmin,
    employeeCode: target.employee?.employeeCode ?? null,
    phone: target.employee?.contactNumber ?? null,
    designation: target.employee?.designation ?? null,
    departmentId: target.employee?.departmentId ?? null,
  };

  await prisma.$transaction(async tx => {
    await tx.user.update({
      where: { id },
      data: {
        ...(input.fullName !== undefined ? { name: input.fullName.trim() } : {}),
        ...(email ? { email } : {}),
        ...(changingRole ? { roleId: newRole!.id } : {}),
        ...(changingAdmin ? { isAdmin: input.isAdmin } : {}),
      },
    });
    const employeeData = {
      ...(input.employeeCode !== undefined ? { employeeCode: input.employeeCode?.trim() || null } : {}),
      ...(input.phone !== undefined ? { contactNumber: input.phone?.trim() || null } : {}),
      ...(input.designation !== undefined ? { designation: input.designation?.trim() || null } : {}),
      ...(input.departmentId !== undefined ? { departmentId: input.departmentId || null } : {}),
    };
    if (Object.keys(employeeData).length) {
      if (target.employee) await tx.employee.update({ where: { id: target.employee.id }, data: employeeData });
      else await tx.employee.create({ data: { ...employeeData, userId: id } });
    }

    const after = {
      ...before,
      ...(input.fullName !== undefined ? { name: input.fullName.trim() } : {}),
      ...(email ? { email } : {}),
      ...(changingRole ? { role: newRole!.name } : {}),
      ...(changingAdmin ? { isAdmin: input.isAdmin } : {}),
      ...(input.employeeCode !== undefined ? { employeeCode: input.employeeCode } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.designation !== undefined ? { designation: input.designation } : {}),
      ...(input.departmentId !== undefined ? { departmentId: input.departmentId } : {}),
    };
    await writeAudit({ action: "USER_UPDATED", actorUserId: actor.userId, targetUserId: id, oldValue: before, newValue: after }, tx);
    if (changingRole) {
      await writeAudit({ action: "ROLE_CHANGED", actorUserId: actor.userId, targetUserId: id, oldValue: { role: before.role }, newValue: { role: newRole!.name } }, tx);
    }
  });
}

// ---------------------------------------------------------------------------
// User-specific permissions
// ---------------------------------------------------------------------------
export async function setUserPermissions(actor: AuthContext, id: string, input: OverrideInput[]) {
  if (!hasPermission(actor.permissions, "users", "edit")) throw forbidden("You do not have permission to edit user permissions.");
  assertNotSelf(actor, id, "change the permissions of");
  const target = await loadTarget(id);
  await assertCanManage(actor, target);
  const { allowKeys, overrides } = validateOverrides(input);
  assertGrantCeiling(actor, allowKeys);

  const before = overridesOf(target).map(o => `${o.effect} ${o.module}.${o.action}`).sort();
  await prisma.$transaction(async tx => {
    let employeeId = target.employee?.id;
    if (!employeeId) employeeId = (await tx.employee.create({ data: { userId: id }, select: { id: true } })).id;
    await replaceOverrides(tx, employeeId, overrides, actor.employeeId);
    await writeAudit({
      action: "PERMISSIONS_CHANGED",
      actorUserId: actor.userId,
      targetUserId: id,
      oldValue: before,
      newValue: overrides.map(o => `${o.effect} ${o.module}.${o.action}`).sort(),
    }, tx);
  });
}

// ---------------------------------------------------------------------------
// Status (activate / deactivate / suspend / pending)
// ---------------------------------------------------------------------------
export async function setUserStatus(actor: AuthContext, id: string, status: UserStatus) {
  if (!hasPermission(actor.permissions, "users", "edit")) throw forbidden("You do not have permission to change account status.");
  if (!USER_STATUSES.includes(status)) throw badRequest("Invalid status.");
  assertNotSelf(actor, id, "change the status of");
  const target = await loadTarget(id);
  await assertCanManage(actor, target);
  if (target.status === status) return;
  if (status !== "ACTIVE") await assertNotLastSuperAdmin(target);
  if (status === "ACTIVE") {
    const hasPassword = await prisma.user.count({ where: { id, password: { not: null } } });
    if (!hasPassword) throw badRequest("Set a password for this user before activating the account.");
  }

  const action = status === "ACTIVE" ? "USER_ACTIVATED" : status === "SUSPENDED" ? "USER_SUSPENDED" : "USER_DEACTIVATED";
  await prisma.$transaction(async tx => {
    await tx.user.update({
      where: { id },
      data: {
        status,
        // Leaving ACTIVE ends every existing session immediately
        ...(status !== "ACTIVE" ? { sessionVersion: { increment: 1 } } : { failedLoginCount: 0, lockedUntil: null }),
      },
    });
    await writeAudit({ action, actorUserId: actor.userId, targetUserId: id, oldValue: { status: target.status }, newValue: { status } }, tx);
  });
}

// ---------------------------------------------------------------------------
// Admin password reset → temporary password, forced change, sessions ended
// ---------------------------------------------------------------------------
export async function resetUserPassword(actor: AuthContext, id: string, requested?: string) {
  if (!hasPermission(actor.permissions, "users", "edit")) throw forbidden("You do not have permission to reset passwords.");
  assertNotSelf(actor, id, "reset the password of (use Change Password instead)");
  const target = await loadTarget(id);
  await assertCanManage(actor, target);

  const temporaryPassword = requested || generateStrongPassword();
  assertStrongPassword(temporaryPassword);
  const hash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);

  await prisma.$transaction(async tx => {
    await tx.user.update({
      where: { id },
      data: {
        password: hash,
        mustChangePassword: true,
        passwordChangedAt: new Date(),
        sessionVersion: { increment: 1 },
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });
    await writeAudit({ action: "PASSWORD_RESET", actorUserId: actor.userId, targetUserId: id, metadata: { generated: !requested } }, tx);
  });

  // Returned once to the admin; never stored in plain text or logged
  return temporaryPassword;
}

// ---------------------------------------------------------------------------
// Soft delete
// ---------------------------------------------------------------------------
export async function softDeleteUser(actor: AuthContext, id: string) {
  if (!hasPermission(actor.permissions, "users", "delete")) throw forbidden("You do not have permission to delete users.");
  assertNotSelf(actor, id, "delete");
  const target = await loadTarget(id);
  await assertCanManage(actor, target);
  await assertNotLastSuperAdmin(target);

  await prisma.$transaction(async tx => {
    await tx.user.update({
      where: { id },
      data: {
        status: "INACTIVE",
        deletedAt: new Date(),
        // Free the email for reuse; the original is kept in the audit log
        email: `deleted+${randomUUID()}@deleted.invalid`,
        password: null,
        sessionVersion: { increment: 1 },
      },
    });
    await writeAudit({ action: "USER_DELETED", actorUserId: actor.userId, targetUserId: id, oldValue: { name: target.name, email: target.email, status: target.status } }, tx);
  });
}

// ---------------------------------------------------------------------------
// Own password change
// ---------------------------------------------------------------------------
export async function changeOwnPassword(actor: AuthContext, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: actor.userId }, select: { password: true } });
  if (!user?.password || !(await bcrypt.compare(currentPassword, user.password))) {
    throw badRequest("Current password is incorrect.");
  }
  assertStrongPassword(newPassword);
  if (await bcrypt.compare(newPassword, user.password)) throw badRequest("New password must be different from the current password.");

  const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await prisma.$transaction(async tx => {
    await tx.user.update({
      where: { id: actor.userId },
      data: { password: hash, mustChangePassword: false, passwordChangedAt: new Date(), sessionVersion: { increment: 1 } },
    });
    await writeAudit({ action: "PASSWORD_CHANGED", actorUserId: actor.userId, targetUserId: actor.userId }, tx);
  });
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------
function slugify(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "role";
}

async function loadRoleForEdit(actor: AuthContext, roleId: string) {
  if (!hasPermission(actor.permissions, "users", "edit")) throw forbidden("You do not have permission to manage roles.");
  const role = await prisma.role.findUnique({ where: { id: roleId }, select: { id: true, name: true, description: true, isActive: true, isSuperAdmin: true, isSystem: true, _count: { select: { users: true } } } });
  if (!role) throw notFound("Role not found");
  if (role.isSuperAdmin && !actor.isSuperAdmin) throw forbidden("Only a Super Admin can change the Super Admin role.");
  // Editing your own role would let you raise your own permissions
  if (actor.roleId === role.id && !actor.isSuperAdmin) throw forbidden("You cannot change the role assigned to yourself.");
  return role;
}

export async function createRole(actor: AuthContext, input: { name: string; description?: string | null }) {
  if (!hasPermission(actor.permissions, "users", "edit")) throw forbidden("You do not have permission to manage roles.");
  const name = input.name.trim();
  if (await prisma.role.findFirst({ where: { name: { equals: name, mode: "insensitive" } } })) throw new ServiceError(409, "A role with this name already exists.");
  let key = slugify(name);
  if (await prisma.role.findUnique({ where: { key } })) key = `${key}_${Date.now().toString(36)}`;
  const role = await prisma.role.create({ data: { name, key, description: input.description?.trim() || null, isActive: true } });
  await writeAudit({ action: "ROLE_CREATED", actorUserId: actor.userId, newValue: { role: name } });
  return role;
}

export async function updateRole(actor: AuthContext, roleId: string, input: { name?: string; description?: string | null; isActive?: boolean }) {
  const role = await loadRoleForEdit(actor, roleId);
  if (role.isSystem && (input.name !== undefined && input.name.trim() !== role.name)) throw forbidden("System roles cannot be renamed.");
  if (role.isSystem && input.isActive === false) throw forbidden("System roles cannot be deactivated.");
  if (input.name && input.name.trim() !== role.name) {
    const clash = await prisma.role.findFirst({ where: { name: { equals: input.name.trim(), mode: "insensitive" }, id: { not: roleId } } });
    if (clash) throw new ServiceError(409, "A role with this name already exists.");
  }
  const updated = await prisma.role.update({
    where: { id: roleId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
  await writeAudit({
    action: "ROLE_UPDATED",
    actorUserId: actor.userId,
    oldValue: { name: role.name, description: role.description, isActive: role.isActive },
    newValue: { name: updated.name, description: updated.description, isActive: updated.isActive },
  });
  return updated;
}

export async function setRolePermissions(actor: AuthContext, roleId: string, keys: string[]) {
  const role = await loadRoleForEdit(actor, roleId);
  if (role.isSuperAdmin) throw badRequest("The Super Admin role always has every permission.");
  for (const k of keys) {
    const [m, a] = k.split(".");
    if (!m || !a || !isModuleKey(m) || !isAction(a)) throw badRequest(`Invalid permission: ${k}`);
  }
  const allowKeys = withImpliedView(keys);
  assertGrantCeiling(actor, allowKeys);

  const ids = await permissionIdMap();
  const before = await prisma.rolePermission.findMany({ where: { roleId, permission: { isLegacy: false } }, select: { effect: true, permission: { select: { module: true, action: true } } } });
  await prisma.$transaction(async tx => {
    // Legacy rows are left untouched (history only; ignored by the resolver)
    await tx.rolePermission.deleteMany({ where: { roleId, permission: { isLegacy: false } } });
    for (const key of allowKeys) {
      const permissionId = ids.get(key);
      if (!permissionId) throw new ServiceError(500, `Permission ${key} is missing. Run the permission sync.`);
      await tx.rolePermission.create({ data: { roleId, permissionId, effect: "ALLOW", scope: "ALL" } });
    }
    await writeAudit({
      action: "ROLE_PERMISSIONS_CHANGED",
      actorUserId: actor.userId,
      metadata: { role: role.name },
      oldValue: before.filter(p => p.effect === "ALLOW").map(p => permissionKey(p.permission.module, p.permission.action)).sort(),
      newValue: allowKeys.sort(),
    }, tx);
  });
}

export async function deleteRole(actor: AuthContext, roleId: string) {
  const role = await loadRoleForEdit(actor, roleId);
  if (role.isSystem || role.isSuperAdmin) throw forbidden("System roles cannot be deleted.");
  if (role._count.users > 0) throw badRequest(`This role is assigned to ${role._count.users} user(s). Reassign them first.`);
  await prisma.role.delete({ where: { id: roleId } });
  await writeAudit({ action: "ROLE_DELETED", actorUserId: actor.userId, oldValue: { role: role.name } });
}
