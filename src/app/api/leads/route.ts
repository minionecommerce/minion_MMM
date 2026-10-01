import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { hasPermission } from "@/lib/rbac/effective";
import { ServiceError } from "@/lib/users/service";
import { leadInputSchema } from "@/lib/leads/schemas";
import { createLead } from "@/lib/leads/service";
import { listLeads, parseListParams } from "@/lib/leads/queries";

// GET /api/leads?q=&filter=&sort=&dir=&page=  — requires leads.view
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => {
    if (!hasPermission(ctx.permissions, "leads", "view")) throw new ServiceError(403, "You do not have permission to view leads.");
    const sp = Object.fromEntries(new URL(request.url).searchParams);
    return NextResponse.json(await listLeads(parseListParams(sp)));
  });
}

// POST /api/leads — requires leads.create. The ID, timestamps and createdBy are set by the server.
export async function POST(request: Request) {
  return withAuthRoute(request, async ctx => {
    const input = await readJson(request, leadInputSchema);
    const lead = await createLead(ctx, input);
    return NextResponse.json({ lead: { id: lead.id, code: lead.leadCode } }, { status: 201 });
  });
}
