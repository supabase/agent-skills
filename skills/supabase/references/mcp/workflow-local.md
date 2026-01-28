---
title: Local MCP Development Workflow
impact: CRITICAL
impactDescription: Correct local workflow prevents migration clutter and sync issues
tags: mcp, local, development, workflow, execute-sql
---

## Local MCP Development Workflow

When using MCP with local Supabase (`supabase start`), use `execute_sql` during iteration to avoid cluttering migration history. Only generate migration files with the CLI when changes are finalized. This keeps migration history clean and avoids multiple small migrations for iterative changes.

**Incorrect:**

```sql
-- Via apply_migration MCP tool
-- Creates migration for every small change during iteration
CREATE TABLE posts (title text);
-- Later: apply_migration for adding content column
-- Later: apply_migration for renaming column
-- Results in 3+ migration files for one table
```

Using `apply_migration` during iteration creates unnecessary migration files that clutter history.

**Correct:**

```sql
-- Via execute_sql MCP tool during iteration
CREATE TABLE posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text,
  created_at timestamptz DEFAULT now()
);
-- Iterate and adjust schema as needed
-- When satisfied, generate migration with CLI:
-- supabase db diff -f "create_posts"
```

Use `execute_sql` for iteration, then generate single migration file when done.

## Local Workflow Steps

1. Start local: `supabase start`
2. Iterate with `execute_sql` MCP tool
3. Review changes: `supabase db diff`
4. Generate migration: `supabase db diff -f "migration_name"`
5. Generate types: `supabase gen types typescript --local > types.ts`

## Related

- [workflow-hosted.md](workflow-hosted.md) - Hosted workflow
- [db-execute-vs-migrate.md](db-execute-vs-migrate.md) - Tool selection
- [workflow-migration-sync.md](workflow-migration-sync.md) - Sync patterns
