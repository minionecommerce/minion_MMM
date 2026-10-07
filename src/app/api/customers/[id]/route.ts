import { NextResponse } from "next/server";
import { readJson, withAuthRoute } from "@/lib/api";
import { DuplicateCustomerError, updateCustomerFromForm } from "@/lib/customers/service";
import { customerBodySchema, duplicateCustomer } from "../helpers";

type Params = { params: Promise<{ id: string }> };

// PUT /api/customers/:id — the customer as the Customer form sends it. The number never changes; what is saved is what every quote, deal and project
// that uses this customer shows from then on. Needs customers.edit or quotes.create / quotes.edit.
export async function PUT(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const { id } = await params;
    const body = await readJson(request, customerBodySchema);
    try {
      return NextResponse.json({ customer: await updateCustomerFromForm(ctx, id, body) });
    } catch (e) {
      if (e instanceof DuplicateCustomerError) return duplicateCustomer(e);
      throw e;
    }
  });
}
