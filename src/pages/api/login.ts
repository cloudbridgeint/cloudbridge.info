import type { APIRoute } from 'astro';
import { verifyPassword, createSessionCookie } from '../../lib/auth';

export const prerender = false;

// The admin panel is reachable from the open internet, so the login endpoint
// needs a brute-force brake. Failures are counted per client IP over a short
// window; once the limit is hit the endpoint stops checking passwords at all.
const WINDOW_MINUTES = 15;
const MAX_FAILURES = 8;

function deny(status: number, error: string, extra: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ error, ...extra }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async (context) => {
  const env = (context.locals as any).runtime.env;
  const db = env.DB;
  const secret = env.SESSION_SECRET || 'dev-secret-change-me';
  const ip = context.request.headers.get('cf-connecting-ip') || 'unknown';

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return deny(400, 'Invalid request body');
  }

  const { email, password } = body || {};
  if (!email || !password) {
    return deny(400, 'Email and password required');
  }

  // Count recent failures from this IP before doing any password work.
  let failures = 0;
  try {
    const row = await db.prepare(
      `SELECT COUNT(*) AS n FROM login_attempts
       WHERE ip = ? AND ok = 0 AND created_at > datetime('now', ?)`
    ).bind(ip, `-${WINDOW_MINUTES} minutes`).first();
    failures = Number(row?.n || 0);
  } catch {
    // If the check itself fails, fall through and let the login proceed rather
    // than locking every admin out on a transient database error.
  }

  if (failures >= MAX_FAILURES) {
    return deny(429, `Too many failed attempts. Try again in ${WINDOW_MINUTES} minutes.`, {
      retry_after_minutes: WINDOW_MINUTES,
    });
  }

  const record = async (ok: boolean) => {
    try {
      await db.prepare('INSERT INTO login_attempts (ip, email, ok) VALUES (?, ?, ?)')
        .bind(ip, String(email).slice(0, 200), ok ? 1 : 0).run();
    } catch { /* logging must never block a legitimate login */ }
  };

  const user = await db.prepare('SELECT * FROM admin_users WHERE email = ?').bind(email).first();
  if (!user) {
    await record(false);
    return deny(401, 'Invalid credentials');
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    await record(false);
    return deny(401, 'Invalid credentials');
  }

  await record(true);

  // Clear this IP's failure history so a successful admin isn't throttled by
  // their own earlier typos.
  try {
    await db.prepare('DELETE FROM login_attempts WHERE ip = ? AND ok = 0').bind(ip).run();
  } catch { /* best effort */ }

  const cookieValue = await createSessionCookie(email, secret);
  context.cookies.set('cb_session', cookieValue, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
