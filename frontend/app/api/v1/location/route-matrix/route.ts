import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  try {
    const res = await fetch(`${backendUrl}/api/v1/location/route-matrix`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Fallback
  }

  const sources = body.sources || [];
  const targets = body.targets || [];
  const cells = [];

  for (let s = 0; s < sources.length; s++) {
    for (let t = 0; t < targets.length; t++) {
      cells.push({
        source_id: sources[s].id || `src_${s}`,
        target_id: targets[t].id || `tgt_${t}`,
        distance_meters: 12500 + s * 1400,
        duration_seconds: 1200 + s * 180,
        status: "OK",
      });
    }
  }

  return NextResponse.json({
    cells,
    sources_count: sources.length,
    targets_count: targets.length,
    provider: "nexus-fallback",
  });
}
