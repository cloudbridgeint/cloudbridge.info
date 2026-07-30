import type { APIRoute } from 'astro';

export const prerender = false;

export const PUT: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { id } = context.params;
  const body = await context.request.json();
  const { name, university, country, city, level, subject, delivery, duration, logo, sort_order, active } = body || {};

  await db.prepare(
    `UPDATE courses SET
      name = COALESCE(?, name),
      university = COALESCE(?, university),
      country = COALESCE(?, country),
      city = COALESCE(?, city),
      level = COALESCE(?, level),
      subject = COALESCE(?, subject),
      delivery = COALESCE(?, delivery),
      duration = COALESCE(?, duration),
      logo = COALESCE(?, logo),
      sort_order = COALESCE(?, sort_order),
      active = COALESCE(?, active)
     WHERE id = ?`
  ).bind(
    name ?? null, university ?? null, country ?? null, city ?? null, level ?? null,
    subject ?? null, delivery ?? null, duration ?? null, logo ?? null,
    sort_order ?? null, active === undefined ? null : (active ? 1 : 0), id
  ).run();

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { id } = context.params;
  await db.prepare('DELETE FROM courses WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
