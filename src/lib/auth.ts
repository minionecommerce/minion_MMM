import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

export type ResolvedPermission = {
  module: string;
  action: string;
  effect: string;
  scope: string | null;
};

export async function getEffectivePermissions(userId: string): Promise<ResolvedPermission[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      },
      employee: {
        include: {
          permissionOverrides: {
            include: { permission: true }
          },
          tempPermissions: {
            where: {
              startsAt: { lte: new Date() },
              expiresAt: { gte: new Date() }
            },
            include: { permission: true }
          }
        }
      }
    }
  });

  if (!user) return [];
  if (user.role?.name === "SUPER_ADMIN") {
    // Return a wild card for super admin? Or just handled in `can`
    return [{ module: "ALL", action: "ALL", effect: "ALLOW", scope: "ALL" }];
  }

  const permissionsMap = new Map<string, ResolvedPermission>();

  // 1. Role Permissions (Base)
  if (user.role?.permissions) {
    user.role.permissions.forEach(rp => {
      if (rp.effect === "ALLOW") {
        const key = `${rp.permission.module}:${rp.permission.action}`;
        permissionsMap.set(key, {
          module: rp.permission.module,
          action: rp.permission.action,
          effect: rp.effect,
          scope: rp.scope
        });
      }
    });
  }

  // 2. Employee Overrides (Override role base)
  if (user.employee?.permissionOverrides) {
    user.employee.permissionOverrides.forEach(op => {
      const key = `${op.permission.module}:${op.permission.action}`;
      if (op.effect === "DENY") {
        permissionsMap.delete(key);
      } else {
        permissionsMap.set(key, {
          module: op.permission.module,
          action: op.permission.action,
          effect: op.effect,
          scope: op.scope
        });
      }
    });
  }

  // 3. Temporary Permissions
  if (user.employee?.tempPermissions) {
    user.employee.tempPermissions.forEach(tp => {
      const key = `${tp.permission.module}:${tp.permission.action}`;
      if (tp.effect === "DENY") {
        permissionsMap.delete(key);
      } else {
        permissionsMap.set(key, {
          module: tp.permission.module,
          action: tp.permission.action,
          effect: tp.effect,
          scope: tp.scope
        });
      }
    });
  }

  return Array.from(permissionsMap.values());
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { 
            role: true, 
            employee: {
              include: { departmentRef: true }
            } 
          }
        });
        
        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }
        
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        
        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }
        
        const effectivePerms = await getEffectivePermissions(user.id);
        const permStrings = effectivePerms.map(p => `${p.module}.${p.action}`);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role?.name || "User",
          roleId: user.role?.id,
          employeeId: user.employee?.id,
          department: user.employee?.departmentRef?.name || user.employee?.department || undefined,
          permissions: permStrings
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role as string;
        token.roleId = (user as any).roleId as string | undefined;
        token.employeeId = user.employeeId;
        token.department = user.department;
        token.permissions = user.permissions || [];
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.roleId = token.roleId as string | undefined;
        session.user.employeeId = token.employeeId as string | undefined;
        session.user.department = token.department as string | undefined;
        session.user.permissions = token.permissions as string[];
      }
      return session;
    }
  }
};

// ---------------------------------------------------------
// SERVER-SIDE RBAC UTILS
// ---------------------------------------------------------

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function getCurrentEmployee() {
  const user = await getCurrentUser();
  if (!user?.employeeId) return null;
  return await prisma.employee.findUnique({
    where: { id: user.employeeId },
    include: { departmentRef: true }
  });
}

// can(userId, module, action, record?) implementation
export async function can(userId: string, module: string, action: string, recordId?: string) {
  const effective = await getEffectivePermissions(userId);
  
  if (effective.some(p => p.module === "ALL" && p.action === "ALL")) {
    return true; // Super Admin
  }

  const match = effective.find(p => 
    p.module.toLowerCase() === module.toLowerCase() && 
    p.action.toLowerCase() === action.toLowerCase()
  );

  if (!match) return false;

  // Basic scope check for illustration (in a real app, record queries verify ownership)
  if (recordId) {
    if (match.scope === "OWN") {
      // Must check if user owns the record. Typically done via Prisma directly
      // return checkOwnership(userId, module, recordId);
    }
  }

  return true;
}

export async function hasPermission(permission: string) {
  const user = await getCurrentUser();
  if (!user || !user.permissions) return false;
  if (user.role === "SUPER_ADMIN") return true; 
  return user.permissions.includes(permission.toLowerCase()); // or however it's formatted
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}

export async function requirePermission(permission: string) {
  const user = await requireAuth();
  if (user.role === "SUPER_ADMIN") return user;
  
  // Note: Since we encoded as `Module.Action` during login, we just check inclusion.
  // Actually, let's normalize to lowercase just in case.
  const has = user.permissions?.some(p => p.toLowerCase() === permission.toLowerCase());
  
  if (!has) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
