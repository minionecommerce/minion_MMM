import { can, requirePageAccess } from "@/lib/auth";
import { getFormOptions, listLeads, parseListParams } from "@/lib/leads/queries";
import { isStorageConfigured } from "@/lib/leads/storage";
import LeadsClient from "./LeadsClient";

export const dynamic = "force-dynamic";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requirePageAccess(["leads"]);
  const params = parseListParams(await searchParams);
  const [data, options] = await Promise.all([listLeads(params), getFormOptions()]);

  return (
    <LeadsClient
      data={data}
      params={params}
      options={options}
      currentEmployeeId={ctx.employeeId}
      abilities={{
        create: can(ctx, "leads", "create"),
        edit: can(ctx, "leads", "edit"),
        delete: can(ctx, "leads", "delete"),
        export: can(ctx, "leads", "export"),
        layout: ctx.isSuperAdmin, // Edit Page Layout is Super Admin only (the API enforces it too)
      }}
      storageReady={isStorageConfigured()}
    />
  );
}
