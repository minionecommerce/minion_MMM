import { getRewardsData } from "@/services/rewards";
import RewardsClient from "./RewardsClient";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const data = await getRewardsData();
  return <RewardsClient initialData={JSON.parse(JSON.stringify(data))} />;
}
