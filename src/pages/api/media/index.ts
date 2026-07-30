import type { APIRoute } from 'astro';

export const prerender = false;

// Cloudflare D1 rejects a stored TEXT/BLOB value once it's roughly 2MB+ (SQLITE_TOOBIG).
// Base64 inflates the original file by ~33%, so keep the raw upload comfortably
// below that so the base64 string that actually gets stored stays under the limit.
const MAX_SIZE = 1.4 * 1024 * 1024; // 1.4MB raw (~1.87MB once base64-encoded)

// Converting large files to base64 one character at a time (the naive approach)
// is slow enough to blow past the Workers CPU-time limit on real photos (a
// few hundred KB to a few MB), which silently kills the request and returns
// an empty body — the client then fails with "Unexpected end of JSON input".
// Chunking the conversion keeps each step cheap and avoids both that and the
// call-stack limit of String.fromCharCode.apply on very large arrays.
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
  const form = await context.request.formData();
  const file = form.get('file') as File | null;
  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return new Response(JSON.stringify({ error: 'Image too large — please use an image under about 1.4MB (try compressing or resizing it first)' }), { status: 400 });
  }

  let base64: string;
  try {
    const buf = await file.arrayBuffer();
    base64 = arrayBufferToBase64(buf);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Failed to process image: ' + (e?.message || 'unknown error') }), { status: 500 });
  }

  const id = crypto.randomUUID();
  try {
    await db.prepare(
      `INSERT INTO media (id, filename, mime_type, data, created_at) VALUES (?, ?, ?, ?, datetime('now'))`
    ).bind(id, file.name, file.type || 'application/octet-stream', base64).run();
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Failed to save image — it may still be too large for storage' }), { status: 500 });
  }

  return new Response(JSON.stringify({ id, url: `/api/media/${id}` }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
