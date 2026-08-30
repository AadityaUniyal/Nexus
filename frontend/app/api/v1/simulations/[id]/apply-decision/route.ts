import { NextResponse } from "next/server";
import { repository } from "@/lib/repository";
import { enforceRateLimit } from "@/lib/rate-limiter";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const rateLimit = enforceRateLimit(req, "simulation");
  if (rateLimit.limited && rateLimit.response) {
    return rateLimit.response;
  }

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const actorName = body.actorName || "Sarah Chen";

    const applied = repository.applyDecision(id, actorName);
    if (!applied) {
      return NextResponse.json({ error: "Simulation not found" }, { status: 404, headers: rateLimit.headers });
    }

    return NextResponse.json(
      {
        success: true,
        message: `Decision applied from scenario ${applied.code}`,
        data: applied,
      },
      { headers: rateLimit.headers }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: rateLimit.headers });
  }
}
