/*
 * Browser checks for the pages moved into the database.
 *
 * Status codes are not enough here: Cloudflare answers an unknown path with
 * the SPA fallback, which is a 200 with HTML in it, so a page that renders
 * nothing still "passes" a curl check. Everything below looks at what actually
 * ended up on screen — real text nodes, image.naturalWidth, computed styles.
 *
 *   node scripts/verify-content-pages.mjs [--url https://…]
 */
import { chromium } from 'playwright';

const arg = process.argv.indexOf('--url');
const BASE = arg > -1 ? process.argv[arg + 1] : 'https://cloudbridge-astro-staging.pages.dev';

let failures = 0;
const ok = (name, extra = '') => console.log(`  PASS  ${name}${extra ? ` — ${extra}` : ''}`);
const bad = (name, why) => { failures++; console.log(`  FAIL  ${name} — ${why}`); };
const check = (cond, name, why, extra) => (cond ? ok(name, extra) : bad(name, why));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

async function open(path) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const res = await page.goto(BASE + path, { waitUntil: 'networkidle' });
  return { page, res, errors };
}

/** Any <img> that finished loading with no pixels is a broken image. */
async function brokenImages(page) {
  return page.evaluate(() =>
    Array.from(document.images)
      .filter(i => i.complete && i.naturalWidth === 0)
      .map(i => i.getAttribute('src')));
}

console.log(`\nVerifying ${BASE}\n`);

/* ---- /about ------------------------------------------------------ */
{
  console.log('/about');
  const { page, res, errors } = await open('/about');
  check(res.status() === 200, 'responds 200', `got ${res.status()}`);

  const h1 = (await page.locator('h1').first().textContent() || '').trim();
  check(h1.length > 0, 'has an H1', 'H1 is empty', h1);

  const skills = await page.locator('section:has(h2:text("Key Skills")) .text-center p').count();
  check(skills >= 10, 'skills list rendered from the database', `only ${skills} found`, `${skills} items`);

  const reasons = await page.locator('section:has(h2:text("Reasons to Choose Us")) .bg-white p').count();
  check(reasons >= 6, 'reasons list rendered', `only ${reasons} found`, `${reasons} items`);

  const years = await page.locator('.timeline-year').allTextContents();
  check(years.length >= 8, 'history timeline rendered', `only ${years.length} entries`, years.join(', '));

  /* Alternating sides is a CSS-dependent behaviour, so read it back rather
     than trusting the class was emitted. */
  const sides = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.timeline-card')).slice(0, 2)
      .map(el => Math.round(el.getBoundingClientRect().left)));
  check(sides.length === 2 && sides[0] !== sides[1], 'timeline entries alternate sides',
    `both start at ${sides[0]}px`, `${sides[0]}px vs ${sides[1]}px`);

  const teamVisible = await page.locator('.team-slide.active').count();
  check(teamVisible === 1, 'team carousel shows one member at a time', `${teamVisible} active slides`);

  const broken = await brokenImages(page);
  check(broken.length === 0, 'no broken images', broken.join(', '));
  check(errors.length === 0, 'no console errors', errors.join(' | '));
  await page.close();
}

/* ---- /destinations ----------------------------------------------- */
{
  console.log('\n/destinations');
  const { page, res, errors } = await open('/destinations');
  check(res.status() === 200, 'responds 200', `got ${res.status()}`);

  /* Scoped to the card grid: the header's Destinations menu also links three
     of these, and counting those would hide a missing card. */
  const cards = page.locator('main a[href^="/destinations/study-in-"], section .grid > a[href^="/destinations/study-in-"]');
  const n = await cards.count();
  check(n === 10, 'all ten country cards rendered from the database', `found ${n}`, `${n} cards`);

  /* The gradient comes out of the database and is written into a style
     attribute, so confirm it actually painted rather than falling back. */
  const bg = await cards.first().evaluate(el => getComputedStyle(el).backgroundImage);
  check(bg.includes('gradient'), 'card colour applied', `background-image was "${bg}"`);

  /* Flags are real images now: an emoji renders as the bare country-code
     letters on Windows, which is what this replaced. Check they loaded rather
     than just that the tag is there. */
  /* The photo now comes from the database, the same row the home page reads —
     it used to be hardcoded in two places, so a country could show a picture on
     one page and only a colour on the other. */
  const photos = await page.evaluate(() => Array.from(
    document.querySelectorAll('section .grid > a img[src*="/assets/destinations/"], section .grid > a img[src^="/api/media/"]'))
    .map(i => ({ src: i.getAttribute('src'), w: i.naturalWidth })));
  check(photos.length >= 3, 'destination photos render on the hub', `found ${photos.length}`, `${photos.length} photos`);
  const badPhotos = photos.filter(p => p.w === 0).map(p => p.src);
  check(badPhotos.length === 0, 'every destination photo loaded', badPhotos.join(', '));

  const flags = await page.evaluate(() => Array.from(
    document.querySelectorAll('img[src^="/assets/flags/"]'))
    .map(i => ({ src: i.getAttribute('src'), w: i.naturalWidth })));
  check(flags.length === 10, 'every card has a flag image', `found ${flags.length}`, `${flags.length} flags`);
  const unloaded = flags.filter(f => f.w === 0).map(f => f.src);
  check(unloaded.length === 0, 'every flag image actually loaded', unloaded.join(', '));

  const broken = await brokenImages(page);
  check(broken.length === 0, 'no broken images', broken.join(', '));
  check(errors.length === 0, 'no console errors', errors.join(' | '));
  await page.close();
}

/* ---- one country guide ------------------------------------------- */
{
  console.log('\n/destinations/study-in-uk');
  const { page, res, errors } = await open('/destinations/study-in-uk');
  check(res.status() === 200, 'responds 200', `got ${res.status()}`);

  const body = await page.locator('body').innerText();
  check(/£12,000/.test(body), 'tuition figure came through from the database', 'tuition text missing');
  check(/Graduate Route/.test(body), 'post-study text came through', 'post-study text missing');

  const why = await page.locator('h2:text("Why Bangladeshi students choose") + p + ul li').count();
  check(why >= 4, 'JSON list column parsed into bullets', `only ${why} bullets`, `${why} bullets`);

  const steps = await page.locator('ol li').count();
  check(steps >= 5, 'visa steps rendered', `only ${steps} steps`, `${steps} steps`);

  const faqs = await page.locator('h2:text("Frequently asked questions") + div > div').count();
  check(faqs >= 5, 'FAQ pairs rendered', `only ${faqs}`, `${faqs} questions`);

  const schema = await page.evaluate(() =>
    Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map(s => s.textContent).join(''));
  check(schema.includes('FAQPage'), 'FAQ structured data still emitted', 'no FAQPage in JSON-LD');

  const others = await page.locator('aside a[href^="/destinations/study-in-"]').count();
  check(others === 9, 'sidebar lists the other nine guides', `found ${others}`);

  const heroFlag = await page.evaluate(() => {
    const i = document.querySelector('h1 img[src^="/assets/flags/"]');
    return i ? { src: i.getAttribute('src'), w: i.naturalWidth } : null;
  });
  check(heroFlag && heroFlag.w > 0, 'the heading flag loaded',
    heroFlag ? `${heroFlag.src} did not load` : 'no flag image in the H1', heroFlag?.src);

  check(errors.length === 0, 'no console errors', errors.join(' | '));
  await page.close();
}

/* ---- a slug that does not exist ---------------------------------- */
{
  console.log('\n/destinations/study-in-atlantis');
  const { page, res } = await open('/destinations/study-in-atlantis');
  check(res.status() === 404, 'unknown country returns a real 404', `got ${res.status()} — the SPA fallback may be masking it`);
  await page.close();
}

/* ---- /scholarship ------------------------------------------------ */
{
  console.log('\n/scholarship');
  const { page, res, errors } = await open('/scholarship');
  check(res.status() === 200, 'responds 200', `got ${res.status()}`);

  const types = await page.locator('section:has(h2:text("Types of Funding")) .rounded-2xl.p-6').count();
  check(types >= 6, 'funding cards rendered (5 from the list + the dark card)', `found ${types}`, `${types} cards`);

  const steps = await page.locator('.timeline-year').count();
  check(steps >= 4, 'support steps rendered', `found ${steps}`, `${steps} steps`);

  /* The coloured strip is picked by key from a fixed map — if Tailwind purged
     the class it renders transparent. */
  const bars = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.university-card > div:first-child'))
      .map(el => getComputedStyle(el).backgroundColor));
  const painted = bars.filter(b => b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent');
  check(painted.length >= 3, 'destination card colour bars painted',
    `bars were ${JSON.stringify(bars)}`, painted.join(', '));

  const faqs = await page.locator('.faq-btn').count();
  check(faqs >= 5, 'FAQ accordion rendered', `found ${faqs}`, `${faqs} questions`);

  /* The accordion is behaviour, not markup — click one and see it move. */
  const second = page.locator('.faq-btn').nth(1);
  const answer = page.locator('.faq-answer').nth(1);
  const before = await answer.isVisible();
  await second.click();
  await page.waitForTimeout(300);
  const after = await answer.isVisible();
  check(before === false && after === true, 'FAQ accordion still opens on click',
    `visible before=${before}, after=${after}`);

  const counters = await page.locator('.counter').allTextContents();
  check(counters.length === 3, 'three counters present', `found ${counters.length}`, counters.join(' / '));

  const broken = await brokenImages(page);
  check(broken.length === 0, 'no broken images', broken.join(', '));
  check(errors.length === 0, 'no console errors', errors.join(' | '));
  await page.close();
}

/* ---- homepage + sitemap ------------------------------------------ */
{
  console.log('\n/ (homepage destination chips)');
  const { page, errors } = await open('/');
  /* The row of chips under the three cards was removed — "See all
     destinations" carries people to the hub instead. Only the three featured
     cards and the header menu should link a guide from here now. */
  const chips = await page.evaluate(() => new Set(
    Array.from(document.querySelectorAll('a[href^="/destinations/study-in-"]'))
      .map(a => a.getAttribute('href'))).size);
  check(chips === 3, 'homepage links only the three featured guides', `found ${chips} distinct`, `${chips} guides`);
  const seeAll = await page.locator('a[href="/destinations"]').count();
  check(seeAll >= 1, '"See all destinations" still links to the hub', 'link missing');

  const heroPhotos = await page.evaluate(() => Array.from(
    document.querySelectorAll('a[href^="/destinations/study-in-"].card-photo'))
    .map(a => getComputedStyle(a).backgroundImage));
  const withPhoto = heroPhotos.filter(b => /url\(/.test(b));
  check(withPhoto.length === 3, 'the three featured cards still show their photo',
    `only ${withPhoto.length} of ${heroPhotos.length} have one`);
  check(errors.length === 0, 'no console errors', errors.join(' | '));
  await page.close();

  console.log('\n/sitemap.xml');
  const p2 = await ctx.newPage();
  const r = await p2.request.get(BASE + '/sitemap.xml');
  const xml = await r.text();
  check((r.headers()['content-type'] || '').includes('xml'), 'served as XML',
    `content-type was ${r.headers()['content-type']}`);
  /* Match the destination path specifically — three blog articles and an
     event share the "study-in-" prefix and are meant to be there. */
  const listed = (xml.match(/<loc>[^<]*\/destinations\/study-in-[^<]*<\/loc>/g) || []).length;
  check(listed === 10, 'all ten guides listed once each', `found ${listed}`, `${listed} URLs`);
  await p2.close();
}

/* ---- admin screens are still behind the login --------------------- */
{
  console.log('\nadmin screens (logged out)');
  for (const path of ['/cbc-admin/about', '/cbc-admin/destinations', '/cbc-admin/scholarships']) {
    const p = await ctx.newPage();
    await p.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    check(p.url().includes('/cbc-admin/login'), `${path} redirects to login`, `landed on ${p.url()}`);
    await p.close();
  }
  for (const api of ['/api/page-items', '/api/destinations', '/api/scholarships']) {
    const p = await ctx.newPage();
    const r = await p.request.get(BASE + api);
    check(r.status() === 401, `${api} refuses anonymous reads`, `got ${r.status()}`);
    await p.close();
  }
}

await browser.close();
console.log(failures === 0 ? '\nAll checks passed.\n' : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
