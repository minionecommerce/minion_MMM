import { can, requirePageAccess } from "@/lib/auth";
import { getDealFilterLists, listDeals, parseDealParams } from "@/lib/deals/queries";
import { getDealColumnOrder, getDealStatusField } from "@/lib/leads/layout";
import { getFormOptions } from "@/lib/leads/queries";
import { getLayout } from "@/lib/records/layout";
import { isStorageConfigured } from "@/lib/leads/storage";
import DealsClient from "./DealsClient";

export const dynamic = "force-dynamic";

// Deals: leads that were converted with the Convert icon on the Leads page (DL1, DL2, ...), on a copy of the Leads page
export default async function DealsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requirePageAccess(["deals"]);
  const params = parseDealParams(await searchParams);
  const canConvert = can(ctx, "deals", "edit") && can(ctx, "projects", "create");
  const [data, options, lists, columnOrder, statusField, projectLayout] = await Promise.all([
    listDeals(params),
    getFormOptions(),
    getDealFilterLists(),
    getDealColumnOrder(),
    ctx.isSuperAdmin ? getDealStatusField() : Promise.resolve(null), // only the Super Admin edits the layout
    canConvert ? getLayout("project") : Promise.resolve(null), // the Convert to Project popup follows the Project layout (labels, mandatory, hidden)
  ]);
  const convertFields = projectLayout
    ? ["productOrService", "name", "siteLocation", "siteLocationLink", "startDate", "expectedEndDate", "priorCompletionDate"].flatMap(key => {
        const f = projectLayout.fields.find(x => x.key === key);
        return f ? [{ key, label: f.label, required: f.required, enabled: f.enabled, options: f.options }] : [];
      })
    : [];

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
        project: canConvert, // Convert to Project needs deals.edit and projects.create
      }}
      storageReady={isStorageConfigured()}
      convertFields={convertFields}
    />
  );
}
