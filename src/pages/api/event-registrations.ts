import type { APIRoute } from 'astro';
import { clientIp, rateLimit, tooMany } from '../../lib/guards';

export const prerender = false;

const BRANCHES = ['Dhaka', 'Sylhet', 'Online'];

export const POST: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;

  // Public endpoint, so the same brake the other visitor-facing forms use.
  const ip = clientIp(context.request);
  const gate = await rateLimit(db, 'event-registration', ip, 20, 60);
  if (!gate.allowed) return tooMany(gate.retryAfterMinutes);

  const body = await context.request.json().catch(() => ({} as any));
  const { event_id, name, phone, email, city, branch } = body || {};

  if (!name || !String(name).trim()) {
    return new Response(JSON.stringify({ error: 'Name is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!phone || !String(phone).trim()) {
    return new Response(JSON.stringify({ error: 'Phone number is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  // The event title is looked up server-side rather than taken from the form,
  // so a registration can't be filed against an event that doesn't exist or
  // under a title the visitor supplied.
  let eventTitle = '';
  let eventDate = '';
  const eventId = Number(event_id);
  if (Number.isFinite(eventId) && eventId > 0) {
    const row = await db.prepare('SELECT title, event_date FROM events WHERE id = ? AND published = 1')
      .bind(eventId).first();
    if (!row) {
      return new Response(JSON.stringify({ error: 'That event is no longer available.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    eventTitle = String(row.title || '');
    eventDate = String(row.event_date || '');
  }

  const cap = (v: unknown, n: number) => String(v ?? '').trim().slice(0, n);
  const chosenBranch = BRANCHES.includes(String(branch)) ? String(branch) : cap(branch, 60);

  const cf = (context.request as any).cf || {};

  await db.prepare(
    `INSERT INTO event_registrations
      (event_id, event_title, event_date, name, phone, email, city, branch, status, country, geo_city, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)`
  ).bind(
    Number.isFinite(eventId) && eventId > 0 ? eventId : null,
    eventTitle, eventDate,
    cap(name, 150), cap(phone, 50), cap(email, 200), cap(city, 100), chosenBranch,
    cap(cf.country, 10), cap(cf.city, 100), cap(ip, 60)
  ).run();

  return new Response(JSON.stringify({ success: true, event: eventTitle }), {
    status: 201, headers: { 'Content-Type': 'application/json' },
  });
};

export const GET: APIRoute = async (context) => {
  const user = (context.locals as any).user;
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const db = (context.locals as any).runtime.env.DB;
  const { results } = await db
    .prepare('SELECT * FROM event_registrations ORDER BY created_at DESC LIMIT 500').all();
  return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
};
