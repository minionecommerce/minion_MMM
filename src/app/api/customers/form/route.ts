import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { getCustomerForm } from "@/lib/customers/service";

// GET /api/customers/form?id= — everything the Customer form window needs: the layout, the customer (when ?id= is given), the people for a User
// field, the next customer number and what the person may do. Needs the permission to create (no id) or edit (with id) customers.
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => {
    const id = new URL(request.url).searchParams.get("id");
    return NextResponse.json(await getCustomerForm(ctx, id || null));
  });
}
