import { NextResponse } from "next/server";
import { repository } from "@/lib/repository";
import { enforceRateLimit } from "@/lib/rate-limiter";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const rateLimit = enforceRateLimit(req, "standard");
  if (rateLimit.limited && rateLimit.response) {
    return rateLimit.response;
  }

  const { id } = await params;
  const incident = repository.getIncidentById(id);
  if (!incident) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404, headers: rateLimit.headers });
  }
  return NextResponse.json({ success: true, data: incident }, { headers: rateLimit.headers });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const rateLimit = enforceRateLimit(req, "standard");
  if (rateLimit.limited && rateLimit.response) {
    return rateLimit.response;
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, note, actorName } = body;

    const updated = repository.updateIncidentStatus(id, status, note, actorName);
    if (!updated) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404, headers: rateLimit.headers });
    }

    return NextResponse.json({ success: true, data: updated }, { headers: rateLimit.headers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: rateLimit.headers });
  }
}
