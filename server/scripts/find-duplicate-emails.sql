-- Run this against your production database BEFORE `npm run db:push`.
--
-- Why: users.email used to have a plain, case-sensitive unique constraint,
-- so "John@gmail.com" and "john@gmail.com" could have been created as two
-- separate accounts. The new schema adds a case-insensitive unique index
-- instead — but Postgres will refuse to create that index if any such
-- duplicates already exist. This query finds them first.
--
-- If it returns zero rows: you're clear, just run `npm run db:push` as usual.
--
-- If it returns rows: for each group, decide which account is the "real"
-- one to keep (usually the older / more active one — check donations,
-- volunteer status, etc. tied to each id), then either:
--   a) manually re-point that user's donations/cases/volunteer rows to the
--      account you're keeping and delete the duplicate, or
--   b) ask the affected person which account they've actually been using.
-- Only after every duplicate is resolved will `npm run db:push` succeed.

SELECT
  lower(email) AS normalized_email,
  array_agg(id) AS account_ids,
  array_agg(email) AS as_stored,
  array_agg(created_at ORDER BY created_at) AS created_at,
  count(*) AS how_many
FROM users
GROUP BY lower(email)
HAVING count(*) > 1;
