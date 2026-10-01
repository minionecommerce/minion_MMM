import { getResourcesData } from "@/services/resources";
import ResourcesClient from "./ResourcesClient";

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const data = await getResourcesData();
  return <ResourcesClient initialData={JSON.parse(JSON.stringify(data))} />;
}
