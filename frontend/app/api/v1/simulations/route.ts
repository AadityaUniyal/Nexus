import { NextResponse } from "next/server";
import { repository } from "@/lib/repository";
import { enforceRateLimit } from "@/lib/rate-limiter";

export async function GET(req: Request) {
  const rateLimit = enforceRateLimit(req, "standard");
  if (rateLimit.limited && rateLimit.response) {
    return rateLimit.response;
  }

  const simulations = repository.getSimulations();
  return NextResponse.json({ success: true, data: simulations }, { headers: rateLimit.headers });
}

export async function POST(req: Request) {
  const rateLimit = enforceRateLimit(req, "simulation");
  if (rateLimit.limited && rateLimit.response) {
    return rateLimit.response;
  }

  try {
    const body = await req.json();
    const { title, description, variables, incidentId } = body;

    const sim = repository.createSimulation(
      title || "Dynamic Route & Capacity Optimization",
      description || "Scenario evaluating alternate corridors and dispatch variables.",
      variables || {},
      incidentId
    );

    return NextResponse.json({ success: true, data: sim }, { headers: rateLimit.headers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: rateLimit.headers });
  }
}
