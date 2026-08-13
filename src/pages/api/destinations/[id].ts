import type { APIRoute } from 'astro';
import { normaliseSlug, toJsonList, toFaqJson } from './index';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const GET: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const row = await db.prepare('SELECT * FROM destinations WHERE id = ?').bind(context.params.id).first();
  if (!row) return json({ error: 'Not found' }, 404);
  return json(row);
};

export const PUT: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { id } = context.params;
  let b: any;
  try {
    b = await context.request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  /* Changing a slug changes a published URL and drops whatever search standing
     it has built, so it is allowed but never silent: the editor asks first, and
     a collision is refused here. */
  let slug: string | null = null;
  if (b.slug !== undefined) {
    slug = normaliseSlug(b.slug);
    if (!slug) return json({ error: 'The slug cannot be empty — it is the page URL' }, 400);
    const clash = await db.prepare(
      'SELECT id FROM destinations WHERE slug = ? AND id != ?'
    ).bind(slug, id).first();
    if (clash) return json({ error: `Another destination already uses /destinations/study-in-${slug}` }, 409);
  }

  await db.prepare(
    `UPDATE destinations SET
       slug           = COALESCE(?, slug),
       country        = COALESCE(?, country),
       short          = COALESCE(?, short),
       flag           = COALESCE(?, flag),
       tagline        = COALESCE(?, tagline),
       answer         = COALESCE(?, answer),
       intro          = COALESCE(?, intro),
       why            = COALESCE(?, why),
       tuition        = COALESCE(?, tuition),
       living         = COALESCE(?, living),
       currency       = COALESCE(?, currency),
       intakes        = COALESCE(?, intakes),
       work_rights    = COALESCE(?, work_rights),
       post_study     = COALESCE(?, post_study),
       english_req    = COALESCE(?, english_req),
       academic_req   = COALESCE(?, academic_req),
       visa_name      = COALESCE(?, visa_name),
       visa_steps     = COALESCE(?, visa_steps),
       scholarships   = COALESCE(?, scholarships),
       universities   = COALESCE(?, universities),
       official_label = COALESCE(?, official_label),
       official_url   = COALESCE(?, official_url),
       faqs           = COALESCE(?, faqs),
       card_image     = COALESCE(?, card_image),
       gradient       = COALESCE(?, gradient),
       sort_order     = COALESCE(?, sort_order),
       active         = COALESCE(?, active),
       updated_at     = datetime('now')
     WHERE id = ?`
  ).bind(
    slug,
    b.country ?? null, b.short ?? null, b.flag ?? null,
    b.tagline ?? null, b.answer ?? null, b.intro ?? null,
    b.why === undefined ? null : toJsonList(b.why),
    b.tuition ?? null, b.living ?? null, b.currency ?? null,
    b.intakes ?? null, b.work_rights ?? null, b.post_study ?? null,
    b.english_req ?? null, b.academic_req ?? null, b.visa_name ?? null,
    b.visa_steps === undefined ? null : toJsonList(b.visa_steps),
    b.scholarships === undefined ? null : toJsonList(b.scholarships),
    b.universities === undefined ? null : toJsonList(b.universities),
    b.official_label ?? null, b.official_url ?? null,
    b.faqs === undefined ? null : toFaqJson(b.faqs),
    b.card_image ?? null, b.gradient ?? null,
    b.sort_order ?? null, b.active ?? null,
    id
  ).run();

  return json({ success: true, slug: slug ?? undefined });
};

export const DELETE: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  await db.prepare('DELETE FROM destinations WHERE id = ?').bind(context.params.id).run();
  return json({ success: true });
};
