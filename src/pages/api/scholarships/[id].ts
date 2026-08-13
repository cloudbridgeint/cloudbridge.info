import type { APIRoute } from 'astro';
import { safeUrl } from './index';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const PUT: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { id } = context.params;
  let b: any;
  try {
    b = await context.request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  await db.prepare(
    `UPDATE scholarships SET
       name        = COALESCE(?, name),
       provider    = COALESCE(?, provider),
       country     = COALESCE(?, country),
       level       = COALESCE(?, level),
       amount      = COALESCE(?, amount),
       coverage    = COALESCE(?, coverage),
       deadline    = COALESCE(?, deadline),
       eligibility = COALESCE(?, eligibility),
       description = COALESCE(?, description),
       apply_url   = COALESCE(?, apply_url),
       logo        = COALESCE(?, logo),
       featured    = COALESCE(?, featured),
       sort_order  = COALESCE(?, sort_order),
       active      = COALESCE(?, active),
       updated_at  = datetime('now')
     WHERE id = ?`
  ).bind(
    b.name ?? null, b.provider ?? null, b.country ?? null, b.level ?? null,
    b.amount ?? null, b.coverage ?? null, b.deadline ?? null, b.eligibility ?? null,
    b.description ?? null,
    b.apply_url === undefined ? null : safeUrl(b.apply_url),
    b.logo ?? null,
    b.featured === undefined ? null : (b.featured ? 1 : 0),
    b.sort_order ?? null, b.active ?? null,
    id
  ).run();

  return json({ success: true });
};

export const DELETE: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  await db.prepare('DELETE FROM scholarships WHERE id = ?').bind(context.params.id).run();
  return json({ success: true });
};
