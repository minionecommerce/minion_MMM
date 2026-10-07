// Who may create and change customers: the roles' "customers" permission, and also the people who make quotes (a customer is added or corrected
// from the quote form, where it is needed). Edit Page Layout and the numbering are Super Admin only.

import type { AuthContext } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac/effective";
import { ServiceError } from "@/lib/users/service";
import type { CustomerAbilities } from "./types";

const quoteWriter = (ctx: AuthContext) => hasPermission(ctx.permissions, "quotes", "create") || hasPermission(ctx.permissions, "quotes", "edit");

export function customerAbilities(ctx: AuthContext): CustomerAbilities {
  return {
    create: hasPermission(ctx.permissions, "customers", "create") || quoteWriter(ctx),
    edit: hasPermission(ctx.permissions, "customers", "edit") || quoteWriter(ctx),
    layout: ctx.isSuperAdmin,
  };
}

export function needCustomerWriter(ctx: AuthContext, action: "create" | "edit") {
  if (!customerAbilities(ctx)[action]) throw new ServiceError(403, `You do not have permission to ${action} customers.`);
}

// Seeing the form (and the list of customers) is part of writing
export function needCustomerReader(ctx: AuthContext) {
  const a = customerAbilities(ctx);
  if (!a.create && !a.edit && !hasPermission(ctx.permissions, "customers", "view")) throw new ServiceError(403, "You do not have permission to use customers.");
}
