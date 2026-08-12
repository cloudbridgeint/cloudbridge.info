import type { APIRoute } from 'astro';
import { hashPassword } from '../../../lib/auth';

export const prerender = false;

/*
 * Admin user management. The middleware blocks editors from /api/users
 * entirely, but the role is checked again here rather than assumed: one missed
 * entry in that path list would otherwise be an editor promoting themselves.
 */

export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 12;

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
  /* password_hash is deliberately never selected. It is a one-way PBKDF2 hash,
     so it could not be turned back into a password even if it were sent. */
  const { results } = await db.prepare(
    'SELECT id, email, username, name, role, avatar, created_at FROM admin_users ORDER BY id ASC'
  ).all();

  const users = results as any[];
  return json({
    users,
    me: (locals as any).user.email,
    counts: {
      admin: users.filter(u => u.role === 'admin').length,
      editor: users.filter(u => u.role === 'editor').length,
    },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const denied = requireAdmin(locals);
  if (denied) return denied;

  const db = (locals as any).runtime.env.DB;
  let body: any;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request body' }, 400); }

  const email = String(body?.email || '').trim().toLowerCase();
  const username = String(body?.username || '').trim().toLowerCase();
  const name = String(body?.name || '').trim().slice(0, 120) || null;
  const avatar = String(body?.avatar || '').trim() || null;
  const password = String(body?.password || '');
  const role = body?.role === 'editor' ? 'editor' : 'admin';

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: 'Enter a valid email address' }, 400);
  }
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return json({ error: 'Username must be 3-32 characters: letters, numbers, dot, dash or underscore' }, 400);
  }
  if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
    return json({ error: `Password must be between ${MIN_PASSWORD} and ${MAX_PASSWORD} characters` }, 400);
  }

  const clash = await db.prepare(
    'SELECT email, username FROM admin_users WHERE email = ? OR username = ?'
  ).bind(email, username).first();
  if (clash) {
    return json({
      error: clash.email === email ? 'An account with that email already exists' : 'That username is taken',
    }, 409);
  }

  const hash = await hashPassword(password);
  await db.prepare(
    'INSERT INTO admin_users (email, username, name, role, avatar, password_hash) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(email, username, name, role, avatar, hash).run();

  return json({ success: true });
};
