// What a customer sees when they open a quote with its share link (/q/<token>): that one quote, read-only, no sign-in, only while the link
// is live. A link that is switched off, has expired, or belongs to a deleted quote shows nothing.

import { prisma } from "@/lib/db";
import { getLayout } from "@/lib/records/layout";
import type { QuoteDoc } from "./doc";
import { documentOf } from "./doc-server";
import { loadSettings } from "./settings";
import { HEADER_INCLUDE, buildQuoteDto } from "./service";

const TOKEN = /^[A-Za-z0-9_-]{20,80}$/;
const VIEWED_EVERY_MS = 60 * 60 * 1000; // opening the same link again within the hour is not logged again

export async function getSharedQuote(token: string): Promise<QuoteDoc | null> {
  if (!TOKEN.test(token)) return null;
  const row = await prisma.quote.findFirst({ where: { shareToken: token, deletedAt: null }, include: HEADER_INCLUDE });
  if (!row || (row.shareExpiresAt && row.shareExpiresAt <= new Date())) return null;
  const [layout, settings] = await Promise.all([getLayout("quote"), loadSettings()]);
  const quote = await buildQuoteDto(row, layout, settings, null);

  const recent = await prisma.cRMAuditLog.findFirst({
    where: { entityType: "Quote", entityId: row.id, action: "Viewed", createdAt: { gt: new Date(Date.now() - VIEWED_EVERY_MS) } },
    select: { id: true },
  });
  if (!recent) {
    await prisma.cRMAuditLog.create({ data: { entityType: "Quote", entityId: row.id, action: "Viewed", quoteId: row.id, ...(row.dealId ? { dealId: row.dealId } : {}) } }).catch(() => undefined);
  }
  // A customer never sees the staff-only parts: no attachments, no share details, no author
  return documentOf({ ...quote, files: [], share: { token: null, url: null, expiresAt: null }, createdBy: null }, layout, settings);
}
