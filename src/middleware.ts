import { defineMiddleware } from 'astro:middleware';
import { verifySessionCookie } from './lib/auth';

const PUBLIC_ADMIN_PATHS = ['/cbc-admin/login', '/api/login'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isAdminArea = pathname.startsWith('/cbc-admin') || pathname.startsWith('/api/');
  if (!isAdminArea) return next();

  const isPublic = PUBLIC_ADMIN_PATHS.some(p => pathname === p) ||
    (pathname === '/api/leads' && context.request.method === 'POST') || // public lead form submission
    (pathname.startsWith('/api/media/') && context.request.method === 'GET') || // public image serving
    (pathname === '/api/chat/send' && context.request.method === 'POST') || // public chat widget: send message
    (pathname === '/api/chat/poll' && context.request.method === 'GET'); // public chat widget: poll for replies

  if (isPublic) return next();

  const env = (context.locals as any).runtime?.env;
  const secret = env?.SESSION_SECRET || 'dev-secret-change-me';
  const cookie = context.cookies.get('cb_session')?.value;
  const session = await verifySessionCookie(cookie, secret);

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return context.redirect('/cbc-admin/login');
  }

  (context.locals as any).user = session;
  return next();
});
