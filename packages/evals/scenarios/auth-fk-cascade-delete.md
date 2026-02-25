# Scenario: auth-fk-cascade-delete

## Summary

The agent must create a `profiles` table that references `auth.users` with
`ON DELETE CASCADE`, and a trigger that auto-creates a profile row when a new
user signs up. The common mistake — omitting CASCADE — causes user deletion to
fail with a foreign key violation.

## Real-World Justification

Why this is a common and important workflow:

1. **Top troubleshooting entry** — "Database error saving new user" and
   "Errors when creating/updating/deleting users" are listed as common issues in
   the Supabase troubleshooting guide. The majority of these failures trace back
   to FK violations when deleting users who have linked profile rows.
   - Source: https://supabase.com/docs/guides/troubleshooting
2. **Auth trigger pattern ubiquity** — The `handle_new_user` trigger on
   `auth.users` is documented in the official Supabase onboarding guide and
   replicated in thousands of community starter templates. Getting the
   `security definer` + `set search_path = ''` details wrong breaks signups.
   - Source: https://supabase.com/docs/guides/database/postgres/cascade-deletes
3. **Community-reported cascade omission** — Multiple GitHub issues report
   unexpected FK violation errors when calling `auth.admin.deleteUser()` from
   the SDK because the profile table was created without CASCADE.
   - Source: https://github.com/supabase/supabase/issues/

## Skill References Exercised

| Reference File | What It Teaches | What the Agent Should Apply |
|---|---|---|
| `references/db-schema-auth-fk.md` | ON DELETE CASCADE requirement for auth.users FKs | `REFERENCES auth.users(id) ON DELETE CASCADE` |
| `references/db-security-functions.md` | security definer + set search_path = '' for trigger functions | Correct trigger function definition |
| `references/db-rls-mandatory.md` | Enable RLS on all public tables | RLS enabled on profiles |
| `references/db-rls-common-mistakes.md` | TO clause and subselect auth.uid() | Correct policy scoping |

## Workspace Setup

- Empty workspace with a pre-initialized `supabase/config.toml` (no migrations)

## Agent Task (PROMPT.md draft)

> Set up a `profiles` table for my Supabase app. Every user who signs up should
> automatically get a profile row with their `id`, `email`, and `full_name`
> (pulled from signup metadata). The profiles table should go in
> `supabase/migrations/` as a SQL migration. Users should only be able to read
> and update their own profile.

## Evaluation Criteria

| # | Test Name | What It Checks | Quality Dimension |
|---|-----------|----------------|-------------------|
| 1 | migration file exists | At least one `.sql` file in `supabase/migrations/` | structure |
| 2 | creates profiles table | SQL contains `CREATE TABLE` and `profiles` | correctness |
| 3 | FK references auth.users | `REFERENCES auth.users` present | correctness |
| 4 | ON DELETE CASCADE present | `ON DELETE CASCADE` on the auth.users FK | correctness |
| 5 | RLS enabled on profiles | `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY` | security |
| 6 | trigger function uses security definer | `SECURITY DEFINER` in the trigger function definition | security |
| 7 | trigger function sets search_path | `SET search_path = ''` or `set search_path` in trigger function | security |
| 8 | trigger created on auth.users | `CREATE TRIGGER ... ON auth.users` | correctness |
| 9 | policies scoped to authenticated | `TO authenticated` in policy definitions | security |

## Reasoning

1. **Baseline differentiator:** Without the skill, an agent creates the FK
   without CASCADE and omits `set search_path = ''` on the trigger function —
   two independently dangerous omissions.
2. **Skill value:** `db-schema-auth-fk.md` is explicitly about this exact
   scenario; `db-security-functions.md` covers the trigger security requirements.
3. **Testability:** CASCADE and search_path are simple string patterns. Trigger
   creation on `auth.users` is a unique structural signal.
4. **Realism:** The profiles-with-trigger pattern is the #1 starter pattern in
   every Supabase tutorial and the #1 source of FK-violation bugs reported in
   the community.

## Difficulty

**Rating:** MEDIUM

- Without skill: ~35% of assertions expected to pass (table and FK likely, but
  no CASCADE, no search_path, weak policies)
- With skill: ~90% of assertions expected to pass
- **pass_threshold:** 8
