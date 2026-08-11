import type { APIRoute } from 'astro';
import { clientIp, rateLimit, tooMany } from '../../lib/guards';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;

  // Public form endpoint — without a cap one script can flood the leads table.
  // The limit is generous enough that a real applicant retrying, or a family
  // sharing one connection, will never hit it.
  const ip = clientIp(context.request);
  const gate = await rateLimit(db, 'leads', ip, 20, 60);
  if (!gate.allowed) return tooMany(gate.retryAfterMinutes);

  const body = await context.request.json().catch(() => ({}));
  const {
    name, email, phone, message, source_page,
    utm_source, utm_medium, utm_campaign,
    residence_country, destination_country, degree_level, subject_interested, english_test, test_score,
    dob, gender, nationality, address, institute_name, course_studied, graduation_year,
    preferred_study_level, intake_month, intake_year, residence_city,
    doc_academic_cert, doc_transcript, doc_english_cert, doc_cv, doc_personal_statement,
  } = body || {};

  // Cap field lengths: nothing legitimate needs more, and it stops a single
  // request writing an unbounded amount into the row.
  const cap = (v: unknown, n = 300) => String(v ?? '').slice(0, n);

  const cf = (context.request as any).cf || {};
  const referrer = context.request.headers.get('referer') || '';

  await db.prepare(
    `INSERT INTO leads
      (name, email, phone, message, source_page, utm_source, utm_medium, utm_campaign, referrer, country, city, ip, status,
       residence_country, destination_country, degree_level, subject_interested, english_test, test_score,
       dob, gender, nationality, address, institute_name, course_studied, graduation_year,
       preferred_study_level, intake_month, intake_year, residence_city,
       doc_academic_cert, doc_transcript, doc_english_cert, doc_cv, doc_personal_statement)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    cap(name, 200), cap(email, 200), cap(phone, 50), cap(message, 5000), cap(source_page, 100),
    cap(utm_source, 200), cap(utm_medium, 200), cap(utm_campaign, 200), cap(referrer, 500),
    cap(cf.country, 10), cap(cf.city, 100), cap(ip, 60),
    cap(residence_country, 100), cap(destination_country, 500), cap(degree_level, 100),
    cap(subject_interested, 200), cap(english_test, 100), cap(test_score, 50),
    cap(dob, 40), cap(gender, 40), cap(nationality, 100), cap(address, 500),
    cap(institute_name, 200), cap(course_studied, 200), cap(graduation_year, 40),
    cap(preferred_study_level, 100), cap(intake_month, 40), cap(intake_year, 20),
    cap(residence_city, 100),
    cap(doc_academic_cert, 300), cap(doc_transcript, 300), cap(doc_english_cert, 300),
    cap(doc_cv, 300), cap(doc_personal_statement, 300)
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
