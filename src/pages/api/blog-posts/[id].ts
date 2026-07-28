import type { APIRoute } from 'astro';

export const prerender = false;

export const PUT: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { id } = context.params;
  const { slug, title, description, hero_image, body, category, published } = await context.request.json();
  await db.prepare(
    `UPDATE blog_posts SET
      slug = COALESCE(?, slug),
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      hero_image = COALESCE(?, hero_image),
      body = COALESCE(?, body),
      category = COALESCE(?, category),
      published = COALESCE(?, published),
      updated_at = datetime('now')
     WHERE id = ?`
  ).bind(
    slug ?? null, title ?? null, description ?? null, hero_image ?? null,
    body ?? null, category ?? null, published === undefined ? null : (published ? 1 : 0), id
  ).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { id } = context.params;
  await db.prepare('DELETE FROM blog_posts WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
