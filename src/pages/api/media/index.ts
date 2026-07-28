import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const form = await context.request.formData();
  const file = form.get('file') as File | null;
  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
  }
  if (file.size > 4 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: 'File too large (max 4MB)' }), { status: 400 });
  }

  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);

  const id = crypto.randomUUID();
  await db.prepare(
    `INSERT INTO media (id, filename, mime_type, data, created_at) VALUES (?, ?, ?, ?, datetime('now'))`
  ).bind(id, file.name, file.type || 'application/octet-stream', base64).run();

  return new Response(JSON.stringify({ id, url: `/api/media/${id}` }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
