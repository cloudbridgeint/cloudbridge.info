import type { APIRoute } from 'astro';
import { slugify, uniqueCourseSlug } from '../../../lib/content';

export const prerender = false;

/* The metadata a course has always had, plus the profile content that gives it
   a page. Every one is written through COALESCE, so a request that sends only
   the fields it changed leaves the rest alone — the list screen saves eight
   fields, the content editor saves sixteen, and neither wipes the other's. */
const FIELDS = [
  'name', 'university', 'country', 'city', 'level', 'subject', 'delivery', 'duration',
  'logo', 'sort_order', 'active',
  'slug', 'credential', 'overview', 'entry_requirements', 'english_requirements',
  'tuition_fee', 'tuition_note', 'scholarships_info', 'intakes', 'modules', 'careers',
  'how_to_apply', 'faq', 'source_url', 'last_verified_at', 'published',
] as const;

const BOOLEAN_FIELDS = new Set(['active', 'published']);

export const PUT: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { id } = context.params;
  const body = (await context.request.json()) || {};

  const current = await db.prepare('SELECT * FROM courses WHERE id = ?').bind(id).first();
  if (!current) {
    return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });
  }

  /* A course must always have a slug, because the slug is half its URL. If the
     editor sends a blank one, derive it from the name — and keep it unique
     within the university, which is what the index on (university, slug)
     enforces anyway. */
  const patch: Record<string, unknown> = { ...body };
  if (patch.slug !== undefined) {
    const wanted = slugify(String(patch.slug || '')) || slugify(String(patch.name || current.name));
    patch.slug = wanted === current.slug
      ? wanted
      : await uniqueCourseSlug(db, String(patch.university || current.university), wanted, Number(id));
  }

  /* Whether a course has a page is not a switch someone has to remember to
     flip. It follows from whether the page has anything on it: a counsellor
     writes the three things a student came for, saves, and the page exists.
     Delete the text and it stops existing.

     This is the whole publishing model. There is no draft state to explain,
     and — the reason it is computed here rather than trusted from the form —
     no way to put an empty page on the site by accident. Eighty near-identical
     stubs would cost the whole domain, not only the stub URLs. */
  const after = { ...current, ...patch };
  const filled = (v: unknown) => String(v ?? '').trim().length > 0;
  patch.published =
    String(after.overview ?? '').trim().length > 150 &&
    filled(after.entry_requirements) &&
    filled(after.tuition_fee) ? 1 : 0;

  const sets = FIELDS.map(f => `${f} = COALESCE(?, ${f})`).join(', ');
  const values = FIELDS.map(f => {
    const v = patch[f];
    if (v === undefined) return null;
    if (BOOLEAN_FIELDS.has(f)) return v ? 1 : 0;
    return v;
  });

  await db.prepare(`UPDATE courses SET ${sets} WHERE id = ?`).bind(...values, id).run();

  const row = await db.prepare('SELECT * FROM courses WHERE id = ?').bind(id).first();
  return new Response(JSON.stringify({ success: true, course: row }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { id } = context.params;
  await db.prepare('DELETE FROM courses WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
