import { NextResponse } from "next/server";
import { repository } from "@/lib/repository";
import { enforceRateLimit } from "@/lib/rate-limiter";

export async function GET(req: Request) {
  const rateLimit = enforceRateLimit(req, "telemetry");
  if (rateLimit.limited && rateLimit.response) {
    return rateLimit.response;
  }

  const vehicles = repository.getVehicles();
  return NextResponse.json({ success: true, data: vehicles }, { headers: rateLimit.headers });
}

export async function PATCH(req: Request) {
  const rateLimit = enforceRateLimit(req, "standard");
  if (rateLimit.limited && rateLimit.response) {
    return rateLimit.response;
  }

  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "Vehicle id required" }, { status: 400, headers: rateLimit.headers });

    const updated = repository.updateVehicle(id, updates);
    return NextResponse.json({ success: true, data: updated }, { headers: rateLimit.headers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: rateLimit.headers });
  }
}
