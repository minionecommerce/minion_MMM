import { withAuthRoute } from "@/lib/api";
import { exportItems } from "@/lib/quotes/catalog";

// GET /api/quotes/items/export — the catalogue as a CSV file. Needs export.
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => new Response(await exportItems(ctx), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="items.csv"' } }));
}
