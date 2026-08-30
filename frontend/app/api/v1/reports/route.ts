import { NextResponse } from 'next/server';

const SAMPLE_REPORTS = [
  {
    id: 'rep-daily-1',
    title: 'Daily Continental Logistics Briefing',
    type: 'DAILY_BRIEFING',
    generatedAt: '2026-08-30T06:00:00Z',
    author: 'Sarah Chen',
    summary: 'Executive operational summary detailing fleet utilization, bottleneck resolutions, and 98.4% SLA compliance.',
    kpis: {
      slaCompliance: 98.4,
      throughput: 14200,
      activeVehicles: 30,
    },
  },
  {
    id: 'rep-fleet-1',
    title: 'Fleet Electrification & Energy Efficiency Audit',
    type: 'FLEET_PERFORMANCE',
    generatedAt: '2026-08-29T18:00:00Z',
    author: 'Marcus Vance',
    summary: 'Class-8 EV commercial transit efficiency and battery degradation metrics across mountain corridors.',
    kpis: {
      slaCompliance: 99.1,
      throughput: 8900,
      activeVehicles: 18,
    },
  },
];

export async function GET() {
  return NextResponse.json({
    reports: SAMPLE_REPORTS,
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const newReport = {
    id: `rep-${Date.now()}`,
    title: body.title || 'Custom Operational Summary',
    type: body.type || 'DAILY_BRIEFING',
    generatedAt: new Date().toISOString(),
    author: 'Sarah Chen',
    summary: 'Executive operational summary detailing fleet utilization and SLA metrics.',
    kpis: {
      slaCompliance: 98.4,
      throughput: 14200,
      activeVehicles: 30,
    },
  };

  return NextResponse.json({
    report: newReport,
  });
}
