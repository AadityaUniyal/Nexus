import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat") || "30.3165";
  const lng = searchParams.get("lng") || "78.0322";
  const radius = searchParams.get("radius") || "5000";
  const limit = searchParams.get("limit") || "20";

  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  try {
    const params = new URLSearchParams({ lat, lng, radius, limit });
    const res = await fetch(`${backendUrl}/api/v1/location/places?${params.toString()}`, {
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Fallback
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);

  return NextResponse.json([
    {
      id: "poi-1",
      name: "Regional Cargo Superhub & EV Fast Charge",
      category: "commercial.transportation",
      latitude: latNum + 0.005,
      longitude: lngNum + 0.005,
      formatted_address: "Zone 4 Logistics Parkway",
      distance_meters: 840,
    },
    {
      id: "poi-2",
      name: "Interstate Freight Crossdock Terminal",
      category: "service.railway",
      latitude: latNum - 0.008,
      longitude: lngNum - 0.006,
      formatted_address: "Central Terminal Loop",
      distance_meters: 1260,
    },
  ]);
}
