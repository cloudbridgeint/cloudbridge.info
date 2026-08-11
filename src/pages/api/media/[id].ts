import type { APIRoute } from 'astro';
import { safeServeHeaders } from '../../../lib/guards';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { id } = context.params;
  const row = await db.prepare('SELECT mime_type, filename, data FROM media WHERE id = ?').bind(id).first();
  if (!row) return new Response('Not found', { status: 404 });

  const binary = atob(row.data as string);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  return new Response(bytes, {
    headers: safeServeHeaders(row.mime_type as string, row.filename as string),
  });
};
