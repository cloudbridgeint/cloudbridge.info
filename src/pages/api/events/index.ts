import type { APIRoute } from 'astro';
import { eventSlug } from '../../../lib/content';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { results } = await db.prepare('SELECT * FROM events ORDER BY event_date ASC').all();
  return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { title, description, image, event_date, event_time, location, published = 1 } = await context.request.json();
  if (!title) {
    return new Response(JSON.stringify({ error: 'title required' }), { status: 400 });
  }
  const result = await db.prepare(
    `INSERT INTO events (title, description, image, event_date, event_time, location, published, slug) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(title, description || '', image || null, event_date || null, event_time || '', location || '', published ? 1 : 0, eventSlug(title)).run();
  return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
