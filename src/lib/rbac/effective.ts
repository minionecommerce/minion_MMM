// Effective-permission resolution. Pure functions: no database or framework imports.
//
// Precedence (later layers win for the same module.action):
//   1. Role grants            ALLOW adds, DENY removes
//   2. User overrides         ALLOW adds, DENY removes   (user beats role)
//   3. Temporary permissions  ALLOW adds, DENY removes   (only while active; beats user)
//   4. Any action other than `view` implies `view` on the same module,
//      unless `view` itself was explicitly denied — then the whole module is removed.
// Super Admin (the user's Access) and Full Administrator (isAdmin) short-circuit to everything;
// the difference between them is enforced by the user-management guards.

import { ACTIONS, ALL_PERMISSIONS, isAction, isModuleKey, permissionKey } from "./catalog";

export type Grant = {
  module: string;
  action: string;
  effect: string; // ALLOW | DENY
  isLegacy?: boolean;
};

export type TimedGrant = Grant & { startsAt?: Date | null; expiresAt?: Date | null };

export type PermissionInputs = {
  isSuperAdmin: boolean;
  isAdmin: boolean;
  roleGrants: Grant[];
  userOverrides: TimedGrant[];
  temporaryGrants: TimedGrant[];
  now?: Date;
};

function applyLayer(target: Set<string>, grants: Grant[], deniedViews: Set<string>) {
  // Within one layer DENY wins over ALLOW for the same key
  const allow = new Set<string>();
  const deny = new Set<string>();
  for (const g of grants) {
    if (g.isLegacy) continue;
    const moduleKey = g.module.toLowerCase();
    const action = g.action.toLowerCase();
    if (!isModuleKey(moduleKey) || !isAction(action)) continue;
    (g.effect === "DENY" ? deny : allow).add(permissionKey(moduleKey, action));
  }
  allow.forEach(k => {
    target.add(k);
    if (k.endsWith(".view")) deniedViews.delete(k.split(".")[0]);
  });
  deny.forEach(k => {
    target.delete(k);
    if (k.endsWith(".view")) deniedViews.add(k.split(".")[0]);
  });
}

function isActive(g: TimedGrant, now: Date) {
  if (g.startsAt && g.startsAt > now) return false;
  if (g.expiresAt && g.expiresAt < now) return false;
  return true;
}

export function resolvePermissions(input: PermissionInputs): string[] {
  if (input.isSuperAdmin || input.isAdmin) return [ALL_PERMISSIONS];

  const now = input.now ?? new Date();
  const effective = new Set<string>();
  const deniedViews = new Set<string>();
  applyLayer(effective, input.roleGrants, deniedViews);
  applyLayer(effective, input.userOverrides.filter(g => isActive(g, now)), deniedViews);
  applyLayer(effective, input.temporaryGrants.filter(g => isActive(g, now)), deniedViews);

  for (const key of Array.from(effective)) {
    const [moduleKey, action] = key.split(".");
    if (deniedViews.has(moduleKey)) effective.delete(key); // no View = no access to the module
    else if (action !== "view") effective.add(permissionKey(moduleKey, "view")); // any action implies View
  }

  return Array.from(effective).sort();
}

export function hasPermission(effective: readonly string[], module: string, action: string) {
  return effective.includes(ALL_PERMISSIONS) || effective.includes(permissionKey(module, action));
}

// Expand a role/override selection so implied `view` is stored explicitly
export function withImpliedView(keys: string[]) {
  const out = new Set(keys.map(k => k.toLowerCase()));
  for (const key of Array.from(out)) {
    const [moduleKey, action] = key.split(".");
    if (action !== "view" && (ACTIONS as readonly string[]).includes(action)) out.add(permissionKey(moduleKey, "view"));
  }
  return Array.from(out);
}
