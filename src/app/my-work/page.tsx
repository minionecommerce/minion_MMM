import { requirePageAccess } from "@/lib/auth";
import { getMyWorkData } from "@/services/my-work";
import MyWorkClient from "./MyWorkClient";

export const dynamic = "force-dynamic";

export default async function MyWorkPage() {
  await requirePageAccess(["my_work"]);
  const data = await getMyWorkData();
  return <MyWorkClient initialData={JSON.parse(JSON.stringify(data))} />;
}
