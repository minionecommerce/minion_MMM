import { RecordViewPage } from "@/app/records/pages";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return RecordViewPage("prePayment", (await params).id);
}
