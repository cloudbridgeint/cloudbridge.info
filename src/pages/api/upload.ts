import type { APIRoute } from 'astro';

export const prerender = false;

const MAX_SIZE = 1.4 * 1024 * 1024; // 1.4MB raw — see api/media/index.ts for why (D1 SQLITE_TOOBIG around ~2MB stored)

// See api/media/index.ts for why this must be chunked rather than done
// one character at a time or via a single String.fromCharCode.apply call.
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  return btoa(binary);
}

export const POST: APIRoute = async (context) => {
  const db = (context.locals as any).runtime.env.DB;
  const form = await context.request.formData().catch(() => null);
  const file = form?.get('file') as File | null;
  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return new Response(JSON.stringify({ error: 'File too large — please use a file under about 1.4MB' }), { status: 400 });
  }

  let base64: string;
  try {
    const buf = await file.arrayBuffer();
    base64 = arrayBufferToBase64(buf);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Failed to process file: ' + (e?.message || 'unknown error') }), { status: 500 });
  }

  const id = crypto.randomUUID();
  const mimeType = file.type || 'application/octet-stream';
  try {
    await db.prepare(
      `INSERT INTO media (id, filename, mime_type, data, created_at) VALUES (?, ?, ?, ?, datetime('now'))`
    ).bind(id, file.name || 'document', mimeType, base64).run();
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Failed to save file: ' + (e?.message || 'unknown error') }), { status: 500 });
  }

  return new Response(JSON.stringify({ url: `/api/media/${id}`, name: file.name || '' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
