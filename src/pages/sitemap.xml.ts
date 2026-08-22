import type { APIRoute } from 'astro';

export const prerender = false;

const SITE = 'https://cloudbridge.info';

// Public pages, highest priority first, tagged with the content-table prefix
// that page's Settings screen writes to. That prefix is how we find a real
// "last changed" date instead of stamping every page with today's date on
// every single crawl — which told search engines nothing changed was ever
// true, and buried whichever pages had genuinely just been edited.
const STATIC_PAGES: Array<{ path: string; priority: string; changefreq: string; prefix: string }> = [
  { path: '/', priority: '1.0', changefreq: 'weekly', prefix: 'home' },
  { path: '/about', priority: '0.8', changefreq: 'monthly', prefix: 'about' },
  { path: '/our-team', priority: '0.6', changefreq: 'monthly', prefix: 'our-team' },
  { path: '/destinations', priority: '0.9', changefreq: 'monthly', prefix: 'destinations' },
  // The individual country guides are not listed here: they live in the
  // destinations table and are appended below, so adding or removing one in
  // the admin keeps the sitemap right without a code change.
  { path: '/university-college', priority: '0.8', changefreq: 'weekly', prefix: 'university-college' },
  { path: '/programs', priority: '0.8', changefreq: 'weekly', prefix: 'programs' },
  { path: '/scholarship', priority: '0.8', changefreq: 'weekly', prefix: 'scholarship' },
  { path: '/student-visa', priority: '0.8', changefreq: 'monthly', prefix: 'student-visa' },
  { path: '/spouse-visa', priority: '0.7', changefreq: 'monthly', prefix: 'spouse-visa' },
  { path: '/events', priority: '0.6', changefreq: 'weekly', prefix: 'events' },
  { path: '/apply-now', priority: '0.9', changefreq: 'monthly', prefix: 'apply-now' },
  { path: '/free-consultation', priority: '0.9', changefreq: 'monthly', prefix: 'free-consultation' },
  { path: '/contact', priority: '0.7', changefreq: 'monthly', prefix: 'contact' },
  { path: '/blogs', priority: '0.7', changefreq: 'weekly', prefix: 'blogs' },
  // The six article paths that used to sit here (/study-in-uk and friends)
  // are gone: they now 301 to /blogs/<slug>, and the block below already
  // lists every published article straight from the database. Listing a
  // redirect in a sitemap only asks crawlers to fetch a page twice.
];

function esc(s: string) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c] as string));
}

function isoDate(v: unknown): string | null {
  const raw = String(v || '').trim();
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/* <url> with an optional lastmod. Omitting the tag when we have no real date
   is deliberate: a wrong date is worse than no date at all — it teaches
   crawlers to distrust every date on the site, including the ones that are
   correct. */
function urlTag(loc: string, lastmod: string | null, changefreq: string, priority: string) {
  return `  <url>\n    <loc>${loc}</loc>\n` +
    (lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : '') +
    `    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export const GET: APIRoute = async (context) => {
  const urls: string[] = [];
  const db = (context.locals as any).runtime?.env?.DB;

  // One query for every content-table timestamp, then take the latest one
  // per page prefix. A page with no saved rows yet (nobody has opened its
  // Settings screen and pressed Save) genuinely has no known change date,
  // so it gets no lastmod rather than a guessed one.
  const prefixLastmod: Record<string, string> = {};
  try {
    if (db) {
      const { results } = await db.prepare('SELECT key, updated_at FROM content').all();
      for (const row of (results || []) as any[]) {
        const key = String(row?.key || '');
        const dot = key.indexOf('.');
        if (dot === -1) continue;
        const prefix = key.slice(0, dot);
        const d = isoDate(row.updated_at);
        if (d && (!prefixLastmod[prefix] || d > prefixLastmod[prefix])) prefixLastmod[prefix] = d;
      }
    }
  } catch {
    // No content timestamps available — every static page below just gets
    // no lastmod, which is still correct, only less informative.
  }

  for (const p of STATIC_PAGES) {
    urls.push(urlTag(`${SITE}${p.path}`, prefixLastmod[p.prefix] || null, p.changefreq, p.priority));
  }

  // Published blog posts are real URLs too, so pull them from the database
  // rather than letting the sitemap go stale every time one is added.
  try {
    if (db) {
      const { results } = await db
        .prepare('SELECT slug, updated_at, created_at FROM blog_posts WHERE published = 1')
        .all();
      for (const row of results || []) {
        if (!row?.slug) continue;
        urls.push(urlTag(`${SITE}/blogs/${esc(row.slug)}`, isoDate(row.updated_at || row.created_at), 'monthly', '0.5'));
      }
    }
  } catch {
    // A database hiccup shouldn't produce a broken sitemap — serve the static
    // pages rather than a 500.
  }

  // Destination guides, straight from the table that renders them.
  try {
    if (db) {
      const { results } = await db.prepare(
        'SELECT slug, updated_at FROM destinations WHERE active = 1 ORDER BY sort_order ASC'
      ).all();
      for (const row of results || []) {
        if (!row?.slug) continue;
        urls.push(urlTag(`${SITE}/destinations/study-in-${esc(row.slug)}`, isoDate(row.updated_at), 'monthly', '0.9'));
      }
    }
  } catch {
    // a database hiccup shouldn't break the sitemap
  }

  // University profiles — one page per directory entry. last_verified_at is
  // set when a counsellor confirms the page's facts are still current;
  // created_at is the fallback for a profile nobody has re-verified yet.
  try {
    if (db) {
      const { results } = await db.prepare(
        "SELECT slug, last_verified_at, created_at FROM university_directory WHERE active = 1 AND slug IS NOT NULL AND slug != ''"
      ).all();
      for (const row of results || []) {
        if (!row?.slug) continue;
        urls.push(urlTag(`${SITE}/universities/${esc(row.slug)}`, isoDate(row.last_verified_at || row.created_at), 'monthly', '0.7'));
      }
    }
  } catch {
    // a database hiccup shouldn't break the sitemap
  }

  // Course pages. Only the published ones: an unpublished course has no page,
  // and listing a 404 in a sitemap wastes the crawl and costs trust.
  try {
    if (db) {
      const { results } = await db.prepare(
        `SELECT c.slug, c.last_verified_at, c.created_at, d.slug AS uni_slug
         FROM courses c
         JOIN university_directory d ON d.name = c.university AND d.active = 1
         WHERE c.active = 1 AND c.published = 1 AND c.slug != '' AND d.slug != ''`
      ).all();
      for (const row of results || []) {
        if (!row?.slug || !row?.uni_slug) continue;
        urls.push(urlTag(`${SITE}/courses/${esc(row.uni_slug)}/${esc(row.slug)}`, isoDate(row.last_verified_at || row.created_at), 'monthly', '0.7'));
      }
    }
  } catch {
    // a database hiccup shouldn't break the sitemap
  }

  // Event pages: one URL per occurrence, since each run now keeps its own
  // permanent address. Events have no updated_at column, so created_at is
  // the best real signal available — still a genuine date, unlike today's.
  try {
    if (db) {
      const { results } = await db.prepare(
        `SELECT slug, event_date, created_at FROM events
         WHERE published = 1 AND slug IS NOT NULL AND slug != ''`
      ).all();
      for (const row of results || []) {
        if (!row?.slug || !row?.event_date) continue;
        const d = new Date(String(row.event_date) + 'T00:00:00');
        if (isNaN(d.getTime())) continue;
        const period = `${d.toLocaleDateString('en-GB', { month: 'long' }).toLowerCase()}-${d.getFullYear()}`;
        urls.push(urlTag(`${SITE}/events/${esc(row.slug)}/${period}`, isoDate(row.created_at), 'weekly', '0.6'));
      }
    }
  } catch {
    // a database hiccup shouldn't break the sitemap
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
