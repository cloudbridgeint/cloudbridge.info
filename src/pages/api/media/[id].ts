import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const { id } = context.params;
  const row = await db.prepare('SELECT mime_type, data FROM media WHERE id = ?').bind(id).first();
  if (!row) return new Response('Not found', { status: 404 });

  const binary = atob(row.data as string);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  return new Response(bytes, {
    headers: {
      'Content-Type': row.mime_type || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
