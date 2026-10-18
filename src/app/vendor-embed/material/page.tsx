import { RecordFormPage } from "@/app/records/pages";

export const dynamic = "force-dynamic";

// The material vendor form shown inside the Add Vendor window of a Pre-Payment / Payment Collection form: no side menu, and saving tells that page
export default function Page() {
  return RecordFormPage("materialVendor", "create", undefined, undefined, true);
}
