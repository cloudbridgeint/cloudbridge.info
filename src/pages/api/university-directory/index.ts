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
  } = body || {};
  if (!name || !country) {
    return new Response(JSON.stringify({ error: 'name and country are required' }), { status: 400 });
  }
  const result = await db.prepare(
    `INSERT INTO university_directory
      (name, country, city, fee_min, fee_max, intake, intake_year, scholarship, ranking, faculty, study_level, logo, cover_image, sort_order, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
  ).bind(
    name, country, city || '', fee_min, fee_max, intake || '', intake_year || '',
    scholarship ? 1 : 0, ranking || '', faculty || '', study_level || '',
    logo || '', cover_image || '', sort_order
  ).run();
  return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
