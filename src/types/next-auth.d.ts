import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      roleId?: string;
      isSuperAdmin: boolean;
      isAdmin: boolean;
      employeeId?: string;
      department?: string;
      // Snapshot for UI and proxy redirects only; the server re-checks the database
      permissions: string[];
      mustChangePassword: boolean;
      sessionVersion?: number;
      invalid: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    remember?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
    roleId?: string;
    isSuperAdmin?: boolean;
    isAdmin?: boolean;
    employeeId?: string;
    department?: string;
    permissions?: string[];
    mustChangePassword?: boolean;
    sessionVersion?: number;
    loginAt?: number;
    sessionExpiresAt?: number;
    refreshedAt?: number;
    invalid?: boolean;
  }
}
