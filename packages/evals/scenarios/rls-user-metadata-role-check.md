# Scenario: rls-user-metadata-role-check

## Summary

The agent must write a migration for a `documents` table where admin users can
read all documents and regular users can only read their own. The dangerous
trap is checking `user_metadata` for the admin role — users can write to their
own `user_metadata`, so this check is bypassable. The correct pattern uses
`app_metadata`.

## Real-World Justification

Why this is a common and important workflow:

1. **Explicit troubleshooting + security entry** — The Supabase troubleshooting
   guide covers "Database API 42501 errors" related to auth claims and RLS.
   Using user_metadata for authorization is one of the most dangerous patterns,
   documented as a common mistake in the Supabase RLS guides.
   - Source: https://supabase.com/docs/guides/troubleshooting
2. **Privilege escalation vulnerability** — Any authenticated user can call
   `supabase.auth.updateUser({ data: { role: 'admin' } })` to set their own
   `user_metadata`. An RLS policy checking `user_metadata->>'role' = 'admin'`
   gives every user admin access to all documents.
   - Source: https://supabase.com/docs/guides/database/postgres/row-level-security
3. **app_metadata is server-only** — `app_metadata` can only be set via the
   Admin API or auth hooks, making it safe for authorization. This distinction
   is taught in the skill but frequently missed by developers.
   - Source: https://supabase.com/docs/guides/auth/managing-user-data

## Skill References Exercised

| Reference File | What It Teaches | What the Agent Should Apply |
|---|---|---|
| `references/db-rls-common-mistakes.md` | app_metadata not user_metadata for authorization | `auth.jwt() -> 'app_metadata' ->> 'role'` |
| `references/db-rls-policy-types.md` | PERMISSIVE policies combine with OR; multiple policies for different roles | Separate owner and admin policies |
| `references/db-rls-performance.md` | (select auth.uid()) subquery; (select auth.jwt()) caching | Subselect form for JWT lookups |
| `references/db-rls-mandatory.md` | RLS enabled, TO authenticated | Full boilerplate |
| `references/db-schema-auth-fk.md` | FK to auth.users with CASCADE | Correct user linkage |

## Workspace Setup

- Empty workspace with a pre-initialized `supabase/config.toml` (no migrations)

## Agent Task (PROMPT.md draft)

> Create a migration for a `documents` table. Each document has a `title`
> (text), `content` (text), and an owner. Regular users can only see their own
> documents. Admin users (identified by a role field in their JWT) should be
> able to see all documents. Put the migration in `supabase/migrations/`.

## Evaluation Criteria

| # | Test Name | What It Checks | Quality Dimension |
|---|-----------|----------------|-------------------|
| 1 | migration file exists | At least one `.sql` file in `supabase/migrations/` | structure |
| 2 | creates documents table | SQL contains `CREATE TABLE` and `documents` | correctness |
| 3 | RLS enabled | `ALTER TABLE documents ENABLE ROW LEVEL SECURITY` | security |
| 4 | uses app_metadata not user_metadata | JWT role check uses `app_metadata` not `user_metadata` | security |
| 5 | no user_metadata role check | `user_metadata` does not appear in policy USING clauses | security |
| 6 | two separate policies or one covering both | At least one SELECT policy for owner and one for admin role | correctness |
| 7 | TO authenticated on all policies | `TO authenticated` in every policy | security |
| 8 | (select auth.uid()) subselect form | Subselect form used not bare auth.uid() | performance |
| 9 | FK to auth.users with CASCADE | `REFERENCES auth.users ... ON DELETE CASCADE` | correctness |

## Reasoning

1. **Baseline differentiator:** Agents without the skill almost universally
   reach for `user_metadata` when asked about "a role field in their JWT" —
   it is the more discoverable but dangerous field. Only the skill explicitly
   flags this as an authorization anti-pattern.
2. **Skill value:** `db-rls-common-mistakes.md` section 2 directly addresses
   this with the exact `app_metadata` pattern.
3. **Testability:** Checking for `app_metadata` presence and `user_metadata`
   absence in policy USING clauses is a precise regex assertion.
4. **Realism:** Role-based access in a multi-tenant app is one of the most
   common RLS patterns requested, and the metadata confusion is universal.

## Difficulty

**Rating:** MEDIUM

- Without skill: ~30% of assertions expected to pass (table and RLS likely,
  but user_metadata used, subselect missing)
- With skill: ~90% of assertions expected to pass
- **pass_threshold:** 8
