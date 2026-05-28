import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { subscribe, sessionChannel } from '@/lib/events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = await getSessionFromRequest(req);
  if (!auth || auth.role !== 'admin') {
    return new Response('Unauthorized', { status: 401 });
  }
  const sid = Number(req.nextUrl.searchParams.get('sessionId'));
  if (!sid) return new Response('sessionId required', { status: 400 });

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const send = (payload: any) => {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };
      send({ type: 'hello', sessionId: sid });

      const unsub = subscribe(sessionChannel(sid), send);

      const ping = setInterval(() => {
        try { controller.enqueue(enc.encode(`: ping\n\n`)); } catch { /* */ }
      }, 15000);

      const close = () => {
        clearInterval(ping);
        unsub();
        try { controller.close(); } catch { /* */ }
      };

      // @ts-expect-error - signal exists on req
      req.signal?.addEventListener?.('abort', close);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}
