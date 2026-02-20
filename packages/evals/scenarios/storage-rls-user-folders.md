# Scenario: storage-rls-user-folders

## Summary

The agent must create a SQL migration that sets up Supabase Storage buckets
with RLS policies for a user-content application. The migration must configure
an avatars bucket (public reads, authenticated uploads restricted to user
folders) and a documents bucket (fully private, user-isolated), with proper
file type restrictions, storage helper functions in policies, and a
file_metadata tracking table secured with RLS.

## Real-World Justification

Why this is a common and important workflow:

1. **Storage RLS is confusing and under-documented compared to table RLS** --
   Developers consistently struggle with the distinction between public/private
   buckets and the RLS policies needed on `storage.objects`. Multiple GitHub
   discussions show confusion about which SDK operations map to which SQL
   operations (INSERT, SELECT, UPDATE, DELETE).
   - Source: https://github.com/orgs/supabase/discussions/37611
   - Source: https://github.com/orgs/supabase/discussions/38700

2. **User-folder isolation is the canonical storage security pattern** -- The
   official Supabase docs demonstrate folder-based isolation using
   `storage.foldername(name)` and `auth.uid()::text`, but developers frequently
   get the casting or array indexing wrong.
   - Source: https://supabase.com/docs/guides/storage/security/access-control

3. **Missing file type restrictions leads to security vulnerabilities** --
   Without `allowed_mime_types` on the bucket or extension checks in RLS
   policies, users can upload executable files or oversized payloads. The
   Supabase security best practices guide calls this out as a common oversight.
   - Source: https://supaexplorer.com/guides/supabase-security-best-practices
   - Source: https://supabase.com/docs/guides/storage/buckets/fundamentals

## Skill References Exercised

Which reference files the agent should consult and what each teaches:

| Reference File | What It Teaches | What the Agent Should Apply |
|---|---|---|
| `references/storage-access-control.md` | Bucket visibility, RLS on storage.objects, storage helper functions, SDK-to-SQL operation mapping | User-folder policies using `storage.foldername()`, separate SELECT/INSERT policies |
| `references/db-rls-mandatory.md` | RLS must be enabled on all public tables | Enable RLS on the file_metadata tracking table |
| `references/db-rls-common-mistakes.md` | Missing TO clause, missing SELECT policy for UPDATE | Use `TO authenticated` (or `TO public` for public reads), include SELECT policy |
| `references/db-rls-performance.md` | Wrap auth.uid() in SELECT subquery | Use `(select auth.uid())` in both storage and table policies |
| `references/db-schema-auth-fk.md` | FK to auth.users with ON DELETE CASCADE | file_metadata.user_id references auth.users with cascade |
| `references/db-schema-timestamps.md` | Use timestamptz not timestamp | Time columns on file_metadata use timestamptz |
| `references/db-perf-indexes.md` | Index columns used in policy lookups | Index user_id on file_metadata |
| `references/db-migrations-idempotent.md` | IF NOT EXISTS for safe reruns | Idempotent DDL throughout |

## Workspace Setup

What the workspace starts with before the agent runs:

- Pre-initialized Supabase project (`supabase/config.toml` exists)
- Empty `supabase/migrations/` directory
- The agent creates migration files within this structure

## Agent Task (PROMPT.md draft)

The prompt to give the agent. Written as a developer would ask it:

> I need to set up file storage for my app. There are two use cases:
>
> 1. **Avatars** -- Users upload a profile picture. Anyone can view avatars but
>    only the owning user can upload or replace their own. Only allow image
>    files (JPEG, PNG, WebP). Max 2MB.
>
> 2. **Documents** -- Users upload private documents that only they can access.
>    Max 50MB. No file type restriction.
>
> Create a SQL migration that:
> - Configures both storage buckets
> - Adds RLS policies on `storage.objects` so each user can only access their
>   own folder (folder name = user ID)
> - Creates a `file_metadata` table to track uploaded files (file name, bucket,
>   size, user reference) with appropriate security
>
> Users are authenticated via Supabase Auth.

## Evaluation Criteria

What vitest should assert on the agent's output. Each assertion tests a
specific quality signal:

| # | Test Name | What It Checks | Quality Dimension |
|---|-----------|----------------|-------------------|
| 1 | migration file exists | A `.sql` file exists in `supabase/migrations/` | structure |
| 2 | creates avatars bucket | SQL inserts into `storage.buckets` with id 'avatars' and `public = true` | correctness |
| 3 | creates documents bucket | SQL inserts into `storage.buckets` with id 'documents' and `public = false` | correctness |
| 4 | avatars bucket has mime type restriction | `allowed_mime_types` includes image types (jpeg, png, webp) | security |
| 5 | avatars bucket has file size limit | `file_size_limit` set (around 2MB / 2097152 bytes) | security |
| 6 | storage policy uses foldername or path for user isolation | Policy references `storage.foldername(name)` with `auth.uid()::text` | security |
| 7 | storage policy uses TO authenticated | Storage upload/delete policies scoped to `TO authenticated` | security |
| 8 | public read policy for avatars | A SELECT policy on storage.objects for avatars bucket allows public/anon access | correctness |
| 9 | documents bucket is fully private | Policies for documents bucket restrict all operations to authenticated owner | security |
| 10 | creates file_metadata table | SQL contains `CREATE TABLE` for file_metadata | correctness |
| 11 | file_metadata has FK to auth.users with CASCADE | `REFERENCES auth.users` with `ON DELETE CASCADE` | correctness |
| 12 | RLS enabled on file_metadata | `ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY` | security |
| 13 | file_metadata policies use (select auth.uid()) | Subselect form in policies | performance |
| 14 | uses timestamptz for time columns | No plain `timestamp` in file_metadata | correctness |
| 15 | index on file_metadata user_id | `CREATE INDEX` on user_id column | performance |
| 16 | idempotent DDL | Uses `IF NOT EXISTS` patterns | idempotency |
| 17 | overall quality score | At least 11/15 best-practice signals present | overall |

## Reasoning

Step-by-step reasoning for why this scenario is well-designed:

1. **Baseline differentiator:** An agent without the skill would likely: (a)
   confuse public bucket visibility with unrestricted upload access, (b) write
   storage policies without using `storage.foldername()` or get the array
   indexing wrong, (c) forget to set `allowed_mime_types` on the bucket itself,
   (d) omit the `TO authenticated` clause on storage policies, (e) use bare
   `auth.uid()` instead of the subselect form, (f) skip the `::text` cast when
   comparing auth.uid() to folder names. These are all Supabase-specific
   patterns that require reading the skill references.

2. **Skill value:** The storage-access-control reference explicitly documents:
   the public vs private bucket distinction, the `storage.foldername()` helper
   function pattern, the SDK-to-SQL operation mapping, and bucket configuration
   with mime types and size limits. Combined with the database security
   references (RLS mandatory, common mistakes, performance), this scenario
   exercises 8 reference files.

3. **Testability:** Bucket configuration (INSERT INTO storage.buckets), storage
   helper function usage (storage.foldername), policy clauses (TO
   authenticated, TO public), mime types, file size limits, and all table-level
   patterns (RLS, FK, indexes, timestamptz) are reliably detectable via regex
   on SQL text.

4. **Realism:** Nearly every Supabase application that handles user-generated
   content needs avatar uploads and document storage. This is a day-one task
   for any SaaS product. The GitHub discussions linked above show dozens of
   developers hitting exactly these issues when setting up storage for the
   first time.

## Difficulty

**Rating:** MEDIUM

- Without skill: ~30-45% of assertions expected to pass
- With skill: ~85-95% of assertions expected to pass