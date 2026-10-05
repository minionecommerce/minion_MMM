import { NextResponse } from "next/server";
import { ServiceError } from "@/lib/users/service";
import { moduleBySlug, type ModuleDef } from "@/lib/records/registry";
import { LayoutInUseError } from "@/lib/records/layout";
import { RecordInUseError } from "@/lib/records/service";

// /api/records/<slug>/... : the slug is the module's page address (material-vendors, service-vendors, pre-payments, payment-collections)
export async function moduleFrom(params: Promise<{ module: string }>): Promise<ModuleDef> {
  const def = moduleBySlug((await params).module);
  if (!def) throw new ServiceError(404, "Unknown module");
  return def;
}

// The screens ask the Super Admin to confirm when an action would change existing records.
// 409 + { code: "IN_USE", usage } is how they find out.
export function layoutInUse(err: LayoutInUseError) {
  return NextResponse.json({ error: err.message, code: "IN_USE", usage: err.usage }, { status: 409 });
}

export function recordInUse(err: RecordInUseError) {
  return NextResponse.json({ error: err.message, code: "IN_USE", usage: err.usage }, { status: 409 });
}
