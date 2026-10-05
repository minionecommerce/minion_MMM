import { notFound } from "next/navigation";
import { requirePageAccess } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac/effective";
import { ServiceError } from "@/lib/users/service";
import { MODULES } from "@/lib/records/registry";
import { getLayout } from "@/lib/records/layout";
import { activeUsers, approvers } from "@/lib/records/lookups";
import { abilitiesOf, getRecord, listRecords, parseListParams, peekNextCode } from "@/lib/records/service";
import type { ModuleId } from "@/lib/records/types";
import RecordForm from "./components/RecordForm";
import RecordView from "./RecordView";
import RecordsListClient from "./RecordsListClient";

// The pages of the four record modules. Each module's route files (src/app/<slug>/...) just call these.
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function recordOr404(ctx: Parameters<typeof getRecord>[0], moduleId: ModuleId, id: string) {
  try {
    return await getRecord(ctx, moduleId, id);
  } catch (err) {
    if (err instanceof ServiceError && err.status === 404) notFound();
    throw err;
  }
}

export async function RecordsListPage(moduleId: ModuleId, searchParams: SearchParams) {
  const def = MODULES[moduleId];
  const ctx = await requirePageAccess([def.permission]);
  const params = parseListParams(await searchParams);
  const [layout, data, users] = await Promise.all([getLayout(moduleId), listRecords(ctx, moduleId, params), activeUsers()]);
  return <RecordsListClient moduleId={moduleId} layout={layout} data={data} params={params} abilities={abilitiesOf(ctx, moduleId)} users={users} />;
}

export async function RecordFormPage(moduleId: ModuleId, mode: "create" | "edit", id?: string) {
  const def = MODULES[moduleId];
  const ctx = await requirePageAccess([def.permission], mode === "create" ? "create" : "edit");
  const layout = await getLayout(moduleId);
  const wantsApprovers = layout.fields.some(f => f.type === "APPROVER" && f.enabled);
  const [users, approverList, nextCode, found] = await Promise.all([
    activeUsers(),
    wantsApprovers ? approvers(moduleId) : Promise.resolve([]),
    peekNextCode(moduleId),
    mode === "edit" ? recordOr404(ctx, moduleId, id!) : Promise.resolve(null),
  ]);
  return (
    <div data-light-native className="bg-white text-[#333]">
      <RecordForm
        key={found?.record.id ?? "new"}
        moduleId={moduleId}
        mode={mode}
        layout={layout}
        record={found?.record}
        refs={found?.refs ?? { users: {}, deals: {}, materialVendors: {}, serviceVendors: {} }}
        users={users}
        approvers={approverList}
        me={{ id: ctx.userId }}
        canApprove={hasPermission(ctx.permissions, def.permission, "approve")}
        canLayout={ctx.isSuperAdmin}
        nextCode={nextCode}
      />
    </div>
  );
}

export async function RecordViewPage(moduleId: ModuleId, id: string) {
  const def = MODULES[moduleId];
  const ctx = await requirePageAccess([def.permission]);
  const [layout, found] = await Promise.all([getLayout(moduleId), recordOr404(ctx, moduleId, id)]);
  return <RecordView moduleId={moduleId} layout={layout} record={found.record} refs={found.refs} abilities={abilitiesOf(ctx, moduleId)} />;
}
