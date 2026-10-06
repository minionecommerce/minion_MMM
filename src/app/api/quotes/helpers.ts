import { z } from "zod";
import { NextResponse } from "next/server";
import { DuplicateCustomerError } from "@/lib/quotes/lookups";
import { originFromHeaders } from "@/lib/quotes/origin";

// The address of this site as the person's browser sees it
export const originOf = (request: Request): string => originFromHeaders(request.headers, new URL(request.url).host);

// The body of a quote (create and edit): what the service checks is decided by the layout, so the shape here is only what is safe to read
export const quoteBodySchema = z.object({
  values: z.record(z.string().max(64), z.unknown()).default({}),
  lines: z.array(z.unknown()).max(500).default([]),
  calc: z.object({
    discountPercent: z.unknown().optional(),
    shippingCharges: z.unknown().optional(),
    withholding: z.object({ kind: z.enum(["TDS", "TCS"]), taxId: z.string().min(1).max(60) }).strict().nullable().optional(),
    adjustmentLabel: z.string().max(200).nullable().optional(),
    adjustment: z.unknown().optional(),
  }).strict().default({}),
  intent: z.enum(["draft", "save", "send"]),
}).strict();

export function duplicateCustomer(err: DuplicateCustomerError) {
  return NextResponse.json({ error: err.message, code: "DUPLICATE", hard: err.hard, existing: err.existing }, { status: 409 });
}
