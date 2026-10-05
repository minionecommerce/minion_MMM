import { RecordFormPage } from "@/app/records/pages";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return RecordFormPage("materialVendor", "edit", (await params).id);
}
