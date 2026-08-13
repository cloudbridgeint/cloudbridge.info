-- Profile fields for university pages.
--
-- The directory held only what the filters need — country, city, fee band,
-- intakes. A profile page needs the things a student actually reads before
-- choosing, so those columns are added here rather than squeezed into the
-- existing ones.
--
-- On sourcing: `website` and `source_url` point at the university's own pages,
-- and `last_verified_at` records when a person last checked them. Fees, intakes
-- and entry requirements move, and only the university's own page is
-- authoritative — so the profile says when it was checked and links to where
-- to confirm, rather than presenting a figure as though it were permanent.

ALTER TABLE university_directory ADD COLUMN slug TEXT DEFAULT '';
ALTER TABLE university_directory ADD COLUMN website TEXT DEFAULT '';
ALTER TABLE university_directory ADD COLUMN founded TEXT DEFAULT '';
ALTER TABLE university_directory ADD COLUMN overview TEXT DEFAULT '';
ALTER TABLE university_directory ADD COLUMN rankings_note TEXT DEFAULT '';
ALTER TABLE university_directory ADD COLUMN services TEXT DEFAULT '';
ALTER TABLE university_directory ADD COLUMN student_life TEXT DEFAULT '';
ALTER TABLE university_directory ADD COLUMN accommodation TEXT DEFAULT '';
ALTER TABLE university_directory ADD COLUMN source_url TEXT DEFAULT '';
ALTER TABLE university_directory ADD COLUMN last_verified_at TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_university_directory_slug ON university_directory(slug);
