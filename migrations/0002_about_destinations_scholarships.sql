-- Editable content for the About, Destinations and Scholarship pages.
--
-- Three shapes, because the pages need three different things:
--   page_items   repeatable list rows (skills, reasons, timeline, funding
--                types, steps, FAQ entries) that share one editor and one API
--   destinations one row per country guide, replacing src/data/destinations.ts
--   scholarships individual named awards, which the site could not list before
--
-- Arrays are stored as JSON text. D1 is SQLite: a child table per array would
-- mean five extra tables and a join for every page render, and these arrays are
-- only ever read and written whole.

CREATE TABLE IF NOT EXISTS page_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  group_key   TEXT NOT NULL,   -- e.g. 'about.skills', 'scholarship.types'
  title       TEXT,
  subtitle    TEXT,            -- year, step label, or badge text
  body        TEXT,
  icon        TEXT,            -- key into the fixed icon set in src/lib/icons.ts
  image       TEXT,            -- 'media:<id>' or a path under /assets
  link_url    TEXT,
  link_label  TEXT,
  accent      TEXT,            -- key into a fixed colour map, never a raw class
  sort_order  INTEGER DEFAULT 0,
  active      INTEGER DEFAULT 1,
  created_at  TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_page_items_group ON page_items(group_key, sort_order);

CREATE TABLE IF NOT EXISTS destinations (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  slug           TEXT NOT NULL UNIQUE,   -- /destinations/study-in-<slug>
  country        TEXT NOT NULL,          -- 'the United Kingdom'
  short          TEXT NOT NULL,          -- 'UK'
  flag           TEXT,
  tagline        TEXT,
  answer         TEXT,                   -- the 40-60 word standalone answer
  intro          TEXT,
  why            TEXT,                   -- JSON array of strings
  tuition        TEXT,
  living         TEXT,
  currency       TEXT,
  intakes        TEXT,
  work_rights    TEXT,
  post_study     TEXT,
  english_req    TEXT,
  academic_req   TEXT,
  visa_name      TEXT,
  visa_steps     TEXT,                   -- JSON array of strings
  scholarships   TEXT,                   -- JSON array of strings
  universities   TEXT,                   -- JSON array of strings
  official_label TEXT,
  official_url   TEXT,
  faqs           TEXT,                   -- JSON array of { q, a }
  card_image     TEXT,
  gradient       TEXT,                   -- '#2e4a7a,#4d70a8' — validated on read
  sort_order     INTEGER DEFAULT 0,
  active         INTEGER DEFAULT 1,
  created_at     TEXT DEFAULT (datetime('now')),
  updated_at     TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_destinations_active ON destinations(active, sort_order);

CREATE TABLE IF NOT EXISTS scholarships (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  provider    TEXT,
  country     TEXT,
  level       TEXT,          -- Bachelor's / Master's / PhD / Any
  amount      TEXT,          -- free text: 'Full tuition + stipend', '£5,000'
  coverage    TEXT,          -- Full / Partial / Tuition only / Living costs
  deadline    TEXT,
  eligibility TEXT,
  description TEXT,
  apply_url   TEXT,
  logo        TEXT,
  featured    INTEGER DEFAULT 0,
  sort_order  INTEGER DEFAULT 0,
  active      INTEGER DEFAULT 1,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_scholarships_active ON scholarships(active, sort_order);
