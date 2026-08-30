import { NextResponse } from "next/server";
import { repository } from "@/lib/repository";
import { generateOperationalBriefing } from "@/lib/ai";
import { enforceRateLimit } from "@/lib/rate-limiter";

export async function GET(req: Request) {
  const rateLimit = enforceRateLimit(req, "standard");
  if (rateLimit.limited && rateLimit.response) {
    return rateLimit.response;
  }

  try {
    const stats = repository.getOverviewStats();
    const incidents = repository.getIncidents();
    const vehicles = repository.getVehicles();
    const warehouses = repository.getWarehouses();
    const events = repository.getEvents();

    const topIncident = incidents.find((i) => i.status !== "RESOLVED");

    const briefing = await generateOperationalBriefing({
      activeIncidentsCount: stats.activeIncidents,
      fleetUtilizationPct: stats.fleetUtilization,
      slaCompliancePct: stats.slaCompliance,
      topIncidentTitle: topIncident?.title,
      recentSimulationsCount: stats.activeSimulations,
    });

    return NextResponse.json(
      {
        success: true,
        stats,
        topIncident,
        briefing,
        warehousesCount: warehouses.length,
        vehiclesCount: vehicles.length,
        recentEvents: events.slice(0, 8),
      },
      { headers: rateLimit.headers }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
