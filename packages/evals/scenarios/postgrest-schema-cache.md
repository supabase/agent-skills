# Scenario: postgrest-schema-cache

## Summary

The agent must create a migration that adds new columns to an existing table
and create a view that uses those columns, including the correct `NOTIFY
pgrst, 'reload schema'` call to force PostgREST to pick up the schema changes.
Without this, the API returns 400 errors for the new columns even after
migration.

## Real-World Justification

Why this is a common and important workflow:

1. **Direct troubleshooting entry** — "PostgREST not recognizing new columns,
   tables, views or functions" and "Reload/refresh postgrest schema" (400
   bad_request error) are explicitly listed in the Supabase troubleshooting
   guide. This is among the most confusing errors for new Supabase developers —
   the migration ran successfully but the API still returns errors.
   - Source: https://supabase.com/docs/guides/troubleshooting
2. **Schema cache invalidation** — PostgREST caches the database schema at
   startup and reloads it only when notified. Migrations that add new objects
   must explicitly call `NOTIFY pgrst, 'reload schema'` at the end of the
   migration file for the changes to be reflected immediately in local
   development.
   - Source: https://supabase.com/docs/guides/api/rest/generating-types
3. **Views and RLS** — Creating a view over a user-owned table requires
   understanding that RLS applies to the underlying tables, and the view itself
   should use `security_invoker = true` to preserve RLS context.
   - Source: https://supabase.com/docs/guides/database/views

## Skill References Exercised

| Reference File | What It Teaches | What the Agent Should Apply |
|---|---|---|
| `references/db-rls-views.md` | Views need security_invoker to respect RLS | `WITH (security_invoker = true)` on view |
| `references/db-migrations-idempotent.md` | ADD COLUMN IF NOT EXISTS; IF NOT EXISTS patterns | Idempotent column additions |
| `references/db-rls-mandatory.md` | RLS on base tables | RLS enabled on base table |
| `references/db-rls-performance.md` | (select auth.uid()) subselect | Subselect form in policies |
| `references/db-schema-timestamps.md` | timestamptz for new columns | timestamptz on added columns |

## Workspace Setup

- A workspace with `supabase/config.toml` and a starter migration that creates
  a basic `products` table (id, name, price) with RLS enabled but no policies.

## Agent Task (PROMPT.md draft)

> Our `products` table needs two new columns: `description` (text) and
> `published_at` (timestamp). Also create a view called `public_products` that
> shows only products where `published_at` is not null. Add a policy so any
> authenticated user can view published products. Put changes in a new
> migration file in `supabase/migrations/`.

## Evaluation Criteria

| # | Test Name | What It Checks | Quality Dimension |
|---|-----------|----------------|-------------------|
| 1 | new migration file exists | A second `.sql` file in `supabase/migrations/` | structure |
| 2 | ADD COLUMN IF NOT EXISTS for description | `ADD COLUMN IF NOT EXISTS description` | idempotency |
| 3 | ADD COLUMN IF NOT EXISTS for published_at | `ADD COLUMN IF NOT EXISTS published_at` | idempotency |
| 4 | published_at uses timestamptz | `published_at timestamptz` not plain `timestamp` | correctness |
| 5 | view created | `CREATE OR REPLACE VIEW public_products` or similar | correctness |
| 6 | view uses security_invoker | `security_invoker = true` on the view | security |
| 7 | SELECT policy on products for authenticated | A FOR SELECT policy on products with TO authenticated | security |
| 8 | NOTIFY pgrst reload present | `NOTIFY pgrst` in the migration | correctness |

## Reasoning

1. **Baseline differentiator:** Agents without the skill add columns correctly
   but miss `IF NOT EXISTS`, use plain `timestamp`, forget `security_invoker`
   on the view, and almost never include the `NOTIFY pgrst` call.
2. **Skill value:** The NOTIFY pattern and security_invoker requirement are
   non-obvious details that the reference files teach explicitly.
3. **Testability:** `NOTIFY pgrst` is a unique string that either appears or
   doesn't; `security_invoker` is similarly specific.
4. **Realism:** Iterative schema evolution (adding columns to existing tables)
   is the most common database task after initial setup, and the PostgREST
   cache invalidation issue is a universal source of confusion.

## Difficulty

**Rating:** MEDIUM

- Without skill: ~40% of assertions expected to pass (columns added and view
  created, but no IF NOT EXISTS, wrong timestamp type, no NOTIFY, no
  security_invoker)
- With skill: ~88% of assertions expected to pass
- **pass_threshold:** 7
