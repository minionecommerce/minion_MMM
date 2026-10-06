import { withAuthRoute } from "@/lib/api";
import { exportRecords, parseListParams } from "@/lib/records/service";
import { genericModuleFrom as moduleFrom } from "../../helpers";

type Params = { params: Promise<{ module: string }> };

// GET /api/records/<module>/export — CSV of the current search and filters (up to 10,000 rows). Requires export.
export async function GET(request: Request, { params }: Params) {
  return withAuthRoute(request, async ctx => {
    const def = await moduleFrom(params);
    const sp = parseListParams(Object.fromEntries(new URL(request.url).searchParams));
    const csv = await exportRecords(ctx, def.id, sp);
    return new Response(csv, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${def.slug}-${new Date().toISOString().slice(0, 10)}.csv"` },
    });
  });
}
