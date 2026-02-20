# Scenario: team-rls-security-definer

## Summary

The agent must create a SQL migration for a team-based project management app
where users belong to organizations via a membership table. The migration must
define tables for organizations, memberships, and projects, then secure them
with RLS policies that use a `security definer` helper function in a private
schema to efficiently resolve team membership without per-row joins.

## Real-World Justification

Why this is a common and important workflow:

1. **Multi-tenant team access is the most-asked RLS question on Supabase** --
   The official Supabase GitHub has multiple high-engagement discussions about
   how to write RLS policies that check team/org membership without causing
   performance issues or security holes.
   - Source: https://github.com/supabase/supabase/discussions/4509
   - Source: https://github.com/supabase/supabase/discussions/811

2. **security_definer in public schema is a documented security anti-pattern** --
   Developers frequently place security_definer functions in the public schema,
   inadvertently exposing them via the PostgREST API. The Supabase docs and
   community discussions explicitly warn against this.
   - Source: https://github.com/supabase/supabase/discussions/3269
   - Source: https://supabase.com/docs/guides/database/postgres/row-level-security

3. **RLS policy performance with joins is a top pain point** -- Naive policies
   that join against a memberships table execute per-row, causing severe
   performance degradation. The recommended pattern is a security_definer
   function that caches results via subselect.
   - Source: https://github.com/orgs/supabase/discussions/1148
   - Source: https://makerkit.dev/blog/tutorials/supabase-rls-best-practices

## Skill References Exercised

Which reference files the agent should consult and what each teaches:

| Reference File | What It Teaches | What the Agent Should Apply |
|---|---|---|
| `references/db-rls-mandatory.md` | RLS must be enabled on all public tables | Enable RLS on organizations, memberships, and projects |
| `references/db-rls-policy-types.md` | PERMISSIVE vs RESTRICTIVE policies | Use PERMISSIVE policies for team OR owner access patterns |
| `references/db-rls-common-mistakes.md` | Missing TO clause, user_metadata pitfalls | Always use `TO authenticated` on all policies |
| `references/db-rls-performance.md` | Wrap auth.uid() in SELECT, use security_definer for joins | Use `(select auth.uid())` and a private-schema helper function |
| `references/db-security-functions.md` | security_definer in private schema with search_path = '' | Create helper function in private schema, revoke default permissions |
| `references/db-schema-auth-fk.md` | FK to auth.users with ON DELETE CASCADE | Reference auth.users with cascade on memberships |
| `references/db-schema-timestamps.md` | Use timestamptz not timestamp | All time columns use timestamptz |
| `references/db-perf-indexes.md` | Index columns used in RLS policies | Index user_id and org_id columns used in policy lookups |
| `references/db-migrations-idempotent.md` | IF NOT EXISTS for safe reruns | Idempotent DDL throughout the migration |

## Workspace Setup

What the workspace starts with before the agent runs:

- Pre-initialized Supabase project (`supabase/config.toml` exists)
- Empty `supabase/migrations/` directory
- The agent creates migration files within this structure

## Agent Task (PROMPT.md draft)

The prompt to give the agent. Written as a developer would ask it:

> I'm building a project management app where users can belong to multiple
> organizations. Each organization has projects that all members can view and
> edit.
>
> Create a SQL migration with:
>
> 1. An `organizations` table (name, slug)
> 2. A `memberships` table linking users to organizations with a role column
>    (owner, admin, member)
> 3. A `projects` table (name, description, status) belonging to an organization
>
> Set up Row Level Security so:
> - Users can only see organizations they belong to
> - Users can only see and manage projects in their organizations
> - Only org owners can delete projects
>
> The migration should handle the case where a user is deleted from auth.

## Evaluation Criteria

What vitest should assert on the agent's output. Each assertion tests a
specific quality signal:

| # | Test Name | What It Checks | Quality Dimension |
|---|-----------|----------------|-------------------|
| 1 | migration file exists | A `.sql` file exists in `supabase/migrations/` | structure |
| 2 | creates organizations table | SQL contains `CREATE TABLE` for organizations | correctness |
| 3 | creates memberships table | SQL contains `CREATE TABLE` for memberships | correctness |
| 4 | creates projects table | SQL contains `CREATE TABLE` for projects | correctness |
| 5 | enables RLS on all tables | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for all three tables | security |
| 6 | FK to auth.users with ON DELETE CASCADE | memberships references `auth.users` with cascade | correctness |
| 7 | org_id FK on projects | projects references organizations | correctness |
| 8 | private schema created | `CREATE SCHEMA ... private` present | security |
| 9 | security_definer helper function | A function in the private schema with `SECURITY DEFINER` and `SET search_path = ''` | security |
| 10 | policies use (select auth.uid()) | Subselect form in all policies referencing auth.uid() | performance |
| 11 | policies use TO authenticated | All policies scoped to authenticated role | security |
| 12 | index on membership lookup columns | `CREATE INDEX` on user_id and/or org_id in memberships | performance |
| 13 | uses timestamptz | No plain `timestamp` for time columns | correctness |
| 14 | idempotent DDL | Uses `IF NOT EXISTS` or `DROP ... IF EXISTS` patterns | idempotency |
| 15 | delete policy restricted to owner role | A delete policy on projects checks for owner/admin role | security |
| 16 | overall quality score | At least 10/14 best-practice signals present | overall |

## Reasoning

Step-by-step reasoning for why this scenario is well-designed:

1. **Baseline differentiator:** An agent without the skill would likely put the
   security_definer function in the public schema, omit `SET search_path = ''`,
   use bare `auth.uid()` instead of the subselect form, write inline joins in
   policies instead of using a helper function, and possibly forget `TO
   authenticated` on some policies. These are all patterns that require specific
   knowledge of Supabase conventions.

2. **Skill value:** The skill explicitly teaches: (a) private schema for
   security_definer functions, (b) `SET search_path = ''` to prevent injection,
   (c) `(select auth.uid())` for per-statement caching, (d) using
   security_definer functions to avoid per-row joins in policies, (e) `TO
   authenticated` on every policy. This is a scenario where reading 5+ reference
   files materially improves the output.

3. **Testability:** Every assertion checks for specific SQL patterns via regex.
   The private schema, security_definer, search_path, subselect auth.uid(), TO
   authenticated, indexes, and timestamptz are all reliably detectable in SQL
   text without runtime execution.

4. **Realism:** Multi-tenant team-based access control is one of the most common
   Supabase use cases. The GitHub discussions linked above have hundreds of
   comments from developers working on exactly this pattern. Project management
   apps (Notion, Linear, Asana clones) are a canonical example.

## Difficulty

**Rating:** MEDIUM

- Without skill: ~35-50% of assertions expected to pass
- With skill: ~85-95% of assertions expected to pass