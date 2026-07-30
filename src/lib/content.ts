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

export async function getCourses(db: D1Like) {
  const { results } = await db.prepare(
    'SELECT * FROM courses WHERE active = 1 ORDER BY sort_order ASC, id ASC'
  ).all();
  return (results as any[]).map(c => ({
    name: c.name, university: c.university, country: c.country, city: c.city,
    level: c.level, subject: c.subject, delivery: c.delivery, duration: c.duration,
    logo: mediaUrl(c.logo, '/assets/logo.png'),
  }));
}

export async function getUniversityDirectory(db: D1Like) {
  const { results } = await db.prepare(
    'SELECT * FROM university_directory WHERE active = 1 ORDER BY sort_order ASC, id ASC'
  ).all();
  const splitCsv = (s: string) => (s || '').split(',').map((x: string) => x.trim()).filter(Boolean);
  return (results as any[]).map(u => ({
    name: u.name, country: u.country, city: u.city,
    feeMin: u.fee_min, feeMax: u.fee_max,
    intake: splitCsv(u.intake), intakeYear: splitCsv(u.intake_year),
    scholarship: !!u.scholarship, ranking: u.ranking,
    faculty: splitCsv(u.faculty), studyLevel: splitCsv(u.study_level),
    logo: mediaUrl(u.logo, '/assets/logo.png'),
    coverImage: u.cover_image ? mediaUrl(u.cover_image, '') : '',
  }));
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

// ---- Analytics ----

export async function getVisitSummary(db: D1Like) {
  const total = await db.prepare('SELECT COUNT(*) as n FROM visits').first();
  const today = await db.prepare("SELECT COUNT(*) as n FROM visits WHERE date(created_at) = date('now')").first();
  const thisMonth = await db.prepare("SELECT COUNT(*) as n FROM visits WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')").first();
  const thisYear = await db.prepare("SELECT COUNT(*) as n FROM visits WHERE strftime('%Y', created_at) = strftime('%Y', 'now')").first();
  return {
    total: (total as any)?.n ?? 0,
    today: (today as any)?.n ?? 0,
    thisMonth: (thisMonth as any)?.n ?? 0,
    thisYear: (thisYear as any)?.n ?? 0,
  };
}

export async function getVisitsByDay(db: D1Like, days = 30) {
  const { results } = await db.prepare(
    `SELECT date(created_at) as label, COUNT(*) as n FROM visits
     WHERE created_at >= datetime('now', ?)
     GROUP BY label ORDER BY label ASC`
  ).bind(`-${days} days`).all();
  return results as any[];
}

export async function getVisitsByMonth(db: D1Like, months = 12) {
  const { results } = await db.prepare(
    `SELECT strftime('%Y-%m', created_at) as label, COUNT(*) as n FROM visits
     WHERE created_at >= datetime('now', ?)
     GROUP BY label ORDER BY label ASC`
  ).bind(`-${months} months`).all();
  return results as any[];
}

export async function getVisitsByYear(db: D1Like) {
  const { results } = await db.prepare(
    `SELECT strftime('%Y', created_at) as label, COUNT(*) as n FROM visits GROUP BY label ORDER BY label ASC`
  ).all();
  return results as any[];
}

export async function getTopPages(db: D1Like, limit = 8) {
  const { results } = await db.prepare(
    `SELECT path, COUNT(*) as n FROM visits GROUP BY path ORDER BY n DESC LIMIT ?`
  ).bind(limit).all();
  return results as any[];
}

export async function getTopCountries(db: D1Like, limit = 8) {
  const { results } = await db.prepare(
    `SELECT COALESCE(NULLIF(country,''), 'Unknown') as country, COUNT(*) as n FROM visits GROUP BY country ORDER BY n DESC LIMIT ?`
  ).bind(limit).all();
  return results as any[];
}

/** Events from today onward, soonest first — for the admin dashboard calendar widget. */
export async function getUpcomingEvents(db: D1Like, limit = 5) {
  const { results } = await db.prepare(
    `SELECT id, title, event_date, location FROM events
     WHERE date(event_date) >= date('now')
     ORDER BY event_date ASC LIMIT ?`
  ).bind(limit).all();
  return results as any[];
}

/** Top lead source pages as percentages, for the dashboard's ring charts. */
export async function getLeadSourceBreakdown(db: D1Like, limit = 4) {
  const { results } = await db.prepare(
    `SELECT COALESCE(NULLIF(source_page,''), 'Direct') as source, COUNT(*) as n FROM leads GROUP BY source ORDER BY n DESC LIMIT ?`
  ).bind(limit).all();
  const rows = results as any[];
  const total = rows.reduce((s, r) => s + r.n, 0);
  return { rows, total };
}
