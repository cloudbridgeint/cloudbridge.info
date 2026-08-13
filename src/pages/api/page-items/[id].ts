import type { APIRoute } from 'astro';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const PUT: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { id } = context.params;
  let b: any;
  try {
    b = await context.request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  /* COALESCE so a screen that only sends the fields it edited cannot blank the
     rest of the row. group_key is deliberately not updatable — moving a row
     between lists is a delete and a re-add. */
  await db.prepare(
    `UPDATE page_items SET
       title      = COALESCE(?, title),
       subtitle   = COALESCE(?, subtitle),
       body       = COALESCE(?, body),
       icon       = COALESCE(?, icon),
       image      = COALESCE(?, image),
       link_url   = COALESCE(?, link_url),
       link_label = COALESCE(?, link_label),
       accent     = COALESCE(?, accent),
       sort_order = COALESCE(?, sort_order),
       active     = COALESCE(?, active)
     WHERE id = ?`
  ).bind(
    b.title ?? null, b.subtitle ?? null, b.body ?? null,
    b.icon ?? null, b.image ?? null,
    b.link_url ?? null, b.link_label ?? null, b.accent ?? null,
    b.sort_order ?? null, b.active ?? null,
    id
  ).run();

  return json({ success: true });
};

export const DELETE: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { id } = context.params;
  await db.prepare('DELETE FROM page_items WHERE id = ?').bind(id).run();
  return json({ success: true });
};
