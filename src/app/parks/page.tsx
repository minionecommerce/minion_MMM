import { requirePageAccess } from "@/lib/auth";
import { getLandscapes } from "@/services/parks";
import ParksClient from "./ParksClient";

export const dynamic = "force-dynamic";

export default async function ParksPage() {
  await requirePageAccess(["parks"]);
  const landscapes = await getLandscapes();
  return <ParksClient initialLandscapes={JSON.parse(JSON.stringify(landscapes))} />;
}

