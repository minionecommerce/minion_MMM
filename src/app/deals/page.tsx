import { can, requirePageAccess } from "@/lib/auth";
import { getDealFilterLists, listDeals, parseDealParams } from "@/lib/deals/queries";
import { getDealColumnOrder, getDealStatusField } from "@/lib/leads/layout";
import { getFormOptions } from "@/lib/leads/queries";
import { isStorageConfigured } from "@/lib/leads/storage";
import DealsClient from "./DealsClient";

export const dynamic = "force-dynamic";

// Deals: leads that were converted with the Convert icon on the Leads page (DL1, DL2, ...), on a copy of the Leads page
export default async function DealsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requirePageAccess(["deals"]);
  const params = parseDealParams(await searchParams);
  const [data, options, lists, columnOrder, statusField] = await Promise.all([
    listDeals(params),
    getFormOptions(),
    getDealFilterLists(),
    getDealColumnOrder(),
    ctx.isSuperAdmin ? getDealStatusField() : Promise.resolve(null), // only the Super Admin edits the layout
  ]);

  return (
    <DealsClient
      data={data}
      params={params}
      options={options}
      lists={lists}
      columnOrder={columnOrder}
      statusField={statusField}
      currentEmployeeId={ctx.employeeId}
      abilities={{
        edit: can(ctx, "deals", "edit"),
        create: can(ctx, "deals", "create"), // Duplicate
        delete: can(ctx, "deals", "delete"),
        export: can(ctx, "deals", "export"),
        layout: ctx.isSuperAdmin, // Edit Deal Layout is Super Admin only (the API enforces it too)
      }}
      storageReady={isStorageConfigured()}
    />
  );
}
