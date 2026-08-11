# Operations

Everything needed to change this site without breaking it. Read the
**Landmines** section before your first edit — each one has already caused a
real failure at least once.

---

## Deploying safely

The live site rebuilds automatically on every push to `main`. There is no
approval step, so **treat a push to `main` as a deploy to production.**

The safe loop:

```bash
git checkout astro-migration      # never work directly on main
# ...make changes...
npm run build                     # must succeed locally first
git push origin astro-migration   # deploys to staging only

npm run verify -- --url https://cloudbridge-astro-staging.pages.dev

git checkout main && git merge --ff-only astro-migration && git push origin main
npm run verify                    # confirm production
```

`npm run verify` needs Playwright, which is deliberately **not** in
`package.json` (Cloudflare Pages runs `npm install` on every build, and
Playwright's postinstall downloads browser binaries). Install it once locally:

```bash
npm i -D playwright && npx playwright install chromium
```

Do not commit that dependency.

---

## Landmines

**Tailwind is compiled at build time, not loaded from a CDN.**
Classes only exist in the final CSS if the scanner finds them as complete
strings. `class="bg-sunrise-400"` is fine, and so is a ternary with whole class
names on both sides. A class assembled at runtime — `` `bg-${color}-500` `` —
will silently produce an unstyled element. Scanned paths are `./src/**/*` and
`./public/scripts/**/*.js` (see `tailwind.site.config.mjs` and
`tailwind.admin.config.mjs`). **A new JS file outside `public/scripts/` will not
be scanned.**

**The two Tailwind configs are not interchangeable.**
`bridge` and `sunrise` resolve to *different* hex values on the public site and
in the admin. Each stylesheet pins its own config with an `@config` line.

**Custom CSS can outrank Tailwind.**
An id selector such as `#myModal { display:flex }` beats `.hidden`, so a hidden
element stays on screen and can swallow every click on the page. If something
becomes unclickable, look for a full-screen element with a specificity conflict.

**Status codes lie.**
A page can return 200 and still be broken. Check rendered geometry and console
errors, not just the status — that is what `npm run verify` does.

**The zone serves a Cloudflare-managed `robots.txt`.**
`public/robots.txt` works on `*.pages.dev` but is overridden on
cloudbridge.info. Do not rely on a `Disallow` rule there; the admin area is kept
out of search with an `X-Robots-Tag` header in `src/middleware.ts` instead.

**Staging and production use separate databases.** See IDs below. Content was
copied to staging; real leads, chat and visits were not, on purpose — student
personal data should not be duplicated into a test environment.

---

## Public endpoints

These are reachable without a login and are guarded in `src/lib/guards.ts`:

| Endpoint | Limit per IP |
|---|---|
| `POST /api/leads` | 20 / hour |
| `POST /api/upload` | 30 / hour |
| `POST /api/chat/upload` | 40 / hour |
| `POST /api/chat/send` | 60 / hour |
| `POST /api/login` | 8 failures / 15 min, then locked |

Uploads accept images, PDF and Word only (plus audio for chat), and the file
extension must agree with the declared type. `/api/media/:id` only serves a type
inline when it cannot execute; anything else is sent as a download with
`nosniff`. **Do not add `text/html` or `image/svg+xml` to the allowlist** —
either one lets an uploader run script on this origin, where an admin's session
lives.

Every rate-limit database call is best-effort: if D1 errors, the request is
allowed rather than taking a public form offline.

---

## Recovery

**Roll back a bad deploy** — Cloudflare Pages → `cloudbridge-info` →
Deployments → pick the last good one → *Rollback*. This is instant and does not
need a git revert. The pre-Astro site is deployment
`bdcfa21f-185c-4a3a-9722-ca5be31e5831`.

**Restore the database** — D1 Time Travel gives point-in-time restore; check the
current retention window in the dashboard. A bookmark identifies a moment to
restore to:

```bash
# current bookmark
curl "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/d1/database/$DB/time_travel/bookmark" \
  -H "Authorization: Bearer $TOKEN"
```

Take an export before any bulk data change.

---

## Key identifiers

| | |
|---|---|
| Live site | https://cloudbridge.info (Pages project `cloudbridge-info`, branch `main`) |
| Staging | https://cloudbridge-astro-staging.pages.dev (project `cloudbridge-astro-staging`, branch `astro-migration`) |
| Live database | `cloudbridge-cms` — `15075c9a-5374-48f9-840b-5172ec4d969d` |
| Staging database | `cloudbridge-cms-staging` — `bfce5737-e546-447e-a375-fb77ce7882ce` |
| Admin | https://cloudbridge.info/cbc-admin |

`wrangler.toml` names the *staging* project and exists for local development
(`wrangler pages dev`). Cloudflare Pages ignores it because it has no
`pages_build_output_dir`; build settings come from the dashboard. Do not rely on
it for production configuration.

---

## Still outstanding

- **About → "Our Company History"** carries a note calling the timeline
  illustrative. Confirm the real dates and remove the note, or remove the
  section — it currently presents unverified milestones as fact.
- **Homepage student video testimonials were removed** — they used invented
  names and a placeholder video id. Restore with real clips and real consent.
- **Submit the sitemap** (`/sitemap.xml`) in Google Search Console; the managed
  `robots.txt` means crawlers may not discover it on their own.
