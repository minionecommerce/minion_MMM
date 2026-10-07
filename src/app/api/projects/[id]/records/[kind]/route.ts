import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { ServiceError } from "@/lib/users/service";
import { createProjectRecord } from "@/lib/projects/payments";
import { recordBodySchema } from "@/lib/projects/schemas";

type Params = { params: Promise<{ id: string; kind: string }> };

// POST /api/projects/:id/records/pre-payments | payment-collections — Create PPR / Create PCR inside a project. The record form posts here; the
// Deal is always the project's deal (whatever the form sent). Needs ppr.create / payments.create, checked by the record service.
export async function POST(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id, kind } = await params;
    if (kind !== "pre-payments" && kind !== "payment-collections") throw new ServiceError(404, "Unknown record kind");
    const body = await readJson(request, recordBodySchema);
    return NextResponse.json({ success: true, ...(await createProjectRecord(ctx, id, kind === "pre-payments" ? "prePayment" : "paymentCollection", body)) });
  });
}
