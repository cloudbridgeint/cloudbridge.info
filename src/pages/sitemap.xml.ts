import type { APIRoute } from 'astro';

export const prerender = false;

const SITE = 'https://cloudbridge.info';

// Public pages, highest priority first. Admin, API and the thank-you states
// are deliberately absent — they should never appear in search results.
const STATIC_PAGES: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/about', priority: '0.8', changefreq: 'monthly' },
  { path: '/our-team', priority: '0.6', changefreq: 'monthly' },
  { path: '/destinations', priority: '0.9', changefreq: 'monthly' },
  // The individual country guides are not listed here: they live in the
  // destinations table and are appended below, so adding or removing one in
  // the admin keeps the sitemap right without a code change.
  { path: '/university-college', priority: '0.8', changefreq: 'weekly' },
  { path: '/programs', priority: '0.8', changefreq: 'weekly' },
  { path: '/scholarship', priority: '0.8', changefreq: 'weekly' },
  { path: '/student-visa', priority: '0.8', changefreq: 'monthly' },
  { path: '/spouse-visa', priority: '0.7', changefreq: 'monthly' },
  { path: '/events', priority: '0.6', changefreq: 'weekly' },
  { path: '/apply-now', priority: '0.9', changefreq: 'monthly' },
  { path: '/free-consultation', priority: '0.9', changefreq: 'monthly' },
  { path: '/contact', priority: '0.7', changefreq: 'monthly' },
  { path: '/blogs', priority: '0.7', changefreq: 'weekly' },
  // The six article paths that used to sit here (/study-in-uk and friends)
  // are gone: they now 301 to /blogs/<slug>, and the block below already
  // lists every published article straight from the database. Listing a
  // redirect in a sitemap only asks crawlers to fetch a page twice.
];

function esc(s: string) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c] as string));
}

function isoDate(v: unknown): string {
  const raw = String(v || '').trim();
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : new Date().toISOString().slice(0, 10);
}

export const GET: APIRoute = async (context) => {
  const today = new Date().toISOString().slice(0, 10);
  const urls: string[] = STATIC_PAGES.map(p =>
    `  <url>\n    <loc>${SITE}${p.path}</loc>\n    <lastmod>${today}</lastmod>\n` +
    `    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`);

  // Published blog posts are real URLs too, so pull them from the database
  // rather than letting the sitemap go stale every time one is added.
  try {
    const db = (context.locals as any).runtime?.env?.DB;
    if (db) {
      const { results } = await db
        .prepare('SELECT slug, updated_at, created_at FROM blog_posts WHERE published = 1')
        .all();
      for (const row of results || []) {
        if (!row?.slug) continue;
        const lastmod = isoDate(row.updated_at || row.created_at);
        urls.push(
          `  <url>\n    <loc>${SITE}/blogs/${esc(row.slug)}</loc>\n    <lastmod>${lastmod}</lastmod>\n` +
          `    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>`);
      }
    }
  } catch {
    // A database hiccup shouldn't produce a broken sitemap — serve the static
    // pages rather than a 500.
  }

  // Destination guides, straight from the table that renders them.
  try {
    const db = (context.locals as any).runtime?.env?.DB;
    if (db) {
      const { results } = await db.prepare(
        'SELECT slug, updated_at FROM destinations WHERE active = 1 ORDER BY sort_order ASC'
      ).all();
      for (const row of results || []) {
        if (!row?.slug) continue;
        urls.push(
          `  <url>\n    <loc>${SITE}/destinations/study-in-${esc(row.slug)}</loc>\n    <lastmod>${isoDate(row.updated_at)}</lastmod>\n` +
          `    <changefreq>monthly</changefreq>\n    <priority>0.9</priority>\n  </url>`);
      }
    }
  } catch {
    // a database hiccup shouldn't break the sitemap
  }

  // Event pages: one URL per occurrence, since each run now keeps its own
  // permanent address.
  try {
    const db = (context.locals as any).runtime?.env?.DB;
    if (db) {
      const { results } = await db.prepare(
        `SELECT slug, event_date FROM events
         WHERE published = 1 AND slug IS NOT NULL AND slug != ''`
      ).all();
      for (const row of results || []) {
        if (!row?.slug || !row?.event_date) continue;
        const d = new Date(String(row.event_date) + 'T00:00:00');
        if (isNaN(d.getTime())) continue;
        const period = `${d.toLocaleDateString('en-GB', { month: 'long' }).toLowerCase()}-${d.getFullYear()}`;
        urls.push(
          `  <url>\n    <loc>${SITE}/events/${esc(row.slug)}/${period}</loc>\n    <lastmod>${today}</lastmod>\n` +
          `    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`);
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
