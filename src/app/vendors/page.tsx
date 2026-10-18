import { can, requirePageAccess } from "@/lib/auth";
import { listVendors } from "@/lib/vendors/list";
import { parseVendorParams } from "@/lib/vendors/params";
import VendorsClient from "./VendorsClient";

export const dynamic = "force-dynamic";

// Vendors: Material and Service Vendors in one list with one ID series (V1, V2 ...), a Vendor Type column and filter.
export default async function VendorsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requirePageAccess(["vendors"]);
  const raw = await searchParams;
  const params = parseVendorParams(raw);
  const data = await listVendors(params);
  return (
    <VendorsClient
      data={data}
      params={params}
      abilities={{ create: can(ctx, "vendors", "create"), edit: can(ctx, "vendors", "edit"), delete: can(ctx, "vendors", "delete"), export: can(ctx, "vendors", "export") }}
      autoCreate={raw.create === "1"}
    />
  );
}
