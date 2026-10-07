import { withAuthRoute } from "@/lib/api";
import { exportProjects, parseProjectParams } from "@/lib/projects/list";

// GET /api/projects/export — requires projects.export. The Projects list as a CSV file, for the current search, filters and calendar
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => {
    const url = new URL(request.url);
    const params = parseProjectParams(Object.fromEntries(url.searchParams.entries()));
    const csv = await exportProjects(ctx, params);
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="projects.csv"' } });
  });
}
