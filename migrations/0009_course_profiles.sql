-- Course detail pages at /courses/<university-slug>/<course-slug>.
--
-- Until now a course was nine columns of metadata — enough for a filter row on
-- /programs, nothing a student could read. "Program Details" pointed at the
-- homepage lead form, so eighty courses produced no indexable page at all.
--
-- These columns hold the content a detail page needs. The important one is
-- `published`: it defaults to 0, so adding a column here does not put eighty
-- near-identical pages online. A course appears only once someone has written
-- its content and ticked it live. Course names repeat across universities
-- ("BA Business Management" is at both Aston and Arden), so thin pages here
-- would read as duplicates to a crawler and drag the whole domain, not just
-- the course URLs.
--
-- Fees and entry requirements move every cycle and only the university's own
-- page is authoritative, so each course records where it came from and when it
-- was last checked, exactly as university_directory already does.

ALTER TABLE courses ADD COLUMN slug TEXT DEFAULT '';
ALTER TABLE courses ADD COLUMN credential TEXT DEFAULT '';
ALTER TABLE courses ADD COLUMN overview TEXT DEFAULT '';
ALTER TABLE courses ADD COLUMN entry_requirements TEXT DEFAULT '';
ALTER TABLE courses ADD COLUMN english_requirements TEXT DEFAULT '';
ALTER TABLE courses ADD COLUMN tuition_fee TEXT DEFAULT '';
ALTER TABLE courses ADD COLUMN tuition_note TEXT DEFAULT '';
ALTER TABLE courses ADD COLUMN scholarships_info TEXT DEFAULT '';
ALTER TABLE courses ADD COLUMN intakes TEXT DEFAULT '';
ALTER TABLE courses ADD COLUMN modules TEXT DEFAULT '';
ALTER TABLE courses ADD COLUMN careers TEXT DEFAULT '';
ALTER TABLE courses ADD COLUMN how_to_apply TEXT DEFAULT '';
ALTER TABLE courses ADD COLUMN faq TEXT DEFAULT '';
ALTER TABLE courses ADD COLUMN source_url TEXT DEFAULT '';
ALTER TABLE courses ADD COLUMN last_verified_at TEXT DEFAULT '';
ALTER TABLE courses ADD COLUMN published INTEGER DEFAULT 0;

-- Slugs are backfilled from the course name in application code (SQLite has no
-- usable slugify), then locked down: two courses at the same university may not
-- share a URL. The same name at a *different* university is fine and expected.
CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_uni_slug ON courses(university, slug);
