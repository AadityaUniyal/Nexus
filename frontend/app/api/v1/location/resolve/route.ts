import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  try {
    const res = await fetch(`${backendUrl}/api/v1/location/resolve`, {
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

  return NextResponse.json({
    id: body.providerResultId || `loc-${Date.now()}`,
    display_name: body.query || "Selected Operating Area",
    latitude: body.latitude || 30.3165,
    longitude: body.longitude || 78.0322,
    type: body.resultType || "city",
    country: "Global",
    confidence: 1.0,
    provider: "nexus-fallback",
  });
}
