import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { createServiceVendorPayment } from "@/lib/projects/payments";
import { paymentSchema } from "@/lib/projects/schemas";

type Params = { params: Promise<{ id: string; rowId: string }> };

// POST /api/projects/:id/service-vendors/:rowId/payment — requires projects.edit and ppr.create. The Payment icon: makes a Pre-Payment Record for this
// deal and Service Vendor (and its template) with the amount typed, and answers with the project (the Given Amount and Balance already worked out)
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id, rowId } = await params;
    return NextResponse.json(await createServiceVendorPayment(ctx, id, rowId, await readJson(request, paymentSchema)));
  });
}
