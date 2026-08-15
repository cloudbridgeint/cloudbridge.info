-- Which course an enquiry is actually about.
--
-- "Program Details" on /programs now carries ?course= and ?university= through
-- to the enquiry form, and a course page's CTA does the same. Without these
-- columns that context is thrown away at the form, and a counsellor opens a
-- lead knowing only that someone wants to study abroad — which is every lead.
--
-- Kept separate from subject_interested: that is the broad field a student
-- picks from a dropdown ("Business"), this is the specific course they were
-- reading when they decided to get in touch.

ALTER TABLE leads ADD COLUMN interested_course TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN interested_university TEXT DEFAULT '';
