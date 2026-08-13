import type { APIRoute } from 'astro';

export const prerender = false;

export const PUT: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { id } = context.params;
  const body = await context.request.json();
  const {
    name, country, city, fee_min, fee_max, intake, intake_year,
    scholarship, ranking, faculty, study_level, logo, cover_image, sort_order, active,
    slug, website, founded, overview, rankings_note, services, student_life,
    accommodation, source_url, last_verified_at,
  } = body || {};

/* A profile's address must stay unique and URL-safe: it is a published page. */
const cleanSlug = slug === undefined ? null : String(slug)
  .toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  await db.prepare(
    `UPDATE university_directory SET
      name = COALESCE(?, name),
      country = COALESCE(?, country),
      city = COALESCE(?, city),
      fee_min = COALESCE(?, fee_min),
      fee_max = COALESCE(?, fee_max),
      intake = COALESCE(?, intake),
      intake_year = COALESCE(?, intake_year),
      scholarship = COALESCE(?, scholarship),
      ranking = COALESCE(?, ranking),
      faculty = COALESCE(?, faculty),
      study_level = COALESCE(?, study_level),
      logo = COALESCE(?, logo),
      cover_image = COALESCE(?, cover_image),
      sort_order = COALESCE(?, sort_order),
      active = COALESCE(?, active),
      slug = COALESCE(?, slug),
      website = COALESCE(?, website),
      founded = COALESCE(?, founded),
      overview = COALESCE(?, overview),
      rankings_note = COALESCE(?, rankings_note),
      services = COALESCE(?, services),
      student_life = COALESCE(?, student_life),
      accommodation = COALESCE(?, accommodation),
      source_url = COALESCE(?, source_url),
      last_verified_at = COALESCE(?, last_verified_at)
     WHERE id = ?`
  ).bind(
    name ?? null, country ?? null, city ?? null,
    fee_min === undefined ? null : fee_min, fee_max === undefined ? null : fee_max,
    intake ?? null, intake_year ?? null,
    scholarship === undefined ? null : (scholarship ? 1 : 0),
    ranking ?? null, faculty ?? null, study_level ?? null,
    logo ?? null, cover_image ?? null, sort_order ?? null,
    active === undefined ? null : (active ? 1 : 0),
    cleanSlug, website ?? null, founded ?? null, overview ?? null,
    rankings_note ?? null, services ?? null, student_life ?? null,
    accommodation ?? null, source_url ?? null, last_verified_at ?? null,
    id
  ).run();

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { id } = context.params;
  await db.prepare('DELETE FROM university_directory WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
