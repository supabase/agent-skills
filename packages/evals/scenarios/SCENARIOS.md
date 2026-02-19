# Supabase Skills Eval Scenarios

## Scenario 1: auth-rls-new-project

**Description:** Set up a new Supabase project from scratch and add
authentication with RLS. The agent must initialize the project with the CLI,
start the local Supabase stack, then create a tasks table with proper security
(RLS policies, auth FK, indexes) in a single idempotent migration.

**Setup:** The workspace starts empty (no `supabase/` directory). The agent is
expected to run `npx supabase init` and `npx supabase start` before creating
the migration.

**Expected skill files read:**

- `SKILL.md` (skill body with reference file index)
- `references/dev-getting-started.md`
- `references/db-rls-mandatory.md`
- `references/db-rls-policy-types.md`
- `references/db-rls-common-mistakes.md`
- `references/db-schema-auth-fk.md`
- `references/db-schema-timestamps.md`
- `references/db-migrations-idempotent.md`

**Expected result:**

The agent initializes a Supabase project and creates a migration file that:

- Creates tasks table with `timestamptz` columns
- Has `user_id` FK to `auth.users(id)` with `ON DELETE CASCADE`
- Enables RLS (`ALTER TABLE tasks ENABLE ROW LEVEL SECURITY`)
- Creates per-operation policies using `(select auth.uid())` with `TO authenticated`
- Creates index on `user_id`
- Uses `IF NOT EXISTS` for idempotency

**Scorer:** Binary pass/fail (12 vitest assertions)

| Test | What it checks |
| --- | --- |
| supabase project initialized | `supabase/config.toml` exists after agent runs |
| migration file exists | Agent created a `.sql` file in `supabase/migrations/` |
| creates tasks table | SQL contains `CREATE TABLE ... tasks` |
| enables RLS | `ALTER TABLE tasks ENABLE ROW LEVEL SECURITY` |
| FK to auth.users | `REFERENCES auth.users` |
| ON DELETE CASCADE | Cascade delete on auth FK |
| (select auth.uid()) | Subselect form in policies (performance) |
| TO authenticated | Policies scoped to authenticated role |
| timestamptz | No plain `timestamp` for time columns |
| index on user_id | `CREATE INDEX` on the FK column |
| IF NOT EXISTS | Idempotent migration |
| overall quality | At least 4/5 best-practice signals present |
