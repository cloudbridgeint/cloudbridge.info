import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { results } = await db.prepare(
    'SELECT * FROM universities ORDER BY country ASC, sort_order ASC, id ASC'
  ).all();
  return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const body = await context.request.json();
  const { country, name, logo_url, sort_order = 0 } = body || {};
  if (!country || !name) {
    return new Response(JSON.stringify({ error: 'country and name are required' }), { status: 400 });
  }
  const result = await db.prepare(
    'INSERT INTO universities (country, name, logo_url, sort_order, active) VALUES (?, ?, ?, ?, 1)'
  ).bind(country, name, logo_url || null, sort_order).run();
  return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
