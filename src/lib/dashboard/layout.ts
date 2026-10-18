// My Dashboard → Edit Page Layout: the order of the sections and cards and which are shown. One layout for everyone (like the other Edit Page Layout
// screens), changed only by a Super Admin. Stored as one row in the UserSetting table; no row means the standard layout.
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { ServiceError } from "@/lib/users/service";
import { assertSuperAdmin } from "@/lib/users/layout";
import { CARD_KEYS, CHART_KEYS, SECTION_KEYS, type DashboardLayout } from "./types";

const KEY = "dashboard.layout";
const TODAY_KEYS = ["leads", "tasks", "siteVisits", "deals"] as const;

export const DEFAULT_LAYOUT: DashboardLayout = {
  sections: SECTION_KEYS.map(key => ({ key, visible: true })),
  cards: CARD_KEYS.map(key => ({ key, visible: true })),
  charts: CHART_KEYS.map(key => ({ key, visible: true })),
  today: TODAY_KEYS.map(key => ({ key, visible: true })),
};

// A stored layout, made whole: the order is kept, a key that is unknown or repeated is dropped, a key that is missing (a card added in a later
// version) goes at the end and is shown
function whole<K extends string>(stored: unknown, all: readonly K[]): { key: K; visible: boolean }[] {
  const seen = new Set<K>();
  const out: { key: K; visible: boolean }[] = [];
  if (Array.isArray(stored)) {
    for (const item of stored) {
      const key = (item as { key?: unknown })?.key;
      if (typeof key !== "string" || !(all as readonly string[]).includes(key) || seen.has(key as K)) continue;
      seen.add(key as K);
      out.push({ key: key as K, visible: (item as { visible?: unknown }).visible !== false });
    }
  }
  for (const key of all) if (!seen.has(key)) out.push({ key, visible: true });
  return out;
}

export function normalizeLayout(stored: unknown): DashboardLayout {
  const s = (stored && typeof stored === "object" ? stored : {}) as Record<string, unknown>;
  return { sections: whole(s.sections, SECTION_KEYS), cards: whole(s.cards, CARD_KEYS), charts: whole(s.charts, CHART_KEYS), today: whole(s.today, TODAY_KEYS) };
}

export async function getDashboardLayout(): Promise<DashboardLayout> {
  try {
    const row = await prisma.userSetting.findUnique({ where: { key: KEY }, select: { value: true } });
    return normalizeLayout(row?.value);
  } catch (err) {
    console.error("Could not read the dashboard layout:", err); // the dashboard still opens, in the standard layout
    return DEFAULT_LAYOUT;
  }
}

export async function saveDashboardLayout(ctx: AuthContext, input: unknown): Promise<DashboardLayout> {
  assertSuperAdmin(ctx);
  if (!input || typeof input !== "object") throw new ServiceError(400, "Send the layout.");
  const next = normalizeLayout(input);
  if (!next.sections.some(s => s.visible)) throw new ServiceError(400, "Keep at least one section shown.");
  const before = await getDashboardLayout();
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.userSetting.upsert({ where: { key: KEY }, create: { key: KEY, value: next as unknown as Prisma.InputJsonValue }, update: { value: next as unknown as Prisma.InputJsonValue } });
    await writeAudit({ action: "DASHBOARD_LAYOUT_CHANGED", actorUserId: ctx.userId, oldValue: before as unknown as Prisma.InputJsonValue, newValue: next as unknown as Prisma.InputJsonValue }, tx);
  });
  return next;
}
