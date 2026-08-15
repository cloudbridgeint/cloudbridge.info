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
  // Left join, not inner: a course whose university is missing from the
  // directory must still appear in the /programs list. It just loses the link
  // to a profile, which the card falls back on.
  const { results } = await db.prepare(
    `SELECT c.*, d.slug AS uni_slug
     FROM courses c
     LEFT JOIN university_directory d ON d.name = c.university AND d.active = 1
     WHERE c.active = 1 ORDER BY c.sort_order ASC, c.id ASC`
  ).all();
  return (results as any[]).map(c => ({
    name: c.name, university: c.university, country: c.country, city: c.city,
    level: c.level, subject: c.subject, delivery: c.delivery, duration: c.duration,
    logo: mediaUrl(c.logo, '/assets/logo.png'),
    // Where the card's button should point. A course with a written, published
    // detail page gets its own URL; everything else falls back to the
    // university profile, which is a real page rather than a lead form.
    slug: c.slug || '', uni_slug: c.uni_slug || '',
    published: Number(c.published) === 1 ? 1 : 0,
  }));
}

/* Course detail pages. The join to university_directory is what supplies the
   university half of the URL, the logo, the campus city and the link back to
   the profile — a course row only stores the university's name. */
const COURSE_SELECT = `
  SELECT c.*, d.slug AS uni_slug, d.name AS uni_name, d.city AS uni_city,
         d.country AS uni_country, d.logo AS uni_logo, d.cover_image AS uni_cover,
         d.website AS uni_website, d.overview AS uni_overview,
         d.scholarship AS uni_scholarship, d.intake AS uni_intake
  FROM courses c
  JOIN university_directory d ON d.name = c.university AND d.active = 1`;

function shapeCourse(c: any) {
  return {
    ...c,
    logo: mediaUrl(c.logo, ''),
    uni_logo: mediaUrl(c.uni_logo, '/assets/logo.png'),
    uni_cover: c.uni_cover ? mediaUrl(c.uni_cover, '') : '',
    url: `/courses/${c.uni_slug}/${c.slug}`,
  };
}

/** One published course, addressed the way its URL addresses it. */
export async function getCourseBySlugs(db: D1Like, uniSlug: string, courseSlug: string) {
  const { results } = await db
    .prepare(`${COURSE_SELECT} WHERE c.active = 1 AND c.published = 1
              AND d.slug = ? AND c.slug = ? LIMIT 1`)
    .bind(uniSlug, courseSlug).all();
  const row = (results as any[])[0];
  return row ? shapeCourse(row) : null;
}

/** Courses to link on from a detail page: same subject first, then same
    university. Only published ones — linking to a 404 helps nobody. */
export async function getRelatedCourses(db: D1Like, course: any, limit = 6) {
  const { results } = await db
    .prepare(`${COURSE_SELECT} WHERE c.active = 1 AND c.published = 1 AND c.id <> ?
              AND (c.subject = ? OR c.university = ?)
              ORDER BY CASE WHEN c.subject = ? THEN 0 ELSE 1 END, c.sort_order ASC, c.id ASC
              LIMIT ?`)
    .bind(course.id, course.subject, course.university, course.subject, limit).all();
  return (results as any[]).map(shapeCourse);
}

/** Published course URLs, for the sitemap. */
export async function getPublishedCourseUrls(db: D1Like) {
  const { results } = await db
    .prepare(`SELECT c.slug, c.last_verified_at, c.created_at, d.slug AS uni_slug
              FROM courses c JOIN university_directory d ON d.name = c.university AND d.active = 1
              WHERE c.active = 1 AND c.published = 1 AND c.slug <> '' AND d.slug <> ''`)
    .all();
  return results as any[];
}

export async function getUniversityDirectory(db: D1Like) {
  const { results } = await db.prepare(
    'SELECT * FROM university_directory WHERE active = 1 ORDER BY sort_order ASC, id ASC'
  ).all();
  const splitCsv = (s: string) => (s || '').split(',').map((x: string) => x.trim()).filter(Boolean);
  return (results as any[]).map(u => ({
    name: u.name, slug: u.slug || '', country: u.country, city: u.city,
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

/**
 * The soonest published event that falls inside the current calendar month and
 * hasn't happened yet. Scoped to this month on purpose: showing next month's
 * or a finished event under an "Event On This Month" heading would make the
 * site look unmaintained, so when the month has nothing left the banner simply
 * disappears.
 */
export async function getEventThisMonth(db: D1Like) {
  const row = await db.prepare(
    `SELECT * FROM events
     WHERE published = 1
       AND event_date >= date('now')
       AND strftime('%Y-%m', event_date) = strftime('%Y-%m', 'now')
     ORDER BY event_date ASC LIMIT 1`
  ).first();
  return (row as any) || null;
}

/** URL-safe slug from an event title. Kept here so the page route and the
 *  admin write path can never disagree about what a title turns into. */
export function eventSlug(title: string): string {
  return String(title || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'event';
}

/**
 * Resolve /events/<slug> to a single event.
 *
 * A recurring event reuses its slug every time it runs, so the URL is stable
 * and keeps whatever search ranking it has built. That means several rows can
 * share a slug: prefer the soonest one still to come, and fall back to the most
 * recent past one so an old shared link shows the event as finished instead of
 * 404ing.
 */
export async function getEventBySlug(db: D1Like, slug: string) {
  const upcoming = await db.prepare(
    `SELECT * FROM events
     WHERE published = 1 AND slug = ? AND event_date >= date('now')
     ORDER BY event_date ASC LIMIT 1`
  ).bind(slug).first();
  if (upcoming) return { event: upcoming as any, past: false };

  const previous = await db.prepare(
    `SELECT * FROM events
     WHERE published = 1 AND slug = ?
     ORDER BY event_date DESC LIMIT 1`
  ).bind(slug).first();
  if (previous) return { event: previous as any, past: true };

  return null;
}

/** Distinct event slugs, for the sitemap. One entry per recurring event. */
export async function getEventSlugs(db: D1Like) {
  const { results } = await db.prepare(
    `SELECT slug, MAX(event_date) AS last_date FROM events
     WHERE published = 1 AND slug IS NOT NULL AND slug != ''
     GROUP BY slug`
  ).all();
  return (results || []) as any[];
}

/** "2026-08-15" -> "august-2026", the second half of an event's URL. */
export function eventPeriod(dateStr: string): string {
  const d = new Date(String(dateStr || '') + 'T00:00:00');
  if (isNaN(d.getTime())) return 'tbc';
  const month = d.toLocaleDateString('en-GB', { month: 'long' }).toLowerCase();
  return `${month}-${d.getFullYear()}`;
}

/** Exact occurrence: /events/<slug>/<period>. Each run of a recurring event
 *  keeps its own permanent URL this way. */
export async function getEventBySlugPeriod(db: D1Like, slug: string, period: string) {
  const { results } = await db.prepare(
    'SELECT * FROM events WHERE published = 1 AND slug = ?'
  ).bind(slug).all();
  const match = (results || []).find((r: any) => eventPeriod(r.event_date) === period);
  return (match as any) || null;
}

/** Newest occurrence of a slug — the soonest still to come, else the most
 *  recent past one. Used to send a bare /events/<slug> somewhere useful. */
export async function getLatestOccurrence(db: D1Like, slug: string) {
  const upcoming = await db.prepare(
    `SELECT * FROM events WHERE published = 1 AND slug = ? AND event_date >= date('now')
     ORDER BY event_date ASC LIMIT 1`
  ).bind(slug).first();
  if (upcoming) return upcoming as any;
  const previous = await db.prepare(
    `SELECT * FROM events WHERE published = 1 AND slug = ? ORDER BY event_date DESC LIMIT 1`
  ).bind(slug).first();
  return (previous as any) || null;
}

/** Every published occurrence, for the sitemap — one URL per run. */
export async function getAllEventOccurrences(db: D1Like) {
  const { results } = await db.prepare(
    `SELECT slug, event_date FROM events
     WHERE published = 1 AND slug IS NOT NULL AND slug != '' ORDER BY event_date DESC`
  ).all();
  return (results || []) as any[];
}

/**
 * Event descriptions are written in the admin as plain text. This renders a
 * deliberately small markdown subset — "## heading", "- bullet", "**bold**" —
 * so the office can structure a listing without the field ever accepting raw
 * HTML, which would put script execution one paste away.
 */
/**
 * Plain-text opening of an event description, for banners and cards. Drops the
 * heading and bullet lines and strips the markdown marks, so "## Event Details"
 * can never surface as raw text in a summary.
 */
export function eventExcerpt(raw: string, maxChars = 220): string {
  const text = String(raw || '')
    .split(/\r?\n/)
    .filter(l => l.trim() && !/^\s*(##|[-•*])\s/.test(l))
    .join(' ')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  return cut.slice(0, cut.lastIndexOf(' ')) + '…';
}

export function renderEventDescription(raw: string): string {
  const esc = (t: string) => String(t).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
  const inline = (t: string) => esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  const lines = String(raw || '').split(/\r?\n/);
  const out: string[] = [];
  let listOpen = false;
  const closeList = () => { if (listOpen) { out.push('</ul>'); listOpen = false; } };

  for (const line of lines) {
    const t = line.trim();
    if (!t) { closeList(); continue; }

    if (/^##\s+/.test(t)) {
      closeList();
      out.push(`<h3 class="ev-desc-h">${inline(t.replace(/^##\s+/, ''))}</h3>`);
    } else if (/^[-•*]\s+/.test(t)) {
      if (!listOpen) { out.push('<ul class="ev-desc-ul">'); listOpen = true; }
      out.push(`<li>${inline(t.replace(/^[-•*]\s+/, ''))}</li>`);
    } else {
      closeList();
      out.push(`<p>${inline(t)}</p>`);
    }
  }
  closeList();
  return out.join('\n');
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

export async function getBlogPostBySlug(db: D1Like, slug: string) {
  const row = await db.prepare('SELECT * FROM blog_posts WHERE slug = ? AND published = 1').bind(slug).first();
  return row as any;
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

// ---- Repeatable page rows (About, Scholarship) ----

export interface PageItem {
  id: number;
  group_key: string;
  title: string;
  subtitle: string;
  body: string;
  icon: string;
  image: string;
  link_url: string;
  link_label: string;
  accent: string;
  sort_order: number;
  active: number;
}

/**
 * Rows for one list on a page — the About timeline, the scholarship funding
 * types, and so on. Inactive rows are left out so an editor can hide an item
 * without losing what it said.
 */
export async function getPageItems(db: D1Like, groupKey: string): Promise<PageItem[]> {
  const { results } = await db.prepare(
    'SELECT * FROM page_items WHERE group_key = ? AND active = 1 ORDER BY sort_order ASC, id ASC'
  ).bind(groupKey).all();
  return (results || []) as any[];
}

/** Several lists in one round trip, keyed by group. */
export async function getPageItemGroups(
  db: D1Like,
  groupKeys: string[]
): Promise<Record<string, PageItem[]>> {
  const out: Record<string, PageItem[]> = {};
  for (const k of groupKeys) out[k] = [];
  if (!groupKeys.length) return out;
  const placeholders = groupKeys.map(() => '?').join(',');
  const { results } = await db.prepare(
    `SELECT * FROM page_items WHERE group_key IN (${placeholders}) AND active = 1
     ORDER BY sort_order ASC, id ASC`
  ).bind(...groupKeys).all();
  for (const row of (results || []) as any[]) {
    (out[row.group_key] ||= []).push(row);
  }
  return out;
}

// ---- Destinations ----

export interface DestinationRow {
  id: number;
  slug: string;
  country: string;
  short: string;
  flag: string;
  tagline: string;
  answer: string;
  intro: string;
  why: string[];
  tuition: string;
  living: string;
  currency: string;
  intakes: string;
  workRights: string;
  postStudy: string;
  englishReq: string;
  academicReq: string;
  visaName: string;
  visaSteps: string[];
  scholarships: string[];
  universities: string[];
  officialSource: { label: string; url: string };
  faqs: { q: string; a: string }[];
  cardImage: string;
  gradient: string;
  sortOrder: number;
}

/** Array columns are JSON text. A malformed value must not take a page down. */
function parseList(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  try {
    const v = JSON.parse(String(raw || '[]'));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function toDestination(r: any): DestinationRow {
  return {
    id: r.id,
    slug: r.slug,
    country: r.country,
    short: r.short,
    flag: r.flag || '',
    tagline: r.tagline || '',
    answer: r.answer || '',
    intro: r.intro || '',
    why: parseList(r.why),
    tuition: r.tuition || '',
    living: r.living || '',
    currency: r.currency || '',
    intakes: r.intakes || '',
    workRights: r.work_rights || '',
    postStudy: r.post_study || '',
    englishReq: r.english_req || '',
    academicReq: r.academic_req || '',
    visaName: r.visa_name || '',
    visaSteps: parseList(r.visa_steps),
    scholarships: parseList(r.scholarships),
    universities: parseList(r.universities),
    officialSource: { label: r.official_label || '', url: r.official_url || '' },
    faqs: parseList(r.faqs).filter((f: any) => f && f.q && f.a),
    cardImage: r.card_image ? mediaUrl(r.card_image, '') : '',
    gradient: r.gradient || '',
    sortOrder: r.sort_order ?? 0,
  };
}

export async function getDestinations(db: D1Like): Promise<DestinationRow[]> {
  const { results } = await db.prepare(
    'SELECT * FROM destinations WHERE active = 1 ORDER BY sort_order ASC, id ASC'
  ).all();
  return ((results || []) as any[]).map(toDestination);
}

export async function getDestinationBySlug(db: D1Like, slug: string): Promise<DestinationRow | null> {
  const row = await db.prepare(
    'SELECT * FROM destinations WHERE slug = ? AND active = 1'
  ).bind(slug).first();
  return row ? toDestination(row) : null;
}

// ---- Scholarships ----

export async function getScholarships(db: D1Like) {
  const { results } = await db.prepare(
    'SELECT * FROM scholarships WHERE active = 1 ORDER BY featured DESC, sort_order ASC, id ASC'
  ).all();
  return ((results || []) as any[]).map(s => ({
    ...s,
    logo: s.logo ? mediaUrl(s.logo, '') : '',
  }));
}

// ---- University profiles ----

/** One directory entry by its slug, for /universities/<slug>. */
export async function getUniversityBySlug(db: D1Like, slug: string) {
  const row = await db.prepare(
    'SELECT * FROM university_directory WHERE slug = ? AND active = 1'
  ).bind(slug).first();
  if (!row) return null;
  const splitCsv = (s: string) => (s || '').split(',').map((x: string) => x.trim()).filter(Boolean);
  const u = row as any;
  return {
    ...u,
    intakeList: splitCsv(u.intake),
    intakeYearList: splitCsv(u.intake_year),
    facultyList: splitCsv(u.faculty),
    studyLevelList: splitCsv(u.study_level),
    logoUrl: mediaUrl(u.logo, ''),
    coverUrl: u.cover_image ? mediaUrl(u.cover_image, '') : '',
  };
}

/** Slugs of every published entry, for the sitemap. */
export async function getUniversitySlugs(db: D1Like) {
  const { results } = await db.prepare(
    "SELECT slug, name FROM university_directory WHERE active = 1 AND slug != '' ORDER BY name"
  ).all();
  return (results || []) as any[];
}

/** The courses this university offers, for the profile page's course table. */
export async function getCoursesByUniversity(db: D1Like, universityName: string) {
  const { results } = await db.prepare(
    'SELECT * FROM courses WHERE active = 1 AND university = ? ORDER BY level ASC, name ASC'
  ).bind(universityName).all();
  return ((results || []) as any[]).map(c => ({
    name: c.name, level: c.level, subject: c.subject,
    delivery: c.delivery, duration: c.duration, city: c.city,
  }));
}

/**
 * Paragraphs from a stored text block. Written in the admin as plain text with
 * blank lines between paragraphs; no HTML is accepted, so nothing typed into a
 * profile can put markup on the page.
 */
export function paragraphs(raw: string | null | undefined): string[] {
  return String(raw || '')
    .split(/\n\s*\n/)
    .map(s => s.trim())
    .filter(Boolean);
}
