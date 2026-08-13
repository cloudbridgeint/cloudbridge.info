import type { APIRoute } from 'astro';

export const prerender = false;

/* Only these lists can be written through this endpoint. Without the allowlist
   a caller could invent a group key and fill the table with rows no screen
   ever shows and nobody can find to delete. */
const ALLOWED_GROUPS = new Set([
  'about.skills',
  'about.reasons',
  'about.history',
  'scholarship.types',
  'scholarship.steps',
  'scholarship.destinations',
  'scholarship.faqs',
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const GET: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const group = context.url.searchParams.get('group');
  const stmt = group
    ? db.prepare('SELECT * FROM page_items WHERE group_key = ? ORDER BY sort_order ASC, id ASC').bind(group)
    : db.prepare('SELECT * FROM page_items ORDER BY group_key ASC, sort_order ASC, id ASC');
  const { results } = await stmt.all();
  return json(results || []);
};

export const POST: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  let b: any;
  try {
    b = await context.request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const group = String(b.group_key || '').trim();
  if (!ALLOWED_GROUPS.has(group)) return json({ error: 'Unknown content group' }, 400);
  if (!String(b.title || '').trim() && !String(b.body || '').trim()) {
    return json({ error: 'Give the item a title or some text' }, 400);
  }

  /* New rows go to the end of their own list rather than to position 0, so
     adding one does not silently reshuffle what is already published. */
  const last = await db.prepare(
    'SELECT MAX(sort_order) AS m FROM page_items WHERE group_key = ?'
  ).bind(group).first();
  const sort = b.sort_order ?? (Number(last?.m ?? 0) + 10);

  const res = await db.prepare(
    `INSERT INTO page_items (group_key, title, subtitle, body, icon, image, link_url, link_label, accent, sort_order, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    group,
    String(b.title ?? ''), String(b.subtitle ?? ''), String(b.body ?? ''),
    String(b.icon ?? ''), String(b.image ?? ''),
    String(b.link_url ?? ''), String(b.link_label ?? ''), String(b.accent ?? ''),
    sort, b.active === 0 ? 0 : 1
  ).run();

  return json({ success: true, id: res.meta.last_row_id }, 201);
};
