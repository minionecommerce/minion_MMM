import { RecordFormPage } from "@/app/records/pages";

export const dynamic = "force-dynamic";

// ?projectId=...: Create PPR inside a project (the deal is the project's and cannot be changed)
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const projectId = (await searchParams).projectId;
  return RecordFormPage("prePayment", "create", undefined, typeof projectId === "string" ? projectId : undefined);
}
