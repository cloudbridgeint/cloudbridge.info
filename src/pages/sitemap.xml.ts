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
  { path: '/dest-uk', priority: '0.9', changefreq: 'monthly' },
  { path: '/dest-malaysia', priority: '0.9', changefreq: 'monthly' },
  { path: '/dest-usa', priority: '0.9', changefreq: 'monthly' },
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
  { path: '/study-in-uk', priority: '0.6', changefreq: 'monthly' },
  { path: '/study-in-usa', priority: '0.6', changefreq: 'monthly' },
  { path: '/study-in-europe', priority: '0.6', changefreq: 'monthly' },
  { path: '/visa-interview-tips', priority: '0.6', changefreq: 'monthly' },
  { path: '/find-scholarships', priority: '0.6', changefreq: 'monthly' },
  { path: '/first-month-abroad', priority: '0.6', changefreq: 'monthly' },
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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
