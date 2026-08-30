import { NextResponse } from "next/server";
import { repository } from "@/lib/repository";
import { generateIncidentMitigation } from "@/lib/ai";
import { enforceRateLimit } from "@/lib/rate-limiter";

export async function GET(req: Request) {
  const rateLimit = enforceRateLimit(req, "standard");
  if (rateLimit.limited && rateLimit.response) {
    return rateLimit.response;
  }

  const incidents = repository.getIncidents();
  return NextResponse.json({ success: true, data: incidents }, { headers: rateLimit.headers });
}

export async function POST(req: Request) {
  const rateLimit = enforceRateLimit(req, "standard");
  if (rateLimit.limited && rateLimit.response) {
    return rateLimit.response;
  }

  try {
    const body = await req.json();
    const created = repository.createIncident(body);

    // Optional Groq AI synthesis for mitigation
    if (created && !created.aiAnalysis) {
      const aiMitigation = await generateIncidentMitigation({
        title: created.title,
        summary: created.summary,
        severity: created.severity,
        affectedEntity: created.affectedEntityName,
        delayMins: created.delayMinutes,
      });
      created.aiAnalysis = aiMitigation;
    }

    return NextResponse.json({ success: true, data: created }, { headers: rateLimit.headers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: rateLimit.headers });
  }
}
