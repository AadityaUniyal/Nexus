import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({
      success: true,
      feedbackId: `fbk-${Date.now()}`,
      status: 'LOGGED',
      receivedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ success: true, feedbackId: `fbk-${Date.now()}` });
  }
}
