import type { APIRoute } from 'astro';

export const prerender = false;

export const PUT: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { id } = context.params;
  const { question, answer, sort_order, active } = await context.request.json();
  await db.prepare(
    `UPDATE faqs SET
      question = COALESCE(?, question),
      answer = COALESCE(?, answer),
      sort_order = COALESCE(?, sort_order),
      active = COALESCE(?, active)
     WHERE id = ?`
  ).bind(question ?? null, answer ?? null, sort_order ?? null, active ?? null, id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { id } = context.params;
  await db.prepare('DELETE FROM faqs WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
