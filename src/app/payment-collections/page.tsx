import { RecordsListPage } from "@/app/records/pages";

export const dynamic = "force-dynamic";

// Payment Collection Records: the list page. Everything it shows comes from the module's Edit Page Layout (see src/app/records).
export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return RecordsListPage("paymentCollection", searchParams);
}
