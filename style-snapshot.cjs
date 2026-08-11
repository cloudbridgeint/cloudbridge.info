/* Capture a fingerprint of rendered styling across the whole site so the
   Tailwind CDN -> build-time migration can be proved visually identical. */
const { chromium } = require('playwright');
const fs = require('fs');

const BASE = process.argv[2];
const OUT = process.argv[3];
const ADMIN_USER = process.argv[4] || '';
const ADMIN_PASS = process.argv[5] || '';

const PUBLIC_PAGES = ['/', '/about', '/our-team', '/destinations', '/dest-uk', '/dest-malaysia',
  '/dest-usa', '/apply-now', '/programs', '/student-visa', '/spouse-visa', '/university-college',
  '/scholarship', '/events', '/study-in-uk', '/study-in-usa', '/study-in-europe',
  '/visa-interview-tips', '/find-scholarships', '/first-month-abroad', '/blogs', '/contact',
  '/free-consultation'];
const ADMIN_PAGES = ['/cbc-admin', '/cbc-admin/query', '/cbc-admin/applications',
  '/cbc-admin/leads', '/cbc-admin/analytics', '/cbc-admin/messages', '/cbc-admin/blogs',
  '/cbc-admin/events', '/cbc-admin/faq', '/cbc-admin/universities', '/cbc-admin/courses',
  '/cbc-admin/homepage', '/cbc-admin/footer', '/cbc-admin/university-directory'];

const PROPS = ['display', 'position', 'color', 'backgroundColor', 'backgroundImage',
  'fontSize', 'fontWeight', 'fontFamily', 'padding', 'margin', 'borderRadius',
  'borderColor', 'borderWidth', 'width', 'height', 'flexDirection', 'justifyContent',
  'alignItems', 'gap', 'gridTemplateColumns', 'textAlign', 'opacity', 'boxShadow'];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  const result = {};

  if (ADMIN_USER) {
    await page.goto(BASE + '/cbc-admin/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(async ([u, p]) => {
      await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u, password: p }) });
    }, [ADMIN_USER, ADMIN_PASS]);
  }

  const pages = ADMIN_USER ? PUBLIC_PAGES.concat(ADMIN_PAGES) : PUBLIC_PAGES;

  for (const path of pages) {
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(1200);
      const snap = await page.evaluate((props) => {
        const els = Array.from(document.querySelectorAll('body *'))
          .filter(e => !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(e.tagName));
        const out = [];
        for (let i = 0; i < els.length; i++) {
          const e = els[i];
          const cs = getComputedStyle(e);
          const rec = { t: e.tagName, c: (e.className || '').toString().slice(0, 120) };
          for (const p of props) rec[p] = cs[p];
          const r = e.getBoundingClientRect();
          rec.box = [Math.round(r.width), Math.round(r.height)];
          out.push(rec);
        }
        return { count: els.length, els: out, docH: document.body.scrollHeight };
      }, PROPS);
      result[path] = snap;
      process.stderr.write(`  ${path} (${snap.count} els)\n`);
    } catch (e) {
      result[path] = { error: String(e).slice(0, 200) };
      process.stderr.write(`  ${path} ERROR\n`);
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(result));
  await browser.close();
  console.log('captured', Object.keys(result).length, 'pages ->', OUT);
})();
