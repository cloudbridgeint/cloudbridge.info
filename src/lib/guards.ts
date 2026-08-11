/**
 * Shared guards for the endpoints that are deliberately reachable without a
 * login: lead submission, chat, and file upload. Without these, anyone can
 * fill the database or use the domain to host files.
 */

type D1Like = {
  prepare: (sql: string) => {
    bind: (...args: any[]) => { first: () => Promise<any>; run: () => Promise<any> };
  };
};

export function clientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip') || 'unknown';
}

/**
 * Records a hit and reports whether this IP has exceeded `limit` within
 * `windowMinutes`. Every database call is best-effort: a transient D1 error
 * must not take a public form offline, so on failure we allow the request.
 */
export async function rateLimit(
  db: D1Like,
  bucket: string,
  ip: string,
  limit: number,
  windowMinutes: number
): Promise<{ allowed: boolean; retryAfterMinutes: number }> {
  try {
    const row = await db.prepare(
      `SELECT COUNT(*) AS n FROM rate_limits
       WHERE bucket = ? AND ip = ? AND created_at > datetime('now', ?)`
    ).bind(bucket, ip, `-${windowMinutes} minutes`).first();

    if (Number(row?.n || 0) >= limit) {
      return { allowed: false, retryAfterMinutes: windowMinutes };
    }
  } catch {
    return { allowed: true, retryAfterMinutes: 0 };
  }

  try {
    await db.prepare('INSERT INTO rate_limits (bucket, ip) VALUES (?, ?)').bind(bucket, ip).run();
  } catch { /* counting is best-effort */ }

  return { allowed: true, retryAfterMinutes: 0 };
}

export function tooMany(retryAfterMinutes: number) {
  return new Response(
    JSON.stringify({ error: `Too many requests. Please try again in ${retryAfterMinutes} minutes.` }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterMinutes * 60),
      },
    }
  );
}

/**
 * Types a visitor may upload. HTML, SVG and anything script-bearing are
 * excluded on purpose: a file served back from our own origin can run script
 * in the site's security context, which would put an admin's logged-in session
 * at risk. SVG counts as script-bearing.
 */
const ALLOWED_UPLOAD_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const ALLOWED_CHAT_EXTRA_TYPES = new Set([
  'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-m4a', 'audio/aac',
]);

const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif',
  'pdf', 'doc', 'docx',
  'webm', 'ogg', 'mp3', 'm4a', 'wav', 'aac',
]);

export function checkUploadType(
  file: File,
  opts: { allowAudio?: boolean } = {}
): { ok: true; mime: string } | { ok: false; error: string } {
  const declared = (file.type || '').toLowerCase().split(';')[0].trim();
  const ext = (file.name || '').toLowerCase().split('.').pop() || '';

  const allowed = new Set(ALLOWED_UPLOAD_TYPES);
  if (opts.allowAudio) for (const t of ALLOWED_CHAT_EXTRA_TYPES) allowed.add(t);

  if (!declared || !allowed.has(declared)) {
    return { ok: false, error: 'That file type is not accepted. Please upload an image, PDF or Word document.' };
  }
  // The browser-declared type is attacker-controlled, so require the extension
  // to be sane as well rather than trusting it on its own.
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { ok: false, error: 'That file extension is not accepted.' };
  }
  return { ok: true, mime: declared };
}

/**
 * Types safe to render inline in a browser. Anything else is sent as a
 * download with a generic type so it can never execute on our origin, even if
 * a bad row predates the upload validation above.
 */
const INLINE_SAFE = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
  'application/pdf',
  'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-m4a', 'audio/aac',
]);

export function safeServeHeaders(mimeType: string, filename?: string) {
  const mime = (mimeType || '').toLowerCase().split(';')[0].trim();
  const headers: Record<string, string> = {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  };

  if (INLINE_SAFE.has(mime)) {
    headers['Content-Type'] = mime;
  } else {
    headers['Content-Type'] = 'application/octet-stream';
    const safeName = (filename || 'download').replace(/[^\w.\- ]+/g, '_').slice(0, 100);
    headers['Content-Disposition'] = `attachment; filename="${safeName}"`;
  }
  return headers;
}
