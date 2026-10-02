import { NextResponse } from "next/server";
import { LayoutInUseError } from "@/lib/leads/layout";

// The editor asks the Super Admin to confirm when an action would change existing leads.
// 409 + { code: "IN_USE", usage } is how it finds out.
export function inUseResponse(err: LayoutInUseError) {
  return NextResponse.json({ error: err.message, code: "IN_USE", action: err.action, usage: err.usage }, { status: 409 });
}
