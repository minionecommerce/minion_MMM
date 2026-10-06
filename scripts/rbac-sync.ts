// Syncs the permission catalog (src/lib/rbac/catalog.ts) into the database.
// Safe to run repeatedly. Never touches passwords.
//
//   npx tsx scripts/rbac-sync.ts            # catalog + legacy translation + starter roles
//
// What it does:
//   1. Upserts every catalog permission (module.action) and flags older rows as legacy
//   2. Translates legacy role/user grants (e.g. "CRM.VIEW") to catalog keys (once)
//   3. Gives every role a stable key
//   4. Gives every role Dashboard + My Work (they used to be visible to everyone)
//   5. Creates starter roles that do not exist yet (existing roles are never changed)
//   6. Sets accounts without a password to PENDING
import { createPrismaClient } from "../src/lib/prisma-factory";
import { ACTIONS, CRM_MODULES, LEGACY_ACTION_MAP, LEGACY_MODULE_MAP, MODULES, permissionKey, type Action } from "../src/lib/rbac/catalog";

const prisma = createPrismaClient();

const ALL = [...ACTIONS];
const VCE: Action[] = ["view", "create", "edit"];
const BASE: [string[], Action[]] = [["dashboard"], ["view"]];
const MY_WORK: [string[], Action[]] = [["my_work"], VCE];
const ATTENDANCE: [string[], Action[]] = [["attendance"], ["view", "create"]]; // everyone marks their own attendance

const STARTER_ROLES: { key: string; name: string; description: string; perms: [string[], Action[]][] }[] = [
  { key: "admin", name: "Admin", description: "All modules and actions. Cannot manage Super Admins.", perms: [[MODULES.map(m => m.key), ALL]] },
  { key: "manager", name: "Manager", description: "Runs day-to-day operations across CRM, delivery and finance.", perms: [[MODULES.map(m => m.key).filter(k => !["users", "settings", "hr"].includes(k)), ["view", "create", "edit", "approve", "export"]]] },
  { key: "sales_executive", name: "Sales Executive", description: "Leads, customers, quotes, site visits and deals.", perms: [BASE, MY_WORK, ATTENDANCE, [CRM_MODULES, VCE], [["tasks"], VCE], [["reports"], ["view"]]] },
  { key: "project_manager", name: "Project Manager", description: "Projects, BOQ, tasks, vendors and site execution.", perms: [BASE, MY_WORK, ATTENDANCE, [["projects", "boq", "tasks", "vendors", "site_visits", "purchase", "ppr"], ["view", "create", "edit", "approve"]], [["reports"], ["view", "export"]], [["customers", "parks"], ["view"]]] },
  { key: "accountant", name: "Accountant", description: "Payments, invoices and finance.", perms: [BASE, MY_WORK, ATTENDANCE, [["payments", "invoices", "finance"], ["view", "create", "edit", "export"]], [["projects", "vendors", "purchase"], ["view"]], [["reports"], ["view", "export"]]] },
  { key: "hr", name: "HR", description: "Employees, HR, learning and rewards.", perms: [BASE, MY_WORK, ATTENDANCE, [["employees", "hr", "learning", "rewards"], ["view", "create", "edit", "export"]], [["users"], ["view"]]] },
  { key: "site_executive", name: "Site Executive", description: "Site visits and on-site task execution.", perms: [BASE, MY_WORK, ATTENDANCE, [["site_visits"], VCE], [["tasks", "parks"], ["view", "edit"]], [["projects"], ["view"]]] },
];

function slug(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

async function main() {
  // 1. Catalog permissions
  const catalogKeys = new Set<string>();
  let order = 0;
  for (const m of MODULES) {
    for (const a of ACTIONS) {
      catalogKeys.add(permissionKey(m.key, a));
      await prisma.permission.upsert({
        where: { module_action: { module: m.key, action: a } },
        update: { isLegacy: false, sortOrder: order, description: `${a[0].toUpperCase() + a.slice(1)} ${m.label}` },
        create: { module: m.key, action: a, isLegacy: false, sortOrder: order, description: `${a[0].toUpperCase() + a.slice(1)} ${m.label}` },
      });
      order++;
    }
  }
  const all = await prisma.permission.findMany();
  const legacy = all.filter(p => !catalogKeys.has(`${p.module}.${p.action}`));
  if (legacy.length) {
    await prisma.permission.updateMany({ where: { id: { in: legacy.map(p => p.id) } }, data: { isLegacy: true } });
  }
  const idByKey = new Map(all.filter(p => catalogKeys.has(`${p.module}.${p.action}`)).map(p => [`${p.module}.${p.action}`, p.id]));
  console.log(`Catalog: ${catalogKeys.size} permissions, ${legacy.length} legacy rows kept for history`);

  // 2. Translate legacy grants (idempotent: skips keys that already exist)
  const translate = (module: string, action: string) => {
    const keys = (LEGACY_MODULE_MAP[module] ?? []).flatMap(m => (LEGACY_ACTION_MAP[action] ?? []).map(a => permissionKey(m, a)));
    if (module === "Settings" && action === "MANAGE") keys.push(...ACTIONS.map(a => permissionKey("users", a)));
    return keys;
  };
  const legacyIds = new Set(legacy.map(p => p.id));
  const legacyById = new Map(legacy.map(p => [p.id, p]));
  let translated = 0;

  for (const rp of await prisma.rolePermission.findMany({ where: { permissionId: { in: [...legacyIds] } } })) {
    const p = legacyById.get(rp.permissionId)!;
    for (const key of translate(p.module, p.action)) {
      const permissionId = idByKey.get(key);
      if (!permissionId) continue;
      const exists = await prisma.rolePermission.findUnique({ where: { roleId_permissionId: { roleId: rp.roleId, permissionId } } });
      if (!exists) { await prisma.rolePermission.create({ data: { roleId: rp.roleId, permissionId, effect: rp.effect, scope: rp.scope } }); translated++; }
    }
  }
  for (const o of await prisma.employeePermissionOverride.findMany({ where: { permissionId: { in: [...legacyIds] } } })) {
    const p = legacyById.get(o.permissionId)!;
    for (const key of translate(p.module, p.action)) {
      const permissionId = idByKey.get(key);
      if (!permissionId) continue;
      const exists = await prisma.employeePermissionOverride.findUnique({ where: { employeeId_permissionId: { employeeId: o.employeeId, permissionId } } });
      if (!exists) { await prisma.employeePermissionOverride.create({ data: { employeeId: o.employeeId, permissionId, effect: o.effect, scope: o.scope, reason: o.reason, expiresAt: o.expiresAt, createdById: o.createdById } }); translated++; }
    }
  }
  console.log(`Translated ${translated} legacy grants`);

  // Keys for any role without one
  for (const r of await prisma.role.findMany({ where: { key: null } })) {
    let key = slug(r.name) || "role";
    if (await prisma.role.findUnique({ where: { key } })) key = `${key}_${r.id.slice(-6)}`;
    await prisma.role.update({ where: { id: r.id }, data: { key } });
  }

  // 4. Dashboard + My Work for every role (previous default behaviour; Super Admin is a setting of the user, not a role),
  //    and Attendance view + mark, so each employee can open their own attendance page
  const baseline = ["dashboard.view", "my_work.view", "my_work.create", "my_work.edit", "attendance.view", "attendance.create"];
  for (const r of await prisma.role.findMany()) {
    for (const key of baseline) {
      const permissionId = idByKey.get(key)!;
      const exists = await prisma.rolePermission.findUnique({ where: { roleId_permissionId: { roleId: r.id, permissionId } } });
      if (!exists) await prisma.rolePermission.create({ data: { roleId: r.id, permissionId, effect: "ALLOW", scope: "ALL" } });
    }
  }

  // 5. Starter roles (created only when missing)
  for (const s of STARTER_ROLES) {
    const existing = await prisma.role.findFirst({ where: { OR: [{ key: s.key }, { name: s.name }] } });
    if (existing) continue;
    const role = await prisma.role.create({ data: { key: s.key, name: s.name, description: s.description, isActive: true } });
    const keys = new Set<string>();
    for (const [mods, acts] of s.perms) for (const m of mods) for (const a of acts) { keys.add(permissionKey(m, a)); keys.add(permissionKey(m, "view")); }
    for (const key of keys) await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: idByKey.get(key)!, effect: "ALLOW", scope: "ALL" } });
    console.log(`Created starter role ${s.name} (${keys.size} permissions)`);
  }

  // 6. Accounts that cannot sign in yet
  const pending = await prisma.user.updateMany({ where: { password: null, status: "ACTIVE" }, data: { status: "PENDING" } });
  console.log(`Marked ${pending.count} account(s) without a password as PENDING`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
