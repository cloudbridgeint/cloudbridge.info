import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const user = (context.locals as any).user;
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const db = (context.locals as any).runtime.env.DB;
  const { results } = await db.prepare(
    `SELECT session_id, name, email, phone, source_page, country, city, status,
            last_message, last_sender, unread_admin, created_at, updated_at
     FROM chat_sessions ORDER BY updated_at DESC LIMIT 100`
  ).all();

  return new Response(JSON.stringify({ sessions: results }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
