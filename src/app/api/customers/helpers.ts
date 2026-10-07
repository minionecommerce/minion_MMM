import { z } from "zod";
import { NextResponse } from "next/server";
import { DuplicateCustomerError } from "@/lib/customers/service";

// The body of a new or changed customer: what the service checks is decided by the Customer layout, so the shape here is only what is safe to read
export const customerBodySchema = z.object({
  values: z.record(z.string().max(64), z.unknown()).default({}),
  force: z.boolean().optional(),
}).strict();

// 409 + { code: "DUPLICATE", hard, existing }: the form shows the customer that is already there and offers to use it
export function duplicateCustomer(err: DuplicateCustomerError) {
  return NextResponse.json({ error: err.message, code: "DUPLICATE", hard: err.hard, existing: err.existing }, { status: 409 });
}
