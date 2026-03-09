-- ============================================================
-- Evizz Dashboard — Clear ALL seed/dummy data
-- Run this in your Supabase project's SQL Editor
-- ============================================================

-- Order matters: delete child rows (events) before parents
delete from events;
delete from persons;
delete from cameras;
