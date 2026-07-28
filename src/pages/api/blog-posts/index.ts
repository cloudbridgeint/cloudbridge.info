import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { results } = await db.prepare('SELECT * FROM blog_posts ORDER BY created_at DESC').all();
  return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { slug, title, description, hero_image, body, category, published = 0 } = await context.request.json();
  if (!slug || !title) {
    return new Response(JSON.stringify({ error: 'slug and title required' }), { status: 400 });
  }
  try {
    const result = await db.prepare(
      `INSERT INTO blog_posts (slug, title, description, hero_image, body, category, published, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(slug, title, description || '', hero_image || null, body || '', category || null, published ? 1 : 0).run();
    return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Insert failed (slug may already exist)' }), { status: 400 });
  }
};
