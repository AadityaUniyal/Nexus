import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const country = searchParams.get("country");
  const limit = searchParams.get("limit") || "5";

  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  try {
    const params = new URLSearchParams({ q, limit });
    if (country) params.append("country", country);

    const res = await fetch(`${backendUrl}/api/v1/location/autocomplete?${params.toString()}`, {
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Fallback deterministic items
  }

  const queryLower = q.toLowerCase();
  const mockSuggestions = [
    {
      id: "loc-dehradun",
      label: "Dehradun, Uttarakhand, India",
      secondary_label: "Uttarakhand, India",
      latitude: 30.3165,
      longitude: 78.0322,
      type: "city",
      country: "India",
      country_code: "in",
      state: "Uttarakhand",
      city: "Dehradun",
      confidence: 1.0,
    },
    {
      id: "loc-delhi",
      label: "New Delhi, Delhi, India",
      secondary_label: "Delhi, India",
      latitude: 28.6139,
      longitude: 77.2090,
      type: "city",
      country: "India",
      country_code: "in",
      state: "Delhi",
      city: "New Delhi",
      confidence: 1.0,
    },
    {
      id: "loc-tokyo",
      label: "Tokyo, Japan",
      secondary_label: "Kanto, Japan",
      latitude: 35.6762,
      longitude: 139.6503,
      type: "city",
      country: "Japan",
      country_code: "jp",
      state: "Kanto",
      city: "Tokyo",
      confidence: 1.0,
    },
    {
      id: "loc-chicago",
      label: "Chicago, IL, United States",
      secondary_label: "Illinois, United States",
      latitude: 41.8781,
      longitude: -87.6298,
      type: "city",
      country: "United States",
      country_code: "us",
      state: "Illinois",
      city: "Chicago",
      confidence: 1.0,
    },
    {
      id: "loc-london",
      label: "London, Greater London, United Kingdom",
      secondary_label: "England, United Kingdom",
      latitude: 51.5074,
      longitude: -0.1278,
      type: "city",
      country: "United Kingdom",
      country_code: "gb",
      state: "England",
      city: "London",
      confidence: 1.0,
    },
  ];

  const filtered = mockSuggestions.filter(
    (s) =>
      s.label.toLowerCase().includes(queryLower) ||
      s.city.toLowerCase().includes(queryLower)
  );

  return NextResponse.json(
    filtered.length > 0
      ? filtered
      : [
          {
            id: `loc-${Date.now()}`,
            label: `${q.trim()}, Operational Territory`,
            secondary_label: "Regional Logistics Hub",
            latitude: 30.3165,
            longitude: 78.0322,
            type: "city",
            country: "Global",
            city: q.trim(),
            confidence: 0.9,
          },
        ]
  );
}
