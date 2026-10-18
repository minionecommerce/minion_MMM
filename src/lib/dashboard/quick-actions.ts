// Quick Actions on My Dashboard: the create / add actions of the CRM. Each person offers themselves only the actions their permissions allow, and
// chooses which ones appear; the choice is theirs alone (saved per user, in the UserSetting table).
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac/effective";
import { ServiceError } from "@/lib/users/service";
import type { QuickActionDef, QuickActions } from "./types";

type Def = QuickActionDef & { needs: [module: string, action: string][] };

// href: the real page that creates the record. "?create=" opens that page's own Add popup straight away. "dialog:" opens a popup on the dashboard itself.
export const QUICK_ACTIONS: Def[] = [
  { id: "add_lead", label: "Add Lead", href: "/leads?create=1", icon: "lead", hint: "Opens the Add Lead form", needs: [["leads", "create"]] },
  { id: "create_quote", label: "Create Quote", href: "/quotes/new", icon: "quote", hint: "Opens a new quote", needs: [["quotes", "create"]] },
  { id: "add_material", label: "Add Material", href: "/items?create=Goods", icon: "material", hint: "Adds a Goods item to the Item Master", needs: [["quotes", "create"]] },
  { id: "add_service", label: "Add Service", href: "/items?create=Service", icon: "service", hint: "Adds a Service item to the Item Master", needs: [["quotes", "create"]] },
  { id: "create_ppr", label: "Create PPR", href: "/pre-payments/new", icon: "ppr", hint: "New Pre-Payment Record", needs: [["ppr", "create"]] },
  { id: "create_pcr", label: "Create PCR", href: "/payment-collections/new", icon: "pcr", hint: "New Payment Collection Record", needs: [["payments", "create"]] },
  { id: "create_task", label: "Create Task", href: "/tasks?create=1", icon: "task", hint: "Opens the Create Task form", needs: [["tasks", "create"]] },
  { id: "new_project", label: "New Project", href: "dialog:new-project", icon: "project", hint: "Pick a deal and convert it to a project", needs: [["deals", "edit"], ["projects", "create"]] },
  { id: "add_vendor", label: "Add Vendor", href: "/vendors?create=1", icon: "vendor", hint: "Choose Material or Service, then fill the form", needs: [["vendors", "create"]] },
  { id: "add_material_vendor", label: "Add Material Vendor", href: "/material-vendors/new", icon: "vendor", hint: "New Material Vendor", needs: [["vendors", "create"]] },
  { id: "add_service_vendor", label: "Add Service Vendor", href: "/service-vendors/new", icon: "vendor", hint: "New Service Vendor", needs: [["vendors", "create"]] },
  { id: "add_user", label: "Add User", href: "/users/new", icon: "user", hint: "Create a user account", needs: [["users", "create"]] },
];

// What a person who never chose anything sees (the ones they may use)
export const DEFAULT_QUICK_ACTIONS = ["add_lead", "create_quote", "create_task", "create_ppr", "new_project"];

const keyOf = (userId: string) => `dashboard.quickActions.${userId}`;
const strip = ({ needs: _needs, ...rest }: Def): QuickActionDef => { void _needs; return rest; };

export function availableActions(ctx: AuthContext): QuickActionDef[] {
  return QUICK_ACTIONS.filter(a => a.needs.every(([m, act]) => hasPermission(ctx.permissions, m, act))).map(strip);
}

export async function getQuickActions(ctx: AuthContext): Promise<QuickActions> {
  const available = availableActions(ctx);
  const ids = new Set(available.map(a => a.id));
  let saved: string[] | null = null;
  try {
    const row = await prisma.userSetting.findUnique({ where: { key: keyOf(ctx.userId) }, select: { value: true } });
    const v = row?.value as { selected?: unknown } | null;
    if (v && Array.isArray(v.selected)) saved = v.selected.filter((x): x is string => typeof x === "string");
  } catch (err) {
    console.error("Could not read the quick actions:", err); // the dashboard still opens, with the defaults
  }
  // an action the person may no longer use is not shown, even if they once chose it
  const selected = (saved ?? DEFAULT_QUICK_ACTIONS).filter(id => ids.has(id));
  return { available, selected: Array.from(new Set(selected)) };
}

export async function saveQuickActions(ctx: AuthContext, selected: unknown): Promise<QuickActions> {
  if (!Array.isArray(selected) || selected.some(s => typeof s !== "string") || selected.length > QUICK_ACTIONS.length) throw new ServiceError(400, "Choose quick actions from the list.");
  const allowed = new Set(availableActions(ctx).map(a => a.id));
  const wanted = Array.from(new Set(selected as string[]));
  const bad = wanted.find(id => !allowed.has(id));
  if (bad) throw new ServiceError(403, "You cannot use one of those actions.");
  const value = { selected: wanted } satisfies Prisma.InputJsonValue;
  await prisma.userSetting.upsert({ where: { key: keyOf(ctx.userId) }, create: { key: keyOf(ctx.userId), value }, update: { value } });
  return getQuickActions(ctx);
}
