import type { APIRoute } from 'astro';
import { verifyPassword, createSessionCookie } from '../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const env = (context.locals as any).runtime.env;
  const db = env.DB;
  const secret = env.SESSION_SECRET || 'dev-secret-change-me';

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  const { email, password } = body || {};
  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400 });
  }

  const user = await db.prepare('SELECT * FROM admin_users WHERE email = ?').bind(email).first();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
  }

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
