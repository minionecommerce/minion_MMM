import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

export type SecurityAction =
  | "USER_CREATED"
  | "USER_UPDATED"
  | "ROLE_CHANGED"
  | "PERMISSIONS_CHANGED"
  | "ROLE_PERMISSIONS_CHANGED"
  | "ROLE_CREATED"
  | "ROLE_UPDATED"
  | "ROLE_DELETED"
  | "PASSWORD_RESET"
  | "PASSWORD_CHANGED"
  | "USER_ACTIVATED"
  | "USER_DEACTIVATED"
  | "USER_SUSPENDED"
  | "USER_DELETED"
  | "LOGIN"
  | "LOGOUT"
  | "FAILED_LOGIN"
  | "ACCOUNT_LOCKED"
  | "ACCESS_DENIED"
  | "DROPDOWN_OPTION_CREATED"
  | "DROPDOWN_OPTION_UPDATED"
  | "DROPDOWN_OPTION_DELETED"
  | "DROPDOWN_OPTIONS_REORDERED"
  | "LEAD_FIELD_CREATED"
  | "LEAD_FIELD_UPDATED"
  | "LEAD_FIELD_DELETED"
  | "LEAD_FIELDS_REORDERED";

type Db = Prisma.TransactionClient | typeof prisma;

export type AuditEntry = {
  action: SecurityAction;
  actorUserId?: string | null;
  targetUserId?: string | null;
  oldValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
  userAgent?: string | null;
};

// Keys that must never reach the audit log
const SECRET_KEYS = new Set(["password", "passwordHash", "confirmPassword", "newPassword", "currentPassword", "temporaryPassword"]);

function scrub(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([k]) => !SECRET_KEYS.has(k))
        .map(([k, v]) => [k, scrub(v)])
    );
  }
  return value;
}

export async function requestMeta() {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    return {
      ip: (forwarded ? forwarded.split(",")[0].trim() : h.get("x-real-ip")) || null,
      userAgent: h.get("user-agent")?.slice(0, 500) || null,
    };
  } catch {
    // Called outside a request (scripts, NextAuth events)
    return { ip: null, userAgent: null };
  }
}

export async function writeAudit(entry: AuditEntry, db: Db = prisma) {
  const meta = entry.ip === undefined && entry.userAgent === undefined ? await requestMeta() : { ip: entry.ip ?? null, userAgent: entry.userAgent ?? null };
  await db.securityAuditLog.create({
    data: {
      action: entry.action,
      actorUserId: entry.actorUserId ?? null,
      targetUserId: entry.targetUserId ?? null,
      oldValue: entry.oldValue === undefined ? undefined : (scrub(entry.oldValue) as Prisma.InputJsonValue),
      newValue: entry.newValue === undefined ? undefined : (scrub(entry.newValue) as Prisma.InputJsonValue),
      metadata: entry.metadata === undefined ? undefined : (scrub(entry.metadata) as Prisma.InputJsonValue),
      ip: meta.ip,
      userAgent: meta.userAgent,
    },
  });
}

// Audit failures must never break the user-facing action
export async function writeAuditSafe(entry: AuditEntry, db: Db = prisma) {
  try {
    await writeAudit(entry, db);
  } catch (err) {
    console.error("Failed to write security audit log", err);
  }
}
