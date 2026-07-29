import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const user = (context.locals as any).user;
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const db = (context.locals as any).runtime.env.DB;
  const row = await db.prepare(
    `SELECT COUNT(*) as n FROM chat_sessions WHERE unread_admin = 1`
  ).first();

  const latest = await db.prepare(
    `SELECT MAX(id) as max_id FROM chat_messages WHERE sender = 'user'`
  ).first();

  return new Response(JSON.stringify({ unread: (row as any)?.n ?? 0, latest_user_message_id: (latest as any)?.max_id ?? 0 }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
