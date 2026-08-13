-- More of a profile than the first pass allowed.
--
-- The reference profiles students compare us against carry roughly twice what
-- we had: why the place is worth choosing, what it takes to get in, what
-- funding exists, and what the campus actually gives you. Those are separate
-- columns rather than one long overview so each can be edited, left empty, or
-- checked on its own.

ALTER TABLE university_directory ADD COLUMN why_choose TEXT DEFAULT '';
ALTER TABLE university_directory ADD COLUMN entry_requirements TEXT DEFAULT '';
ALTER TABLE university_directory ADD COLUMN scholarships_info TEXT DEFAULT '';
ALTER TABLE university_directory ADD COLUMN facilities TEXT DEFAULT '';
ALTER TABLE university_directory ADD COLUMN student_count TEXT DEFAULT '';
ALTER TABLE university_directory ADD COLUMN international_count TEXT DEFAULT '';
