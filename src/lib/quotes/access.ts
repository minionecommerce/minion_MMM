// Who may do what with quotes: the roles' "quotes" permission (view / create / edit / delete / export); layout and settings are Super Admin only.

import type { AuthContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac/effective";
import type { Action } from "@/lib/rbac/catalog";
import { ServiceError } from "@/lib/users/service";
import type { QuoteAbilities } from "./types";

export function needQuotes(ctx: AuthContext, action: Action) {
  if (!hasPermission(ctx.permissions, "quotes", action)) throw new ServiceError(403, `You do not have permission to ${action} quotes.`);
}

// Picking a customer, a deal, an item ... needs create or edit
export function needQuoteWriter(ctx: AuthContext) {
  if (!hasPermission(ctx.permissions, "quotes", "create") && !hasPermission(ctx.permissions, "quotes", "edit")) {
    throw new ServiceError(403, "You do not have permission to use these lists.");
  }
}

export function quoteAbilities(ctx: AuthContext): QuoteAbilities {
  const can = (a: Action) => hasPermission(ctx.permissions, "quotes", a);
  return { create: can("create"), edit: can("edit"), delete: can("delete"), export: can("export"), layout: ctx.isSuperAdmin, settings: ctx.isSuperAdmin };
}
