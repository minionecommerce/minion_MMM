"use client";

import { useSession } from "next-auth/react";
import { ReactNode } from "react";
import { snapshotAllows } from "@/lib/rbac/catalog";

interface CanProps {
  // "module.action", e.g. "users.create"
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

// UX only: hides UI the user cannot use. The server re-checks every request.
export function Can({ permission, children, fallback = null }: CanProps) {
  const { data: session } = useSession();
  const [module, action = "view"] = permission.toLowerCase().split(".");
  if (!session?.user || !snapshotAllows(session.user.permissions, module, action)) return <>{fallback}</>;
  return <>{children}</>;
}
