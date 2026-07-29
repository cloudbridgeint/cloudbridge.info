import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const body = await context.request.json().catch(() => ({}));
  const { session_id, message, name, email, phone } = body || {};

  if (!session_id || !message || !String(message).trim()) {
    return new Response(JSON.stringify({ error: 'session_id and message are required' }), { status: 400 });
  }

  const cf = (context.request as any).cf || {};
  const referrer = context.request.headers.get('referer') || '';
  let sourcePage = '';
  try { sourcePage = new URL(referrer).pathname; } catch { sourcePage = ''; }

  // Upsert the session
  const existing = await db.prepare('SELECT session_id FROM chat_sessions WHERE session_id = ?').bind(session_id).first();
  if (existing) {
    await db.prepare(
      `UPDATE chat_sessions SET last_message = ?, last_sender = 'user', unread_admin = 1, updated_at = CURRENT_TIMESTAMP,
        name = CASE WHEN ? != '' THEN ? ELSE name END,
        email = CASE WHEN ? != '' THEN ? ELSE email END,
        phone = CASE WHEN ? != '' THEN ? ELSE phone END
       WHERE session_id = ?`
    ).bind(
      String(message).slice(0, 200),
      name || '', name || '',
      email || '', email || '',
      phone || '', phone || '',
      session_id
    ).run();
  } else {
    await db.prepare(
      `INSERT INTO chat_sessions (session_id, name, email, phone, source_page, country, city, last_message, last_sender, unread_admin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'user', 1)`
    ).bind(
      session_id, name || '', email || '', phone || '', sourcePage, cf.country || '', cf.city || '',
      String(message).slice(0, 200)
    ).run();
  }

  await db.prepare(
    `INSERT INTO chat_messages (session_id, sender, message) VALUES (?, 'user', ?)`
  ).bind(session_id, message).run();

  return new Response(JSON.stringify({ success: true }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
