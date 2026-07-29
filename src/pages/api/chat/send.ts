import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const body = await context.request.json().catch(() => ({}));
  const { session_id, message, name, email, phone, attachment_url, attachment_type, attachment_name } = body || {};

  if (!session_id || (!message || !String(message).trim()) && !attachment_url) {
    return new Response(JSON.stringify({ error: 'session_id and message (or attachment) are required' }), { status: 400 });
  }

  const cf = (context.request as any).cf || {};
  const referrer = context.request.headers.get('referer') || '';
  let sourcePage = '';
  try { sourcePage = new URL(referrer).pathname; } catch { sourcePage = ''; }

  const displayText = (message && String(message).trim())
    ? String(message)
    : (attachment_type === 'audio' ? '🎤 Voice message' : attachment_type === 'image' ? '📷 Photo' : '📎 Attachment');

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
      displayText.slice(0, 200),
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
      displayText.slice(0, 200)
    ).run();
  }

  const insertResult = await db.prepare(
    `INSERT INTO chat_messages (session_id, sender, message, attachment_url, attachment_type, attachment_name) VALUES (?, 'user', ?, ?, ?, ?)`
  ).bind(session_id, message || '', attachment_url || '', attachment_type || '', attachment_name || '').run();

  const newId = insertResult?.meta?.last_row_id;

  return new Response(JSON.stringify({ success: true, id: newId }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
