import { withAuthRoute } from "@/lib/api";
import { hasPermission } from "@/lib/rbac/effective";
import { ServiceError } from "@/lib/users/service";
import { vendorsCsv } from "@/lib/vendors/list";
import { parseVendorParams } from "@/lib/vendors/params";

// GET /api/vendors/export — CSV of the current search and Vendor Type filter (up to 10,000 rows). Requires export on Vendors.
export async function GET(request: Request) {
  return withAuthRoute(request, async ctx => {
    if (!hasPermission(ctx.permissions, "vendors", "export")) throw new ServiceError(403, "You do not have permission to export vendors.");
    const csv = await vendorsCsv(parseVendorParams(Object.fromEntries(new URL(request.url).searchParams)));
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="vendors-${new Date().toISOString().slice(0, 10)}.csv"` } });
  });
}
