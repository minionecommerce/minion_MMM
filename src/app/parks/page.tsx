import { getLandscapes } from "@/services/parks";
import ParksClient from "./ParksClient";

export const dynamic = "force-dynamic";

export default async function ParksPage() {
  const landscapes = await getLandscapes();
  return <ParksClient initialLandscapes={JSON.parse(JSON.stringify(landscapes))} />;
}

