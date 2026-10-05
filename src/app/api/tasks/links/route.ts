import { NextResponse } from "next/server";
import { withAuthRoute } from "@/lib/api";
import { linkSearchSchema } from "@/lib/tasks/schemas";
import { searchLinks } from "@/lib/tasks/service";

// GET /api/tasks/links?kind=lead|project|deal&q=... — pick-list for the Create New Task form (needs tasks.create and view of that module)
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => {
    const url = new URL(request.url);
    const { kind, q } = linkSearchSchema.parse({ kind: url.searchParams.get("kind"), q: url.searchParams.get("q") ?? undefined });
    return NextResponse.json({ options: await searchLinks(ctx, kind, q ?? "") });
  });
}
