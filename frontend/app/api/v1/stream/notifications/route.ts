import { NextResponse } from 'next/server';
import { INITIAL_NOTIFICATIONS } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      INITIAL_NOTIFICATIONS.forEach((n) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(n)}\n\n`));
      });

      const interval = setInterval(() => {
        const ping = {
          id: `notif-hb-${Date.now()}`,
          type: 'SYSTEM',
          title: 'Heartbeat',
          message: 'SSE channel nominal',
          createdAt: new Date().toISOString(),
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(ping)}\n\n`));
      }, 20000);

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
