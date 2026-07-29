import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const user = (context.locals as any).user;
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const db = (context.locals as any).runtime.env.DB;
  const body = await context.request.json().catch(() => ({}));
  const { session_id, message } = body || {};

  if (!session_id || !message || !String(message).trim()) {
    return new Response(JSON.stringify({ error: 'session_id and message are required' }), { status: 400 });
  }

  await db.prepare(
    `INSERT INTO chat_messages (session_id, sender, message) VALUES (?, 'admin', ?)`
  ).bind(session_id, message).run();

  await db.prepare(
    `UPDATE chat_sessions SET last_message = ?, last_sender = 'admin', unread_user = 1, unread_admin = 0, updated_at = CURRENT_TIMESTAMP WHERE session_id = ?`
  ).bind(String(message).slice(0, 200), session_id).run();

  return new Response(JSON.stringify({ success: true }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
