import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { results } = await db.prepare('SELECT * FROM faqs ORDER BY sort_order ASC, id ASC').all();
  return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { question, answer, sort_order = 0 } = await context.request.json();
  if (!question || !answer) {
    return new Response(JSON.stringify({ error: 'question and answer required' }), { status: 400 });
  }
  const result = await db.prepare(
    'INSERT INTO faqs (question, answer, sort_order, active) VALUES (?, ?, ?, 1)'
  ).bind(question, answer, sort_order).run();
  return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
