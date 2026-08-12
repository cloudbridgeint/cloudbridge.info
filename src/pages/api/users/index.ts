import type { APIRoute } from 'astro';
import { hashPassword } from '../../../lib/auth';

export const prerender = false;

/*
 * Admin user management. The middleware already blocks editors from /api/users
 * entirely, so anything arriving here is an admin session — but the role is
 * checked again below rather than assumed, because a single missed entry in
 * that list would otherwise hand an editor the ability to promote themselves.
 */

const MIN_PASSWORD = 12;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function requireAdmin(locals: any) {
  const user = locals?.user;
  if (!user) return json({ error: 'Unauthorized' }, 401);
  if (user.role !== 'admin') return json({ error: 'Admins only' }, 403);
  return null;
}

export const GET: APIRoute = async ({ locals }) => {
  const denied = requireAdmin(locals);
  if (denied) return denied;

  const db = (locals as any).runtime.env.DB;
  const { results } = await db.prepare(
    'SELECT id, email, name, role, created_at FROM admin_users ORDER BY id ASC'
  ).all();
  return json({ users: results, me: (locals as any).user.email });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const denied = requireAdmin(locals);
  if (denied) return denied;

  const db = (locals as any).runtime.env.DB;
  let body: any;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request body' }, 400); }

  const email = String(body?.email || '').trim().toLowerCase();
  const name = String(body?.name || '').trim().slice(0, 120) || null;
  const password = String(body?.password || '');
  const role = body?.role === 'editor' ? 'editor' : 'admin';

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: 'Enter a valid email address' }, 400);
  }
  if (password.length < MIN_PASSWORD) {
    return json({ error: `Password must be at least ${MIN_PASSWORD} characters` }, 400);
  }

  const existing = await db.prepare('SELECT id FROM admin_users WHERE email = ?').bind(email).first();
  if (existing) return json({ error: 'An account with that email already exists' }, 409);

  const hash = await hashPassword(password);
  await db.prepare('INSERT INTO admin_users (email, name, role, password_hash) VALUES (?, ?, ?, ?)')
    .bind(email, name, role, hash).run();

  return json({ success: true });
};
