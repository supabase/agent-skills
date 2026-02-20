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

## Scenario 2: team-rls-security-definer

**Description:** Create a SQL migration for a team-based project management app
where users belong to organizations via a membership table. The migration must
define tables for organizations, memberships, and projects, then secure them
with RLS policies that use a `security definer` helper function in a private
schema to efficiently resolve team membership without per-row joins.

**Setup:** The workspace starts with a pre-initialized Supabase project
(`supabase/config.toml` exists, empty `supabase/migrations/` directory). The
agent creates migration files within this structure.

**Expected skill files read:**

- `SKILL.md` (skill body with reference file index)
- `references/db-rls-mandatory.md`
- `references/db-rls-policy-types.md`
- `references/db-rls-common-mistakes.md`
- `references/db-rls-performance.md`
- `references/db-security-functions.md`
- `references/db-schema-auth-fk.md`
- `references/db-schema-timestamps.md`
- `references/db-perf-indexes.md`
- `references/db-migrations-idempotent.md`

**Expected result:**

The agent creates a migration file that:

- Creates organizations, memberships, and projects tables with `timestamptz` columns
- Has `user_id` FK to `auth.users(id)` with `ON DELETE CASCADE` on memberships
- Has `org_id` FK on projects referencing organizations
- Enables RLS on all three tables
- Creates a private schema with a `security definer` helper function (`SET search_path = ''`)
- Creates RLS policies using `(select auth.uid())` with `TO authenticated`
- Creates indexes on membership lookup columns (user_id, org_id)
- Has a delete policy on projects restricted to owner role
- Uses `IF NOT EXISTS` for idempotency

**Scorer:** Binary pass/fail (16 vitest assertions)

| Test | What it checks |
| --- | --- |
| migration file exists | A `.sql` file exists in `supabase/migrations/` |
| creates organizations table | SQL contains `CREATE TABLE` for organizations |
| creates memberships table | SQL contains `CREATE TABLE` for memberships |
| creates projects table | SQL contains `CREATE TABLE` for projects |
| enables RLS on all tables | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for all three tables |
| FK to auth.users with ON DELETE CASCADE | memberships references `auth.users` with cascade |
| org_id FK on projects | projects references organizations |
| private schema created | `CREATE SCHEMA ... private` present |
| security_definer helper function | Function in private schema with `SECURITY DEFINER` and `SET search_path = ''` |
| policies use (select auth.uid()) | Subselect form in all policies referencing auth.uid() |
| policies use TO authenticated | All policies scoped to authenticated role |
| index on membership lookup columns | `CREATE INDEX` on user_id and/or org_id in memberships |
| uses timestamptz | No plain `timestamp` for time columns |
| idempotent DDL | Uses `IF NOT EXISTS` or `DROP ... IF EXISTS` patterns |
| delete policy restricted to owner role | A delete policy on projects checks for owner/admin role |
| overall quality score | At least 10/14 best-practice signals present |

## Scenario 3: storage-rls-user-folders

**Description:** Create a SQL migration that sets up Supabase Storage buckets
with RLS policies for user-content. An avatars bucket (public reads,
authenticated uploads restricted to user folders) and a documents bucket (fully
private, user-isolated), with file type restrictions, storage helper functions
in policies, and a file_metadata tracking table secured with RLS.

**Setup:** Pre-initialized Supabase project (`supabase/config.toml` exists)
with an empty `supabase/migrations/` directory. The agent creates migration
files within this structure.

**Expected skill files read:**

- `SKILL.md` (skill body with reference file index)
- `references/storage-access-control.md`
- `references/db-rls-mandatory.md`
- `references/db-rls-common-mistakes.md`
- `references/db-rls-performance.md`
- `references/db-schema-auth-fk.md`
- `references/db-schema-timestamps.md`
- `references/db-perf-indexes.md`
- `references/db-migrations-idempotent.md`

**Expected result:**

The agent creates a migration file that:

- Inserts avatars bucket into `storage.buckets` with `public = true`, MIME type restrictions, and file size limit
- Inserts documents bucket with `public = false`
- Creates RLS policies on `storage.objects` using `storage.foldername(name)` with `auth.uid()::text`
- Scopes upload policies `TO authenticated` and avatars SELECT policy `TO public`
- Creates `file_metadata` table with FK to `auth.users` with `ON DELETE CASCADE`
- Enables RLS on `file_metadata` with policies using `(select auth.uid())`
- Uses `timestamptz` for time columns, indexes `user_id`, and `IF NOT EXISTS` for idempotency

**Scorer:** Binary pass/fail (17 vitest assertions)

| Test | What it checks |
| --- | --- |
| migration file exists | A `.sql` file exists in `supabase/migrations/` |
| creates avatars bucket | SQL inserts into `storage.buckets` with id 'avatars' and `public = true` |
| creates documents bucket | SQL inserts into `storage.buckets` with id 'documents' and `public = false` |
| avatars bucket has mime type restriction | `allowed_mime_types` includes image types (jpeg, png, webp) |
| avatars bucket has file size limit | `file_size_limit` set (around 2MB / 2097152 bytes) |
| storage policy uses foldername or path for user isolation | Policy references `storage.foldername(name)` with `auth.uid()::text` |
| storage policy uses TO authenticated | Storage upload/delete policies scoped to `TO authenticated` |
| public read policy for avatars | A SELECT policy on storage.objects for avatars allows public/anon access |
| documents bucket is fully private | Policies for documents restrict all operations to authenticated owner |
| creates file_metadata table | SQL contains `CREATE TABLE` for file_metadata |
| file_metadata has FK to auth.users with CASCADE | `REFERENCES auth.users` with `ON DELETE CASCADE` |
| RLS enabled on file_metadata | `ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY` |
| file_metadata policies use (select auth.uid()) | Subselect form in policies |
| uses timestamptz for time columns | No plain `timestamp` in file_metadata |
| index on file_metadata user_id | `CREATE INDEX` on user_id column |
| idempotent DDL | Uses `IF NOT EXISTS` patterns |
| overall quality score | At least 11/15 best-practice signals present |
