import type { APIRoute } from 'astro';
import { hashPassword } from '../../../lib/auth';

export const prerender = false;

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 12;

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

/* Guard against an account that can log in but change nothing: if the last
   admin is demoted or deleted, Settings becomes unreachable for everyone and
   only a direct database edit can undo it. */
async function otherAdminsExist(db: any, excludeId: number): Promise<boolean> {
  const row = await db.prepare(
    "SELECT COUNT(*) AS n FROM admin_users WHERE role = 'admin' AND id != ?"
  ).bind(excludeId).first();
  return Number(row?.n || 0) > 0;
}

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const denied = requireAdmin(locals);
  if (denied) return denied;

  const db = (locals as any).runtime.env.DB;
  const id = Number(params.id);
  if (!Number.isFinite(id)) return json({ error: 'Invalid user id' }, 400);

  const target = await db.prepare('SELECT * FROM admin_users WHERE id = ?').bind(id).first();
  if (!target) return json({ error: 'User not found' }, 404);

  let body: any;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request body' }, 400); }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (typeof body.name === 'string') {
    updates.push('name = ?');
    values.push(body.name.trim().slice(0, 120) || null);
  }

  /* avatar: '' clears the picture, a string sets it, absent leaves it alone */
  if (typeof body.avatar === 'string') {
    updates.push('avatar = ?');
    values.push(body.avatar.trim() || null);
  }

  if (typeof body.username === 'string' && body.username.trim()) {
    const username = body.username.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
      return json({ error: 'Username must be 3-32 characters: letters, numbers, dot, dash or underscore' }, 400);
    }
    const taken = await db.prepare('SELECT id FROM admin_users WHERE username = ? AND id != ?')
      .bind(username, id).first();
    if (taken) return json({ error: 'That username is taken' }, 409);
    updates.push('username = ?');
    values.push(username);
  }

  if (typeof body.email === 'string' && body.email.trim()) {
    const email = body.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ error: 'Enter a valid email address' }, 400);
    }
    const taken = await db.prepare('SELECT id FROM admin_users WHERE email = ? AND id != ?')
      .bind(email, id).first();
    if (taken) return json({ error: 'An account with that email already exists' }, 409);
    updates.push('email = ?');
    values.push(email);
  }

  if (body.role === 'admin' || body.role === 'editor') {
    /* The super admin is the account that can always get back in. Demoting it
       would be a slower way of losing it, so the role is fixed. */
    if (target.is_super && body.role !== 'admin') {
      return json({ error: 'The Super Admin role cannot be changed' }, 400);
    }
    if (target.role === 'admin' && body.role === 'editor' && !(await otherAdminsExist(db, id))) {
      return json({ error: 'This is the only admin account — promote someone else first' }, 400);
    }
    updates.push('role = ?');
    values.push(body.role);
  }

  if (typeof body.password === 'string' && body.password.length > 0) {
    if (body.password.length < MIN_PASSWORD || body.password.length > MAX_PASSWORD) {
      return json({ error: `Password must be between ${MIN_PASSWORD} and ${MAX_PASSWORD} characters` }, 400);
    }
    updates.push('password_hash = ?');
    values.push(await hashPassword(body.password));
  }

  if (!updates.length) return json({ error: 'Nothing to update' }, 400);

  values.push(id);
  await db.prepare(`UPDATE admin_users SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
  return json({ success: true });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const denied = requireAdmin(locals);
  if (denied) return denied;

  const db = (locals as any).runtime.env.DB;
  const id = Number(params.id);
  if (!Number.isFinite(id)) return json({ error: 'Invalid user id' }, 400);

  const target = await db.prepare('SELECT * FROM admin_users WHERE id = ?').bind(id).first();
  if (!target) return json({ error: 'User not found' }, 404);

  /* The super admin is the permanent way back into the panel — it cannot be
     removed by anyone, including itself. */
  if (target.is_super) {
    return json({ error: 'The Super Admin account cannot be deleted' }, 400);
  }

  /* Deleting the account you are signed in as would end your own session
     mid-request and leave the panel in a confusing state. */
  if (target.email === (locals as any).user.email) {
    return json({ error: 'You cannot delete the account you are signed in with' }, 400);
  }
  if (target.role === 'admin' && !(await otherAdminsExist(db, id))) {
    return json({ error: 'This is the only admin account — it cannot be deleted' }, 400);
  }

  await db.prepare('DELETE FROM admin_users WHERE id = ?').bind(id).run();
  return json({ success: true });
};
