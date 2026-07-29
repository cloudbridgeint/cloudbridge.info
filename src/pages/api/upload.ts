import type { APIRoute } from 'astro';

export const prerender = false;

const MAX_SIZE = 8 * 1024 * 1024; // 8MB

export const POST: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const form = await context.request.formData().catch(() => null);
  const file = form?.get('file') as File | null;
  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return new Response(JSON.stringify({ error: 'File too large (max 8MB)' }), { status: 400 });
  }

  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);

  const id = crypto.randomUUID();
  const mimeType = file.type || 'application/octet-stream';
  await db.prepare(
    `INSERT INTO media (id, filename, mime_type, data, created_at) VALUES (?, ?, ?, ?, datetime('now'))`
  ).bind(id, file.name || 'document', mimeType, base64).run();

  return new Response(JSON.stringify({ url: `/api/media/${id}`, name: file.name || '' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
