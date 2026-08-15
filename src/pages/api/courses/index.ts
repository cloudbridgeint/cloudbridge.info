import type { APIRoute } from 'astro';
import { uniqueCourseSlug } from '../../../lib/content';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { results } = await db.prepare(
    'SELECT * FROM courses WHERE active = 1 ORDER BY sort_order ASC, id ASC'
  ).all();
  return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const body = await context.request.json();
  const { name, university, country, city, level, subject, delivery, duration, logo, sort_order = 0 } = body || {};
  if (!name) {
    return new Response(JSON.stringify({ error: 'name is required' }), { status: 400 });
  }
  // A course gets its slug at creation, not the first time someone opens the
  // content editor: without one it has no URL, and nothing can link to it.
  const slug = await uniqueCourseSlug(db, university || '', name);

  const result = await db.prepare(
    `INSERT INTO courses (name, university, country, city, level, subject, delivery, duration, logo, sort_order, active, slug)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
  ).bind(
    name, university || '', country || '', city || '', level || '', subject || '',
    delivery || '', duration || '', logo || '', sort_order, slug
  ).run();
  return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
