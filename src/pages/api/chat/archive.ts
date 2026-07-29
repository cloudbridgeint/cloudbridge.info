import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const user = (context.locals as any).user;
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const db = (context.locals as any).runtime.env.DB;
  const body = await context.request.json().catch(() => ({}));
  const { session_id, status } = body || {};

  if (!session_id || !['open', 'archived'].includes(status)) {
    return new Response(JSON.stringify({ error: 'session_id and a valid status are required' }), { status: 400 });
  }

  await db.prepare('UPDATE chat_sessions SET status = ? WHERE session_id = ?').bind(status, session_id).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
