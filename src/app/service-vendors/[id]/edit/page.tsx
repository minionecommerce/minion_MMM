import { RecordFormPage } from "@/app/records/pages";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return RecordFormPage("serviceVendor", "edit", (await params).id);
}
