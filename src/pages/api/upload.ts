import type { APIRoute } from 'astro';
import { clientIp, rateLimit, tooMany, checkUploadType } from '../../lib/guards';

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

  // Unauthenticated endpoint: cap how many files one address can push in.
  const ip = clientIp(context.request);
  const gate = await rateLimit(db, 'upload', ip, 30, 60);
  if (!gate.allowed) return tooMany(gate.retryAfterMinutes);

  const form = await context.request.formData().catch(() => null);
  const file = form?.get('file') as File | null;
  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return new Response(JSON.stringify({ error: 'File too large — please use a file under about 1.4MB' }), { status: 400 });
  }

  const typeCheck = checkUploadType(file);
  if (!typeCheck.ok) {
    return new Response(JSON.stringify({ error: typeCheck.error }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  let base64: string;
  try {
    const buf = await file.arrayBuffer();
    base64 = arrayBufferToBase64(buf);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Failed to process file: ' + (e?.message || 'unknown error') }), { status: 500 });
  }

  const id = crypto.randomUUID();
  const mimeType = typeCheck.mime;
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
