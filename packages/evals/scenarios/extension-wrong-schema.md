# Scenario: extension-wrong-schema

## Summary

The agent must create a migration that enables the `pgvector` extension and
creates an `embeddings` table with a vector column and an HNSW index. The trap
is installing the extension in the `public` schema (the default) instead of
the `extensions` schema, and using IVFFlat without a `lists` parameter.

## Real-World Justification

Why this is a common and important workflow:

1. **Known schema pollution issue** — Installing extensions in `public` exposes
   extension functions and types through the PostgREST API, which can reveal
   internal details and cause "42501: permission denied" errors. The Supabase
   troubleshooting guide covers permission errors as a category.
   - Source: https://supabase.com/docs/guides/troubleshooting
2. **IVFFlat without lists = error** — The Supabase troubleshooting guide
   contains a dedicated entry: "Increase vector lookup speeds by applying an
   HNSW index" which warns against IVFFlat and notes its required `lists`
   parameter. Missing this causes a CREATE INDEX error.
   - Source: https://supabase.com/docs/guides/troubleshooting
3. **pgvector adoption** — Vector/AI embeddings are the fastest-growing
   Supabase use case. Nearly every AI-powered Supabase project starts with
   the pgvector extension setup. Getting the schema right from the start
   prevents later schema drift.
   - Source: https://supabase.com/docs/guides/database/extensions/pgvector

## Skill References Exercised

| Reference File | What It Teaches | What the Agent Should Apply |
|---|---|---|
| `references/db-schema-extensions.md` | Install extensions in `extensions` schema, not `public`; HNSW over IVFFlat; IVFFlat needs `lists` | `CREATE EXTENSION ... WITH SCHEMA extensions`; HNSW index |
| `references/db-rls-mandatory.md` | Enable RLS on all public tables | RLS on embeddings table |
| `references/db-migrations-idempotent.md` | IF NOT EXISTS for extensions and tables | `CREATE EXTENSION IF NOT EXISTS` |
| `references/db-schema-auth-fk.md` | FK to auth.users with CASCADE | User-linked embeddings |
| `references/db-rls-common-mistakes.md` | TO authenticated, subselect auth.uid() | Policy correctness |

## Workspace Setup

- Empty workspace with a pre-initialized `supabase/config.toml` (no migrations)

## Agent Task (PROMPT.md draft)

> I'm building a semantic search feature. Create a migration that:
> 1. Enables the pgvector extension
> 2. Creates a `documents` table with an `embedding` column (1536 dimensions
>    for OpenAI ada-002), a `content` text column, and a `user_id`
> 3. Adds a vector similarity search index
> 4. Users should only see their own documents
> Put the migration in `supabase/migrations/`.

## Evaluation Criteria

| # | Test Name | What It Checks | Quality Dimension |
|---|-----------|----------------|-------------------|
| 1 | migration file exists | At least one `.sql` file in `supabase/migrations/` | structure |
| 2 | extension in extensions schema | `WITH SCHEMA extensions` in the CREATE EXTENSION statement | correctness |
| 3 | IF NOT EXISTS on extension | `CREATE EXTENSION IF NOT EXISTS` | idempotency |
| 4 | vector column with correct dimensions | `vector(1536)` or `extensions.vector(1536)` in table | correctness |
| 5 | HNSW index used not IVFFlat | `USING hnsw` present in CREATE INDEX | correctness |
| 6 | RLS enabled | `ALTER TABLE documents ENABLE ROW LEVEL SECURITY` | security |
| 7 | FK to auth.users with CASCADE | `REFERENCES auth.users ... ON DELETE CASCADE` | correctness |
| 8 | policies TO authenticated | `TO authenticated` in policy definitions | security |
| 9 | idempotent table creation | `CREATE TABLE IF NOT EXISTS` | idempotency |

## Reasoning

1. **Baseline differentiator:** Agents without the skill write `CREATE
   EXTENSION vector;` (wrong schema), use IVFFlat (wrong index type for most
   cases), and skip the `lists` parameter requirement.
2. **Skill value:** `db-schema-extensions.md` explicitly shows the `WITH
   SCHEMA extensions` pattern and recommends HNSW over IVFFlat with the
   specific note about `lists` being required for IVFFlat.
3. **Testability:** Schema placement in the extension creation line and index
   type are directly checkable with regex.
4. **Realism:** pgvector + OpenAI embeddings is the top "AI + Supabase"
   tutorial path, and extension schema mistakes are a documented source of
   permission errors.

## Difficulty

**Rating:** MEDIUM

- Without skill: ~35% of assertions expected to pass (extension enabled but
  wrong schema, wrong index type, weak policies)
- With skill: ~90% of assertions expected to pass
- **pass_threshold:** 8
