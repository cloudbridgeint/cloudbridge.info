import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { results } = await db.prepare(
    'SELECT * FROM university_directory WHERE active = 1 ORDER BY sort_order ASC, id ASC'
  ).all();
  return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const body = await context.request.json();
  const {
    name, country, city, fee_min = 0, fee_max = 0, intake, intake_year,
    scholarship, ranking, faculty, study_level, logo, cover_image, sort_order = 0,
    slug, website, founded, overview, rankings_note, services, student_life,
    accommodation, source_url, last_verified_at,
    ranking_guardian, ranking_the, student_count, international_count, map_query,
    why_choose, entry_requirements, scholarships_info, facilities,
  } = body || {};
  if (!name || !country) {
    return new Response(JSON.stringify({ error: 'name and country are required' }), { status: 400 });
  }

  /* Every entry gets an address as soon as it exists, derived from the name
     when none is given — a profile link that goes nowhere is worse than a
     profile that is still empty. */
  const makeSlug = (v) => String(v || '')
    .toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  let finalSlug = makeSlug(slug || name);
  const clash = await db.prepare('SELECT id FROM university_directory WHERE slug = ?').bind(finalSlug).first();
  if (clash) finalSlug = `${finalSlug}-${Date.now().toString(36).slice(-4)}`;
  const result = await db.prepare(
    `INSERT INTO university_directory
      (name, country, city, fee_min, fee_max, intake, intake_year, scholarship, ranking, faculty, study_level, logo, cover_image, sort_order, active,
       slug, website, founded, overview, rankings_note, services, student_life, accommodation, source_url, last_verified_at,
       ranking_guardian, ranking_the, student_count, international_count, map_query, why_choose, entry_requirements, scholarships_info, facilities)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    name, country, city || '', fee_min, fee_max, intake || '', intake_year || '',
    scholarship ? 1 : 0, ranking || '', faculty || '', study_level || '',
    logo || '', cover_image || '', sort_order,
    finalSlug, website || '', founded || '', overview || '', rankings_note || '',
    services || '', student_life || '', accommodation || '', source_url || '',
    last_verified_at || '',
    ranking_guardian || '', ranking_the || '', student_count || '', international_count || '', map_query || '', why_choose || '', entry_requirements || '', scholarships_info || '', facilities || ''
  ).run();
  return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
