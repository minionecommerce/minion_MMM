import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { ServiceError } from "@/lib/users/service";
import { vendorPayments } from "@/lib/projects/payments";

type Params = { params: Promise<{ id: string; kind: string; rowId: string }> };

// GET /api/projects/:id/vendors/:kind/:rowId/payments — requires projects.view and ppr.view. The History icon: every payment to the vendor for this deal
export async function GET(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id, kind, rowId } = await params;
    if (kind !== "service" && kind !== "material") throw new ServiceError(404, "Unknown vendor kind");
    return NextResponse.json(await vendorPayments(ctx, id, kind, rowId));
  });
}
