import type { APIRoute } from 'astro';

export const prerender = false;

export const PUT: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { id } = context.params;
  const { title, description, image, event_date, location, published } = await context.request.json();
  await db.prepare(
    `UPDATE events SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      image = COALESCE(?, image),
      event_date = COALESCE(?, event_date),
      location = COALESCE(?, location),
      published = COALESCE(?, published)
     WHERE id = ?`
  ).bind(title ?? null, description ?? null, image ?? null, event_date ?? null, location ?? null,
    published === undefined ? null : (published ? 1 : 0), id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { id } = context.params;
  await db.prepare('DELETE FROM events WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
