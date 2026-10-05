import { redirect } from "next/navigation";
import { can, requirePageAccess } from "@/lib/auth";
import { getFormOptions, listLeads, parseListParams } from "@/lib/leads/queries";
import { isStorageConfigured } from "@/lib/leads/storage";
import LeadsClient from "./LeadsClient";

export const dynamic = "force-dynamic";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requirePageAccess(["leads"]);
  const query = await searchParams;

  // The Lead Person filter starts out as the person who is signed in, so everyone sees their own leads first. It is written into
  // the address once, which means search, sorting, paging and the download all keep it. Taking it off writes f_leadPerson=[]
  // ("nobody in particular") and that is respected; an address with no f_leadPerson at all is a fresh visit.
  if (query.f_leadPerson === undefined && ctx.employeeId) {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) for (const v of Array.isArray(value) ? value : value === undefined ? [] : [value]) next.append(key, v);
    next.set("f_leadPerson", JSON.stringify([ctx.employeeId]));
    redirect(`/leads?${next}`);
  }

  const params = parseListParams(query);
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
        convert: can(ctx, "leads", "edit") && can(ctx, "deals", "create"), // Convert makes a deal out of the lead
        export: can(ctx, "leads", "export"),
        layout: ctx.isSuperAdmin, // Edit Page Layout is Super Admin only (the API enforces it too)
      }}
      storageReady={isStorageConfigured()}
    />
  );
}
