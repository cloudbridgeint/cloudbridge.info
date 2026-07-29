import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const user = (context.locals as any).user;
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const db = (context.locals as any).runtime.env.DB;
  const sessionId = context.url.searchParams.get('session_id');
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'session_id is required' }), { status: 400 });
  }

  const [{ results: messages }, session] = await Promise.all([
    db.prepare('SELECT id, sender, message, attachment_url, attachment_type, attachment_name, created_at FROM chat_messages WHERE session_id = ? ORDER BY id ASC LIMIT 300').bind(sessionId).all(),
    db.prepare('SELECT * FROM chat_sessions WHERE session_id = ?').bind(sessionId).first(),
  ]);

  await db.prepare('UPDATE chat_sessions SET unread_admin = 0 WHERE session_id = ?').bind(sessionId).run();

  return new Response(JSON.stringify({ messages, session }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
