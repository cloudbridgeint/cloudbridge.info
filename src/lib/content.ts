export interface D1Like {
  prepare: (sql: string) => any;
}

/** Fetch all content rows and return as a key->value map. */
export async function getAllContent(db: D1Like): Promise<Record<string, string>> {
  const { results } = await db.prepare('SELECT key, value FROM content').all();
  const map: Record<string, string> = {};
  for (const row of results as any[]) map[row.key] = row.value;
  return map;
}

/** Get one content value with a fallback default if not set in DB. */
export function c(map: Record<string, string>, key: string, fallback: string): string {
  const v = map[key];
  return v !== undefined && v !== null && v !== '' ? v : fallback;
}

/** Resolve an image field: either "media:<id>" -> /api/media/<id>, or a plain path/URL, or fallback. */
export function cImage(map: Record<string, string>, key: string, fallback: string): string {
  const v = map[key];
  if (!v) return fallback;
  if (v.startsWith('media:')) return `/api/media/${v.slice(6)}`;
  return v;
}

export async function getUniversities(db: D1Like, country?: string) {
  const stmt = country
    ? db.prepare('SELECT * FROM universities WHERE active = 1 AND country = ? ORDER BY sort_order ASC, id ASC').bind(country)
    : db.prepare('SELECT * FROM universities WHERE active = 1 ORDER BY country ASC, sort_order ASC, id ASC');
  const { results } = await stmt.all();
  return results as any[];
}

export async function getFaqs(db: D1Like) {
  const { results } = await db.prepare('SELECT * FROM faqs WHERE active = 1 ORDER BY sort_order ASC, id ASC').all();
  return results as any[];
}

export async function getPublishedBlogPosts(db: D1Like, limit?: number) {
  const stmt = limit
    ? db.prepare('SELECT * FROM blog_posts WHERE published = 1 ORDER BY created_at DESC LIMIT ?').bind(limit)
    : db.prepare('SELECT * FROM blog_posts WHERE published = 1 ORDER BY created_at DESC');
  const { results } = await stmt.all();
  return results as any[];
}

export async function getPublishedEvents(db: D1Like) {
  const { results } = await db.prepare('SELECT * FROM events WHERE published = 1 ORDER BY event_date ASC').all();
  return results as any[];
}

export function mediaUrl(idOrUrl: string | null | undefined, fallback: string): string {
  if (!idOrUrl) return fallback;
  if (idOrUrl.startsWith('media:')) return `/api/media/${idOrUrl.slice(6)}`;
  return idOrUrl;
}
