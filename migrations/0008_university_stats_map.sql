-- The stats row and the map on a university profile.
--
-- QS already lives in `ranking`. Guardian and THE are separate tables with
-- separate positions, so they get their own columns rather than being crammed
-- into one string — and they stay empty until someone has actually checked
-- them. A profile that prints "Not Rated" in three boxes looks unfinished;
-- one that shows only what is known looks deliberate.
--
-- `map_query` is what gets sent to the map. Defaulting to the name plus the
-- city resolves correctly for almost every institution, and it is editable for
-- the ones where it does not.

ALTER TABLE university_directory ADD COLUMN ranking_guardian TEXT DEFAULT '';
ALTER TABLE university_directory ADD COLUMN ranking_the TEXT DEFAULT '';
ALTER TABLE university_directory ADD COLUMN map_query TEXT DEFAULT '';
