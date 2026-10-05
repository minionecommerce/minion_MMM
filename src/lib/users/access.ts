import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { ServiceError } from "./service";
import { assertSuperAdmin, mutateStored, readAccess, readStored, saveStored, type AccessLevel, type Stored } from "./layout";
import { SUPER_ADMIN_OPTION, USER_OPTION_LABEL_MAX } from "./layout-shared";

// The Access field of Create / Edit User. "Super Admin" (built in) makes the person a Super Admin: User.isSuperAdmin.
// Every other option is an access level kept in the layout setting, linked to the Role that gives its permissions;
// the person gets that role (User.roleId) and remembers the level they picked (User.accessId).
const MAX_LEVELS = 50;
const newLevelId = () => `a_${randomBytes(5).toString("hex")}`;

export type AccessChoice = { isSuperAdmin: boolean; roleId: string | null; accessId: string | null; label: string };

async function activeRole(roleId: string, what: string) {
  const role = await prisma.role.findUnique({ where: { id: roleId }, select: { id: true, name: true, isActive: true } });
  if (!role) throw new ServiceError(400, `${what}: that role does not exist any more.`);
  if (!role.isActive) throw new ServiceError(400, `${what}: the role "${role.name}" is inactive.`);
  return role;
}

// What a chosen Access means for a person
export async function resolveAccess(accessId: string): Promise<AccessChoice> {
  if (accessId === SUPER_ADMIN_OPTION.id) return { isSuperAdmin: true, roleId: null, accessId: null, label: SUPER_ADMIN_OPTION.label };
  const level = readAccess(await readStored()).find(l => l.id === accessId);
  if (!level) throw new ServiceError(400, "Choose an Access level from the list.");
  if (!level.roleId) throw new ServiceError(400, `The access level "${level.label}" has no role yet. Pick one in Users → Edit Page Layout → Access.`);
  const role = await activeRole(level.roleId, `Access level "${level.label}"`);
  return { isSuperAdmin: false, roleId: role.id, accessId: level.id, label: level.label };
}

// ---------------------------------------------------------------------------
// Managing the access levels (Super Admin only), from the Access field's Edit Properties
// ---------------------------------------------------------------------------
const levelsOf = (s: Stored) => readAccess(s);
const withLevels = (s: Stored, levels: AccessLevel[]): Stored => ({
  ...s,
  access: { ...(s.access && typeof s.access === "object" ? (s.access as object) : {}), options: levels },
});

function cleanLevelName(raw: string, levels: AccessLevel[], exceptId?: string) {
  const name = raw.replace(/\s+/g, " ").trim();
  if (!name) throw new ServiceError(400, "Access level name is required.");
  if (name.length > USER_OPTION_LABEL_MAX) throw new ServiceError(400, `Access level name must be ${USER_OPTION_LABEL_MAX} characters or fewer.`);
  if (name.toLowerCase() === SUPER_ADMIN_OPTION.label.toLowerCase() || levels.some(l => l.id !== exceptId && l.label.toLowerCase() === name.toLowerCase())) {
    throw new ServiceError(409, `"${name}" is already in the list.`);
  }
  return name;
}

async function defaultRoleId() {
  const role = (await prisma.role.findFirst({ where: { key: "employee", isActive: true }, select: { id: true } })) ?? (await prisma.role.findFirst({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true } }));
  if (!role) throw new ServiceError(400, "Create a role first (Users → Roles): an access level needs a role.");
  return role.id;
}

export async function listAccessLevels(ctx: AuthContext) {
  assertSuperAdmin(ctx);
  const levels = readAccess(await readStored());
  const [usage, superCount, roles] = await Promise.all([
    prisma.user.groupBy({ by: ["accessId"], where: { deletedAt: null, isSuperAdmin: false, accessId: { not: null } }, _count: { _all: true } }),
    prisma.user.count({ where: { deletedAt: null, isSuperAdmin: true } }),
    prisma.role.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const used = new Map(usage.map(u => [u.accessId, u._count._all]));
  return {
    options: [
      { id: SUPER_ADMIN_OPTION.id, name: SUPER_ADMIN_OPTION.label, usage: superCount, locked: true, roleId: null as string | null },
      ...levels.map(l => ({ id: l.id, name: l.label, usage: used.get(l.id) ?? 0, locked: false, roleId: l.roleId })),
    ],
    roles,
  };
}

export async function addAccessLevel(ctx: AuthContext, rawName: string, roleId?: string | null) {
  assertSuperAdmin(ctx);
  const levels = levelsOf(await readStored());
  if (levels.length >= MAX_LEVELS) throw new ServiceError(400, `You can have up to ${MAX_LEVELS} access levels.`);
  const name = cleanLevelName(rawName, levels);
  const role = roleId ? await activeRole(roleId, name) : { id: await defaultRoleId() };
  const level: AccessLevel = { id: newLevelId(), label: name, roleId: role.id };
  await saveStored(ctx, s => withLevels(s, [...levelsOf(s), level]), {
    action: "DROPDOWN_OPTION_CREATED",
    newValue: { scope: "users", field: "access", id: level.id, label: name, roleId: level.roleId },
  });
  return { id: level.id, name };
}

export async function renameAccessLevel(ctx: AuthContext, id: string, rawName: string) {
  assertSuperAdmin(ctx);
  const levels = levelsOf(await readStored());
  const level = levels.find(l => l.id === id);
  if (!level) throw new ServiceError(404, "That access level does not exist (Super Admin cannot be renamed).");
  const name = cleanLevelName(rawName, levels, id);
  if (name === level.label) return;
  await saveStored(ctx, s => withLevels(s, levelsOf(s).map(l => (l.id === id ? { ...l, label: name } : l))), {
    action: "DROPDOWN_OPTION_UPDATED",
    oldValue: { scope: "users", field: "access", id, label: level.label },
    newValue: { scope: "users", field: "access", id, label: name },
  });
}

// Changes the role an access level gives. People on that level get the new role's permissions at once, so it needs
// a confirmation when anybody is on it.
export async function setAccessLevelRole(ctx: AuthContext, id: string, roleId: string, confirm: boolean) {
  assertSuperAdmin(ctx);
  const level = levelsOf(await readStored()).find(l => l.id === id);
  if (!level) throw new ServiceError(404, "That access level does not exist.");
  const role = await activeRole(roleId, `Access level "${level.label}"`);
  if (level.roleId === role.id) return { changed: 0 };
  const people = await prisma.user.count({ where: { accessId: id, isSuperAdmin: false, deletedAt: null } });
  if (people > 0 && !confirm) {
    throw new ServiceError(409, `${people} ${people === 1 ? "person has" : "people have"} the access level "${level.label}". Confirm to give them the permissions of the role "${role.name}".`);
  }
  await prisma.$transaction(async tx => {
    await tx.user.updateMany({ where: { accessId: id, isSuperAdmin: false, deletedAt: null }, data: { roleId: role.id } });
    await mutateStored(tx, s => withLevels(s, levelsOf(s).map(l => (l.id === id ? { ...l, roleId: role.id } : l))));
    await writeAudit({
      action: "DROPDOWN_OPTION_UPDATED",
      actorUserId: ctx.userId,
      oldValue: { scope: "users", field: "access", id, label: level.label, roleId: level.roleId },
      newValue: { scope: "users", field: "access", id, label: level.label, roleId: role.id, people },
    }, tx);
  });
  return { changed: people };
}

// People on a deleted level keep the permissions of their role; they just have no access level shown until one is picked
export async function deleteAccessLevel(ctx: AuthContext, id: string, confirm: boolean) {
  assertSuperAdmin(ctx);
  const level = levelsOf(await readStored()).find(l => l.id === id);
  if (!level) throw new ServiceError(404, "That access level does not exist (Super Admin cannot be deleted).");
  const people = await prisma.user.count({ where: { accessId: id, isSuperAdmin: false, deletedAt: null } });
  if (people > 0 && !confirm) {
    throw new ServiceError(409, `${people} ${people === 1 ? "person has" : "people have"} the access level "${level.label}". Confirm to remove it; they keep their current permissions.`);
  }
  await prisma.$transaction(async tx => {
    await tx.user.updateMany({ where: { accessId: id }, data: { accessId: null } });
    await mutateStored(tx, s => {
      const next = withLevels(s, levelsOf(s).filter(l => l.id !== id));
      const own = next.fields?.access;
      if (own && own.defaultValue === id) {
        const { defaultValue: _gone, ...rest } = own; // the default pointed at this level
        void _gone;
        const fields = { ...(next.fields ?? {}) };
        if (Object.keys(rest).length) fields.access = rest;
        else delete fields.access;
        return { ...next, fields };
      }
      return next;
    });
    await writeAudit({ action: "DROPDOWN_OPTION_DELETED", actorUserId: ctx.userId, oldValue: { scope: "users", field: "access", id, label: level.label, people } }, tx);
  });
  return { deleted: true, usage: people };
}

export async function reorderAccessLevels(ctx: AuthContext, orderedIds: string[]) {
  assertSuperAdmin(ctx);
  const levels = levelsOf(await readStored());
  const ids = levels.map(l => l.id);
  if (new Set(orderedIds).size !== orderedIds.length || orderedIds.length !== ids.length || !orderedIds.every(x => ids.includes(x))) {
    throw new ServiceError(400, "The new order must list every access level exactly once (Super Admin always stays first).");
  }
  await saveStored(ctx, s => withLevels(s, orderedIds.map(x => levelsOf(s).find(l => l.id === x)!).filter(Boolean)), {
    action: "DROPDOWN_OPTIONS_REORDERED",
    newValue: { scope: "users", field: "access", order: orderedIds },
  });
  return { ok: true };
}
