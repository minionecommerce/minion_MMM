import { withAuthRoute } from "@/lib/api";
import { exportQuotes, parseQuoteListParams } from "@/lib/quotes/service";

// GET /api/quotes/export?q=&status=... — the list (with the same search and filters) as a CSV file. Needs export.
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => {
    const sp = parseQuoteListParams(Object.fromEntries(new URL(request.url).searchParams));
    const csv = await exportQuotes(ctx, sp);
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="quotes.csv"' } });
  });
}
