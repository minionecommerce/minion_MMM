import { getLearningData } from "@/services/learning";
import LearningClient from "./LearningClient";

export const dynamic = "force-dynamic";

export default async function LearningPage() {
  const data = await getLearningData();
  return <LearningClient initialData={JSON.parse(JSON.stringify(data))} />;
}
