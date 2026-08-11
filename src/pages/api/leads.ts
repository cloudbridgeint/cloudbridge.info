import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const body = await context.request.json().catch(() => ({}));
  const {
    name, email, phone, message, source_page,
    utm_source, utm_medium, utm_campaign,
    residence_country, destination_country, degree_level, subject_interested, english_test, test_score,
    dob, gender, nationality, address, institute_name, course_studied, graduation_year,
    preferred_study_level, intake_month, intake_year, residence_city,
    doc_academic_cert, doc_transcript, doc_english_cert, doc_cv, doc_personal_statement,
  } = body || {};

  const cf = (context.request as any).cf || {};
  const referrer = context.request.headers.get('referer') || '';
  const ip = context.request.headers.get('cf-connecting-ip') || '';

  await db.prepare(
    `INSERT INTO leads
      (name, email, phone, message, source_page, utm_source, utm_medium, utm_campaign, referrer, country, city, ip, status,
       residence_country, destination_country, degree_level, subject_interested, english_test, test_score,
       dob, gender, nationality, address, institute_name, course_studied, graduation_year,
       preferred_study_level, intake_month, intake_year, residence_city,
       doc_academic_cert, doc_transcript, doc_english_cert, doc_cv, doc_personal_statement)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    name || '', email || '', phone || '', message || '', source_page || '',
    utm_source || '', utm_medium || '', utm_campaign || '', referrer,
    cf.country || '', cf.city || '', ip,
    residence_country || '', destination_country || '', degree_level || '', subject_interested || '', english_test || '', test_score || '',
    dob || '', gender || '', nationality || '', address || '', institute_name || '', course_studied || '', graduation_year || '',
    preferred_study_level || '', intake_month || '', intake_year || '', residence_city || '',
    doc_academic_cert || '', doc_transcript || '', doc_english_cert || '', doc_cv || '', doc_personal_statement || ''
  ).run();

  return new Response(JSON.stringify({ success: true }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const GET: APIRoute = async (context) => {
  // Protected by middleware (only /api/leads POST is public; GET for listing needs auth)
  const user = (context.locals as any).user;
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const db = (context.locals as any).runtime.env.DB;
  const { results } = await db.prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT 200').all();
  return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
};
