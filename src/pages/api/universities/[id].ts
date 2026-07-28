import type { APIRoute } from 'astro';

export const prerender = false;

export const PUT: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { id } = context.params;
  const body = await context.request.json();
  const { country, name, logo_url, sort_order, active } = body || {};

  await db.prepare(
    `UPDATE universities SET
      country = COALESCE(?, country),
      name = COALESCE(?, name),
      logo_url = COALESCE(?, logo_url),
      sort_order = COALESCE(?, sort_order),
      active = COALESCE(?, active)
     WHERE id = ?`
  ).bind(country ?? null, name ?? null, logo_url ?? null, sort_order ?? null, active ?? null, id).run();

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { id } = context.params;
  await db.prepare('DELETE FROM universities WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
