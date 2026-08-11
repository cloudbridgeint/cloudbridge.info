import type { APIRoute } from 'astro';
import { eventSlug } from '../../../lib/content';

export const prerender = false;

export const PUT: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { id } = context.params;
  const { title, description, image, event_date, event_time, location, published } = await context.request.json();
  await db.prepare(
    `UPDATE events SET
      title = COALESCE(?, title),
      -- a recurring event keeps its slug, so the URL and its search ranking
      -- survive every time the date is moved forward
      slug = COALESCE(?, slug),
      description = COALESCE(?, description),
      image = COALESCE(?, image),
      event_date = COALESCE(?, event_date),
      event_time = COALESCE(?, event_time),
      location = COALESCE(?, location),
      published = COALESCE(?, published)
     WHERE id = ?`
  ).bind(title ?? null, title ? eventSlug(title) : null, description ?? null, image ?? null, event_date ?? null, event_time ?? null, location ?? null,
    published === undefined ? null : (published ? 1 : 0), id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { id } = context.params;
  await db.prepare('DELETE FROM events WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
