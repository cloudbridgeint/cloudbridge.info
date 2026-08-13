import type { APIRoute } from 'astro';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/* An apply link is rendered as an anchor on a public page, so only http(s) is
   accepted — javascript: and data: URLs are stripped rather than published. */
export function safeUrl(raw: unknown): string {
  const v = String(raw ?? '').trim();
  if (!v) return '';
  if (v.startsWith('/')) return v;
  return /^https?:\/\//i.test(v) ? v : '';
}

export const GET: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { results } = await db.prepare(
    'SELECT * FROM scholarships ORDER BY featured DESC, sort_order ASC, id ASC'
  ).all();
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

  if (!String(b.name || '').trim()) return json({ error: 'Scholarship name is required' }, 400);

  const last = await db.prepare('SELECT MAX(sort_order) AS m FROM scholarships').first();

  const res = await db.prepare(
    `INSERT INTO scholarships
      (name, provider, country, level, amount, coverage, deadline, eligibility,
       description, apply_url, logo, featured, sort_order, active)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    String(b.name).trim(), String(b.provider ?? ''), String(b.country ?? ''),
    String(b.level ?? ''), String(b.amount ?? ''), String(b.coverage ?? ''),
    String(b.deadline ?? ''), String(b.eligibility ?? ''), String(b.description ?? ''),
    safeUrl(b.apply_url), String(b.logo ?? ''),
    b.featured ? 1 : 0,
    b.sort_order ?? Number(last?.m ?? 0) + 10,
    b.active === 0 ? 0 : 1
  ).run();

  return json({ success: true, id: res.meta.last_row_id }, 201);
};
