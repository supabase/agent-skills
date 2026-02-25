# Scenario: auth-rls-new-project

## Summary

The agent must set up a new Supabase project from scratch and add
authentication with RLS. It must initialize the project with the CLI, start
the local Supabase stack, then create a tasks table with proper security (RLS
policies, auth FK, indexes) in a single idempotent migration.

## Real-World Justification

Why this is a common and important workflow:

1. **Project initialization + first migration is the canonical onboarding
   workflow** -- The Supabase getting started guide walks developers through
   `supabase init`, `supabase start`, and creating their first migration. This
   is the first thing every new Supabase developer does.
   - Source: https://supabase.com/docs/guides/local-development/cli/getting-started

2. **RLS is the most common security question for new Supabase users** --
   Developers frequently forget to enable RLS, use incorrect policy syntax, or
   omit the `TO authenticated` clause. The Supabase docs and community
   discussions repeatedly emphasize that RLS must be enabled on every public
   table.
   - Source: https://supabase.com/docs/guides/database/postgres/row-level-security
   - Source: https://github.com/orgs/supabase/discussions/811

3. **Auth FK and cascade deletes are a frequent source of bugs** -- Developers
   often reference `auth.users` incorrectly or forget `ON DELETE CASCADE`,
   leading to orphaned rows when users are deleted from auth.
   - Source: https://supabase.com/docs/guides/auth/managing-user-data

## Skill References Exercised

Which reference files the agent should consult and what each teaches:

| Reference File | What It Teaches | What the Agent Should Apply |
|---|---|---|
| `references/dev-getting-started.md` | `npx supabase init`, `npx supabase start`, project structure | Initialize the project and start the local stack |
| `references/db-rls-mandatory.md` | RLS must be enabled on all public tables | Enable RLS on the tasks table |
| `references/db-rls-policy-types.md` | PERMISSIVE vs RESTRICTIVE, per-operation policies | Create separate SELECT, INSERT, UPDATE, DELETE policies |
| `references/db-rls-common-mistakes.md` | Missing TO clause, user_metadata pitfalls | Always use `TO authenticated` on all policies |
| `references/db-schema-auth-fk.md` | FK to auth.users with ON DELETE CASCADE | Reference auth.users with cascade on user_id |
| `references/db-schema-timestamps.md` | Use timestamptz not timestamp | All time columns use timestamptz |
| `references/db-migrations-idempotent.md` | IF NOT EXISTS for safe reruns | Idempotent DDL throughout the migration |

## Workspace Setup

What the workspace starts with before the agent runs:

- Empty workspace (no `supabase/` directory)
- The agent is expected to run `npx supabase init` and `npx supabase start`
  before creating the migration

## Agent Task (PROMPT.md draft)

The prompt to give the agent. Written as a developer would ask it:

> I'm starting a new Supabase project. Initialize the project, start the local
> dev stack, and create a migration for a `tasks` table.
>
> The tasks table should have:
> - A title (text)
> - A status column (e.g., pending, in_progress, done)
> - Timestamps for created and updated
> - A reference to the authenticated user who owns the task
>
> Set up Row Level Security so users can only see and manage their own tasks.
> The migration should be safe to run multiple times.

## Evaluation Criteria

What vitest should assert on the agent's output. Each assertion tests a
specific quality signal:

| # | Test Name | What It Checks | Quality Dimension |
|---|-----------|----------------|-------------------|
| 1 | supabase project initialized | `supabase/config.toml` exists after agent runs | structure |
| 2 | migration file exists | Agent created a `.sql` file in `supabase/migrations/` | structure |
| 3 | creates tasks table | SQL contains `CREATE TABLE ... tasks` | correctness |
| 4 | enables RLS | `ALTER TABLE tasks ENABLE ROW LEVEL SECURITY` | security |
| 5 | FK to auth.users | `REFERENCES auth.users` | correctness |
| 6 | ON DELETE CASCADE | Cascade delete on auth FK | correctness |
| 7 | (select auth.uid()) | Subselect form in policies (performance) | performance |
| 8 | TO authenticated | Policies scoped to authenticated role | security |
| 9 | timestamptz | No plain `timestamp` for time columns | correctness |
| 10 | index on user_id | `CREATE INDEX` on the FK column | performance |
| 11 | no SERIAL/BIGSERIAL | PK does not use error-prone serial type | correctness |
| 12 | IF NOT EXISTS | Idempotent migration | idempotency |
| 13 | overall quality | At least 4/5 best-practice signals present | overall |

## Reasoning

Step-by-step reasoning for why this scenario is well-designed:

1. **Baseline differentiator:** An agent without the skill would likely: (a)
   skip `supabase start` or misconfigure the init step, (b) use plain
   `timestamp` instead of `timestamptz`, (c) use bare `auth.uid()` instead of
   the subselect form `(select auth.uid())`, (d) forget the `TO authenticated`
   clause on policies, (e) omit `ON DELETE CASCADE` on the auth FK, (f) skip
   creating an index on `user_id`. These are Supabase-specific best practices
   that require reading the skill references.

2. **Skill value:** The getting-started reference teaches the CLI workflow. The
   RLS references teach mandatory enablement, per-operation policies, and the
   `TO authenticated` clause. The schema references teach `timestamptz` and
   auth FK patterns. The migrations reference teaches idempotent DDL. Together
   these 7 reference files cover every assertion.

3. **Testability:** All assertions are file-existence checks or regex/string
   matches on SQL text. `config.toml` existence, `CREATE TABLE`, `ENABLE ROW
   LEVEL SECURITY`, `REFERENCES auth.users`, `ON DELETE CASCADE`,
   `(select auth.uid())`, `TO authenticated`, `timestamptz`, `CREATE INDEX`,
   and `IF NOT EXISTS` are all reliably detectable patterns.

4. **Realism:** Setting up a new project with a user-owned tasks table is the
   most common Supabase tutorial pattern. It covers the complete onboarding
   workflow from zero to a secured table.

## Difficulty

**Rating:** EASY

- Without skill: ~50-65% of assertions expected to pass
- With skill: ~90-100% of assertions expected to pass
- **pass_threshold:** 10