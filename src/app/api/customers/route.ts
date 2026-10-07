import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { createCustomerFromForm, DuplicateCustomerError } from "@/lib/customers/service";
import { customerBodySchema, duplicateCustomer } from "./helpers";

// POST /api/customers — a new customer from the Customer form. The same mobile number or email is refused (409 DUPLICATE with the customer that
// has it); the same name asks first (send force: true to add it anyway). Needs customers.create or quotes.create / quotes.edit.
export async function POST(request: Request) {
  return withAuthRoute(request, async ctx => {
    const body = await readJson(request, customerBodySchema);
    try {
      return NextResponse.json({ customer: await createCustomerFromForm(ctx, body) }, { status: 201 });
    } catch (e) {
      if (e instanceof DuplicateCustomerError) return duplicateCustomer(e);
      throw e;
    }
  });
}
