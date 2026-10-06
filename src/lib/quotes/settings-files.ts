// The company logo and the signature / seal printed on the quote document. Uploaded straight to the private Storage bucket like every other
// file; a Super Admin picks them in Quote Settings → Company. They are ModuleFile rows of the module "quote" whose record is "settings".

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import type { AuthContext } from "@/lib/auth";
import { ServiceError } from "@/lib/users/service";
import { assertSuperAdmin } from "@/lib/users/layout";
import { createReadUrls, createUploadUrl, removeObjects, statObject } from "@/lib/leads/storage";
import { isId, stripControl } from "@/lib/records/values";
import type { CompanySettings } from "./types";

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };
export const SETTINGS_RECORD = "settings";

export async function signCompanyFile(ctx: AuthContext, input: { kind: "logo" | "signature"; name: string; size: number }) {
  assertSuperAdmin(ctx);
  const name = stripControl(input.name).trim();
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  if (!TYPES[ext]) throw new ServiceError(400, "Use a PNG, JPG or WEBP picture.");
  if (!Number.isInteger(input.size) || input.size <= 0) throw new ServiceError(400, "The file is empty.");
  if (input.size > MAX_BYTES) throw new ServiceError(400, "The picture is larger than 2 MB.");
  const storagePath = `records/quote/settings/${randomUUID()}.${ext}`;
  const uploadUrl = await createUploadUrl(storagePath);
  const row = await prisma.moduleFile.create({
    data: { module: "quote", recordId: SETTINGS_RECORD, fieldKey: `company_${input.kind}`, storagePath, fileName: name.slice(0, 255), mimeType: TYPES[ext], size: input.size, status: "PENDING", uploadedById: ctx.userId },
    select: { id: true },
  });
  return { id: row.id, uploadUrl };
}

export async function completeCompanyFile(ctx: AuthContext, id: string) {
  assertSuperAdmin(ctx);
  if (!isId(id)) throw new ServiceError(404, "That upload was not found.");
  const row = await prisma.moduleFile.findFirst({ where: { id, module: "quote", recordId: SETTINGS_RECORD, status: "PENDING", deletedAt: null } });
  if (!row) throw new ServiceError(404, "That upload was not found.");
  const stat = await statObject(row.storagePath);
  if (!stat) throw new ServiceError(400, "The picture did not arrive. Please try again.");
  if (stat.size <= 0 || stat.size > MAX_BYTES) {
    await removeObjects([row.storagePath]);
    await prisma.moduleFile.update({ where: { id }, data: { deletedAt: new Date() } });
    throw new ServiceError(400, "The picture is empty or larger than 2 MB.");
  }
  await prisma.moduleFile.update({ where: { id }, data: { status: "READY", size: stat.size } });
  const urls = await createReadUrls([row.storagePath]);
  return { id, fileName: row.fileName, url: urls.get(row.storagePath) ?? null };
}

// The pictures that a new company setting no longer uses are thrown away (and the ones nobody ever saved)
export async function dropReplacedCompanyFiles(before: CompanySettings, after: CompanySettings) {
  const keep = new Set([after.logoFileId, after.signatureFileId].filter((x): x is string => !!x));
  const drop = [before.logoFileId, before.signatureFileId].filter((x): x is string => !!x && !keep.has(x));
  if (!drop.length) return;
  const rows = await prisma.moduleFile.findMany({ where: { id: { in: drop }, module: "quote", recordId: SETTINGS_RECORD, deletedAt: null }, select: { id: true, storagePath: true } });
  await prisma.moduleFile.updateMany({ where: { id: { in: rows.map(r => r.id) } }, data: { deletedAt: new Date() } });
  await removeObjects(rows.map(r => r.storagePath));
}

// Short-lived links to the logo and the signature, for the quote document and the settings screen
export async function companyImageUrls(company: CompanySettings): Promise<{ logo: string | null; signature: string | null }> {
  const ids = [company.logoFileId, company.signatureFileId].filter((x): x is string => !!x);
  if (!ids.length) return { logo: null, signature: null };
  const rows = await prisma.moduleFile.findMany({ where: { id: { in: ids }, module: "quote", recordId: SETTINGS_RECORD, deletedAt: null, status: "READY" }, select: { id: true, storagePath: true } });
  const urls = await createReadUrls(rows.map(r => r.storagePath)).catch(() => new Map<string, string>());
  const by = new Map(rows.map(r => [r.id, urls.get(r.storagePath) ?? null]));
  return { logo: company.logoFileId ? by.get(company.logoFileId) ?? null : null, signature: company.signatureFileId ? by.get(company.signatureFileId) ?? null : null };
}
