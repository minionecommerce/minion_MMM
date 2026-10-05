import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { getLayout } from "@/lib/records/layout";
import { need } from "@/lib/records/service";
import { moduleFrom } from "../../helpers";

type Params = { params: Promise<{ module: string }> };

// GET /api/records/<module>/layout — the module's current layout. Requires view on the module.
export async function GET(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const def = await moduleFrom(params);
    need(ctx, def.id, "view");
    return NextResponse.json(await getLayout(def.id));
  });
}
