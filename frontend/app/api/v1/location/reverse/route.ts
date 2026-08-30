import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  try {
    const res = await fetch(`${backendUrl}/api/v1/location/reverse`, {
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

  const lat = body.latitude || 30.3165;
  const lng = body.longitude || 78.0322;

  return NextResponse.json({
    id: `rev-${Date.now()}`,
    display_name: `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`,
    formatted_address: `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`,
    latitude: lat,
    longitude: lng,
    type: "coordinate",
    confidence: 1.0,
    provider: "nexus-fallback",
  });
}
