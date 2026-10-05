import { RecordFormPage } from "@/app/records/pages";

export const dynamic = "force-dynamic";

export default function Page() {
  return RecordFormPage("materialVendor", "create");
}
