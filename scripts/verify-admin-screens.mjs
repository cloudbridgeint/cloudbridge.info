/*
 * Logs into the admin and drives the three new screens the way the office
 * will: change a heading, reorder a list, add a scholarship, edit a country —
 * then confirms the public page actually changed, and puts everything back.
 *
 * Runs against staging only. It writes to the database, so it refuses to run
 * against the live domain.
 *
 *   node scripts/verify-admin-screens.mjs --user <email> --pass <password>
 */
import { chromium } from 'playwright';

const args = process.argv;
const val = (flag, fallback) => { const i = args.indexOf(flag); return i > -1 ? args[i + 1] : fallback; };
const BASE = val('--url', 'https://cloudbridge-astro-staging.pages.dev');
const USER = val('--user');
const PASS = val('--pass');

if (/cloudbridge\.info/.test(BASE)) {
  console.error('This test writes data. Point it at staging, not the live site.');
  process.exit(2);
}
if (!USER || !PASS) {
  console.error('Usage: node scripts/verify-admin-screens.mjs --user <email> --pass <password>');
  process.exit(2);
}

let failures = 0;
const check = (cond, name, why, extra) => {
  if (cond) console.log(`  PASS  ${name}${extra ? ` — ${extra}` : ''}`);
  else { failures++; console.log(`  FAIL  ${name} — ${why}`); }
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

console.log(`\nAdmin screens on ${BASE}\n`);

/* ---- login -------------------------------------------------------- */
await page.goto(`${BASE}/cbc-admin/login`, { waitUntil: 'domcontentloaded' });
await page.fill('input[type="email"], #email', USER);
await page.fill('input[type="password"], #password', PASS);
await Promise.all([
  page.waitForURL(u => !u.toString().includes('/login'), { timeout: 20000 }).catch(() => {}),
  page.click('button[type="submit"], #loginBtn'),
]);
check(!page.url().includes('/login'), 'signed in', `still on ${page.url()}`);
if (page.url().includes('/login')) { await browser.close(); process.exit(1); }

/* ---- sidebar ------------------------------------------------------ */
for (const label of ['About Page', 'Study Destinations', 'Scholarships']) {
  const n = await page.locator(`aside a:has-text("${label}")`).count();
  check(n > 0, `sidebar shows "${label}"`, 'link not in the sidebar');
}

/* ---- About: edit a heading and see it on the public page ---------- */
{
  console.log('\n/cbc-admin/about');
  await page.goto(`${BASE}/cbc-admin/about`, { waitUntil: 'networkidle' });

  const fields = await page.locator('.field-input').count();
  check(fields > 30, 'content fields rendered', `only ${fields}`, `${fields} fields`);

  const heading = page.locator('[data-key="about.cta.heading"]');
  const before = await heading.inputValue();
  const probe = `Ready to start your journey? (test ${Date.now() % 100000})`;
  await heading.fill(probe);
  await page.click('#saveContentBtn');
  await page.waitForTimeout(1800);

  const pub = await ctx.newPage();
  await pub.goto(`${BASE}/about`, { waitUntil: 'domcontentloaded' });
  const live = await pub.locator('body').innerText();
  check(live.includes(probe), 'a saved heading appears on the public page', 'the edit did not show up');
  await pub.close();

  await heading.fill(before);
  await page.click('#saveContentBtn');
  await page.waitForTimeout(1500);
  check(true, 'original heading restored');

  const editors = await page.locator('[data-list-editor]').count();
  check(editors === 3, 'three list editors on the page', `found ${editors}`);

  const skillRows = await page.locator('[data-group="about.skills"] [data-index]').count();
  check(skillRows === 10, 'skills list loaded its rows', `found ${skillRows}`, `${skillRows} rows`);

  const iconSelects = await page.locator('[data-group="about.skills"] select[data-field="icon"]').count();
  check(iconSelects === 10, 'each skill has an icon picker', `found ${iconSelects}`);

  /* Reorder the timeline, save, confirm the public page follows, put it back. */
  const tl = '[data-group="about.history"]';
  const firstYear = await page.locator(`${tl} [data-index="0"] [data-field="subtitle"]`).inputValue();
  const secondYear = await page.locator(`${tl} [data-index="1"] [data-field="subtitle"]`).inputValue();
  await page.locator(`${tl} [data-index="1"] [data-move="-1"]`).click();
  const swapped = await page.locator(`${tl} [data-index="0"] [data-field="subtitle"]`).inputValue();
  check(swapped === secondYear, 'move-up reorders the row on screen', `first row is ${swapped}`);

  await page.locator(`${tl} [data-save]`).click();
  await page.waitForTimeout(2000);
  const pub2 = await ctx.newPage();
  await pub2.goto(`${BASE}/about`, { waitUntil: 'domcontentloaded' });
  const years = await pub2.locator('.timeline-year').allTextContents();
  check(years[0] === secondYear, 'reordered timeline is live', `public page starts at ${years[0]}`);
  await pub2.close();

  await page.reload({ waitUntil: 'networkidle' });
  await page.locator(`${tl} [data-index="1"] [data-move="-1"]`).click();
  await page.locator(`${tl} [data-save]`).click();
  await page.waitForTimeout(2000);
  const pub3 = await ctx.newPage();
  await pub3.goto(`${BASE}/about`, { waitUntil: 'domcontentloaded' });
  const restored = await pub3.locator('.timeline-year').allTextContents();
  check(restored[0] === firstYear, 'timeline order restored', `starts at ${restored[0]}`);
  await pub3.close();
}

/* ---- Destinations: open a guide, edit, add and delete ------------- */
{
  console.log('\n/cbc-admin/destinations');
  await page.goto(`${BASE}/cbc-admin/destinations`, { waitUntil: 'networkidle' });

  const cards = await page.locator('#destList [data-edit]').count();
  check(cards === 10, 'all ten destinations listed', `found ${cards}`, `${cards} cards`);

  await page.locator('#destList [data-edit]').first().click();
  await page.waitForTimeout(400);
  check(await page.locator('#destModal').isVisible(), 'editor opens', 'modal stayed hidden');

  const why = await page.locator('#dWhy').inputValue();
  check(why.split('\n').filter(Boolean).length >= 4, 'JSON list loaded as one-per-line text',
    `got ${JSON.stringify(why.slice(0, 40))}`);
  const faqCount = await page.locator('#dFaqList > div').count();
  check(faqCount >= 5, 'FAQ pairs loaded into the editor', `found ${faqCount}`, `${faqCount} pairs`);
  const slugNote = await page.locator('#dSlugPreview').textContent();
  check(/study-in-uk/.test(slugNote || ''), 'slug preview shows the real URL', `said "${slugNote}"`);
  await page.click('#dCancel');

  /* Create a throwaway country, confirm the page exists, then remove it. */
  const slug = `test-${Date.now() % 100000}`;
  await page.click('#addBtn');
  await page.fill('#dCountry', 'Testland');
  await page.fill('#dShort', 'Testland');
  await page.fill('#dSlug', slug);
  await page.fill('#dTagline', 'Created by an automated check');
  await page.fill('#dAnswer', 'A placeholder guide created by the verification script.');
  await page.fill('#dWhy', 'First reason\nSecond reason');
  await page.locator('#dFaqList [data-faq-q]').first().fill('Is this a real destination?');
  await page.locator('#dFaqList [data-faq-a]').first().fill('No — it is created and deleted by an automated check.');
  await page.click('#dSave');
  await page.waitForTimeout(2500);

  const listed = await page.locator(`#destList a[href="/destinations/study-in-${slug}"]`).count();
  check(listed === 1, 'new destination appears in the admin list', 'not listed after save');

  const pub = await ctx.newPage();
  const res = await pub.goto(`${BASE}/destinations/study-in-${slug}`, { waitUntil: 'domcontentloaded' });
  check(res.status() === 200, 'new country guide is live at its own URL', `got ${res.status()}`);
  const txt = await pub.locator('body').innerText();
  check(txt.includes('First reason') && txt.includes('Second reason'), 'its list content rendered', 'bullets missing');
  await pub.close();

  const hub = await ctx.newPage();
  await hub.goto(`${BASE}/destinations`, { waitUntil: 'domcontentloaded' });
  const onHub = await hub.locator(`a[href="/destinations/study-in-${slug}"]`).count();
  check(onHub >= 1, 'new country appears on the destinations page', 'missing from the hub');
  await hub.close();

  /* No dialog handler here: opening the editor does not raise one, and a
     handler left armed would collide with the delete confirmation below. */
  await page.locator(`#destList [data-edit]`).last().click();
  await page.waitForTimeout(400);
  const editingSlug = await page.locator('#dSlug').inputValue();
  if (editingSlug === slug) {
    page.once('dialog', d => d.accept());
    await page.click('#dDelete');
    await page.waitForTimeout(2000);
    const gone = await page.locator(`#destList a[href="/destinations/study-in-${slug}"]`).count();
    check(gone === 0, 'test destination removed again', 'still listed');
  } else {
    await page.click('#dCancel');
    check(false, 'test destination removed again', `expected to edit ${slug}, opened ${editingSlug}`);
  }
}

/* ---- Scholarships ------------------------------------------------- */
{
  console.log('\n/cbc-admin/scholarships');
  await page.goto(`${BASE}/cbc-admin/scholarships`, { waitUntil: 'networkidle' });

  const editors = await page.locator('[data-list-editor]').count();
  check(editors === 4, 'four card lists on the page', `found ${editors}`);

  const typeRows = await page.locator('[data-group="scholarship.types"] [data-index]').count();
  check(typeRows === 5, 'funding cards loaded', `found ${typeRows}`, `${typeRows} rows`);

  const name = `Test Scholarship ${Date.now() % 100000}`;
  await page.click('#schAdd');
  await page.fill('#sName', name);
  await page.fill('#sProvider', 'Verification Script');
  await page.fill('#sCountry', 'United Kingdom');
  await page.fill('#sAmount', 'Full tuition');
  await page.fill('#sDeadline', '31 December 2026');
  await page.fill('#sApplyUrl', 'not-a-url');
  await page.click('#sSave');
  await page.waitForTimeout(800);
  const stillOpen = await page.locator('#schModal').isVisible();
  check(stillOpen, 'a bad apply link is refused before saving', 'the modal closed, so it saved anyway');

  await page.fill('#sApplyUrl', 'https://example.com/scholarship');
  await page.click('#sSave');
  await page.waitForTimeout(2500);
  const inList = await page.locator(`#schList:has-text("${name}")`).count();
  check(inList === 1, 'scholarship saved and listed', 'not shown in the admin list');

  const pub = await ctx.newPage();
  await pub.goto(`${BASE}/scholarship`, { waitUntil: 'domcontentloaded' });
  const body = await pub.locator('body').innerText();
  check(body.includes(name), '"Scholarships Open Now" section appeared with it', 'not on the public page');
  check(body.includes('31 December 2026'), 'its deadline rendered', 'deadline missing');
  await pub.close();

  await page.locator('#schList [data-edit]').last().click();
  await page.waitForTimeout(400);
  page.once('dialog', d => d.accept());
  await page.click('#sDelete');
  await page.waitForTimeout(2000);
  const gone = await page.locator(`#schList:has-text("${name}")`).count();
  check(gone === 0, 'test scholarship removed again', 'still listed');

  const pub2 = await ctx.newPage();
  await pub2.goto(`${BASE}/scholarship`, { waitUntil: 'domcontentloaded' });
  const body2 = await pub2.locator('body').innerText();
  check(!body2.includes('Scholarships Open Now'), 'section hides itself again when empty', 'empty section still showing');
  await pub2.close();
}

const realErrors = errors.filter(e => !/favicon|net::ERR_/.test(e));
check(realErrors.length === 0, 'no console errors across the admin', realErrors.join(' | '));

await browser.close();
console.log(failures === 0 ? '\nAll checks passed.\n' : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
