import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { writeAuditSafe } from "./audit";
import { resolvePermissions, hasPermission } from "./rbac/effective";
import { landingPath, type Action, type ModuleKey } from "./rbac/catalog";

// ---------------------------------------------------------
// Session & login policy
// ---------------------------------------------------------
const SHORT_SESSION_MS = 12 * 60 * 60 * 1000; // 12 hours
const REMEMBER_SESSION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SNAPSHOT_REFRESH_MS = 60 * 1000; // re-read permissions for the sidebar/proxy every minute
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const IP_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_PER_IP = 20;
export const BCRYPT_ROUNDS = 12;

// Used to keep response time similar whether or not the email exists
let dummyHash: string | null = null;
function getDummyHash() {
  dummyHash ??= bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);
  return dummyHash;
}

export const LOGIN_ERRORS = {
  INVALID: "INVALID_CREDENTIALS",
  LOCKED: "ACCOUNT_LOCKED",
  INACTIVE: "ACCOUNT_INACTIVE",
  THROTTLED: "TOO_MANY_ATTEMPTS",
} as const;

// ---------------------------------------------------------
// Loading a user's authorization state from the database
// ---------------------------------------------------------
export type AuthState = {
  userId: string;
  name: string | null;
  email: string | null;
  status: string;
  sessionVersion: number;
  mustChangePassword: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  roleId: string | null;
  roleName: string | null;
  employeeId: string | null;
  department: string | null;
  permissions: string[];
};

export async function loadAuthState(userId: string): Promise<AuthState | null> {
  // One SQL round trip instead of ~6 chained queries: this runs on every page and API request
  const user = await prisma.user.findUnique({
    relationLoadStrategy: "join",
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      deletedAt: true,
      sessionVersion: true,
      mustChangePassword: true,
      isAdmin: true,
      roleId: true,
      role: {
        select: {
          name: true,
          isActive: true,
          isSuperAdmin: true,
          permissions: { select: { effect: true, permission: { select: { module: true, action: true, isLegacy: true } } } },
        },
      },
      employee: {
        select: {
          id: true,
          department: true,
          departmentRef: { select: { name: true } },
          permissionOverrides: {
            select: { effect: true, expiresAt: true, permission: { select: { module: true, action: true, isLegacy: true } } },
          },
          tempPermissions: {
            select: { effect: true, startsAt: true, expiresAt: true, permission: { select: { module: true, action: true, isLegacy: true } } },
          },
        },
      },
    },
  });
  if (!user || user.deletedAt) return null;

  const roleActive = !!user.role?.isActive;
  const permissions = resolvePermissions({
    isSuperAdmin: roleActive && !!user.role?.isSuperAdmin,
    isAdmin: user.isAdmin,
    roleGrants: roleActive ? user.role!.permissions.map(rp => ({ ...rp.permission, effect: rp.effect })) : [],
    userOverrides: (user.employee?.permissionOverrides ?? []).map(o => ({ ...o.permission, effect: o.effect, expiresAt: o.expiresAt })),
    temporaryGrants: (user.employee?.tempPermissions ?? []).map(t => ({ ...t.permission, effect: t.effect, startsAt: t.startsAt, expiresAt: t.expiresAt })),
  });

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    status: user.status,
    sessionVersion: user.sessionVersion,
    mustChangePassword: user.mustChangePassword,
    isAdmin: user.isAdmin,
    isSuperAdmin: roleActive && !!user.role?.isSuperAdmin,
    roleId: user.roleId,
    roleName: user.role?.name ?? null,
    employeeId: user.employee?.id ?? null,
    department: user.employee?.departmentRef?.name || user.employee?.department || null,
    permissions,
  };
}

// Kept for existing callers (e.g. check-perms.ts)
export async function getEffectivePermissions(userId: string) {
  return (await loadAuthState(userId))?.permissions ?? [];
}

// ---------------------------------------------------------
// NextAuth configuration
// ---------------------------------------------------------
function headerValue(headers: unknown, name: string): string | null {
  if (!headers) return null;
  if (typeof (headers as Headers).get === "function") return (headers as Headers).get(name);
  const v = (headers as Record<string, string | string[] | undefined>)[name];
  return Array.isArray(v) ? v[0] : v ?? null;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: REMEMBER_SESSION_MS / 1000, // cookie ceiling; the real lifetime is token.sessionExpiresAt
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember me", type: "text" },
      },
      async authorize(credentials, req) {
        const email = credentials?.email?.trim().toLowerCase() ?? "";
        const password = credentials?.password ?? "";
        const forwarded = headerValue(req?.headers, "x-forwarded-for");
        const meta = {
          ip: (forwarded ? forwarded.split(",")[0].trim() : headerValue(req?.headers, "x-real-ip")) || null,
          userAgent: headerValue(req?.headers, "user-agent")?.slice(0, 500) ?? null,
        };

        if (!email || !password || password.length > 256) {
          throw new Error(LOGIN_ERRORS.INVALID);
        }

        // Per-IP throttle (covers guessing many different emails)
        if (meta.ip) {
          const recent = await prisma.securityAuditLog.count({
            where: { action: "FAILED_LOGIN", ip: meta.ip, createdAt: { gte: new Date(Date.now() - IP_WINDOW_MS) } },
          });
          if (recent >= MAX_FAILED_PER_IP) {
            await writeAuditSafe({ action: "FAILED_LOGIN", metadata: { email, reason: "IP_THROTTLED" }, ...meta });
            throw new Error(LOGIN_ERRORS.THROTTLED);
          }
        }

        const user = await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" }, deletedAt: null },
          select: { id: true, name: true, email: true, password: true, status: true, lockedUntil: true, failedLoginCount: true },
        });

        if (!user || !user.password) {
          await bcrypt.compare(password, getDummyHash());
          await writeAuditSafe({ action: "FAILED_LOGIN", targetUserId: user?.id, metadata: { email, reason: user ? "NO_PASSWORD" : "UNKNOWN_EMAIL" }, ...meta });
          throw new Error(LOGIN_ERRORS.INVALID);
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          await writeAuditSafe({ action: "FAILED_LOGIN", targetUserId: user.id, metadata: { email, reason: "LOCKED" }, ...meta });
          throw new Error(LOGIN_ERRORS.LOCKED);
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          const failures = user.failedLoginCount + 1;
          const lock = failures >= MAX_FAILED_LOGINS;
          await prisma.user.update({
            where: { id: user.id },
            data: lock
              ? { failedLoginCount: 0, lockedUntil: new Date(Date.now() + LOCKOUT_MS) }
              : { failedLoginCount: failures },
          });
          await writeAuditSafe({ action: "FAILED_LOGIN", targetUserId: user.id, metadata: { email, reason: "BAD_PASSWORD", failures }, ...meta });
          if (lock) {
            await writeAuditSafe({ action: "ACCOUNT_LOCKED", targetUserId: user.id, metadata: { minutes: LOCKOUT_MS / 60000 }, ...meta });
            throw new Error(LOGIN_ERRORS.LOCKED);
          }
          throw new Error(LOGIN_ERRORS.INVALID);
        }

        // Status is only revealed after a correct password
        if (user.status !== "ACTIVE") {
          await writeAuditSafe({ action: "FAILED_LOGIN", targetUserId: user.id, metadata: { email, reason: `STATUS_${user.status}` }, ...meta });
          throw new Error(LOGIN_ERRORS.INACTIVE);
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date(), failedLoginCount: 0, lockedUntil: null },
        });
        await writeAuditSafe({ action: "LOGIN", actorUserId: user.id, targetUserId: user.id, ...meta });

        return { id: user.id, name: user.name, email: user.email, remember: credentials?.remember === "true" };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      const now = Date.now();

      if (user) {
        token.id = user.id;
        token.loginAt = now;
        token.sessionExpiresAt = now + ((user as { remember?: boolean }).remember ? REMEMBER_SESSION_MS : SHORT_SESSION_MS);
        token.refreshedAt = 0;
        token.sessionVersion = undefined;
      }

      if (!token.id || token.invalid) return token;

      if (!token.sessionExpiresAt || now > token.sessionExpiresAt) {
        token.invalid = true;
        token.permissions = [];
        return token;
      }

      const stale = trigger === "update" || !token.refreshedAt || now - token.refreshedAt > SNAPSHOT_REFRESH_MS;
      if (stale) {
        const state = await loadAuthState(token.id);
        const versionChanged = token.sessionVersion !== undefined && state && state.sessionVersion !== token.sessionVersion;
        if (!state || state.status !== "ACTIVE" || versionChanged) {
          token.invalid = true;
          token.permissions = [];
          return token;
        }
        token.sessionVersion = state.sessionVersion;
        token.name = state.name;
        token.email = state.email;
        token.role = state.roleName ?? "No role";
        token.roleId = state.roleId ?? undefined;
        token.isSuperAdmin = state.isSuperAdmin;
        token.isAdmin = state.isAdmin;
        token.employeeId = state.employeeId ?? undefined;
        token.department = state.department ?? undefined;
        token.permissions = state.permissions;
        token.mustChangePassword = state.mustChangePassword;
        token.refreshedAt = now;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.name = token.name ?? null;
      session.user.email = token.email ?? null;
      session.user.role = token.role ?? "";
      session.user.roleId = token.roleId;
      session.user.isSuperAdmin = !!token.isSuperAdmin;
      session.user.isAdmin = !!token.isAdmin;
      session.user.employeeId = token.employeeId;
      session.user.department = token.department;
      session.user.permissions = token.invalid ? [] : token.permissions ?? [];
      session.user.mustChangePassword = !!token.mustChangePassword;
      session.user.sessionVersion = token.sessionVersion;
      session.user.invalid = !!token.invalid;
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.id) {
        await writeAuditSafe({ action: "LOGOUT", actorUserId: token.id, targetUserId: token.id, ip: null, userAgent: null });
      }
    },
  },
};

// ---------------------------------------------------------
// Data Access Layer — the real security boundary.
// Every protected page, server action and API route goes through here.
// ---------------------------------------------------------
export class AuthError extends Error {
  constructor(public code: "UNAUTHENTICATED" | "FORBIDDEN" | "PASSWORD_CHANGE_REQUIRED", message?: string) {
    super(message ?? code);
    this.name = "AuthError";
  }
}

export type AuthContext = AuthState;

// Fresh from the database, once per request
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const session = await getServerSession(authOptions);
  const u = session?.user;
  if (!u?.id || u.invalid) return null;

  const state = await loadAuthState(u.id);
  if (!state || state.status !== "ACTIVE") return null;
  if (u.sessionVersion !== undefined && u.sessionVersion !== state.sessionVersion) return null;
  return state;
});

export function can(ctx: AuthContext | null, module: ModuleKey, action: Action = "view") {
  return !!ctx && hasPermission(ctx.permissions, module, action);
}

export async function requireAuth(options: { allowPasswordChange?: boolean } = {}) {
  const ctx = await getAuthContext();
  if (!ctx) throw new AuthError("UNAUTHENTICATED");
  if (ctx.mustChangePassword && !options.allowPasswordChange) throw new AuthError("PASSWORD_CHANGE_REQUIRED");
  return ctx;
}

async function denied(ctx: AuthContext, what: string): Promise<never> {
  await writeAuditSafe({ action: "ACCESS_DENIED", actorUserId: ctx.userId, metadata: { required: what } });
  throw new AuthError("FORBIDDEN");
}

// requirePermission("projects", "edit") or requirePermission("projects.edit")
export async function requirePermission(module: ModuleKey | `${ModuleKey}.${Action}`, action?: Action) {
  const [m, a] = action ? [module as ModuleKey, action] : (module.split(".") as [ModuleKey, Action]);
  const ctx = await requireAuth();
  if (!hasPermission(ctx.permissions, m, a)) await denied(ctx, `${m}.${a}`);
  return ctx;
}

// Allowed if the user holds `action` on ANY of the modules
export async function requireAnyPermission(modules: ModuleKey[], action: Action = "view") {
  const ctx = await requireAuth();
  if (!modules.some(m => hasPermission(ctx.permissions, m, action))) await denied(ctx, `${modules.join("|")}.${action}`);
  return ctx;
}

// For server actions that return { success, error } instead of throwing
export async function authorizeAction(module: ModuleKey, action: Action) {
  try {
    const ctx = await requirePermission(module, action);
    return { ok: true as const, ctx };
  } catch (err) {
    return { ok: false as const, error: authErrorMessage(err) };
  }
}

export function authErrorMessage(err: unknown) {
  if (err instanceof AuthError) {
    if (err.code === "UNAUTHENTICATED") return "Your session has expired. Please sign in again.";
    if (err.code === "PASSWORD_CHANGE_REQUIRED") return "You must change your password before continuing.";
    return "You do not have permission to perform this action.";
  }
  throw err;
}

// For server components (pages/layouts): redirect instead of throwing
export async function requirePageAccess(modules: ModuleKey[], action: Action = "view") {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (ctx.mustChangePassword) redirect("/account/change-password");
  if (!modules.some(m => hasPermission(ctx.permissions, m, action))) {
    await writeAuditSafe({ action: "ACCESS_DENIED", actorUserId: ctx.userId, metadata: { required: `${modules.join("|")}.${action}` } });
    redirect(modules.includes("dashboard") ? landingPath(ctx.permissions) : "/unauthorized");
  }
  return ctx;
}

// ---------------------------------------------------------
// Compatibility helpers used by existing code
// ---------------------------------------------------------
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function getCurrentEmployee() {
  const ctx = await getAuthContext();
  if (!ctx?.employeeId) return null;
  return await prisma.employee.findUnique({
    where: { id: ctx.employeeId },
    include: { departmentRef: true },
  });
}
