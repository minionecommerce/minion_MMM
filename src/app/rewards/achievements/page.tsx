import { requirePageAccess } from "@/lib/auth";
import { getRewardsData } from "@/services/rewards";
import RewardsClient from "../RewardsClient";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  await requirePageAccess(["rewards"]);
  const data = await getRewardsData();
  return <RewardsClient initialData={JSON.parse(JSON.stringify(data))} defaultTab="Achievements" />;
}
