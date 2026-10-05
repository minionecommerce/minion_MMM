import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { BCRYPT_ROUNDS, type AuthContext } from "@/lib/auth";
import { withImpliedView } from "@/lib/rbac/effective";
import { isAction, isModuleKey, permissionKey } from "@/lib/rbac/catalog";
import { generateStrongPassword, passwordProblems } from "@/lib/password-policy";
import { SAFE_USER_SELECT } from "@/lib/safe-select";
import { findUserLayoutProblem, readAccess, readStored } from "./layout";
import { checkCustomValues, mergeCustomValues } from "./custom-fields";
import { resolveAccess } from "./access";

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
  isSuperAdmin: boolean;
  status: string;
  deletedAt: Date | null;
};

// Creating and editing accounts, credentials (passwords, login emails, account status), Access, roles and permissions
// are Super Admin features. Super Admin itself is a setting of the user (Details → Access), not a role.
function requireSuperAdmin(actor: AuthContext, what: string) {
  if (!actor.isSuperAdmin) throw forbidden(`Only a Super Admin can ${what}.`);
}

function assertNotSelf(actor: AuthContext, targetId: string, what: string) {
  if (actor.userId === targetId) throw forbidden(`You cannot ${what} your own account.`);
}

function assertCanManage(target: Target) {
  if (target.deletedAt) throw notFound();
}

async function assertNotLastSuperAdmin(target: Target) {
  if (!target.isSuperAdmin || target.status !== "ACTIVE") return;
  const others = await prisma.user.count({ where: { id: { not: target.id }, status: "ACTIVE", deletedAt: null, isSuperAdmin: true } });
  if (others === 0) throw forbidden("This is the last active Super Admin. Give another person the Super Admin Access first.");
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
  return { overrides };
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
  isSuperAdmin: true,
  accessId: true,
  deletedAt: true,
  roleId: true,
  role: { select: { id: true, name: true } },
  employee: {
    select: {
      id: true,
      employeeCode: true,
      designation: true,
      contactNumber: true,
      departmentId: true,
      customFields: true,
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
  fullName: string;
  employeeCode?: string | null;
  email: string;
  phone?: string | null;
  departmentId?: string | null;
  designation?: string | null;
  customFields?: Record<string, unknown>; // values of the fields added with New Field
  accessId: string; // Details → Access: "super_admin", or one of the access levels (which gives the role)
  password: string;
};

export async function createUser(actor: AuthContext, input: CreateUserInput) {
  requireSuperAdmin(actor, "create users");

  const email = input.email.trim().toLowerCase();
  const access = await resolveAccess(input.accessId);
  // Fields a Super Admin made required in Users → Edit Page Layout
  const layoutProblem = await findUserLayoutProblem(input, "create");
  if (layoutProblem) throw badRequest(layoutProblem);
  const customValues = mergeCustomValues(null, await checkCustomValues(input.customFields, "create"));
  assertStrongPassword(input.password);
  if (input.departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: input.departmentId }, select: { id: true } });
    if (!dept) throw badRequest("Selected department does not exist.");
  }

  // An employee added on the Team page has no login yet (no password): creating a user with that email completes the profile
  const pending = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, deletedAt: null, password: null },
    select: { id: true, employee: { select: { id: true } } },
  });
  if (!pending) await ensureEmailFree(email);
  if (input.employeeCode) await ensureEmployeeCodeFree(input.employeeCode, pending?.employee?.id);

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const now = new Date();

  const user = await prisma.$transaction(async tx => {
    const userData = {
      name: input.fullName.trim(),
      email,
      password: passwordHash,
      roleId: access.roleId,
      isSuperAdmin: access.isSuperAdmin,
      accessId: access.accessId,
      isAdmin: false,
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
      customFields: Object.keys(customValues).length ? (customValues as Prisma.InputJsonObject) : undefined,
    };

    let userId: string;
    if (pending) {
      await tx.user.update({ where: { id: pending.id }, data: userData });
      if (pending.employee) await tx.employee.update({ where: { id: pending.employee.id }, data: employeeData });
      else await tx.employee.create({ data: { ...employeeData, userId: pending.id, joiningDate: now } });
      userId = pending.id;
    } else {
      const created = await tx.user.create({ data: { ...userData, employee: { create: { ...employeeData, joiningDate: now } } }, select: { id: true } });
      userId = created.id;
    }

    await writeAudit({
      action: "USER_CREATED",
      actorUserId: actor.userId,
      targetUserId: userId,
      newValue: {
        name: userData.name,
        email,
        access: access.label,
        isSuperAdmin: access.isSuperAdmin,
        employeeCode: employeeData.employeeCode,
        linkedExistingEmployee: !!pending,
      },
    }, tx);

    return tx.user.findUniqueOrThrow({ where: { id: userId }, select: SAFE_USER_SELECT });
  });

  return user;
}

// ---------------------------------------------------------------------------
// Update user details / access / admin flag
// ---------------------------------------------------------------------------
export type UpdateUserInput = {
  fullName?: string;
  email?: string;
  employeeCode?: string | null;
  phone?: string | null;
  departmentId?: string | null;
  designation?: string | null;
  customFields?: Record<string, unknown>; // values of the fields added with New Field (a null clears one)
  accessId?: string; // Details → Access: "super_admin", or one of the access levels
  isAdmin?: boolean;
};

export async function updateUser(actor: AuthContext, id: string, input: UpdateUserInput) {
  requireSuperAdmin(actor, "edit users");
  const target = await loadTarget(id);
  assertCanManage(target);
  const layoutProblem = await findUserLayoutProblem(input, "update");
  if (layoutProblem) throw badRequest(layoutProblem);
  const customValues = input.customFields !== undefined ? mergeCustomValues(target.employee?.customFields, await checkCustomValues(input.customFields, "update")) : undefined;

  const access = input.accessId !== undefined ? await resolveAccess(input.accessId) : null;
  const changingAccess = !!access && (access.isSuperAdmin !== target.isSuperAdmin || (!access.isSuperAdmin && (access.accessId !== target.accessId || access.roleId !== target.roleId)));
  const changingAdmin = input.isAdmin !== undefined && input.isAdmin !== target.isAdmin;
  if (changingAccess || changingAdmin) assertNotSelf(actor, id, "change the Access or administrator access of");
  if (changingAccess && target.isSuperAdmin && !access!.isSuperAdmin) await assertNotLastSuperAdmin(target);

  const email = input.email?.trim().toLowerCase();
  if (email && email !== target.email?.toLowerCase()) await ensureEmailFree(email, id);
  if (input.employeeCode) await ensureEmployeeCodeFree(input.employeeCode, target.employee?.id);
  if (input.departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: input.departmentId }, select: { id: true } });
    if (!dept) throw badRequest("Selected department does not exist.");
  }

  const accessBefore = target.isSuperAdmin ? "Super Admin" : target.role?.name ?? null;
  const before = {
    name: target.name,
    email: target.email,
    access: accessBefore,
    isAdmin: target.isAdmin,
    employeeCode: target.employee?.employeeCode ?? null,
    phone: target.employee?.contactNumber ?? null,
    designation: target.employee?.designation ?? null,
    departmentId: target.employee?.departmentId ?? null,
    customFields: (target.employee?.customFields ?? null) as Prisma.InputJsonValue | null,
  };

  await prisma.$transaction(async tx => {
    await tx.user.update({
      where: { id },
      data: {
        ...(input.fullName !== undefined ? { name: input.fullName.trim() } : {}),
        ...(email ? { email } : {}),
        ...(changingAccess ? { isSuperAdmin: access!.isSuperAdmin, roleId: access!.roleId, accessId: access!.accessId } : {}),
        ...(changingAdmin ? { isAdmin: input.isAdmin } : {}),
      },
    });
    const employeeData = {
      ...(input.employeeCode !== undefined ? { employeeCode: input.employeeCode?.trim() || null } : {}),
      ...(input.phone !== undefined ? { contactNumber: input.phone?.trim() || null } : {}),
      ...(input.designation !== undefined ? { designation: input.designation?.trim() || null } : {}),
      ...(input.departmentId !== undefined ? { departmentId: input.departmentId || null } : {}),
      ...(customValues ? { customFields: Object.keys(customValues).length ? (customValues as Prisma.InputJsonObject) : Prisma.DbNull } : {}),
    };
    if (Object.keys(employeeData).length) {
      if (target.employee) await tx.employee.update({ where: { id: target.employee.id }, data: employeeData });
      else await tx.employee.create({ data: { ...employeeData, userId: id } });
    }

    const after = {
      ...before,
      ...(input.fullName !== undefined ? { name: input.fullName.trim() } : {}),
      ...(email ? { email } : {}),
      ...(changingAccess ? { access: access!.label } : {}),
      ...(changingAdmin ? { isAdmin: input.isAdmin } : {}),
      ...(input.employeeCode !== undefined ? { employeeCode: input.employeeCode } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.designation !== undefined ? { designation: input.designation } : {}),
      ...(input.departmentId !== undefined ? { departmentId: input.departmentId } : {}),
      ...(customValues ? { customFields: customValues } : {}),
    };
    await writeAudit({ action: "USER_UPDATED", actorUserId: actor.userId, targetUserId: id, oldValue: before, newValue: after }, tx);
    if (changingAccess) {
      await writeAudit({ action: "ACCESS_CHANGED", actorUserId: actor.userId, targetUserId: id, oldValue: { access: accessBefore }, newValue: { access: access!.label } }, tx);
    }
  });
}

// ---------------------------------------------------------------------------
// User-specific permissions
// ---------------------------------------------------------------------------
export async function setUserPermissions(actor: AuthContext, id: string, input: OverrideInput[]) {
  requireSuperAdmin(actor, "change user permissions");
  assertNotSelf(actor, id, "change the permissions of");
  const target = await loadTarget(id);
  assertCanManage(target);
  const { overrides } = validateOverrides(input);

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
  requireSuperAdmin(actor, "change account status");
  if (!USER_STATUSES.includes(status)) throw badRequest("Invalid status.");
  assertNotSelf(actor, id, "change the status of");
  const target = await loadTarget(id);
  assertCanManage(target);
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
  requireSuperAdmin(actor, "reset passwords");
  assertNotSelf(actor, id, "reset the password of (use Change Password instead)");
  const target = await loadTarget(id);
  assertCanManage(target);

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
  requireSuperAdmin(actor, "delete users");
  assertNotSelf(actor, id, "delete");
  const target = await loadTarget(id);
  assertCanManage(target);
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
// Roles (the permission sets that access levels are linked to)
// ---------------------------------------------------------------------------
function slugify(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "role";
}

async function loadRoleForEdit(actor: AuthContext, roleId: string) {
  requireSuperAdmin(actor, "manage roles");
  const role = await prisma.role.findUnique({ where: { id: roleId }, select: { id: true, name: true, description: true, isActive: true, isSystem: true, _count: { select: { users: true } } } });
  if (!role) throw notFound("Role not found");
  return role;
}

// The access level (Users → Edit Page Layout → Access) that gives this role, if any
async function accessLevelUsing(roleId: string) {
  return readAccess(await readStored()).find(l => l.roleId === roleId) ?? null;
}

export async function createRole(actor: AuthContext, input: { name: string; description?: string | null }) {
  requireSuperAdmin(actor, "manage roles");
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
  if (input.isActive === false) {
    const level = await accessLevelUsing(roleId);
    if (level) throw badRequest(`The access level "${level.label}" gives this role. Pick another role for that access level first.`);
  }
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
  for (const k of keys) {
    const [m, a] = k.split(".");
    if (!m || !a || !isModuleKey(m) || !isAction(a)) throw badRequest(`Invalid permission: ${k}`);
  }
  const allowKeys = withImpliedView(keys);

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
  if (role.isSystem) throw forbidden("System roles cannot be deleted.");
  const level = await accessLevelUsing(roleId);
  if (level) throw badRequest(`The access level "${level.label}" gives this role. Pick another role for that access level first.`);
  if (role._count.users > 0) throw badRequest(`This role is assigned to ${role._count.users} user(s). Reassign them first.`);
  await prisma.role.delete({ where: { id: roleId } });
  await writeAudit({ action: "ROLE_DELETED", actorUserId: actor.userId, oldValue: { role: role.name } });
}
