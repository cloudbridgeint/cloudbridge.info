// Auth helpers using Web Crypto API (available in Cloudflare Workers runtime).
// Passwords: PBKDF2-SHA256, stored as "pbkdf2$<iterations>$<saltHex>$<hashHex>"
// Sessions: signed cookie "<base64Payload>.<base64HmacSignature>" using SESSION_SECRET

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = parseInt(parts[1], 10);
  const salt = hexToBytes(parts[2]);
  const expectedHash = parts[3];

  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, keyMaterial, 256
  );
  const hashHex = bytesToHex(new Uint8Array(bits));
  return hashHex === expectedHash;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 100000;
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, keyMaterial, 256
  );
  return `pbkdf2$${iterations}$${bytesToHex(salt)}$${bytesToHex(new Uint8Array(bits))}`;
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return bytesToHex(new Uint8Array(sig));
}

export type Role = 'admin' | 'editor';

/* The role travels inside the signed payload, so a user cannot promote
   themselves by editing the cookie — any change breaks the HMAC. */
export async function createSessionCookie(email: string, secret: string, role: Role = 'admin'): Promise<string> {
  const payload = JSON.stringify({ email, role, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 }); // 7 days
  const b64 = btoa(payload);
  const sig = await hmacSign(b64, secret);
  return `${b64}.${sig}`;
}

export async function verifySessionCookie(cookieValue: string | undefined, secret: string): Promise<{ email: string; role: Role } | null> {
  if (!cookieValue) return null;
  const [b64, sig] = cookieValue.split('.');
  if (!b64 || !sig) return null;
  const expectedSig = await hmacSign(b64, secret);
  if (expectedSig !== sig) return null;
  try {
    const payload = JSON.parse(atob(b64));
    if (!payload.exp || payload.exp < Date.now()) return null;
    /* Sessions issued before roles existed carry no role. Treating those as
       admin keeps existing logins working; treating them as editor would lock
       the owner out of their own settings. */
    return { email: payload.email, role: payload.role === 'editor' ? 'editor' : 'admin' };
  } catch {
    return null;
  }
}
