// The quotes a project was made from (Deals -> Convert to Project). A project that has chosen quotes counts only those, and only the accepted ones, in
// its Project Value; a project made before the choice existed has none chosen and counts every accepted quote of its deal.
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac/effective";
import { ServiceError } from "@/lib/users/service";
import { isId } from "@/lib/records/values";
import { classifyKinds, itemKindOf } from "./calc";
import { dec, decOr0, dayOf, type Db } from "./common";
import type { DealQuote } from "./types";

// The chosen quote ids of one project, or null when it has none (an older project)
export async function linkedQuoteIds(projectId: string, db: Db = prisma): Promise<string[] | null> {
  const rows = await db.projectQuote.findMany({ where: { projectId }, select: { quoteId: true } });
  return rows.length ? rows.map(r => r.quoteId) : null;
}

// The same for many projects at once: only the projects that have a choice are in the map
export async function linkedQuoteIdsFor(projectIds: string[], db: Db = prisma): Promise<Map<string, Set<string>>> {
  const out = new Map<string, Set<string>>();
  if (!projectIds.length) return out;
  const rows = await db.projectQuote.findMany({ where: { projectId: { in: projectIds } }, select: { projectId: true, quoteId: true } });
  for (const r of rows) (out.get(r.projectId) ?? out.set(r.projectId, new Set()).get(r.projectId)!).add(r.quoteId);
  return out;
}

// "The accepted quotes of this deal that count for the project"
export const acceptedQuotesWhere = (dealId: string, linked: string[] | null): Prisma.QuoteWhereInput => ({
  dealId, status: "Accepted", deletedAt: null, ...(linked ? { id: { in: linked } } : {}),
});

const ITEMS = { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, name: true, description: true, quantity: true, unit: true, rate: true, amount: true, kind: true, item: { select: { kind: true } } } } satisfies Prisma.QuoteItemFindManyArgs;
const QUOTE_SELECT = {
  id: true, quoteNumber: true, date: true, reference: true, subject: true, status: true, amount: true, subTotal: true, taxTotal: true,
  lineItems: ITEMS,
} satisfies Prisma.QuoteSelect;

// The quotes of one deal for the Convert to Project popup (no other deal's quotes), with their items, the way the quote page shows them
export async function quotesOfDeal(ctx: AuthContext, dealId: string): Promise<DealQuote[]> {
  if (!hasPermission(ctx.permissions, "deals", "view")) throw new ServiceError(403, "You do not have permission to view deals.");
  if (!isId(dealId)) throw new ServiceError(404, "Deal not found");
  const deal = await prisma.deal.findFirst({ where: { id: dealId, deletedAt: null }, select: { id: true } });
  if (!deal) throw new ServiceError(404, "Deal not found");
  const quotes = await prisma.quote.findMany({ where: { dealId, deletedAt: null }, orderBy: [{ date: "asc" }, { createdAt: "asc" }], select: QUOTE_SELECT, take: 200 });
  return quotes.map(q => {
    const items = q.lineItems.map(l => ({
      id: l.id, name: l.name?.trim() || "", description: l.description?.trim() || "", quantity: decOr0(l.quantity), unit: l.unit, rate: decOr0(l.rate), amount: decOr0(l.amount),
      kind: itemKindOf(l.kind, l.item?.kind),
    }));
    return {
      id: q.id, quoteNumber: q.quoteNumber ?? "", date: dayOf(q.date) ?? "", reference: q.reference ?? "", subject: q.subject ?? "", status: q.status,
      value: decOr0(q.amount), subTotal: dec(q.subTotal), taxTotal: dec(q.taxTotal), items,
    };
  });
}

// Checks the quotes picked in the popup and works out what follows from them: the Product / Service of the project (from the items of the picked
// quotes). Only quotes of this deal can be picked; the same quote twice is one.
export async function checkPickedQuotes(db: Db, dealId: string, quoteIds: string[]) {
  const ids = Array.from(new Set(quoteIds));
  if (!ids.length) return { ids, productOrService: null };
  if (ids.some(id => !isId(id))) throw new ServiceError(400, "One of the chosen quotes is not valid.");
  const quotes = await db.quote.findMany({ where: { id: { in: ids }, dealId, deletedAt: null }, select: QUOTE_SELECT });
  if (quotes.length !== ids.length) throw new ServiceError(409, "A chosen quote does not belong to this deal any more. Reload the page and choose again.");
  const kinds = quotes.flatMap(q => q.lineItems.map(l => itemKindOf(l.kind, l.item?.kind)));
  const productOrService = classifyKinds(kinds);
  return { ids, productOrService };
}
