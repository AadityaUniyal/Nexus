import { NextResponse } from 'next/server';
import { INITIAL_EVENTS } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial events
      INITIAL_EVENTS.forEach((evt) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(evt)}\n\n`));
      });

      // Send periodic heartbeat / synthetic event
      const interval = setInterval(() => {
        const pingEvent = {
          id: `evt-ping-${Date.now()}`,
          type: 'telemetry.heartbeat',
          workspaceId: 'ws-continental',
          entityType: 'GATEWAY',
          entityId: 'primary-stream',
          payload: { timestamp: new Date().toISOString(), status: 'nominal' },
          severity: 'INFO',
          occurredAt: new Date().toISOString(),
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(pingEvent)}\n\n`));
      }, 15000);

      return () => clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
