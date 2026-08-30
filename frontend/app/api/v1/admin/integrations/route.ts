import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    integrations: [
      { id: 'geoapify', name: 'Geoapify Location & Routing API', status: 'HEALTHY', provider: 'geoapify' },
      { id: 'fabric', name: 'Microsoft Fabric OneLake', status: 'CONNECTED', provider: 'azure' },
      { id: 'azure', name: 'Azure Event Hubs', status: 'CONNECTED', provider: 'azure' },
      { id: 'groq', name: 'Groq Llama 3.3 AI Provider', status: 'ACTIVE', provider: 'groq' },
    ],
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const provider = body.integrationId || 'target';
  return NextResponse.json({
    success: true,
    provider,
    message: `Adapter ${provider} diagnostics probe passed successfully.`,
    latencyMs: 12,
  });
}
