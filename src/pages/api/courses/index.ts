import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { results } = await db.prepare(
    'SELECT * FROM courses WHERE active = 1 ORDER BY sort_order ASC, id ASC'
  ).all();
  return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const body = await context.request.json();
  const { name, university, country, city, level, subject, delivery, duration, logo, sort_order = 0 } = body || {};
  if (!name) {
    return new Response(JSON.stringify({ error: 'name is required' }), { status: 400 });
  }
  const result = await db.prepare(
    `INSERT INTO courses (name, university, country, city, level, subject, delivery, duration, logo, sort_order, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
  ).bind(
    name, university || '', country || '', city || '', level || '', subject || '',
    delivery || '', duration || '', logo || '', sort_order
  ).run();
  return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
