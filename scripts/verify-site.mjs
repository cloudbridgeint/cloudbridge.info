#!/usr/bin/env node
/**
 * Site health check — run this against a deployment before and after any change.
 *
 *   node scripts/verify-site.mjs                     # checks https://cloudbridge.info
 *   node scripts/verify-site.mjs --url https://...   # checks any other deployment
 *   node scripts/verify-site.mjs --url http://localhost:8788
 *
 * Every check here exists because this exact failure happened at least once:
 * status codes alone hid broken pages, a stylesheet that failed to load left
 * the whole site unstyled, an invisible modal swallowed every click, and a
 * misconfigured admin gate would expose student records. Exits non-zero on
 * failure so it can gate a deploy.
 */
// Playwright is intentionally NOT a dependency in package.json: Cloudflare
// Pages runs `npm install` on every build, and Playwright's postinstall pulls
// down browser binaries, which would slow and destabilise deploys. Install it
// locally when you want to run this check.
let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error(
    '\n  This check needs Playwright, which is deliberately not a project dependency.\n' +
    '  Install it once, locally:\n\n' +
    '    npm i -D playwright && npx playwright install chromium\n'
  );
  process.exit(2);
}

const args = process.argv.slice(2);
const urlArg = args.indexOf('--url');
const BASE = (urlArg !== -1 ? args[urlArg + 1] : 'https://cloudbridge.info').replace(/\/$/, '');
const isProd = BASE.includes('cloudbridge.info');

const PAGES = [
  '/', '/about', '/our-team', '/destinations', '/dest-uk', '/dest-malaysia', '/dest-usa',
  '/apply-now', '/programs', '/student-visa', '/spouse-visa', '/university-college',
  '/scholarship', '/events', '/study-in-uk', '/study-in-usa', '/study-in-europe',
  '/visa-interview-tips', '/find-scholarships', '/first-month-abroad', '/blogs',
  '/contact', '/free-consultation',
];

const results = [];
const check = (name, passed, detail = '') => results.push({ name, passed, detail });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await ctx.newPage();

// ---------------------------------------------------------------- pages
const titles = new Set();
const descs = new Set();
let pageFailures = 0;

for (const path of PAGES) {
  const bad = [];
  const errs = [];
  const onResp = r => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url().slice(0, 70)}`); };
  const onErr = e => errs.push(String(e).slice(0, 80));
  page.on('response', onResp);
  page.on('pageerror', onErr);

  let status = 0;
  try {
    const r = await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 45000 });
    status = r?.status() ?? 0;
    titles.add(await page.title());
    descs.add(await page.evaluate(() => document.querySelector('meta[name=description]')?.content || ''));
  } catch (e) {
    errs.push(String(e).slice(0, 80));
  }
  page.off('response', onResp);
  page.off('pageerror', onErr);

  const good = status === 200 && bad.length === 0 && errs.length === 0;
  if (!good) pageFailures++;
  if (!good) check(`page ${path}`, false, `${status} ${bad.slice(0, 2).join(',')} ${errs[0] || ''}`);
}
check(`all ${PAGES.length} pages load cleanly`, pageFailures === 0, `${pageFailures} failing`);
check('every page has a unique title', titles.size === PAGES.length, `${titles.size}/${PAGES.length}`);
check('every page has a unique description', descs.size === PAGES.length, `${descs.size}/${PAGES.length}`);

// ------------------------------------------------- styles actually applied
// A failed stylesheet still returns a 200 page, so assert on rendered geometry.
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
const layout = await page.evaluate(() => ({
  headerH: Math.round(document.querySelector('header')?.getBoundingClientRect().height || 0),
  sheets: document.styleSheets.length,
  overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
}));
check('stylesheet loaded', layout.sheets > 0, `${layout.sheets} sheets`);
check('header renders at a styled height', layout.headerH > 0 && layout.headerH < 200, `${layout.headerH}px`);
check('no horizontal overflow', !layout.overflow);

// ------------------------------------------------ interactive CSS behaviour
await page.goto(BASE + '/apply-now', { waitUntil: 'networkidle' });
// Wait for the form itself rather than assuming networkidle means rendered —
// a missing element used to crash this check instead of reporting a failure.
await page.waitForSelector('#applyStep4', { timeout: 20000 }).catch(() => {});
const behaviour = await page.evaluate(() => {
  const vis = id => {
    const el = document.getElementById(id);
    return el ? getComputedStyle(el).display !== 'none' : null;
  };
  const modal = document.getElementById('cbPreviewModal');
  const steps = [1, 2, 3, 4].map(i => vis('applyStep' + i));
  const panel = document.querySelector('#comboResidenceCountry [data-combo-panel]');
  return {
    modalHidden: modal ? getComputedStyle(modal).display === 'none' : null,
    onlyFirstStep: steps[0] === true && steps[1] === false && steps[2] === false && steps[3] === false,
    stepsFound: steps.filter(s => s !== null).length,
    panelHidden: panel ? getComputedStyle(panel).display === 'none' : null,
  };
});
check('preview modal is hidden (not swallowing clicks)', behaviour.modalHidden === true);
check('only step 1 of the form is visible', behaviour.onlyFirstStep === true, `${behaviour.stepsFound}/4 steps found`);
check('combobox panel starts closed', behaviour.panelHidden === true);

// ------------------------------------------------------------ admin gate
await ctx.clearCookies();
await page.goto(BASE + '/cbc-admin/applications', { waitUntil: 'domcontentloaded' });
check('admin redirects to login when logged out', page.url().includes('/cbc-admin/login'), page.url());

const apiStatus = await page.evaluate(async () => (await fetch('/api/leads')).status);
check('protected API returns 401 when logged out', apiStatus === 401, String(apiStatus));

const adminHeaders = await page.evaluate(async () => {
  const r = await fetch('/cbc-admin/login');
  return r.headers.get('x-robots-tag');
});
check('admin marked noindex', (adminHeaders || '').includes('noindex'), adminHeaders || 'missing');

// ------------------------------------------------------- uploads are safe
const uploadProbe = await page.evaluate(async () => {
  const send = async (name, type) => {
    const fd = new FormData();
    fd.append('file', new File(['x'], name, { type }));
    const r = await fetch('/api/upload', { method: 'POST', body: fd });
    return r.status;
  };
  return {
    html: await send('x.html', 'text/html'),
    svg: await send('x.svg', 'image/svg+xml'),
  };
});
check('HTML upload rejected', uploadProbe.html === 400, String(uploadProbe.html));
check('SVG upload rejected', uploadProbe.svg === 400, String(uploadProbe.svg));

// ------------------------------------------------------------- sitemap
const sm = await page.evaluate(async () => {
  const r = await fetch('/sitemap.xml');
  return { status: r.status, type: r.headers.get('content-type'), body: (await r.text()).slice(0, 200000) };
});
const locs = [...sm.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
check('sitemap returns XML', sm.status === 200 && (sm.type || '').includes('xml'), `${sm.status} ${sm.type}`);
check('sitemap lists the public pages', locs.length >= PAGES.length, `${locs.length} urls`);
check('sitemap excludes admin and api', !locs.some(u => u.includes('/cbc-admin') || u.includes('/api/')));

// ------------------------------------------------- production-only checks
if (isProd) {
  const wwwStatus = await fetch('https://www.cloudbridge.info/', { redirect: 'manual' })
    .then(r => ({ s: r.status, loc: r.headers.get('location') })).catch(() => ({ s: 0 }));
  check('www redirects to apex', wwwStatus.s === 301 && (wwwStatus.loc || '').includes('//cloudbridge.info'),
    `${wwwStatus.s} ${wwwStatus.loc || ''}`);

  const adminHtml = await fetch(BASE + '/admin.html', { redirect: 'manual' })
    .then(r => ({ s: r.status, loc: r.headers.get('location') })).catch(() => ({ s: 0 }));
  check('/admin.html redirects to the new admin', adminHtml.s === 301 && (adminHtml.loc || '').includes('/cbc-admin'),
    `${adminHtml.s} ${adminHtml.loc || ''}`);

  const homeHeaders = await fetch(BASE + '/').then(r => r.headers.get('x-robots-tag')).catch(() => 'error');
  check('public site is indexable', !homeHeaders, homeHeaders || '(no header)');
} else if (BASE.includes('.pages.dev')) {
  // Only the pages.dev deployments carry the noindex header; a localhost run
  // legitimately has none, so asserting it there would be a false failure.
  const stagingHeader = await fetch(BASE + '/').then(r => r.headers.get('x-robots-tag')).catch(() => null);
  check('non-production deployment is noindex', (stagingHeader || '').includes('noindex'), stagingHeader || 'missing');
}

// --------------------------------------------- leftover placeholder content
const home = await fetch(BASE + '/').then(r => r.text()).catch(() => '');
const about = await fetch(BASE + '/about').then(r => r.text()).catch(() => '');
check('no placeholder video ids', !home.includes('dQw4w9WgXcQ'));
check('no visible placeholder notes', !/placeholder —/i.test(home) && !/placeholder —/i.test(about));
check('no empty badge/logo boxes', !home.includes('Membership Badge') && !about.includes('>LOGO<'));

await browser.close();

// ------------------------------------------------------------------ report
const failed = results.filter(r => !r.passed);
console.log(`\n  Checked ${BASE}\n`);
for (const r of results) {
  console.log(`  ${r.passed ? 'ok  ' : 'FAIL'} ${r.name}${r.detail ? '   → ' + r.detail : ''}`);
}
console.log(`\n  ${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log(`\n  ${failed.length} FAILED — do not ship this build.\n`);
  process.exit(1);
}
console.log('  All good.\n');
