import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const sessionId = context.url.searchParams.get('session_id');
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'session_id is required' }), { status: 400 });
  }

  const { results } = await db.prepare(
    'SELECT id, sender, message, created_at FROM chat_messages WHERE session_id = ? ORDER BY id ASC LIMIT 200'
  ).bind(sessionId).all();

  // Viewing clears the "admin replied, user hasn't seen" flag
  await db.prepare('UPDATE chat_sessions SET unread_user = 0 WHERE session_id = ?').bind(sessionId).run();

  return new Response(JSON.stringify({ messages: results }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
