# Scenario: rls-update-needs-select

## Summary

The agent must write a migration for an `orders` table where users can view and
update only their own orders. The classic trap is writing an UPDATE policy
without a matching SELECT policy — causing UPDATE to silently affect zero rows
because RLS cannot find any rows to update.

## Real-World Justification

Why this is a common and important workflow:

1. **"Why is my UPDATE returning empty data?"** — The Supabase troubleshooting
   guide lists "Why is my select returning an empty data array and I have data
   in the table?" which is the same root symptom. UPDATE with no SELECT policy
   silently returns `{data: [], count: 0}` with no error, making it extremely
   hard to diagnose.
   - Source: https://supabase.com/docs/guides/troubleshooting
2. **Documented RLS behavior** — The official RLS docs state that UPDATE
   requires a SELECT policy to identify which rows are accessible for
   modification. This is non-obvious and contradicts most developers'
   expectations from SQL semantics.
   - Source: https://supabase.com/docs/guides/database/postgres/row-level-security
3. **WITH CHECK requirement** — An UPDATE policy also needs a `WITH CHECK`
   clause to prevent users from updating a row to a state that would no longer
   be visible to them (e.g., changing their own `user_id`). Missing this allows
   data ownership hijacking.
   - Source: https://supabase.com/docs/guides/database/postgres/row-level-security

## Skill References Exercised

| Reference File | What It Teaches | What the Agent Should Apply |
|---|---|---|
| `references/db-rls-common-mistakes.md` | UPDATE needs a SELECT policy; WITH CHECK clause | Separate SELECT and UPDATE policies, WITH CHECK |
| `references/db-rls-policy-types.md` | USING vs WITH CHECK semantics | WITH CHECK on UPDATE policy |
| `references/db-rls-performance.md` | (select auth.uid()) subquery caching | Subselect form in all USING/WITH CHECK |
| `references/db-rls-mandatory.md` | Enable RLS, TO authenticated | Full mandatory boilerplate |
| `references/db-schema-timestamps.md` | timestamptz for time columns | timestamptz not timestamp |

## Workspace Setup

- Empty workspace with a pre-initialized `supabase/config.toml` (no migrations)

## Agent Task (PROMPT.md draft)

> Create a migration for an `orders` table. Each order has a `status` (text),
> `total` (numeric), and `created_at`. Orders belong to users. Users should be
> able to view their own orders and update the status of their own orders.
> Put the migration in `supabase/migrations/`.

## Evaluation Criteria

| # | Test Name | What It Checks | Quality Dimension |
|---|-----------|----------------|-------------------|
| 1 | migration file exists | At least one `.sql` file in `supabase/migrations/` | structure |
| 2 | creates orders table | SQL contains `CREATE TABLE` and `orders` | correctness |
| 3 | RLS enabled | `ALTER TABLE orders ENABLE ROW LEVEL SECURITY` | security |
| 4 | has SELECT policy | A `FOR SELECT` policy exists on orders | correctness |
| 5 | has UPDATE policy with WITH CHECK | A `FOR UPDATE` policy with `WITH CHECK` clause exists | correctness |
| 6 | all policies TO authenticated | Every `CREATE POLICY` has `TO authenticated` | security |
| 7 | uses (select auth.uid()) | Subselect form in policy USING clauses | performance |
| 8 | uses timestamptz not timestamp | `created_at timestamptz` not plain `timestamp` | correctness |
| 9 | FK to auth.users with CASCADE | `REFERENCES auth.users ... ON DELETE CASCADE` | correctness |

## Reasoning

1. **Baseline differentiator:** Without the skill, agents write only an UPDATE
   policy (or a single ALL policy), skip WITH CHECK, and use bare `auth.uid()`
   calls. The result is a migration that looks complete but breaks silently.
2. **Skill value:** `db-rls-common-mistakes.md` explicitly covers this
   UPDATE-needs-SELECT behavior with working examples.
3. **Testability:** The presence of both `FOR SELECT` and `FOR UPDATE` with
   `WITH CHECK` is directly detectable via regex on the SQL.
4. **Realism:** "My UPDATE isn't working, returns empty" is among the most
   common questions from developers new to RLS in the Supabase community.

## Difficulty

**Rating:** MEDIUM

- Without skill: ~40% of assertions expected to pass (table and RLS likely,
  but wrong policy structure)
- With skill: ~92% of assertions expected to pass
- **pass_threshold:** 8
