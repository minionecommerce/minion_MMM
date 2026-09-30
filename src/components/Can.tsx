"use client";

import { useSession } from "next-auth/react";
import { ReactNode } from "react";

interface CanProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const { data: session } = useSession();

  if (!session?.user) return <>{fallback}</>;

  if (session.user.role === "SUPER_ADMIN") {
    return <>{children}</>;
  }

  const permissions = session.user.permissions || [];
  
  if (permissions.includes(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
