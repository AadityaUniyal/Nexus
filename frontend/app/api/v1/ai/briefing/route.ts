import { NextResponse } from "next/server";
import { repository } from "@/lib/repository";
import { generateOperationalBriefing } from "@/lib/ai";
import { enforceRateLimit } from "@/lib/rate-limiter";

export async function POST(req: Request) {
  const rateLimit = enforceRateLimit(req, "ai_inference");
  if (rateLimit.limited && rateLimit.response) {
    return rateLimit.response;
  }

  try {
    const stats = repository.getOverviewStats();
    const incidents = repository.getIncidents();
    const topIncident = incidents.find((i) => i.status !== "RESOLVED");

    const briefing = await generateOperationalBriefing({
      activeIncidentsCount: stats.activeIncidents,
      fleetUtilizationPct: stats.fleetUtilization,
      slaCompliancePct: stats.slaCompliance,
      topIncidentTitle: topIncident?.title,
      recentSimulationsCount: stats.activeSimulations,
    });

    return NextResponse.json({ success: true, briefing }, { headers: rateLimit.headers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: rateLimit.headers });
  }
}
