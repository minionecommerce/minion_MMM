import { getLandscapeById } from "@/services/parks";
import { notFound } from "next/navigation";
import ParkDetailsClient from "./ParkDetailsClient";
import { mockParks } from "../data/mock";

export const dynamic = "force-dynamic";

export default async function LandscapePage({ params }: { params: { parkId: string } }) {
  const { parkId } = params;
  let dbLandscape: any = await getLandscapeById(parkId);

  // Fallback to mock park if matching ID in mock data
  if (!dbLandscape) {
    const mockMatch = mockParks.find(p => p.id === parkId);
    if (mockMatch) {
      dbLandscape = {
        id: mockMatch.id,
        landscapeNumber: mockMatch.id,
        name: mockMatch.name,
        type: mockMatch.type,
        value: mockMatch.financials.contractValue,
        status: mockMatch.status,
        stage: mockMatch.stage,
        progress: mockMatch.progress,
        health: mockMatch.health.overall,
        healthStatus: mockMatch.health.status,
        customer: { name: mockMatch.customerName, customerCode: mockMatch.customerCode },
        project: { name: mockMatch.projectId },
        manager: { user: { name: mockMatch.manager } },
        plants: [],
        irrigationZones: [],
        maintenances: [],
        inspections: [],
      };
    }
  }

  if (!dbLandscape) {
    notFound();
  }

  return <ParkDetailsClient dbLandscape={JSON.parse(JSON.stringify(dbLandscape))} />;
}

