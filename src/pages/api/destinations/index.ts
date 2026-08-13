import type { APIRoute } from 'astro';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** A destination's slug is its public URL, so it is restricted to the
 *  characters that can appear in one and normalised rather than rejected. */
export function normaliseSlug(raw: string): string {
  return String(raw || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Arrays arrive from the editor as arrays; a textarea may send a string with
 *  one entry per line. Both end up as JSON text in one column. */
export function toJsonList(value: unknown): string {
  if (Array.isArray(value)) {
    return JSON.stringify(value.map(v => String(v)).map(s => s.trim()).filter(Boolean));
  }
  if (typeof value === 'string') {
    return JSON.stringify(value.split(/\r?\n/).map(s => s.trim()).filter(Boolean));
  }
  return '[]';
}

/** FAQ pairs, dropping any entry missing a question or an answer — an empty
 *  accordion row would publish as a blank line on the page. */
export function toFaqJson(value: unknown): string {
  if (!Array.isArray(value)) return '[]';
  const rows = value
    .map((f: any) => ({ q: String(f?.q ?? '').trim(), a: String(f?.a ?? '').trim() }))
    .filter(f => f.q && f.a);
  return JSON.stringify(rows);
}

export const GET: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { results } = await db.prepare(
    'SELECT * FROM destinations ORDER BY sort_order ASC, id ASC'
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

  const slug = normaliseSlug(b.slug || b.short || b.country);
  if (!slug) return json({ error: 'A slug is required — it becomes the page URL' }, 400);
  if (!String(b.country || '').trim()) return json({ error: 'Country name is required' }, 400);
  if (!String(b.short || '').trim()) return json({ error: 'Short name is required' }, 400);

  const clash = await db.prepare('SELECT id FROM destinations WHERE slug = ?').bind(slug).first();
  if (clash) return json({ error: `A destination already uses the URL /destinations/study-in-${slug}` }, 409);

  const last = await db.prepare('SELECT MAX(sort_order) AS m FROM destinations').first();

  const res = await db.prepare(
    `INSERT INTO destinations
      (slug, country, short, flag, tagline, answer, intro, why, tuition, living, currency,
       intakes, work_rights, post_study, english_req, academic_req, visa_name, visa_steps,
       scholarships, universities, official_label, official_url, faqs, card_image, gradient,
       sort_order, active)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    slug,
    String(b.country).trim(), String(b.short).trim(), String(b.flag ?? ''),
    String(b.tagline ?? ''), String(b.answer ?? ''), String(b.intro ?? ''),
    toJsonList(b.why),
    String(b.tuition ?? ''), String(b.living ?? ''), String(b.currency ?? ''),
    String(b.intakes ?? ''), String(b.work_rights ?? ''), String(b.post_study ?? ''),
    String(b.english_req ?? ''), String(b.academic_req ?? ''), String(b.visa_name ?? ''),
    toJsonList(b.visa_steps), toJsonList(b.scholarships), toJsonList(b.universities),
    String(b.official_label ?? ''), String(b.official_url ?? ''),
    toFaqJson(b.faqs),
    String(b.card_image ?? ''), String(b.gradient ?? ''),
    b.sort_order ?? Number(last?.m ?? 0) + 10,
    b.active === 0 ? 0 : 1
  ).run();

  return json({ success: true, id: res.meta.last_row_id, slug }, 201);
};
